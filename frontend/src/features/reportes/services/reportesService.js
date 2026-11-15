import { apiFetch } from "../../../shared/services/api.js";

const consultaAnio = (anio) =>
  anio ? `?anio=${encodeURIComponent(anio)}` : "";

export const getReporteInasistencias = (anio, moduloId = "") => {
  const parametros = new URLSearchParams();
  if (anio) parametros.set("anio", String(anio));
  if (moduloId) parametros.set("moduloId", String(moduloId));
  const consulta = parametros.toString();
  return apiFetch(`/reportes/inasistencias${consulta ? `?${consulta}` : ""}`);
};

export const getReporteDesaprobaciones = (anio) =>
  apiFetch(`/reportes/desaprobaciones${consultaAnio(anio)}`);
