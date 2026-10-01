import React, { useState } from "react";
import { esEmailValido, esDniValido } from "../../../shared/utils/validaciones";
import { capitalizarNombre } from "../../../shared/utils/formato";
import { ListadoAlumnos } from "./ListadoAlumnos";

const ALUMNO_INICIAL = {
  nombre: "",
  apellido: "",
  dni: "",
  fechaNacimiento: "",
  cuil: "",
  lugarNacimiento: "",
  domicilio: "",
  telefono: "",
  email: "",
  trabaja: false,
  telefonoEmergencia: "",
  cantidadHijos: 0,
  curso: "",
  division: "",
  moduloActual: "",
};

const ALUMNOS_INICIALES = [
  {
    id: 1,
    apellido: "Pérez",
    nombre: "Juan",
    dni: "40123456",
    fechaNacimiento: "2000-05-10",
    cuil: "",
    lugarNacimiento: "San Luis",
    domicilio: "",
    telefono: "",
    email: "juan.perez@email.com",
    trabaja: true,
    telefonoEmergencia: "",
    cantidadHijos: 1,
    curso: "1",
    division: "A",
    moduloActual: "Módulo II",
    faltas: 4,
    condicion: "Regular",
  },
  {
    id: 2,
    apellido: "González",
    nombre: "María",
    dni: "38987654",
    fechaNacimiento: "1998-08-22",
    cuil: "",
    lugarNacimiento: "San Luis",
    domicilio: "",
    telefono: "",
    email: "maria.gonzalez@email.com",
    trabaja: false,
    telefonoEmergencia: "",
    cantidadHijos: 0,
    curso: "1",
    division: "A",
    moduloActual: "Módulo II",
    faltas: 12,
    condicion: "Regular",
  },
  {
    id: 3,
    apellido: "López",
    nombre: "Carlos",
    dni: "41567890",
    fechaNacimiento: "2001-03-15",
    cuil: "",
    lugarNacimiento: "Villa Mercedes",
    domicilio: "",
    telefono: "",
    email: "carlos.lopez@email.com",
    trabaja: true,
    telefonoEmergencia: "",
    cantidadHijos: 2,
    curso: "1",
    division: "B",
    moduloActual: "Módulo I",
    faltas: 24,
    condicion: "Regular",
  },
  {
    id: 4,
    apellido: "Rodríguez",
    nombre: "Laura",
    dni: "37543210",
    fechaNacimiento: "1995-11-03",
    cuil: "",
    lugarNacimiento: "San Luis",
    domicilio: "",
    telefono: "",
    email: "laura.rodriguez@email.com",
    trabaja: true,
    telefonoEmergencia: "",
    cantidadHijos: 3,
    curso: "1",
    division: "B",
    moduloActual: "Módulo I",
    faltas: 25,
    condicion: "Libre",
  },
];

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return "";

  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();

  let edad = hoy.getFullYear() - nacimiento.getFullYear();

  const noCumplio = hoy.getMonth() < nacimiento.getMonth() || (hoy.getMonth() === nacimiento.getMonth() && hoy.getDate() < nacimiento.getDate());

  if (noCumplio) {
    edad--;
  }

  return edad;
}

export function Alumnos() {
  const [alumnos, setAlumnos] = useState(ALUMNOS_INICIALES);

  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const [alumnoEditando, setAlumnoEditando] = useState(null);

  const [valores, setValores] = useState(ALUMNO_INICIAL);

  const [errores, setErrores] = useState({});

  const manejarCambio = (e) => {
    const {name, value, type, checked} = e.target;

    setValores((anteriores) => ({
      ...anteriores,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const abrirFormulario = () => {
    setAlumnoEditando(null);
    setValores(ALUMNO_INICIAL);
    setErrores({});
    setMostrarFormulario(true);
  };

  const abrirEdicion = (alumno) => {
    setAlumnoEditando(alumno);
    setValores({
      ...ALUMNO_INICIAL,
      ...alumno,
    });
    setErrores({});
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setAlumnoEditando(null);
    setValores(ALUMNO_INICIAL);
    setErrores({});
  };

  const eliminarAlumno = (id) => {
    const alumno = alumnos.find((a) => a.id === id);

    if (!alumno) return;

    const confirmar = window.confirm(`¿Está seguro de eliminar al alumno ${alumno.apellido}, ${alumno.nombre}?`,);

    if (!confirmar) return
    
    setAlumnos((anteriores) => anteriores.filter((alumno) => alumno.id !== id),);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const nuevosErrores = {};


    if (!esDniValido(valores.dni)) {
      nuevosErrores.dni = "El DNI debe contener un número válido entre 1.000.000 y 99.999.999.";
    }

    if (!esEmailValido(valores.email)) {
      nuevosErrores.email = "El formato del correo electrónico ingresado no es válido.";
    }

    if (!valores.fechaNacimiento) {
      nuevosErrores.fechaNacimiento = "Debe ingresar la fecha de nacimiento.";
    }

    if (!valores.curso) {
      nuevosErrores.curso = "Debe seleccionar un curso.";
    }

    if (!valores.division) {
      nuevosErrores.division = "Debe seleccionar una división.";
    }


    // Si hay errores, frenamos acá y los mostramos
    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    const alumnoPreparado = {
      ...valores,
      nombre: capitalizarNombre(valores.nombre),
      apellido: capitalizarNombre(valores.apellido),
      dni: String(valores.dni),
      cantidadHijos: Number(valores.cantidadHijos) || 0,
      edad: calcularEdad(valores.fechaNacimiento),
      faltas: alumnoEditando?.faltas ?? 0,
      condicion: alumnoEditando?.condicion ?? "Regular",
    };

    if (alumnoEditando) {
      setAlumnos((anteriores) =>
        anteriores.map((alumno) =>
          alumno.id === alumnoEditando.id ?
            {
              ...alumno,
              ...alumnoPreparado,
            }
            : alumno,
        ),
      );
    } else {
      const nuevoAlumno = {
        id: Date.now(),
        ...alumnoPreparado,
        moduloActual: valores.moduloActual || "Módulo 1",
      };

      setAlumnos((anteriores) => [...anteriores, nuevoAlumno]);

      alert(
        `¡Alumno ${alumnoPreparado.nombre} ${alumnoPreparado.apellido} registrado con éxito!`,
      );
    }

    cerrarFormulario();
  };

  return (
    <>
      <div className="encabezado-gestion">
        <div>
          <h1>Gestión de Alumnos</h1>
          <p>
            Administración de los alumnos registrados en la institución.
          </p>
        </div>

        <button type="button" className="btn-primario-gestion" onClick={abrirFormulario}>
          <i className="fa-solid fa-user-plus"></i>
          Registrar alumno
        </button>
      </div>
      

      <ListadoAlumnos
        alumnos={alumnos}
        onEditar={abrirEdicion}
        onEliminar={eliminarAlumno}
      />

      {mostrarFormulario && (
        <div
          className="modal-alumno-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              cerrarFormulario();
            }
          }}
        >
          <div
            className="modal-alumno"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-formulario-alumno"
          >
            <div className="modal-alumno-header">
              <div>
                <h2 id="titulo-formulario-alumno">
                  {alumnoEditando ? "Editar alumno" : "Registrar alumno"}
                </h2>
                <p>
                  Complete los datos personales y académicos del estudiante.
                </p>
              </div>

              <button
                type="button"
                className="btn-cerrar-modal"
                onClick={cerrarFormulario}
                aria-label="Cerrar"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="form-gestion">
              <fieldset>
                <legend>Datos personales</legend>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="nombre"> Nombre *</label>
                    <input
                      type="text"
                      id="nombre"
                      name="nombre"
                      value={valores.nombre}
                      onChange={manejarCambio}
                      className="input-gestion"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="apellido">Apellido *</label>
                    <input
                      type="text"
                      id="apellido"
                      name="apellido"
                      value={valores.apellido}
                      onChange={manejarCambio}
                      className="input-gestion"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dni">DNI *</label>
                    <input
                      type="number"
                      id="dni"
                      name="dni"
                      value={valores.dni}
                      onChange={manejarCambio}
                      className={`input-gestion ${
                        errores.dni ? "input-error" : ""
                      }`}
                      required
                    />

                    {errores.dni && (
                      <span className="mensaje-error">
                        {errores.dni}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="fechaNacimiento">
                      Fecha de nacimiento *
                    </label>

                    <input
                      type="date"
                      id="fechaNacimiento"
                      name="fechaNacimiento"
                      value={valores.fechaNacimiento}
                      onChange={manejarCambio}
                      className={`input-gestion ${
                        errores.fechaNacimiento ? "input-error" : ""
                      }`}
                      required
                    />

                    {errores.fechaNacimiento && (
                      <span className="mensaje-error">
                        {errores.fechaNacimiento}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Edad</label>
                    <input
                      type="text"
                      value={
                        calcularEdad(valores.fechaNacimiento) !== ""
                          ? `${calcularEdad(
                              valores.fechaNacimiento,
                            )} años`
                          : ""
                      }
                      className="input-gestion"
                      disabled
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="cuil">CUIL</label>
                    <input
                      type="text"
                      id="cuil"
                      name="cuil"
                      value={valores.cuil}
                      onChange={manejarCambio}
                      className="input-gestion"
                      placeholder="20-12345678-9"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lugarNacimiento">
                      Lugar de nacimiento
                    </label>
                    <input
                      type="text"
                      id="lugarNacimiento"
                      name="lugarNacimiento"
                      value={valores.lugarNacimiento}
                      onChange={manejarCambio}
                      className="input-gestion"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="domicilio">Domicilio</label>
                  <input
                    type="text"
                    id="domicilio"
                    name="domicilio"
                    value={valores.domicilio}
                    onChange={manejarCambio}
                    className="input-gestion"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="telefono">Teléfono</label>
                    <input
                      type="tel"
                      id="telefono"
                      name="telefono"
                      value={valores.telefono}
                      onChange={manejarCambio}
                      className="input-gestion"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Correo electrónico *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={valores.email}
                      onChange={manejarCambio}
                      className={`input-gestion ${
                        errores.email ? "input-error" : ""
                      }`}
                      required
                    />

                    {errores.email && (
                      <span className="mensaje-error">
                        {errores.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="telefonoEmergencia">
                      Teléfono de emergencia
                    </label>
                    <input
                      type="tel"
                      id="telefonoEmergencia"
                      name="telefonoEmergencia"
                      value={valores.telefonoEmergencia}
                      onChange={manejarCambio}
                      className="input-gestion"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="cantidadHijos">
                      Cantidad de hijos
                    </label>
                    <input
                      type="number"
                      min="0"
                      id="cantidadHijos"
                      name="cantidadHijos"
                      value={valores.cantidadHijos}
                      onChange={manejarCambio}
                      className="input-gestion"
                    />
                  </div>

                  <div className="form-group checkbox-group">
                    <label htmlFor="trabaja">
                      <input
                        type="checkbox"
                        id="trabaja"
                        name="trabaja"
                        checked={valores.trabaja}
                        onChange={manejarCambio}
                      />
                      Actualmente trabaja
                    </label>
                  </div>
                </div>

              </fieldset>

              <fieldset>
                <legend>Datos académicos</legend>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="curso">Curso *</label>
                    <select
                      id="curso"
                      name="curso"
                      value={valores.curso}
                      onChange={manejarCambio}
                      className={`input-gestion ${
                        errores.curso ? "input-error" : ""
                      }`}
                      required
                    >
                      <option value="">Seleccione un curso</option>
                      <option value="1">1° Año</option>
                      <option value="2">2° Año</option>
                      <option value="3">3° Año</option>
                    </select>

                    {errores.curso && (
                      <span className="mensaje-error">
                        {errores.curso}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="division">División *</label>
                    <select
                      id="division"
                      name="division"
                      value={valores.division}
                      onChange={manejarCambio}
                      className={`input-gestion ${
                        errores.division ? "input-error" : ""
                      }`}
                      required
                    >
                      <option value="">Seleccione una división</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                      <option value="E">E</option>
                    </select>

                    {errores.division && (
                      <span className="mensaje-error">
                        {errores.division}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="moduloActual">
                      Módulo actual
                    </label>
                    <select
                      id="moduloActual"
                      name="moduloActual"
                      value={valores.moduloActual}
                      onChange={manejarCambio}
                      className="input-gestion"
                    >
                      <option value="">Seleccione un módulo</option>
                      <option value="Módulo I">Módulo I</option>
                      <option value="Módulo II">Módulo II</option>
                      <option value="Módulo III">Módulo III</option>
                      <option value="Módulo IV">Módulo IV</option>
                      <option value="Módulo V">Módulo V</option>
                      <option value="Módulo VI">Módulo VI</option>
                    </select>
                  </div>
                </div>
              </fieldset>

              <div className="acciones-formulario">
                <button type="button" onClick={cerrarFormulario} className="btn-secundario">
                  Cancelar
                </button>

                <button type="submit" className="btn-primario-gestion">
                  <i className={`fa-solid ${alumnoEditando ? "fa-floppy-disk" : "fa-user-plus"}`}></i>

                  {alumnoEditando ? "Guardar cambios" : "Registrar alumno"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
