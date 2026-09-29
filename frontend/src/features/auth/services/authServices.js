import { redirect } from "react-router";

// Función auxiliar para saber si el usuario está logueado
const tieneSesion = () => {
  // Simulamos la verificación buscando un token o bandera en el navegador
  return localStorage.getItem("sistemaGestionAuth") === "true";
};

// 1. Evita que un intruso entre a /gestion sin loguearse
export const protegerRuta = () => {
  if (!tieneSesion()) {
    // Si no está autorizado, lo pateamos de vuelta al Login
    return redirect("/login");
  }
  // Si todo está bien, retornamos null para que la ruta cargue normalmente
  return null;
};

// 2. Evita que un usuario que ya inició sesión vuelva a ver la pantalla de Login
export const redirigirSiHaySesion = () => {
  if (tieneSesion()) {
    // Si ya está logueado, lo mandamos directo a su panel
    return redirect("/gestion");
  }
  return null;
};
