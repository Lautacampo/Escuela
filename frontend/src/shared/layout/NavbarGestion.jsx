import { Link } from "react-router";
import { useSesion } from "../../features/auth/context/SesionContext";

const ETIQUETAS_ROL = {
  directivo: "Directivo",
  docente: "Docente",
  preceptor: "Preceptor",
};

// Íconos en SVG: no dependen de que cargue Font Awesome desde el CDN.
function IconoMenu({ abierto }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width="22"
      height="22"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    >
      {abierto ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

export default function NavabarGestion({ menuAbierto = false, onAlternarMenu }) {
  const { usuario, cerrarSesion } = useSesion();

  const nombreCompleto = usuario
    ? [usuario.nombre, usuario.apellido].filter(Boolean).join(" ")
    : "";
  const rol = usuario ? ETIQUETAS_ROL[usuario.rol] ?? usuario.rol : "";

  return (
    <header className="navhorizontal">
      {/* Solo se ve en celular (ver gestion.css). */}
      <button
        type="button"
        className={`btn-menu-hamburguesa ${menuAbierto ? "abierto" : ""}`}
        onClick={onAlternarMenu}
        aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        aria-expanded={menuAbierto}
        aria-controls="menu-gestion"
      >
        <IconoMenu abierto={menuAbierto} />
      </button>

      <div className="navhorizontal-usuario">
        <p title={nombreCompleto ? `${nombreCompleto} (${rol})` : undefined}>
          <i className="fa-solid fa-circle-user" aria-hidden="true"></i>
          <span className="navhorizontal-datos">
            <span className="navhorizontal-etiqueta">Usuario: </span>
            <strong className="navhorizontal-nombre">{nombreCompleto}</strong>
            {/* Los paréntesis del rol los agrega gestion.css en escritorio. */}
            {usuario && <span className="navhorizontal-rol">{rol}</span>}
          </span>
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
