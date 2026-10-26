import { getToken, logout } from "../../features/auth/services/authServices";

const API = "http://localhost:4000/api";

export async function apiFetch(path, options = {}) {
  const token = getToken();
  let res;
  try {
    res = await fetch(`${API}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  
  if (res.status === 401) {
    logout();
    window.location.assign("/login");
    throw new Error("Sesión vencida");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? "Error en la solicitud");
  return data;
}