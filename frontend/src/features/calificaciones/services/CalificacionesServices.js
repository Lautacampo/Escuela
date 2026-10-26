import { apiFetch } from "../../../shared/services/api";

const A_FRONT = {
  Aprobado: "aprobado",
  Desaprobado: "desaprobado",
  "En Curso": "en_curso",
};
const A_API = {
  aprobado: "Aprobado",
  desaprobado: "Desaprobado",
  en_curso: "En Curso",
};



export async function getModulos() {
  const anios = await apiFetch("/calificaciones/modulos");
  return anios.map((a) => ({
    anio: a.anio,
    modulos: a.modulos.map((m) => ({
      id: m.moduloId,
      nombre: m.nombre,
      materias: m.materias,
      divisiones: m.divisiones,
    })),
  }));
}


export async function getGrilla(moduloId, division) {
  const g = await apiFetch(
    `/calificaciones/modulos/${encodeURIComponent(moduloId)}/divisiones/${encodeURIComponent(division)}`,
  );
  return {
    materias: g.materias,
    alumnos: g.alumnos.map((a) => ({
      id: a.cursadaId,
      apellido: a.apellido,
      nombre: a.nombre,
      estados: Object.fromEntries(
        Object.entries(a.calificaciones).map(([materiaId, estado]) => [
          materiaId,
          A_FRONT[estado] ?? "en_curso",
        ]),
      ),
    })),
  };
}


export function setCalificacion(cursadaModuloId, materiaId, estado) {
  return apiFetch("/calificaciones", {
    method: "PUT",
    body: JSON.stringify({
      cursadaModuloId,
      materiaId,
      estado: A_API[estado],
    }),
  });
}