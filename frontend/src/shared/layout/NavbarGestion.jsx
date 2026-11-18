import { Link } from "react-router";
import { useSesion } from "../../features/auth/context/SesionContext";

const ETIQUETAS_ROL = {
  directivo: "Directivo",
  docente: "Docente",
  preceptor: "Preceptor",
};

export default function NavabarGestion() {
  const { usuario, cerrarSesion } = useSesion();
  const nombreUsuario = [usuario?.nombre, usuario?.apellido]
    .filter(Boolean)
    .join(" ");

  return (
    <header className="navhorizontal">
      <div className="navhorizontal-usuario">
        <p>
          <i className="fa-solid fa-circle-user" aria-hidden="true"></i>
          <span className="navhorizontal-etiqueta">Usuario:</span>
          <strong
            className="navhorizontal-nombre"
            title={nombreUsuario || "Usuario"}
          >
            {nombreUsuario || "Usuario"}
          </strong>
          {usuario && (
            <span className="navhorizontal-rol">
              ({ETIQUETAS_ROL[usuario.rol] ?? usuario.rol})
            </span>
          )}
        </p>
        <Link
          to="/login"
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
