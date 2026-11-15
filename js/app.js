/* CAPA DE LÓGICA: disponibilidad, reservas y mensajes. */
const $ = s => document.querySelector(s);
const peso = n => "$" + n.toLocaleString("es-CO");
const DIAS = ["dom","lun","mar","mié","jue","vie","sáb"], MESES = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
const estado = { fecha: null, hora: null, servicios: new Set(), estilo: null };

/* --- Reservas guardadas (localStorage). Con backend real, reemplaza solo estas 2 funciones --- */
const leer = () => { try { return JSON.parse(localStorage.getItem("reservas") || "{}"); } catch { return {}; } };
const guardar = (f, h) => { const r = leer(); (r[f] = r[f] || []).push(h); try { localStorage.setItem("reservas", JSON.stringify(r)); } catch {} };

const clave = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
function horasDelDia() {
  const l = [];
  for (let m = CONFIG.horaInicio*60; m < CONFIG.horaFin*60; m += CONFIG.intervaloMin)
    l.push(`${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`);
  return l;
}
/* Ocupación de ejemplo (según la fecha) para que la demo se vea real */
const hash = s => [...s].reduce((a,c) => (a*31 + c.charCodeAt(0)) >>> 0, 7);
function ocupadas(f) {
  const base = horasDelDia().filter((h,i) => hash(f+h) % 100 < 30 + (hash(f) % 30));
  return new Set([...base, ...(leer()[f] || [])]);
}
function libres(d) {
  const f = clave(d), hoy = new Date(), oc = ocupadas(f);
  return horasDelDia().filter(h => {
    if (oc.has(h)) return false;
    if (f === clave(hoy)) { const [hh,mm] = h.split(":"); return +hh*60 + +mm > hoy.getHours()*60 + hoy.getMinutes(); }
    return true;
  });
}

/* --- Interfaz --- */
function pintarServicios() {
  $("#lista-servicios").innerHTML = SERVICIOS.map(s => `<article class="srv"><h3>${s.nombre}</h3><p>${s.desc}</p><b>${peso(s.precio)}</b></article>`).join("");
  $("#sel-servicios").innerHTML = SERVICIOS.map(s => `<button class="chip" data-id="${s.id}" aria-pressed="false">${s.nombre} · ${peso(s.precio)}</button>`).join("");
}
function iconoEstilo(e) {
  const svg = `<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M40 78 L40 90 H60 L60 78Z" fill="#c99a76"/><ellipse cx="50" cy="58" rx="22" ry="28" fill="#e0b48f"/><path d="${e.p}" fill="#b8893b"/><circle cx="42" cy="60" r="2" fill="#10241d"/><circle cx="58" cy="60" r="2" fill="#10241d"/><path d="M44 74 Q50 78 56 74" stroke="#10241d" stroke-width="2" fill="none"/></svg>`;
  return `<span class="foto">${svg}<img src="${e.img}" alt="Corte ${e.nombre}" loading="lazy" onerror="this.remove()"></span>`;
}
function pintarEstilos() {
  $("#lista-estilos").innerHTML = ESTILOS.map(e => `<button class="estilo" data-id="${e.id}" aria-pressed="false">${iconoEstilo(e)}<span class="info"><h3>${e.nombre}</h3><p>${e.desc}</p></span></button>`).join("");
}
function pintarDias() {
  const cont = $("#dias"); cont.innerHTML = "";
  const hoy = new Date();
  for (let i = 0; i <= CONFIG.diasAdelante; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + i);
    const cerrado = CONFIG.diasCerrados.includes(d.getDay());
    const n = cerrado ? 0 : libres(d).length;
    const b = document.createElement("button");
    b.className = "day" + (n > 0 && n <= 5 ? " poco" : "");
    b.disabled = n === 0; b.dataset.fecha = clave(d); b.setAttribute("aria-pressed","false");
    b.innerHTML = `${DIAS[d.getDay()]}<b>${d.getDate()}</b>${MESES[d.getMonth()]}<small>${cerrado ? "cerrado" : n === 0 ? "sin cupos" : n + " cupos"}</small>`;
    cont.appendChild(b);
  }
}
function pintarHoras() {
  const [y,m,d] = estado.fecha.split("-").map(Number), dia = new Date(y,m-1,d);
  const libresDia = new Set(libres(dia));
  $("#horas").innerHTML = horasDelDia().map(h => `<button class="slot" data-h="${h}" aria-pressed="false" ${libresDia.has(h) ? "" : "disabled"}>${h}</button>`).join("");
}
function resumen() {
  const sel = SERVICIOS.filter(s => estado.servicios.has(s.id));
  const total = sel.reduce((a,s) => a + s.precio, 0);
  const est = ESTILOS.find(e => e.id === estado.estilo);
  $("#resumen").textContent = sel.length || estado.fecha ? 
    `Servicios: ${sel.map(s => s.nombre).join(", ") || "—"}\nEstilo: ${est ? est.nombre : "sin referencia"}\nFecha: ${estado.fecha || "—"}  Hora: ${estado.hora || "—"}\nTotal: ${peso(total)}` : "Tu resumen aparecerá aquí.";
  return { sel, total, est };
}
const marcar = (cont, sel, el) => { cont.querySelectorAll(sel).forEach(b => b.setAttribute("aria-pressed", b === el)); };

document.addEventListener("click", e => {
  const chip = e.target.closest(".chip"), est = e.target.closest(".estilo"), dia = e.target.closest(".day"), hora = e.target.closest(".slot");
  if (chip) {
    const id = chip.dataset.id; estado.servicios.has(id) ? estado.servicios.delete(id) : estado.servicios.add(id);
    chip.setAttribute("aria-pressed", estado.servicios.has(id));
  }
  if (est) {
    estado.estilo = est.dataset.id; marcar($("#lista-estilos"), ".estilo", est);
    $("#sel-estilo").textContent = "Estilo de referencia: " + ESTILOS.find(x => x.id === estado.estilo).nombre;
    estado.servicios.add("corte"); $('[data-id="corte"].chip').setAttribute("aria-pressed", true);
    $("#reservar").scrollIntoView({ behavior: "smooth" });
  }
  if (dia && !dia.disabled) { estado.fecha = dia.dataset.fecha; estado.hora = null; marcar($("#dias"), ".day", dia); pintarHoras(); }
  if (hora && !hora.disabled) { estado.hora = hora.dataset.h; marcar($("#horas"), ".slot", hora); }
  resumen();
});

$("#confirmar").addEventListener("click", () => {
  const nombre = $("#nombre").value.trim(), tel = $("#telefono").value.replace(/\D/g, ""), err = $("#error");
  const { sel, total, est } = resumen();
  err.textContent = "";
  if (!sel.length) return err.textContent = "Elige al menos un servicio.";
  if (!estado.fecha) return err.textContent = "Elige el día de tu cita.";
  if (!estado.hora) return err.textContent = "Elige la hora de tu cita.";
  if (nombre.length < 2) return err.textContent = "Escribe tu nombre.";
  if (tel.length < 10) return err.textContent = "Escribe un celular válido de 10 dígitos.";
  guardar(estado.fecha, estado.hora);
  const msg = `Hola, soy ${nombre} (${tel}). Reservé: ${sel.map(s => s.nombre).join(", ")}${est ? ", estilo " + est.nombre : ""}. Fecha ${estado.fecha} a las ${estado.hora}. Total ${peso(total)}.`;
  const ok = $("#ok"); ok.hidden = false;
  ok.innerHTML = `<h3>¡Cita reservada, ${nombre}!</h3><p>Se abrió WhatsApp con tu cita. <b>Toca “Enviar” para que la barbería la reciba.</b></p><p>${estado.fecha} a las ${estado.hora} · ${sel.map(s => s.nombre).join(", ")} · ${peso(total)}</p><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}">Abrir WhatsApp de nuevo</a>`;
  ok.scrollIntoView({ behavior: "smooth" });
  window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, "_blank");
  estado.hora = null; pintarDias(); $("#horas").innerHTML = '<p class="hint">Elige un día para otra reserva.</p>';
});

pintarServicios(); pintarEstilos(); pintarDias(); resumen();
$("#wsp").href = $("#wsp2").href = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent("Hola, necesito ayuda con mi cita.")}`;
$("#anio").textContent = new Date().getFullYear();
