import assert from "node:assert/strict";
import test from "node:test";
import {
  esCuilValido,
  esDniValido,
  esTelefonoValido,
  normalizarCuil,
} from "../src/utils/validacionesPersona.js";
import { HttpError } from "../src/utils/httpError.js";
import { traducirUnicidadPersona } from "../src/utils/errorUnicidadPersona.js";
import { errorHandler } from "../src/middlewares/errorHandler.js";
import { crear as crearAlumno } from "../src/modules/alumnos/alumnos.service.js";
import { crear as crearDocente } from "../src/modules/docentes/docentes.service.js";
import { crear as crearPreceptor } from "../src/modules/preceptores/preceptores.service.js";

async function rechazaConCampo(promise, campo) {
  await assert.rejects(
    promise,
    (error) =>
      error.status === 400 &&
      error.detalle?.campo === campo,
  );
}

test("DNI permite 7 u 8 dígitos, incluso con separadores", () => {
  assert.equal(esDniValido("1234567"), true);
  assert.equal(esDniValido("12.345.678"), true);
  assert.equal(esDniValido("123456"), false);
  assert.equal(esDniValido("123456789"), false);
  assert.equal(esDniValido("1234abcd"), false);
});

test("CUIL debe tener 11 dígitos y coincidir con el DNI, sin validar verificador", () => {
  const cuil = "20-12345678-6";
  assert.equal(esCuilValido(cuil, "12345678"), true);
  assert.equal(esCuilValido("20-12345678-0", "12345678"), true);
  assert.equal(esCuilValido("20-01234567-5", "1234567"), true);
  assert.equal(esCuilValido(cuil, "1234567"), false);
  assert.equal(esCuilValido("20-87654321-0", "12345678"), false);
  assert.equal(esCuilValido("20-12345678", "12345678"), false);
  assert.equal(normalizarCuil(cuil.replace(/\D/g, "")), cuil);
});

test("teléfono admite 8 a 15 dígitos y es opcional cuando se indica", () => {
  assert.equal(esTelefonoValido("26641234"), true);
  assert.equal(esTelefonoValido("+54 (266) 4123-4567"), true);
  assert.equal(esTelefonoValido("1234567"), false);
  assert.equal(esTelefonoValido("1234567890123456"), false);
  assert.equal(esTelefonoValido("", true), false);
  assert.equal(esTelefonoValido(""), true);
});

test("los errores del backend incluyen el campo que debe resaltar el formulario", () => {
  const response = {
    status(status) {
      this.statusCode = status;
      return this;
    },
    json(body) {
      this.body = body;
      return body;
    },
  };

  errorHandler(
    new HttpError(409, "Ya existe una persona con ese DNI", { campo: "dni" }),
    {},
    response,
    () => {},
  );

  assert.equal(response.statusCode, 409);
  assert.deepEqual(response.body, {
    error: "Ya existe una persona con ese DNI",
    campo: "dni",
  });
});

test("los duplicados de DNI, CUIL y correo se traducen al campo correcto", () => {
  for (const [constraint, campo] of [
    ["persona_dni_key", "dni"],
    ["persona_cuil_key", "cuil"],
    ["usuarios_email_key", "email"],
  ]) {
    const error = traducirUnicidadPersona({ code: "23505", constraint });
    assert.equal(error.status, 409);
    assert.equal(error.detalle.campo, campo);
  }
});

test("alumnos, docentes y preceptores rechazan un CUIL que no coincide con el DNI", async () => {
  const persona = {
    nombre: "Prueba",
    apellido: "Validación",
    dni: "12345678",
    cuil: "20-87654321-0",
    domicilio: "Calle 1",
    email: "persona@example.com",
    telefono: "",
  };

  await rechazaConCampo(
    crearAlumno({
      ...persona,
      fechaNacimiento: "1988-02-20",
      lugarNacimiento: "San Luis",
      telefonoEmergencia: "2664123456",
      cantidadHijos: 0,
      trabaja: false,
    }),
    "cuil",
  );
  await rechazaConCampo(
    crearDocente({
      ...persona,
      especialidad: "Historia",
      antiguedad: 1,
      password: "1234",
      asignaciones: [],
    }),
    "cuil",
  );
  await rechazaConCampo(
    crearPreceptor({
      ...persona,
      titulo: "Docencia",
      antiguedad: 1,
      password: "1234",
    }),
    "cuil",
  );
});
