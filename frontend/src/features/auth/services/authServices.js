import { redirect } from "react-router";
import { apiFetch } from "../../../shared/services/api.js";

const CLAVE = "sesion";
const CLAVE_TOKEN = "token";

export async function login(email, password) {
  const datos = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

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