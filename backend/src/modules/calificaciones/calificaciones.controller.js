import * as service from "./calificaciones.service.js";

export const listarModulos = async (req, res, next) => {
  try {
    res.json(await service.listarModulos(req.usuario));
  } catch (err) {
    next(err);
  }
};

export const listarDivisiones = async (req, res, next) => {
  try {
    const moduloId = Number(req.params.moduloId);
    res.json(await service.listarDivisiones(req.usuario, moduloId));
  } catch (err) {
    next(err);
  }
};

export const obtenerGrilla = async (req, res, next) => {
  try {
    const moduloId = Number(req.params.moduloId);
    const division = req.params.division.toUpperCase();
    res.json(await service.obtenerGrilla(req.usuario, moduloId, division));
  } catch (err) {
    next(err);
  }
};

export const actualizar = async (req, res, next) => {
  try {
    res.json(await service.actualizar(req.usuario, req.body ?? {}));
  } catch (err) {
    next(err);
  }
};