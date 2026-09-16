import { Link, Outlet } from "react-router";
import "../../features/gestion/gestion.css";

function LayoutPrivado() {
  return (
    <div className="contenedor-dashboard">
      <header className="header-lateral">
        <nav className="navlateral">
          <div className="logo-sidebar">
            <img
              src="/logo-tomas-baras-letras-blancas.png"
              alt="Logo Colegio"
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
              <Link to="/" style={{ color: "#bf1b1b" }}>
                <i className="fa-solid fa-arrow-right-from-bracket"></i> Cerrar
                Sesión
              </Link>
            </li>
          </ul>
        </nav>
      </header>

      <div className="contenido-principal">
        <header className="header-superior">
          <nav className="navhorizontal">
            <div className="usuario-info">
              <p>
                Usuario: <strong>Administrador</strong>
              </p>
            </div>
          </nav>
        </header>

        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default LayoutPrivado;
