const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
function setup(){
 const nodes={},submitted=[];
 const el=id=>nodes[id] ||= {value:'',checked:false,hidden:false,textContent:'',reset(){},scrollIntoView(){},close(){},showModal(){},reportValidity:()=>true};
 const state={answers:Array(35).fill('C'),done:true,attemptId:'12345678-1234-4234-9234-123456789abc',student:{id:'000000000',name:'PRUEBA',surname:'TECNICA',section:'',email:'',consent:true}};
 const ctx=vm.createContext({state,window:{AULA_CONFIG:{serviceUrl:'https://script.google.com/macros/s/test/exec'}},crypto:{randomUUID:()=> '87654321-1234-4234-9234-123456789abc'},document:{getElementById:el,body:{append(){}},createElement:type=>({append(v){this.child=v},submit(){submitted.push(JSON.parse(this.child.value))},remove(){},click(){}})},save(){},openExam(){ctx.opened=true},result(){ctx.results=true},key:Array(35).fill('C'),setTimeout(){}});
 vm.runInContext(fs.readFileSync(__dirname+'/../enhancements.js','utf8'),ctx);
 return {ctx,el,submitted};
}
test('env�a el contrato actual sin incluir correo ni secci�n',()=>{const s=setup();s.el('send-result').onclick();assert.equal(s.submitted.length,1);assert.equal(s.submitted[0].exam,'matematicas-2023-n01');assert.equal(s.submitted[0].id,'000000000');assert.equal(s.submitted[0].answers.length,35);assert.equal('email' in s.submitted[0],false);assert.equal(s.ctx.state.sent,undefined)});
test('reintentar mantiene el identificador y no afirma recepci�n',()=>{const s=setup();s.el('send-result').onclick();s.el('send-result').onclick();assert.deepEqual(s.submitted[0],s.submitted[1]);assert.match(s.el('submission').textContent,/Solo �Entrega guardada� confirma/)});
test('sin consentimiento no transmite datos',()=>{const s=setup();s.ctx.state.student.consent=false;s.el('send-result').onclick();assert.equal(s.submitted.length,0);assert.equal(s.el('intro').hidden,false)});
test('no acepta campos de identidad con espacios �nicamente',()=>{const s=setup();s.el('student-name').value='   ';s.el('start').onclick();assert.equal(s.ctx.opened,undefined);assert.match(s.el('connection-status').textContent,/espacios/)});
test('corregir consentimiento vuelve al resultado y un nuevo intento limpia el estado',()=>{const s=setup();s.ctx.state.student.consent=false;s.el('send-result').onclick();s.el('consent').checked=true;s.el('start').onclick();assert.equal(s.ctx.results,true);s.el('confirm-reset').onclick();assert.equal(s.ctx.state.done,false);assert.equal(s.ctx.state.student,undefined);assert.equal(s.el('send-result').textContent,'Enviar al docente')});

