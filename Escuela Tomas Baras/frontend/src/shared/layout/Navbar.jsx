import { Link } from "react-router";

function Navbar() {
  return (
    <header>
      <div className="header-fijo" id="header-fijo">
        {/* Barra superior */}
        <div className="barra-superior">
          {/* Reemplazamos la etiqueta <a> por <Link> para evitar recargas */}
          <Link to="/login">
            <i className="fa-solid fa-right-to-bracket"></i> Iniciar Sesión
          </Link>
        </div>

        <nav className="navbar navbar-expand-lg navbar-principal">
          <div className="container-fluid">
            {/* Logo */}
            <Link className="navbar-brand navlogo" to="/">
              <img
                src="/imagenes/logo-tomas-baras-letras-blancas.png"
                alt="Logo de la Escuela Tomás Baras"
              />
            </Link>

            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#menu-principal"
              aria-controls="menu-principal"
              aria-expanded="false"
              aria-label="Abrir menú"
            >
              <i className="fa-solid fa-bars"></i>
            </button>

            {/* Enlaces */}
            <div className="collapse navbar-collapse" id="menu-principal">
              <ul className="navbar-nav ms-auto navlinks">
                <li className="nav-item">
                  <a className="nav-link" href="#quienessomos">
                    {" "}
                    ¿QUIÉNES SOMOS?{" "}
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#historia-evolucion">
                    {" "}
                    HISTORIA{" "}
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#equipo">
                    {" "}
                    EQUIPO DOCENTE{" "}
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#foro">
                    {" "}
                    FORO{" "}
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#contacto">
                    {" "}
                    CONTACTO{" "}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
