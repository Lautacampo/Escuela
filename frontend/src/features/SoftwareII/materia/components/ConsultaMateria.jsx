import { useEffect, useRef, useState } from "react";
import {
  getFichaMateria,
  getMateriasPorAnio,
} from "../services/MateriaServices";
import "./consultaMateria.css";

function nombreDocentes(docentes) {
  return docentes
    .map((docente) => `${docente.apellido}, ${docente.nombre}`)
    .join(" / ");
}

export function ConsultaMateria() {
  const [anios, setAnios] = useState([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState("");
  const [materiaSeleccionadaId, setMateriaSeleccionadaId] = useState("");
  const [ficha, setFicha] = useState(null);
  const [cargandoAnios, setCargandoAnios] = useState(true);
  const [cargandoFicha, setCargandoFicha] = useState(false);
  const [error, setError] = useState(null);

  // Numero de consulta vigente: descarta respuestas de pedidos viejos.
  const consultaVigente = useRef(0);

  const anio = anios.find((item) => String(item.anio) === anioSeleccionado);
  const materiasDelAnio = anio?.materias ?? [];

  useEffect(() => {
    let activo = true;
    getMateriasPorAnio()
      .then((datos) => activo && setAnios(datos))
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargandoAnios(false));
    return () => {
      activo = false;
    };
  }, []);

  function seleccionarAnio(evento) {
    consultaVigente.current += 1;
    setAnioSeleccionado(evento.target.value);
    setMateriaSeleccionadaId("");
    setFicha(null);
    setCargandoFicha(false);
    setError(null);
  }

  function seleccionarMateria(evento) {
    const idMateria = evento.target.value;
    const consulta = ++consultaVigente.current;

    setMateriaSeleccionadaId(idMateria);
    setFicha(null);
    setError(null);

    if (!idMateria) {
      setCargandoFicha(false);
      return;
    }

    setCargandoFicha(true);
    getFichaMateria(idMateria, anioSeleccionado)
      .then((datos) => consulta === consultaVigente.current && setFicha(datos))
      .catch((e) => consulta === consultaVigente.current && setError(e.message))
      .finally(
        () => consulta === consultaVigente.current && setCargandoFicha(false),
      );
  }

  const totalDivisiones = ficha
    ? ficha.modulos.reduce((total, modulo) => total + modulo.divisiones.length, 0)
    : 0;

  function mensajeVacio() {
    if (cargandoAnios) return "Cargando materias...";
    if (anios.length === 0) return "Todavía no hay materias cargadas.";
    if (!anio) return "Seleccioná un año para ver las materias disponibles.";
    return "Seleccioná una materia para ver sus contenidos.";
  }

  return (
    <section className="consulta-materia">
      <header className="cm-encabezado">
        <div className="cm-titulo">
          <span className="cm-icono" aria-hidden="true">
            <i className="fa-solid fa-book-open" />
          </span>
          <div>
            <p className="cm-sobretitulo">GESTIÓN ACADÉMICA</p>
            <h1>Consultar materia</h1>
            <p>Elegí un año y una materia para consultar su información.</p>
          </div>
        </div>
      </header>

      <div className="cm-selectores">
        <div className="cm-selector">
          <label htmlFor="cm-anio">1. Elegí el año</label>
          <select
            id="cm-anio"
            value={anioSeleccionado}
            onChange={seleccionarAnio}
            disabled={cargandoAnios || anios.length === 0}
          >
            <option value="">Seleccioná un año</option>
            {anios.map((item) => (
              <option key={item.anio} value={item.anio}>
                {item.anio}.º año
              </option>
            ))}
          </select>
        </div>

        {anio && (
          <div className="cm-selector">
            <label htmlFor="cm-materia">2. Elegí la materia</label>
            <select
              id="cm-materia"
              value={materiaSeleccionadaId}
              onChange={seleccionarMateria}
            >
              <option value="">Seleccioná una materia</option>
              {materiasDelAnio.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="cm-vacio" role="alert">
          No se pudo cargar la información: {error}
        </div>
      )}

      {!error && cargandoFicha && (
        <div className="cm-vacio" role="status">
          Cargando materia...
        </div>
      )}

      {!error && !cargandoFicha && ficha && anio && (
        <div className="cm-detalle">
          <article className="cm-contenidos">
            <header className="cm-seccion-cabecera">
              <div>
                <span className="cm-etiqueta">{anio.anio}.º año</span>
                <h2>{ficha.nombre}</h2>
                <p>
                  {anio.anio}.º año · {ficha.contenidos.length} contenidos
                </p>
              </div>
              <span className="cm-resumen-icono" aria-hidden="true">
                <i className="fa-solid fa-book" />
              </span>
            </header>

            <h3 className="cm-subtitulo">Contenidos</h3>
            {ficha.contenidos.length > 0 ? (
              <ul className="cm-lista-contenidos">
                {ficha.contenidos.map((contenido) => (
                  <li key={contenido}>{contenido}</li>
                ))}
              </ul>
            ) : (
              <p>Esta materia todavía no tiene contenidos cargados.</p>
            )}
          </article>

          <section
            className="cm-asignaciones"
            aria-labelledby="cm-asignaciones-titulo"
          >
            <header className="cm-asignaciones-cabecera">
              <div>
                <h2 id="cm-asignaciones-titulo">
                  Docentes por módulo y división
                </h2>
                <p>Docentes a cargo de {ficha.nombre}.</p>
              </div>
              <span className="cm-cantidad-asignaciones">
                {totalDivisiones} divisiones
              </span>
            </header>

            <div className="cm-modulos">
              {ficha.modulos.map((modulo) => (
                <article className="cm-modulo" key={modulo.idModulo}>
                  <h3>{modulo.nombre}</h3>
                  <div className="cm-divisiones">
                    {modulo.divisiones.map((division) => (
                      <article
                        className="cm-division"
                        key={`${modulo.idModulo}-${division.anioCurso}-${division.division}-${division.cicloLectivo}`}
                      >
                        <div className="cm-division-cabecera">
                          <span
                            className="cm-division-icono"
                            aria-hidden="true"
                          >
                            <i className="fa-solid fa-users" />
                          </span>
                          <h4>
                            {division.anioCurso}.º {division.division} ·{" "}
                            {division.cicloLectivo}
                          </h4>
                        </div>
                        <div className="cm-docente">
                          <i
                            className="fa-solid fa-chalkboard-user"
                            aria-hidden="true"
                          />
                          <div>
                            <span>
                              {division.docentes.length > 1
                                ? "Docentes a cargo"
                                : "Docente a cargo"}
                            </span>
                            <strong>
                              {division.docentes.length > 0
                                ? nombreDocentes(division.docentes)
                                : "Sin docente asignado"}
                            </strong>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {!error && !cargandoFicha && !ficha && (
        <div className="cm-vacio">{mensajeVacio()}</div>
      )}
    </section>
  );
}