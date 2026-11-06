const EXAMS_ = [
 {id:'matematicas-2023-n01',title:'Matemáticas 2023 · N.º 1',level:'Educación Abierta',key:'C B B B A B A C A B A A A B C B C B B C A A B B A A B B C C C B A C C'.split(' ')},
 {id:'geometria-7',title:'Geometría · 7.º',level:'Séptimo',key:'B C C A C C C B A C B A A A B B B B A C C A B A'.split(' ')}
];
function props_(){return PropertiesService.getScriptProperties();}
function digest_(s){return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,s));}
function hmac_(s,k){return Utilities.computeHmacSha256Signature(s,k);}
function derive_(password,salt,pepper){
 let key=Utilities.base64Encode(hmac_(password,pepper));
 let u=hmac_(salt+'\x00\x00\x00\x01',key),out=u.slice();
 for(let n=1;n<20000;n++){u=Utilities.computeHmacSha256Signature(u,Utilities.newBlob(key).getBytes());for(let j=0;j<out.length;j++)out[j]^=u[j];}
 return Utilities.base64Encode(out);
}
// Run only from editor. Set INITIAL_PASSWORD and SPREADSHEET_ID in Script Properties first.
function instalar_(){
 const p=props_(),password=p.getProperty('INITIAL_PASSWORD');
 if(!password||password.length<14)throw Error('Establezca INITIAL_PASSWORD de al menos 14 caracteres en las propiedades del proyecto.');
 if(!p.getProperty('SPREADSHEET_ID'))throw Error('Falta SPREADSHEET_ID.');
 const salt=Utilities.getUuid(),pepper=Utilities.getUuid()+Utilities.getUuid();
 p.setProperties({AUTH_SALT:salt,AUTH_PEPPER:pepper,AUTH_HASH:derive_(password,salt,pepper),AUTH_VERSION:Utilities.getUuid()});
 p.deleteProperty('INITIAL_PASSWORD');p.deleteProperty('LOGIN_LIMIT');
 EXAMS_.forEach(x=>{if(!p.getProperty('EXAM_'+x.id))p.setProperty('EXAM_'+x.id,JSON.stringify({mode:'disabled',start:'',end:''}));});
 const ss=book_();if(!ss.getSheetByName('Resultados'))ss.insertSheet('Resultados').appendRow(['Intento','Fecha de entrega','Prueba','Cédula','Nombre','Apellidos','Aciertos','Total preguntas','Nota sobre 100','Sin responder','Respuestas','Versión de clave','Huella de entrega']);
}
function book_(){return SpreadsheetApp.openById(props_().getProperty('SPREADSHEET_ID'));}
function lock_(fn){const l=LockService.getScriptLock();l.waitLock(30000);try{return fn();}finally{l.releaseLock();}}
function doGet(e){if(e&&e.parameter.action==='status')return json_(publicStatus());return HtmlService.createHtmlOutputFromFile('Admin').setTitle('Aula Abierta · Administración').addMetaTag('viewport','width=device-width, initial-scale=1');}
function json_(v){return ContentService.createTextOutput(JSON.stringify(v)).setMimeType(ContentService.MimeType.JSON);}
function login(password){return lock_(()=>{
 const p=props_();if(!p.getProperty('AUTH_HASH'))throw Error('Pendiente de instalación por el propietario.');
 let limit=JSON.parse(p.getProperty('LOGIN_LIMIT')||'{"n":0,"until":0}');
 if(Date.now()<limit.until&&limit.n>=5)throw Error('Demasiados intentos. Espere 15 minutos.');
 if(Date.now()>limit.until)limit={n:0,until:Date.now()+900000};
 if(typeof password!=='string'||password.length>256||derive_(password,p.getProperty('AUTH_SALT'),p.getProperty('AUTH_PEPPER'))!==p.getProperty('AUTH_HASH')){
  limit.n++;p.setProperty('LOGIN_LIMIT',JSON.stringify(limit));throw Error('Clave incorrecta.');
 }
 p.deleteProperty('LOGIN_LIMIT');const token=Utilities.getUuid()+Utilities.getUuid();
 CacheService.getScriptCache().put('SESSION_'+digest_(token),p.getProperty('AUTH_VERSION'),3600);return token;
});}
function auth_(token){if(!props_().getProperty('AUTH_VERSION')||typeof token!=='string'||!token||CacheService.getScriptCache().get('SESSION_'+digest_(token))!==props_().getProperty('AUTH_VERSION'))throw Error('Sesión vencida. Ingrese nuevamente.');}
function logout(token){auth_(token);CacheService.getScriptCache().remove('SESSION_'+digest_(token));}
function config_(id){return JSON.parse(props_().getProperty('EXAM_'+id)||'{"mode":"disabled","start":"","end":""}');}
function open_(c){const now=Date.now();return c.mode==='enabled'||(c.mode==='scheduled'&&now>=Date.parse(c.start)&&now<Date.parse(c.end));}
function publicStatus(){return EXAMS_.map(x=>({id:x.id,title:x.title,level:x.level,enabled:open_(config_(x.id))}));}
function dashboard(token){auth_(token);return EXAMS_.map(x=>Object.assign({id:x.id,title:x.title,level:x.level,enabled:open_(config_(x.id))},config_(x.id)));}
function saveExam(token,id,c){auth_(token);if(!EXAMS_.some(x=>x.id===id)||!c||!['enabled','disabled','scheduled'].includes(c.mode))throw Error('Configuración inválida.');
 if(c.mode==='scheduled'&&(!Number.isFinite(Date.parse(c.start))||!Number.isFinite(Date.parse(c.end))||Date.parse(c.end)<=Date.parse(c.start)))throw Error('Revise las fechas de apertura y cierre.');
 return lock_(()=>{props_().setProperty('EXAM_'+id,JSON.stringify({mode:c.mode,start:c.mode==='scheduled'?new Date(c.start).toISOString():'',end:c.mode==='scheduled'?new Date(c.end).toISOString():''}));return dashboard(token);});}
function results(token,id){auth_(token);const exam=EXAMS_.find(x=>x.id===id);if(!exam)throw Error('Prueba desconocida.');
 const sheet=book_().getSheetByName('Resultados');const data=sheet&&sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,13).getValues():[];
 const rows=data.filter(r=>r[2]===id).map(r=>({attempt:String(r[0]),date:r[1] instanceof Date?r[1].toISOString():String(r[1]),id:String(r[3]),name:[r[4],r[5]].filter(Boolean).join(' '),correct:Number(r[6]),total:Number(r[7]),score:Number(r[8]),blank:Number(r[9])}));
 const scores=rows.map(r=>r.score).filter(Number.isFinite),hist=[0,0,0,0,0];scores.forEach(n=>hist[Math.min(4,Math.max(0,Math.floor(n/20)))]++);
 return {rows,stats:{attempts:rows.length,average:scores.length?scores.reduce((a,b)=>a+b,0)/scores.length:null,min:scores.length?Math.min(...scores):null,max:scores.length?Math.max(...scores):null,hist}};
}
function doPost(e){try{const raw=e&&e.parameter&&e.parameter.payload;if(!raw||raw.length>20000)throw Error('Entrega inválida.');const receipt=submit_(JSON.parse(raw));return HtmlService.createHtmlOutput('<h1>Entrega guardada</h1><p>Nota: '+receipt.score+' / 100</p><p>Puede cerrar esta ventana.</p>');}catch(err){return HtmlService.createHtmlOutput('<h1>No se guardó la entrega</h1><p>'+escape_(err.message)+'</p>');}}
function escape_(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function cell_(s){s=String(s||'').trim().slice(0,150);return /^[=+@\-]/.test(s)?"'"+s:s;}
function submit_(d){const exam=EXAMS_.find(x=>x.id===d.exam);if(!exam||!/^[-\w]{16,100}$/.test(d.attempt||'')||!String(d.name||'').trim()||!Array.isArray(d.answers)||d.answers.length!==exam.key.length||d.answers.some(x=>x!==null&&!['A','B','C'].includes(x)))throw Error('Datos incompletos o respuestas inválidas.');
 return lock_(()=>{const sheet=book_().getSheetByName('Resultados');const hash=digest_(JSON.stringify([d.exam,d.id||'',d.name,d.surname||'',d.answers]));
 const found=sheet.getLastRow()>1?sheet.getRange(2,1,sheet.getLastRow()-1,1).createTextFinder(d.attempt).matchEntireCell(true).findNext():null;
 if(found){const old=sheet.getRange(found.getRow(),1,1,13).getValues()[0];if(old[12]!==hash)throw Error('Este intento ya fue entregado con otros datos.');return {score:Number(old[8])};}
 if(!open_(config_(d.exam)))throw Error('La prueba está deshabilitada o fuera del período de aplicación.');
 const correct=d.answers.filter((a,i)=>a===exam.key[i]).length,score=Math.round(100*correct/exam.key.length);
 sheet.appendRow([d.attempt,new Date(),d.exam,cell_(d.id),cell_(d.name),cell_(d.surname),correct,exam.key.length,score,d.answers.filter(x=>x===null).length,JSON.stringify(d.answers),'2026-11-v2',hash]);return {score};
 });}
