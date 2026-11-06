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

export const getMateriasPlan = () => apiFetch("/materias");

export const crearMateriaPlan = (datos) =>
  apiFetch("/materias", {
    method: "POST",
    body: JSON.stringify(datos),
  });

export const getCicloLectivo = () => apiFetch("/ciclo-lectivo");
