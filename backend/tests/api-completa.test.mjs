/**
 * Pruebas de TODOS los endpoints de la API: auth, cursos, alumnos,
 * asistencias, calificaciones, docentes, preceptores, plan de estudios y
 * reportes, incluyendo permisos por rol y datos inválidos.
 *
 * Las reglas de correlatividades / LIBRE / equivalencias tienen su propia
 * suite en reglas-academicas.test.mjs.
 *
 * Requisitos: base LOCAL creada con database/schema.sql (usuarios de ejemplo
 * director/docente/preceptor@escuela.com con clave 1234) y backend corriendo.
 *   npm run test:api
 *
 * Crea y borra datos de prueba: solo se ejecuta contra localhost.
 */
import "dotenv/config";
import test, { before } from "node:test";
import assert from "node:assert/strict";

const API = process.env.TEST_API_URL ?? `http://localhost:${process.env.PORT ?? 4000}/api`;
const CLAVE = process.env.TEST_PASSWORD ?? "1234";
const CICLO = Number(process.env.TEST_CICLO ?? new Date().getFullYear());

if (!["localhost", "127.0.0.1"].includes(new URL(API).hostname)) {
  throw new Error("Estas pruebas escriben datos: solo se ejecutan contra localhost.");
}
if (process.env.DATABASE_URL) {
  throw new Error("Hay un DATABASE_URL configurado (Neon). Usá una base local para las pruebas.");
}

const T = {}; // tokens por rol
let cursos;
const M = {};

// ----------------------------------------------------------------- helpers
async function api(method, ruta, body, token = T.directivo) {
  const res = await fetch(`${API}${ruta}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const texto = await res.text();
  let datos = null;
  try {
    datos = texto ? JSON.parse(texto) : null;
  } catch {
    datos = texto;
  }
  return { status: res.status, body: datos };
}

async function espera(esperado, method, ruta, body, token = T.directivo) {
  const r = await api(method, ruta, body, token);
  assert.equal(
    r.status,
    esperado,
    `${method} ${ruta} -> ${r.status} (se esperaba ${esperado}) ${JSON.stringify(r.body).slice(0, 300)}`,
  );
  if (esperado >= 400) {
    assert.equal(typeof r.body?.error, "string", `${method} ${ruta}: el error debe venir como { error: "..." }`);
  }
  return r.body;
}

let n = 0;
const unico = () => {
  n += 1;
  return String(60000000 + Math.floor(Math.random() * 9000000) + n);
};

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

function datosAlumno(extra = {}) {
  const dni = unico();
  return {
    nombre: "Api",
    apellido: "ZZ-TEST",
    dni,
    cuil: cuilDe(dni),
    fechaNacimiento: "1988-02-20",
    lugarNacimiento: "San Luis",
    domicilio: "Calle 1",
    telefono: "2664000000",
    email: `api${dni}@example.com`,
    trabaja: true,
    telefonoEmergencia: "2664111111",
    cantidadHijos: 2,
    ...extra,
  };
}

function cursoDe(moduloId, division = "A") {
  const curso = cursos.find(
    (c) => c.division.trim() === division && c.modulos.some((m) => m.id === moduloId),
  );
  assert.ok(curso, `No hay curso ${division} para el módulo ${moduloId}`);
  return curso;
}

// Alumno matriculado en un módulo de 1.er año; devuelve su ficha.
async function alumnoMatriculado(moduloId = M.I, division = "A") {
  const alumno = await espera(201, "POST", "/alumnos", datosAlumno());
  await espera(201, "POST", `/alumnos/${alumno.id}/cursadas`, {
    idCurso: cursoDe(moduloId, division).id,
    idModulo: moduloId,
  });
  const ficha = await espera(200, "GET", `/alumnos/${alumno.id}`);
  return { ...ficha, cursada: ficha.trayectoria.find((c) => c.activa) };
}

async function login(email, password = CLAVE) {
  return api("POST", "/auth/login", { email, password }, null);
}

// ------------------------------------------------------------------- setup
before(async () => {
  for (const rol of ["director", "docente", "preceptor"]) {
    const r = await login(`${rol}@escuela.com`);
    assert.equal(r.status, 200, `No se pudo iniciar sesión como ${rol}@escuela.com`);
    T[rol === "director" ? "directivo" : rol] = r.body.token;
  }
  cursos = await espera(200, "GET", "/cursos");
  for (const curso of cursos) {
    for (const m of curso.modulos) {
      M[m.numeroLeyenda.replace(/^\s*m[oó]dulo\s*/i, "").trim().toUpperCase()] = m.id;
    }
  }
});

// ==================================================================== AUTH
test("AUTH 1. Login: credenciales correctas, incorrectas y datos faltantes", async () => {
  const ok = await login("director@escuela.com");
  assert.equal(ok.status, 200);
  assert.equal(ok.body.usuario.rol, "directivo");
  assert.ok(ok.body.token.split(".").length === 3);
  assert.equal(ok.body.usuario.contrahash, undefined, "No debe exponerse el hash");

  assert.equal((await login("director@escuela.com", "mala")).status, 401);
  assert.equal((await login("nadie@escuela.com")).status, 401);
  assert.equal((await api("POST", "/auth/login", { email: "director@escuela.com" }, null)).status, 400);
  assert.equal((await api("POST", "/auth/login", {}, null)).status, 400);
  // El mensaje no distingue usuario inexistente de clave incorrecta.
  assert.equal(
    (await login("nadie@escuela.com")).body.error,
    (await login("director@escuela.com", "mala")).body.error,
  );
});

test("AUTH 2. Perfil: exige un token válido", async () => {
  const perfil = await espera(200, "GET", "/auth/perfil");
  assert.equal(perfil.email, "director@escuela.com");
  await espera(401, "GET", "/auth/perfil", undefined, null);
  await espera(401, "GET", "/auth/perfil", undefined, "token.falso.123");
  const sinBearer = await fetch(`${API}/auth/perfil`, { headers: { Authorization: T.directivo } });
  assert.equal(sinBearer.status, 401);
});

test("AUTH 3. Registro: solo directivo; valida rol, clave y correo repetido", async () => {
  const email = `reg${unico()}@example.com`;
  const nuevo = { nombre: "Reg", apellido: "Prueba", email, password: "abcd", rol: "preceptor" };
  await espera(401, "POST", "/auth/registro", nuevo, null);
  await espera(403, "POST", "/auth/registro", nuevo, T.docente);
  await espera(403, "POST", "/auth/registro", nuevo, T.preceptor);
  await espera(400, "POST", "/auth/registro", { ...nuevo, rol: "alumno" });
  await espera(400, "POST", "/auth/registro", { ...nuevo, password: "abc" });
  await espera(400, "POST", "/auth/registro", { ...nuevo, email: undefined });

  const creado = await espera(201, "POST", "/auth/registro", nuevo);
  assert.equal(creado.email, email);
  assert.equal(creado.contrahash, undefined);
  await espera(409, "POST", "/auth/registro", nuevo);
  assert.equal((await login(email, "abcd")).status, 200);
});

test("AUTH 4. Ruta inexistente responde 404 en JSON", async () => {
  await espera(404, "GET", "/no-existe");
});

// ================================================================== CURSOS
test("CURSOS 1. Lista los cursos vigentes con módulos y correlativas", async () => {
  assert.ok(cursos.length > 0);
  const m3 = cursos.flatMap((c) => c.modulos).find((m) => m.id === M.III);
  assert.deepEqual(m3.correlativos.map((c) => c.id), [M.I, M.II]);
  assert.equal(m3.periodo, 1);
  await espera(200, "GET", "/cursos", undefined, T.preceptor);
  await espera(403, "GET", "/cursos", undefined, T.docente);
  await espera(401, "GET", "/cursos", undefined, null);
});

// ================================================================= ALUMNOS
test("ALUMNOS 1. Alta, consulta, modificación, baja lógica y reactivación", async () => {
  const datos = datosAlumno();
  const creado = await espera(201, "POST", "/alumnos", datos);
  assert.equal(creado.dni, datos.dni);
  assert.equal(creado.activo, true);
  assert.deepEqual(creado.trayectoria, []);

  const ficha = await espera(200, "GET", `/alumnos/${creado.id}`);
  assert.equal(ficha.apellido, "ZZ-TEST");
  assert.equal(ficha.cantidadHijos, 2);

  const modificado = await espera(200, "PUT", `/alumnos/${creado.id}`, { ...datos, domicilio: "Otra calle 99", trabaja: false });
  assert.equal(modificado.domicilio, "Otra calle 99");
  assert.equal(modificado.trabaja, false);

  await espera(204, "DELETE", `/alumnos/${creado.id}`);
  const activos = await espera(200, "GET", "/alumnos");
  assert.ok(!activos.some((a) => a.id === creado.id), "Dado de baja no aparece en el padrón");
  const todos = await espera(200, "GET", "/alumnos?incluirInactivos=true");
  assert.equal(todos.find((a) => a.id === creado.id)?.activo, false);
  assert.ok(todos.every((a) => a.egresado === false), "El padrón no incluye egresados");
  const egresados = await espera(200, "GET", "/alumnos?egresados=true");
  assert.ok(egresados.every((a) => a.egresado === true));
  assert.ok(!egresados.some((a) => a.id === creado.id));
  await espera(409, "PUT", `/alumnos/${creado.id}`, datos);
  await espera(204, "DELETE", `/alumnos/${creado.id}`); // idempotente

  const reactivado = await espera(200, "PATCH", `/alumnos/${creado.id}/reactivar`);
  assert.equal(reactivado.activo, true);
  assert.ok((await espera(200, "GET", "/alumnos")).some((a) => a.id === creado.id));
});

test("ALUMNOS 2. Validaciones de datos personales", async () => {
  await espera(400, "POST", "/alumnos", datosAlumno({ dni: "12ab" }));
  await espera(400, "POST", "/alumnos", datosAlumno({ dni: "123" }));
  await espera(400, "POST", "/alumnos", datosAlumno({ fechaNacimiento: "31/12/1990" }));
  await espera(400, "POST", "/alumnos", datosAlumno({ fechaNacimiento: "2990-01-01" }));
  await espera(400, "POST", "/alumnos", datosAlumno({ fechaNacimiento: "1990-02-31" }));
  await espera(400, "POST", "/alumnos", datosAlumno({ email: "sin-arroba" }));
  await espera(400, "POST", "/alumnos", datosAlumno({ cantidadHijos: -1 }));
  await espera(400, "POST", "/alumnos", datosAlumno({ nombre: "" }));
  await espera(400, "POST", "/alumnos", {});
  // El correo es opcional.
  const sinCorreo = await espera(201, "POST", "/alumnos", datosAlumno({ email: "" }));
  assert.ok(sinCorreo.email === null || sinCorreo.email === "");
});

test("ALUMNOS 3. DNI y CUIL no se repiten", async () => {
  const a = await espera(201, "POST", "/alumnos", datosAlumno());
  const b = await espera(201, "POST", "/alumnos", datosAlumno());
  await espera(409, "POST", "/alumnos", datosAlumno({ dni: a.dni }));
  await espera(409, "POST", "/alumnos", datosAlumno({ cuil: a.cuil }));
  const fichaB = await espera(200, "GET", `/alumnos/${b.id}`);
  await espera(409, "PUT", `/alumnos/${b.id}`, { ...datosAlumno(), dni: a.dni, cuil: fichaB.cuil });
});

test("ALUMNOS 4. Ids inexistentes o inválidos", async () => {
  await espera(404, "GET", "/alumnos/99999999");
  await espera(404, "PUT", "/alumnos/99999999", datosAlumno());
  await espera(404, "DELETE", "/alumnos/99999999");
  await espera(404, "PATCH", "/alumnos/99999999/reactivar");
  for (const id of ["abc", "1.5", "0", "-3"]) {
    const r = await api("GET", `/alumnos/${id}`);
    assert.ok([400, 404].includes(r.status), `GET /alumnos/${id} -> ${r.status}`);
  }
  await espera(404, "POST", "/alumnos/99999999/cursadas", { idCurso: cursoDe(M.I).id, idModulo: M.I });
  await espera(400, "POST", "/alumnos/evaluaciones-modulo", {});
  await espera(404, "POST", "/alumnos/evaluaciones-modulo", { idCursadaModulo: 99999999, fecha: `${CICLO}-05-05`, nota: 8, nroInstancia: 1 });
});

test("ALUMNOS 5. Evaluación de módulo: validaciones de nota, fecha e instancia", async () => {
  const a = await alumnoMatriculado();
  const base = { idCursadaModulo: a.cursada.idCursada, fecha: `${CICLO}-06-10`, nota: 8, nroInstancia: 1 };
  await espera(400, "POST", "/alumnos/evaluaciones-modulo", { ...base, nota: 11 });
  await espera(400, "POST", "/alumnos/evaluaciones-modulo", { ...base, nota: -1 });
  await espera(400, "POST", "/alumnos/evaluaciones-modulo", { ...base, nota: "ocho" });
  await espera(400, "POST", "/alumnos/evaluaciones-modulo", { ...base, fecha: "10/06/2026" });
  await espera(400, "POST", "/alumnos/evaluaciones-modulo", { ...base, nroInstancia: 0 });
  await espera(400, "POST", "/alumnos/evaluaciones-modulo", { ...base, nroInstancia: 5 });
  // Con materias sin aprobar no rinde.
  await espera(409, "POST", "/alumnos/evaluaciones-modulo", base);
});

test("ALUMNOS 6. Solo el directivo gestiona alumnos", async () => {
  for (const token of [T.docente, T.preceptor]) {
    await espera(403, "GET", "/alumnos", undefined, token);
    await espera(403, "POST", "/alumnos", datosAlumno(), token);
    await espera(403, "DELETE", "/alumnos/1", undefined, token);
    await espera(403, "POST", "/alumnos/evaluaciones-modulo", {}, token);
  }
  await espera(401, "GET", "/alumnos", undefined, null);
});

// ============================================================= ASISTENCIAS
test("ASISTENCIAS 1. Estructura de módulos y divisiones", async () => {
  const anios = await espera(200, "GET", "/asistencias/modulos");
  assert.deepEqual(anios.map((a) => a.anio), [1, 2, 3]);
  assert.ok(anios[0].modulos.find((m) => m.moduloId === M.I).divisiones.includes("A"));
  const div = await espera(200, "GET", `/asistencias/modulos/${M.I}/divisiones`);
  assert.ok(div.divisiones.includes("A"));
  await espera(404, "GET", "/asistencias/modulos/9999/divisiones");
  await espera(400, "GET", "/asistencias/modulos/abc/divisiones");
});

test("ASISTENCIAS 2. Planilla, registro (0 / 0.5 / 1), corrección y borrado", async () => {
  const a = await alumnoMatriculado();
  const id = a.cursada.idCursada;
  const fecha = `${CICLO}-04-15`;

  const media = await espera(201, "POST", "/asistencias", { cursadaModuloId: id, fecha, valorFalta: 0.5 });
  assert.equal(media.faltasAcumuladas, 0.5);
  assert.equal(media.condicion, "Regular");

  // Misma fecha: no duplica, actualiza el mismo registro.
  const falta = await espera(201, "POST", "/asistencias", { cursadaModuloId: id, fecha, valorFalta: 1 });
  assert.equal(falta.id, media.id);
  assert.equal(falta.faltasAcumuladas, 1);

  const planilla = await espera(200, "GET", `/asistencias/modulos/${M.I}/divisiones/A?fecha=${fecha}`);
  const fila = planilla.alumnos.find((x) => x.alumnoId === a.id);
  assert.ok(fila, "El alumno aparece en la planilla de su curso");
  assert.equal(fila.faltasAcumuladas, 1);
  assert.equal(fila.asistenciaHoy.valorFalta, 1);
  const otroDia = await espera(200, "GET", `/asistencias/modulos/${M.I}/divisiones/A?fecha=${CICLO}-04-16`);
  assert.equal(otroDia.alumnos.find((x) => x.alumnoId === a.id).asistenciaHoy, null);

  const lista = await espera(200, "GET", `/asistencias?cursadaModuloId=${id}`);
  assert.equal(lista.length, 1);
  assert.equal((await espera(200, "GET", `/asistencias?fecha=${fecha}&cursadaModuloId=${id}`)).length, 1);

  const presente = await espera(200, "PUT", `/asistencias/${media.id}`, { valorFalta: 0 });
  assert.equal(presente.faltasAcumuladas, 0);
  const movida = await espera(200, "PUT", `/asistencias/${media.id}`, { valorFalta: 1, fecha: `${CICLO}-04-17` });
  assert.equal(movida.faltasAcumuladas, 1);

  await espera(204, "DELETE", `/asistencias/${media.id}`);
  assert.equal((await espera(200, "GET", `/asistencias?cursadaModuloId=${id}`)).length, 0);
  assert.equal((await espera(200, "GET", `/alumnos/${a.id}`)).faltas, 0);
});

test("ASISTENCIAS 3. Datos inválidos e inexistentes", async () => {
  const a = await alumnoMatriculado();
  const id = a.cursada.idCursada;
  const fecha = `${CICLO}-05-05`;
  await espera(400, "POST", "/asistencias", { cursadaModuloId: id, fecha, valorFalta: 0.3 });
  await espera(400, "POST", "/asistencias", { cursadaModuloId: id, fecha, valorFalta: 2 });
  await espera(400, "POST", "/asistencias", { cursadaModuloId: id, fecha: "05-05-2026", valorFalta: 1 });
  await espera(400, "POST", "/asistencias", { cursadaModuloId: id, fecha: `${CICLO}-02-31`, valorFalta: 1 });
  await espera(400, "POST", "/asistencias", { cursadaModuloId: "x", fecha, valorFalta: 1 });
  await espera(400, "POST", "/asistencias", {});
  await espera(404, "POST", "/asistencias", { cursadaModuloId: 99999999, fecha, valorFalta: 1 });
  await espera(404, "PUT", "/asistencias/99999999", { valorFalta: 1 });
  await espera(404, "DELETE", "/asistencias/99999999");
  await espera(400, "PUT", "/asistencias/abc", { valorFalta: 1 });
  await espera(400, "GET", "/asistencias?cursadaModuloId=abc");
  await espera(400, "GET", "/asistencias?fecha=ayer");
  await espera(400, "GET", `/asistencias/modulos/${M.I}/divisiones/A?fecha=ayer`);
  await espera(404, "GET", `/asistencias/modulos/${M.I}/divisiones/Z`);

  const reg = await espera(201, "POST", "/asistencias", { cursadaModuloId: id, fecha, valorFalta: 1 });
  await espera(400, "PUT", `/asistencias/${reg.id}`, { valorFalta: 7 });
  await espera(400, "PUT", `/asistencias/${reg.id}`, { valorFalta: 1, fecha: "mañana" });
  // Mover a una fecha que ya tiene registro no puede romper con un 500.
  await espera(201, "POST", "/asistencias", { cursadaModuloId: id, fecha: `${CICLO}-05-06`, valorFalta: 1 });
  await espera(409, "PUT", `/asistencias/${reg.id}`, { valorFalta: 1, fecha: `${CICLO}-05-06` });
});

test("ASISTENCIAS 4. El preceptor solo opera en sus cursos; el docente no entra", async () => {
  const anios = await espera(200, "GET", "/asistencias/modulos", undefined, T.preceptor);
  const propias = anios.flatMap((a) => a.modulos.flatMap((m) => m.divisiones.map((d) => `${m.moduloId}-${d}`)));
  const todas = (await espera(200, "GET", "/asistencias/modulos")).flatMap((a) =>
    a.modulos.flatMap((m) => m.divisiones.map((d) => `${m.moduloId}-${d}`)),
  );
  assert.ok(propias.length > 0 && propias.length < todas.length, "El preceptor ve solo una parte");
  const [modPropio, divPropia] = propias[0].split("-");
  const ajena = todas.find((x) => !propias.includes(x)).split("-");

  await espera(200, "GET", `/asistencias/modulos/${modPropio}/divisiones/${divPropia}`, undefined, T.preceptor);
  await espera(403, "GET", `/asistencias/modulos/${ajena[0]}/divisiones/${ajena[1]}`, undefined, T.preceptor);

  const enAjena = await alumnoMatriculado(Number(ajena[0]) <= M.II ? Number(ajena[0]) : M.I, Number(ajena[0]) <= M.II ? ajena[1] : "A");
  const cursoAjeno = !propias.includes(`${enAjena.cursada.moduloId}-${enAjena.cursada.division.trim()}`);
  if (cursoAjeno) {
    const cuerpo = { cursadaModuloId: enAjena.cursada.idCursada, fecha: `${CICLO}-05-20`, valorFalta: 1 };
    await espera(403, "POST", "/asistencias", cuerpo, T.preceptor);
    const reg = await espera(201, "POST", "/asistencias", cuerpo);
    await espera(403, "PUT", `/asistencias/${reg.id}`, { valorFalta: 0 }, T.preceptor);
    await espera(403, "DELETE", `/asistencias/${reg.id}`, undefined, T.preceptor);
    const visibles = await espera(200, "GET", `/asistencias?cursadaModuloId=${enAjena.cursada.idCursada}`, undefined, T.preceptor);
    assert.equal(visibles.length, 0, "No ve asistencias de cursos ajenos");
  }

  await espera(403, "GET", "/asistencias/modulos", undefined, T.docente);
  await espera(403, "POST", "/asistencias", {}, T.docente);
  await espera(401, "GET", "/asistencias", undefined, null);
});

// ========================================================== CALIFICACIONES
test("CALIFICACIONES 1. Ciclos, módulos, divisiones y grilla", async () => {
  const { ciclos, cicloActivo } = await espera(200, "GET", "/calificaciones/ciclos");
  assert.ok(ciclos.some((c) => c.anio === CICLO));
  assert.equal(cicloActivo.anio, CICLO);

  await espera(400, "GET", "/calificaciones/modulos");
  await espera(400, "GET", "/calificaciones/modulos?anio=abc");
  const anios = await espera(200, "GET", `/calificaciones/modulos?anio=${CICLO}`);
  assert.ok(anios[0].modulos[0].materias.length > 0);
  assert.deepEqual(await espera(200, "GET", "/calificaciones/modulos?anio=2001"), []);

  const div = await espera(200, "GET", `/calificaciones/modulos/${M.I}/divisiones?anio=${CICLO}`);
  assert.ok(div.divisiones.includes("A"));
  await espera(404, "GET", `/calificaciones/modulos/9999/divisiones?anio=${CICLO}`);
  await espera(400, "GET", `/calificaciones/modulos/abc/divisiones?anio=${CICLO}`);

  const a = await alumnoMatriculado();
  const grilla = await espera(200, "GET", `/calificaciones/modulos/${M.I}/divisiones/A?anio=${CICLO}`);
  const fila = grilla.alumnos.find((x) => x.cursadaId === a.cursada.idCursada);
  assert.ok(fila);
  assert.equal(Object.keys(fila.calificaciones).length, grilla.materias.length);
  assert.ok(Object.values(fila.calificaciones).every((e) => e === "En Curso"));
  await espera(404, "GET", `/calificaciones/modulos/${M.I}/divisiones/Z?anio=${CICLO}`);
  await espera(400, "GET", `/calificaciones/modulos/${M.I}/divisiones/A`);
});

test("CALIFICACIONES 2. Guardar y corregir el estado de una materia", async () => {
  const a = await alumnoMatriculado();
  const materia = a.cursada.materias[0];
  const base = { cursadaModuloId: a.cursada.idCursada, materiaId: materia.id, anio: CICLO };

  const ap = await espera(200, "PUT", "/calificaciones", { ...base, estado: "Aprobado" });
  assert.equal(ap.estado, "Aprobado");
  assert.equal(ap.condicion, "REGULAR");
  const des = await espera(200, "PUT", "/calificaciones", { ...base, estado: "Desaprobado" });
  assert.equal(des.condicion, "LIBRE");
  const enCurso = await espera(200, "PUT", "/calificaciones", { ...base, estado: "En Curso" });
  assert.equal(enCurso.condicion, "REGULAR");

  const grilla = await espera(200, "GET", `/calificaciones/modulos/${M.I}/divisiones/A?anio=${CICLO}`);
  assert.equal(grilla.alumnos.find((x) => x.cursadaId === a.cursada.idCursada).calificaciones[materia.id], "En Curso");

  await espera(400, "PUT", "/calificaciones", { ...base, estado: "aprobado" });
  await espera(400, "PUT", "/calificaciones", { ...base, estado: "Promocionado" });
  await espera(400, "PUT", "/calificaciones", { ...base, estado: "Aprobado", anio: undefined });
  await espera(400, "PUT", "/calificaciones", { ...base, estado: "Aprobado", cursadaModuloId: "1" });
  await espera(400, "PUT", "/calificaciones", {});
  await espera(404, "PUT", "/calificaciones", { ...base, estado: "Aprobado", cursadaModuloId: 99999999 });
  await espera(409, "PUT", "/calificaciones", { ...base, estado: "Aprobado", anio: CICLO - 1 });

  // Una materia que no pertenece al módulo de la cursada no se puede calificar.
  const materiasModuloI = new Set(a.cursada.materias.map((m) => m.id));
  const todas = await espera(200, "GET", "/materias");
  const ajena = todas.find((m) => !materiasModuloI.has(m.id) && m.modulosIds.length > 0);
  if (ajena) {
    await espera(404, "PUT", "/calificaciones", { ...base, materiaId: ajena.id, estado: "Aprobado" });
  }
});

test("CALIFICACIONES 3. El docente solo ve y califica su materia en su curso", async () => {
  const anios = await espera(200, "GET", `/calificaciones/modulos?anio=${CICLO}`, undefined, T.docente);
  const mod = anios.flatMap((a) => a.modulos)[0];
  assert.ok(mod, "El docente de ejemplo tiene al menos un módulo asignado");
  const division = mod.divisiones[0];

  const grilla = await espera(200, "GET", `/calificaciones/modulos/${mod.moduloId}/divisiones/${division}?anio=${CICLO}`, undefined, T.docente);
  const grillaCompleta = await espera(200, "GET", `/calificaciones/modulos/${mod.moduloId}/divisiones/${division}?anio=${CICLO}`);
  assert.ok(grilla.materias.length >= 1 && grilla.materias.length < grillaCompleta.materias.length);

  const otraDivision = ["A", "B", "C", "D"].find((d) => !mod.divisiones.includes(d));
  await espera(403, "GET", `/calificaciones/modulos/${mod.moduloId}/divisiones/${otraDivision}?anio=${CICLO}`, undefined, T.docente);

  const a = await alumnoMatriculado(mod.moduloId, division);
  const propia = grilla.materias[0];
  const ajena = grillaCompleta.materias.find((m) => !grilla.materias.some((p) => p.id === m.id));
  const base = { cursadaModuloId: a.cursada.idCursada, anio: CICLO, estado: "Aprobado" };
  await espera(200, "PUT", "/calificaciones", { ...base, materiaId: propia.id }, T.docente);
  await espera(403, "PUT", "/calificaciones", { ...base, materiaId: ajena.id }, T.docente);

  // Misma materia pero alumno de otra división: tampoco.
  const b = await alumnoMatriculado(mod.moduloId, otraDivision);
  await espera(403, "PUT", "/calificaciones", { ...base, cursadaModuloId: b.cursada.idCursada, materiaId: propia.id }, T.docente);

  await espera(403, "GET", `/calificaciones/modulos?anio=${CICLO}`, undefined, T.preceptor);
  await espera(403, "PUT", "/calificaciones", base, T.preceptor);
  await espera(401, "GET", "/calificaciones/ciclos", undefined, null);
});

// ================================================================ DOCENTES
function datosDocente(extra = {}) {
  const dni = unico();
  return {
    nombre: "Doc",
    apellido: "ZZ-TEST",
    dni,
    cuil: cuilDe(dni),
    domicilio: "Calle 2",
    telefono: "2664222222",
    email: `doc${dni}@example.com`,
    especialidad: "Profesor de Historia",
    antiguedad: 3,
    password: "clave1",
    asignaciones: [],
    ...extra,
  };
}

test("DOCENTES 1. Alta con asignaciones, consulta, filtros, modificación y baja", async () => {
  const modulos = await espera(200, "GET", "/docentes/modulos");
  const mod = modulos.find((m) => m.id === M.I);
  assert.ok(mod.divisiones.includes("C") && mod.materias.includes("Historia"));

  const datos = datosDocente({ asignaciones: [{ moduloId: M.I, division: "C", materia: "Historia" }] });
  const creado = await espera(201, "POST", "/docentes", datos);
  assert.equal(creado.especialidad, "Profesor de Historia");
  // La asignación se guarda por curso + materia: si la materia se dicta en los
  // dos módulos de ese curso, el docente queda habilitado en ambos.
  assert.ok(creado.asignaciones.some((x) => x.moduloId === M.I));
  assert.ok(creado.asignaciones.every((x) => x.division === "C" && x.materia === "Historia"));
  assert.equal(creado.password, undefined);

  assert.equal((await espera(200, "GET", `/docentes/${creado.id}`)).dni, datos.dni);
  assert.ok((await espera(200, "GET", "/docentes")).some((d) => d.id === creado.id));
  assert.deepEqual((await espera(200, "GET", `/docentes?dni=${datos.dni}`)).map((d) => d.id), [creado.id]);
  assert.ok((await espera(200, "GET", `/docentes?moduloId=${M.I}&division=C&materia=histor`)).some((d) => d.id === creado.id));
  assert.ok(!(await espera(200, "GET", `/docentes?moduloId=${M.VI}`)).some((d) => d.id === creado.id));

  // El docente inicia sesión y solo ve Historia en 1.º C.
  const sesion = await login(datos.email, "clave1");
  assert.equal(sesion.status, 200);
  assert.equal(sesion.body.usuario.rol, "docente");
  const vista = await espera(200, "GET", `/calificaciones/modulos?anio=${CICLO}`, undefined, sesion.body.token);
  const modulosVisibles = vista.flatMap((a) => a.modulos);
  assert.ok(modulosVisibles.some((m) => m.moduloId === M.I));
  assert.ok(modulosVisibles.every((m) => m.divisiones.join() === "C" && m.moduloId <= M.II), "Solo ve 1.º C");
  const grilla = await espera(200, "GET", `/calificaciones/modulos/${M.I}/divisiones/C?anio=${CICLO}`, undefined, sesion.body.token);
  assert.deepEqual(grilla.materias.map((m) => m.nombre), ["Historia"]);

  // Modificar reemplaza las asignaciones.
  const modificado = await espera(200, "PUT", `/docentes/${creado.id}`, {
    ...datos,
    antiguedad: 9,
    asignaciones: [
      { moduloId: M.II, division: "C", materia: "Historia" },
      { moduloId: M.I, division: "D", materia: "Geografia" },
    ],
  });
  assert.equal(modificado.antiguedad, 9);
  assert.deepEqual(
    [...new Set(modificado.asignaciones.map((x) => `${x.division}-${x.materia}`))].sort(),
    ["C-Historia", "D-Geografia"],
  );

  // Cambiar el correo cambia también el de inicio de sesión.
  const correoNuevo = `doc${unico()}@example.com`;
  await espera(200, "PUT", `/docentes/${creado.id}`, { ...datos, email: correoNuevo, asignaciones: modificado.asignaciones });
  assert.equal((await login(datos.email, "clave1")).status, 401);
  assert.equal((await login(correoNuevo, "clave1")).status, 200);
  await espera(409, "PUT", `/docentes/${creado.id}`, { ...datos, email: "director@escuela.com", asignaciones: [] });
  datos.email = correoNuevo;
  await espera(403, "GET", `/calificaciones/modulos/${M.I}/divisiones/A?anio=${CICLO}`, undefined, sesion.body.token);

  await espera(204, "DELETE", `/docentes/${creado.id}`);
  await espera(404, "GET", `/docentes/${creado.id}`);
  await espera(404, "DELETE", `/docentes/${creado.id}`);
  // Su usuario pierde el acceso...
  assert.equal((await login(datos.email, "clave1")).status, 401, "Un docente eliminado no inicia sesión");
  // ...y el correo queda libre: se lo puede volver a registrar con otra clave.
  const otraVez = await espera(201, "POST", "/docentes", { ...datos, dni: unico(), cuil: undefined, password: "clave2" });
  assert.equal((await login(datos.email, "clave1")).status, 401);
  assert.equal((await login(datos.email, "clave2")).status, 200);
  await espera(204, "DELETE", `/docentes/${otraVez.id}`);
});

test("DOCENTES 2. Validaciones y duplicados", async () => {
  await espera(400, "POST", "/docentes", datosDocente({ password: "abc" }));
  await espera(400, "POST", "/docentes", datosDocente({ password: undefined }));
  await espera(400, "POST", "/docentes", datosDocente({ dni: "12" }));
  await espera(400, "POST", "/docentes", datosDocente({ email: "mal" }));
  await espera(400, "POST", "/docentes", datosDocente({ nombre: " " }));
  await espera(400, "POST", "/docentes", datosDocente({ especialidad: "" }));
  await espera(400, "POST", "/docentes", datosDocente({ antiguedad: -2 }));
  await espera(400, "POST", "/docentes", datosDocente({ antiguedad: 1.5 }));
  await espera(400, "POST", "/docentes", datosDocente({ asignaciones: [{ moduloId: M.I, division: "A" }] }));
  await espera(400, "POST", "/docentes", {});

  const datos = datosDocente();
  const creado = await espera(201, "POST", "/docentes", datos);
  await espera(409, "POST", "/docentes", datosDocente({ dni: datos.dni }));
  await espera(409, "POST", "/docentes", datosDocente({ email: datos.email }));
  // Un alta rechazada no deja registros a medias.
  const antes = (await espera(200, "GET", "/docentes")).length;
  await espera(409, "POST", "/docentes", datosDocente({ email: "director@escuela.com" }));
  assert.equal((await espera(200, "GET", "/docentes")).length, antes);

  // Una asignación a un curso que no existe debe avisarse, no ignorarse.
  const fantasma = await api("POST", "/docentes", datosDocente({ asignaciones: [{ moduloId: M.I, division: "Z", materia: "Historia" }] }));
  assert.equal(fantasma.status, 400, `Asignación a división inexistente -> ${fantasma.status} ${JSON.stringify(fantasma.body).slice(0, 200)}`);

  await espera(404, "GET", "/docentes/99999999");
  await espera(404, "PUT", "/docentes/99999999", datos);
  await espera(400, "GET", "/docentes/abc");
  await espera(204, "DELETE", `/docentes/${creado.id}`);
});

test("DOCENTES 3. Una materia inventada en una asignación no altera el plan de estudios", async () => {
  const antes = (await espera(200, "GET", "/materias")).length;
  const r = await api("POST", "/docentes", datosDocente({ asignaciones: [{ moduloId: M.I, division: "A", materia: `Materia Fantasma ${unico()}` }] }));
  const despues = (await espera(200, "GET", "/materias")).length;
  if (r.status === 201) await espera(204, "DELETE", `/docentes/${r.body.id}`);
  assert.equal(despues, antes, "Asignar un docente no debe crear materias nuevas en el módulo");
  assert.equal(r.status, 400);
});

test("DOCENTES 4. Solo directivo", async () => {
  for (const token of [T.docente, T.preceptor]) {
    await espera(403, "GET", "/docentes", undefined, token);
    await espera(403, "POST", "/docentes", datosDocente(), token);
  }
  await espera(401, "GET", "/docentes", undefined, null);
});

// ============================================================= PRECEPTORES
function datosPreceptor(extra = {}) {
  const dni = unico();
  return {
    nombre: "Pre",
    apellido: "ZZ-TEST",
    dni,
    cuil: cuilDe(dni),
    domicilio: "Calle 3",
    telefono: "2664333333",
    email: `pre${dni}@example.com`,
    titulo: "Preceptor",
    antiguedad: 2,
    ...extra,
  };
}

// Alta en un solo paso: el usuario de acceso se crea junto con el preceptor.
async function crearPreceptor(extra = {}) {
  const datos = datosPreceptor(extra);
  const creado = await espera(201, "POST", "/preceptores", { ...datos, password: "clave1" });
  return { datos, creado };
}

test("PRECEPTORES 1. Alta, consulta, modificación, asignación de cursos y baja", async () => {
  const { datos, creado } = await crearPreceptor();
  assert.equal(creado.dni, datos.dni);
  assert.deepEqual(creado.cursos, []);
  assert.equal((await espera(200, "GET", `/preceptores/${creado.id}`)).email, datos.email);
  assert.ok((await espera(200, "GET", "/preceptores")).some((p) => p.id === creado.id));

  const modificado = await espera(200, "PUT", `/preceptores/${creado.id}`, { ...datos, domicilio: "Nueva 123", antiguedad: 5 });
  assert.equal(modificado.domicilio, "Nueva 123");
  assert.equal(modificado.antiguedad, 5);

  const libres = (await espera(200, "GET", "/preceptores/cursos")).filter((c) => c.preceptor_id === null);
  assert.ok(libres.length >= 1, "Hay al menos un curso sin preceptor para la prueba");
  const curso = libres[0];
  const asignado = await espera(200, "PUT", `/preceptores/${creado.id}/cursos`, { cursoIds: [curso.id] });
  assert.deepEqual(asignado.cursos.map((c) => c.id), [curso.id]);

  // Entra con su usuario y ve solo ese curso.
  const sesion = await login(datos.email, "clave1");
  assert.equal(sesion.status, 200);
  const vista = await espera(200, "GET", "/asistencias/modulos", undefined, sesion.body.token);
  const divisiones = new Set(vista.flatMap((a) => a.modulos.flatMap((m) => m.divisiones)));
  assert.deepEqual([...divisiones], [curso.division.trim()]);
  assert.deepEqual(vista.map((a) => a.anio), [curso.anio_curso]);

  // Lista vacía = quitarle todos los cursos.
  const vacio = await espera(200, "PUT", `/preceptores/${creado.id}/cursos`, { cursoIds: [] });
  assert.deepEqual(vacio.cursos, []);
  assert.deepEqual(await espera(200, "GET", "/asistencias/modulos", undefined, sesion.body.token), []);

  await espera(200, "PUT", `/preceptores/${creado.id}/cursos`, { cursoIds: [curso.id] });
  await espera(200, "DELETE", `/preceptores/${creado.id}`);
  await espera(404, "GET", `/preceptores/${creado.id}`);
  const cursoDespues = (await espera(200, "GET", "/preceptores/cursos")).find((c) => c.id === curso.id);
  assert.equal(cursoDespues.preceptor_id, null, "El curso queda sin preceptor");
  assert.equal((await login(datos.email, "clave1")).status, 401, "Un preceptor eliminado no inicia sesión");
  // El correo queda libre para volver a registrarlo.
  const otraVez = await espera(201, "POST", "/preceptores", { ...datosPreceptor(), email: datos.email, password: "clave2" });
  assert.equal((await login(datos.email, "clave2")).status, 200);
  await espera(200, "DELETE", `/preceptores/${otraVez.id}`);
});

test("PRECEPTORES 2. Validaciones, duplicados e inexistentes", async () => {
  // Sin contraseña y sin un usuario previo con ese correo no se puede dar de alta.
  await espera(409, "POST", "/preceptores", datosPreceptor());
  await espera(400, "POST", "/preceptores", {});
  await espera(400, "POST", "/preceptores", datosPreceptor({ nombre: "" }));
  await espera(400, "POST", "/preceptores", { ...datosPreceptor(), password: "abc" });

  // Camino anterior (dos pasos): registrar el usuario y después vincularlo.
  const enDosPasos = datosPreceptor();
  await espera(201, "POST", "/auth/registro", { nombre: "X", apellido: "Y", email: enDosPasos.email, password: "clave1", rol: "preceptor" });
  const vinculado = await espera(201, "POST", "/preceptores", enDosPasos);
  assert.equal((await login(enDosPasos.email, "clave1")).status, 200);
  await espera(200, "DELETE", `/preceptores/${vinculado.id}`);

  const { datos, creado } = await crearPreceptor();
  const cantidad = (await espera(200, "GET", "/preceptores")).length;
  // DNI repetido: se rechaza y NO queda un usuario suelto con ese correo.
  const repetido = { ...datosPreceptor({ dni: datos.dni }), password: "clave1" };
  await espera(409, "POST", "/preceptores", repetido);
  assert.equal((await login(repetido.email, "clave1")).status, 401);
  await espera(201, "POST", "/preceptores", { ...repetido, dni: unico(), cuil: cuilDe(unico()) });
  // Correo de otro usuario del sistema.
  await espera(409, "POST", "/preceptores", { ...datosPreceptor({ email: "director@escuela.com" }), password: "clave1" });
  assert.equal((await espera(200, "GET", "/preceptores")).length, cantidad + 1);

  for (const [campo, valor] of [["dni", "12"], ["dni", "abcdefgh"], ["email", "mal"], ["antiguedad", -1], ["antiguedad", "mucho"], ["antiguedad", 1.5]]) {
    const r = await api("POST", "/preceptores", { ...datosPreceptor({ [campo]: valor }), password: "clave1" });
    assert.equal(r.status, 400, `Preceptor con ${campo}=${valor} -> ${r.status} ${JSON.stringify(r.body).slice(0, 160)}`);
  }
  await espera(400, "PUT", `/preceptores/${creado.id}`, { ...datos, dni: "12" });
  await espera(409, "PUT", `/preceptores/${creado.id}`, { ...datos, email: "director@escuela.com" });

  await espera(400, "PUT", `/preceptores/${creado.id}`, { nombre: "Solo" });
  await espera(404, "PUT", "/preceptores/99999999", datos);
  await espera(404, "GET", "/preceptores/99999999");
  await espera(400, "GET", "/preceptores/abc");
  await espera(404, "DELETE", "/preceptores/99999999");
  await espera(400, "PUT", `/preceptores/${creado.id}/cursos`, { cursoIds: "1" });
  await espera(400, "PUT", `/preceptores/${creado.id}/cursos`, {});
  await espera(404, "PUT", `/preceptores/${creado.id}/cursos`, { cursoIds: [99999999] });
  await espera(404, "PUT", "/preceptores/99999999/cursos", { cursoIds: [] });
  await espera(200, "DELETE", `/preceptores/${creado.id}`);
});

test("PRECEPTORES 3. Solo directivo", async () => {
  for (const token of [T.docente, T.preceptor]) {
    await espera(403, "GET", "/preceptores", undefined, token);
    await espera(403, "GET", "/preceptores/cursos", undefined, token);
    await espera(403, "POST", "/preceptores", datosPreceptor(), token);
  }
  await espera(401, "GET", "/preceptores", undefined, null);
});

// ======================================================== PLAN DE ESTUDIOS
test("PLAN 1. Materias: listado, alta, duplicado y datos inválidos", async () => {
  const materias = await espera(200, "GET", "/materias");
  assert.ok(materias.length > 0 && Array.isArray(materias[0].modulosIds));
  const nombre = `Materia de prueba ${unico()}`;
  const creada = await espera(201, "POST", "/materias", { nombre });
  assert.equal(creada.nombre, nombre);
  await espera(409, "POST", "/materias", { nombre: `  ${nombre.toUpperCase()} ` });
  await espera(400, "POST", "/materias", { nombre: "   " });
  await espera(400, "POST", "/materias", {});
  await espera(400, "POST", "/materias", { nombre: `Otra ${unico()}`, modulosIds: [99999] });
});

test("PLAN 2. Ciclo lectivo: consulta y alta", async () => {
  const { cicloActivo, ciclos } = await espera(200, "GET", "/ciclo-lectivo");
  assert.equal(cicloActivo.anio, CICLO);
  assert.ok(ciclos.every((c) => ["Activo", "Próximo", "Cerrado"].includes(c.estado)));
  await espera(400, "POST", "/ciclo-lectivo", { anio: 1990 });
  await espera(400, "POST", "/ciclo-lectivo", { anio: "dos mil" });
  await espera(400, "POST", "/ciclo-lectivo", {});
  const repetido = await espera(201, "POST", "/ciclo-lectivo", { anio: CICLO });
  assert.equal(repetido.id, cicloActivo.id, "Pedir un ciclo existente no lo duplica");

  // Un ciclo futuro se crea como "Próximo" y no pasa a ser el activo.
  const futuro = await espera(201, "POST", "/ciclo-lectivo", { anio: CICLO + 3 });
  assert.equal(futuro.anio, CICLO + 3);
  const despues = await espera(200, "GET", "/ciclo-lectivo");
  assert.equal(despues.cicloActivo.anio, CICLO);
  assert.equal(despues.ciclos.find((c) => c.anio === CICLO + 3).estado, "Próximo");
  assert.equal((await espera(200, "GET", "/calificaciones/ciclos")).cicloActivo.anio, CICLO);
});

test("PLAN 3. Crear, dar de baja y REACTIVAR un plan de estudios", async () => {
  const inicio = await espera(200, "GET", "/plan-estudio/actual");
  const original = inicio.planActual;
  assert.ok(original, "Hay un plan vigente al empezar");
  const modulos = original.anios.flatMap((a) => a.modulos).map((m) => ({ moduloId: m.id, materiasIds: m.materias.map((x) => x.id) }));
  const materiasAntes = await espera(200, "GET", "/materias");

  // Validaciones del alta.
  const base = { titulo: `Plan de prueba ${unico()}`, resolucion: "Res. de prueba", orientacion: "Ciencias Sociales", anioInicio: CICLO, modulos };
  await espera(400, "POST", "/plan-estudio", { ...base, titulo: " " });
  await espera(400, "POST", "/plan-estudio", { ...base, resolucion: "" });
  await espera(400, "POST", "/plan-estudio", { ...base, modulos: [] });
  await espera(400, "POST", "/plan-estudio", { ...base, modulos: [{ moduloId: M.I, materiasIds: [] }] });
  await espera(400, "POST", "/plan-estudio", { ...base, modulos: [{ moduloId: "x", materiasIds: [1] }] });
  await espera(400, "POST", "/plan-estudio", { ...base, modulos: [{ moduloId: 99999, materiasIds: [1] }] });
  await espera(400, "POST", "/plan-estudio", { ...base, modulos: [{ moduloId: M.I, materiasIds: [99999999] }] });
  await espera(400, "POST", "/plan-estudio", { ...base, anioInicio: "ayer" });
  assert.equal((await espera(200, "GET", "/plan-estudio/actual")).planActual.id, original.id, "Un alta rechazada no cambia el plan vigente");

  // Alta: el nuevo queda vigente y el anterior pasa a inactivo.
  const nuevo = await espera(201, "POST", "/plan-estudio", base);
  assert.deepEqual([nuevo.estado, nuevo.activo], ["Vigente", true]);
  let estado = await espera(200, "GET", "/plan-estudio/actual");
  assert.equal(estado.planActual.id, nuevo.id);
  assert.deepEqual(
    [estado.planesInactivos.find((p) => p.id === original.id)?.estado, estado.planesInactivos.find((p) => p.id === original.id)?.activo],
    ["Inactivo", false],
  );
  assert.equal(estado.historial.filter((p) => p.activo).length, 1, "Un solo plan vigente");

  // Baja lógica del vigente: queda inactivo y no hay plan actual.
  const baja = await espera(200, "DELETE", `/plan-estudio/${nuevo.id}`);
  assert.equal(baja.plan.estado, "Inactivo");
  estado = await espera(200, "GET", "/plan-estudio/actual");
  assert.equal(estado.planActual, null);
  assert.ok(estado.planesInactivos.some((p) => p.id === nuevo.id));

  // REACTIVAR: un plan inactivo vuelve a estar vigente.
  const reactivado = await espera(200, "PATCH", `/plan-estudio/${nuevo.id}/reactivar`);
  assert.deepEqual([reactivado.plan.estado, reactivado.plan.activo], ["Vigente", true]);
  estado = await espera(200, "GET", "/plan-estudio/actual");
  assert.equal(estado.planActual.id, nuevo.id);

  // Reactivar otro mientras hay uno vigente: lo reemplaza (siempre uno solo).
  await espera(200, "PATCH", `/plan-estudio/${original.id}/reactivar`);
  estado = await espera(200, "GET", "/plan-estudio/actual");
  assert.equal(estado.planActual.id, original.id);
  assert.equal(estado.historial.filter((p) => p.activo).length, 1);
  assert.equal(estado.planesInactivos.find((p) => p.id === nuevo.id).estado, "Inactivo");
  assert.deepEqual(
    estado.planActual.anios.flatMap((a) => a.modulos).map((m) => m.materias.length),
    original.anios.flatMap((a) => a.modulos).map((m) => m.materias.length),
    "El plan reactivado conserva sus materias",
  );

  // Reactivar el que ya está vigente no rompe nada.
  await espera(409, "PATCH", `/plan-estudio/${original.id}/reactivar`);
  await espera(404, "PATCH", "/plan-estudio/99999999/reactivar");
  await espera(400, "PATCH", "/plan-estudio/abc/reactivar");
  await espera(404, "DELETE", "/plan-estudio/99999999");
  await espera(400, "DELETE", "/plan-estudio/abc");

  // --- Plan de estudios de cada alumno ---
  // Se fija en la primera matrícula (plan vigente) y no cambia con el plan.
  const alumnoViejo = await alumnoMatriculado();
  assert.deepEqual(
    [alumnoViejo.planEstudio.id, alumnoViejo.planEstudio.titulo, alumnoViejo.planEstudio.vigente],
    [original.id, original.titulo, true],
  );
  const sinMatricula = await espera(201, "POST", "/alumnos", datosAlumno());
  assert.equal(sinMatricula.planEstudio, null, "Sin matrícula todavía no tiene plan");

  await espera(200, "PATCH", `/plan-estudio/${nuevo.id}/reactivar`);
  const alumnoNuevo = await alumnoMatriculado();
  assert.equal(alumnoNuevo.planEstudio.id, nuevo.id, "El que ingresa ahora pertenece al plan nuevo");
  const viejoDespues = await espera(200, "GET", `/alumnos/${alumnoViejo.id}`);
  assert.deepEqual([viejoDespues.planEstudio.id, viejoDespues.planEstudio.vigente], [original.id, false], "Conserva su plan, ahora inactivo");
  // Cambiar de módulo no le cambia el plan.
  await espera(200, "PUT", `/alumnos/${alumnoViejo.id}/cursadas`, { idCurso: cursoDe(M.II).id, idModulo: M.II });
  assert.equal((await espera(200, "GET", `/alumnos/${alumnoViejo.id}`)).planEstudio.id, original.id);
  assert.equal((await espera(200, "GET", "/alumnos")).find((x) => x.id === alumnoNuevo.id).planEstudio.titulo, nuevo.titulo);
  await espera(200, "PATCH", `/plan-estudio/${original.id}/reactivar`);

  // Crear/reactivar planes no altera las materias de cada módulo.
  assert.deepEqual(await espera(200, "GET", "/materias"), materiasAntes);
});

test("PLAN 4. Solo directivo", async () => {
  for (const token of [T.docente, T.preceptor]) {
    await espera(403, "GET", "/plan-estudio/actual", undefined, token);
    await espera(403, "GET", "/materias", undefined, token);
    await espera(403, "POST", "/ciclo-lectivo", { anio: CICLO }, token);
    await espera(403, "PATCH", "/plan-estudio/1/reactivar", undefined, token);
  }
  await espera(401, "GET", "/plan-estudio/actual", undefined, null);
});

// ================================================================ REPORTES
test("REPORTES 1. Inasistencias: solo alumnos LIBRES por faltas, filtros y datos", async () => {
  const a = await alumnoMatriculado(M.I, "D");
  const enReporte = async (id = a.id) =>
    (await espera(200, "GET", "/reportes/inasistencias")).alertas.some((x) => x.alumnoId === id);
  let ultima;
  for (let dia = 1; dia <= 26; dia++) {
    ultima = await espera(201, "POST", "/asistencias", {
      cursadaModuloId: a.cursada.idCursada,
      fecha: `${CICLO}-${dia <= 13 ? "03" : "04"}-${String(dia <= 13 ? dia : dia - 13).padStart(2, "0")}`,
      valorFalta: 1,
    });
    // Con 25 faltas justas sigue regular: todavía no figura.
    if (dia === 25) assert.equal(await enReporte(), false, "25 faltas: regular, no figura");
  }
  assert.equal(await enReporte(), true, "26 faltas: libre, figura");

  // Caso reportado: se corrige una falta (26 -> 25), deja de estar libre y sale del reporte.
  await espera(200, "PUT", `/asistencias/${ultima.id}`, { valorFalta: 0 });
  assert.equal(await enReporte(), false, "Volvió a 25: ya no figura");
  await espera(200, "PUT", `/asistencias/${ultima.id}`, { valorFalta: 1 });
  assert.equal(await enReporte(), true);

  // Un módulo aprobado nunca figura, aunque después se le carguen faltas.
  const aprobado = await alumnoMatriculado(M.I, "D");
  for (const m of aprobado.cursada.materias) {
    await espera(200, "PUT", "/calificaciones", { cursadaModuloId: aprobado.cursada.idCursada, materiaId: m.id, estado: "Aprobado", anio: CICLO });
  }
  await espera(201, "POST", "/alumnos/evaluaciones-modulo", { idCursadaModulo: aprobado.cursada.idCursada, fecha: `${CICLO}-06-20`, nota: 9, nroInstancia: 1 });
  for (let dia = 1; dia <= 27; dia++) {
    await espera(201, "POST", "/asistencias", { cursadaModuloId: aprobado.cursada.idCursada, fecha: `${CICLO}-${dia <= 14 ? "08" : "09"}-${String(dia <= 14 ? dia : dia - 14).padStart(2, "0")}`, valorFalta: 1 });
  }
  assert.equal(await enReporte(aprobado.id), false, "Módulo aprobado: no figura");

  // Libre por otro motivo (materia desaprobada) con pocas faltas: tampoco.
  const otroMotivo = await alumnoMatriculado(M.I, "D");
  await espera(200, "PUT", "/calificaciones", { cursadaModuloId: otroMotivo.cursada.idCursada, materiaId: otroMotivo.cursada.materias[0].id, estado: "Desaprobado", anio: CICLO });
  assert.equal(await enReporte(otroMotivo.id), false);

  const reporte = await espera(200, "GET", "/reportes/inasistencias");
  assert.equal(reporte.umbralFaltas, 25);
  assert.equal(reporte.totalAlertas, reporte.alertas.length);
  const fila = reporte.alertas.find((x) => x.alumnoId === a.id);
  assert.ok(fila, "El alumno con 26 faltas aparece en el reporte");
  assert.equal(fila.faltas, 26);
  assert.equal(fila.condicion, "LIBRE");
  // En este reporte `nombre` es el nombre completo (así lo muestra la pantalla).
  assert.equal(fila.nombre, "Api ZZ-TEST");
  assert.equal(fila.apellido, "ZZ-TEST");
  assert.ok(reporte.alertas.every((x) => x.faltas > 25 && x.condicion === "LIBRE"));
  // Cada alumno muestra el plan de estudios al que pertenece.
  const planVigente = (await espera(200, "GET", "/plan-estudio/actual")).planActual;
  assert.equal(fila.planEstudio, planVigente.titulo);

  const filtrado = await espera(200, "GET", `/reportes/inasistencias?curso=1&division=D&anio=${CICLO}&moduloId=${M.I}`);
  assert.ok(filtrado.alertas.some((x) => x.alumnoId === a.id));
  assert.ok(filtrado.alertas.every((x) => x.curso === "1" && x.division === "D"));
  assert.ok(!(await espera(200, "GET", "/reportes/inasistencias?division=A")).alertas.some((x) => x.alumnoId === a.id));
  assert.ok(!(await espera(200, "GET", `/reportes/inasistencias?anio=${CICLO - 1}`)).alertas.some((x) => x.alumnoId === a.id));
  assert.ok(!(await espera(200, "GET", "/reportes/inasistencias?minFaltas=27")).alertas.some((x) => x.alumnoId === a.id));
  assert.ok((await espera(200, "GET", "/reportes/inasistencias?minFaltas=26")).alertas.some((x) => x.alumnoId === a.id));

  await espera(400, "GET", "/reportes/inasistencias?anio=abc");
  await espera(400, "GET", "/reportes/inasistencias?moduloId=abc");
  await espera(400, "GET", "/reportes/inasistencias?minFaltas=muchas");
  await espera(400, "GET", "/reportes/inasistencias?minFaltas=-1");
  await espera(400, "GET", "/reportes/inasistencias?curso=abc");

  // Un alumno dado de baja no figura en el reporte.
  await espera(204, "DELETE", `/alumnos/${a.id}`);
  assert.ok(!(await espera(200, "GET", "/reportes/inasistencias")).alertas.some((x) => x.alumnoId === a.id), "Alumno dado de baja no aparece");
});

test("REPORTES 2. Desaprobaciones por materia: cuentas y filtros", async () => {
  const reporte = await espera(200, "GET", "/reportes/desaprobaciones");
  assert.equal(reporte.totalRegistros, reporte.resultados.length);
  for (const r of reporte.resultados) {
    assert.ok(r.desaprobados + r.aprobados <= r.evaluados);
    assert.equal(r.porcentaje, Math.round((r.desaprobados / r.evaluados) * 100));
  }

  // Una desaprobación nueva se refleja en la materia, curso y división correctos.
  const a = await alumnoMatriculado(M.II, "D");
  const materia = a.cursada.materias[0];
  const buscar = async () =>
    (await espera(200, "GET", `/reportes/desaprobaciones?curso=1&division=D&anio=${CICLO}`)).resultados.find(
      (r) => r.materiaId === materia.id && r.modulo === a.cursada.modulo,
    );
  const antes = await buscar();
  await espera(200, "PUT", "/calificaciones", { cursadaModuloId: a.cursada.idCursada, materiaId: materia.id, estado: "Desaprobado", anio: CICLO });
  const despues = await buscar();
  assert.equal(despues.desaprobados, (antes?.desaprobados ?? 0) + 1);
  assert.equal(despues.evaluados, (antes?.evaluados ?? 0) + 1);

  const porDivision = await espera(200, "GET", "/reportes/desaprobaciones?division=d");
  assert.ok(porDivision.resultados.every((r) => r.division === "D"));
  assert.deepEqual((await espera(200, "GET", `/reportes/desaprobaciones?anio=${CICLO - 1}`)).resultados, []);
  await espera(400, "GET", "/reportes/desaprobaciones?anio=1500");
  await espera(400, "GET", "/reportes/desaprobaciones?curso=abc");
});

test("REPORTES 3. Solo directivo", async () => {
  for (const token of [T.docente, T.preceptor]) {
    await espera(403, "GET", "/reportes/inasistencias", undefined, token);
    await espera(403, "GET", "/reportes/desaprobaciones", undefined, token);
  }
  await espera(401, "GET", "/reportes/inasistencias", undefined, null);
});
