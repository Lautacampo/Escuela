import { getToken, logout } from "../../features/auth/services/authServices";
import { normalizarUrlApi } from "./urlApi";

// Acepta VITE_API_URL con o sin "/api" y con o sin barra final (ver urlApi.js).
const API = normalizarUrlApi(import.meta.env.VITE_API_URL) || "http://localhost:4000/api";



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

  
  const responseText = await res.text();
  let data = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      // Successful non-JSON responses keep returning null.
    }
  }

  // Un 401 en el login son credenciales inválidas: no hay sesión que cerrar.
  if (res.status === 401 && !path.startsWith("/auth/login")) {
    logout();
    window.location.assign("/login");
    throw new Error("Sesión vencida");
  }

  if (!res.ok) {
    const message =
      data?.detail ??
      data?.message ??
      data?.error ??
      data?.title ??
      responseText;
    const error = new Error(message || "Error en la solicitud");
    if (typeof data?.campo === "string") error.campo = data.campo;
    throw error;
  }

  return data;
}
