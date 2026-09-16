import { useState } from "react";

export function PreinscripcionPage() {
  const [formData, setFormData] = useState({
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

  // Función para actualizar el estado cada vez que el usuario escribe
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Función que se ejecuta al darle al botón "Enviar Preinscripción"
  const handleSubmit = (e) => {
    e.preventDefault(); // Evita que la página se recargue
    console.log("Datos recolectados:", formData);
    alert("¡Formulario completado! (Revisá la consola para ver los datos)");
  };

  return (
    <section
      className="contenedor-formulario"
      style={{ marginTop: "120px", marginBottom: "40px" }}
    >
      <div className="caja-formulario">
        <h2
          style={{ textAlign: "center", color: "white", marginBottom: "30px" }}
        >
          Formulario de Preinscripción
        </h2>

        <form onSubmit={handleSubmit}>
          {/* BLOQUE 1: Datos Personales[cite: 15] */}
          <fieldset>
            <legend>
              <i className="fa-solid fa-user"></i> Datos Personales
            </legend>

            <label htmlFor="nombre">
              Apellido y Nombre del Alumno (Completos según documento):
            </label>
            <input
              type="text"
              name="nombre"
              id="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
            />

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dni">Documento (LE/LC/DNI N°):</label>
                <input
                  type="text"
                  name="dni"
                  id="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="cuil">CUIL:</label>
                <input
                  type="text"
                  name="cuil"
                  id="cuil"
                  value={formData.cuil}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="fecha_nac">Fecha de Nacimiento:</label>
                <input
                  type="date"
                  name="fecha_nac"
                  id="fecha_nac"
                  value={formData.fecha_nac}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="edad">Edad (Años):</label>
                <input
                  type="number"
                  name="edad"
                  id="edad"
                  min="18"
                  max="99"
                  value={formData.edad}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nacionalidad">Nacionalidad:</label>
                <input
                  type="text"
                  name="nacionalidad"
                  id="nacionalidad"
                  value={formData.nacionalidad}
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
                  value={formData.lugar_nac}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </fieldset>

          {/* BLOQUE 2: Datos de Contacto[cite: 15] */}
          <fieldset>
            <legend>
              <i className="fa-solid fa-address-book"></i> Datos de Contacto
            </legend>

            <label htmlFor="domicilio">Domicilio:</label>
            <input
              type="text"
              name="domicilio"
              id="domicilio"
              value={formData.domicilio}
              onChange={handleChange}
              required
            />

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telefono">Teléfono:</label>
                <input
                  type="tel"
                  name="telefono"
                  id="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="mail">Mail:</label>
                <input
                  type="email"
                  name="mail"
                  id="mail"
                  value={formData.mail}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </fieldset>

          {/* BLOQUE 3: Laboral y Familiar[cite: 15] */}
          <fieldset>
            <legend>
              <i className="fa-solid fa-briefcase"></i> Información Laboral y
              Familiar
            </legend>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="trabaja">¿Trabaja?</label>
                <select
                  name="trabaja"
                  id="trabaja"
                  value={formData.trabaja}
                  onChange={handleChange}
                >
                  <option value="no">NO</option>
                  <option value="si">SI</option>
                </select>
              </div>
              <div className="form-group" style={{ flex: 2 }}>
                <label htmlFor="lugar_trabajo">Lugar de Trabajo:</label>
                <input
                  type="text"
                  name="lugar_trabajo"
                  id="lugar_trabajo"
                  value={formData.lugar_trabajo}
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
              value={formData.hijos}
              onChange={handleChange}
            />
          </fieldset>

          {/* BLOQUE 4: Salud y Emergencias[cite: 15] */}
          <fieldset>
            <legend>
              <i className="fa-solid fa-heart-pulse"></i> Salud y Emergencias
            </legend>

            <label htmlFor="salud">
              Salud: ¿Padece alguna enfermedad, de qué tipo?
            </label>
            <input
              type="text"
              name="salud"
              id="salud"
              placeholder="Especificar o dejar en blanco"
              value={formData.salud}
              onChange={handleChange}
            />

            <label htmlFor="medicacion">
              ¿Toma alguna medicación? SI/NO (Especificar cuál):
            </label>
            <input
              type="text"
              name="medicacion"
              id="medicacion"
              placeholder="Especificar o dejar en blanco"
              value={formData.medicacion}
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
                  value={formData.emergencia_nombre}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="emergencia_tel">T.E. N° (Teléfono):</label>
                <input
                  type="tel"
                  name="emergencia_tel"
                  id="emergencia_tel"
                  value={formData.emergencia_tel}
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
      </div>
    </section>
  );
}
