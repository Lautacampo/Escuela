import { apiFetch } from "../../shared/services/api.js";

export async function crearEvaluacionModulo(evaluacion) {
    return apiFetch("/evaluaciones-modulo", {
        method: "POST",
        body: JSON.stringify(evaluacion),
    });
}
