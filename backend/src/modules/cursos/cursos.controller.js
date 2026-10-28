import * as service from "./cursos.service.js";

export const listarCiclos = async (req, res, next) => {
    try {
        res.json(await service.listarCiclos());
    } catch (err) {
        next(err);
    }
};

export const crearCiclo = async (req, res, next) => {
    try {
        res.status(201).json(await service.crearCiclo(req.body ?? {}));
    } catch (err) {
        next(err);
    }
};

export const listar = async (req, res, next) => {
    try {
        res.json(await service.listar(req.usuario, req.query));
    } catch (err) {
        next(err);
    }
};

export const obtener = async (req, res, next) => {
    try {
        res.json(await service.obtener(req.usuario, req.params.id));
    } catch (err) {
        next(err);
    }
};

export const crear = async (req, res, next) => {
    try {
        res.status(201).json(await service.crear(req.body ?? {}));
    } catch (err) {
        next(err);
    }
};

export const actualizar = async (req, res, next) => {
    try {
        res.json(await service.actualizar(req.params.id, req.body ?? {}));
    } catch (err) {
        next(err);
    }
};

export const agregarModulo = async (req, res, next) => {
    try {
        res.status(201).json(await service.agregarModulo(req.params.id, req.body ?? {}));
    } catch (err) {
        next(err);
    }
};

export const quitarModulo = async (req, res, next) => {
    try {
        await service.quitarModulo(req.params.id, req.params.moduloId);
        res.statys(204).end();
    } catch (err) {
        next(err);
    }
};