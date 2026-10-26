import { redirect } from "react-router";

const API_AUTH = "http://localhost:4000/api/auth";
const CLAVE = "sesion";
const CLAVE_TOKEN = "token";

export async function login(email, password) {
  let res;
  try {
    res = await fetch(`${API_AUTH}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor");
  }

  const datos = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(datos.error ?? "Error al iniciar sesión");

  localStorage.setItem(CLAVE_TOKEN, datos.token);
  localStorage.setItem(CLAVE, JSON.stringify(datos.usuario));
  return datos.usuario;
}

export function getToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}

export function logout() {
  localStorage.removeItem(CLAVE);
  localStorage.removeItem(CLAVE_TOKEN);
}

export function getSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE));
  } catch {
    return null;
  }
}


export const controlSesion = (roles) => () => {
  const usuario = getSesion();
  if (!usuario) return redirect("/login");
  if (roles && !roles.includes(usuario.rol)) {
    return redirect("/gestion/sin-permiso");
  }
  return null;
};

export const yahaySesion = () => {
  return getSesion() ? redirect("/gestion") : null;
};