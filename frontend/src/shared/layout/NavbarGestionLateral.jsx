import { NavLink } from "react-router";

export default function NavBarGestionLateral() {
  const claseActiva = ({ isActive }) => (isActive ? "activo" : "");

  return (
    <nav className="navlateral">
      <div className="logo-sidebar">
        <img
          src="/img/logos/logo-tomas-baras-letras-blancas.png"
          alt="Logo Colegio Tomás Baras"
        />
      </div>
      <ul className="menu-sidebar">
        <li>
          <NavLink
            to="/gestion"
            end
            className={({ isActive }) => (isActive ? "activo" : "")}
          >
            <i className="fa-solid fa-house"></i>
            Inicio
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/gestion/alumnos"
            className={({ isActive }) => (isActive ? "activo" : "")}
          >
            <i className="fa-solid fa-user-graduate"></i>
            Gestión de Alumnos
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/gestion/asistencia"
            className={({ isActive }) => (isActive ? "activo" : "")}
          >
            <i className="fa-solid fa-clipboard-check"></i>
            Carga de Asistencia
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/gestion/calificaciones"
            className={({ isActive }) => (isActive ? "activo" : "")}
          >
            <i className="fa-solid fa-graduation-cap"></i>
            Calificaciones
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/gestion/reportes"
            className={({ isActive }) => (isActive ? "activo" : "")}
          >
            <i className="fa-solid fa-chart-column"></i>
            Reportes
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
