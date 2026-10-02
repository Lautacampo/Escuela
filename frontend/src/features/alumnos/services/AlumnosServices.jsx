const API_URL = "http://localhost:3000";

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
    const res = await fetch(`${API_URL}/alumnos/${id}`, {
        method: "DELETE"
    });
    if (!res.ok) throw new Error("No se pudo eliminar el alumno");
}