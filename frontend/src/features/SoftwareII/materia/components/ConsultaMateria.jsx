import { useState } from "react";
import { ANIOS } from "../data/materiasData";
import "./consultaMateria.css";

const DOCENTES_DE_MUESTRA = [
  "Carolina Méndez",
  "Martín Aguirre",
  "Lucía Fernández",
  "Diego Romero",
  "Valentina Castro",
  "Nicolás Herrera",
  "Camila Torres",
  "Santiago Ruiz",
];

export function ConsultaMateria() {
  const [anioSeleccionadoId, setAnioSeleccionadoId] = useState("");
  const [materiaSeleccionadaId, setMateriaSeleccionadaId] = useState("");
  const anio = ANIOS.find((item) => item.id === anioSeleccionadoId);
  const materiasDelAnio = anio?.materias ?? [];
  const materia = materiasDelAnio.find(
    (item) => item.id === materiaSeleccionadaId,
  );

  function seleccionarAnio(evento) {
    setAnioSeleccionadoId(evento.target.value);
    setMateriaSeleccionadaId("");
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
            value={anioSeleccionadoId}
            onChange={seleccionarAnio}
          >
            <option value="">Seleccioná un año</option>
            {ANIOS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nombre}
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
              onChange={(evento) =>
                setMateriaSeleccionadaId(evento.target.value)
              }
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

      {materia && anio ? (
        <div className="cm-detalle">
          <article className="cm-contenidos">
            <header className="cm-seccion-cabecera">
              <div>
                <span className="cm-etiqueta">{anio.nombre}</span>
                <h2>{materia.nombre}</h2>
                <p>
                  {anio.nombre} · {materia.contenidos.length} contenidos
                </p>
              </div>
              <span className="cm-resumen-icono" aria-hidden="true">
                <i className="fa-solid fa-book" />
              </span>
            </header>

            <h3 className="cm-subtitulo">Contenidos</h3>
            <ul className="cm-lista-contenidos">
              {materia.contenidos.map((contenido) => (
                <li key={contenido}>{contenido}</li>
              ))}
            </ul>
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
                <p>
                  Docentes de muestra para {materia.nombre}.
                </p>
              </div>
              <span className="cm-cantidad-asignaciones">
                {anio.divisiones.length * anio.modulos.length} divisiones
              </span>
            </header>

            <div className="cm-modulos">
              {anio.modulos.map((modulo, moduloIndex) => (
                <article className="cm-modulo" key={modulo.id}>
                  <h3>{modulo.nombre}</h3>
                  <div className="cm-divisiones">
                    {anio.divisiones.map((division, divisionIndex) => {
                      const nombreDivision = `${anio.nombre.replace(
                        " año",
                        "",
                      )} ${division}`;
                      const docenteIndex =
                        moduloIndex * anio.divisiones.length +
                        divisionIndex +
                        materiasDelAnio.indexOf(materia);
                      const docente =
                        DOCENTES_DE_MUESTRA[
                          docenteIndex % DOCENTES_DE_MUESTRA.length
                        ];

                      return (
                        <article
                          className="cm-division"
                          key={`${modulo.id}-${division}`}
                        >
                          <div className="cm-division-cabecera">
                            <span
                              className="cm-division-icono"
                              aria-hidden="true"
                            >
                              <i className="fa-solid fa-users" />
                            </span>
                            <h4>{nombreDivision}</h4>
                          </div>
                          <div className="cm-docente">
                            <i
                              className="fa-solid fa-chalkboard-user"
                              aria-hidden="true"
                            />
                            <div>
                              <span>Docente a cargo</span>
                              <strong>{docente}</strong>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="cm-vacio">
          {anio
            ? "Seleccioná una materia para ver sus contenidos."
            : "Seleccioná un año para ver las materias disponibles."}
        </div>
      )}
    </section>
  );
}
