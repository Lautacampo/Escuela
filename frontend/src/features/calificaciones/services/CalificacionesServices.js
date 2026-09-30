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
