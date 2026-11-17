import { useEffect, useState } from "react";
import { Link } from "react-router";

import { useSesion } from "../../auth/context/SesionContext";
import { ROLES } from "../../auth/roles";
import {
  getCiclosCalificaciones,
  getResumenCalificaciones,
} from "../../calificaciones/services/CalificacionesServices";
import { getModulos as getModulosAsistencia } from "../../asistencia/services/asistenciaServices";
import { getCicloLectivo } from "../../planestudios/services/planEstudiosService";
import {
  getReporteDesaprobaciones,
  getReporteInasistencias,
} from "../../reportes/services/reportesService";
import "./dashboard.css";

// Se considera "desaprobación alta" a partir de este porcentaje.
const UMBRAL_DESAPROBACION = 30;
// Cantidad de filas que se muestran en cada panel del inicio.
const LIMITE_LISTADOS = 5;

const NOMBRE_ROL = {
  [ROLES.DIRECTIVO]: "Equipo directivo",
  [ROLES.DOCENTE]: "Docente",
  [ROLES.PRECEPTOR]: "Preceptor",
};

const ACCESOS = [
  {
    to: "/gestion/alumnos",
    etiqueta: "Alumnos",
    icono: "fa-user-graduate",
    roles: [ROLES.DIRECTIVO],
  },
  {
    to: "/gestion/docentes",
    etiqueta: "Docentes",
    icono: "fa-chalkboard-user",
    roles: [ROLES.DIRECTIVO],
  },
  {
    to: "/gestion/preceptores",
    etiqueta: "Preceptores",
    icono: "fa-user-tie",
    roles: [ROLES.DIRECTIVO],
  },
  {
    to: "/gestion/asistencia",
    etiqueta: "Asistencia",
    icono: "fa-clipboard-check",
    roles: [ROLES.DIRECTIVO, ROLES.PRECEPTOR],
  },
  {
    to: "/gestion/calificaciones",
    etiqueta: "Calificaciones",
    icono: "fa-graduation-cap",
    roles: [ROLES.DIRECTIVO, ROLES.DOCENTE],
  },
  {
    to: "/gestion/plan-estudios",
    etiqueta: "Plan de estudios",
    icono: "fa-book-open",
    roles: [ROLES.DIRECTIVO],
  },
  {
    to: "/gestion/reportes",
    etiqueta: "Reportes",
    icono: "fa-chart-column",
    roles: [ROLES.DIRECTIVO],
  },
];

const contarUnicos = (valores) =>
  new Set(
    valores.filter(
      (valor) => valor !== null && valor !== undefined && valor !== "",
    ),
  ).size;

const contarDivisionesUnicas = (modulos) =>
  contarUnicos(
    modulos.flatMap((modulo) =>
      (modulo.divisiones ?? []).map(
        (division) => `${modulo.anio}-${String(division).trim()}`,
      ),
    ),
  );

/* ------------------------------------------------------------------ */
/* Directivo: indicadores académicos reales (reportes institucionales) */
/* ------------------------------------------------------------------ */
async function cargarDirectivo() {
  const ciclo = await getCicloLectivo();
  const anio = ciclo?.ciclos?.find((item) => item.activo)?.anio ?? null;
  if (anio === null) {
    throw new Error("No hay un ciclo lectivo activo para mostrar los indicadores.");
  }

  const [inasistencias, desaprobaciones] = await Promise.all([
    getReporteInasistencias(anio),
    getReporteDesaprobaciones(anio),
  ]);

  const umbralFaltas = inasistencias?.umbralFaltas ?? 25;
  const alertas = [...(inasistencias?.alertas ?? [])].sort(
    (a, b) => Number(b.faltas) - Number(a.faltas),
  );

  const materias = [...(desaprobaciones?.resultados ?? [])].sort(
    (a, b) => Number(b.porcentaje) - Number(a.porcentaje),
  );
  const criticas = materias.filter(
    (materia) => Number(materia.porcentaje) >= UMBRAL_DESAPROBACION,
  );
  const peorMateria = materias[0] ?? null;
  const alumnosEnRiesgo = contarUnicos(
    alertas.map((alumno) => alumno.alumnoId ?? alumno.id),
  );

  return {
    indicadores: [
      {
        etiqueta: "Alumnos en riesgo",
        valor: alumnosEnRiesgo,
        detalle: `Con ${umbralFaltas} faltas o más acumuladas`,
        icono: "fa-triangle-exclamation",
        tono: alertas.length > 0 ? "alerta" : "ok",
      },
      {
        etiqueta: "Casos con desaprobación alta",
        valor: criticas.length,
        detalle: `Umbral ${UMBRAL_DESAPROBACION} % sobre ${materias.length} combinaciones evaluadas`,
        icono: "fa-chart-column",
        tono: criticas.length > 0 ? "atencion" : "ok",
      },
      {
        etiqueta: "Mayor desaprobación",
        valor: peorMateria ? `${peorMateria.porcentaje} %` : "—",
        detalle: peorMateria
          ? `${peorMateria.materia} · ${peorMateria.curso}º año div. ${peorMateria.division}`
          : "Sin calificaciones registradas en el ciclo",
        icono: "fa-arrow-trend-down",
        tono: "neutro",
      },
      {
        etiqueta: "Ciclo lectivo",
        valor: anio ?? "—",
        detalle: "Período en curso",
        icono: "fa-calendar-days",
        tono: "neutro",
      },
    ],
    paneles: [
      {
        id: "alertas",
        titulo: "Alertas de inasistencia",
        icono: "fa-triangle-exclamation",
        enlace: { to: "/gestion/reportes", texto: "Ver reporte" },
        vacio: "Ningún alumno alcanzó el umbral de faltas en el ciclo.",
        filas: alertas.slice(0, LIMITE_LISTADOS).map((alumno) => ({
          id: alumno.id,
          principal: alumno.nombre,
          secundario: `${alumno.curso}º año div. ${alumno.division} · ${alumno.modulo}`,
          valor: `${alumno.faltas} faltas`,
        })),
      },
      {
        id: "desaprobacion",
        titulo: "Desaprobación por materia",
        icono: "fa-chart-column",
        enlace: { to: "/gestion/reportes", texto: "Ver reporte" },
        vacio: "Todavía no hay calificaciones registradas en el ciclo.",
        filas: materias.slice(0, LIMITE_LISTADOS).map((materia) => ({
          id: materia.id,
          principal: materia.materia,
          secundario: `${materia.curso}º año div. ${materia.division} · ${materia.desaprobados}/${materia.evaluados} desaprobados`,
          valor: `${materia.porcentaje} %`,
        })),
      },
    ],
  };
}

/* ------------------------------------------------------- */
/* Docente: módulos, materias y progreso de calificación    */
/* ------------------------------------------------------- */
async function cargarDocente() {
  const { cicloActivo, ciclos } = await getCiclosCalificaciones();
  const anio = cicloActivo?.anio ?? ciclos?.[0]?.anio ?? null;

  const resumen = anio ? await getResumenCalificaciones(anio) : null;
  const modulos = resumen?.modulos ?? [];

  const materias = modulos.flatMap((modulo) => modulo.materias ?? []);
  const alumnos = materias.reduce((total, materia) => total + materia.alumnos, 0);
  const calificados = materias.reduce(
    (total, materia) => total + materia.calificados,
    0,
  );
  const pendientes = alumnos - calificados;
  const completas = materias.filter((materia) => materia.pendientes === 0).length;

  return {
    indicadores: [
      {
        etiqueta: "Módulos a cargo",
        valor: modulos.length,
        detalle: "Con calificaciones habilitadas",
        icono: "fa-chalkboard",
        tono: "neutro",
      },
      {
        etiqueta: "Divisiones asignadas",
        valor: contarDivisionesUnicas(modulos),
        detalle: "Cursos donde dictás clase",
        icono: "fa-users",
        tono: "neutro",
      },
      {
        etiqueta: "Calificaciones cargadas",
        valor: `${calificados}/${alumnos}`,
        detalle: pendientes > 0 ? `Faltan ${pendientes} por calificar` : "Carga completa",
        icono: "fa-graduation-cap",
        tono: pendientes > 0 ? "atencion" : "ok",
      },
      {
        etiqueta: "Materias a cargo",
        valor: materias.length,
        detalle: `${completas} con calificaciones completas`,
        icono: "fa-book",
        tono: "neutro",
      },
      {
        etiqueta: "Ciclo lectivo",
        valor: anio ?? "—",
        detalle: "Período en curso",
        icono: "fa-calendar-days",
        tono: "neutro",
      },
    ],
    paneles: [
      {
        id: "modulos-docente",
        titulo: "Mis módulos",
        icono: "fa-chalkboard",
        enlace: { to: "/gestion/calificaciones", texto: "Ir a calificaciones" },
        vacio: "No tenés módulos asignados en el ciclo vigente.",
        filas: modulos.flatMap((modulo) => [
          {
            id: `grupo-${modulo.anio}-${modulo.moduloId}`,
            grupo: true,
            principal: `${modulo.anio}º año · ${modulo.nombre}`,
            secundario: modulo.divisiones.length
              ? `División ${modulo.divisiones.join(", ")}`
              : "Sin divisiones asignadas",
          },
          ...(modulo.materias ?? []).map((materia) => ({
            id: `materia-${modulo.anio}-${modulo.moduloId}-${materia.id}`,
            principal: materia.nombre,
            secundario: `${materia.alumnos} alumnos · faltan ${materia.pendientes}`,
            valor: `${materia.calificados}/${materia.alumnos}`,
            tono: materia.pendientes === 0 ? "ok" : "atencion",
          })),
        ]),
      },
    ],
  };
}

/* ------------------------------------------------------- */
/* Preceptor: divisiones con asistencia a su cargo         */
/* ------------------------------------------------------- */
async function cargarPreceptor() {
  const grupos = await getModulosAsistencia();
  const modulos = grupos.flatMap((grupo) =>
    (grupo.modulos ?? []).map((modulo) => ({ ...modulo, anio: grupo.anio })),
  );

  const aniosDeCursada = [
    ...new Set(
      modulos
        .map((modulo) => Number(modulo.anio))
        .filter((anio) => Number.isInteger(anio)),
    ),
  ].sort((a, b) => a - b);

  return {
    indicadores: [
      {
        etiqueta: "Módulos con asistencia",
        valor: modulos.length,
        detalle: "Planillas que podés registrar",
        icono: "fa-clipboard-check",
        tono: "neutro",
      },
      {
        etiqueta: "Divisiones a cargo",
        valor: contarDivisionesUnicas(modulos),
        detalle: "Cursos bajo tu seguimiento",
        icono: "fa-users",
        tono: "neutro",
      },
      {
        etiqueta: "Años de cursada",
        valor: aniosDeCursada.length,
        detalle: aniosDeCursada.length
          ? `Con módulos asignados: ${aniosDeCursada.map((anio) => `${anio}º`).join(", ")}`
          : "Sin años con módulos asignados",
        icono: "fa-calendar-days",
        tono: "neutro",
      },
    ],
    paneles: [
      {
        id: "modulos-preceptor",
        titulo: "Divisiones a cargo",
        icono: "fa-users",
        enlace: { to: "/gestion/asistencia", texto: "Cargar asistencia" },
        vacio: "No tenés divisiones asignadas.",
        filas: modulos.map((modulo) => ({
          id: `${modulo.anio}-${modulo.moduloId}`,
          principal: `${modulo.anio}º año · ${modulo.nombre}`,
          secundario: (modulo.divisiones ?? []).length
            ? `Divisiones ${modulo.divisiones.join(", ")}`
            : "Sin divisiones asignadas",
          valor: `${(modulo.divisiones ?? []).length} divisiones`,
        })),
      },
    ],
  };
}

const CARGADORES = {
  [ROLES.DIRECTIVO]: cargarDirectivo,
  [ROLES.DOCENTE]: cargarDocente,
  [ROLES.PRECEPTOR]: cargarPreceptor,
};

export function DashboardPage() {
  const { usuario } = useSesion();
  const rol = usuario?.rol;
  const cargador = CARGADORES[rol] ?? null;

  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!cargador) return undefined;

    let activo = true;

    cargador()
      .then((datos) => {
        if (activo) setResumen(datos);
      })
      .catch((err) => {
        if (activo) {
          setError(err.message || "No se pudieron cargar los indicadores");
        }
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [cargador, rol]);

  const accesos = ACCESOS.filter((acceso) => acceso.roles.includes(rol));
  const saludo = usuario?.nombre ? `Hola, ${usuario.nombre}.` : "Bienvenido.";
  const subtitulo =
    rol === ROLES.PRECEPTOR
      ? "Resumen de tus asignaciones de asistencia."
      : "Resumen del ciclo en curso.";

  return (
    <div className="dashboard-inicio">
      <header className="dash-encabezado">
        <span className="dash-encabezado-icono" aria-hidden="true">
          <i className="fa-solid fa-table-columns" />
        </span>
        <div>
          <h1>Panel de Inicio</h1>
          <p className="dash-subtitulo">
            {saludo} {NOMBRE_ROL[rol] ?? "Usuario"} · {subtitulo}
          </p>
        </div>
      </header>

      {cargador && (
        <section className="dash-seccion" aria-labelledby="dash-titulo-indicadores">
          <div className="dash-titulo-seccion">
            <i className="fa-solid fa-chart-line" aria-hidden="true" />
            <div>
              <h2 id="dash-titulo-indicadores">Indicadores</h2>
              <p className="dash-titulo-detalle">
                Datos calculados sobre las calificaciones y asistencias registradas.
              </p>
            </div>
          </div>

          {cargando && (
            <p className="dash-estado" role="status">
              <i className="fa-solid fa-circle-notch fa-spin" aria-hidden="true" />
              <span>Cargando indicadores…</span>
            </p>
          )}

          {!cargando && error && (
            <p className="dash-estado dash-estado-error" role="alert">
              No se pudieron cargar los indicadores: {error}
            </p>
          )}

          {!cargando && !error && resumen && (
            <ul className="dash-kpis">
              {resumen.indicadores.map((indicador) => (
                <li
                  key={indicador.etiqueta}
                  className={`dash-kpi dash-kpi--${indicador.tono ?? "neutro"}`}
                >
                  <span className="dash-kpi-icono" aria-hidden="true">
                    <i className={`fa-solid ${indicador.icono}`} />
                  </span>
                  <div className="dash-kpi-texto">
                    <span className="dash-kpi-etiqueta">{indicador.etiqueta}</span>
                    <strong className="dash-kpi-valor">{indicador.valor}</strong>
                    <span className="dash-kpi-detalle">{indicador.detalle}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {!cargando && !error && resumen?.paneles?.length > 0 && (
        <div className="dash-paneles">
          {resumen.paneles.map((panel) => (
            <section
              key={panel.id}
              className="dash-panel"
              aria-labelledby={`dash-panel-${panel.id}`}
            >
              <div className="dash-panel-cabecera">
                <div className="dash-panel-titulo">
                  <i
                    className={`fa-solid ${panel.icono ?? "fa-circle-info"}`}
                    aria-hidden="true"
                  />
                  <h2 id={`dash-panel-${panel.id}`}>{panel.titulo}</h2>
                </div>
                {panel.enlace && (
                  <Link to={panel.enlace.to}>{panel.enlace.texto}</Link>
                )}
              </div>

              {panel.filas.length === 0 ? (
                <p className="dash-vacio">{panel.vacio}</p>
              ) : (
                <ul className="dash-lista">
                  {panel.filas.map((fila) =>
                    fila.grupo ? (
                      <li key={fila.id} className="dash-grupo">
                        <span className="dash-grupo-titulo">{fila.principal}</span>
                        <span className="dash-grupo-detalle">{fila.secundario}</span>
                      </li>
                    ) : (
                      <li
                        key={fila.id}
                        className={fila.tono ? `dash-fila--${fila.tono}` : undefined}
                      >
                        <span className="dash-lista-principal">{fila.principal}</span>
                        <span className="dash-lista-secundario">{fila.secundario}</span>
                        <span className="dash-lista-valor">{fila.valor}</span>
                      </li>
                    ),
                  )}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}

      <section className="dash-seccion" aria-labelledby="dash-titulo-accesos">
        <div className="dash-titulo-seccion">
          <i className="fa-solid fa-bolt" aria-hidden="true" />
          <div>
            <h2 id="dash-titulo-accesos">Accesos rápidos</h2>
            <p className="dash-titulo-detalle">
              Atajos a las secciones habilitadas para tu rol.
            </p>
          </div>
        </div>

        <ul className="dash-accesos">
          {accesos.map((acceso) => (
            <li key={acceso.to}>
              <Link to={acceso.to} className="dash-acceso">
                <i className={`fa-solid ${acceso.icono}`} aria-hidden="true" />
                <span>{acceso.etiqueta}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
