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

const anioQuery = (anio) => `?anio=${encodeURIComponent(anio)}`;

export const getCiclosCalificaciones = () => apiFetch("/calificaciones/ciclos");

export async function getModulos(anio) {
  const anios = await apiFetch(`/calificaciones/modulos${anioQuery(anio)}`);
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

export async function getGrilla(moduloId, division, anio) {
  const g = await apiFetch(
    `/calificaciones/modulos/${encodeURIComponent(moduloId)}/divisiones/${encodeURIComponent(division)}${anioQuery(anio)}`,
  );
  return {
    materias: g.materias,
    alumnos: g.alumnos.map((a) => ({
      id: a.cursadaId,
      apellido: a.apellido,
      nombre: a.nombre,
      // Situación de la cursada: REGULAR/LIBRE, estado académico y motivo.
      condicion: a.condicion,
      estadoAcademico: a.estadoAcademico,
      motivoLibre: a.motivoLibre,
      estados: Object.fromEntries(
        Object.entries(a.calificaciones).map(([materiaId, estado]) => [
          materiaId,
          A_FRONT[estado] ?? "en_curso",
        ]),
      ),
    })),
  };
}

export function setCalificacion(cursadaModuloId, materiaId, estado, anio) {
  return apiFetch("/calificaciones", {
    method: "PUT",
    body: JSON.stringify({
      cursadaModuloId,
      materiaId,
      estado: A_API[estado],
      anio: Number(anio),
    }),
  });
}
