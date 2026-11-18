import { apiFetch } from "../../../shared/services/api.js";

export async function getModulos() {
  return apiFetch("/docentes/modulos");
}

export async function getDocentes() {
  return apiFetch("/docentes");
}

export async function setDocente(docente) {
  return apiFetch(docente.id ? `/docentes/${docente.id}` : "/docentes", {
    method: docente.id ? "PUT" : "POST",
    body: JSON.stringify(docente),
  });
}

// Baja lógica: el docente queda inactivo (no inicia sesión) y conserva sus datos.
export async function inactivarDocente(id) {
  return apiFetch(`/docentes/${id}/inactivar`, { method: "PATCH" });
}

export async function reactivarDocente(id) {
  return apiFetch(`/docentes/${id}/reactivar`, { method: "PATCH" });
}

// Eliminación definitiva: el backend solo la permite si el docente está inactivo.
export async function borrarDocente(id) {
  await apiFetch(`/docentes/${id}`, { method: "DELETE" });
}
