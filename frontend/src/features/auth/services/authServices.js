import { redirect } from "react-router";

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
