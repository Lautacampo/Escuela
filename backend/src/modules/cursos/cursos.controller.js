import * as service from "./cursos.service.js";

export const listar = async (req, res, next) => {
    try {
        res.json(await service.listar());
    } catch (err) {
        next(err);
    }
};