import { Link } from "react-router";

export function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="hero-contenido">
          <h1>Colegio N° 3 Tomás Baras</h1>
          <p>Un faro de oportunidades educativas en San Luis desde 1987.</p>
          <Link to="/preinscripcion" className="btn-principal">
            Inscribite para el ciclo 2027
          </Link>
        </div>
      </section>

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

      <section id="identidad-institucional">
        <div className="grid-mision-vision">
          <article className="tarjeta-identidad">
            <h3>
              <i className="fa-solid fa-rocket"></i> Nuestra Misión
            </h3>
            <p>
              Brindar una educación secundaria inclusiva, flexible y de calidad
              a estudiantes adultos, acompañando sus trayectorias con sentido
              ético, pedagógico y humano; promoviendo la permanencia, el egreso
              y el desarrollo de capacidades que les permitan ejercer sus
              derechos, integrarse al mundo del trabajo y participar activamente
              en la sociedad.
            </p>
          </article>

          <article className="tarjeta-identidad">
            <h3>
              <i className="fa-solid fa-eye"></i> Nuestra Visión
            </h3>
            <p>
              Consolidar una institución comprometida con el derecho a la
              educación a lo largo de la vida, que se distinga por sostener
              trayectorias diversas, transformar positivamente experiencias
              escolares previas y generar oportunidades concretas de crecimiento
              personal, social y laboral para sus estudiantes. Una escuela que,
              mediante una gestión participativa y un trabajo en equipo
              solidario y colaborativo, deje huellas significativas en la vida
              de quienes la transitan.
            </p>
          </article>
        </div>

        <div className="contenedor-objetivos-inst">
          <div className="objetivo-general-caja">
            <h3>
              <i className="fa-solid fa-bullseye"></i> Objetivo General
            </h3>
            <p>
              Fortalecer las condiciones institucionales, pedagógicas y
              vinculares del Colegio para Adultos N.º 3 “Tomás Baras”, a fin de
              garantizar la permanencia, el aprendizaje significativo y la
              terminalidad educativa de sus estudiantes, mediante estrategias
              integrales, inclusivas y sostenidas que acompañen sus trayectorias
              escolares.
            </p>
          </div>

          <div className="objetivos-especificos-caja">
            <h3>Objetivos Específicos</h3>
            <ul className="grilla-check">
              <li>
                Acompañar las trayectorias escolares mediante tutorías, talleres
                de apoyo y dispositivos personalizados que respondan a la
                diversidad de situaciones de los y las estudiantes adultos/as.
              </li>
              <li>
                Favorecer el trabajo docente articulado, promoviendo la
                planificación conjunta por división y el fortalecimiento de
                equipos pedagógicos comprometidos con el desarrollo colectivo.
              </li>
              <li>
                Consolidar prácticas evaluativas colegiadas y formativas, a
                través de criterios comunes, rúbricas consensuadas y estrategias
                que garanticen la equidad y el reconocimiento de los
                aprendizajes logrados.
              </li>
              <li>
                Promover una convivencia escolar respetuosa y participativa, a
                través de espacios de mediación, formación en resolución de
                conflictos y fortalecimiento del rol estudiantil en la vida
                institucional.
              </li>
              <li>
                Optimizar la gestión y el uso de recursos disponibles,
                impulsando su aprovechamiento pedagógico y gestionando nuevas
                herramientas tecnológicas, edilicias y didácticas ante los
                organismos correspondientes.
              </li>
              <li>
                Afianzar vínculos con instituciones y programas externos,
                articulando acciones conjuntas con otras escuelas, organismos
                del Estado y propuestas ministeriales que potencien el
                desarrollo formativo y el compromiso comunitario.
              </li>
            </ul>
          </div>
        </div>
      </section>

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
              y funcionaba en nuestra actual dirección de Pringles 319. Su
              orientación original era <em>“Perito en Técnicas Policiales”</em>,
              de nivel medio, con modalidad semi-presencial y a distancia con
              una duración de 3 años.
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

        <div className="bloque-condiciones">
          <div className="condiciones-caja">
            <h3>
              <i className="fa-solid fa-list-check"></i> Condiciones de Ingreso
            </h3>
            <p>
              Tener el primario completo e integrar la Planta Permanente de la
              Policía de la Provincia de San Luis.
            </p>
          </div>
          <div className="objetivos-caja">
            <h3>
              <i className="fa-solid fa-bullseye"></i> Objetivos del Plan
            </h3>
            <ul className="lista-check">
              <li>
                Ofrecer formación general orientada a la Seguridad Pública.
              </li>
              <li>
                Posibilitar el acceso a Estudios Superiores y/o Universitarios.
              </li>
              <li>
                Mejorar la capacitación profesional del Personal Policial.
              </li>
              <li>
                Ofrecer al futuro oficial una nueva oportunidad de estudio.
              </li>
              <li>Promover el compromiso con la Institución Policial.</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="equipo">
        <h2>Conocé a Nuestro Equipo</h2>
        <p>
          A lo largo de los años, grandes profesionales han guiado nuestra
          institución.
        </p>

        <div className="director-principal">
          <article className="tarjeta-miembro destacada">
            <div className="imagen-miembro">
              <img src="/directora.jpg" alt="Foto de Andrea González" />
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
              <img src="/nilda.jpg" alt="Foto de Nilda Esther" />
            </div>
            <h3>Nilda Esther Bonansea</h3>
            <p className="cargo">Directora</p>
            <p className="periodo">1987 - 1990</p>
          </article>
          <article className="tarjeta-miembro">
            <div className="imagen-miembro">
              <img src="/oscar.jpg" alt="Foto de Oscar Sosa" />
            </div>
            <h3>Oscar Sosa</h3>
            <p className="cargo">Director</p>
            <p className="periodo">1990 - 2013</p>
          </article>
          <article className="tarjeta-miembro">
            <div className="imagen-miembro">
              <img src="/gloria.jpg" alt="Foto de Gloria Contreras" />
            </div>
            <h3>Gloria Contreras</h3>
            <p className="cargo">Directora</p>
            <p className="periodo">2013 - 2021</p>
          </article>
          <article className="tarjeta-miembro">
            <div className="imagen-miembro">
              <img src="/secretaria.jpg" alt="Foto de María Inés Robledo" />
            </div>
            <h3>María Inés Robledo</h3>
            <p className="cargo">1° Secretaria de la Institución</p>
            <p className="periodo">1987 - 2008</p>
          </article>
        </div>
      </section>

      <section id="foro">
        <h2>Foro de Consultas</h2>
        <p>
          ¿Tenés dudas sobre las inscripciones o las modalidades de cursada?
          Dejanos tu pregunta.
        </p>
        <div className="contenedor-foro">
          <div className="hacer-pregunta">
            <h3>Nueva Consulta</h3>
            {/* Convertido para React: noValidate y estructura base, a futuro usaremos un onSubmit */}
            <form action="#" method="get">
              <label htmlFor="nombre-foro">Tu Nombre:</label>
              <input
                type="text"
                id="nombre-foro"
                name="nombre-foro"
                placeholder="Ej: Juan Pérez"
                required
              />
              <label htmlFor="mensaje-foro">Tu Pregunta:</label>
              <textarea
                id="mensaje-foro"
                name="mensaje-foro"
                placeholder="Escribí tu consulta acá..."
                rows="4"
                required
              ></textarea>
              <button
                type="submit"
                className="btn-principal"
                style={{ width: "100%", borderRadius: "8px" }}
              >
                Publicar Pregunta
              </button>
            </form>
          </div>
          <div className="muro-preguntas">
            <h3>Consultas Recientes</h3>
            <div className="pregunta-item">
              <div className="pregunta-header">
                <strong>
                  <i className="fa-solid fa-user"></i> Martín Gómez
                </strong>
                <span>Hace 2 horas</span>
              </div>
              <p>
                ¿Qué documentación necesito llevar para inscribirme a primer
                año?
              </p>
              <div className="respuesta-oficial">
                <strong>
                  <i className="fa-solid fa-check-circle"></i> Respuesta del
                  Colegio:
                </strong>
                <p>
                  Hola Martín. Necesitás fotocopia de DNI, partida de nacimiento
                  y certificado de finalización de estudios primarios.
                </p>
              </div>
            </div>
            <div className="pregunta-item">
              <div className="pregunta-header">
                <strong>
                  <i className="fa-solid fa-user"></i> Lucía Fernández
                </strong>
                <span>Hace 1 día</span>
              </div>
              <p>¿Cuáles son los horarios de cursada para el turno noche?</p>
              <span className="etiqueta-pendiente">Pendiente de respuesta</span>
            </div>
          </div>
        </div>
      </section>

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
          <img src="/sobre.png" alt="Icono de correo electrónico" />
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
