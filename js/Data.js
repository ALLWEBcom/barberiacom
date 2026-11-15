/* CAPA DE DATOS: edita aquí tu información, no necesitas tocar el resto. */
const CONFIG = {
  whatsapp: "573000000000",   // tu número con indicativo, sin + ni espacios
  horaInicio: 9, horaFin: 19, // horario de atención
  intervaloMin: 30,           // duración de cada cupo
  diasCerrados: [0],          // 0 = domingo
  diasAdelante: 21            // cuántos días se pueden reservar
};
const SERVICIOS = [
  { id: "corte", nombre: "Corte de cabello", precio: 25000, desc: "Corte a tu medida, con lavado y peinado." },
  { id: "barba", nombre: "Barba", precio: 15000, desc: "Perfilado, toalla caliente y aceite." },
  { id: "cejas", nombre: "Cejas", precio: 8000, desc: "Diseño y limpieza con navaja." },
  { id: "combo", nombre: "Corte + barba", precio: 35000, desc: "El servicio completo, con ahorro." }
];
/* p = trazo del cabello dentro de un lienzo de 100x100 */
const ESTILOS = [
  { id: "fade", nombre: "Low fade", desc: "Degradado bajo y limpio, tope corto.", p: "M28 52 Q28 24 50 24 Q72 24 72 52 Q68 40 50 38 Q32 40 28 52Z" },
  { id: "pompadour", nombre: "Pompadour", desc: "Volumen al frente y laterales marcados.", p: "M26 52 Q20 14 52 14 Q82 14 74 52 Q70 32 50 32 Q32 34 26 52Z" },
  { id: "buzz", nombre: "Buzz cut", desc: "Rapado parejo. Cero mantenimiento.", p: "M29 50 Q31 32 50 32 Q69 32 71 50 Q66 41 50 41 Q34 41 29 50Z" },
  { id: "crop", nombre: "French crop", desc: "Flequillo corto y texturizado.", p: "M27 54 Q26 26 50 26 Q74 26 73 54 L70 42 L58 38 L44 40 L30 42Z" },
  { id: "undercut", nombre: "Undercut", desc: "Laterales al ras y tope largo.", p: "M32 46 Q30 12 52 12 Q72 12 68 46 Q60 33 50 33 Q40 33 32 46Z" },
  { id: "textura", nombre: "Textura natural", desc: "Capas sueltas, movimiento y volumen.", p: "M27 52 Q24 24 40 22 Q50 12 62 22 Q78 26 73 52 Q66 38 50 38 Q36 38 27 52Z" }
];
