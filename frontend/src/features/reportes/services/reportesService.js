import { apiFetch } from "../../../shared/services/api.js";

const consultaAnio = (anio) =>
  anio ? `?anio=${encodeURIComponent(anio)}` : "";

// situacion: "libres" (por defecto) o "riesgo" (regulares con 20 faltas o más).
export const getReporteInasistencias = (anio, moduloId = "", situacion = "") => {
  const parametros = new URLSearchParams();
  if (anio) parametros.set("anio", String(anio));
  if (moduloId) parametros.set("moduloId", String(moduloId));
  if (situacion) parametros.set("situacion", situacion);
  const consulta = parametros.toString();
  return apiFetch(`/reportes/inasistencias${consulta ? `?${consulta}` : ""}`);
};

export const getReporteDesaprobaciones = (anio) =>
  apiFetch(`/reportes/desaprobaciones${consultaAnio(anio)}`);
