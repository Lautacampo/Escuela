import { useEffect, useState } from "react";
import {
  getReporteInasistencias,
  getReporteDesaprobaciones,
} from "../services/reportesService.js";
import {
  getCicloLectivo,
  crearCicloLectivo,
} from "../../planestudios/services/planEstudiosService.js";

export function Reportes() {
  const [curso, setCurso] = useState("");
  const [division, setDivision] = useState("");
  const [materiaId, setMateriaId] = useState("");
  const [ciclos, setCiclos] = useState([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState("");
  const [cargandoCiclos, setCargandoCiclos] = useState(true);
  const [mostrarAltaCiclo, setMostrarAltaCiclo] = useState(false);
  const [nuevoAnio, setNuevoAnio] = useState(
    String(new Date().getFullYear() + 1),
  );
  const [guardandoCiclo, setGuardandoCiclo] = useState(false);
  const [errorCiclo, setErrorCiclo] = useState("");
  const [alertas, setAlertas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [umbral, setUmbral] = useState(25);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    getCicloLectivo()
      .then((respuesta) => {
        if (!activo) return;

        const lista = respuesta?.ciclos ?? [];
        setCiclos(lista);

        const vigente = respuesta?.cicloActivo?.anio ?? lista[0]?.anio;

        setAnioSeleccionado(vigente == null ? "" : String(vigente));
      })
      .catch((err) => {
        if (activo) setError(err.message);
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
    setCargando(true);
    setError("");

    Promise.all([
      getReporteInasistencias(anioSeleccionado),
      getReporteDesaprobaciones(anioSeleccionado),
    ])
      .then(([resInasistencias, resDesaprobaciones]) => {
        if (!activo) return;

        setAlertas(resInasistencias?.alertas ?? []);
        setUmbral(resInasistencias?.umbralFaltas ?? 25);
        setMaterias(resDesaprobaciones?.resultados ?? []);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [anioSeleccionado]);

  const divisiones = curso === "3" ? ["A", "B", "C"] : ["A", "B", "C", "D"];

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

  async function agregarCiclo(evento) {
    evento.preventDefault();
    setErrorCiclo("");

    const anio = Number(nuevoAnio);

    if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
      setErrorCiclo("Ingresá un año válido entre 2000 y 2100.");
      return;
    }

    try {
      setGuardandoCiclo(true);

      await crearCicloLectivo(anio);

      const respuesta = await getCicloLectivo();

      setCiclos(respuesta.ciclos ?? []);
      setAnioSeleccionado(String(anio));

      setCurso("");
      setDivision("");
      setMateriaId("");
      setMostrarAltaCiclo(false);
    } catch (err) {
      setErrorCiclo(err.message);
    } finally {
      setGuardandoCiclo(false);
    }
  }

  function limpiarFiltros() {
    setCurso("");
    setDivision("");
    setMateriaId("");
  }

  if (cargandoCiclos) {
    return <p>Cargando ciclos lectivos...</p>;
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

        <div className="rep-selector-ciclo">
          <label htmlFor="reporte-ciclo">Ciclo lectivo</label>

          <select
            id="reporte-ciclo"
            className="rep-ciclo"
            value={anioSeleccionado}
            onChange={(evento) => {
              setAnioSeleccionado(evento.target.value);
              setCurso("");
              setDivision("");
              setMateriaId("");
            }}
          >
            {ciclos.map((ciclo) => (
              <option key={ciclo.id} value={ciclo.anio}>
                {ciclo.anio}
              </option>
            ))}
          </select>

          <button
            type="button"
            className="btn-secundario"
            onClick={() => {
              setErrorCiclo("");
              setMostrarAltaCiclo(!mostrarAltaCiclo);
            }}
          >
            <i className="fa-solid fa-plus" aria-hidden="true" /> Agregar ciclo
          </button>
        </div>
      </header>

      {mostrarAltaCiclo && (
        <form className="rep-alta-ciclo" onSubmit={agregarCiclo}>
          <label htmlFor="nuevo-ciclo-lectivo">Nuevo ciclo lectivo</label>

          <input
            id="nuevo-ciclo-lectivo"
            type="number"
            min="2000"
            max="2100"
            value={nuevoAnio}
            onChange={(evento) => setNuevoAnio(evento.target.value)}
            required
          />

          <button
            type="submit"
            className="btn-secundario"
            disabled={guardandoCiclo}
          >
            {guardandoCiclo ? "Guardando..." : "Guardar ciclo"}
          </button>

          <button
            type="button"
            className="btn-secundario"
            onClick={() => setMostrarAltaCiclo(false)}
          >
            Cancelar
          </button>

          {errorCiclo && (
            <p role="alert" className="mensaje-error">
              {errorCiclo}
            </p>
          )}
        </form>
      )}

      {cargando && (
        <p role="status">Cargando reportes del ciclo {anioSeleccionado}...</p>
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
              <p>Alumnos que alcanzaron o superaron las {umbral} faltas.</p>
            </div>
          </div>

          <span className="rep-etiqueta rep-etiqueta-alerta">
            Umbral: {umbral} faltas
          </span>
        </div>

        <p className="rep-periodo">
          Inasistencias acumuladas del ciclo lectivo {anioSeleccionado}.
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
                <th scope="col">Curso</th>
                <th scope="col">División</th>
                <th scope="col">Faltas acumuladas</th>
                <th scope="col">Alerta</th>
              </tr>
            </thead>

            <tbody>
              {alertasVisibles.map((alumno) => (
                <tr key={alumno.id}>
                  <td>
                    <strong>{alumno.nombre}</strong>
                  </td>
                  <td>{alumno.curso}º año</td>
                  <td>{alumno.division}</td>
                  <td>
                    <span className="rep-faltas">{alumno.faltas}</span>
                  </td>
                  <td>
                    <span className="rep-etiqueta rep-etiqueta-alerta">
                      <i
                        className="fa-solid fa-circle-exclamation"
                        aria-hidden="true"
                      />
                      Umbral alcanzado ({alumno.condicion})
                    </span>
                  </td>
                </tr>
              ))}

              {alertasVisibles.length === 0 && (
                <tr>
                  <td colSpan={5} className="rep-vacio">
                    No hay alumnos que superen el límite de inasistencias para
                    estos filtros.
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
