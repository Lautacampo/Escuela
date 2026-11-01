import { apiFetch } from "../../../shared/services/api.js";

export async function getModulos() {
  return apiFetch("/modulos");
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

export async function borrarDocente(id) {
  await apiFetch(`/docentes/${id}`, { method: "DELETE" });
}
