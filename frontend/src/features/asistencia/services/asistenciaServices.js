import { apiFetch } from "../../../shared/services/api.js";

// Respuesta: [{ anio, modulos: [{ moduloId, nombre, divisiones }] }]
export async function getModulos() {
  return apiFetch("/asistencias/modulos");
}

// Respuesta: { moduloId, division, fecha, alumnos: [{ cursadaId, alumnoId,
// apellido, nombre, dni, faltasAcumuladas, condicion, asistenciaHoy }] }
export async function getPlanilla(moduloId, division, fecha) {
  const ruta =
    `/asistencias/modulos/${encodeURIComponent(moduloId)}` +
    `/divisiones/${encodeURIComponent(division)}?fecha=${encodeURIComponent(fecha)}`;
  return apiFetch(ruta);
}

// Para nuevos registros, POST requiere cursadaModuloId, fecha y valorFalta.
// Para registros existentes, PUT /:id permite actualizar valorFalta y fecha.
export async function setAsistencia(asistencia) {
  const existe = asistencia.id != null;
  return apiFetch(existe ? `/asistencias/${asistencia.id}` : "/asistencias", {
    method: existe ? "PUT" : "POST",
    body: JSON.stringify(asistencia),
  });
}
