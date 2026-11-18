import assert from "node:assert/strict";
import test from "node:test";
import { analizarMatricula } from "./correlatividades.js";

const modulos = [
  { id: 1, numeroLeyenda: "Modulo I", anioCurso: 1, periodo: 1 },
  { id: 2, numeroLeyenda: "Modulo II", anioCurso: 1, periodo: 2 },
  { id: 3, numeroLeyenda: "Modulo III", anioCurso: 2, periodo: 1 },
  { id: 4, numeroLeyenda: "Modulo IV", anioCurso: 2, periodo: 2 },
  { id: 5, numeroLeyenda: "Modulo V", anioCurso: 3, periodo: 1 },
  { id: 6, numeroLeyenda: "Modulo VI", anioCurso: 3, periodo: 2 },
];

const catalogo = Object.fromEntries(modulos.map((modulo) => [modulo.id, modulo]));

for (const [moduloId, esperados] of [
  [2, [1]],
  [4, [1, 2, 3]],
  [6, [1, 2, 3, 4, 5]],
]) {
  test(`el ingreso a Módulo ${moduloId} requiere equivalencias de todos los módulos previos`, () => {
    const resultado = analizarMatricula(null, moduloId, catalogo);
    assert.deepEqual(
      resultado.porEquivalencia.map((modulo) => modulo.id),
      esperados
    );
  });
}

test("no solicita equivalencia de un módulo previo ya acreditado", () => {
  const resultado = analizarMatricula(
    { equivalencias: [{ moduloId: 1 }] },
    2,
    catalogo
  );
  assert.deepEqual(resultado.porEquivalencia, []);
});

// Con correlativos (como los manda GET /cursos): III y IV piden I y II; V y VI piden III y IV.
const conCorrelativos = Object.fromEntries(
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
const conCursadas = (...cursadas) => ({
  equivalencias: [],
  trayectoria: cursadas.map(([moduloId, estadoAcademico]) => ({ moduloId, estadoAcademico })),
});

for (const [nombre, alumno, moduloId] of [
  ["I en curso: puede pasar a II", conCursadas([1, "EN_CURSO"]), 2],
  ["I pendiente (debe una mesa): puede pasar a II", conCursadas([1, "PENDIENTE"]), 2],
  ["I libre: puede cursar II (mismo año)", conCursadas([1, "A_RECURSAR"]), 2],
  ["III en curso: puede pasar a IV", conCursadas([1, "APROBADO"], [2, "APROBADO"], [3, "EN_CURSO"]), 4],
  ["III libre: puede cursar IV (mismo año)", conCursadas([1, "APROBADO"], [2, "APROBADO"], [3, "A_RECURSAR"]), 4],
]) {
  test(`mismo año no bloquea: ${nombre}`, () => {
    const resultado = analizarMatricula(alumno, moduloId, conCorrelativos);
    assert.deepEqual(resultado.bloqueantes, []);
    assert.deepEqual(resultado.porEquivalencia, []);
  });
}

test("un correlativo de un año anterior sin aprobar sí bloquea", () => {
  const resultado = analizarMatricula(
    conCursadas([1, "APROBADO"], [2, "A_RECURSAR"]),
    3,
    conCorrelativos,
  );
  assert.deepEqual(resultado.bloqueantes.map((m) => m.id), [2]);
  assert.equal(resultado.bloqueantes[0].libre, true);
});

test("V con III aprobado y IV en curso: bloquea por IV", () => {
  const resultado = analizarMatricula(
    conCursadas([1, "APROBADO"], [2, "APROBADO"], [3, "APROBADO"], [4, "EN_CURSO"]),
    5,
    conCorrelativos,
  );
  assert.deepEqual(resultado.bloqueantes.map((m) => m.id), [4]);
});
