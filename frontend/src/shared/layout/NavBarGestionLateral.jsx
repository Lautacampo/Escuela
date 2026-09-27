import { Link } from "react-router";

export default function NavBarGestionLateral() {
  const cerrarSesion = () => {
    localStorage.removeItem("sistemaGestionAuth");
  };

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
          <Link to="/gestion" className="activo">
            Inicio
          </Link>
        </li>
        <li>
          <Link to="/gestion/alumnos">Gestión de Alumnos</Link>
        </li>
        <li>
          <Link to="/gestion/asistencia">Carga de Asistencia</Link>
        </li>
        <li>
          <Link to="/gestion/calificaciones">Calificaciones</Link>
        </li>
        <li>
          <Link to="/gestion/reportes">Reportes</Link>
        </li>
        <li style={{ marginTop: "20px" }}>
          <Link to="/" onClick={cerrarSesion} style={{ color: "#ff6b6b" }}>
            Cerrar Sesión
          </Link>
        </li>
      </ul>
    </nav>
  );
}