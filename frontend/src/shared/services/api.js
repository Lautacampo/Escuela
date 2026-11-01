import { getToken, logout } from "../../features/auth/services/authServices";

const API = "http://localhost:8080/api";

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

  const responseText = await res.text();
  let data = null;
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      // Successful non-JSON responses keep returning null.
    }
  }

  if (!res.ok) {
    const message =
      data?.detail ??
      data?.message ??
      data?.error ??
      data?.title ??
      responseText;
    throw new Error(message || "Error en la solicitud");
  }

  return data;
}