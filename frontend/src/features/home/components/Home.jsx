import { useState } from "react";
import { Link } from "react-router";

export function Home() {
  const [faqAbierto, setFaqAbierto] = useState(null);

  const toggleFaq = (index) => {
    setFaqAbierto(faqAbierto === index ? null : index);
  };

  const faqs = [
    {
      pregunta: "¿Qué documentación necesito para inscribirme?",
      respuesta:
        "Necesitás presentar fotocopia de DNI, partida de nacimiento y certificado de finalización de estudios primarios.",
      icono: "fa-folder-open",
    },
    {
      pregunta: "¿Me puedo retirar antes de que termine el horario de cursada?",
      respuesta:
        "Sí, en caso de fuerza mayor o motivos laborales podés tramitar un retiro anticipado informando previamente a la preceptoría.",
      icono: "fa-door-open",
    },
    {
      pregunta: "¿Dónde debo informar problemas con mis notas o asistencias?",
      respuesta:
        "Cualquier inconveniente académico debe ser reportado directamente en Secretaría o a través del Foro de Consultas exclusivo para alumnos.",
      icono: "fa-circle-exclamation",
    },
  ];

  return (
    <>
      {/* 1. HERO BANNER */}
      <section className="hero" aria-labelledby="hero-titulo">
        <div className="hero-contenido">
          <img
            className="hero-escudo"
            src="/img/logos/logo-principal.png"
            alt="Escudo del Colegio Nº 3 Tomás Baras"
            width="150"
            height="180"
            decoding="async"
          />

          <p className="hero-etiqueta">Educación para jóvenes y adultos</p>
          <h1 id="hero-titulo">
            Colegio Nº 3 <span>Tomás Baras</span>
          </h1>
          <p className="hero-descripcion">
            Un faro de oportunidades educativas en San Luis desde 1987.
          </p>

          <div className="hero-acciones">
            <Link
              to="/preinscripcion"
              className="hero-boton hero-boton-principal"
            >
              Inscribite para el ciclo 2027
              <span aria-hidden="true">↗</span>
            </Link>
            <a
              href="#quienessomos"
              className="hero-boton hero-boton-secundario"
            >
              Conocé el colegio
              <span aria-hidden="true">↓</span>
            </a>
          </div>

          <ul className="hero-datos" aria-label="Modalidad de cursada">
            <li>A partir de los 18 años</li>
            <li>Turno nocturno</li>
            <li>Ciencias Sociales</li>
          </ul>
        </div>
      </section>

      {/* 2. QUIÉNES SOMOS */}
      <section id="quienessomos" className="seccion-destacada">
        <div className="contenedor-catalogo">
          <article className="fila-catalogo">
            <div className="catalogo-texto">
              <h2 className="titulo-catalogo">Quiénes Somos</h2>
              <p>
                Desde 1987, el Colegio para Adultos Nº3 "Tomas Baras" ha sido un
                faro de oportunidades educativas en San Luis, brindando a
                generaciones la posibilidad de completar sus estudios
                secundarios con una sólida orientación en Ciencias Sociales.
              </p>
              <p>
                La elección del nombre "Tomas Baras" responde a la voluntad de
                honrar a un prócer de suelo puntano. Nacido en San Luis, fue
                Capitán de Voluntarios y miembro activo del Cabildo local.
              </p>
            </div>
            <div className="catalogo-imagen">
              <img
                src="/img/portadas/aula.png"
                alt="Apertura institucional del colegio"
              />
            </div>
          </article>

          <article className="fila-catalogo fila-invertida">
            <div className="catalogo-imagen">
              <img
                src="/img/portadas/desfile.jpg"
                alt="Primeros estudiantes y familias"
              />
            </div>
            <div className="catalogo-texto">
              <h3 className="subtitulo-catalogo">
                <i className="fa-solid fa-users"></i> Propuesta Inclusiva
              </h3>
              <p>
                Adaptamos nuestros procesos de aprendizaje a las realidades y
                tiempos de los adultos, garantizando una educación de calidad y
                accesible para todos. Desde el primer día soñamos con una
                escuela donde cada estudiante pudiera aprender con alegría y
                desarrollar su potencial.
              </p>
            </div>
          </article>

          <article className="fila-catalogo">
            <div className="catalogo-texto">
              <h3 className="subtitulo-catalogo">
                <i className="fa-solid fa-palette"></i> Una propuesta integral
              </h3>
              <p>
                Nuestra currícula está fuertemente orientada a las Ciencias
                Sociales. Incorporamos arte, tecnología y educación emocional
                como parte de una formación integral, activa y humana para
                brindar herramientas fundamentales para comprender el contexto
                actual.
              </p>
            </div>
            <div className="catalogo-imagen">
              <img
                src="/img/portadas/personas-1.jpg"
                alt="Instalaciones del colegio con murales"
              />
            </div>
          </article>
        </div>
      </section>
      {/* 3. PREINSCRIPCIÓN */}
      <section
        id="preinscripcion"
        className="inscripcion-home"
        aria-labelledby="inscripcion-titulo"
      >
        <div className="inscripcion-contenido">
          <p className="inscripcion-estado">
            <span aria-hidden="true"></span>
            Inscripciones abiertas
          </p>
          <h2 id="inscripcion-titulo">
            Tu secundario,
            <br />
            <span>un nuevo comienzo.</span>
          </h2>
          <p className="inscripcion-intro">
            Animate a dar el próximo paso. En el Colegio Tomás Baras te
            acompañamos a terminar tus estudios.
          </p>

          <dl className="inscripcion-datos">
            <div>
              <dt>Modalidad</dt>
              <dd>Secundaria para adultos</dd>
            </div>
            <div>
              <dt>Edad de ingreso</dt>
              <dd>A partir de los 18 años</dd>
            </div>
            <div>
              <dt>Turno nocturno</dt>
              <dd>19:30 a 23:20 h</dd>
            </div>
            <div>
              <dt>Dónde estamos</dt>
              <dd>Pringles y Av. Pte. Perón</dd>
            </div>
          </dl>

          <p className="inscripcion-propuesta">
            Aprendé en grupo, trabajá por proyectos y participá en prácticas
            preprofesionalizantes.
          </p>
          <div className="inscripcion-acciones">
            <Link to="/preinscripcion" className="inscripcion-boton">
              Completar preinscripción
              <span aria-hidden="true">↗</span>
            </Link>
            <a href="#faq" className="inscripcion-consultas">
              ¿Tenés dudas? Consultá las preguntas frecuentes
            </a>
          </div>
        </div>

        <figure className="inscripcion-afiche">
          <a
            className="inscripcion-afiche-enlace"
            href="/img/inscripciones/inscripcion.jpg"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Ver el afiche de inscripciones completo en una nueva pestaña"
          >
            <img
              src="/img/inscripciones/inscripcion.jpg"
              alt="Afiche de inscripciones del Colegio Tomás Baras con estudiantes trabajando en grupo."
              loading="lazy"
              decoding="async"
            />
          </a>
          <figcaption>
            Seleccioná el afiche para verlo en tamaño completo
            <span aria-hidden="true"> ↗</span>
          </figcaption>
        </figure>
      </section>
      {/* 4. HISTORIA Y MATERIAS */}
      <section
        id="historia-evolucion"
        className="historia-home"
        aria-labelledby="historia-titulo"
      >
        <header className="historia-encabezado">
          <p className="historia-etiqueta">Nuestra identidad</p>
          <h2 id="historia-titulo">Una historia que sigue creciendo</h2>
          <p className="historia-introduccion">
            Recordamos nuestras raíces y seguimos acompañando a jóvenes y
            adultos a completar sus estudios secundarios.
          </p>
        </header>

        <div className="historia-presentacion">
          <figure className="historia-fotografia">
            <a
              href="/img/portadas/historia.png"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Ver la fotografía histórica completa en una nueva pestaña"
            >
              <img
                src="/img/portadas/historia.png"
                alt="Fotografía de un grupo de personas frente al cartel del Colegio para Adultos Nº 3 Tomás Baras"
                width="719"
                height="539"
                loading="lazy"
                decoding="async"
              />
            </a>

            <figcaption>
              Parte de nuestra memoria institucional.
              <span aria-hidden="true"> ↗</span>
            </figcaption>
          </figure>

          <div className="historia-relato">
            <span className="historia-fecha">1991 · Memoria institucional</span>

            <h3>Nuestra raíz histórica</h3>

            <p>
              Un documento de planta permanente de 1991 registra a 12 docentes,
              una secretaria y al director Oscar Sosa. En aquel momento, la
              institución se denominaba{" "}
              <strong>
                Centro Educativo de Nivel Secundario Nº 240 (CENS Nº 240)
              </strong>{" "}
              y funcionaba en Pringles 319.
            </p>

            <p>
              Hoy, esa historia forma parte de la identidad del Colegio para
              Adultos Nº 3 Tomás Baras.
            </p>

            <figure className="historia-homenaje">
              <a
                href="/img/portadas/recuadro.png"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Ver la placa conmemorativa completa en una nueva pestaña"
              >
                <img
                  src="/img/portadas/recuadro.png"
                  alt="Placa del Gobierno de San Luis en homenaje al capitán Tomás Baras y a los puntanos que integraron el Regimiento de Granaderos a Caballo"
                  width="621"
                  height="778"
                  loading="lazy"
                  decoding="async"
                />
              </a>

              <figcaption>
                <h4>Un nombre con historia</h4>
                <p>
                  La placa conmemorativa recuerda al capitán Tomás Baras y el
                  aporte del pueblo puntano al Regimiento de Granaderos a
                  Caballo.
                </p>
                <span>Seleccioná la imagen para leerla completa ↗</span>
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="historia-plan">
          <header className="historia-plan-encabezado">
            <div>
              <p className="historia-etiqueta">Nuestra propuesta educativa</p>
              <h3>Plan de estudios actual</h3>
              <p>
                Bachiller en Ciencias Sociales · Materias por año de cursado.
                Actualmente usamos el plan de estudios que dicta el Decreto N°
                3795 -ME-2021.-
              </p>
            </div>

            <span className="historia-duracion">3 años · 6 módulos</span>
          </header>

          <div className="historia-anios">
            {[
              {
                anio: 1,
                titulo: "Primer año",
                modulos: "Módulos I y II",
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
                titulo: "Segundo año",
                modulos: "Módulos III y IV",
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
                titulo: "Tercer año",
                modulos: "Módulos V y VI",
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
            ].map((curso) => (
              <article className="historia-anio" key={curso.anio}>
                <header className="historia-anio-cabecera">
                  <span className="historia-anio-numero" aria-hidden="true">
                    {curso.anio}º
                  </span>

                  <div>
                    <h4>{curso.titulo}</h4>
                    <p>{curso.modulos}</p>
                  </div>
                </header>

                <span className="historia-cantidad">
                  {curso.materias.length} materias
                </span>

                <ul className="historia-materias">
                  {curso.materias.map((materia) => (
                    <li key={materia}>{materia}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      

      {/* 5. EQUIPO DIRECTIVO */}
      <section id="equipo">
        <h2>Conocé a Nuestro Equipo</h2>
        <p>
          A lo largo de los años, grandes profesionales han guiado nuestra
          institución.
        </p>

        <div className="director-principal">
          <article className="tarjeta-miembro destacada">
            <div className="imagen-miembro">
              <img
                src="/img/directores/directora.jpg"
                alt="Foto de Andrea González"
              />
            </div>
            <h3>Andrea González</h3>
            <p className="cargo">Directora</p>
            <p className="periodo">2021 - Actualidad</p>
          </article>
        </div>

        <h3 className="titulo-historicos">Directivos Históricos</h3>

        <div className="grid-equipo">
          <article className="tarjeta-miembro">
            <div className="imagen-miembro">
              <img src="/img/directores/nilda.jpg" alt="Foto de Nilda Esther" />
            </div>
            <h3>Nilda Esther Bonansea</h3>
            <p className="cargo">Directora</p>
            <p className="periodo">1987 - 1990</p>
          </article>
          <article className="tarjeta-miembro">
            <div className="imagen-miembro">
              <img src="/img/directores/oscar.jpg" alt="Foto de Oscar Sosa" />
            </div>
            <h3>Oscar Sosa</h3>
            <p className="cargo">Director</p>
            <p className="periodo">1990 - 2013</p>
          </article>
          <article className="tarjeta-miembro">
            <div className="imagen-miembro">
              <img
                src="/img/directores/gloria.jpg"
                alt="Foto de Gloria Contreras"
              />
            </div>
            <h3>Gloria Contreras</h3>
            <p className="cargo">Directora</p>
            <p className="periodo">2013 - 2021</p>
          </article>
          <article className="tarjeta-miembro">
            <div className="imagen-miembro">
              <img
                src="/img/directores/secretaria.jpg"
                alt="Foto de María Inés Robledo"
              />
            </div>
            <h3>María Inés Robledo</h3>
            <p className="cargo">1° Secretaria de la Institución</p>
            <p className="periodo">1987 - 2008</p>
          </article>
        </div>
      </section>

      {/* 6. PREGUNTAS FRECUENTES */}
      <section id="faq" className="seccion-faq">
        <div className="contenedor-faq-centrado">
          <h2>Preguntas Frecuentes</h2>
          <p className="subtitulo-faq">
            Respuestas rápidas a las dudas más comunes de nuestros ingresantes y
            alumnos.
          </p>

          <div className="accordion-faq">
            {faqs.map((faq, index) => {
              const isOpen = faqAbierto === index;
              return (
                <div
                  className={`faq-item ${isOpen ? "activo" : ""}`}
                  key={index}
                >
                  <button
                    className="faq-pregunta"
                    onClick={() => toggleFaq(index)}
                  >
                    <span>
                      <i className={`fa-solid ${faq.icono}`}></i> {faq.pregunta}
                    </span>
                    <i
                      className={`fa-solid fa-chevron-down faq-icono ${isOpen ? "rotado" : ""}`}
                    ></i>
                  </button>
                  <div
                    className="faq-respuesta"
                    style={{ maxHeight: isOpen ? "300px" : "0" }}
                  >
                    <p>{faq.respuesta}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
