import { Outlet, Link } from "react-router";
import "../../features/gestion/components/gestion.css";

export default function LayoutPrivado() {
  const cerrarSesion = () => {
    localStorage.removeItem("sistemaGestionAuth");
  };

  return (
    <div className="contenedor-dashboard">
      {/* 1. BARRA LATERAL (Sidebar) */}
      <nav className="navlateral">
        <div className="logo-sidebar">
          {/* Logo con letras blancas solicitado */}
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
          {/* Enlace para cerrar sesión al final */}
          <li style={{ marginTop: "20px" }}>
            <Link to="/" onClick={cerrarSesion} style={{ color: "#ff6b6b" }}>
              Cerrar Sesión
            </Link>
          </li>
        </ul>
      </nav>

      {/* 2. PANEL DERECHO (Contenido Principal) */}
      <div className="contenido-principal">
        {/* Barra superior */}
        <header className="navhorizontal">
          <p>
            Usuario: <strong>Administrador</strong>
          </p>
        </header>

        {/* Contenido dinámico (Acá carga el Dashboard o las otras páginas) */}
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
