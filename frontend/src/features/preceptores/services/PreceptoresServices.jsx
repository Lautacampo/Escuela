import { apiFetch } from "../../../shared/services/api.js";

export async function getPreceptores() {
  return apiFetch("/preceptores");
}

export async function setPreceptor(preceptor) {
  const { id, ...datos } = preceptor;
  return apiFetch(id ? `/preceptores/${id}` : `/preceptores`, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(datos),
  });
}

// Llama a POST /api/auth/registro con el mail y contraseña del preceptor recién creado
export async function registrarUsuarioPreceptor({
  nombre,
  apellido,
  email,
  password,
}) {
  return apiFetch("/auth/registro", {
    method: "POST",
    body: JSON.stringify({
      nombre,
      apellido,
      email,
      password,
      rol: "preceptor",
    }),
  });
}

export async function borrarPreceptor(id) {
  await apiFetch(`/preceptores/${id}`, { method: "DELETE" });
}

export const getCursos = () => apiFetch("/preceptores/cursos");

export const asignarCursos = (preceptorId, cursoIds) =>
  apiFetch(`/preceptores/${preceptorId}/cursos`, {
    method: "PUT",
    body: JSON.stringify({ cursoIds }),
  });
