import { useNavigate } from "react-router";
import "./formularioPreinscripcion.css";
import { useState } from "react";

export default function FormularioPreinscripcion() {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("¡Formulario enviado con éxito!");
    navegador("/");
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
              value={datos.emergencia_telr}
              onChange={handleChange}
              required
            />
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        className="btn-principal"
        style={{ width: "100%", marginTop: "15px", borderRadius: "8px" }}
      >
        Enviar Preinscripción
      </button>
    </form>
  );
}
