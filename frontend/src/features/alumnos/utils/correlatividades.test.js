import assert from "node:assert/strict";
import test from "node:test";
import { analizarMatricula, ordenIngreso } from "./correlatividades.js";

// Catálogo como lo manda GET /cursos: III y IV piden I y II; V y VI piden III y IV.
const modulos = [
  { id: 1, numeroLeyenda: "Modulo I", anioCurso: 1, periodo: 1 },
  { id: 2, numeroLeyenda: "Modulo II", anioCurso: 1, periodo: 2 },
  { id: 3, numeroLeyenda: "Modulo III", anioCurso: 2, periodo: 1 },
  { id: 4, numeroLeyenda: "Modulo IV", anioCurso: 2, periodo: 2 },
  { id: 5, numeroLeyenda: "Modulo V", anioCurso: 3, periodo: 1 },
  { id: 6, numeroLeyenda: "Modulo VI", anioCurso: 3, periodo: 2 },
];
const catalogo = Object.fromEntries(
  modulos.map((modulo) => [
    modulo.id,
    {
      ...modulo,
      correlativos:
        modulo.anioCurso === 2
          ? [{ id: 1, numeroLeyenda: "Modulo I" }, { id: 2, numeroLeyenda: "Modulo II" }]
          : modulo.anioCurso === 3
            ? [{ id: 3, numeroLeyenda: "Modulo III" }, { id: 4, numeroLeyenda: "Modulo IV" }]
            : [],
    },
  ]),
);

// Cada cursada: [moduloId, estadoAcademico, opciones]. Por defecto tiene datos.
const conCursadas = (...cursadas) => ({
  trayectoria: cursadas.map(([moduloId, estadoAcademico, extra = {}]) => ({
    moduloId,
    estadoAcademico,
    activa: false,
    tieneDatos: true,
    ...extra,
  })),
});

const bloqueantes = (alumno, moduloId) =>
  analizarMatricula(alumno, moduloId, catalogo).bloqueantes.map((m) => m.id);

// --- Alta: el primer módulo es el de ingreso, puede ser cualquiera ---------
for (const moduloId of [1, 2, 3, 4, 5, 6]) {
  test(`alumno nuevo: puede ingresar en el Módulo ${moduloId}`, () => {
    assert.deepEqual(bloqueantes(null, moduloId), []);
    assert.deepEqual(bloqueantes({ trayectoria: [] }, moduloId), []);
  });
}

// --- Mismo año: no hay correlatividad ---------------------------------------
for (const [nombre, alumno, moduloId] of [
  ["I en curso: puede pasar a II", conCursadas([1, "EN_CURSO"]), 2],
  ["I pendiente (debe una mesa): puede pasar a II", conCursadas([1, "PENDIENTE"]), 2],
  ["I libre: puede cursar II", conCursadas([1, "A_RECURSAR"]), 2],
  ["III en curso: puede pasar a IV", conCursadas([1, "APROBADO"], [2, "APROBADO"], [3, "EN_CURSO"]), 4],
  ["III libre: puede cursar IV", conCursadas([1, "APROBADO"], [2, "APROBADO"], [3, "A_RECURSAR"]), 4],
]) {
  test(`mismo año no bloquea: ${nombre}`, () => {
    assert.deepEqual(bloqueantes(alumno, moduloId), []);
  });
}

// --- Desde el ingreso, las correlatividades se aplican ----------------------
test("ingresó en I, aprobó I y II libre: III queda bloqueado por II", () => {
  const resultado = analizarMatricula(
    conCursadas([1, "APROBADO"], [2, "A_RECURSAR"]),
    3,
    catalogo,
  );
  assert.deepEqual(resultado.bloqueantes.map((m) => m.id), [2]);
  assert.equal(resultado.bloqueantes[0].libre, true);
});

test("ingresó en I y nunca cursó II: III queda bloqueado por II (sin cursar)", () => {
  const resultado = analizarMatricula(conCursadas([1, "APROBADO"]), 3, catalogo);
  assert.deepEqual(resultado.bloqueantes.map((m) => m.id), [2]);
  assert.equal(resultado.bloqueantes[0].cursado, false);
});

test("V con III aprobado y IV en curso: bloquea por IV", () => {
  assert.deepEqual(
    bloqueantes(conCursadas([1, "APROBADO"], [2, "APROBADO"], [3, "APROBADO"], [4, "EN_CURSO"]), 5),
    [4],
  );
});

test("ingresó en III: para V pide III y IV, no I ni II", () => {
  assert.deepEqual(bloqueantes(conCursadas([3, "APROBADO"]), 5), [4]);
  assert.deepEqual(bloqueantes(conCursadas([3, "APROBADO"], [4, "APROBADO"]), 5), []);
});

test("ingresó en V: VI no pide nada (mismo año)", () => {
  assert.deepEqual(bloqueantes(conCursadas([5, "EN_CURSO"]), 6), []);
});

// --- Corrección de una matrícula vacía -------------------------------------
test("la cursada activa vacía no cuenta como ingreso: se puede corregir de I a V", () => {
  const recienRegistrado = conCursadas([1, "EN_CURSO", { activa: true, tieneDatos: false }]);
  assert.equal(ordenIngreso(recienRegistrado, catalogo), null);
  assert.deepEqual(bloqueantes(recienRegistrado, 5), []);
});

test("con datos cargados en I, ya no se puede saltar a V", () => {
  const conFaltas = conCursadas([1, "EN_CURSO", { activa: true, tieneDatos: true }]);
  assert.equal(ordenIngreso(conFaltas, catalogo), 1);
  assert.deepEqual(bloqueantes(conFaltas, 5), [3, 4]);
});

test("un módulo aprobado no se vuelve a cursar", () => {
  assert.equal(analizarMatricula(conCursadas([1, "APROBADO"]), 1, catalogo).yaAprobado, true);
});
