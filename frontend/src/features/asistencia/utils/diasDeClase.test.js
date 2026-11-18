import assert from "node:assert/strict";
import test from "node:test";
import {
  esFinDeSemana,
  motivoFechaSinClase,
  rangoDeClases,
  ultimoDiaDeClase,
} from "./diasDeClase.js";

const HOY = "2026-11-18"; // miércoles
const moduloI = { periodo: 1, anio: 2026, modulo: "Modulo I" };
const moduloII = { periodo: 2, anio: 2026, modulo: "Modulo II" };

test("sábados y domingos no son días de clase", () => {
  assert.equal(esFinDeSemana("2026-11-14"), true);
  assert.equal(esFinDeSemana("2026-11-15"), true);
  assert.equal(esFinDeSemana("2026-11-16"), false);
  assert.match(motivoFechaSinClase("2026-11-14", moduloII, HOY), /sábados ni los domingos/);
});

test("I, III y V: de marzo a julio", () => {
  assert.equal(motivoFechaSinClase("2026-03-02", moduloI, HOY), null);
  assert.equal(motivoFechaSinClase("2026-07-31", moduloI, HOY), null);
  assert.match(motivoFechaSinClase("2026-08-03", moduloI, HOY), /marzo a julio/);
  assert.match(motivoFechaSinClase("2026-02-27", moduloI, HOY), /marzo a julio/);
  assert.deepEqual(rangoDeClases(1, 2026, HOY), { min: "2026-03-01", max: "2026-07-31" });
});

test("II, IV y VI: de agosto a diciembre, hasta hoy", () => {
  assert.equal(motivoFechaSinClase("2026-08-03", moduloII, HOY), null);
  assert.match(motivoFechaSinClase("2026-05-05", moduloII, HOY), /agosto a diciembre/);
  assert.match(motivoFechaSinClase("2026-11-20", moduloII, HOY), /futura/);
  assert.deepEqual(rangoDeClases(2, 2026, HOY), { min: "2026-08-01", max: HOY });
});

test("la planilla abre en el último día de clase", () => {
  assert.equal(ultimoDiaDeClase(1, 2026, HOY), "2026-07-31");
  assert.equal(ultimoDiaDeClase(2, 2026, HOY), HOY);
  assert.equal(ultimoDiaDeClase(2, 2026, "2026-11-15"), "2026-11-13"); // domingo -> viernes
  assert.equal(ultimoDiaDeClase(2, 2026, "2026-05-10"), null); // todavía no empezó
});
