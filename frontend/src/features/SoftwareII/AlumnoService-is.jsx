    import { apiFetch } from "../../shared/services/api.js";

    export async function getAlumnos(){
        return apiFetch("/alumnos");
    }

    export async function getCursos(){
        return apiFetch("/cursos");
    }

    export async function setAlumno(alumno) {
        return apiFetch(alumno.id ? `/alumnos/${alumno.id}` : "/alumnos", {
            method: alumno.id ? "PUT" : "POST",
            body: JSON.stringify(alumno)
        });
    }

   export async function matricularAlumno(idAlumno, idCurso, idModulo) {
        return apiFetch(`/alumnos/${idAlumno}/matricular`, {
            method: "POST",
            body: JSON.stringify({
                idCurso: idCurso,
                idModulo: idModulo,
                autorizarConAdvertencias: false
            })
        });
   }


    export async function borrarAlumno(id) {
        await apiFetch(`/alumnos/${id}`, { method: "DELETE" });
    }