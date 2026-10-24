import { redirect } from "react-router";

const API = "http://localhost:3000";
const CLAVE="sesion";


export async function login(email, password) {
  const res = await fetch(`${API}/usuarios`);
  if (!res.ok) throw new Error("No se pudo conectar con el servidor");

  const usuarios = await res.json();
  const usuario = usuarios.find(
    (u) =>
      String(u.email).trim().toLowerCase() === email.trim().toLowerCase() &&
      String(u.password) === String(password),
  );
  if (!usuario) throw new Error("Correo o contraseña incorrectos");

  const sesion = {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    email: usuario.email,
    rol: usuario.rol,
  };
  localStorage.setItem(CLAVE, JSON.stringify(sesion));
  return sesion;
}


export function logout(){
  localStorage.removeItem(CLAVE);
}

export function getSesion(){
  try{
    return JSON.parse(localStorage.getItem(CLAVE)); 
  }catch{
    return null;
  }
}

//que exiga sesion y orl

export const controlSesion =(roles) => ()=>{
  const usuario = getSesion();
  if(!usuario) return redirect("/login");
  if(roles && !roles.includes(usuario.rol)){
    return redirect ("/gestion/sin-permiso");
  }
  
  return null;
}

export const yahaySesion=()=>{
  return getSesion()? redirect("/gestion") : null;
}


