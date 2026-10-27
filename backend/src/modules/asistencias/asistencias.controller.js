import * as service from "./asistencias.service.js";

// GET /api/asistencias/modulos
export const listarModulos = async (req, res, next) => {
  try {
    res.json(await service.listarModulos(req.usuario));
  } catch (err) {
    next(err);
  }
};

// GET /api/asistencias/modulos/:moduloId/divisiones
export const listarDivisiones = async (req, res, next) => {
  try {
    const moduloId = Number(req.params.moduloId);
    res.json(await service.listarDivisiones(req.usuario, moduloId));
  } catch (err) {
    next(err);
  }
};

// GET /api/asistencias/modulos/:moduloId/divisiones/:division?fecha=YYYY-MM-DD
export const obtenerPlanilla = async (req, res, next) => {
  try {
    const moduloId = Number(req.params.moduloId);
    const division = req.params.division.toUpperCase();
    const { fecha } = req.query;
    res.json(
      await service.obtenerPlanilla(req.usuario, moduloId, division, fecha),
    );
  } catch (err) {
    next(err);
  }
};

// GET /api/asistencias?cursadaModuloId=...&fecha=...
export const listar = async (req, res, next) => {
  try {
    res.json(await service.listar(req.usuario, req.query));
  } catch (err) {
    next(err);
  }
};

// POST /api/asistencias
export const registrar = async (req, res, next) => {
  try {
    const creada = await service.registrar(req.usuario, req.body ?? {});
    res.status(201).json(creada);
  } catch (err) {
    next(err);
  }
};

// PUT /api/asistencias/:id
export const actualizar = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actualizada = await service.actualizar(
      req.usuario,
      id,
      req.body ?? {},
    );
    res.json(actualizada);
  } catch (err) {
    next(err);
  }
};

// DELETE /api/asistencias/:id
export const eliminar = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await service.eliminar(req.usuario, id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
