import { apiFetch } from "../../../shared/services/api.js";

export const getReporteInasistencias = () =>
  apiFetch("/reportes/inasistencias");

export const getReporteDesaprobaciones = () =>
  apiFetch("/reportes/desaprobaciones");
