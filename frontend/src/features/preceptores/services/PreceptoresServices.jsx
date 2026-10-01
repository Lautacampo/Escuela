const API_URL = "http://localhost:3000";
 
export async function getModulos() {
  const res = await fetch(`${API_URL}/modulos`);
  if (!res.ok) throw new Error("No se pudieron cargar los modulos");
  return res.json();
}

export async function getPreceptores() {
  const res = await fetch(`${API_URL}/preceptores`);
  if (!res.ok) throw new Error("No se pudieron cargar los preceptores");
  return res.json();
}

export async function setPreceptor(preceptor) {
  const url = preceptor.id
    ? `${API_URL}/preceptores/${preceptor.id}`
    : `${API_URL}/preceptores`;
 
  const res = await fetch(url, {
    method: preceptor.id ? "PUT" : "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preceptor),
  });
  if (!res.ok) throw new Error("No se pudo guardar el preceptor");
  return res.json();
}
 
export async function borrarPreceptor(id) {
  const res = await fetch(`${API_URL}/preceptores/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("No se pudo eliminar el preceptor");
}