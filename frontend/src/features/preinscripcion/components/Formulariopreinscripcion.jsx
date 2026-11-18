import { useNavigate } from "react-router";
import "./formularioPreinscripcion.css";
import { useState } from "react";

// La preinscripción en línea todavía no está conectada al sistema: por ahora
// se completa por correo. (El envío automático se implementará más adelante.)
const CORREO_PREINSCRIPCION = "soporte3tomasbaras@gmail.com";

const ETIQUETAS = {
  nombre: "Apellido y nombre",
  dni: "DNI",
  cuil: "CUIL",
  fecha_nac: "Fecha de nacimiento",
  edad: "Edad",
  nacionalidad: "Nacionalidad",
  lugar_nac: "Lugar de nacimiento",
  domicilio: "Domicilio",
  telefono: "Teléfono",
  mail: "Correo electrónico",
  trabaja: "Trabaja",
  lugar_trabajo: "Lugar de trabajo",
  hijos: "Hijos",
  salud: "Salud",
  medicacion: "Medicación",
  emergencia_nombre: "Contacto de emergencia",
  emergencia_tel: "Teléfono de emergencia",
};

// Enlace que abre el correo del usuario con los datos ya escritos.
function enlaceDeCorreo(datos) {
  const cuerpo = Object.entries(ETIQUETAS)
    .map(([campo, etiqueta]) => `${etiqueta}: ${datos[campo] || "-"}`)
    .join("\n");
  return `mailto:${CORREO_PREINSCRIPCION}?subject=${encodeURIComponent(
    `Preinscripción - ${datos.nombre}`,
  )}&body=${encodeURIComponent(cuerpo)}`;
}

export function FormularioPreinscripcion() {
  const navegador = useNavigate();
  const [datos, setDatos] = useState({
    nombre: "",
    dni: "",
    cuil: "",
    fecha_nac: "",
    edad: "",
    nacionalidad: "",
    lugar_nac: "",
    domicilio: "",
    telefono: "",
    mail: "",
    trabaja: "no",
    lugar_trabajo: "",
    hijos: "",
    salud: "",
    medicacion: "",
    emergencia_nombre: "",
    emergencia_tel: "",
  });

  const handleChange = (e) => {
    setDatos({
      ...datos,
      [e.target.name]: e.target.value,
    });
  };

  // Al enviar no se guarda nada todavía: se avisa y se ofrece mandarlo por correo.
  const [mostrarAviso, setMostrarAviso] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMostrarAviso(true);
  };

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>
          <i className="fa-solid fa-user"></i>
          Datos Personales
        </legend>

        <label htmlFor="nombre">
          Apellido y Nombre del Alumno (Completos según documento):
        </label>
        <input
          type="text"
          name="nombre"
          id="nombre"
          value={datos.nombre}
          onChange={handleChange}
          required
        />

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="dni"> Documento (LE/LC/DNI N°): </label>
            <input
              type="text"
              name="dni"
              id="dni"
              value={datos.dni}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="cuil"> CUIL: </label>
            <input
              type="text"
              name="cuil"
              id="cuil"
              value={datos.cuil}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="fecha_nac"> Fecha de Nacimiento: </label>
            <input
              type="date"
              name="fecha_nac"
              id="fecha_nac"
              value={datos.fecha_nac}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="edad"> Edad (Años): </label>
            <input
              type="number"
              name="edad"
              id="edad"
              min="18"
              max="99"
              value={datos.edad}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="nacionalidad"> Nacionalidad: </label>
            <input
              type="text"
              name="nacionalidad"
              id="nacionalidad"
              value={datos.nacionalidad}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="lugar_nac">
              Lugar de Nacimiento (Ciudad/Provincia):
            </label>
            <input
              type="text"
              name="lugar_nac"
              id="lugar_nac"
              value={datos.lugar_nac}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>
          <i className="fa-solid fa-address-book"></i>
          Datos de Contacto
        </legend>

        <label htmlFor="domicilio"> Domicilio: </label>
        <input
          type="text"
          name="domicilio"
          id="domicilio"
          value={datos.domicilio}
          onChange={handleChange}
          required
        />

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="telefono"> Teléfono: </label>
            <input
              type="tel"
              name="telefono"
              id="telefono"
              value={datos.telefono}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="mail"> Mail: </label>
            <input
              type="email"
              name="mail"
              id="mail"
              value={datos.mail}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>
          <i className="fa-solid fa-briefcase"></i>
          Información Laboral y Familiar
        </legend>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="trabaja"> ¿Trabaja? </label>
            <select name="trabaja" id="trabaja">
              <option value="no">NO</option>
              <option value="si">SÍ</option>
            </select>
          </div>

          <div className="form-group" style={{ flex: 2 }}>
            <label htmlFor="lugar_trabajo"> Lugar de Trabajo: </label>
            <input
              type="text"
              name="lugar_trabajo"
              id="lugar_trabajo"
              value={datos.lugar_trabajo}
              onChange={handleChange}
            />
          </div>
        </div>

        <label htmlFor="hijos">
          En caso de ser Madre/Padre, cantidad de hijos:
        </label>
        <input
          type="number"
          name="hijos"
          id="hijos"
          min="0"
          value={datos.hijos}
          onChange={handleChange}
        />
      </fieldset>

      <fieldset>
        <legend>
          <i className="fa-solid fa-heart-pulse"></i>
          Salud y Emergencias
        </legend>

        <label htmlFor="salud">
          Salud: ¿Padece alguna enfermedad, de qué tipo?
        </label>
        <input
          type="text"
          name="salud"
          id="salud"
          placeholder="Especificar o dejar en blanco"
          value={datos.salud}
          onChange={handleChange}
        />

        <label htmlFor="medicacion">
          ¿Toma alguna medicación? SÍ/NO (Especificar cuál):
        </label>
        <input
          type="text"
          name="medicacion"
          id="medicacion"
          placeholder="Especificar o dejar en blanco"
          value={datos.medicacion}
          onChange={handleChange}
        />

        <div className="form-row">
          <div className="form-group" style={{ flex: 2 }}>
            <label htmlFor="emergencia_nombre">
              En caso de emergencia llamar a (Nombre):
            </label>
            <input
              type="text"
              name="emergencia_nombre"
              id="emergencia_nombre"
              value={datos.emergencia_nombre}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="emergencia_tel"> T.E. N° (Teléfono): </label>
            <input
              type="tel"
              name="emergencia_tel"
              id="emergencia_tel"
              value={datos.emergencia_tel}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </fieldset>

      <p className="nota-preinscripcion">
        Por ahora la preinscripción se completa por correo electrónico a{" "}
        <a href={`mailto:${CORREO_PREINSCRIPCION}`}>{CORREO_PREINSCRIPCION}</a>.
      </p>

      <button
        type="submit"
        className="btn-principal"
        style={{ width: "100%", marginTop: "15px", borderRadius: "8px" }}
      >
        Enviar Preinscripción
      </button>

      {mostrarAviso && (
        <div className="aviso-preinscripcion" role="status">
          <p>
            <strong>
              La preinscripción en línea todavía no está habilitada: tus datos
              no se enviaron.
            </strong>
          </p>
          <p>
            Para completarla, mandalos por correo a{" "}
            <a href={`mailto:${CORREO_PREINSCRIPCION}`}>{CORREO_PREINSCRIPCION}</a>{" "}
            o acercate a la escuela. El botón de abajo abre tu correo con los
            datos ya escritos.
          </p>
          <div className="aviso-preinscripcion-acciones">
            <a className="btn-principal" href={enlaceDeCorreo(datos)}>
              Enviar por correo
            </a>
            <button
              type="button"
              className="btn-secundario-preinscripcion"
              onClick={() => navegador("/")}
            >
              Volver al inicio
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
