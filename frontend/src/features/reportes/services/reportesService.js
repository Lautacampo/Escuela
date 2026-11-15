import { apiFetch } from "../../../shared/services/api.js";

const consultaAnio = (anio) =>
  anio ? `?anio=${encodeURIComponent(anio)}` : "";

export const getReporteInasistencias = (anio) =>
  apiFetch(`/reportes/inasistencias${consultaAnio(anio)}`);

export const getReporteDesaprobaciones = (anio) =>
  apiFetch(`/reportes/desaprobaciones${consultaAnio(anio)}`);
