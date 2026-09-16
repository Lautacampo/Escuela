export function ForoPage() {
  return (
    <section id="foro" style={{ marginTop: "40px" }}>
      <h2 style={{ textAlign: "center", color: "white" }}>Foro de Consultas</h2>
      <p style={{ textAlign: "center", color: "var(--color-texto)" }}>
        ¿Tenés dudas sobre las inscripciones o las modalidades de cursada?
        Dejanos tu pregunta y te responderemos a la brevedad.
      </p>

      <div className="contenedor-foro">
        <div className="hacer-pregunta">
          <h3>Nueva Consulta</h3>
          <form action="#" method="get">
            <label htmlFor="nombre-foro">Tu Nombre:</label>
            <input
              type="text"
              id="nombre-foro"
              placeholder="Ej: Juan Pérez"
              required
            />
            <label htmlFor="mensaje-foro">Tu Pregunta:</label>
            <textarea
              id="mensaje-foro"
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
                <i className="fa-solid fa-user"></i> Lucía Fernández
              </strong>
              <span>Hace 1 día</span>
            </div>
            <p>¿Cuáles son los horarios de cursada para el turno noche?</p>
            <div className="respuesta-oficial">
              <strong>
                <i className="fa-solid fa-check-circle"></i> Respuesta del
                Colegio:
              </strong>
              <p>
                Hola Lucía. El horario de cursada es de Lunes a Viernes de 19:30
                a 23:30 hs.
              </p>
            </div>
          </div>

          <div className="pregunta-item">
            <div className="pregunta-header">
              <strong>
                <i class="fa-solid fa-user"></i> Carlos López
              </strong>
              <span>Hace 2 días</span>
            </div>
            <p>¿Tienen talleres extracurriculares?</p>
            <span className="etiqueta-pendiente">Pendiente de respuesta</span>
          </div>
        </div>
      </div>
    </section>
  );
}
