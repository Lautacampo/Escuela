/**
 * Pruebas de las reglas académicas (correlatividades desde el módulo de
 * ingreso, condición LIBRE, recursadas y egresados) contra la API real.
 *
 * Requisitos:
 *   1. Base LOCAL con database/schema.sql (incluye las migraciones 005 a 008).
 *   2. Backend corriendo:           npm run dev
 *   3. En otra terminal (backend/): npm run test:reglas
 *
 * Crea alumnos de prueba (apellido "ZZ-TEST") y no los borra: usar SOLO en una
 * base local. El script se niega a correr contra un host que no sea localhost.
 */
import "dotenv/config";
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";

const API = process.env.TEST_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}/api`;
const EMAIL = process.env.TEST_EMAIL ?? "director@escuela.com";
const PASSWORD = process.env.TEST_PASSWORD ?? "1234";
const CICLO = Number(process.env.TEST_CICLO ?? new Date().getFullYear());

if (!["localhost", "127.0.0.1"].includes(new URL(API).hostname)) {
  throw new Error("Estas pruebas escriben datos: solo se ejecutan contra localhost.");
}
if (process.env.DATABASE_URL) {
  throw new Error("Hay un DATABASE_URL configurado (Neon). Usá una base local para las pruebas.");
}

let token;
let cursos;
const M = {}; // id de módulo por número romano: M.I, M.II, ...
const db = new pg.Pool({
  host: process.env.PGHOST ?? "localhost",
  port: Number(process.env.PGPORT ?? 5432),
  user: process.env.PGUSER ?? "postgres",
  password: process.env.PGPASSWORD,
  database: process.env.PGDATABASE,
  max: 2,
});

// ----------------------------------------------------------------- helpers
async function api(method, ruta, body) {
  const res = await fetch(`${API}${ruta}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const texto = await res.text();
  return { status: res.status, body: texto ? JSON.parse(texto) : null };
}

async function ok(method, ruta, body, esperado = 200) {
  const r = await api(method, ruta, body);
  assert.equal(r.status, esperado, `${method} ${ruta} -> ${r.status} ${JSON.stringify(r.body)}`);
  return r.body;
}

async function falla(method, ruta, body, esperado, patron) {
  const r = await api(method, ruta, body);
  assert.equal(r.status, esperado, `${method} ${ruta} debía fallar con ${esperado} y devolvió ${r.status} ${JSON.stringify(r.body)}`);
  if (patron) assert.match(r.body.error, patron);
  return r.body;
}

let secuencia = 0;
function cuilDe(dni) {
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  for (const prefijo of ["20", "27", "23", "24"]) {
    const d = (prefijo + dni).split("").map(Number);
    let dv = 11 - (pesos.reduce((a, p, i) => a + p * d[i], 0) % 11);
    if (dv === 11) dv = 0;
    if (dv < 10) return `${prefijo}-${dni}-${dv}`;
  }
  return `20-${dni}-0`;
}

// Sufijo solo con letras: el nombre no admite números.
const letras = (n) => {
  let texto = "";
  for (let x = n; x > 0; x = Math.floor((x - 1) / 26)) {
    texto = String.fromCharCode(97 + ((x - 1) % 26)) + texto;
  }
  return texto;
};

function datosAlumno(extra = {}) {
  secuencia += 1;
  const dni = String(80000000 + Math.floor(Math.random() * 9000000) + secuencia);
  return {
    nombre: `Caso${letras(secuencia)}`,
    apellido: "ZZ-TEST",
    dni,
    cuil: cuilDe(dni),
    fechaNacimiento: "1990-05-10",
    lugarNacimiento: "San Luis",
    domicilio: "Calle Falsa 123",
    telefono: "2664000000",
    // Derivado del DNI: dos alumnos no pueden tener el mismo correo.
    email: `caso${dni}@example.com`,
    trabaja: false,
    telefonoEmergencia: "2664111111",
    cantidadHijos: 0,
    ...extra,
  };
}

const crearAlumno = async () => (await ok("POST", "/alumnos", datosAlumno(), 201)).id;
const ficha = (id) => ok("GET", `/alumnos/${id}`);

// Curso del ciclo vigente que dicta ese módulo (división A por defecto).
function cursoDe(moduloId, division = "A") {
  const curso = cursos.find(
    (c) => c.division.trim() === division && c.modulos.some((m) => m.id === moduloId),
  );
  assert.ok(curso, `No hay curso división ${division} para el módulo ${moduloId}`);
  return curso.id;
}

const matricula = (moduloId, extra = {}) => ({
  idCurso: cursoDe(moduloId, extra.division),
  idModulo: moduloId,
});

const alta = (id, moduloId, extra) => api("POST", `/alumnos/${id}/cursadas`, matricula(moduloId, extra));
const cambiar = (id, moduloId, extra) => api("PUT", `/alumnos/${id}/cursadas`, matricula(moduloId, extra));

async function cursadaActiva(id) {
  const a = await ficha(id);
  const c = a.trayectoria.find((x) => x.activa);
  assert.ok(c, "El alumno no tiene cursada activa");
  return c;
}

async function calificar(cursada, estado, cuantas = Infinity) {
  let ultimo;
  for (const materia of cursada.materias.slice(0, cuantas)) {
    ultimo = await ok("PUT", "/calificaciones", {
      cursadaModuloId: cursada.idCursada,
      materiaId: materia.id,
      estado,
      anio: cursada.cicloLectivo,
    });
  }
  return ultimo;
}

const evaluar = (cursadaId, nroInstancia, nota) =>
  api("POST", "/alumnos/evaluaciones-modulo", {
    idCursadaModulo: cursadaId,
    fecha: `${CICLO}-11-1${nroInstancia}`,
    nota,
    nroInstancia,
  });

// Aprueba el módulo activo: todas las materias + evaluación con 8.
async function aprobarActivo(id) {
  const c = await cursadaActiva(id);
  await calificar(c, "Aprobado");
  const r = await evaluar(c.idCursada, c.evaluaciones.length + 1, 8);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.estadoAcademico, "APROBADO");
  return c;
}

// Deja LIBRE el módulo activo desaprobando una materia.
async function dejarLibreActivo(id) {
  const c = await cursadaActiva(id);
  const r = await calificar(c, "Desaprobado", 1);
  assert.equal(r.condicion, "LIBRE");
  return c;
}

// Días de clase de la cursada hasta hoy: de lunes a viernes, de marzo a julio
// (módulos I, III y V) o de agosto a diciembre (II, IV y VI).
const HOY = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
async function diasDeClase(cursadaId) {
  const { rows } = await db.query(
    "SELECT m.periodo FROM cursada_modulo cm JOIN modulo m ON m.id = cm.modulo_id WHERE cm.id = $1",
    [cursadaId],
  );
  const [desde, hasta] = rows[0]?.periodo === 2 ? [8, 12] : [3, 7];
  const dias = [];
  for (let d = new Date(Date.UTC(CICLO, desde - 1, 1)); d.getUTCMonth() <= hasta - 1 && d.getUTCFullYear() === CICLO; d.setUTCDate(d.getUTCDate() + 1)) {
    const fecha = d.toISOString().slice(0, 10);
    if (fecha > HOY) break;
    if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) dias.push(fecha);
  }
  return dias;
}

async function faltar(cursadaId, cantidad, valor = 1, desdeDia = 1) {
  const dias = await diasDeClase(cursadaId);
  let ultimo;
  for (let i = 0; i < cantidad; i++) {
    const fecha = dias[desdeDia - 1 + i];
    assert.ok(fecha, `No quedan días de clase para cargar la falta ${desdeDia + i}`);
    ultimo = await ok("POST", "/asistencias", { cursadaModuloId: cursadaId, fecha, valorFalta: valor }, 201);
  }
  return ultimo;
}

const situacion = async (id, cursadaId) => {
  const a = await ficha(id);
  const c = a.trayectoria.find((x) => x.idCursada === cursadaId);
  return { condicion: c.condicion, estado: c.estadoAcademico, motivo: c.motivoLibre, faltas: c.faltas, cursada: c, alumno: a };
};

// ------------------------------------------------------------------- setup
before(async () => {
  const login = await api("POST", "/auth/login", { email: EMAIL, password: PASSWORD });
  assert.equal(login.status, 200, "No se pudo iniciar sesión como directivo");
  token = login.body.token;

  cursos = await ok("GET", "/cursos");
  for (const curso of cursos) {
    for (const m of curso.modulos) {
      const romano = m.numeroLeyenda.replace(/^\s*m[oó]dulo\s*/i, "").trim().toUpperCase();
      M[romano] = m.id;
    }
  }
  for (const r of ["I", "II", "III", "IV", "V", "VI"]) {
    assert.ok(M[r], `Falta el Módulo ${r} en los cursos del ciclo vigente`);
  }
});

after(() => db.end());

// ====================================================== A. ALTA / MATRÍCULA
test("A1. Alta en Módulo I: queda REGULAR y EN_CURSO", async () => {
  const id = await crearAlumno();
  const r = await alta(id, M.I);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  const c = await cursadaActiva(id);
  assert.deepEqual([c.condicion, c.estadoAcademico, c.motivoLibre], ["REGULAR", "EN_CURSO", null]);
});

test("A2. Alta directa en Módulo III: permitida, es su módulo de ingreso", async () => {
  const id = await crearAlumno();
  const r = await alta(id, M.III);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.tipo, "NUEVA");
  const a = await ficha(id);
  assert.equal(a.moduloId, M.III);
  assert.equal(a.moduloIngresoId, M.III);
  // Los anteriores al ingreso no se le exigen: cuentan como acreditados.
  assert.deepEqual(a.modulosAcreditados, [M.I, M.II]);
  assert.equal(a.equivalencias, undefined, "Ya no hay equivalencias");
});

test("A3. Alta directa en Módulo V y en Módulo VI: permitidas", async () => {
  for (const modulo of [M.V, M.VI]) {
    const id = await crearAlumno();
    const r = await alta(id, modulo);
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal((await ficha(id)).moduloIngresoId, modulo);
  }
});

test("A4. Si llega el campo equivalencias, se ignora", async () => {
  const id = await crearAlumno();
  const r = await api("POST", `/alumnos/${id}/cursadas`, {
    idCurso: cursoDe(M.III), idModulo: M.III, equivalencias: [M.I], observacionEquivalencia: "x".repeat(400),
  });
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal((await api("POST", `/alumnos/${id}/equivalencias`, { modulosIds: [M.I] })).status, 404);
});

test("A5. Ingresó en III: no pasa a V sin III y IV aprobados (no pide I ni II)", async () => {
  const id = await crearAlumno();
  await alta(id, M.III);
  const c = await cursadaActiva(id);
  await faltar(c.idCursada, 1);
  const r = await cambiar(id, M.V);
  assert.equal(r.status, 409);
  assert.match(r.body.error, /Modulo III \(todavía sin aprobar\)/);
  assert.match(r.body.error, /Modulo IV \(sin cursar\)/);
  assert.doesNotMatch(r.body.error, /Modulo I \(|Modulo II \(/);
});

test("A6. Ingresó en III y aprobó III y IV: pasa a V y puede acreditarlo", async () => {
  const id = await crearAlumno();
  await alta(id, M.III);
  await aprobarActivo(id);
  assert.equal((await cambiar(id, M.IV)).status, 200);
  await aprobarActivo(id);
  assert.equal((await cambiar(id, M.V)).status, 200);
  const c = await cursadaActiva(id);
  assert.deepEqual(c.correlativosPendientes, []);
  await aprobarActivo(id);
});

test("A7. Ingresó en I y aprobó I: III pide II aunque nunca lo cursó", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  await aprobarActivo(id);
  const r = await cambiar(id, M.III);
  assert.equal(r.status, 409);
  assert.match(r.body.error, /Modulo II \(sin cursar\)/);
  assert.deepEqual(r.body.pendientes.map((p) => [p.id, p.estado]), [[M.II, null]]);
});

test("A8. Alta directa en Módulo II sin Módulo I: permitida (mismo año)", async () => {
  const id = await crearAlumno();
  assert.equal((await alta(id, M.II)).status, 201);
});

test("A9. Ingresó en IV: para V solo pide IV (III es anterior a su ingreso)", async () => {
  const id = await crearAlumno();
  assert.equal((await alta(id, M.IV)).status, 201);
  const c = await cursadaActiva(id);
  await faltar(c.idCursada, 1);
  const r = await cambiar(id, M.V);
  assert.equal(r.status, 409);
  assert.match(r.body.error, /Modulo IV \(todavía sin aprobar\)/);
  assert.doesNotMatch(r.body.error, /Modulo III/);
  await aprobarActivo(id);
  assert.equal((await cambiar(id, M.V)).status, 200);
});

test("A10. Módulo que no pertenece al curso: 400", async () => {
  const id = await crearAlumno();
  const r = await api("POST", `/alumnos/${id}/cursadas`, { idCurso: cursoDe(M.I), idModulo: M.III });
  assert.equal(r.status, 400);
});

test("A11. Segunda alta con cursada activa: 409", async () => {
  const id = await crearAlumno();
  assert.equal((await alta(id, M.I)).status, 201);
  assert.equal((await alta(id, M.II)).status, 409);
});

test("A12. Campos obligatorios del alumno: mensaje claro por cada uno", async () => {
  for (const [campo, patron] of [
    ["lugarNacimiento", /lugar de nacimiento es obligatorio/],
    ["domicilio", /domicilio es obligatorio/],
    ["telefonoEmergencia", /teléfono de emergencia es obligatorio/],
    ["cuil", /CUIL es obligatorio/],
  ]) {
    await falla("POST", "/alumnos", datosAlumno({ [campo]: "  " }), 400, patron);
  }
});

// ============================================================ B. PROGRESIÓN
test("B1. Trayectoria completa I -> VI respetando correlatividades", async () => {
  const id = await crearAlumno();
  assert.equal((await alta(id, M.I)).status, 201);
  for (const [actual, siguiente] of [["I", "II"], ["II", "III"], ["III", "IV"], ["IV", "V"], ["V", "VI"]]) {
    await aprobarActivo(id);
    const r = await cambiar(id, M[siguiente]);
    assert.equal(r.status, 200, `${actual} -> ${siguiente}: ${JSON.stringify(r.body)}`);
  }
  await aprobarActivo(id);
  const a = await ficha(id);
  assert.deepEqual(a.modulosAcreditados, [M.I, M.II, M.III, M.IV, M.V, M.VI]);
  // Con los 6 módulos aprobados es egresado: ya no se lo matricula.
  await falla("PUT", `/alumnos/${id}/cursadas`, matricula(M.VI), 409, /egresado/);
  await falla("PUT", `/alumnos/${id}/cursadas`, matricula(M.I), 409, /egresado/);
});

test("B2. No se saltea de año: de I (en curso, con faltas) a III está bloqueado", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  await faltar((await cursadaActiva(id)).idCursada, 1);
  const r = await cambiar(id, M.III);
  assert.equal(r.status, 409);
  assert.equal((await cursadaActiva(id)).moduloId, M.I, "La matrícula no debe cambiar");

  // Sin datos cargados es una corrección de la matrícula: se permite.
  const otro = await crearAlumno();
  await alta(otro, M.I);
  const corregida = await cambiar(otro, M.III);
  assert.equal(corregida.status, 200, JSON.stringify(corregida.body));
  assert.equal(corregida.body.matricula, "CORREGIDA");
  assert.equal((await ficha(otro)).moduloIngresoId, M.III);
});

test("B3. Con I aprobado y II en curso no pasa a 2.º año", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  await aprobarActivo(id);
  assert.equal((await cambiar(id, M.II)).status, 200);
  const r = await cambiar(id, M.III);
  assert.equal(r.status, 409);
  assert.match(r.body.error, /Modulo II \(todavía sin aprobar\)/);
  assert.doesNotMatch(r.body.error, /Modulo I \(/);
  assert.equal((await cambiar(id, M.IV)).status, 409);
});

test("B4. IV antes que III está permitido, pero V exige ambos", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  await aprobarActivo(id);
  await cambiar(id, M.II);
  await aprobarActivo(id);
  assert.equal((await cambiar(id, M.IV)).status, 200);
  await aprobarActivo(id);
  const r = await cambiar(id, M.V);
  assert.equal(r.status, 409);
  assert.match(r.body.error, /Modulo III/);
  assert.equal((await cambiar(id, M.VI)).status, 409);
  assert.equal((await cambiar(id, M.III)).status, 200);
  await aprobarActivo(id);
  assert.equal((await cambiar(id, M.V)).status, 200);
});

// ================================================================ C. LIBRE
test("C1. Inasistencias: 25 faltas sigue REGULAR; al superarlas queda LIBRE", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const c = await cursadaActiva(id);

  await faltar(c.idCursada, 25);
  let s = await situacion(id, c.idCursada);
  assert.deepEqual([s.condicion, s.estado, s.faltas], ["REGULAR", "EN_CURSO", 25]);

  const media = await faltar(c.idCursada, 1, 0.5, 26);
  assert.equal(media.condicion, "Libre");
  assert.equal(media.motivoLibre, "INASISTENCIAS");
  s = await situacion(id, c.idCursada);
  assert.deepEqual([s.condicion, s.estado, s.motivo], ["LIBRE", "A_RECURSAR", "INASISTENCIAS"]);
  assert.equal(s.alumno.condicion, "LIBRE");

  // Libre por faltas: aunque tenga todas las materias aprobadas no rinde.
  await calificar(s.cursada, "Aprobado");
  const r = await evaluar(c.idCursada, 1, 9);
  assert.equal(r.status, 409);
  assert.match(r.body.error, /LIBRE.*inasistencias/);

  // Si el preceptor corrige la falta mal cargada, recupera la regularidad.
  await ok("PUT", `/asistencias/${media.id}`, { valorFalta: 0 });
  s = await situacion(id, c.idCursada);
  assert.deepEqual([s.condicion, s.estado, s.motivo], ["REGULAR", "EN_CURSO", null]);

  // Y si se borra un registro, se vuelve a calcular.
  await ok("PUT", `/asistencias/${media.id}`, { valorFalta: 1 });
  assert.equal((await situacion(id, c.idCursada)).condicion, "LIBRE");
  await ok("DELETE", `/asistencias/${media.id}`, undefined, 204);
  assert.equal((await situacion(id, c.idCursada)).condicion, "REGULAR");
});

test("C2. Materia desaprobada: queda LIBRE y no puede rendir el módulo", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const c = await cursadaActiva(id);
  await calificar(c, "Aprobado");
  const materia = c.materias[2];

  const r = await ok("PUT", "/calificaciones", {
    cursadaModuloId: c.idCursada, materiaId: materia.id, estado: "Desaprobado", anio: c.cicloLectivo,
  });
  assert.deepEqual([r.condicion, r.estadoAcademico, r.motivoLibre], ["LIBRE", "A_RECURSAR", "MATERIA_DESAPROBADA"]);

  const ev = await evaluar(c.idCursada, 1, 10);
  assert.equal(ev.status, 409);
  assert.match(ev.body.error, /LIBRE.*materia del módulo desaprobada/);
  const f = (await situacion(id, c.idCursada)).cursada;
  assert.equal(f.evaluable, false);
  assert.equal(f.evaluaciones.length, 0);

  // Corrección de una nota mal cargada: vuelve a REGULAR y puede rendir.
  const corr = await ok("PUT", "/calificaciones", {
    cursadaModuloId: c.idCursada, materiaId: materia.id, estado: "Aprobado", anio: c.cicloLectivo,
  });
  assert.deepEqual([corr.condicion, corr.estadoAcademico, corr.motivoLibre], ["REGULAR", "EN_CURSO", null]);
  assert.equal((await evaluar(c.idCursada, 1, 7)).status, 201);
});

test("C3. Materias sin calificar: no rinde, pero NO queda libre", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const c = await cursadaActiva(id);
  await calificar(c, "Aprobado", c.materias.length - 1);
  const r = await evaluar(c.idCursada, 1, 8);
  assert.equal(r.status, 409);
  assert.match(r.body.error, /materias del módulo deben estar aprobadas/);
  const s = await situacion(id, c.idCursada);
  assert.deepEqual([s.condicion, s.estado], ["REGULAR", "EN_CURSO"]);
});

test("C4. Agota las 4 instancias: PENDIENTE en las 3 primeras y LIBRE en la 4.ª", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const c = await cursadaActiva(id);
  await calificar(c, "Aprobado");

  for (const [n, nota] of [[1, 4], [2, 6.99], [3, 0]]) {
    const r = await evaluar(c.idCursada, n, nota);
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.deepEqual([r.body.estadoAcademico, r.body.condicion], ["PENDIENTE", "REGULAR"]);
  }
  const cuarta = await evaluar(c.idCursada, 4, 6);
  assert.equal(cuarta.status, 201);
  assert.deepEqual(
    [cuarta.body.estadoAcademico, cuarta.body.condicion, cuarta.body.motivoLibre, cuarta.body.aprobado],
    ["A_RECURSAR", "LIBRE", "INSTANCIAS_AGOTADAS", false],
  );
  assert.equal((await evaluar(c.idCursada, 5, 10)).status, 400);
  const otra = await evaluar(c.idCursada, 4, 10);
  assert.equal(otra.status, 409);
  assert.match(otra.body.error, /LIBRE.*4 instancias/);
});

test("C5. Aprueba justo en la 4.ª instancia con 7: APROBADO, no libre", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const c = await cursadaActiva(id);
  await calificar(c, "Aprobado");
  for (const n of [1, 2, 3]) assert.equal((await evaluar(c.idCursada, n, 6.5)).status, 201);
  const r = await evaluar(c.idCursada, 4, 7);
  assert.equal(r.status, 201);
  assert.deepEqual([r.body.estadoAcademico, r.body.condicion, r.body.motivoLibre], ["APROBADO", "REGULAR", null]);
});

test("C6. Instancia salteada o repetida: 409 y no se guarda", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const c = await cursadaActiva(id);
  await calificar(c, "Aprobado");
  assert.equal((await evaluar(c.idCursada, 2, 8)).status, 409);
  assert.equal((await evaluar(c.idCursada, 1, 5)).status, 201);
  assert.equal((await evaluar(c.idCursada, 1, 8)).status, 409);
  assert.equal((await situacion(id, c.idCursada)).cursada.evaluaciones.length, 1);
});

test("C7. Módulo aprobado es definitivo: ni notas ni faltas lo cambian", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const c = await aprobarActivo(id);
  const r = await api("PUT", "/calificaciones", {
    cursadaModuloId: c.idCursada, materiaId: c.materias[0].id, estado: "Desaprobado", anio: c.cicloLectivo,
  });
  assert.equal(r.status, 409);
  assert.match(r.body.error, /ya está aprobado/);
  // La API ya no deja cargarle faltas...
  const falta = await api("POST", "/asistencias", { cursadaModuloId: c.idCursada, fecha: `${CICLO}-05-04`, valorFalta: 1 });
  assert.equal(falta.status, 409);
  // ...y aunque se carguen directo en la base, el módulo sigue aprobado.
  await db.query(
    `INSERT INTO asistencia (cursada_modulo_id, fecha, valor_falta)
     SELECT $1, DATE '${CICLO}-03-01' + g, 1 FROM generate_series(0, 26) g`,
    [c.idCursada],
  );
  const s = await situacion(id, c.idCursada);
  assert.deepEqual([s.condicion, s.estado, s.motivo], ["REGULAR", "APROBADO", null]);
  assert.equal((await evaluar(c.idCursada, 2, 9)).status, 409);
});

test("C8. Dos motivos a la vez: al corregir uno sigue LIBRE por el otro", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const c = await cursadaActiva(id);
  await faltar(c.idCursada, 26);
  await calificar(c, "Desaprobado", 1);
  assert.equal((await situacion(id, c.idCursada)).motivo, "INASISTENCIAS");
  await calificar(c, "Aprobado", 1);
  let s = await situacion(id, c.idCursada);
  assert.deepEqual([s.condicion, s.motivo], ["LIBRE", "INASISTENCIAS"]);
  await calificar(c, "Desaprobado", 1);
  const registros = await ok("GET", `/asistencias?cursadaModuloId=${c.idCursada}`);
  await ok("DELETE", `/asistencias/${registros[0].id}`, undefined, 204);
  s = await situacion(id, c.idCursada);
  assert.deepEqual([s.condicion, s.motivo, s.faltas], ["LIBRE", "MATERIA_DESAPROBADA", 25]);
});

// ============================================================ D. RECURSADAS
test("D1. Libre en I + aprueba II: no pasa a 2.º, recursa I y recién ahí pasa (caso reportado)", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const primera = await dejarLibreActivo(id);

  // Puede seguir con el Módulo II en el segundo período.
  assert.equal((await cambiar(id, M.II)).status, 200);
  await aprobarActivo(id);

  // No pasa de año: le falta el Módulo I.
  for (const destino of [M.III, M.IV]) {
    const r = await cambiar(id, destino);
    assert.equal(r.status, 409);
    assert.match(r.body.error, /Modulo I \(quedó libre: debe recursarlo\)/);
    assert.equal(r.body.pendientes[0].estado, "A_RECURSAR");
  }

  // Recursa el Módulo I: nueva cursada limpia; la anterior queda en el historial.
  const r = await cambiar(id, M.I);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.matricula, "RECURSADA");
  const a = await ficha(id);
  const deI = a.trayectoria.filter((c) => c.moduloId === M.I);
  assert.equal(deI.length, 2);
  const [vieja, nueva] = deI;
  assert.equal(vieja.idCursada, primera.idCursada);
  assert.deepEqual([vieja.condicion, vieja.estadoAcademico, vieja.activa], ["LIBRE", "A_RECURSAR", false]);
  assert.deepEqual([nueva.condicion, nueva.estadoAcademico, nueva.activa, nueva.faltas], ["REGULAR", "EN_CURSO", true, 0]);
  assert.ok(nueva.materias.every((m) => m.estado === "En Curso"), "La recursada arranca sin notas");
  assert.equal(a.condicion, "REGULAR");

  // En la grilla y en la planilla del curso aparece una sola vez (la recursada).
  const grilla = await ok("GET", `/calificaciones/modulos/${M.I}/divisiones/A?anio=${nueva.cicloLectivo}`);
  const enGrilla = grilla.alumnos.filter((x) => [vieja.idCursada, nueva.idCursada].includes(x.cursadaId));
  assert.deepEqual(enGrilla.map((x) => x.cursadaId), [nueva.idCursada]);
  const planilla = await ok("GET", `/asistencias/modulos/${M.I}/divisiones/A?fecha=${CICLO}-04-01`);
  assert.equal(planilla.alumnos.filter((x) => x.alumnoId === id).length, 1);

  // Aprueba la recursada y ahora sí pasa a 2.º año.
  await aprobarActivo(id);
  assert.equal((await cambiar(id, M.III)).status, 200);
});

test("D2. Libre en III + aprueba IV: no pasa a 3.º hasta recursar y aprobar III", async () => {
  const id = await crearAlumno();
  await alta(id, M.III);
  await dejarLibreActivo(id);
  assert.equal((await cambiar(id, M.IV)).status, 200);
  await aprobarActivo(id);
  for (const destino of [M.V, M.VI]) {
    const r = await cambiar(id, destino);
    assert.equal(r.status, 409);
    assert.match(r.body.error, /Modulo III \(quedó libre/);
  }
  const r = await cambiar(id, M.III);
  assert.equal(r.body.matricula, "RECURSADA");
  await aprobarActivo(id);
  assert.equal((await cambiar(id, M.V)).status, 200);
});

test("D3. Libre y rematriculado en el MISMO módulo y curso: crea la recursada (no reutiliza la cursada libre)", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const libre = await cursadaActiva(id);
  await faltar(libre.idCursada, 26);
  const r = await cambiar(id, M.I);
  assert.equal(r.status, 200, JSON.stringify(r.body));
  assert.equal(r.body.matricula, "RECURSADA");
  const nueva = await cursadaActiva(id);
  assert.notEqual(nueva.idCursada, libre.idCursada);
  assert.deepEqual([nueva.condicion, nueva.faltas], ["REGULAR", 0]);
  const s = await situacion(id, libre.idCursada);
  assert.deepEqual([s.condicion, s.faltas, s.cursada.activa], ["LIBRE", 26, false]);
});

test("D4. Puede quedar libre otra vez en la recursada y volver a recursar", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  await dejarLibreActivo(id);
  assert.equal((await cambiar(id, M.I)).body.matricula, "RECURSADA");
  await dejarLibreActivo(id);
  assert.equal((await cambiar(id, M.I)).body.matricula, "RECURSADA");
  const a = await ficha(id);
  assert.equal(a.trayectoria.filter((c) => c.moduloId === M.I).length, 3);
  assert.equal(a.trayectoria.filter((c) => c.activa).length, 1);
});

test("D5. Módulo I PENDIENTE: sigue con II y rinde la instancia que le queda de I", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const cI = await cursadaActiva(id);
  await calificar(cI, "Aprobado");
  assert.equal((await evaluar(cI.idCursada, 1, 5)).body.estadoAcademico, "PENDIENTE");

  assert.equal((await cambiar(id, M.II)).status, 200);
  await aprobarActivo(id);
  const bloqueo = await cambiar(id, M.III);
  assert.equal(bloqueo.status, 409);
  assert.match(bloqueo.body.error, /Modulo I \(todavía sin aprobar\)/);

  // Mesa de febrero/marzo: rinde la 2.ª instancia del Módulo I (cursada no activa).
  const pendiente = (await situacion(id, cI.idCursada)).cursada;
  assert.deepEqual([pendiente.activa, pendiente.evaluable, pendiente.proximaInstancia], [false, true, 2]);
  const r = await evaluar(cI.idCursada, 2, 8);
  assert.equal(r.status, 201, JSON.stringify(r.body));
  assert.equal(r.body.estadoAcademico, "APROBADO");
  assert.equal((await cambiar(id, M.III)).status, 200);
});

test("D6. Volver a un módulo con cursada abierta la reactiva (no la duplica)", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const cI = await cursadaActiva(id);
  await faltar(cI.idCursada, 2);
  assert.equal((await cambiar(id, M.II)).body.matricula, "NUEVA");
  const r = await cambiar(id, M.I);
  assert.equal(r.body.matricula, "REACTIVADA");
  const a = await ficha(id);
  assert.equal(a.trayectoria.length, 1, "La cursada vacía de II se descarta");
  assert.deepEqual([a.trayectoria[0].idCursada, a.trayectoria[0].activa, a.trayectoria[0].faltas], [cI.idCursada, true, 2]);
});

test("D7. Corrección de una matrícula mal cargada y cambio de división", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const original = await cursadaActiva(id);

  const corregida = await cambiar(id, M.II);
  assert.equal(corregida.body.matricula, "CORREGIDA");
  assert.equal((await cursadaActiva(id)).idCursada, original.idCursada);

  const division = await cambiar(id, M.II, { division: "B" });
  assert.equal(division.body.matricula, "CAMBIO_DE_CURSO");
  const c = await cursadaActiva(id);
  assert.deepEqual([c.idCursada, c.division.trim()], [original.idCursada, "B"]);

  assert.equal((await cambiar(id, M.II, { division: "B" })).body.matricula, "SIN_CAMBIOS");
  assert.equal((await ficha(id)).trayectoria.length, 1);
});

test("D8. La cursada libre ya recursada queda cerrada: no se le cambian notas ni faltas", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const vieja = await cursadaActiva(id);
  const falta = await faltar(vieja.idCursada, 1);
  await calificar(vieja, "Desaprobado", 1);
  assert.equal((await cambiar(id, M.I)).body.matricula, "RECURSADA");

  const nota = await api("PUT", "/calificaciones", {
    cursadaModuloId: vieja.idCursada, materiaId: vieja.materias[0].id, estado: "Aprobado", anio: vieja.cicloLectivo,
  });
  assert.equal(nota.status, 409);
  assert.match(nota.body.error, /cursada está cerrada/);
  assert.equal((await api("POST", "/asistencias", { cursadaModuloId: vieja.idCursada, fecha: `${CICLO}-06-01`, valorFalta: 1 })).status, 409);
  assert.equal((await api("PUT", `/asistencias/${falta.id}`, { valorFalta: 0 })).status, 409);
  assert.equal((await api("DELETE", `/asistencias/${falta.id}`)).status, 409);
  assert.equal((await evaluar(vieja.idCursada, 1, 9)).status, 409);

  // Ni siquiera un cambio directo en la base la reabre.
  await db.query("DELETE FROM calificacion WHERE cursada_modulo_id = $1", [vieja.idCursada]);
  const s = await situacion(id, vieja.idCursada);
  assert.deepEqual([s.condicion, s.estado, s.cursada.activa], ["LIBRE", "A_RECURSAR", false]);
});

test("D9. Libre y rematriculado en OTRA división: sale del listado viejo y arranca en cero", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const vieja = await cursadaActiva(id);
  await faltar(vieja.idCursada, 26);
  const r = await cambiar(id, M.I, { division: "B" });
  assert.equal(r.body.matricula, "RECURSADA");
  const nueva = await cursadaActiva(id);
  assert.deepEqual([nueva.division.trim(), nueva.faltas, nueva.condicion], ["B", 0, "REGULAR"]);
  assert.ok(nueva.materias.every((m) => m.estado === "En Curso"));

  const enA = await ok("GET", `/asistencias/modulos/${M.I}/divisiones/A?fecha=${CICLO}-04-01`);
  assert.ok(!enA.alumnos.some((x) => x.alumnoId === id), "Ya no figura en la división anterior");
  const enB = await ok("GET", `/asistencias/modulos/${M.I}/divisiones/B?fecha=${CICLO}-04-01`);
  assert.deepEqual(enB.alumnos.filter((x) => x.alumnoId === id).map((x) => x.faltasAcumuladas), [0]);
  const grillaA = await ok("GET", `/calificaciones/modulos/${M.I}/divisiones/A?anio=${nueva.cicloLectivo}`);
  assert.ok(!grillaA.alumnos.some((x) => x.cursadaId === vieja.idCursada));
  const grillaB = await ok("GET", `/calificaciones/modulos/${M.I}/divisiones/B?anio=${nueva.cicloLectivo}`);
  assert.ok(grillaB.alumnos.some((x) => x.cursadaId === nueva.idCursada));
});

// ============================================ E. SIN EQUIVALENCIAS (008)
test("E1. Ya no hay equivalencias: la ruta no existe y la ficha no las trae", async () => {
  const id = await crearAlumno();
  assert.equal((await api("POST", `/alumnos/${id}/equivalencias`, { modulosIds: [M.I] })).status, 404);
  const a = await ficha(id);
  assert.equal(a.equivalencias, undefined);
  assert.equal(a.moduloIngresoId, null);
  assert.deepEqual(a.modulosAcreditados, []);
  const tabla = await db.query("SELECT to_regclass('public.equivalencia_modulo') AS tabla");
  assert.equal(tabla.rows[0].tabla, null, "La tabla equivalencia_modulo se eliminó (migración 008)");
});

test("E2. Los módulos anteriores al ingreso no se matriculan: ya están aprobados por equivalencia", async () => {
  const id = await crearAlumno();
  await alta(id, M.III);
  // Ni siquiera recién matriculado, sin datos, se puede volver atrás.
  await falla("PUT", `/alumnos/${id}/cursadas`, matricula(M.I), 409, /Modulo I ya está aprobado por equivalencia: el alumno ingresó en Modulo III/);
  await falla("PUT", `/alumnos/${id}/cursadas`, matricula(M.II), 409, /Modulo II ya está aprobado por equivalencia/);
  await faltar((await cursadaActiva(id)).idCursada, 1);
  await falla("PUT", `/alumnos/${id}/cursadas`, matricula(M.I), 409, /aprobado por equivalencia/);
  assert.equal((await cursadaActiva(id)).moduloId, M.III, "La matrícula no cambia");
  const f = await ficha(id);
  assert.equal(f.moduloIngresoId, M.III);
  assert.deepEqual(f.modulosPorEquivalencia.map((m) => m.moduloId), [M.I, M.II]);
  // Hacia adelante sí: el IV es del mismo año y no tiene correlatividad con el III.
  assert.equal((await cambiar(id, M.IV)).status, 200);

  // Un módulo aprobado en la institución tampoco se vuelve a matricular.
  const otro = await crearAlumno();
  await alta(otro, M.I);
  await aprobarActivo(otro);
  await falla("PUT", `/alumnos/${otro}/cursadas`, matricula(M.I), 409, /ya aprobó Modulo I/);
});

test("E3. Corregir hacia adelante una matrícula vacía cambia el ingreso, y después no se vuelve atrás", async () => {
  const id = await crearAlumno();
  await alta(id, M.III);
  const corregida = await cambiar(id, M.V);
  assert.equal(corregida.body.matricula, "CORREGIDA");
  assert.equal((await ficha(id)).moduloIngresoId, M.V);
  await falla("PUT", `/alumnos/${id}/cursadas`, matricula(M.III), 409, /Modulo III ya está aprobado por equivalencia: el alumno ingresó en Modulo V/);
  await falla("PUT", `/alumnos/${id}/cursadas`, matricula(M.IV), 409, /aprobado por equivalencia/);
  assert.equal((await cursadaActiva(id)).moduloId, M.V);
});

// ======================================================= F. BAJA / PERMISOS
test("F1. Alumno dado de baja: no se matricula ni se evalúa", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const c = await cursadaActiva(id);
  await calificar(c, "Aprobado");
  await ok("DELETE", `/alumnos/${id}`, undefined, 204);
  assert.equal((await cambiar(id, M.II)).status, 409);
  assert.equal((await evaluar(c.idCursada, 1, 8)).status, 409);
});

test("F2. Sin token no se puede matricular", async () => {
  const guardado = token;
  token = null;
  try {
    assert.equal((await api("PUT", "/alumnos/1/cursadas", { idCurso: 1, idModulo: 1 })).status, 401);
  } finally {
    token = guardado;
  }
});

// ========================================================= G. CONCURRENCIA
test("G1. Dos evaluaciones simultáneas de la misma instancia: se guarda una sola", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const c = await cursadaActiva(id);
  await calificar(c, "Aprobado");
  const [a, b] = await Promise.all([evaluar(c.idCursada, 1, 8), evaluar(c.idCursada, 1, 9)]);
  assert.deepEqual([a.status, b.status].sort(), [201, 409]);
  assert.equal((await situacion(id, c.idCursada)).cursada.evaluaciones.length, 1);
});

test("G2. Matrículas simultáneas: una sola cursada activa", async () => {
  const id = await crearAlumno();
  const respuestas = await Promise.all([alta(id, M.I), alta(id, M.I), alta(id, M.II), cambiar(id, M.I)]);
  assert.ok(respuestas.some((r) => r.status < 300));
  const a = await ficha(id);
  assert.equal(a.trayectoria.filter((c) => c.activa).length, 1);
  const abiertas = a.trayectoria.filter((c) => ["EN_CURSO", "PENDIENTE"].includes(c.estadoAcademico));
  assert.equal(new Set(abiertas.map((c) => c.moduloId)).size, abiertas.length, "No puede haber dos cursadas abiertas del mismo módulo");
});

// ================================================ H. BARRERAS EN LA BASE
test("H1. Trigger: un INSERT o UPDATE directo que viola correlatividades es rechazado", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  await aprobarActivo(id);
  await cambiar(id, M.II);
  const enII = await cursadaActiva(id);
  // Ingresó en I: un III cargado a mano sin el II aprobado se rechaza.
  await assert.rejects(
    db.query(
      `INSERT INTO cursada_modulo (alumno_id, curso_id, modulo_id, condicion, cantidad_faltas_acumuladas, estado_academico, activa)
       VALUES ($1, $2, $3, 'REGULAR', 0, 'EN_CURSO', false)`,
      [id, cursoDe(M.III), M.III],
    ),
    /Correlatividad: para cursar Modulo III/,
  );
  // Mover la cursada de II a V también: le faltan III y IV.
  await assert.rejects(
    db.query("UPDATE cursada_modulo SET modulo_id = $2, curso_id = $3 WHERE id = $1", [enII.idCursada, M.V, cursoDe(M.V)]),
    /Correlatividad/,
  );
  // Un alumno sin cursadas sí puede ingresar directo en V, también por SQL.
  const nuevo = await crearAlumno();
  await db.query(
    `INSERT INTO cursada_modulo (alumno_id, curso_id, modulo_id, condicion, cantidad_faltas_acumuladas, estado_academico, activa)
     VALUES ($1, $2, $3, 'REGULAR', 0, 'EN_CURSO', true)`,
    [nuevo, cursoDe(M.V), M.V],
  );
});

test("H2. Dato heredado sin correlativas: no se puede acreditar el módulo hasta aprobarlas", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  await aprobarActivo(id);
  await cambiar(id, M.II);
  // Simula una cursada vieja de III cargada antes del control (saltea el trigger).
  const cliente = await db.connect();
  let cursadaId;
  try {
    await cliente.query("BEGIN");
    await cliente.query("ALTER TABLE cursada_modulo DISABLE TRIGGER cursada_modulo_validar_correlativas");
    cursadaId = (await cliente.query(
      `INSERT INTO cursada_modulo (alumno_id, curso_id, modulo_id, condicion, cantidad_faltas_acumuladas, estado_academico, activa)
       VALUES ($1, $2, $3, 'REGULAR', 0, 'EN_CURSO', false) RETURNING id`,
      [id, cursoDe(M.III), M.III],
    )).rows[0].id;
    await cliente.query("ALTER TABLE cursada_modulo ENABLE TRIGGER cursada_modulo_validar_correlativas");
    await cliente.query("COMMIT");
  } finally {
    cliente.release();
  }
  const c = (await situacion(id, cursadaId)).cursada;
  assert.equal(c.evaluable, false);
  assert.match(c.bloqueoEvaluacion, /Correlatividad/);
  await calificar(c, "Aprobado");
  const r = await evaluar(cursadaId, 1, 9);
  assert.equal(r.status, 409);
  assert.match(r.body.error, /Correlatividad: para acreditar/);
  await assert.rejects(
    db.query(
      `INSERT INTO evaluacion_modulo (cursada_modulo_id, fecha, nota, nro_instancia, tipo_instancia)
       VALUES ($1, CURRENT_DATE, 9, 1, 'COLEGIADA')`, [cursadaId]),
    /Correlatividad: para acreditar/,
  );
  // Aprueba el II (lo que le faltaba) y ya puede acreditar el III.
  await aprobarActivo(id);
  assert.equal((await evaluar(cursadaId, 1, 9)).status, 201);
});

test("H3. Trigger: la situación se recalcula aunque el cambio no pase por la API", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const c = await cursadaActiva(id);
  await db.query(
    "INSERT INTO calificacion (materia_id, cursada_modulo_id, estado) VALUES ($1, $2, 'Desaprobado')",
    [c.materias[0].id, c.idCursada],
  );
  assert.equal((await situacion(id, c.idCursada)).motivo, "MATERIA_DESAPROBADA");
  await db.query("DELETE FROM calificacion WHERE cursada_modulo_id = $1", [c.idCursada]);
  assert.equal((await situacion(id, c.idCursada)).condicion, "REGULAR");
  await assert.rejects(
    db.query("UPDATE cursada_modulo SET condicion = 'Libre' WHERE id = $1", [c.idCursada]),
    /cursada_modulo_condicion_check/,
  );
});

// ============================== I. MÓDULOS APROBADOS Y EGRESADOS
const enPlanilla = async (moduloId, alumnoId) =>
  (await ok("GET", `/asistencias/modulos/${moduloId}/divisiones/A?fecha=${CICLO}-05-05`)).alumnos.filter((x) => x.alumnoId === alumnoId);
const enGrilla = async (moduloId, cursadaId) =>
  (await ok("GET", `/calificaciones/modulos/${moduloId}/divisiones/A?anio=${CICLO}`)).alumnos.filter((x) => x.cursadaId === cursadaId);

test("I1. Al aprobar un módulo sale de asistencias y calificaciones; reaparece en el siguiente con faltas en cero", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  const cI = await cursadaActiva(id);
  await faltar(cI.idCursada, 25);
  assert.equal((await enPlanilla(M.I, id)).length, 1);
  assert.equal((await enGrilla(M.I, cI.idCursada)).length, 1);

  await aprobarActivo(id);
  assert.equal((await enPlanilla(M.I, id)).length, 0, "Aprobado: fuera de la planilla del Módulo I");
  assert.equal((await enGrilla(M.I, cI.idCursada)).length, 0, "Aprobado: fuera de la grilla del Módulo I");
  assert.equal((await enPlanilla(M.II, id)).length, 0, "Todavía no está matriculado en el II");

  assert.equal((await cambiar(id, M.II)).status, 200);
  const cII = await cursadaActiva(id);
  const fila = await enPlanilla(M.II, id);
  assert.deepEqual(fila.map((x) => [x.cursadaId, x.faltasAcumuladas, x.condicion]), [[cII.idCursada, 0, "Regular"]]);
  assert.equal((await enGrilla(M.II, cII.idCursada)).length, 1);
  assert.equal((await enPlanilla(M.I, id)).length, 0);

  // La ficha muestra las faltas del módulo que cursa ahora, no las del aprobado.
  const a = await ficha(id);
  assert.deepEqual([a.moduloId, a.faltas, a.condicion], [M.II, 0, "REGULAR"]);
  assert.equal(a.trayectoria.find((c) => c.moduloId === M.I).faltas, 25);
  assert.equal(a.egresado, false);
});

test("I2. Egresado: 6 módulos aprobados; legajo de solo lectura y listado propio", async () => {
  const id = await crearAlumno();
  await alta(id, M.I);
  for (const siguiente of ["II", "III", "IV", "V", "VI"]) {
    await aprobarActivo(id);
    assert.equal((await ficha(id)).egresado, false);
    assert.equal((await cambiar(id, M[siguiente])).status, 200);
  }
  const ultima = await aprobarActivo(id);

  const a = await ficha(id);
  assert.equal(a.egresado, true);
  assert.match(a.fechaEgreso, /^\d{4}-\d{2}-\d{2}/);
  assert.equal(a.trayectoria.length, 6);
  assert.ok(a.trayectoria.every((c) => c.estadoAcademico === "APROBADO" && c.evaluable === false));

  // Sale del padrón de alumnos y aparece en el de egresados.
  assert.ok(!(await ok("GET", "/alumnos")).some((x) => x.id === id));
  assert.ok(!(await ok("GET", "/alumnos?incluirInactivos=true")).some((x) => x.id === id));
  const egresados = await ok("GET", "/alumnos?egresados=true");
  assert.ok(egresados.every((x) => x.egresado === true));
  assert.equal(egresados.find((x) => x.id === id).trayectoria.length, 6);

  // No se modifica, no se da de baja, no se matricula ni se califica.
  await falla("PUT", `/alumnos/${id}`, datosAlumno(), 409, /egresado/);
  await falla("DELETE", `/alumnos/${id}`, undefined, 409, /egresado/);
  await falla("POST", `/alumnos/${id}/cursadas`, matricula(M.I), 409, /egresado/);
  assert.equal((await evaluar(ultima.idCursada, 2, 10)).status, 409);
  const nota = await api("PUT", "/calificaciones", {
    cursadaModuloId: ultima.idCursada, materiaId: ultima.materias[0].id, estado: "Desaprobado", anio: ultima.cicloLectivo,
  });
  assert.equal(nota.status, 409);
  assert.equal((await enPlanilla(M.VI, id)).length, 0);
  assert.equal((await ficha(id)).egresado, true);
});

test("I3. Ingresó en V: egresa recién al aprobar V y VI", async () => {
  const id = await crearAlumno();
  assert.equal((await alta(id, M.V)).status, 201);
  await aprobarActivo(id);
  let a = await ficha(id);
  assert.equal(a.egresado, false, "Le falta el Módulo VI");
  assert.ok((await ok("GET", "/alumnos")).some((x) => x.id === id), "Sigue en el padrón");

  assert.equal((await cambiar(id, M.VI)).status, 200);
  await aprobarActivo(id);
  a = await ficha(id);
  assert.equal(a.egresado, true);
  assert.deepEqual(a.modulosAcreditados, [M.I, M.II, M.III, M.IV, M.V, M.VI]);
  assert.ok((await ok("GET", "/alumnos?egresados=true")).some((x) => x.id === id));
});

test("I4. Sin cursadas no es egresado (no hay módulo de ingreso)", async () => {
  const id = await crearAlumno();
  const a = await ficha(id);
  assert.deepEqual(a.modulosAcreditados, []);
  assert.equal(a.egresado, false);
  assert.ok(!(await ok("GET", "/alumnos?egresados=true")).some((x) => x.id === id));
});
