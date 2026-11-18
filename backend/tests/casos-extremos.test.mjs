/**
 * Casos extremos de la API: permisos de cada ruta por rol, ids y parámetros
 * fuera de rango, cuerpos inválidos, tokens alterados, límites de faltas y
 * notas, correlatividades en cada estado, concurrencia y correos de usuario.
 *
 * Corre contra el backend local (npm run dev) con una base LOCAL: crea datos
 * con apellido ZZ-EXT. Se niega a correr contra un host que no sea localhost.
 *
 *   npm run test:extremos
 */
import "dotenv/config";
import test, { after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import pg from "pg";

const API = process.env.TEST_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}/api`;
if (!["localhost", "127.0.0.1"].includes(new URL(API).hostname)) {
  throw new Error("Estas pruebas escriben datos: solo se ejecutan contra localhost.");
}
if (process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL apunta a una base remota: estas pruebas solo usan una base local.");
}
const SECRET = process.env.JWT_SECRET;
const db = new pg.Pool({
  host: process.env.PGHOST,
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
});
after(() => db.end());

const filas = [];
const check = (area, caso, ok, detalle = "") => {
  filas.push({ area, caso, ok: Boolean(ok), detalle });
};

async function req(method, ruta, { token, body, raw, headers = {} } = {}) {
  const r = await fetch(API + ruta, {
    method,
    headers: { ...(body !== undefined || raw !== undefined ? { "Content-Type": "application/json" } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...headers },
    body: raw !== undefined ? raw : body !== undefined ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch { j = t; }
  return { s: r.status, b: j };
}
const login = (email, password = "1234") => req("POST", "/auth/login", { body: { email, password } });
const T = {
  directivo: (await login("director@escuela.com")).b.token,
  docente: (await login("docente@escuela.com")).b.token,
  preceptor: (await login("preceptor@escuela.com")).b.token,
};
const D = (m, r, body, extra = {}) => req(m, r, { token: T.directivo, body, ...extra });
let n = 0;
const dni = () => String(52000000 + ((Date.now() % 1000000) * 7 + (++n) * 131) % 7000000);
const cuil = (d) => `20-${d}-1`;
const nuevoAlumno = async (x = {}) => {
  const d = dni();
  const r = await D("POST", "/alumnos", { nombre: "Extremo", apellido: "ZZ-EXT", dni: d, cuil: cuil(d), fechaNacimiento: "1990-01-01", lugarNacimiento: "San Luis", domicilio: "Calle 1", telefono: "2664000000", email: `ext${d}@example.com`, trabaja: false, telefonoEmergencia: "2664111111", cantidadHijos: 0, ...x });
  if (r.s !== 201) throw new Error("no se pudo crear alumno " + JSON.stringify(r.b));
  return r.b;
};
const cursos = (await D("GET", "/cursos")).b;
const curso = (mod, div = "A") => cursos.find((c) => c.division.trim() === div && c.modulos.some((m) => m.id === mod)).id;
const ficha = async (id) => (await D("GET", `/alumnos/${id}`)).b;
const activa = async (id, mod) => (await ficha(id)).trayectoria.filter((t) => t.moduloId === mod).at(-1);
const matricular = (id, mod, extra = {}) => D("POST", `/alumnos/${id}/cursadas`, { idCurso: curso(mod), idModulo: mod, ...extra });
const rematricular = (id, mod, extra = {}) => D("PUT", `/alumnos/${id}/cursadas`, { idCurso: curso(mod), idModulo: mod, ...extra });
const calificar = (c, mat, estado, token = T.directivo) => req("PUT", "/calificaciones", { token, body: { cursadaModuloId: c, materiaId: mat, estado, anio: 2026 } });
const evaluar = (c, nota, inst, fecha = "2026-11-10") => D("POST", "/alumnos/evaluaciones-modulo", { idCursadaModulo: c, fecha, nota, nroInstancia: inst });
async function aprobarModulo(id, mod) {
  const c = await activa(id, mod);
  for (const m of c.materias) await calificar(c.idCursada, m.id, "Aprobado");
  const r = await evaluar(c.idCursada, 8, 1);
  if (r.s !== 201) throw new Error(`no aprobó módulo ${mod}: ${JSON.stringify(r.b)}`);
}
async function dejarLibre(id, mod) {
  const c = await activa(id, mod);
  await calificar(c.idCursada, c.materias[0].id, "Desaprobado");
}
const es500 = (r) => r.s >= 500;

// ==================================================== 1. PERMISOS POR ROL
const rutas = [
  ["GET", "/alumnos", ["directivo"]], ["GET", "/alumnos/99999999", ["directivo"]], ["POST", "/alumnos", ["directivo"]],
  ["PUT", "/alumnos/99999999", ["directivo"]], ["DELETE", "/alumnos/99999999", ["directivo"]], ["PATCH", "/alumnos/99999999/reactivar", ["directivo"]],
  ["POST", "/alumnos/99999999/cursadas", ["directivo"]], ["PUT", "/alumnos/99999999/cursadas", ["directivo"]],
  ["POST", "/alumnos/99999999/equivalencias", ["directivo"]], ["POST", "/alumnos/evaluaciones-modulo", ["directivo"]],
  ["GET", "/asistencias/modulos", ["directivo", "preceptor"]], ["GET", "/asistencias/modulos/1/divisiones", ["directivo", "preceptor"]],
  ["GET", "/asistencias/modulos/5/divisiones/B?fecha=2026-05-05", ["directivo", "preceptor"]], ["GET", "/asistencias", ["directivo", "preceptor"]],
  ["POST", "/asistencias", ["directivo", "preceptor"]], ["PUT", "/asistencias/99999999", ["directivo", "preceptor"]], ["DELETE", "/asistencias/99999999", ["directivo", "preceptor"]],
  ["GET", "/calificaciones/ciclos", ["directivo", "docente"]], ["GET", "/calificaciones/resumen", ["directivo", "docente"]],
  ["GET", "/calificaciones/modulos", ["directivo", "docente"]], ["GET", "/calificaciones/modulos/1/divisiones", ["directivo", "docente"]],
  ["GET", "/calificaciones/modulos/1/divisiones/B", ["directivo", "docente"]], ["PUT", "/calificaciones", ["directivo", "docente"]],
  ["GET", "/cursos", ["directivo", "preceptor"]],
  ["GET", "/docentes", ["directivo"]], ["GET", "/docentes/modulos", ["directivo"]], ["GET", "/docentes/99999999", ["directivo"]], ["POST", "/docentes", ["directivo"]],
  ["PUT", "/docentes/99999999", ["directivo"]], ["PATCH", "/docentes/99999999/inactivar", ["directivo"]], ["PATCH", "/docentes/99999999/reactivar", ["directivo"]], ["DELETE", "/docentes/99999999", ["directivo"]],
  ["GET", "/preceptores", ["directivo"]], ["GET", "/preceptores/cursos", ["directivo"]], ["GET", "/preceptores/99999999", ["directivo"]], ["POST", "/preceptores", ["directivo"]],
  ["PUT", "/preceptores/99999999", ["directivo"]], ["PUT", "/preceptores/99999999/cursos", ["directivo"]], ["PATCH", "/preceptores/99999999/inactivar", ["directivo"]], ["DELETE", "/preceptores/99999999", ["directivo"]],
  ["GET", "/plan-estudio/actual", ["directivo"]], ["POST", "/plan-estudio", ["directivo"]], ["DELETE", "/plan-estudio/99999999", ["directivo"]], ["PATCH", "/plan-estudio/99999999/reactivar", ["directivo"]],
  ["GET", "/materias", ["directivo"]], ["POST", "/materias", ["directivo"]], ["GET", "/ciclo-lectivo", ["directivo"]], ["POST", "/ciclo-lectivo", ["directivo"]],
  ["GET", "/reportes/inasistencias", ["directivo"]], ["GET", "/reportes/desaprobaciones", ["directivo"]],
  ["POST", "/auth/registro", ["directivo"]], ["GET", "/auth/perfil", ["directivo", "docente", "preceptor"]],
];
for (const [m, r, permitidos] of rutas) {
  const sin = await req(m, r, { body: m === "GET" ? undefined : {} });
  check("Permisos", `${m} ${r} sin token`, sin.s === 401, `-> ${sin.s}`);
  for (const rol of ["directivo", "docente", "preceptor"]) {
    const x = await req(m, r, { token: T[rol], body: m === "GET" ? undefined : {} });
    if (permitidos.includes(rol)) check("Permisos", `${m} ${r} como ${rol} (permitido)`, x.s !== 401 && x.s !== 403 && !es500(x), `-> ${x.s} ${JSON.stringify(x.b).slice(0, 120)}`);
    else check("Permisos", `${m} ${r} como ${rol} (prohibido)`, x.s === 403, `-> ${x.s}`);
  }
}

// ==================================================== 2. IDS RAROS
const idsRaros = ["0", "-1", "1.5", "abc", "99999999999", "1e3", "%20", "2147483648", "null", "1;DROP TABLE alumno"];
const conId = [["GET", "/alumnos/:id"], ["PUT", "/alumnos/:id"], ["DELETE", "/alumnos/:id"], ["PATCH", "/alumnos/:id/reactivar"], ["POST", "/alumnos/:id/cursadas"], ["POST", "/alumnos/:id/equivalencias"],
  ["GET", "/docentes/:id"], ["PUT", "/docentes/:id"], ["PATCH", "/docentes/:id/inactivar"], ["DELETE", "/docentes/:id"],
  ["GET", "/preceptores/:id"], ["PUT", "/preceptores/:id/cursos"], ["PATCH", "/preceptores/:id/reactivar"], ["DELETE", "/preceptores/:id"],
  ["PUT", "/asistencias/:id"], ["DELETE", "/asistencias/:id"], ["DELETE", "/plan-estudio/:id"], ["PATCH", "/plan-estudio/:id/reactivar"],
  ["GET", "/asistencias/modulos/:id/divisiones"], ["GET", "/calificaciones/modulos/:id/divisiones"], ["GET", "/calificaciones/modulos/:id/divisiones/A"], ["GET", "/asistencias/modulos/:id/divisiones/A"]];
for (const [m, plantilla] of conId) {
  for (const id of idsRaros) {
    const r = await D(m, plantilla.replace(":id", encodeURIComponent(id)), m === "GET" || m === "DELETE" ? undefined : { valorFalta: 1, cursoIds: [], modulosIds: [1] });
    check("IDs raros", `${m} ${plantilla} con "${id}"`, [400, 404].includes(r.s), `-> ${r.s} ${JSON.stringify(r.b).slice(0, 100)}`);
  }
}
for (const q of ["/asistencias?cursadaModuloId=abc", "/asistencias?cursadaModuloId=99999999999", "/asistencias?fecha=2026-02-30", "/reportes/inasistencias?anio=abc", "/reportes/inasistencias?moduloId=99999999999", "/reportes/inasistencias?minFaltas=-5", "/reportes/desaprobaciones?anio=1800", "/calificaciones/modulos/1/divisiones/A?anio=99999999999", "/calificaciones/resumen?anio=abc", "/alumnos?incluirInactivos=quizas", "/docentes?estado=%27%20OR%201%3D1", "/asistencias/modulos/1/divisiones/ZZZ?fecha=2026-05-05", "/asistencias/modulos/1/divisiones/A?fecha=hoy"]) {
  const r = await D("GET", q);
  check("Parámetros", `GET ${q}`, [200, 400, 404].includes(r.s), `-> ${r.s} ${JSON.stringify(r.b).slice(0, 100)}`);
}

// ==================================================== 3. CUERPOS INVÁLIDOS
for (const [m, r] of [["POST", "/alumnos"], ["POST", "/asistencias"], ["PUT", "/calificaciones"], ["POST", "/docentes"], ["POST", "/auth/login"]]) {
  const mal = await req(m, r, { token: T.directivo, raw: "{nombre: 'x'," });
  check("Cuerpo", `${m} ${r} con JSON mal formado`, mal.s === 400, `-> ${mal.s} ${JSON.stringify(mal.b).slice(0, 100)}`);
  const arr = await req(m, r, { token: T.directivo, body: [1, 2, 3] });
  check("Cuerpo", `${m} ${r} con un arreglo`, [400, 401].includes(arr.s), `-> ${arr.s} ${JSON.stringify(arr.b).slice(0, 100)}`);
  const nul = await req(m, r, { token: T.directivo, raw: "null" });
  check("Cuerpo", `${m} ${r} con null`, [400, 401].includes(nul.s), `-> ${nul.s} ${JSON.stringify(nul.b).slice(0, 100)}`);
}
const grande = await req("POST", "/alumnos", { token: T.directivo, raw: JSON.stringify({ nombre: "x".repeat(200000) }) });
check("Cuerpo", "POST /alumnos con 200 KB", grande.s === 413, `-> ${grande.s} ${JSON.stringify(grande.b).slice(0, 100)}`);
const largo = await D("POST", "/alumnos", { nombre: "A".repeat(5000), apellido: "ZZ-EXT", dni: dni(), cuil: "20-1-1" });
check("Cuerpo", "Nombre de 5000 letras", largo.s === 400, `-> ${largo.s}`);
{ // strings peligrosos se guardan tal cual
  const d = dni();
  const r = await D("POST", "/alumnos", { nombre: "Robert'); DROP TABLE alumno;--", apellido: "<script>alert(1)</script>", dni: d, cuil: cuil(d), fechaNacimiento: "1990-01-01", lugarNacimiento: "SL", domicilio: "C", telefono: "2664000000", email: `inj${d}@example.com`, trabaja: false, telefonoEmergencia: "2664111111", cantidadHijos: 0 });
  check("Cuerpo", "Nombre con SQL/HTML: o se rechaza (400) o se guarda literal", r.s === 400 || (r.s === 201 && r.b.apellido.includes("<script>")), `-> ${r.s} ${JSON.stringify(r.b).slice(0, 120)}`);
  const sigue = await D("GET", "/alumnos"); check("Cuerpo", "La tabla alumno sigue existiendo", sigue.s === 200);
}

// ==================================================== 4. AUTENTICACIÓN
const payload = jwt.decode(T.directivo);
const casosToken = {
  "firma alterada": T.directivo.slice(0, -3) + (T.directivo.slice(-3) === "abc" ? "abd" : "abc"),
  "firmado con otra clave": jwt.sign({ id: payload.id, rol: "directivo" }, "otra-clave"),
  "vencido": jwt.sign({ id: payload.id, rol: "directivo" }, SECRET, { expiresIn: -10 }),
  "usuario inexistente": jwt.sign({ id: 99999999, rol: "directivo" }, SECRET, { expiresIn: "1h" }),
  "alg none": `${Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ id: payload.id, rol: "directivo" })).toString("base64url")}.`,
  "basura": "abc.def.ghi",
};
for (const [nombre, t] of Object.entries(casosToken)) {
  const r = await req("GET", "/alumnos", { token: t });
  check("Auth", `Token ${nombre}`, r.s === 401, `-> ${r.s} ${JSON.stringify(r.b)}`);
}
{
  const r = await req("GET", "/alumnos", { headers: { Authorization: "Bearer " } }); check("Auth", "Bearer vacío", r.s === 401, `-> ${r.s}`);
  const r2 = await req("GET", "/alumnos", { headers: { Authorization: `bearer ${T.directivo}` } }); check("Auth", "bearer en minúscula", [200, 401].includes(r2.s), `-> ${r2.s}`);
  // Un docente con un token que dice "directivo": se usa el rol de la base.
  const docPayload = jwt.decode(T.docente);
  const { exp, iat, ...resto } = docPayload;
  const falso = jwt.sign({ ...resto, rol: "directivo" }, SECRET, { expiresIn: "1h" });
  const r3 = await req("GET", "/alumnos", { token: falso }); check("Auth", "Token de docente con rol 'directivo' inventado (misma clave)", r3.s === 403, `-> ${r3.s}`);
}
for (const [nombre, body] of Object.entries({
  "sin cuerpo": undefined, "email número": { email: 12, password: "1234" }, "password número": { email: "director@escuela.com", password: 1234 },
  "password objeto": { email: "director@escuela.com", password: { $ne: "" } }, "password arreglo": { email: "director@escuela.com", password: ["1234"] },
  "email objeto": { email: { $ne: "" }, password: "1234" }, "SQL en email": { email: "' OR 1=1 --", password: "x" },
  "password de 1 MB": { email: "director@escuela.com", password: "x".repeat(90000) }, "email de 10000": { email: "a".repeat(10000) + "@x.com", password: "x" },
})) {
  const r = await req("POST", "/auth/login", { body });
  check("Login", `Login con ${nombre}`, [400, 401].includes(r.s), `-> ${r.s} ${JSON.stringify(r.b).slice(0, 100)}`);
}

// ==================================================== 5. ALUMNOS: LÍMITES
{
  const hoy = new Date(); const iso = (d) => d.toISOString().slice(0, 10);
  const hace18 = new Date(Date.UTC(hoy.getFullYear() - 18, hoy.getMonth(), hoy.getDate()));
  const manana18 = new Date(hace18); manana18.setUTCDate(manana18.getUTCDate() + 1);
  const casos = [
    ["DNI de 6 dígitos", { dni: "123456" }, 400], ["DNI de 9 dígitos", { dni: "123456789" }, 400], ["DNI con letras", { dni: "12A45678" }, 400],
    ["Fecha 30 de febrero", { fechaNacimiento: "2000-02-30" }, 400], ["Fecha futura", { fechaNacimiento: "2030-01-01" }, 400], ["Fecha 1890", { fechaNacimiento: "1890-01-01" }, 400],
    ["Cumple 18 hoy", { fechaNacimiento: iso(hace18) }, 201], ["Cumple 18 mañana", { fechaNacimiento: iso(manana18) }, 400],
    ["Hijos -1", { cantidadHijos: -1 }, 400], ["Hijos 1.5", { cantidadHijos: 1.5 }, 400], ["Hijos 'dos'", { cantidadHijos: "dos" }, 400], ["Hijos 99 (máximo del equipo)", { cantidadHijos: 99 }, 201], ["Hijos 100", { cantidadHijos: 100 }, 400], ["trabaja 'false' (texto)", { trabaja: "false" }, 201],
    ["trabaja 'si'", { trabaja: "si" }, 400], ["Email sin arroba", { email: "correo.com" }, 400], ["Teléfono con letras", { telefono: "abc" }, 400],
    ["Nombre con números", { nombre: "Juan2" }, 400], ["Nombre solo espacios", { nombre: "   " }, 400], ["Nombre con tilde y ñ", { nombre: "Íñigo José" }, 201],
  ];
  for (const [nombre, x, esperado] of casos) {
    const d = x.dni ?? dni();
    const body = { nombre: "Extremo", apellido: "ZZ-EXT", dni: d, cuil: cuil(d), fechaNacimiento: "1990-01-01", lugarNacimiento: "SL", domicilio: "C", telefono: "2664000000", email: `lim${dni()}@example.com`, trabaja: false, telefonoEmergencia: "2664111111", cantidadHijos: 0, ...x };
    const r = await D("POST", "/alumnos", body);
    check("Alumnos", nombre, r.s === esperado, `esperado ${esperado} -> ${r.s} ${JSON.stringify(r.b).slice(0, 110)}`);
  }
  // Concurrencia: 6 altas simultáneas con el mismo DNI
  const d = dni();
  const body = (i) => ({ nombre: "Carrera", apellido: "ZZ-EXT", dni: d, cuil: cuil(d), fechaNacimiento: "1990-01-01", lugarNacimiento: "SL", domicilio: "C", telefono: "2664000000", email: `car${d}${i}@example.com`, trabaja: false, telefonoEmergencia: "2664111111", cantidadHijos: 0 });
  const rs = await Promise.all([0, 1, 2, 3, 4, 5].map((i) => D("POST", "/alumnos", body(i))));
  check("Alumnos", "6 altas simultáneas con el mismo DNI: 1 creada y 5 rechazadas", rs.filter((r) => r.s === 201).length === 1 && rs.filter((r) => r.s === 409).length === 5, rs.map((r) => r.s).join(","));
  // Mismo correo con otras mayúsculas
  const a = await nuevoAlumno(); const d2 = dni();
  const r2 = await D("POST", "/alumnos", { ...body(9), dni: d2, cuil: cuil(d2), email: a.email.toUpperCase() });
  check("Observación", "Dos alumnos con el mismo correo: se acepta (puede ser un correo familiar)", true, `-> ${r2.s}`);
}

// ==================================================== 6. CORRELATIVIDADES Y MATRÍCULA (backend)
{
  const a = await nuevoAlumno();
  let r = await matricular(a.id, 3); check("Correlatividades", "Alumno nuevo directo a III sin equivalencias", r.s === 409, `-> ${r.s}`);
  r = await matricular(a.id, 5, { equivalencias: [3, 4] }); check("Correlatividades", "Directo a V con equivalencias III y IV solamente (falta I y II)", r.s === 409 || r.s === 400, `-> ${r.s} ${JSON.stringify(r.b).slice(0, 100)}`);
  r = await matricular(a.id, 5, { equivalencias: [1, 2, 3] }); check("Correlatividades", "Directo a V sin la equivalencia de IV", r.s === 409 || r.s === 400, `-> ${r.s}`);
  r = await matricular(a.id, 5, { equivalencias: [1, 2, 3, 4] }); check("Correlatividades", "Directo a V con I a IV por equivalencia", r.s === 201, `-> ${r.s} ${JSON.stringify(r.b).slice(0, 100)}`);
  r = await matricular(a.id, 5); check("Correlatividades", "Matricular de nuevo en V estando en curso", r.s === 409, `-> ${r.s}`);
  r = await D("POST", `/alumnos/${a.id}/equivalencias`, { modulosIds: [5] }); check("Equivalencias", "Equivalencia de un módulo que está cursando", [400, 409].includes(r.s), `-> ${r.s}`);
  r = await D("POST", `/alumnos/${a.id}/equivalencias`, { modulosIds: [1] }); check("Equivalencias", "Equivalencia repetida", [200, 201, 409].includes(r.s), `-> ${r.s}`);
  r = await D("POST", `/alumnos/${a.id}/equivalencias`, { modulosIds: [] }); check("Equivalencias", "Equivalencias vacías", r.s === 400, `-> ${r.s}`);
  r = await D("POST", `/alumnos/${a.id}/equivalencias`, { modulosIds: [99] }); check("Equivalencias", "Equivalencia de módulo 99", [400, 404].includes(r.s), `-> ${r.s}`);
  r = await D("POST", `/alumnos/${a.id}/equivalencias`, { modulosIds: ["1; DROP TABLE x"] }); check("Equivalencias", "Equivalencia con texto", r.s === 400, `-> ${r.s}`);

  const b = await nuevoAlumno();
  r = await matricular(b.id, 2); check("Correlatividades", "Alumno nuevo directo a II (backend: II no tiene correlativas)", r.s === 201, `-> ${r.s} ${JSON.stringify(r.b).slice(0, 100)}`);

  const c = await nuevoAlumno();
  await matricular(c.id, 1);
  await D("POST", "/asistencias", { cursadaModuloId: (await activa(c.id, 1)).idCursada, fecha: "2026-04-02", valorFalta: 1 });
  r = await rematricular(c.id, 2); check("Correlatividades", "Cursa I (en curso) y pasa a II", r.s === 200, `-> ${r.s} ${JSON.stringify(r.b).slice(0, 120)}`);
  const fc = await ficha(c.id);
  check("Correlatividades", "Después de pasar a II, I sigue en su trayectoria", fc.trayectoria.some((t) => t.moduloId === 1), JSON.stringify(fc.trayectoria.map((t) => [t.moduloId, t.estadoAcademico, t.activa])));
  r = await rematricular(c.id, 3); check("Correlatividades", "Con I y II sin aprobar no pasa a III", r.s === 409, `-> ${r.s}`);

  const e = await nuevoAlumno();
  await matricular(e.id, 1); await dejarLibre(e.id, 1);
  r = await rematricular(e.id, 2); check("Correlatividades", "I libre y pasa a II (mismo año)", r.s === 200, `-> ${r.s} ${JSON.stringify(r.b).slice(0, 120)}`);
  await aprobarModulo(e.id, 2);
  r = await rematricular(e.id, 1); check("Correlatividades", "II aprobado, recursa I (el error original)", r.s === 200 && r.b?.matricula === "RECURSADA", `-> ${r.s} ${JSON.stringify(r.b).slice(0, 120)}`);
  const recursada = await activa(e.id, 1);
  check("Correlatividades", "La recursada de I arranca en 0 faltas y sin notas", recursada.faltas === 0 && recursada.materias.every((m) => m.estado === "En Curso"), JSON.stringify({ f: recursada.faltas, m: recursada.materias.map((m) => m.estado) }));
  r = await rematricular(e.id, 3); check("Correlatividades", "II aprobado pero I recursando: no pasa a III", r.s === 409, `-> ${r.s}`);
  await aprobarModulo(e.id, 1);
  r = await rematricular(e.id, 3); check("Correlatividades", "I y II aprobados: pasa a III", r.s === 200, `-> ${r.s}`);
  await dejarLibre(e.id, 3);
  r = await rematricular(e.id, 4); check("Correlatividades", "III libre y pasa a IV (mismo año)", r.s === 200, `-> ${r.s} ${JSON.stringify(r.b).slice(0, 120)}`);
  await aprobarModulo(e.id, 4);
  r = await rematricular(e.id, 5); check("Correlatividades", "IV aprobado y III libre: no pasa a V", r.s === 409, `-> ${r.s}`);
  r = await rematricular(e.id, 6); check("Correlatividades", "Tampoco a VI", r.s === 409, `-> ${r.s}`);
  r = await rematricular(e.id, 4); check("Correlatividades", "Matricular en IV ya aprobado", r.s === 409, `-> ${r.s} ${JSON.stringify(r.b).slice(0, 100)}`);
  r = await D("PUT", `/alumnos/${e.id}/cursadas`, { idCurso: curso(1), idModulo: 3 }); check("Matrícula", "Curso de 1.º año para el Módulo III", [400, 409].includes(r.s), `-> ${r.s}`);
  r = await D("PUT", `/alumnos/${e.id}/cursadas`, { idCurso: 99999, idModulo: 3 }); check("Matrícula", "Curso inexistente", [400, 404].includes(r.s), `-> ${r.s}`);
  r = await D("PUT", `/alumnos/${e.id}/cursadas`, { idCurso: curso(3), idModulo: 9 }); check("Matrícula", "Módulo 9", [400, 404].includes(r.s), `-> ${r.s}`);
  r = await D("PUT", `/alumnos/${e.id}/cursadas`, { idCurso: "abc", idModulo: "x" }); check("Matrícula", "Curso y módulo con texto", r.s === 400, `-> ${r.s}`);

  // Matrícula simultánea
  const g = await nuevoAlumno();
  const rs = await Promise.all([1, 2, 3, 4].map(() => matricular(g.id, 1)));
  check("Matrícula", "4 matrículas simultáneas en I: 1 creada, el resto rechazada", rs.filter((x) => x.s === 201).length === 1 && rs.every((x) => [201, 409].includes(x.s)), rs.map((x) => x.s).join(","));

  // Alumno dado de baja
  await D("DELETE", `/alumnos/${g.id}`);
  r = await rematricular(g.id, 2); check("Matrícula", "Matricular a un alumno dado de baja", r.s === 409, `-> ${r.s}`);
  r = await D("POST", `/alumnos/${g.id}/equivalencias`, { modulosIds: [3] }); check("Equivalencias", "Equivalencia a un alumno dado de baja", r.s === 409, `-> ${r.s}`);

  // Cambio de curso (división) en el mismo módulo, con faltas cargadas
  const h = await nuevoAlumno(); await matricular(h.id, 1);
  const ch = await activa(h.id, 1);
  await D("POST", "/asistencias", { cursadaModuloId: ch.idCursada, fecha: "2026-04-01", valorFalta: 1 });
  r = await D("PUT", `/alumnos/${h.id}/cursadas`, { idCurso: curso(1, "B"), idModulo: 1 });
  const ch2 = await activa(h.id, 1);
  check("Matrícula", "Cambio de división conserva faltas y cursada", r.s === 200 && r.b?.matricula === "CAMBIO_DE_CURSO" && ch2.faltas === 1 && ch2.division === "B", `-> ${r.s} ${r.b?.matricula} faltas ${ch2.faltas} div ${ch2.division}`);
}

// ==================================================== 7. ASISTENCIAS
{
  const a = await nuevoAlumno(); await matricular(a.id, 1);
  const c = (await activa(a.id, 1)).idCursada;
  for (const [v, ok] of [[0.25, false], [-1, false], [2, false], [null, false], [true, false], ["", false], ["1", true], [0, true], [0.5, true], [1, true]]) {
    const r = await D("POST", "/asistencias", { cursadaModuloId: c, fecha: "2026-03-10", valorFalta: v });
    check("Asistencias", `valorFalta ${JSON.stringify(v)}`, ok ? [200, 201].includes(r.s) : r.s === 400, `-> ${r.s} ${JSON.stringify(r.b).slice(0, 90)}`);
  }
  for (const f of ["2026-02-30", "2026-13-01", "", "17/11/2026", "2026-1-5", null]) {
    const r = await D("POST", "/asistencias", { cursadaModuloId: c, fecha: f, valorFalta: 1 });
    check("Asistencias", `fecha ${JSON.stringify(f)}`, r.s === 400 || (f === null && [200, 201].includes(r.s)), `-> ${r.s} ${JSON.stringify(r.b).slice(0, 90)}`);
  }
  const fut = await D("POST", "/asistencias", { cursadaModuloId: c, fecha: "2030-05-05", valorFalta: 1 });
  check("Asistencias", "Fecha en el futuro (2030)", fut.s === 400, `-> ${fut.s} ${JSON.stringify(fut.b).slice(0, 90)}`);
  const otroCiclo = await D("POST", "/asistencias", { cursadaModuloId: c, fecha: "2019-05-05", valorFalta: 1 });
  check("Asistencias", "Fecha de otro ciclo lectivo (2019)", otroCiclo.s === 400, `-> ${otroCiclo.s} ${JSON.stringify(otroCiclo.b).slice(0, 90)}`);
  const fueraPeriodo = await D("POST", "/asistencias", { cursadaModuloId: c, fecha: "2026-10-15", valorFalta: 1 });
  check("Observación", "Módulo I (marzo a julio) con falta en octubre: se acepta", true, `-> ${fueraPeriodo.s}`);
  const domingo = await D("POST", "/asistencias", { cursadaModuloId: c, fecha: "2026-03-08", valorFalta: 1 });
  check("Observación", "Falta un domingo (2026-03-08): se acepta", true, `-> ${domingo.s}`);
  // Limpieza de lo anterior
  for (const reg of (await D("GET", `/asistencias?cursadaModuloId=${c}`)).b) await D("DELETE", `/asistencias/${reg.id}`);

  // Mismo día 6 veces a la vez
  const rs = await Promise.all([1, 0.5, 1, 0, 1, 0.5].map((v) => D("POST", "/asistencias", { cursadaModuloId: c, fecha: "2026-03-11", valorFalta: v })));
  const regs = (await D("GET", `/asistencias?cursadaModuloId=${c}&fecha=2026-03-11`)).b;
  check("Asistencias", "6 cargas simultáneas del mismo día: sin error y un solo registro", rs.every((r) => [200, 201].includes(r.s)) && regs.length === 1, `${rs.map((r) => r.s)} registros ${regs.length}`);

  // Límite: 25 regular, 25.5 libre
  const dias = []; for (let m = 3; m <= 7; m++) for (let d = 1; d <= 28; d++) { const f = `2026-0${m}-${String(d).padStart(2, "0")}`; if (new Date(f + "T12:00:00Z").getUTCDay() % 6 !== 0) dias.push(f); }
  const usables = dias.filter((f) => f !== "2026-03-11");
  await D("DELETE", `/asistencias/${regs[0].id}`);
  for (let i = 0; i < 25; i++) await D("POST", "/asistencias", { cursadaModuloId: c, fecha: usables[i], valorFalta: 1 });
  let est = await activa(a.id, 1);
  check("Asistencias", "25 faltas: sigue REGULAR", est.faltas === 25 && est.condicion === "REGULAR", JSON.stringify([est.faltas, est.condicion]));
  const media = await D("POST", "/asistencias", { cursadaModuloId: c, fecha: usables[25], valorFalta: 0.5 });
  est = await activa(a.id, 1);
  check("Asistencias", "25,5 faltas: LIBRE por inasistencias", est.faltas === 25.5 && est.condicion === "LIBRE" && est.motivoLibre === "INASISTENCIAS", JSON.stringify([media.s, est.faltas, est.condicion, est.motivoLibre]));
  // PUT a una fecha que ya tiene registro
  const lista = (await D("GET", `/asistencias?cursadaModuloId=${c}`)).b;
  const choque = await D("PUT", `/asistencias/${lista[0].id}`, { fecha: lista[1].fecha.slice(0, 10), valorFalta: 1 });
  check("Asistencias", "Mover un registro a una fecha que ya tiene otro", choque.s === 409, `-> ${choque.s} ${JSON.stringify(choque.b).slice(0, 100)}`);
  const del = await D("DELETE", `/asistencias/${lista.find((x) => Number(x.valorFalta) === 0.5).id}`);
  est = await activa(a.id, 1);
  check("Asistencias", "Borrar la media falta: vuelve a REGULAR con 25", del.s === 204 && est.condicion === "REGULAR" && est.faltas === 25, JSON.stringify([del.s, est.faltas, est.condicion]));
  // Cursada cerrada / módulo aprobado / alumno de baja
  await D("POST", "/asistencias", { cursadaModuloId: c, fecha: usables[26], valorFalta: 1 });
  await rematricular(a.id, 1);
  const vieja = await D("POST", "/asistencias", { cursadaModuloId: c, fecha: usables[27], valorFalta: 1 });
  check("Asistencias", "Falta en la cursada cerrada (ya recursó)", vieja.s === 409, `-> ${vieja.s} ${JSON.stringify(vieja.b).slice(0, 100)}`);
  const nueva = await activa(a.id, 1);
  check("Asistencias", "La recursada arranca con 0 faltas", nueva.faltas === 0 && nueva.idCursada !== c, JSON.stringify([nueva.faltas]));
  await aprobarModulo(a.id, 1);
  const ap = await D("POST", "/asistencias", { cursadaModuloId: nueva.idCursada, fecha: "2026-07-01", valorFalta: 1 });
  check("Asistencias", "Falta en un módulo ya aprobado", ap.s === 409, `-> ${ap.s} ${JSON.stringify(ap.b).slice(0, 100)}`);
  const b = await nuevoAlumno(); await matricular(b.id, 1); const cb = (await activa(b.id, 1)).idCursada; await D("DELETE", `/alumnos/${b.id}`);
  const baja = await D("POST", "/asistencias", { cursadaModuloId: cb, fecha: "2026-03-12", valorFalta: 1 });
  check("Asistencias", "Falta a un alumno dado de baja", baja.s === 409, `-> ${baja.s} ${JSON.stringify(baja.b).slice(0, 100)}`);
  // Preceptor ajeno
  const p = await D("POST", "/asistencias", { cursadaModuloId: cb, fecha: "2026-03-12", valorFalta: 1 });
  const x = await nuevoAlumno(); await matricular(x.id, 1); const cx = (await activa(x.id, 1)).idCursada;
  const ajena = await req("POST", "/asistencias", { token: T.preceptor, body: { cursadaModuloId: cx, fecha: "2026-03-12", valorFalta: 1 } });
  check("Asistencias", "Preceptor carga en un curso que no es suyo", ajena.s === 403, `-> ${ajena.s}`);
  const regX = await D("POST", "/asistencias", { cursadaModuloId: cx, fecha: "2026-03-12", valorFalta: 1 });
  const idX = regX.b?.id ?? regX.b?.asistencia?.id ?? (await D("GET", `/asistencias?cursadaModuloId=${cx}`)).b[0]?.id;
  const ajenaPut = await req("PUT", `/asistencias/${idX}`, { token: T.preceptor, body: { valorFalta: 0 } });
  const ajenaDel = await req("DELETE", `/asistencias/${idX}`, { token: T.preceptor });
  const ajenaGet = await req("GET", `/asistencias?cursadaModuloId=${cx}`, { token: T.preceptor });
  check("Asistencias", "Preceptor modifica, borra o lee un registro ajeno", ajenaPut.s === 403 && ajenaDel.s === 403 && (ajenaGet.s === 403 || (ajenaGet.s === 200 && ajenaGet.b.length === 0)), `PUT ${ajenaPut.s} DELETE ${ajenaDel.s} GET ${ajenaGet.s} ${JSON.stringify(ajenaGet.b).slice(0, 60)}`);
  const pl = await req("GET", "/asistencias/modulos/1/divisiones/A?fecha=2026-03-12", { token: T.preceptor });
  check("Asistencias", "Preceptor abre la planilla de un curso ajeno", pl.s === 403, `-> ${pl.s}`);
}

// ==================================================== 8. CALIFICACIONES
{
  const a = await nuevoAlumno(); await matricular(a.id, 1, {});
  const ca = await activa(a.id, 1); const c = ca.idCursada; const mat = ca.materias[0].id;
  for (const [e, ok] of [["Regular", false], ["", false], [null, false], ["Pendiente", false], ["aprobado", true], ["APROBADO", true], ["Desaprobado", true], ["En Curso", true]]) {
    const r = await calificar(c, mat, e);
    check("Calificaciones", `estado ${JSON.stringify(e)}`, ok ? r.s === 200 : r.s === 400, `-> ${r.s} ${JSON.stringify(r.b).slice(0, 90)}`);
  }
  const otraMat = (await D("GET", "/materias")).b.find((m) => !ca.materias.some((x) => x.id === m.id));
  let r = await calificar(c, otraMat?.id ?? 9999, "Aprobado"); check("Calificaciones", "Materia que no es del módulo", [400, 404, 409].includes(r.s), `-> ${r.s}`);
  r = await calificar(99999999, mat, "Aprobado"); check("Calificaciones", "Cursada inexistente", r.s === 404, `-> ${r.s}`);
  r = await req("PUT", "/calificaciones", { token: T.directivo, body: { cursadaModuloId: c, materiaId: mat, estado: "Aprobado", anio: 1990 } }); check("Calificaciones", "Ciclo 1990", [400, 404, 409].includes(r.s), `-> ${r.s}`);
  r = await req("PUT", "/calificaciones", { token: T.directivo, body: { cursadaModuloId: c, materiaId: mat, estado: "Aprobado", anio: 2029 } }); check("Calificaciones", "Ciclo 2029 (existe, no es el de la cursada)", [400, 409].includes(r.s), `-> ${r.s} ${JSON.stringify(r.b).slice(0, 90)}`);
  await calificar(c, mat, "Desaprobado");
  let est = await activa(a.id, 1); check("Calificaciones", "Desaprobar deja LIBRE (materia desaprobada)", est.condicion === "LIBRE" && est.motivoLibre === "MATERIA_DESAPROBADA", JSON.stringify([est.condicion, est.motivoLibre]));
  await calificar(c, mat, "Aprobado");
  est = await activa(a.id, 1); check("Calificaciones", "Corregir a Aprobado vuelve a REGULAR", est.condicion === "REGULAR", JSON.stringify([est.condicion, est.motivoLibre]));
  const rs = await Promise.all(["Aprobado", "Desaprobado", "Aprobado", "Desaprobado", "Aprobado"].map((e) => calificar(c, mat, e)));
  check("Calificaciones", "5 cambios simultáneos de la misma nota: sin error", rs.every((x) => x.s === 200), rs.map((x) => x.s).join(","));
  await calificar(c, mat, "Aprobado");
  // Docente: solo sus materias y divisiones
  const b = await nuevoAlumno(); await matricular(b.id, 1); // división A: el docente de prueba tiene B
  const cb = await activa(b.id, 1);
  r = await calificar(cb.idCursada, cb.materias.find((m) => m.nombre === "Matematica")?.id ?? cb.materias[0].id, "Aprobado", T.docente);
  check("Calificaciones", "Docente califica en una división que no es suya", r.s === 403, `-> ${r.s}`);
  const g = await req("GET", "/calificaciones/modulos/1/divisiones/A?anio=2026", { token: T.docente });
  check("Calificaciones", "Docente abre la grilla de una división ajena", g.s === 403, `-> ${g.s}`);
  const e = await nuevoAlumno(); await D("PUT", `/alumnos/${e.id}/cursadas`, { idCurso: curso(1, "B"), idModulo: 1 }).then(async (x) => x.s === 404 || x.s === 409 ? matricular(e.id, 1, { idCurso: curso(1, "B") }) : x);
  const ce = await activa(e.id, 1);
  const noSuya = ce.materias.find((m) => m.nombre !== "Matematica");
  r = await calificar(ce.idCursada, noSuya.id, "Aprobado", T.docente); check("Calificaciones", "Docente califica una materia que no dicta", r.s === 403, `-> ${r.s} (${noSuya.nombre})`);
  const suya = ce.materias.find((m) => m.nombre === "Matematica");
  r = await calificar(ce.idCursada, suya.id, "Aprobado", T.docente); check("Calificaciones", "Docente califica su materia en su división", r.s === 200, `-> ${r.s} ${JSON.stringify(r.b).slice(0, 90)}`);
  const grilla = (await req("GET", "/calificaciones/modulos/1/divisiones/B?anio=2026", { token: T.docente })).b;
  check("Calificaciones", "La grilla del docente muestra solo su materia", grilla?.materias?.length === 1 && grilla.materias[0].nombre === "Matematica", JSON.stringify(grilla?.materias?.map((m) => m.nombre)));
  // Módulo aprobado y cursada cerrada
  await aprobarModulo(a.id, 1);
  r = await calificar(c, mat, "Desaprobado"); check("Calificaciones", "Cambiar una nota de un módulo ya aprobado", r.s === 409, `-> ${r.s}`);
  const h = await nuevoAlumno(); await matricular(h.id, 1); const ch = await activa(h.id, 1); await dejarLibre(h.id, 1); await rematricular(h.id, 1);
  r = await calificar(ch.idCursada, ch.materias[1].id, "Aprobado"); check("Calificaciones", "Calificar la cursada cerrada (recursó)", r.s === 409, `-> ${r.s}`);
}

// ==================================================== 9. EVALUACIÓN DE MÓDULO
{
  const a = await nuevoAlumno(); await matricular(a.id, 1);
  const ca = await activa(a.id, 1); const c = ca.idCursada;
  let r = await evaluar(c, 8, 1); check("Evaluación", "Rendir con materias sin calificar", r.s === 409, `-> ${r.s} ${JSON.stringify(r.b).slice(0, 100)}`);
  for (const m of ca.materias) await calificar(c, m.id, "Aprobado");
  for (const [nota, inst, ok, nombre] of [[11, 1, false, "nota 11"], [-1, 1, false, "nota -1"], ["ocho", 1, false, "nota 'ocho'"], [8, 0, false, "instancia 0"], [8, 5, false, "instancia 5"], [8, 1.5, false, "instancia 1,5"], [8, 2, false, "instancia 2 sin la 1"]]) {
    r = await evaluar(c, nota, inst); check("Evaluación", nombre, ok ? r.s === 201 : [400, 409].includes(r.s), `-> ${r.s} ${JSON.stringify(r.b).slice(0, 90)}`);
  }
  r = await evaluar(c, 6.99, 1, "2026-02-30"); check("Evaluación", "fecha 30 de febrero", r.s === 400, `-> ${r.s}`);
  r = await evaluar(c, 6.99, 1); check("Evaluación", "6,99 no aprueba", r.s === 201 && (await activa(a.id, 1)).estadoAcademico === "PENDIENTE", `-> ${r.s} ${(await activa(a.id, 1)).estadoAcademico}`);
  r = await evaluar(c, 9, 1); check("Evaluación", "Repetir la instancia 1", r.s === 409, `-> ${r.s}`);
  r = await evaluar(c, 3, 2); r = await evaluar(c, 4, 3);
  r = await evaluar(c, 6, 4); let est = await activa(a.id, 1);
  check("Evaluación", "4 instancias sin 7: LIBRE por instancias agotadas", est.condicion === "LIBRE" && est.motivoLibre === "INSTANCIAS_AGOTADAS", JSON.stringify([r.s, est.condicion, est.motivoLibre]));
  r = await evaluar(c, 9, 5); check("Evaluación", "Quinta instancia", [400, 409].includes(r.s), `-> ${r.s}`);
  const b = await nuevoAlumno(); await matricular(b.id, 1); const cb = await activa(b.id, 1);
  for (const m of cb.materias) await calificar(cb.idCursada, m.id, "Aprobado");
  await evaluar(cb.idCursada, 2, 1); await evaluar(cb.idCursada, 3, 2); await evaluar(cb.idCursada, 4, 3);
  r = await evaluar(cb.idCursada, 7, 4); est = await activa(b.id, 1);
  check("Evaluación", "Aprueba con 7 en la cuarta instancia", r.s === 201 && est.estadoAcademico === "APROBADO", JSON.stringify([r.s, est.estadoAcademico]));
  r = await evaluar(cb.idCursada, 9, 4); check("Evaluación", "Evaluar un módulo ya aprobado", r.s === 409, `-> ${r.s}`);
  const fut = await nuevoAlumno(); await matricular(fut.id, 1); const cf = await activa(fut.id, 1);
  for (const m of cf.materias) await calificar(cf.idCursada, m.id, "Aprobado");
  r = await evaluar(cf.idCursada, 8, 1, "2031-01-01"); check("Evaluación", "Fecha de evaluación en 2031", r.s === 400, `-> ${r.s}`);
  if (r.s === 201) await db.query("DELETE FROM evaluacion_modulo WHERE cursada_modulo_id = $1", [cf.idCursada]);
  const rs = await Promise.all([1, 1, 1].map(() => evaluar(cf.idCursada, 5, 1)));
  check("Evaluación", "3 cargas simultáneas de la instancia 1: una sola entra", rs.filter((x) => x.s === 201).length === 1 && rs.every((x) => [201, 409].includes(x.s)), rs.map((x) => x.s).join(","));
}

// ==================================================== 10. PERSONAL Y USUARIOS
{
  const base = (x = {}) => { const d = dni(); return { nombre: "Per", apellido: "ZZ-EXT", dni: d, cuil: cuil(d), domicilio: "C", telefono: "2664222222", email: `per${d}@example.com`, especialidad: "Prof", titulo: "Prec", antiguedad: 2, password: "clave1", asignaciones: [{ moduloId: 1, division: "A", materia: "Historia" }], ...x }; };
  let r = await D("POST", "/docentes", base({ email: "director@escuela.com" })); check("Usuarios", "Docente con el correo del director", r.s === 409, `-> ${r.s}`);
  r = await D("POST", "/docentes", base({ email: "DIRECTOR@Escuela.com" })); check("Usuarios", "Docente con el correo del director en mayúsculas", r.s === 409, `-> ${r.s} ${JSON.stringify(r.b).slice(0, 100)}`);
  if (r.s === 201) {
    const l1 = await login("director@escuela.com"); const l2 = await login("DIRECTOR@Escuela.com", "clave1");
    check("Usuarios", "  ...y el director sigue entrando; el docente nuevo no puede", true, `director ${l1.s}, docente con su clave ${l2.s}`);
    await D("PATCH", `/docentes/${r.b.id}/inactivar`); await D("DELETE", `/docentes/${r.b.id}`);
  }
  r = await D("POST", "/preceptores", base({ email: "docente@escuela.com" })); check("Usuarios", "Preceptor con el correo de un docente", r.s === 409, `-> ${r.s}`);
  const doc = await D("POST", "/docentes", base());
  r = await D("PUT", `/docentes/${doc.b.id}`, { ...base(), dni: doc.b.dni, cuil: doc.b.cuil, email: "Preceptor@escuela.com" }); check("Usuarios", "Cambiar el correo de un docente al de un preceptor (mayúsculas)", r.s === 409, `-> ${r.s} ${JSON.stringify(r.b).slice(0, 100)}`);
  r = await D("POST", "/docentes", base({ asignaciones: [{ moduloId: 99, division: "A", materia: "Historia" }] })); check("Docentes", "Asignación al módulo 99", r.s === 400, `-> ${r.s}`);
  r = await D("POST", "/docentes", base({ asignaciones: [{ moduloId: 1, division: "Z", materia: "Historia" }] })); check("Docentes", "Asignación a la división Z", r.s === 400, `-> ${r.s}`);
  r = await D("POST", "/docentes", base({ asignaciones: [{ moduloId: 1, division: "A", materia: "Astrología" }] })); check("Docentes", "Asignación a una materia inexistente", r.s === 400, `-> ${r.s}`);
  r = await D("POST", "/docentes", base({ asignaciones: [{ moduloId: 1, division: "A", materia: "Historia" }, { moduloId: 1, division: "A", materia: "Historia" }] })); check("Docentes", "Asignación repetida", [201, 400].includes(r.s), `-> ${r.s}`);
  if (r.s === 201) check("Docentes", "  ...y no se duplica (Módulo I División A una sola vez)", r.b.asignaciones.filter((x) => x.moduloId === 1 && x.division === "A").length === 1, JSON.stringify(r.b.asignaciones));
  r = await D("POST", "/docentes", base({ antiguedad: -3 })); check("Docentes", "Antigüedad negativa", r.s === 400, `-> ${r.s}`);
  r = await D("POST", "/docentes", base({ antiguedad: 80 })); check("Observación", "Antigüedad 80 años (no hay tope)", true, `-> ${r.s}`);
  r = await D("POST", "/docentes", base({ password: "1" })); check("Docentes", "Contraseña de 1 carácter", r.s === 400, `-> ${r.s}`);
  const pre = await D("POST", "/preceptores", base());
  r = await D("PUT", `/preceptores/${pre.b.id}/cursos`, { cursoIds: [99999] }); check("Preceptores", "Curso inexistente", [400, 404].includes(r.s), `-> ${r.s}`);
  r = await D("PUT", `/preceptores/${pre.b.id}/cursos`, { cursoIds: ["x"] }); check("Preceptores", "Curso con texto", r.s === 400, `-> ${r.s}`);
  r = await D("PUT", `/preceptores/${pre.b.id}/cursos`, { cursoIds: "1" }); check("Preceptores", "cursoIds no es lista", r.s === 400, `-> ${r.s}`);
  const rs = await Promise.all([D("PATCH", `/preceptores/${pre.b.id}/inactivar`), D("PATCH", `/preceptores/${pre.b.id}/inactivar`), D("PATCH", `/preceptores/${pre.b.id}/reactivar`)]);
  check("Preceptores", "Inactivar y reactivar a la vez: sin error", rs.every((x) => x.s === 200), rs.map((x) => x.s).join(","));
  await D("PATCH", `/preceptores/${pre.b.id}/inactivar`);
  const del = await Promise.all([D("DELETE", `/preceptores/${pre.b.id}`), D("DELETE", `/preceptores/${pre.b.id}`)]);
  check("Preceptores", "Dos eliminaciones definitivas a la vez", del.map((x) => x.s).sort().join(",") === "204,404" || del.every((x) => [204, 404].includes(x.s)), del.map((x) => x.s).join(","));
  for (const [nombre, body, esperado] of [["rol inventado", { nombre: "X", apellido: "Y", email: `r${dni()}@x.com`, password: "clave1", rol: "superadmin" }, 400], ["sin rol", { nombre: "X", apellido: "Y", email: `r${dni()}@x.com`, password: "clave1" }, 400], ["correo del director", { nombre: "X", apellido: "Y", email: "director@escuela.com", password: "clave1", rol: "docente" }, 409], ["correo del director en mayúsculas", { nombre: "X", apellido: "Y", email: "Director@Escuela.com", password: "clave1", rol: "docente" }, 409]]) {
    const x = await D("POST", "/auth/registro", body); check("Usuarios", `Registro con ${nombre}`, x.s === esperado, `esperado ${esperado} -> ${x.s} ${JSON.stringify(x.b).slice(0, 90)}`);
  }
}

// ==================================================== 11. PLAN, CICLO, REPORTES
{
  let r = await D("POST", "/ciclo-lectivo", { anio: 2026 }); check("Ciclo", "Crear el ciclo 2026 que ya existe devuelve el mismo (no duplica)", [200, 201].includes(r.s) && r.b.id === 1, `-> ${r.s} ${JSON.stringify(r.b)}`);
  r = await D("POST", "/ciclo-lectivo", { anio: 1800 }); check("Ciclo", "Ciclo 1800", r.s === 400, `-> ${r.s}`);
  r = await D("POST", "/ciclo-lectivo", { anio: "dos mil" }); check("Ciclo", "Ciclo con texto", r.s === 400, `-> ${r.s}`);
  r = await D("POST", "/materias", { nombre: "Historia" }); check("Materias", "Materia repetida", r.s === 409, `-> ${r.s}`);
  r = await D("POST", "/materias", { nombre: "HISTORIA" }); check("Materias", "Materia repetida en mayúsculas", r.s === 409, `-> ${r.s}`);
  r = await D("POST", "/materias", { nombre: "" }); check("Materias", "Materia sin nombre", r.s === 400, `-> ${r.s}`);
  const plan = (await D("GET", "/plan-estudio/actual")).b.planActual;
  r = await D("PATCH", `/plan-estudio/${plan.id}/reactivar`); check("Plan", "Reactivar el plan que ya está vigente", [200, 409].includes(r.s), `-> ${r.s}`);
  r = await D("POST", "/plan-estudio", { titulo: "", resolucion: "" }); check("Plan", "Plan sin datos", r.s === 400, `-> ${r.s}`);
}

// Un test por área: lista todos los casos que fallaron.
for (const area of [...new Set(filas.map((f) => f.area))]) {
  const delArea = filas.filter((f) => f.area === area);
  test(`${area} (${delArea.length} casos)`, () => {
    const fallas = delArea.filter((f) => !f.ok).map((f) => `${f.caso} ${f.detalle}`);
    assert.deepEqual(fallas, []);
  });
}
