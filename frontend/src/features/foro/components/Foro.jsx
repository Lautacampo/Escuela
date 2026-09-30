import { useState } from "react";

const TEMAS = [
  "Inscripciones",
  "Horarios y cursada",
  "Documentación",
  "Otra consulta",
];

const FORMULARIO_INICIAL = {
  nombre: "",
  apellido: "",
  correo: "",
  telefono: "",
  tema: "Inscripciones",
  consulta: "",
};

const GRUPOS = [
  {
    numero: "01",
    titulo: "Tus datos",
    ayuda: "Contanos quién realiza la consulta.",
    campos: [
      {
        nombre: "nombre",
        etiqueta: "Nombre *",
        tipo: "text",
        placeholder: "Tu nombre",
        autocomplete: "given-name",
        obligatorio: true,
      },
      {
        nombre: "apellido",
        etiqueta: "Apellido *",
        tipo: "text",
        placeholder: "Tu apellido",
        autocomplete: "family-name",
        obligatorio: true,
      },
    ],
  },
  {
    numero: "02",
    titulo: "Cómo contactarte",
    ayuda: "Completá al menos uno: correo electrónico o teléfono.",
    campos: [
      {
        nombre: "correo",
        etiqueta: "Correo electrónico",
        tipo: "email",
        placeholder: "nombre@ejemplo.com",
        autocomplete: "email",
      },
      {
        nombre: "telefono",
        etiqueta: "Teléfono",
        tipo: "tel",
        placeholder: "Código de área y número",
        autocomplete: "tel",
      },
    ],
  },
];

export function Foro() {
  const [valores, setValores] = useState(FORMULARIO_INICIAL);
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState("");

  function actualizarCampo(nombre, valor) {
    setValores((anteriores) => ({
      ...anteriores,
      [nombre]: valor,
    }));

    setErrores((anteriores) => ({
      ...anteriores,
      [nombre]: "",
      ...(nombre === "correo" || nombre === "telefono" ? { contacto: "" } : {}),
    }));

    setAviso("");
  }

  function manejarCambio(evento) {
    actualizarCampo(evento.target.name, evento.target.value);
  }

  function enviarConsulta(evento) {
    evento.preventDefault();

    const nuevosErrores = {};
    const correo = valores.correo.trim();
    const telefono = valores.telefono.trim();

    if (!valores.nombre.trim()) {
      nuevosErrores.nombre = "Ingresá tu nombre.";
    }

    if (!valores.apellido.trim()) {
      nuevosErrores.apellido = "Ingresá tu apellido.";
    }

    if (!correo && !telefono) {
      nuevosErrores.contacto =
        "Necesitamos un correo electrónico o teléfono para contactarte.";
    }

    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      nuevosErrores.correo = "Revisá el formato del correo electrónico.";
    }

    if (telefono) {
      const numeros = telefono.replace(/\D/g, "");
      const caracteresValidos = /^\+?[\d\s()-]+$/.test(telefono);

      if (!caracteresValidos || numeros.length < 7 || numeros.length > 15) {
        nuevosErrores.telefono =
          "Ingresá un teléfono válido, incluyendo el código de área.";
      }
    }

    if (!valores.consulta.trim()) {
      nuevosErrores.consulta = "Escribí la consulta que querés realizar.";
    }

    setErrores(nuevosErrores);
    setAviso("");

    const primerError = Object.keys(nuevosErrores)[0];

    if (primerError) {
      const nombreCampo = primerError === "contacto" ? "correo" : primerError;

      evento.currentTarget.elements.namedItem(nombreCampo)?.focus();
      return;
    }

    // Aquí conectaremos el envío con el backend.
    // Conservamos los datos porque todavía no se enviaron.
    setAviso(
      "El envío de consultas aún no está disponible. Tu mensaje no fue enviado.",
    );
  }

  return (
    <section id="foro" className="foro-consultas" aria-labelledby="foro-titulo">
      <div className="foro-presentacion">
        <span className="foro-etiqueta">
          <span aria-hidden="true" />
          ESPACIO DE CONSULTAS
        </span>

        <div className="foro-icono" aria-hidden="true">
          <i className="fa-solid fa-comments" />
        </div>

        <h2 id="foro-titulo">
          Tus preguntas,
          <br />
          <span>un paso más cerca.</span>
        </h2>

        <p className="foro-introduccion">
          ¿Querés saber más sobre el colegio? Elegí un tema y contanos en qué
          podemos orientarte.
        </p>

        <div
          className="foro-temas"
          role="group"
          aria-labelledby="foro-temas-titulo"
        >
          <p id="foro-temas-titulo">¿Sobre qué querés consultar?</p>

          <div className="foro-temas-opciones">
            {TEMAS.map((tema) => (
              <button
                key={tema}
                type="button"
                className="foro-tema"
                aria-pressed={valores.tema === tema}
                onClick={() => actualizarCampo("tema", tema)}
              >
                {tema}
                {valores.tema === tema && <span aria-hidden="true"> ✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="foro-orientacion">
          <i className="fa-regular fa-envelope" aria-hidden="true" />
          <p>
            Dejanos un medio de contacto para que podamos responder tu consulta
            de forma personal.
          </p>
        </div>
      </div>

      <div className="foro-tarjeta">
        <div className="foro-formulario-cabecera">
          <span className="foro-sobretitulo">ESTAMOS PARA ORIENTARTE</span>
          <h3>Nueva consulta</h3>
          <p>Completá el formulario con tus datos y tu pregunta.</p>
        </div>

        <form className="foro-formulario" onSubmit={enviarConsulta} noValidate>
          {GRUPOS.map((grupo) => (
            <fieldset className="foro-grupo" key={grupo.numero}>
              <legend>
                <span className="foro-numero" aria-hidden="true">
                  {grupo.numero}
                </span>
                {grupo.titulo}
              </legend>

              <p className="foro-ayuda" id={`foro-ayuda-${grupo.numero}`}>
                {grupo.ayuda}
              </p>

              <div className="foro-campos">
                {grupo.campos.map((campo) => {
                  const errorContacto =
                    grupo.numero === "02" && errores.contacto;

                  const descripcion = [
                    `foro-ayuda-${grupo.numero}`,
                    errores[campo.nombre] ? `foro-error-${campo.nombre}` : "",
                    errorContacto ? "foro-error-contacto" : "",
                  ]
                    .filter(Boolean)
                    .join(" ");

                  return (
                    <div className="foro-campo" key={campo.nombre}>
                      <label htmlFor={`foro-${campo.nombre}`}>
                        {campo.etiqueta}
                      </label>

                      <input
                        id={`foro-${campo.nombre}`}
                        name={campo.nombre}
                        type={campo.tipo}
                        placeholder={campo.placeholder}
                        autoComplete={campo.autocomplete}
                        required={campo.obligatorio}
                        maxLength={campo.nombre === "telefono" ? 25 : 120}
                        value={valores[campo.nombre]}
                        onChange={manejarCambio}
                        aria-invalid={Boolean(
                          errores[campo.nombre] || errorContacto,
                        )}
                        aria-describedby={descripcion}
                      />

                      {errores[campo.nombre] && (
                        <span
                          id={`foro-error-${campo.nombre}`}
                          className="foro-error"
                        >
                          {errores[campo.nombre]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {grupo.numero === "02" && errores.contacto && (
                <p id="foro-error-contacto" className="foro-error" role="alert">
                  {errores.contacto}
                </p>
              )}
            </fieldset>
          ))}

          <fieldset className="foro-grupo">
            <legend>
              <span className="foro-numero" aria-hidden="true">
                03
              </span>
              Tu consulta
            </legend>

            <p className="foro-ayuda">
              Tema seleccionado: <strong>{valores.tema}</strong>
            </p>

            <div className="foro-campo">
              <label htmlFor="foro-consulta">¿En qué podemos ayudarte? *</label>

              <textarea
                id="foro-consulta"
                name="consulta"
                rows={5}
                maxLength={1000}
                placeholder="Escribí tu pregunta con los detalles que consideres necesarios..."
                value={valores.consulta}
                onChange={manejarCambio}
                required
                aria-invalid={Boolean(errores.consulta)}
                aria-describedby={
                  errores.consulta
                    ? "foro-contador foro-error-consulta"
                    : "foro-contador"
                }
              />

              <div className="foro-textarea-pie">
                <span id="foro-error-consulta" className="foro-error">
                  {errores.consulta}
                </span>

                <span id="foro-contador" className="foro-contador">
                  {valores.consulta.length}/1000
                </span>
              </div>
            </div>
          </fieldset>

          {aviso && (
            <div className="foro-aviso" role="status">
              <i className="fa-solid fa-circle-info" aria-hidden="true" />
              <p>{aviso}</p>
            </div>
          )}

          <button className="foro-enviar" type="submit">
            Enviar consulta
            <i className="fa-regular fa-paper-plane" aria-hidden="true" />
          </button>

          <p className="foro-pie-formulario">
            Los campos con * son obligatorios. Completá también un correo
            electrónico o teléfono.
          </p>
        </form>
      </div>
    </section>
  );
}
