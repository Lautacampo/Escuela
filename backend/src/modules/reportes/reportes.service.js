import * as repo from "./reportes.repository.js";
import { HttpError } from "../../utils/httpError.js";

const LIMITE_FALTAS = 25;
// Alumnos en riesgo: todavía regulares, pero con esta cantidad de faltas o más.
const UMBRAL_RIESGO = 20;
const SITUACIONES = ["libres", "riesgo"];

function anioFiltro(query) {
  if (query.anio === undefined || query.anio === "") {
    return null;
  }

  const anio = Number(query.anio);

  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    throw new HttpError(400, "Ciclo lectivo inválido");
  }

  return anio;
}

// Año del curso (1.º, 2.º, 3.º): opcional, pero si viene debe ser un entero.
function cursoFiltro(query) {
  if (query.curso === undefined || query.curso === "") return null;
  const curso = Number(query.curso);
  if (!Number.isInteger(curso) || curso <= 0) {
    throw new HttpError(400, "Curso inválido");
  }
  return curso;
}

export const obtenerReporteInasistencias = async (query = {}) => {
  // situacion=libres (por defecto): libres por inasistencias.
  // situacion=riesgo: regulares con 20 faltas o más (se acercan a quedar libres).
  const situacion =
    query.situacion === undefined || query.situacion === ""
      ? "libres"
      : String(query.situacion).trim().toLowerCase();
  if (!SITUACIONES.includes(situacion)) {
    throw new HttpError(400, "La situación debe ser libres o riesgo");
  }

  // Filtro opcional: además, tener al menos esa cantidad de faltas.
  const minFaltas =
    query.minFaltas !== undefined && query.minFaltas !== ""
      ? Number(query.minFaltas)
      : null;
  if (minFaltas !== null && (!Number.isFinite(minFaltas) || minFaltas < 0)) {
    throw new HttpError(400, "El mínimo de faltas debe ser un número mayor o igual a 0");
  }

  const curso = cursoFiltro(query);
  const division = query.division
    ? String(query.division).trim().toUpperCase()
    : null;

  const anio = anioFiltro(query);
  const moduloId =
    query.moduloId === undefined || query.moduloId === ""
      ? null
      : Number(query.moduloId);

  if (moduloId !== null && (!Number.isSafeInteger(moduloId) || moduloId <= 0)) {
    throw new HttpError(400, "Módulo inválido");
  }

  const alertas = await repo.listarInasistenciasCriticas({
    situacion,
    umbralRiesgo: UMBRAL_RIESGO,
    minFaltas,
    curso,
    division,
    anio,
    moduloId,
  });

  return {
    // Límite de faltas: al superarlo el alumno queda libre.
    umbralFaltas: LIMITE_FALTAS,
    umbralRiesgo: UMBRAL_RIESGO,
    situacion,
    totalAlertas: alertas.length,
    alertas,
  };
};

export const obtenerReporteDesaprobaciones = async (query = {}) => {
  const curso = cursoFiltro(query);
  const division = query.division
    ? String(query.division).trim().toUpperCase()
    : null;

  const anio = anioFiltro(query);

  const resultados = await repo.listarDesaprobacionesPorMateria({
    curso,
    division,
    anio,
  });

  return {
    totalRegistros: resultados.length,
    resultados,
  };
};
