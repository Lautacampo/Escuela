const API_URL = "http://localhost:4000";

export async function getModulos() {
  const res = await fetch(`${API_URL}/modulos`);
  if (!res.ok) throw new Error("No se pudieron cargar los módulos");
  return res.json();
}

export async function getDocentes() {
  const res = await fetch(`${API_URL}/docentes`);
  if (!res.ok) throw new Error("No se pudieron cargar los docentes");
  return res.json();
}

export async function setDocente(docente) {
  const url = docente.id
    ? `${API_URL}/docentes/${docente.id}`
    : `${API_URL}/docentes`;

  const res = await fetch(url, {
    method: docente.id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(docente),
  });

  if (!res.ok) throw new Error("No se pudo guardar el docente");
  return res.json();
}

export async function borrarDocente(id) {
  const res = await fetch(`${API_URL}/docentes/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("No se pudo eliminar el docente");
}
