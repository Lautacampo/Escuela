import * as repo from "./reportes.repository.js";

export const obtenerReporteInasistencias = async (query = {}) => {
  const minFaltas =
    query.minFaltas !== undefined && query.minFaltas !== ""
      ? Number(query.minFaltas)
      : 25;
  const curso = query.curso ? Number(query.curso) : null;
  const division = query.division
    ? String(query.division).trim().toUpperCase()
    : null;

  const alertas = await repo.listarInasistenciasCriticas({
    minFaltas: Number.isFinite(minFaltas) ? minFaltas : 25,
    curso: Number.isInteger(curso) ? curso : null,
    division,
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

  const resultados = await repo.listarDesaprobacionesPorMateria({
    curso: Number.isInteger(curso) ? curso : null,
    division,
  });

  return {
    totalRegistros: resultados.length,
    resultados,
  };
};
