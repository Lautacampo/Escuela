    const API_URL = "http://localhost:4000";

    export async function getAsistencias(){
        const res = await fetch(`${API_URL}/asistencias`);
        if (!res.ok) throw new Error ("Las asistencias no pudieron ser cargadas");
        return res.json();
    }

    export async function getAlumnos(){
        const res = await fetch(`${API_URL}/alumnos`);
        if (!res.ok) throw new Error ("Las asistencias no pudieron ser cargadas");
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
        if (!res.ok) throw new Error("No se pudo guardar el alumno");
        return res.json();
    }

    export async function borrarAlumno(id) {
        const [resAsistencias, resCalificaciones] = await Promise.all([
            fetch(`${API_URL}/asistencias?alumnoId=${id}`),
            fetch(`${API_URL}/calificaciones?alumnoId=${id}`)
        ]);

        if (!resAsistencias.ok) {
            throw new Error("No se pudieron buscar las asistencias del alumno");
        }

        if (!resCalificaciones.ok) {
            throw new Error("No se pudieron buscar las calificaciones del alumno");
        }

        const asistencias = resAsistencias.json();
        const calificaciones = resCalificaciones.json();

        await Promise.all(
            asistencias.map((asistencia) =>
                fetch(`${API_URL}/asistencias/${asistencia.id}`, {
                    method: "DELETE"
                })
            )
        );

        await Promise.all(
            calificaciones.map((calificacion) =>
                fetch(`${API_URL}/calificaciones/${calificacion.id}`, {
                    method: "DELETE"
                })
            )
        );

        const resAlumno = await fetch(`${API_URL}/alumnos/${id}`, {
            method: "DELETE"
        });

        if (!resAlumno.ok) {
            throw new Error("No se pudo eliminar el alumno");
        }
    }