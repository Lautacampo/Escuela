import * as service from "./alumnos.service.js";

export const listar = async (req, res, next) => {
    try {
        res.json(await service.listar());
    } catch (err) {
        next(err);
    }
};

export const obtener = async (req, res, next) => {
    try {
        res.json(await service.obtener(Number(req.params.id)));
    } catch (err) {
        next (err);
    }
}

export const crear = async (req, res, next) => {
    try {
        res.status(201).json(await service.crear(req.body ?? {}));
    } catch (err) {
        next(err);
    }
};

export const actualizar = async (req, res, next) => {
    try {
        res.json(await service.actualizar(Number(req.params.id), req.body ?? {}));
    } catch (err) {
        next(err);
    }
};

export const eliminar = async (req, res, next) => {
    try {
        await service.eliminar(Number(req.params.id));
        res.status(204).end();
    } catch (err) {
        next(err);
    }
};

export const matricular = async (req, res, next) => {
    try {
        res.status(201).json(await service.matricular(Number(req.params.id), req.body?? {}));
    } catch (err) {
        next(err);
    }
};