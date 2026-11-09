import { useEffect, useState } from "react";
import {
  getMateriasPorAnio,
  getMateriaPorId,
} from "../services/MateriaService-is.js";
import "./consultaMateria.css";

function nombreAnio(anio) {
  return `${anio}.º año`;
}

export function ConsultaMateria() {
  const [anios, setAnios] = useState([]);
  const [anioSeleccionadoId, setAnioSeleccionadoId] = useState("");
  const [materiaSeleccionadaId, setMateriaSeleccionadaId] = useState("");

  const [materia, setMateria] = useState(null);

  const [cargandoAnios, setCargandoAnios] = useState(true);
  const [cargandoMateria, setCargandoMateria] = useState(false);

  const [errorAnios, setErrorAnios] = useState("");
  const [errorMateria, setErrorMateria] = useState("");

  // CARGAR AÑOS Y MATERIAS DESDE SPRING BOOT
  // GET /api/materias

  useEffect(() => {
    let activo = true;

    async function cargarAnios() {
      try {
        const resultado = await getMateriasPorAnio();

        if (activo) {
          setAnios(Array.isArray(resultado) ? resultado : []);
          setErrorAnios("");
        }
      } catch (error) {
        if (activo) {
          setErrorAnios(error.message);
        }
      } finally {
        if (activo) {
          setCargandoAnios(false);
        }
      }
    }

    cargarAnios();

    return () => {
      activo = false;
    };
  }, []);

  // OBTENER MATERIAS DEL AÑO SELECCIONADO

  const anio = anios.find((item) => String(item.anio) === anioSeleccionadoId);

  const materiasDelAnio = anio?.materias ?? [];

  // SELECCIONAR AÑO

  function seleccionarAnio(evento) {
    setAnioSeleccionadoId(evento.target.value);
    setMateriaSeleccionadaId("");
    setMateria(null);
    setErrorMateria("");
  }

  // SELECCIONAR MATERIA

  function seleccionarMateria(evento) {
    setMateriaSeleccionadaId(evento.target.value);
    setMateria(null);
    setErrorMateria("");
  }

  // CONSULTAR MATERIA INDIVIDUAL
  // GET /api/materias/{id}?anio=N

  useEffect(() => {
    let activo = true;

    if (!anioSeleccionadoId || !materiaSeleccionadaId) {
      setMateria(null);
      setCargandoMateria(false);
      setErrorMateria("");

      return () => {
        activo = false;
      };
    }

    setCargandoMateria(true);
    setMateria(null);
    setErrorMateria("");

    async function cargarDetalle() {
      try {
        const resultado = await getMateriaPorId(
          materiaSeleccionadaId,
          anioSeleccionadoId,
        );

        if (activo) {
          setMateria(resultado);
        }
      } catch (error) {
        if (activo) {
          setErrorMateria(error.message);
        }
      } finally {
        if (activo) {
          setCargandoMateria(false);
        }
      }
    }

    cargarDetalle();

    return () => {
      activo = false;
    };
  }, [anioSeleccionadoId, materiaSeleccionadaId]);

  // INFORMACIÓN DE LA MATERIA

  const modulos = materia?.modulos ?? [];
  const contenidos = materia?.contenidos ?? [];

  const cantidadDivisiones = modulos.reduce(
    (total, modulo) => total + (modulo.divisiones?.length ?? 0),
    0,
  );

  return (
    <section className="consulta-materia">
      {/* ENCABEZADO */}

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

      {/* SELECTORES */}

      <div className="cm-selectores">
        {/* SELECCIONAR AÑO */}

        <div className="cm-selector">
          <label htmlFor="cm-anio">1. Elegí el año</label>

          <select
            id="cm-anio"
            value={anioSeleccionadoId}
            onChange={seleccionarAnio}
            disabled={cargandoAnios || !!errorAnios}
          >
            <option value="">Seleccioná un año</option>

            {anios.map((item) => (
              <option key={item.anio} value={String(item.anio)}>
                {nombreAnio(item.anio)}
              </option>
            ))}
          </select>
        </div>

        {/* SELECCIONAR MATERIA */}

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
                <option key={item.id} value={String(item.id)}>
                  {item.nombre}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* MENSAJES DE CARGA Y ERRORES */}

      {cargandoAnios && (
        <p className="cm-vacio" role="status">
          Cargando materias...
        </p>
      )}

      {errorAnios && (
        <p className="cm-vacio" role="alert">
          {errorAnios}
        </p>
      )}

      {!cargandoAnios && !errorAnios && anios.length === 0 && (
        <p className="cm-vacio">
          No hay materias registradas para los años disponibles.
        </p>
      )}

      {anio && materiasDelAnio.length === 0 && (
        <p className="cm-vacio">No hay materias registradas para este año.</p>
      )}

      {cargandoMateria && (
        <p className="cm-vacio" role="status">
          Cargando información de la materia...
        </p>
      )}

      {errorMateria && (
        <p className="cm-vacio" role="alert">
          {errorMateria}
        </p>
      )}

      {/* FICHA DE LA MATERIA */}

      {materia && anio ? (
        <div className="cm-detalle">
          {/* CONTENIDOS */}

          <article className="cm-contenidos">
            <header className="cm-seccion-cabecera">
              <div>
                <span className="cm-etiqueta">{nombreAnio(anio.anio)}</span>

                <h2>{materia.nombre}</h2>

                <p>
                  {nombreAnio(anio.anio)}
                  {" · "}
                  {contenidos.length} contenidos
                </p>
              </div>

              <span className="cm-resumen-icono" aria-hidden="true">
                <i className="fa-solid fa-book" />
              </span>
            </header>

            <h3 className="cm-subtitulo">Contenidos</h3>

            {contenidos.length > 0 ? (
              <ul className="cm-lista-contenidos">
                {contenidos.map((contenido, indice) => (
                  <li key={`${indice}-${contenido}`}>{contenido}</li>
                ))}
              </ul>
            ) : (
              <p>Sin contenidos registrados.</p>
            )}
          </article>

          {/* DOCENTES POR MÓDULO Y DIVISIÓN */}

          <section
            className="cm-asignaciones"
            aria-labelledby="cm-asignaciones-titulo"
          >
            <header className="cm-asignaciones-cabecera">
              <div>
                <h2 id="cm-asignaciones-titulo">
                  Docentes por módulo y división
                </h2>

                <p>Asignaciones registradas para {materia.nombre}.</p>
              </div>

              <span className="cm-cantidad-asignaciones">
                {cantidadDivisiones} divisiones
              </span>
            </header>

            {modulos.length > 0 ? (
              <div className="cm-modulos">
                {modulos.map((modulo) => (
                  <article className="cm-modulo" key={modulo.idModulo}>
                    <h3>Módulo {modulo.nombre}</h3>

                    <div className="cm-divisiones">
                      {(modulo.divisiones ?? []).map((division, indice) => (
                        <article
                          className="cm-division"
                          key={
                            `${modulo.idModulo}-` +
                            `${division.anioCurso}-` +
                            `${division.division}-` +
                            `${division.cicloLectivo}-` +
                            `${indice}`
                          }
                        >
                          <div className="cm-division-cabecera">
                            <span
                              className="cm-division-icono"
                              aria-hidden="true"
                            >
                              <i className="fa-solid fa-users" />
                            </span>

                            <h4>
                              {division.anioCurso} {division.division}
                            </h4>
                          </div>

                          <p>Ciclo lectivo: {division.cicloLectivo}</p>

                          <div className="cm-docente">
                            <i
                              className="fa-solid fa-chalkboard-user"
                              aria-hidden="true"
                            />

                            <div>
                              <span>Docente/s a cargo</span>

                              {(division.docentes ?? []).length > 0 ? (
                                (division.docentes ?? []).map((docente) => (
                                  <strong key={docente.id}>
                                    {docente.nombre} {docente.apellido}
                                  </strong>
                                ))
                              ) : (
                                <strong>Sin docente asignado</strong>
                              )}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="cm-vacio">
                No hay módulos asociados a esta materia para el año elegido.
              </p>
            )}
          </section>
        </div>
      ) : (
        !cargandoMateria &&
        !errorMateria &&
        !cargandoAnios &&
        !errorAnios &&
        anios.length > 0 && (
          <div className="cm-vacio">
            {anio
              ? materiasDelAnio.length > 0
                ? "Seleccioná una materia para ver sus contenidos."
                : ""
              : "Seleccioná un año para ver las materias disponibles."}
          </div>
        )
      )}
    </section>
  );
}

