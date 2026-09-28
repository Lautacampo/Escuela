import { useState, useEffect } from "react";
import { Link } from "react-router";

function Navbar() {
  const [hayScroll, setHayScroll] = useState(false);

  useEffect(() => {
    const actualizarNavegacion = () => {
      setHayScroll(window.scrollY > 80);
    };
    window.addEventListener("scroll", actualizarNavegacion);
    return () => window.removeEventListener("scroll", actualizarNavegacion);
  }, []);

  return (
    <header>
      <div
        className={`header-fijo ${hayScroll ? "compacto" : ""}`}
        id="header-fijo"
      >
        <div className="barra-superior">
          <Link to="/login">
            <i className="fa-solid fa-right-to-bracket"></i> Iniciar Sesión
          </Link>
        </div>

        <nav
          className={`navbar navbar-expand-lg navbar-principal ${hayScroll ? "navbar-compacta" : ""}`}
        >
          <div className="container-fluid">
            <Link className="navbar-brand navlogo" to="/">
              <img
                src="/img/logos/logo-tomas-baras-letras-blancas.png"
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
              <i className="fa-solid fa-bars" style={{ color: "white" }}></i>
            </button>

            <div className="collapse navbar-collapse" id="menu-principal">
              <ul className="navbar-nav ms-auto navlinks">
                <li className="nav-item">
                  <a className="nav-link" href="/#quienessomos">
                    ¿QUIÉNES SOMOS?
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/#historia-evolucion">
                    HISTORIA
                  </a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/#equipo">
                    EQUIPO DOCENTE
                  </a>
                </li>
                {/* Enlace al Foro actualizado */}
                <li className="nav-item">
                  <Link className="nav-link" to="/foro">
                    FORO
                  </Link>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="/#contacto">
                    CONTACTO
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
