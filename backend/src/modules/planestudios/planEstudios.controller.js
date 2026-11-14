import * as service from "./planEstudios.service.js";

export const obtenerPlanActual = async (req, res, next) => {
  try {
    res.json(await service.obtenerPlanActual());
  } catch (err) {
    next(err);
  }
};

export const crearPlanEstudio = async (req, res, next) => {
  try {
    const creado = await service.crearPlanEstudio(req.body);
    res.status(201).json(creado);
  } catch (err) {
    next(err);
  }
};

export const eliminarPlanEstudio = async (req, res, next) => {
  try {
    const resultado = await service.eliminarPlanEstudio(req.params.id);
    res.status(200).json(resultado);
  } catch (err) {
    next(err);
  }
};

export const listarMaterias = async (req, res, next) => {
  try {
    res.json(await service.listarMaterias());
  } catch (err) {
    next(err);
  }
};

export const crearMateria = async (req, res, next) => {
  try {
    const nueva = await service.crearMateria(req.body);
    res.status(201).json(nueva);
  } catch (err) {
    next(err);
  }
};

export const obtenerCicloLectivo = async (req, res, next) => {
  try {
    res.json(await service.obtenerCicloLectivo());
  } catch (err) {
    next(err);
  }
};
