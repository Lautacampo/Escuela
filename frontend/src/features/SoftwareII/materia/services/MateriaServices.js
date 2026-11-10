import { apiFetch } from "../../../../shared/services/api";
 
// GET /api/materias -> [{ anio, materias: [{ id, nombre }] }]
export function getMateriasPorAnio() {
  return apiFetch("/materias");
}
 
// GET /api/materias/{id}?anio=1 -> ficha de la materia
export function getFichaMateria(id, anio) {
  return apiFetch(
    `/materias/${encodeURIComponent(id)}?anio=${encodeURIComponent(anio)}`,
  );
}
