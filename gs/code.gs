// CAMBIA ESTA CLAVE: es la contraseña de tu panel de dueño
const PIN = "1234";
const HOJA = "Citas";

function hoja() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(HOJA);
  if (!s) {
    s = ss.insertSheet(HOJA);
    s.appendRow(["Registro","Fecha","Hora","Nombre","Celular","Servicios","Estilo","Total","Estado"]);
    s.getRange("A:I").setNumberFormat("@");
    s.setFrozenRows(1);
  }
  return s;
}
function norm(v, f) { return v instanceof Date ? Utilities.formatDate(v, Session.getScriptTimeZone(), f) : String(v); }
function filas() {
  const v = hoja().getDataRange().getValues();
  return v.slice(1).map((r, i) => ({ fila: i + 2, fecha: norm(r[1], "yyyy-MM-dd"), hora: norm(r[2], "HH:mm"),
    nombre: r[3], cel: String(r[4]), servicios: r[5], estilo: r[6], total: r[7], estado: r[8] }));
}
const activa = r => r.estado !== "Cancelada";
const json = o => ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
const limpio = (t, n) => String(t || "").slice(0, n || 80);

function doGet(e) {
  const rows = filas();
  if (e.parameter.action === "admin") {
    if (e.parameter.pin !== PIN) return json({ error: "pin" });
    return json({ filas: rows });
  }
  const o = {}; // público: solo fechas y horas ocupadas, sin datos personales
  rows.filter(activa).forEach(r => { (o[r.fecha] = o[r.fecha] || []).push(r.hora); });
  return json(o);
}
function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  const lock = LockService.getScriptLock(); lock.waitLock(10000);
  try {
    const s = hoja();
    if (d.action === "reservar") {
      if (filas().some(r => activa(r) && r.fecha === d.fecha && r.hora === d.hora)) return json({ ok: false, error: "ocupado" });
      s.appendRow([new Date().toISOString(), limpio(d.fecha,10), limpio(d.hora,5), limpio(d.nombre), limpio(d.cel,15), limpio(d.servicios,120), limpio(d.estilo), Number(d.total) || 0, "Reservada"]);
      return json({ ok: true });
    }
    if (d.pin !== PIN) return json({ ok: false, error: "pin" });
    if (d.action === "estado") { s.getRange(Number(d.fila), 9).setValue(limpio(d.estado, 20)); return json({ ok: true }); }
    if (d.action === "bloquear") {
      const ya = filas().filter(r => activa(r) && r.fecha === d.fecha).map(r => r.hora);
      d.horas.filter(h => ya.indexOf(h) < 0).forEach(h => s.appendRow([new Date().toISOString(), d.fecha, h, "BLOQUEADO", "", "", "", 0, "Bloqueada"]));
      return json({ ok: true });
    }
    return json({ ok: false });
  } finally { lock.releaseLock(); }
}
