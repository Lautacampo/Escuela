import * as service from "./reportes.service.js";

export const obtenerInasistencias = async (req, res, next) => {
  try {
    res.json(await service.obtenerReporteInasistencias(req.query));
  } catch (err) {
    next(err);
  }
};

export const obtenerDesaprobaciones = async (req, res, next) => {
  try {
    res.json(await service.obtenerReporteDesaprobaciones(req.query));
  } catch (err) {
    next(err);
  }
};
