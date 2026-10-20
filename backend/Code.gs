// PROTOTIPO HISTÓRICO: NO CORRESPONDE AL SERVICIO ACTIVO. Véase backend/README.md.
const FOLDER_ID = '1rQohvZ-n-ZqSDYFWYkgJa3CMYLFz-aXT';
const EXAM_ID = '2023-N01';
const ANSWERS = 'C B B B A B A C A B A A A B C B C B B C A A B B A A B B C C C B A C C'.split(' ');

// Ejecutar una vez desde el editor. La hoja permanece privada.
function configurar() {
  const props = PropertiesService.getScriptProperties();
  let id = props.getProperty('RESULTS_ID');
  if (!id) {
    const book = SpreadsheetApp.create('Aula abierta - Resultados');
    const sheet = book.getSheets()[0];
    sheet.setName('Intentos');
    sheet.appendRow(['Intento', 'Fecha', 'Prueba', 'Nombre', 'Sección', 'Correo', 'Aciertos', 'Incorrectas', 'Sin responder', 'Porcentaje', 'Respuestas']);
    sheet.setFrozenRows(1);
    id = book.getId();
    props.setProperty('RESULTS_ID', id);
  }
  DriveApp.getFolderById(FOLDER_ID).getName();
  console.log('Resultados privados: https://docs.google.com/spreadsheets/d/' + id + '/edit');
}

function json_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

// Solo publica enlaces a PDF que ya sean accesibles a cualquier persona.
// No cambia permisos ni muestra archivos privados de la carpeta.
function doGet() {
  try {
    const materials = [];
    const files = DriveApp.getFolderById(FOLDER_ID).getFilesByType('application/pdf');
    while (files.hasNext() && materials.length < 100) {
      const file = files.next();
      const access = file.getSharingAccess();
      if (access === DriveApp.Access.ANYONE || access === DriveApp.Access.ANYONE_WITH_LINK) {
        materials.push({ name: file.getName(), url: file.getUrl() });
      }
    }
    return json_({ ok: true, ready: !!PropertiesService.getScriptProperties().getProperty('RESULTS_ID'), materials: materials });
  } catch (err) {
    return json_({ ok: false, error: 'El servicio todavía no está configurado.' });
  }
}

function validate_(data) {
  if (!data || data.exam !== EXAM_ID || !/^[a-zA-Z0-9-]{16,80}$/.test(data.id || '')) throw new Error('Intento no válido.');
  if (!Array.isArray(data.answers) || data.answers.length !== ANSWERS.length || data.answers.some(a => a !== null && !['A','B','C'].includes(a))) throw new Error('Respuestas no válidas.');
  if (typeof data.name !== 'string' || !data.name.trim() || data.name.length > 120) throw new Error('Escribe tu nombre (máximo 120 caracteres).');
  if (typeof data.section !== 'string' || !data.section.trim() || data.section.length > 40) throw new Error('Escribe tu sección (máximo 40 caracteres).');
  if (typeof data.email !== 'string' || data.email.length > 160 || (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))) throw new Error('Correo no válido.');
  if (data.consent !== true) throw new Error('Debes aceptar el envío al docente.');
  return data;
}

function cell_(value) {
  const text = String(value).trim();
  return /^[=+@\-\t\r]/.test(text) ? "'" + text : text;
}

function doPost(e) {
  let lock;
  try {
    if (!e || !e.postData || e.postData.contents.length > 5000) throw new Error('Solicitud no válida.');
    const data = validate_(JSON.parse(e.postData.contents));
    const id = PropertiesService.getScriptProperties().getProperty('RESULTS_ID');
    if (!id) throw new Error('El registro del docente aún no está activado.');
    lock = LockService.getScriptLock();
    if (!lock.tryLock(10000)) throw new Error('Servicio ocupado; intenta de nuevo.');
    const sheet = SpreadsheetApp.openById(id).getSheetByName('Intentos');
    const correct = data.answers.filter((a, i) => a === ANSWERS[i]).length;
    const blank = data.answers.filter(a => a === null).length;
    const receipt = { ok: true, id: data.id, correct: correct, total: ANSWERS.length };
    const last = sheet.getLastRow();
    if (last > 1) {
      const match = sheet.getRange(2, 1, last - 1, 1).createTextFinder(data.id).matchEntireCell(true).findNext();
      if (match) {
        const row = sheet.getRange(match.getRow(), 1, 1, 11).getValues()[0];
        if (row[10] !== JSON.stringify(data.answers) || row[3] !== cell_(data.name) || row[4] !== cell_(data.section) || row[5] !== cell_(data.email)) throw new Error('El identificador ya pertenece a otro intento.');
        return json_(receipt);
      }
    }
    // Límite global para proteger la cuota gratuita frente a envíos masivos.
    const props = PropertiesService.getScriptProperties();
    const day = Utilities.formatDate(new Date(), 'America/Costa_Rica', 'yyyy-MM-dd');
    const count = props.getProperty('DAY') === day ? Number(props.getProperty('COUNT') || 0) : 0;
    if (count >= 1000) throw new Error('Se alcanzó el límite diario de envíos; conserva tu CSV e intenta mañana.');
    sheet.appendRow([data.id, new Date(), EXAM_ID, cell_(data.name), cell_(data.section), cell_(data.email), correct, ANSWERS.length - correct - blank, blank, correct / ANSWERS.length * 100, JSON.stringify(data.answers)]);
    props.setProperties({ DAY: day, COUNT: String(count + 1) });
    return json_(receipt);
  } catch (err) {
    return json_({ ok: false, error: String(err.message || 'No se pudo registrar el intento.').slice(0, 200) });
  } finally {
    if (lock && lock.hasLock()) lock.releaseLock();
  }
}
