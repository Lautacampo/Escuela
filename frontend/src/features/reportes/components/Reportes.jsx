import { useState } from "react";

const ALERTAS_EJEMPLO = [
  {
    id: 1,
    nombre: "Juan Pérez",
    curso: "1",
    division: "A",
    faltas: 28,
  },
  {
    id: 2,
    nombre: "Lucía Gómez",
    curso: "1",
    division: "A",
    faltas: 25,
  },
  {
    id: 3,
    nombre: "Martín López",
    curso: "1",
    division: "B",
    faltas: 26,
  },
  {
    id: 4,
    nombre: "Camila Torres",
    curso: "2",
    division: "B",
    faltas: 30,
  },
  {
    id: 5,
    nombre: "Sofía Fernández",
    curso: "2",
    division: "B",
    faltas: 25,
  },
  {
    id: 6,
    nombre: "Nicolás Díaz",
    curso: "3",
    division: "C",
    faltas: 27,
  },
];

const MATERIAS_EJEMPLO = [
  {
    id: 1,
    materia: "Matemática",
    curso: "1",
    division: "A",
    evaluados: 30,
    desaprobados: 18,
    porcentaje: 60,
  },
  {
    id: 2,
    materia: "Lengua",
    curso: "1",
    division: "A",
    evaluados: 30,
    desaprobados: 15,
    porcentaje: 50,
  },
  {
    id: 3,
    materia: "Matemática",
    curso: "2",
    division: "B",
    evaluados: 28,
    desaprobados: 14,
    porcentaje: 50,
  },
  {
    id: 4,
    materia: "Lengua Extranjera: Inglés",
    curso: "1",
    division: "A",
    evaluados: 30,
    desaprobados: 12,
    porcentaje: 40,
  },
  {
    id: 5,
    materia: "Lengua Extranjera: Inglés",
    curso: "3",
    division: "C",
    evaluados: 20,
    desaprobados: 8,
    porcentaje: 40,
  },
  {
    id: 6,
    materia: "Informática",
    curso: "1",
    division: "A",
    evaluados: 30,
    desaprobados: 9,
    porcentaje: 30,
  },
  {
    id: 7,
    materia: "Física",
    curso: "3",
    division: "C",
    evaluados: 20,
    desaprobados: 6,
    porcentaje: 30,
  },
  {
    id: 8,
    materia: "Lengua y Literatura",
    curso: "2",
    division: "B",
    evaluados: 28,
    desaprobados: 7,
    porcentaje: 25,
  },
  {
    id: 9,
    materia: "Química",
    curso: "2",
    division: "B",
    evaluados: 28,
    desaprobados: 7,
    porcentaje: 25,
  },
  {
    id: 10,
    materia: "Biología",
    curso: "1",
    division: "A",
    evaluados: 30,
    desaprobados: 6,
    porcentaje: 20,
  },
];

export function Reportes() {
  const [curso, setCurso] = useState("");
  const [division, setDivision] = useState("");

  const divisiones = curso === "3" ? ["A", "B", "C"] : ["A", "B", "C", "D"];

  // Solo filtra lo que se muestra en pantalla.
  const coincideConFiltros = (registro) =>
    (!curso || registro.curso === curso) &&
    (!division || registro.division === division);

  const alertasVisibles = ALERTAS_EJEMPLO.filter(coincideConFiltros);
  const materiasVisibles = MATERIAS_EJEMPLO.filter(coincideConFiltros);

  function limpiarFiltros() {
    setCurso("");
    setDivision("");
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

        <span className="rep-ciclo">Ciclo lectivo 2026</span>
      </header>

      <p className="rep-demo">
        <i className="fa-solid fa-circle-info" aria-hidden="true" />
        Vista de ejemplo: los nombres y las cifras son ficticios.
      </p>

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
              <p>Alumnos que alcanzaron o superaron las 25 faltas.</p>
            </div>
          </div>

          <span className="rep-etiqueta rep-etiqueta-alerta">
            Umbral: 25 faltas
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
                      Umbral alcanzado
                    </span>
                  </td>
                </tr>
              ))}

              {alertasVisibles.length === 0 && (
                <tr>
                  <td colSpan={5} className="rep-vacio">
                    No hay alertas en los datos de ejemplo para estos filtros.
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
          Primer cuatrimestre de 2026 · Módulos I, III y V.
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
                    No hay resultados de ejemplo para estos filtros.
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
