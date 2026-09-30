const API_URL = "http://localhost:3000";

export async function getModulos() {
  const res = await fetch(`${API_URL}/modulos`);
  if (!res.ok) throw new Error("No se pudieron cargar los modulos");
  return res.json();
}

export async function getAlumnos() {
  const res = await fetch(`${API_URL}/alumnos`);
  if (!res.ok) throw new Error("No se pudieron cargar los alumnos");
  return res.json();
}

export async function getAsistencias() {
  const res = await fetch(`${API_URL}/asistencias`);
  if (!res.ok) throw new Error("No se pudieron cargar las asistencias");
  return res.json();
}

export async function setAsistencia(asi) {
  
  const url = asi.id
    ? `${API_URL}/asistencias/${asi.id}`
    : `${API_URL}/asistencias`;

  const res = await fetch(url, {
    method: asi.id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(asi),
  });
  if (!res.ok) throw new Error("No se pudo guardar la asistencia");
  return res.json();
}

