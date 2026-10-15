    const API_URL = "http://localhost:8080/api";


    export async function getAlumnos(){
        const res = await fetch(`${API_URL}/alumnos`);
        if (!res.ok) throw new Error ("No se pudieron cargar los alumnos");
        return res.json();
    }

    export async function getCursos(){
        const res = await fetch(`${API_URL}/cursos`);
        if (!res.ok) throw new Error ("No se pudieron cargar los cursos");
        return res.json();
    }

    export async function setAlumno(alumno) {
        const url = alumno.id
        ? `${API_URL}/alumnos/${alumno.id}`
        : `${API_URL}/alumnos`;

        const res = await fetch(url, {
            method: alumno.id ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(alumno)
        });
        if (!res.ok) {
            const respuesta = await res.text();
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
                // Spring may return a plain-text error instead of JSON.
            }

            throw new Error(
                mensaje || `No se pudo guardar el alumno (HTTP ${res.status})`
            );
        }
        return res.json();
    }

   export async function matricularAlumno(idAlumno, idCurso, idModulo) {
        const res = await fetch(
            `${API_URL}/alumnos/${idAlumno}/matricular`,
            { 
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    idCurso: idCurso,
                    idModulo: idModulo,
                    autorizarConAdvertencias: false
                })
            }
        );
        if (!res.ok) {
            const detalle = await res.text();
            throw new Error(
                detalle || `No se pudo matricular al alumno (HTTP ${res.status})`
            );
        }
        return res.status === 204 ? null : res.json();
   }


    export async function borrarAlumno(id) {
        const res = await fetch(`${API_URL}/alumnos/${id}`, {
            method: "DELETE"
        });

        if (!res.ok) {
            const respuesta = await res.text();
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
                // Spring may return a plain-text error instead of JSON.
            }

            throw new Error(
                mensaje ||
                    `No se pudo eliminar el alumno (HTTP ${res.status}). Verifique que el backend implemente DELETE /api/alumnos/{id}.`
            );
        }
    }