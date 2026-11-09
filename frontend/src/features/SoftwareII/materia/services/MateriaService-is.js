import { apiFetch } from "../../../../shared/services/api.js";

// Obtiene los años con sus materias desde PostgreSQL.
export function getMateriasPorAnio() {
  return apiFetch("/materias");
}

// Obtiene el detalle de una materia para el año elegido.
export function getMateriaPorId(id, anio) {
  if (!/^[1-9]\d*$/.test(String(id))) {
    throw new Error("El ID de la materia no es válido");
  }

  if (!/^[1-9]\d*$/.test(String(anio))) {
    throw new Error("El año seleccionado no es válido");
  }

  return apiFetch(
    `/materias/${encodeURIComponent(String(id))}?anio=${encodeURIComponent(String(anio))}`,
  );
}
