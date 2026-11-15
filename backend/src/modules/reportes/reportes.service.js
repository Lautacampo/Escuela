import * as repo from "./reportes.repository.js";
import { HttpError } from "../../utils/httpError.js";

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

export const obtenerReporteInasistencias = async (query = {}) => {
  const minFaltas =
    query.minFaltas !== undefined && query.minFaltas !== ""
      ? Number(query.minFaltas)
      : 25;

  const curso = query.curso ? Number(query.curso) : null;
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
    minFaltas: Number.isFinite(minFaltas) ? minFaltas : 25,
    curso: Number.isInteger(curso) ? curso : null,
    division,
    anio,
    moduloId,
  });

  return {
    umbralFaltas: Number.isFinite(minFaltas) ? minFaltas : 25,
    totalAlertas: alertas.length,
    alertas,
  };
};

export const obtenerReporteDesaprobaciones = async (query = {}) => {
  const curso = query.curso ? Number(query.curso) : null;
  const division = query.division
    ? String(query.division).trim().toUpperCase()
    : null;

  const anio = anioFiltro(query);

  const resultados = await repo.listarDesaprobacionesPorMateria({
    curso: Number.isInteger(curso) ? curso : null,
    division,
    anio,
  });

  return {
    totalRegistros: resultados.length,
    resultados,
  };
};
