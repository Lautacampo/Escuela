import * as service from "./docentes.service.js";

// GET /api/docentes/modulos
export const listarModulos = async (req, res, next) => {
  try {
    res.json(await service.listarModulos());
  } catch (err) {
    next(err);
  }
};

// GET /api/docentes
export const listar = async (req, res, next) => {
  try {
    res.json(await service.listar(req.query));
  } catch (err) {
    next(err);
  }
};

// GET /api/docentes/:id
export const obtenerPorId = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    res.json(await service.obtenerPorId(id));
  } catch (err) {
    next(err);
  }
};

// POST /api/docentes
export const crear = async (req, res, next) => {
  try {
    const creado = await service.crear(req.body ?? {});
    res.status(201).json(creado);
  } catch (err) {
    next(err);
  }
};

// PUT /api/docentes/:id
export const actualizar = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const actualizado = await service.actualizar(id, req.body ?? {});
    res.json(actualizado);
  } catch (err) {
    next(err);
  }
};

// PATCH /api/docentes/:id/inactivar
export const inactivar = async (req, res, next) => {
  try {
    res.json(await service.inactivar(Number(req.params.id)));
  } catch (err) {
    next(err);
  }
};

// PATCH /api/docentes/:id/reactivar
export const reactivar = async (req, res, next) => {
  try {
    res.json(await service.reactivar(Number(req.params.id)));
  } catch (err) {
    next(err);
  }
};

// DELETE /api/docentes/:id (definitivo; el docente debe estar inactivo)
export const eliminar = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await service.eliminar(id);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
