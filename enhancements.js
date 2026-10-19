'use strict';
const serviceUrl = window.AULA_CONFIG?.serviceUrl || '';
let serviceReady = false, sending = false;
const el = id => document.getElementById(id);
const uid = () => crypto.randomUUID();

function safeCell(value) {
  let text = String(value ?? '');
  if (/^[\s]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

function identity() {
  return { name: el('student-name').value.trim(), section: el('student-section').value.trim(), email: el('student-email').value.trim(), consent: el('consent').checked };
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

el('send-result').onclick = async () => {
  if (sending || !serviceReady || !state.done || state.sent) return;
  if (!state.student?.name || !state.student?.section || !state.student?.consent) {
    el('submission').textContent = 'Para enviar este intento, completa nombre y sección y acepta el envío en el formulario de inicio.';
    el('intro').hidden = false;
    el('intro').scrollIntoView({ behavior: 'smooth' });
    el('start').textContent = 'Guardar mis datos y volver al intento →';
    return;
  }
  state.attemptId ||= uid(); save();
  sending = true; el('reset').disabled = true; showSubmission(); el('submission').textContent = 'Enviando al docente…';
  try {
    const response = await fetch(serviceUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ id: state.attemptId, exam: '2023-N01', answers: state.answers, ...state.student }), signal: AbortSignal.timeout(30000) });
    if (!response.ok) throw new Error('El servicio no respondió correctamente.');
    const receipt = await response.json();
    if (!receipt.ok || receipt.id !== state.attemptId || receipt.total !== 35) throw new Error(receipt.error || 'No se recibió la confirmación.');
    state.sent = true; save(); showSubmission();
  } catch (error) {
    el('submission').textContent = 'No se confirmó el envío. Tus respuestas se conservan; puedes reintentar sin duplicar el registro o descargar el CSV. ' + (error.name === 'TimeoutError' ? '' : error.message);
  } finally { sending = false; el('reset').disabled = false; el('send-result').disabled = false; }
};

el('download').onclick = () => {
  const student = state.student || {};
  const rows = [['Prueba','Nombre','Sección','Correo','Pregunta','Respuesta','Respuesta esperada','Resultado'], ...state.answers.map((a,i) => ['2023-N01', student.name, student.section, student.email, i+1, a || '', key[i], a === key[i] ? 'Correcta' : a ? 'Incorrecta' : 'Sin responder'])];
  const url = URL.createObjectURL(new Blob(['\ufeff' + rows.map(row => row.map(safeCell).join(',')).join('\r\n')], {type:'text/csv;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = 'resultado-matematicas-2023.csv'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

el('page').onerror = () => { el('page-error').hidden = false; };
el('page').onload = () => { el('page-error').hidden = true; };

async function connectService() {
  if (!serviceUrl) return;
  el('connection-status').textContent = 'Comprobando conexión con el registro del docente…';
  try {
    const response = await fetch(serviceUrl, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error();
    const data = await response.json();
    if (!data.ok) throw new Error();
    serviceReady = data.ready === true;
    el('connection-status').textContent = serviceReady ? 'Registro del docente disponible. Al finalizar podrás enviar tu intento.' : 'El registro del docente está pendiente de activación.';
    el('consent-label').hidden = !serviceReady;
    const list = el('materials-list'); list.replaceChildren();
    for (const item of (Array.isArray(data.materials) ? data.materials : [])) {
      let url;
      try { url = new URL(item.url); } catch { continue; }
      if (url.protocol !== 'https:' || url.hostname !== 'drive.google.com') continue;
      const li = document.createElement('li'), a = document.createElement('a');
      a.textContent = item.name; a.href = url.href; a.target = '_blank'; a.rel = 'noopener'; li.append(a); list.append(li);
    }
    el('materials-status').textContent = list.children.length ? 'Materiales compartidos por el docente. La lista se actualiza al abrir la página.' : 'No hay nuevos PDF públicos disponibles en la carpeta.';
  } catch {
    el('connection-status').textContent = 'No hay conexión con el registro del docente. Puedes practicar y descargar el resultado.';
  }
  if (state.done) showSubmission();
}
connectService();
