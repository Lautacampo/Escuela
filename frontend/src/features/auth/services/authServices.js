import { redirect } from "react-router";

const API = "http://localhost:3000";
const CLAVE="sesion";


export async function login(email, password){
  const res = await fetch(
    `${API}/usuarios?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
  );

  if(!res.ok) throw new Error("No se pudo conectar con el servidor");
  
  const [usuario]=await res.json();
  if(!usuario) throw new Error("Correo o Contrasena INCORRECTA");

  const sesion={
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    rol: usuario.rol,
  };
  localStorage.setItem(CLAVE, JSON.stringify(sesion));
  return sesion;
}




const tieneSesion = () => {
  return localStorage.getItem("sistemaGestionAuth") === "true";
};


export const protegerRuta = () => {
  if (!tieneSesion()) {
    return redirect("/login");
  }
  return null;
};


export const redirigirSiHaySesion = () => {
  if (tieneSesion()) {
    return redirect("/gestion");
  }
  return null;
};
