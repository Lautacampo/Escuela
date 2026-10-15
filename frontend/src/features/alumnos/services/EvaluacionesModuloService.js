const API_URL = "http://localhost:8080/api";

export async function crearEvaluacionModulo(evaluacion) {
    const res = await fetch(`${API_URL}/evaluaciones-modulo`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(evaluacion),
    });

    const respuesta = await res.text();

    if (!res.ok) {
        let mensaje = respuesta;

        try {
            const detalle = JSON.parse(respuesta);
            mensaje =
                detalle.detail ||
                detalle.message ||
                detalle.error ||
                detalle.title ||
                respuesta;
        } catch {
            // The API may return a plain-text error instead of JSON.
        }

        throw new Error(
            mensaje || `No se pudo guardar la evaluación (HTTP ${res.status})`
        );
    }

    if (!respuesta) return null;

    try {
        return JSON.parse(respuesta);
    } catch {
        return null;
    }
}
