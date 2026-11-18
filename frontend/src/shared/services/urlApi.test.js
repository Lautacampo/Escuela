import assert from "node:assert/strict";
import test from "node:test";
import { normalizarUrlApi } from "./urlApi.js";

const RENDER = "https://escuela.onrender.com";

test("la URL correcta queda igual", () => {
  assert.equal(normalizarUrlApi(`${RENDER}/api`), `${RENDER}/api`);
  assert.equal(normalizarUrlApi("http://localhost:4000/api"), "http://localhost:4000/api");
});

test("sin /api, se agrega", () => {
  assert.equal(normalizarUrlApi(RENDER), `${RENDER}/api`);
  assert.equal(normalizarUrlApi(`${RENDER}/`), `${RENDER}/api`);
  assert.equal(normalizarUrlApi("http://localhost:4000"), "http://localhost:4000/api");
});

test("con barra final o /api repetido, se corrige", () => {
  assert.equal(normalizarUrlApi(`${RENDER}/api/`), `${RENDER}/api`);
  assert.equal(normalizarUrlApi(`${RENDER}/api//`), `${RENDER}/api`);
  assert.equal(normalizarUrlApi(`${RENDER}/api/api`), `${RENDER}/api`);
  assert.equal(normalizarUrlApi(`  ${RENDER}/API  `), `${RENDER}/api`);
});

test("vacía o sin definir devuelve vacío", () => {
  assert.equal(normalizarUrlApi(undefined), "");
  assert.equal(normalizarUrlApi(""), "");
  assert.equal(normalizarUrlApi("   "), "");
});
