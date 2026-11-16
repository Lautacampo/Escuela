import { apiFetch } from "../../../shared/services/api.js";

export const getPlanEstudioActual = () => apiFetch("/plan-estudio/actual");

export const crearPlanEstudio = (datos) =>
  apiFetch("/plan-estudio", {
    method: "POST",
    body: JSON.stringify(datos),
  });

export const eliminarPlanEstudio = (id) =>
  apiFetch(`/plan-estudio/${id}`, {
    method: "DELETE",
  });

// Vuelve a poner vigente un plan inactivo.
export const reactivarPlanEstudio = (id) =>
  apiFetch(`/plan-estudio/${id}/reactivar`, {
    method: "PATCH",
  });

export const getMateriasPlan = () => apiFetch("/materias");

export const crearMateriaPlan = (datos) =>
  apiFetch("/materias", {
    method: "POST",
    body: JSON.stringify(datos),
  });

export const getCicloLectivo = () => apiFetch("/ciclo-lectivo");

export const crearCicloLectivo = (anio) =>
  apiFetch("/ciclo-lectivo", {
    method: "POST",
    body: JSON.stringify({ anio }),
  });
