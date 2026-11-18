import { useEffect, useState } from "react";
import { useAutoActualizar } from "../../../shared/hooks/useAutoActualizar";
import {
  getReporteInasistencias,
  getReporteDesaprobaciones,
} from "../services/reportesService.js";
import { getCicloLectivo } from "../../planestudios/services/planEstudiosService.js";
import { getModulos as getModulosCalificaciones } from "../../calificaciones/services/CalificacionesServices.js";

// Pide los dos reportes y los módulos del ciclo, y los deja listos para la vista.
async function cargarReportes(anio, moduloId) {
  const [resInasistencias, resDesaprobaciones, grupos] = await Promise.all([
    getReporteInasistencias(anio, moduloId),
    getReporteDesaprobaciones(anio),
    getModulosCalificaciones(anio),
  ]);

  const mapaModulos = new Map();
  for (const grupo of grupos ?? []) {
    for (const modulo of grupo.modulos ?? []) {
      mapaModulos.set(String(modulo.id), {
        ...modulo,
        anioCurso: grupo.anio,
      });
    }
  }

  return {
    alertas: resInasistencias?.alertas ?? [],
    umbral: resInasistencias?.umbralFaltas ?? 25,
    materias: resDesaprobaciones?.resultados ?? [],
    modulos: [...mapaModulos.values()].sort(
      (a, b) => Number(a.id) - Number(b.id),
    ),
  };
}

export function Reportes() {
  const [curso, setCurso] = useState("");
  const [division, setDivision] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [moduloId, setModuloId] = useState("");
  // Los reportes son siempre del ciclo lectivo vigente (no se elige en pantalla).
  const [anioSeleccionado, setAnioSeleccionado] = useState("");
  const [cargandoCiclos, setCargandoCiclos] = useState(true);
  const [errorCiclo, setErrorCiclo] = useState("");

  // Los datos cargados quedan asociados al ciclo y al módulo elegidos: si
  // cambian, se muestra "Cargando..." hasta tener los nuevos.
  const clave = `${anioSeleccionado}|${moduloId}`;
  const [resultado, setResultado] = useState({
    clave: null,
    alertas: [],
    umbral: 25,
    materias: [],
    modulos: [],
    error: "",
  });
  const cargando = !anioSeleccionado || resultado.clave !== clave;
  const error = errorCiclo || (cargando ? "" : resultado.error);
  const { alertas, umbral, materias, modulos: modulosDisponibles } = resultado;

  useEffect(() => {
    let activo = true;

    getCicloLectivo()
      .then((respuesta) => {
        if (!activo) return;

        const vigente =
          respuesta?.cicloActivo?.anio ?? respuesta?.ciclos?.[0]?.anio;

        setAnioSeleccionado(vigente == null ? "" : String(vigente));
      })
      .catch((err) => {
        if (activo) setErrorCiclo(err.message);
      })
      .finally(() => {
        if (activo) setCargandoCiclos(false);
      });

    return () => {
      activo = false;
    };
  }, []);

  useEffect(() => {
    if (!anioSeleccionado) return;

    let activo = true;
    const claveActual = `${anioSeleccionado}|${moduloId}`;
    cargarReportes(anioSeleccionado, moduloId)
      .then((datos) => {
        if (activo) setResultado({ clave: claveActual, ...datos, error: "" });
      })
      .catch((err) => {
        if (activo) {
          setResultado((previo) => ({
            ...previo,
            clave: claveActual,
            error: err.message,
          }));
        }
      });

    return () => {
      activo = false;
    };
  }, [anioSeleccionado, moduloId]);

  // Los reportes se actualizan solos: un alumno que queda libre por faltas
  // aparece sin recargar la página.
  useAutoActualizar(
    async () => {
      const datos = await cargarReportes(anioSeleccionado, moduloId);
      setResultado((previo) =>
        previo.clave === clave ? { ...previo, ...datos, error: "" } : previo,
      );
    },
    { activo: !cargando && !error },
  );

  const divisiones = curso === "3" ? ["A", "B", "C"] : ["A", "B", "C", "D"];
  const modulosVisibles = modulosDisponibles.filter(
    (modulo) => !curso || String(modulo.anioCurso) === String(curso),
  );

  // Opciones derivadas de las materias que tienen calificaciones en el ciclo elegido.
  const opcionesMaterias = [
    ...new Map(
      materias.map((r) => [
        String(r.materiaId),
        {
          id: String(r.materiaId),
          nombre: r.materia,
        },
      ]),
    ).values(),
  ].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));

  const coincideConFiltros = (registro) =>
    (!curso || String(registro.curso) === String(curso)) &&
    (!division || String(registro.division).trim() === String(division));

  const alertasVisibles = (cargando || error ? [] : alertas).filter(
    coincideConFiltros,
  );

  // El filtro de materia solo corresponde a desaprobación, no a inasistencias.
  const materiasVisibles = (cargando || error ? [] : materias).filter(
    (registro) =>
      coincideConFiltros(registro) &&
      (!materiaId || String(registro.materiaId) === materiaId),
  );

  function limpiarFiltros() {
    setCurso("");
    setDivision("");
    setMateriaId("");
    setModuloId("");
  }

  if (cargandoCiclos) {
    return <p>Cargando reportes...</p>;
  }

  if (error && !anioSeleccionado) {
    return <p role="alert">{error}</p>;
  }

  if (!anioSeleccionado) {
    return <p>No hay ciclos lectivos registrados.</p>;
  }

  return (
    <div className="reportes-panel">
      {/* ENCABEZADO */}
      <header className="rep-encabezado">
        <div>
          <h1>Reportes Académicos</h1>
          <p>
            Seguimiento de inasistencias y resultados por materia, curso y
            división.
          </p>
        </div>

      </header>

      {cargando && (
        <p role="status">Cargando reportes...</p>
      )}

      {error && (
        <p role="alert" className="mensaje-error">
          {error}
        </p>
      )}

      {/* FILTROS COMPARTIDOS */}
      <div
        className="rep-filtros"
        role="group"
        aria-label="Filtros de los reportes"
      >
        <div className="rep-campo">
          <label htmlFor="reporte-curso">Curso</label>
          <select
            id="reporte-curso"
            value={curso}
            onChange={(e) => {
              setCurso(e.target.value);
              setDivision("");
              setMateriaId("");
              setModuloId("");
            }}
          >
            <option value="">Todos los cursos</option>
            <option value="1">1º año</option>
            <option value="2">2º año</option>
            <option value="3">3º año</option>
          </select>
        </div>

        <div className="rep-campo">
          <label htmlFor="reporte-division">División</label>
          <select
            id="reporte-division"
            value={division}
            onChange={(e) => {
              setDivision(e.target.value);
              setMateriaId("");
            }}
          >
            <option value="">Todas las divisiones</option>
            {divisiones.map((letra) => (
              <option key={letra} value={letra}>
                División {letra}
              </option>
            ))}
          </select>
        </div>

        <div className="rep-campo">
          <label htmlFor="reporte-modulo">Módulo (inasistencias)</label>
          <select
            id="reporte-modulo"
            value={moduloId}
            onChange={(e) => setModuloId(e.target.value)}
          >
            <option value="">Todos los módulos</option>
            {modulosVisibles.map((modulo) => (
              <option key={modulo.id} value={modulo.id}>
                {modulo.nombre}
              </option>
            ))}
          </select>
        </div>

        <div className="rep-campo">
          <label htmlFor="reporte-materia">Materia (desaprobación)</label>
          <select
            id="reporte-materia"
            value={materiaId}
            onChange={(e) => setMateriaId(e.target.value)}
          >
            <option value="">Todas las materias</option>
            {opcionesMaterias.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.nombre}
              </option>
            ))}
          </select>
        </div>

        <button type="button" className="rep-limpiar" onClick={limpiarFiltros}>
          <i className="fa-solid fa-filter-circle-xmark" aria-hidden="true" />
          Limpiar filtros
        </button>
      </div>

      {/* REPORTE DE INASISTENCIAS */}
      <div className="rep-bloque">
        <div className="rep-bloque-cabecera">
          <div className="rep-titulo-grupo">
            <span className="rep-icono rep-icono-alerta">
              <i
                className="fa-solid fa-triangle-exclamation"
                aria-hidden="true"
              />
            </span>

            <div>
              <h2>Alertas de inasistencias</h2>
              <p>
                {moduloId
                  ? `Alumnos libres por superar las ${umbral} faltas en el módulo seleccionado.`
                  : `Alumnos libres por superar las ${umbral} faltas en un módulo que no tienen aprobado.`}
              </p>
            </div>
          </div>

          <span className="rep-etiqueta rep-etiqueta-alerta">
            Límite: {umbral} faltas
          </span>
        </div>

        <p className="rep-periodo">
          {moduloId
            ? `Historial de inasistencias del módulo seleccionado en el ciclo lectivo ${anioSeleccionado}.`
            : `Alertas de la cursada más reciente de cada alumno por módulo en el ciclo lectivo ${anioSeleccionado}.`}
        </p>

        <div
          className="tabla-responsive"
          role="region"
          aria-label="Listado de alertas de inasistencias"
          tabIndex={0}
        >
          <table className="tabla-gestion rep-tabla">
            <thead>
              <tr>
                <th scope="col">Alumno</th>
                <th scope="col">Plan de estudios</th>
                <th scope="col">Curso</th>
                <th scope="col">División</th>
                <th scope="col">Módulo</th>
                <th scope="col">Faltas acumuladas</th>
                <th scope="col">Situación</th>
              </tr>
            </thead>

            <tbody>
              {alertasVisibles.map((alumno) => (
                <tr key={alumno.id}>
                  <td>
                    <strong>{alumno.nombre}</strong>
                  </td>
                  <td>{alumno.planEstudio ?? "-"}</td>
                  <td>{alumno.curso}º año</td>
                  <td>{alumno.division}</td>
                  <td>{alumno.modulo}</td>
                  <td>
                    <span className="rep-faltas">{alumno.faltas}</span>
                  </td>
                  <td>
                    <span className="rep-etiqueta rep-etiqueta-alerta">
                      <i
                        className="fa-solid fa-circle-exclamation"
                        aria-hidden="true"
                      />
                      Libre por inasistencias
                    </span>
                  </td>
                </tr>
              ))}

              {alertasVisibles.length === 0 && (
                <tr>
                  <td colSpan={7} className="rep-vacio">
                    No hay alumnos libres por inasistencias para estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REPORTE DE MATERIAS */}
      <div className="rep-bloque">
        <div className="rep-bloque-cabecera">
          <div className="rep-titulo-grupo">
            <span className="rep-icono rep-icono-materias">
              <i className="fa-solid fa-chart-column" aria-hidden="true" />
            </span>

            <div>
              <h2>Desaprobación por materia</h2>
              <p>Comparación por curso y división.</p>
            </div>
          </div>

          <span className="rep-etiqueta rep-etiqueta-orden">
            Mayor porcentaje primero
          </span>
        </div>

        <p className="rep-periodo">
          Estadísticas calculadas sobre las calificaciones registradas en la
          base de datos.
        </p>

        <div
          className="tabla-responsive"
          role="region"
          aria-label="Resultados de desaprobación por materia"
          tabIndex={0}
        >
          <table className="tabla-gestion rep-tabla">
            <thead>
              <tr>
                <th scope="col">Materia</th>
                <th scope="col">Curso</th>
                <th scope="col">División</th>
                <th scope="col">Evaluados</th>
                <th scope="col">Desaprobados</th>
                <th scope="col">Desaprobación</th>
              </tr>
            </thead>

            <tbody>
              {materiasVisibles.map((registro) => (
                <tr key={registro.id}>
                  <td>
                    <strong>{registro.materia}</strong>
                  </td>
                  <td>{registro.curso}º año</td>
                  <td>{registro.division}</td>
                  <td>{registro.evaluados}</td>
                  <td>
                    <strong>{registro.desaprobados}</strong>
                  </td>
                  <td>
                    <div className="rep-porcentaje">
                      <div className="rep-barra" aria-hidden="true">
                        <span style={{ width: `${registro.porcentaje}%` }} />
                      </div>
                      <strong>{registro.porcentaje}%</strong>
                    </div>
                  </td>
                </tr>
              ))}

              {materiasVisibles.length === 0 && (
                <tr>
                  <td colSpan={6} className="rep-vacio">
                    No hay calificaciones registradas para estos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="rep-aclaracion">
          El porcentaje corresponde a los alumnos desaprobados sobre los
          evaluados en cada materia y grupo. Estos resultados orientan el
          seguimiento pedagógico; por sí solos no explican las causas de la
          desaprobación.
        </p>
      </div>
    </div>
  );
}
