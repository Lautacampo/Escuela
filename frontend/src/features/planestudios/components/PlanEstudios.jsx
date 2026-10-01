import { useState } from "react";

const PLAN_ACTUAL = [
  {
    anio: 1,
    modulos: ["Módulo I", "Módulo II"],
    materias: [
      "Matemática",
      "Informática",
      "Lengua",
      "Tecnología de la Información y la Comunicación",
      "Geografía",
      "Historia",
      "Biología",
      "Educación para la Salud",
      "Artes Visuales",
      "Lengua Extranjera: Inglés",
      "Formación Ética y Ciudadana",
    ],
  },
  {
    anio: 2,
    modulos: ["Módulo III", "Módulo IV"],
    materias: [
      "Matemática",
      "Informática",
      "Lengua y Literatura",
      "Tecnología de la Información y la Comunicación",
      "Psicología",
      "Derecho",
      "Química",
      "Educación para la Salud",
      "Artes Audiovisuales",
      "Lengua Extranjera: Inglés",
      "Proyecto Sociocomunitario",
    ],
  },
  {
    anio: 3,
    modulos: ["Módulo V", "Módulo VI"],
    materias: [
      "Matemática",
      "Física",
      "Cultura y Comunicación",
      "Proyecto de Investigación",
      "Formación para la Vida y el Trabajo",
      "Educación para la Salud",
      "Teatro",
      "Lengua Extranjera: Inglés",
      "Política y Ciudadanía",
    ],
  },
];

export function PlanEstudios() {
  const [filtroAnio, setFiltroAnio] = useState("");

  const aniosVisibles = PLAN_ACTUAL.filter(
    (curso) => !filtroAnio || curso.anio === Number(filtroAnio),
  );

  return (
    <div className="container mt-5">
      <hr />

      <div className="gestion-plan">
        {/* ENCABEZADO Y BOTONES */}
        <div className="pe-cabecera">
          <div>
            <h1>Plan de Estudios</h1>
            <p>Consultá las materias correspondientes a cada módulo.</p>
          </div>

          <div className="pe-acciones">
            <button type="button" className="pe-boton pe-principal">
              <i className="fa-solid fa-plus" aria-hidden="true" />
              Crear plan nuevo
            </button>

            <button type="button" className="pe-boton pe-peligro">
              <i className="fa-solid fa-trash" aria-hidden="true" />
              Eliminar
            </button>
          </div>
        </div>

        {/* INFORMACIÓN DEL PLAN ACTUAL */}
        <div className="pe-resumen">
          <span className="pe-etiqueta">Plan de estudios actual</span>

          <h2>Bachiller en Ciencias Sociales</h2>

          <p>Decreto N.º 3795-ME-2021</p>

          <div className="pe-indicadores">
            <span>3 años</span>
            <span>6 módulos</span>
            <span>Orientación: Ciencias Sociales</span>
          </div>
        </div>

        {/* FILTRO DE VISUALIZACIÓN */}
        <div className="pe-filtros">
          <label htmlFor="pe-filtro-anio">Filtrar por año</label>

          <select
            id="pe-filtro-anio"
            value={filtroAnio}
            onChange={(evento) => setFiltroAnio(evento.target.value)}
          >
            <option value="">Todos los años</option>

            {PLAN_ACTUAL.map((curso) => (
              <option key={curso.anio} value={curso.anio}>
                {curso.anio}º año
              </option>
            ))}
          </select>
        </div>

        {/* MATERIAS SEPARADAS POR MÓDULO */}
        {aniosVisibles.map((curso) => (
          <div className="pe-anio" key={curso.anio}>
            <h2>{curso.anio}º año</h2>

            <div className="pe-grilla">
              {curso.modulos.map((modulo) => (
                <article className="pe-tarjeta" key={modulo}>
                  <h3>{modulo}</h3>

                  <p className="pe-cantidad">
                    {curso.materias.length} materias
                  </p>

                  <ul>
                    {curso.materias.map((materia) => (
                      <li key={materia}>{materia}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
