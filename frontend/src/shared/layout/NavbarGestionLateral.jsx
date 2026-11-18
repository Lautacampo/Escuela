import { NavLink } from "react-router";
import { useSesion } from "../../features/auth/context/SesionContext";
import { ROLES } from "../../features/auth/roles";
const {DIRECTIVO, DOCENTE, PRECEPTOR}=ROLES;

const ITEMS = [
  { to: "/gestion", label: "Inicio", icono: "fa-house", end: true, roles: [DIRECTIVO, DOCENTE, PRECEPTOR] },
  { to: "/gestion/alumnos", label: "Gestión de Alumnos", icono: "fa-user-graduate", roles: [DIRECTIVO] },
  { to: "/gestion/docentes", label: "Gestión de Docentes", icono: "fa-chalkboard-user", roles: [DIRECTIVO] },
  { to: "/gestion/preceptores", label: "Gestión de Preceptores", icono: "fa-user-tie", roles: [DIRECTIVO] },
  { to: "/gestion/asistencia", label: "Carga de Asistencia", icono: "fa-clipboard-check", roles: [DIRECTIVO, PRECEPTOR] },
  { to: "/gestion/calificaciones", label: "Calificaciones", icono: "fa-graduation-cap", roles: [DIRECTIVO, DOCENTE] },
  { to: "/gestion/plan-estudios", label: "Plan de Estudios", icono: "fa-book-open", roles: [DIRECTIVO] },
  { to: "/gestion/reportes", label: "Reportes", icono: "fa-chart-column", roles: [DIRECTIVO] },
];

const ETIQUETAS_ROL = {
  directivo: "Directivo",
  docente: "Docente",
  preceptor: "Preceptor",
};

// El estado del menú lo maneja LayoutPrivado; el botón que lo abre está
// en la barra superior (NavbarGestion).
export default function NavBarGestionLateral({ menuAbierto = false, onCerrar }) {
  const { usuario } = useSesion();
  const nombreCompleto = usuario
    ? [usuario.nombre, usuario.apellido].filter(Boolean).join(" ")
    : "";

  return (
    <>
      {menuAbierto && (
        <div
          className="overlay-menu"
          onClick={onCerrar}
          aria-hidden="true"
        ></div>
      )}

      <nav
        id="menu-gestion"
        className={`navlateral ${menuAbierto ? "menu-abierto" : ""}`}
        aria-label="Menú de gestión"
      >
        <div className="logo-sidebar">
          <img
            src="/img/logos/logo-principal.png"
            alt="Logo Colegio Tomás Baras"
          />
        </div>

        {/* En celular se muestra arriba del menú quién tiene la sesión abierta. */}
        {usuario && (
          <div className="sesion-sidebar">
            <strong>{nombreCompleto}</strong>
            <span>{ETIQUETAS_ROL[usuario.rol] ?? usuario.rol}</span>
          </div>
        )}

        <ul className="menu-sidebar">
          {ITEMS.filter((item) => item.roles.includes(usuario?.rol)).map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={({ isActive }) => (isActive ? "activo" : "")} onClick={onCerrar}>
                <i className={`fa-solid ${item.icono}`}></i>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </>
  );
}
