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
