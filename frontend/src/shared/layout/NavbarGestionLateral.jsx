import { useState } from "react";
import { NavLink } from "react-router";
import { ROLES } from "../../features/auth/roles";
import { getSesion } from "../../features/auth/services/authServices";
const {DIRECTIVO, DOCENTE, PRECEPTOR}=ROLES;

const ITEMS = [
  { to: "/gestion", label: "Inicio", icono: "fa-house", end: true, roles: [DIRECTIVO, DOCENTE, PRECEPTOR] },
  { to: "/gestion/alumnos", label: "Gestión de Alumnos", icono: "fa-user-graduate", roles: [DIRECTIVO] },
  { to: "/gestion/docentes", label: "Gestión de Docentes", icono: "fa-chalkboard-user", roles: [DIRECTIVO] },
  { to: "/gestion/preceptores", label: "Gestión de Preceptores", icono: "fa-user-tie", roles: [DIRECTIVO] },
  { to: "/gestion/asistencia", label: "Carga de Asistencia", icono: "fa-clipboard-check", roles: [DIRECTIVO, PRECEPTOR] },
  { to: "/gestion/calificaciones", label: "Calificaciones", icono: "fa-graduation-cap", roles: [DIRECTIVO, DOCENTE] },
  { to: "/gestion/plan-estudios", label: "Plan de Estudios", icono: "fa-book-open", roles: [DIRECTIVO] },
  { to: "/gestion/reportes", label: "Reportes", icono: "fa-chart-column", roles: [DIRECTIVO] },
];


export default function NavBarGestionLateral() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const usuario=getSesion();
 
  const cerrarMenu = () => {
    setMenuAbierto(false);
  };

  return (
    <>
      <button
        type="button"
        className="btn-menu-hamburguesa"
        onClick={() => setMenuAbierto(!menuAbierto)}
        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={menuAbierto}
      >
        <i
          className={`fa-solid ${
            menuAbierto ? "fa-xmark" : "fa-bars"
          }`}
        ></i>
      </button>

      {menuAbierto && (
        <div
          className="overlay-menu"
          onClick={cerrarMenu}
          aria-hidden="true"
        ></div>
      )}

      <nav className={`navlateral ${menuAbierto ? "menu-abierto" : ""}`}>
        <div className="logo-sidebar">
          <img
            src="/img/logos/logo-principal.png"
            alt="Logo Colegio Tomás Baras"
          />
        </div>

        <ul className="menu-sidebar">
          {ITEMS.filter((item) => item.roles.includes(usuario?.rol)).map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={({ isActive }) => (isActive ? "activo" : "")} onClick={cerrarMenu}>
                <i className={`fa-solid ${item.icono}`}></i>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}