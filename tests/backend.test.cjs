const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const code = fs.readFileSync(__dirname + '/../backend/Code.gs', 'utf8');
function setup() {
 const rows=[Array(11).fill('header')], props={RESULTS_ID:'private-sheet'};
 const sheet={getLastRow:()=>rows.length,appendRow:r=>rows.push(r),getRange:(r,c,n,w)=>({getValues:()=>rows.slice(r-1,r-1+n).map(row=>row.slice(c-1,c-1+w)),createTextFinder:id=>({matchEntireCell(){return this},findNext(){const i=rows.findIndex(row=>row[0]===id);return i<0?null:{getRow:()=>i+1}}})})};
 const files=[{name:'private.pdf',access:'PRIVATE'},{name:'public.pdf',access:'ANYONE_WITH_LINK'}];
 const context=vm.createContext({console,PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k],setProperties:o=>Object.assign(props,o)})},SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet})},LockService:{getScriptLock:()=>({tryLock:()=>true,hasLock:()=>true,releaseLock(){}})},Utilities:{formatDate:()=> '2026-10-18'},ContentService:{MimeType:{JSON:'json'},createTextOutput:txt=>({setMimeType:()=>JSON.parse(txt)})},DriveApp:{Access:{ANYONE:'ANYONE',ANYONE_WITH_LINK:'ANYONE_WITH_LINK'},getFolderById:()=>({getFilesByType:()=>{let i=0;return {hasNext:()=>i<files.length,next:()=>{const f=files[i++];return {getSharingAccess:()=>f.access,getName:()=>f.name,getUrl:()=> 'https://drive.google.com/file/d/example/view'}}}}})}});
 vm.runInContext(code,context);
 const data={id:'test-attempt-00000001',exam:'2023-N01',name:'Prueba técnica',section:'Prueba',email:'',consent:true,answers:Array(35).fill(null)};
 const post=d=>context.doPost({postData:{contents:JSON.stringify(d)}});
 return {rows,props,context,data,post};
}
test('califica en servidor: correctas, incorrectas y vacías',()=>{const s=setup();s.data.answers[0]='C';s.data.answers[1]='A';const r=s.post(s.data);assert.equal(r.ok,true);assert.equal(r.correct,1);assert.equal(s.rows[1][7],1);assert.equal(s.rows[1][8],33)});
test('rechaza datos incompletos y falta de consentimiento',()=>{const s=setup();assert.equal(s.post({...s.data,answers:['A']}).ok,false);assert.equal(s.post({...s.data,consent:false}).ok,false);assert.equal(s.post({...s.data,email:'bad email'}).ok,false);assert.equal(s.rows.length,1)});
test('no duplica reintentos y rechaza reutilización con respuestas diferentes',()=>{const s=setup();assert.equal(s.post(s.data).ok,true);assert.equal(s.post(s.data).ok,true);assert.equal(s.rows.length,2);s.data.answers[0]='A';assert.equal(s.post(s.data).ok,false);assert.equal(s.rows.length,2)});
test('el catálogo no expone PDF privados ni resultados',()=>{const s=setup();const r=s.context.doGet();assert.equal(r.materials.length,1);assert.equal(r.materials[0].name,'public.pdf');assert.equal(JSON.stringify(r).includes('private-sheet'),false)});
test('neutraliza fórmulas y limita envíos diarios',()=>{const s=setup();assert.equal(s.context.cell_('=IMPORTXML(1)'),"'=IMPORTXML(1)");s.props.DAY='2026-10-18';s.props.COUNT='1000';assert.equal(s.post(s.data).ok,false);assert.equal(s.rows.length,1)});
test('clave local y servidor coinciden en los 35 ítems',()=>{const app=fs.readFileSync(__dirname+'/../app.js','utf8');const local=app.match(/const key='([^']+)'/)[1];assert.equal(local,code.match(/const ANSWERS = '([^']+)'/)[1]);assert.equal(local.split(' ').length,35)});
