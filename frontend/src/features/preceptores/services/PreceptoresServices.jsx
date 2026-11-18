import { apiFetch } from "../../../shared/services/api.js";

export async function getPreceptores() {
  return apiFetch("/preceptores");
}

// En un alta puede incluir `password`: el backend crea también el usuario
// de acceso del preceptor.
export async function setPreceptor(preceptor) {
  const { id, ...datos } = preceptor;
  return apiFetch(id ? `/preceptores/${id}` : `/preceptores`, {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(datos),
  });
}

// Baja lógica: el preceptor queda inactivo (no inicia sesión) y conserva sus
// datos y sus cursos.
export async function inactivarPreceptor(id) {
  return apiFetch(`/preceptores/${id}/inactivar`, { method: "PATCH" });
}

export async function reactivarPreceptor(id) {
  return apiFetch(`/preceptores/${id}/reactivar`, { method: "PATCH" });
}

// Eliminación definitiva: el backend solo la permite si está inactivo.
export async function borrarPreceptor(id) {
  await apiFetch(`/preceptores/${id}`, { method: "DELETE" });
}

export const getCursos = () => apiFetch("/preceptores/cursos");

export const asignarCursos = (preceptorId, cursoIds) =>
  apiFetch(`/preceptores/${preceptorId}/cursos`, {
    method: "PUT",
    body: JSON.stringify({ cursoIds }),
  });
