const API_URL = "http://localhost:3000";

export async function getModulos(){
    const res = await fetch (`${API_URL}/modulos`);
    if(!res.ok) throw new Error("No se pudieron cargar los modulos");
    return res.json();
}

export async function getMaterias(){
    const res = await fetch (`${API_URL}/materias`);
    if(!res.ok) throw new Error("No se pudieron cargar las materias");
    return res.json();
}

export async function getAlumnos(){
    const res = await fetch (`${API_URL}/alumnos`);
    if(!res.ok) throw new Error("No se pudieron cargar los alumnos");
    return res.json();
}

export async function getCalificaciones(){
    const res = await fetch (`${API_URL}/calificaciones`);
    if(!res.ok) throw new Error("No se pudieron cargar las notas");
    return res.json();
}

export async function setCalificacion(nota){
    const url=nota.id
    ?`${API_URL}/calificaciones/${nota.id}`
    :`${API_URL}/calificaciones`;

    const res = await fetch (url ,{
        method: nota.id ? "PUT" : "POST",
        headers :{"Content-Type": "application/json"},
        body: JSON.stringify(nota),
    });

    if(!res.ok) throw new Error("No se pudo cargar la nota");
    return res.json();
}