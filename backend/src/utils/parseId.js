import { HttpError } from "./httpError.js";

export const parseId = (valor, nombre = "id") => {
    const n = Number(valor);
    if (!Number.isInteger(n) || n <= 0) {
        throw new HttpError(400, `${nombre} inválido`);
    }
    return n;
}