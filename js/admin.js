const $ = s => document.querySelector(s);
const peso = n => "$" + Number(n || 0).toLocaleString("es-CO");
const esc = t => String(t ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
const DIAS = ["domingo","lunes","martes","miércoles","jueves","viernes","sábado"], MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const clave = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
function horas() { const l = []; for (let m = CONFIG.horaInicio*60; m < CONFIG.horaFin*60; m += CONFIG.intervaloMin) l.push(`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`); return l; }
let pin = sessionStorage.getItem("pin") || "", filas = [], sel = clave(new Date());
$("#neg").textContent = CONFIG.negocio || "Barbería";

async function cargar() {
  if (!CONFIG.apiUrl) { $("#lerr").textContent = "Falta configurar apiUrl en js/data.js (ver instrucciones)."; return false; }
  try {
    const d = await (await fetch(CONFIG.apiUrl + "?action=admin&pin=" + encodeURIComponent(pin))).json();
    if (d.error) { $("#lerr").textContent = "Clave incorrecta."; return false; }
    filas = d.filas.filter(r => r.estado !== "Cancelada"); return true;
  } catch { $("#lerr").textContent = "No se pudo conectar. Revisa tu internet."; return false; }
}
async function enviar(o) {
  await fetch(CONFIG.apiUrl, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ ...o, pin }) });
  if (await cargar()) pintar();
}
function pintar() {
  $("#login").hidden = true; $("#panel").hidden = false; $("#recargar").hidden = false; $("#salir").hidden = false;
  const hoy = clave(new Date()), total = horas().length;
  const res = r => r.estado === "Reservada" || r.estado === "Completada";
  const en7 = filas.filter(r => res(r) && r.fecha >= hoy && r.fecha <= clave(new Date(Date.now() + 6*864e5))).length;
  const hoyN = filas.filter(r => res(r) && r.fecha === hoy).length;
  const ocupHoy = filas.filter(r => r.fecha === hoy).length;
  const ingreso = filas.filter(r => res(r) && r.fecha === hoy).reduce((a, r) => a + Number(r.total || 0), 0);
  $("#kpis").innerHTML = `<div class="kpi"><b>${hoyN}</b><span>Citas hoy</span></div><div class="kpi"><b>${en7}</b><span>Citas en 7 días</span></div><div class="kpi"><b>${Math.max(total - ocupHoy, 0)}</b><span>Horas libres hoy</span></div><div class="kpi"><b>${peso(ingreso)}</b><span>Ingreso previsto hoy</span></div>`;
  const strip = $("#strip"); strip.innerHTML = "";
  for (let i = 0; i <= CONFIG.diasAdelante; i++) {
    const d = new Date(); d.setDate(d.getDate() + i); const f = clave(d), n = filas.filter(r => res(r) && r.fecha === f).length;
    const b = document.createElement("button"); b.className = "day"; b.setAttribute("aria-pressed", f === sel);
    b.innerHTML = `${DIAS[d.getDay()].slice(0,3)}<b>${d.getDate()}</b>${MESES[d.getMonth()]}<small>${CONFIG.diasCerrados.includes(d.getDay()) ? "cerrado" : n + " citas"}</small>`;
    b.onclick = () => { sel = f; pintar(); }; strip.appendChild(b);
  }
  const [y,m,dd] = sel.split("-").map(Number), fd = new Date(y, m-1, dd);
  $("#diaTit").textContent = `${DIAS[fd.getDay()]} ${dd} de ${MESES[m-1]}`;
  const delDia = {}; filas.filter(r => r.fecha === sel).forEach(r => delDia[r.hora] = r);
  $("#agenda").innerHTML = horas().map(h => {
    const r = delDia[h];
    if (!r) return `<div class="fila lib"><time>${h}</time><div class="d"><span class="etq">Libre</span></div><div class="acc"><button class="mini" data-a="bloq" data-h="${h}">Bloquear</button></div></div>`;
    if (r.estado === "Bloqueada") return `<div class="fila blo"><time>${h}</time><div class="d"><span class="etq">Bloqueada</span></div><div class="acc"><button class="mini" data-a="est" data-f="${r.fila}" data-e="Cancelada">Desbloquear</button></div></div>`;
    const wa = `https://wa.me/57${String(r.cel).replace(/\D/g,"").slice(-10)}`;
    return `<div class="fila ${r.estado === "Completada" ? "com" : "res"}"><time>${h}</time><div class="d"><span class="etq">${esc(r.estado)}</span><b>${esc(r.nombre)}</b> · <a href="${wa}" target="_blank" rel="noopener">${esc(r.cel)}</a><br><small>${esc(r.servicios)}${r.estilo ? " · " + esc(r.estilo) : ""} · ${peso(r.total)}</small></div><div class="acc">${r.estado === "Reservada" ? `<button class="mini" data-a="est" data-f="${r.fila}" data-e="Completada">Completada</button>` : ""}<button class="mini" data-a="est" data-f="${r.fila}" data-e="Cancelada">Cancelar</button></div></div>`;
  }).join("");
  const ahora = clave(new Date()) + " " + new Date().toTimeString().slice(0,5);
  const prox = filas.filter(r => r.estado === "Reservada" && r.fecha + " " + r.hora >= ahora).sort((a,b) => (a.fecha + a.hora).localeCompare(b.fecha + b.hora)).slice(0, 12);
  $("#proximas").innerHTML = prox.length ? prox.map(r => { const [a,b,c] = r.fecha.split("-"); return `<div class="fila res"><time>${r.hora}</time><div class="d"><b>${esc(r.nombre)}</b> · ${+c}/${+b}/${a}<br><small>${esc(r.servicios)} · ${esc(r.cel)}</small></div></div>`; }).join("") : '<p class="hint">Aún no hay citas próximas.</p>';
}
document.addEventListener("click", e => {
  const b = e.target.closest("[data-a]"); if (!b) return;
  if (b.dataset.a === "bloq") enviar({ action: "bloquear", fecha: sel, horas: [b.dataset.h] });
  if (b.dataset.a === "est") enviar({ action: "estado", fila: +b.dataset.f, estado: b.dataset.e });
});
$("#bloqDia").onclick = () => { if (confirm("¿Bloquear todas las horas libres de este día?")) enviar({ action: "bloquear", fecha: sel, horas: horas() }); };
$("#entrar").onclick = async () => { pin = $("#pin").value; if (await cargar()) { sessionStorage.setItem("pin", pin); pintar(); } };
$("#recargar").onclick = async () => { if (await cargar()) pintar(); };
$("#salir").onclick = () => { sessionStorage.removeItem("pin"); location.reload(); };
if (pin) cargar().then(ok => ok && pintar());
