import { useEffect, useState } from "react";
import {
  getReporteInasistencias,
  getReporteDesaprobaciones,
} from "../services/reportesService.js";

export function Reportes() {
  const [curso, setCurso] = useState("");
  const [division, setDivision] = useState("");
  const [alertas, setAlertas] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [umbral, setUmbral] = useState(25);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;
    Promise.all([getReporteInasistencias(), getReporteDesaprobaciones()])
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
  }, []);

  const divisiones = curso === "3" ? ["A", "B", "C"] : ["A", "B", "C", "D"];

  const coincideConFiltros = (registro) =>
    (!curso || String(registro.curso) === String(curso)) &&
    (!division || String(registro.division).trim() === String(division));

  const alertasVisibles = alertas.filter(coincideConFiltros);
  const materiasVisibles = materias.filter(coincideConFiltros);

  function limpiarFiltros() {
    setCurso("");
    setDivision("");
  }

  if (cargando) return <p>Cargando reportes estadísticos...</p>;
  if (error) return <p role="alert">{error}</p>;

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

        <span className="rep-ciclo">Ciclo lectivo 2026</span>
      </header>

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
            onChange={(e) => setDivision(e.target.value)}
          >
            <option value="">Todas las divisiones</option>
            {divisiones.map((letra) => (
              <option key={letra} value={letra}>
                División {letra}
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
          Inasistencias acumuladas del ciclo lectivo 2026.
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
