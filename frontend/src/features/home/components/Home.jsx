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
      <section id="historia-evolucion" className="seccion-moderna">
        <div className="bloque-historia">
          <h2>Nuestra Raíz Histórica</h2>
          <div className="texto-destacado">
            <p>
              En un documento de planta permanente de 1991, se observan a 12
              docentes, una secretaria y el Director Oscar Sosa. En ese momento,
              el colegio se denominaba
              <strong>
                “Centro Educativo de nivel secundario N° 240” (CENS N° 240)
              </strong>
              y funcionaba en nuestra actual dirección de Pringles 319.
            </p>
          </div>
        </div>

        <div className="bloque-materias">
          <h2>Plan de Estudios Actual</h2>
          <div className="grilla-anios">
            <article className="tarjeta-anio">
              <h3>Primer Año</h3>
              <span className="badge">8 Materias</span>
              <ul>
                <li>Historia</li>
                <li>Lengua</li>
                <li>Educación Cívica</li>
                <li>Inglés</li>
                <li>Biologia</li>
                <li>Criminalística</li>
                <li>Identificación Humana</li>
                <li>Matemáticas</li>
              </ul>
            </article>

            <article className="tarjeta-anio">
              <h3>Segundo Año</h3>
              <span className="badge">10 Materias</span>
              <ul>
                <li>Matemáticas</li>
                <li>Fisica</li>
                <li>Filosofía</li>
                <li>Psicología</li>
                <li>Historia</li>
                <li>Lengua</li>
                <li>Inglés</li>
                <li>Biologia</li>
                <li>Criminalística</li>
                <li>Identificación Humana</li>
                <li>Química</li>
              </ul>
            </article>

            <article className="tarjeta-anio">
              <h3>Tercer Año</h3>
              <span className="badge">11 Materias</span>
              <ul>
                <li>Toxicomanía</li>
                <li>Sociologia</li>
                <li>Matemáticas</li>
                <li>Fisica</li>
                <li>Economía</li>
                <li>Derecho</li>
                <li>Historia</li>
                <li>Literatura</li>
                <li>Inglés</li>
                <li>Química</li>
                <li>Tránsito Público</li>
              </ul>
            </article>
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
