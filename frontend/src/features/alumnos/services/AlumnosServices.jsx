    import { apiFetch } from "../../../shared/services/api.js";

    export async function getAsistencias(){
        return apiFetch("/asistencias");
    }

    export async function getAlumnos(incluirInactivos = false){
        return apiFetch(
            incluirInactivos ? "/alumnos?incluirInactivos=true" : "/alumnos"
        );
    }

    export async function setAlumno(alumno) {
        return apiFetch(alumno.id ? `/alumnos/${alumno.id}` : "/alumnos", {
            method: alumno.id ? "PUT" : "POST",
            body: JSON.stringify(alumno)
        });
    }

    export async function borrarAlumno(id) {
        // Baja lógica: el backend conserva el historial y marca al alumno
        // como inactivo. Ya no hace falta borrar asistencias ni notas.
        await apiFetch(`/alumnos/${id}`, { method: "DELETE" });
    }