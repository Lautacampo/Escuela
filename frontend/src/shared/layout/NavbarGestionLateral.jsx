import { useState } from "react";
import { NavLink } from "react-router";

export default function NavBarGestionLateral() {
  const [menuAbierto, setMenuAbierto] = useState(false);

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
          <li>
            <NavLink
              to="/gestion"
              end
              className={({ isActive }) => (isActive ? "activo" : "")}
              onClick={cerrarMenu}
            >
              <i className="fa-solid fa-house"></i>
              Inicio
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/gestion/alumnos"
              className={({ isActive }) => (isActive ? "activo" : "")}
              onClick={cerrarMenu}
            >
              <i className="fa-solid fa-user-graduate"></i>
              Gestión de Alumnos
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/gestion/docentes"
              className={({ isActive }) => (isActive ? "activo" : "")}
              onClick={cerrarMenu}
            >
              <i className="fa-solid fa-chalkboard-user"></i>
              Gestión de Docentes
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/gestion/preceptores"
              className={({ isActive }) => (isActive ? "activo" : "")}
              onClick={cerrarMenu}
            >
              <i className="fa-solid fa-user-tie"></i>
              Gestión de Preceptores
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/gestion/asistencia"
              className={({ isActive }) => (isActive ? "activo" : "")}
              onClick={cerrarMenu}
            >
              <i className="fa-solid fa-clipboard-check"></i>
              Carga de Asistencia
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/gestion/calificaciones"
              className={({ isActive }) => (isActive ? "activo" : "")}
              onClick={cerrarMenu}
            >
              <i className="fa-solid fa-graduation-cap"></i>
              Calificaciones
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/gestion/plan-estudios"
              className={({ isActive }) => (isActive ? "activo" : "")}
              onClick={cerrarMenu}
            >
              <i className="fa-solid fa-book-open"></i>
              Plan de Estudios
            </NavLink>
          </li>

          <li>
            <NavLink
              to="/gestion/reportes"
              className={({ isActive }) => (isActive ? "activo" : "")}
              onClick={cerrarMenu}
            >
              <i className="fa-solid fa-chart-column"></i>
              Reportes
            </NavLink>
          </li>
        </ul>
      </nav>
    </>
  );
}