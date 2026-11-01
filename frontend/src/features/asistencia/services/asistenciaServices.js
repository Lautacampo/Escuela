import { apiFetch } from "../../../shared/services/api.js";

export async function getModulos() {
  return apiFetch("/modulos");
}

export async function getAlumnos() {
  return apiFetch("/alumnos");
}

export async function getAsistencias() {
  return apiFetch("/asistencias");
}

export async function setAsistencia(asi) {
  return apiFetch(asi.id ? `/asistencias/${asi.id}` : "/asistencias", {
    method: asi.id ? "PUT" : "POST",
    body: JSON.stringify(asi),
  });
}
