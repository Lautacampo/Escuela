const API_URL = "http://localhost:3001";

export async function getModulos() {
  const res = await fetch(`${API_URL}/modulos`);
  if (!res.ok) throw new Error("No se pudieron cargar los modulos");
  return res.json();
}
