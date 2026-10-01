import { Link } from "react-router";

export default function NavabarGestion() {
  const cerrarSesion = () => {
    localStorage.removeItem("sistemaGestionAuth");
  };

  return (
    <header className="navhorizontal">
      <div className="navhorizontal-usuario">
        <p>
          <i className="fa-solid fa-circle-user"></i>
          Usuario: <strong>Administrador</strong>
        </p>
        <Link
          to="/"
          onClick={cerrarSesion}
          className="btn-cerrar-sesion"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
