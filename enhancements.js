'use strict';
const serviceUrl = window.AULA_CONFIG?.serviceUrl || '';
let serviceReady = !!serviceUrl, sending = false;
const el = id => document.getElementById(id);
const uid = () => crypto.randomUUID();

function safeCell(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

function identity() {
  return { id: el('student-id').value.trim(), surname: el('student-surname').value.trim(), name: el('student-name').value.trim(), section: el('student-section').value.trim(), email: el('student-email').value.trim(), consent: el('consent').checked };
}

function showSubmission() {
  el('send-result').hidden = !serviceReady || !state.done || state.sent === true;
  el('send-result').disabled = sending;
  el('submission').textContent = state.sent ? '✓ El docente recibió este intento.' : serviceReady ? 'Tu resultado aún no se ha enviado al docente.' : 'Resultado guardado en este navegador. El registro del docente está pendiente de activación; puedes descargar tu resultado.';
}

const originalResult = result;
result = function () { originalResult(); showSubmission(); };
el('finish').onclick = () => {
  if (state.done) return result();
  el('confirm-text').textContent = `Quedan ${35 - state.answers.filter(Boolean).length} preguntas sin responder. ¿Finalizar el intento?`;
  el('confirm').hidden = false;
};
el('confirm-finish').onclick = () => result();

el('start').onclick = () => {
  if (!el('student-form').reportValidity()) return;
  if (!state.sent) state.student = identity();
  state.attemptId ||= uid();
  save();
  openExam();
};
if (state.student) {
  el('student-id').value = state.student.id || '';
  el('student-surname').value = state.student.surname || '';
  el('student-name').value = state.student.name || '';
  el('student-section').value = state.student.section || '';
  el('student-email').value = state.student.email || '';
  el('consent').checked = !!state.student.consent;
}
el('student-form').onsubmit = event => { event.preventDefault(); el('start').click(); };
el('reset').onclick = () => { el('reset-dialog').showModal(); };
el('cancel-reset').onclick = () => el('reset-dialog').close();
el('confirm-reset').onclick = () => {
  state = { answers: Array(35).fill(null), index: 0, done: false };
  save();
  el('student-form').reset();
  el('exam').hidden = true; el('results').hidden = true; el('intro').hidden = false;
  el('start').textContent = 'Comenzar práctica →';
  el('reset-dialog').close();
  el('intro').scrollIntoView({ behavior: 'smooth' });
};

el('send-result').onclick = () => {
  if (!serviceReady || !state.done) return;
  if (!state.student?.id || !state.student?.name || !state.student?.surname || !state.student?.consent) {
    el('submission').textContent = 'Completa cédula, nombre y apellidos y acepta el envío en el formulario de inicio.';
    el('intro').hidden = false; el('intro').scrollIntoView({behavior:'smooth'}); return;
  }
  state.attemptId ||= uid(); save();
  const form = document.createElement('form');
  form.method = 'POST'; form.action = serviceUrl; form.target = '_blank'; form.rel = 'noopener noreferrer';
  const payload = document.createElement('input'); payload.type = 'hidden'; payload.name = 'payload';
  payload.value = JSON.stringify({attempt:state.attemptId,exam:'matematicas-2023-n01',id:state.student.id,name:state.student.name,surname:state.student.surname,answers:state.answers});
  form.append(payload); document.body.append(form); form.submit(); form.remove();
  el('submission').textContent = 'Revisa la pestaña del comprobante. Solo «Entrega guardada» confirma que el docente recibió tu resultado. Si no aparece, puedes reintentar este mismo envío sin duplicarlo.';
  el('send-result').textContent = 'Volver a abrir el comprobante';
};

el('download').onclick = () => {
  const student = state.student || {};
  const rows = [['Prueba','Cédula','Nombre','Apellidos','Sección','Correo','Pregunta','Respuesta','Respuesta esperada','Resultado'], ...state.answers.map((a,i) => ['2023-N01', student.id, student.name, student.surname, student.section, student.email, i+1, a || '', key[i], a === key[i] ? 'Correcta' : a ? 'Incorrecta' : 'Sin responder'])];
  const url = URL.createObjectURL(new Blob(['\ufeff' + rows.map(row => row.map(safeCell).join(',')).join('\r\n')], {type:'text/csv;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = 'resultado-matematicas-2023.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

el('page').onerror = () => { el('page-error').hidden = false; };
el('page').onload = () => { el('page-error').hidden = true; };

if (state.done) showSubmission();
