import { NavLink } from "react-router";

export default function NavBarGestionLateral() {
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
          <NavLink to="/gestion" end className={({ isActive }) => isActive ? "activo" : ""}>
            Inicio
          </NavLink>
        </li>
        <li>
          <NavLink to="/gestion/alumnos" className={({ isActive }) => isActive ? "activo" : ""}>
            Gestión de Alumnos
          </NavLink>
        </li>
        <li>
          <NavLink to="/gestion/asistencia" className={({ isActive }) => isActive ? "activo" : ""}>
            Carga de Asistencia
          </NavLink>
        </li>
        <li>
          <NavLink to="/gestion/calificaciones" className={({ isActive }) => isActive ? "activo" : ""}>
            Calificaciones
          </NavLink>
        </li>
        <li>
          <NavLink to="/gestion/reportes" className={({ isActive }) => isActive ? "activo" : ""}>
            Reportes
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}