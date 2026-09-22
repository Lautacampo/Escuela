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
      <section className="hero">
        <div className="hero-contenido">
          <h1>Colegio N° 3 Tomás Baras</h1>
          <p>Un faro de oportunidades educativas en San Luis desde 1987.</p>
          <Link to="/preinscripcion" className="btn-principal">
            Inscribite para el ciclo 2027
          </Link>
        </div>
      </section>

      {/* 2. QUIÉNES SOMOS */}
      <section id="quienessomos" className="seccion-destacada">
        <div className="contenedor-columnas">
          <div className="columna-texto">
            <h2>Quiénes Somos</h2>
            <p>
              Desde 1987, el Colegio para Adultos Nº3 "Tomas Baras" ha sido un
              faro de oportunidades educativas en San Luis, brindando a
              generaciones la posibilidad de completar sus estudios secundarios
              con una sólida orientación en Ciencias Sociales. Nuestra
              institución se enorgullece de su compromiso con la educacion
              inclusiva y de calidad, adaptada a las necesidades y realidades de
              los adultos que buscan un futuro mejor.
            </p>
            <p>
              La eleccion del nombre "Tomas Baras" responde a la voluntad de
              honrar a un prócer de suelo puntano cuya vida fue un testimonio
              indiscutible de patriotismo, entrega y abnegación duran los
              albores de la Revolución de Mayo. Nacido en San Luis, fue Capitán
              de Voluntarios y miembro activo del Cabildo local.
            </p>
          </div>

          <div className="columna-tarjetas">
            <div className="tarjeta-info azul-oscuro">
              <h3>Propuesta Inclusiva</h3>
              <p>
                Adaptamos nuestros procesos de aprendizaje a las realidades y
                tiempos de los adultos, garantizando una educación de calidad y
                accesible para todos.
              </p>
            </div>

            <div className="tarjeta-info blanco">
              <h3>Orientación Social</h3>
              <p>
                Nuestra currícula está fuertemente orientada a las Ciencias
                Sociales, brindando herramientas fundamentales para comprender
                el contexto actual.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. HISTORIA Y MATERIAS */}
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

      {/* 4. EQUIPO DIRECTIVO */}
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
                src="./public/img/directores/directora.jpg"
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
              <img
                src="./public/img/directores/nilda.jpg"
                alt="Foto de Nilda Esther"
              />
            </div>
            <h3>Nilda Esther Bonansea</h3>
            <p className="cargo">Directora</p>
            <p className="periodo">1987 - 1990</p>
          </article>
          <article className="tarjeta-miembro">
            <div className="imagen-miembro">
              <img
                src="./public/img/directores/oscar.jpg"
                alt="Foto de Oscar Sosa"
              />
            </div>
            <h3>Oscar Sosa</h3>
            <p className="cargo">Director</p>
            <p className="periodo">1990 - 2013</p>
          </article>
          <article className="tarjeta-miembro">
            <div className="imagen-miembro">
              <img
                src="./public/img/directores/gloria.jpg"
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
                src="./public/img/directores/secretaria.jpg"
                alt="Foto de María Inés Robledo"
              />
            </div>
            <h3>María Inés Robledo</h3>
            <p className="cargo">1° Secretaria de la Institución</p>
            <p className="periodo">1987 - 2008</p>
          </article>
        </div>
      </section>

      {/* 5. PREGUNTAS FRECUENTES (FAQ ACORDEÓN) */}
      <section
        id="faq"
        style={{ padding: "60px 20px", maxWidth: "900px", margin: "0 auto" }}
      >
        <h2
          style={{ textAlign: "center", color: "white", marginBottom: "10px" }}
        >
          Preguntas Frecuentes (FAQ)
        </h2>
        <p
          style={{
            textAlign: "center",
            color: "var(--color-texto)",
            marginBottom: "40px",
          }}
        >
          Respuestas rápidas a las dudas más comunes de nuestros ingresantes y
          alumnos.
        </p>

        <div className="accordion-faq">
          {faqs.map((faq, index) => {
            const isOpen = faqAbierto === index;
            return (
              <div className={`faq-item ${isOpen ? "activo" : ""}`} key={index}>
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
      </section>

      {/* 6. PREINSCRIPCIÓN */}
      <section id="preinscripcion">
        <h2>Preinscripcion</h2>
        <p>
          ¿Querés terminar tus estudios? ¿Retomar la secundaria? ¿Seguir
          creciendo personal y profesionalmente? Este es tu momento. En nuestro
          colegio acompañamos trayectorias reales, respetamos tus tiempos y te
          ofrecemos un espacio pensado para personas adultas que desean seguir
          aprendiendo Animate a dar el paso. Tu título secundario te espera.
          <br />
          <br />
          <strong>Colegio Tomás Baras – Educación de Adultos</strong>
        </p>
        <Link to="/preinscripcion">
          <img
            src="./public/img/logos/sobre.png"
            alt="Icono de correo electrónico"
          />
        </Link>
        <p id="formulariopreinscripcion">Complete Formulario</p>
        <p>
          Una vez completado el formulario, nos pondremos en contacto contigo
          para informarte sobre el proceso de preinscripción.
        </p>
      </section>
    </>
  );
}
