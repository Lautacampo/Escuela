    import { apiFetch } from "../../../shared/services/api.js";

    export async function getAsistencias(){
        return apiFetch("/asistencias");
    }

    export async function getAlumnos(){
        return apiFetch("/alumnos");
    }

    export async function setAlumno(alumno) {
        return apiFetch(alumno.id ? `/alumnos/${alumno.id}` : "/alumnos", {
            method: alumno.id ? "PUT" : "POST",
            body: JSON.stringify(alumno)
        });
    }

    export async function borrarAlumno(id) {
        const [asistencias, calificaciones] = await Promise.all([
            apiFetch(`/asistencias?alumnoId=${encodeURIComponent(id)}`),
            apiFetch(`/calificaciones?alumnoId=${encodeURIComponent(id)}`)
        ]);

        await Promise.all(
            asistencias.map((asistencia) =>
                apiFetch(`/asistencias/${asistencia.id}`, { method: "DELETE" })
            )
        );

        await Promise.all(
            calificaciones.map((calificacion) =>
                apiFetch(`/calificaciones/${calificacion.id}`, { method: "DELETE" })
            )
        );

        await apiFetch(`/alumnos/${id}`, { method: "DELETE" });
    }