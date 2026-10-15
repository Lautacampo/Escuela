import { useEffect, useState } from "react";
import { esEmailValido, esDniValido } from "../../../shared/utils/validaciones";
import { capitalizarNombre } from "../../../shared/utils/formato";
import { ListadoAlumnos } from "./ListadoAlumnos";
import {
  getAlumnos,
  getCursos,
  setAlumno,
  matricularAlumno,
  borrarAlumno,
} from "../../SoftwareII/AlumnoService-is";
import { getAsistencias } from "../services/AlumnosServices";
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
  moduloId: "",
};

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return "";

  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();

  let edad = hoy.getFullYear() - nacimiento.getFullYear();

  const noCumplio =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() &&
      hoy.getDate() < nacimiento.getDate());

  if (noCumplio) {
    edad--;
  }

  return edad;
}

export function Alumnos() {
  const [alumnos, setAlumnos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [alumnoEditando, setAlumnoEditando] = useState(null);
  const [valores, setValores] = useState(ALUMNO_INICIAL);
  const [errores, setErrores] = useState({});
  const [asistencias, setAsistencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [errorGuardar, setErrorGuardar] = useState("");
  const [errorEliminar, setErrorEliminar] = useState("");

  useEffect(() => {
    async function cargar() {
      try {
        const [datosAlumnos, datosAsistencias, datosCursos] =
          await Promise.all([getAlumnos(), getAsistencias(), getCursos()]);
        setAlumnos(
          datosAlumnos.map((alumno) => {
            const trayectoria = Array.isArray(alumno.trayectoria)
              ? alumno.trayectoria
              : [];
            const cursadaActual =
              trayectoria.find(
                (cursada) =>
                  alumno.cursadaModuloId != null &&
                  String(cursada.idCursada ?? cursada.cursadaModuloId) ===
                    String(alumno.cursadaModuloId)
              ) ?? trayectoria[trayectoria.length - 1];
            const anioCurso =
              alumno.curso ?? alumno.anioCurso ?? cursadaActual?.anioCurso;
            const division = alumno.division ?? cursadaActual?.division;
            const curso = datosCursos.find(
              (opcion) =>
                String(opcion.anioCurso) === String(anioCurso) &&
                opcion.division === division
            );
            const nombreModulo =
              alumno.moduloActual ?? alumno.modulo ?? cursadaActual?.modulo;
            const modulo = curso?.modulos?.find(
              (opcion) =>
                String(opcion.numeroLeyenda).trim().toLowerCase() ===
                String(nombreModulo ?? "").trim().toLowerCase()
            );

            return {
              ...alumno,
              curso: anioCurso,
              division,
              cursoId: alumno.cursoId ?? curso?.id,
              moduloId: alumno.moduloId ?? modulo?.id,
              moduloActual: nombreModulo,
              faltas:
                alumno.faltas ??
                alumno.faltasAcumuladas ??
                cursadaActual?.faltas ??
                cursadaActual?.cantidadFaltasAcumuladas,
              condicion: (alumno.condicion ?? cursadaActual?.condicion)
                ? `${(alumno.condicion ?? cursadaActual.condicion)[0]}${(
                    alumno.condicion ?? cursadaActual.condicion
                  )
                    .slice(1)
                    .toLowerCase()}`
                : alumno.condicion,
            };
          })
        );
        setAsistencias(datosAsistencias);
        setCursos(datosCursos);
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const manejarCambio = (e) => {
    const { name, value, type, checked } = e.target;

    setValores((anteriores) => ({
      ...anteriores,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "curso" ? { division: "", moduloId: "" } : {}),
      ...(name === "division" ? { moduloId: "" } : {}),
    }));
  };

  const aniosCurso = [
    ...new Set(cursos.map((curso) => String(curso.anioCurso))),
  ].sort((a, b) => Number(a) - Number(b));
  const divisiones = [
    ...new Set(
      cursos
        .filter((curso) => String(curso.anioCurso) === String(valores.curso))
        .map((curso) => curso.division)
    ),
  ].sort();
  const cursoSeleccionado = cursos.find(
    (curso) =>
      String(curso.anioCurso) === String(valores.curso) &&
      curso.division === valores.division
  );
  const modulos = cursoSeleccionado?.modulos ?? [];
  const moduloSeleccionado = modulos.find(
    (modulo) => String(modulo.id) === String(valores.moduloId)
  );

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
      curso: String(alumno.curso ?? ""),
      moduloId: String(alumno.moduloId ?? ""),
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

  async function eliminarAlumno(id) {
    const alumno = alumnos.find((a) => a.id === id);

    if (!alumno) return;

    const confirmar = window.confirm(
      `¿Está seguro de eliminar al alumno ${alumno.apellido}, ${alumno.nombre}?`
    );

    if (!confirmar) return;

    try {
      setErrorEliminar("");
      await borrarAlumno(id);
      setAlumnos((anteriores) =>
        anteriores.filter((alumno) => alumno.id !== id)
      );
    } catch (e) {
      setErrorEliminar(e.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const nuevosErrores = {};

    if (!esDniValido(valores.dni)) {
      nuevosErrores.dni =
        "El DNI debe contener un número válido entre 1.000.000 y 99.999.999.";
    }

    if (!esEmailValido(valores.email)) {
      nuevosErrores.email =
        "El formato del correo electrónico ingresado no es válido.";
    }

    if (!valores.fechaNacimiento) {
      nuevosErrores.fechaNacimiento = "Debe ingresar la fecha de nacimiento.";
    }

    if (!valores.curso) {
      nuevosErrores.curso = "Debe seleccionar un curso.";
    } else if (!cursoSeleccionado) {
      nuevosErrores.curso = "El curso seleccionado ya no está disponible.";
    }

    if (!valores.division) {
      nuevosErrores.division = "Debe seleccionar una división.";
    }

    if (!valores.moduloId) {
      nuevosErrores.moduloId = "Debe seleccionar un módulo.";
    } else if (!moduloSeleccionado) {
      nuevosErrores.moduloId = "El módulo seleccionado no corresponde al curso.";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    const alumnoPreparado = {
      ...valores,
      curso: cursoSeleccionado?.anioCurso,
      cursoId: cursoSeleccionado?.id,
      division: cursoSeleccionado?.division,
      moduloId: Number(valores.moduloId),
      moduloActual: moduloSeleccionado?.numeroLeyenda ?? "",
      nombre: capitalizarNombre(valores.nombre.trim().replace(/\s+/g, " ")),
      apellido: capitalizarNombre(
        valores.apellido.trim().replace(/\s+/g, " ")
      ),
      dni: String(valores.dni).trim(),
      cantidadHijos: Number(valores.cantidadHijos) || 0,
      edad: calcularEdad(valores.fechaNacimiento),
      faltas: alumnoEditando?.faltas ?? 0,
      condicion: alumnoEditando?.condicion ?? "Regular",
    };

    try {
      setErrorGuardar("");

      const datosAlumno = {
        nombre: alumnoPreparado.nombre,
        apellido: alumnoPreparado.apellido,
        dni: alumnoPreparado.dni,
        fechaNacimiento: alumnoPreparado.fechaNacimiento,
        cuil: alumnoPreparado.cuil,
        lugarNacimiento: alumnoPreparado.lugarNacimiento,
        domicilio: alumnoPreparado.domicilio,
        telefono: alumnoPreparado.telefono,
        email: alumnoPreparado.email,
        trabaja: alumnoPreparado.trabaja,
        telefonoEmergencia: alumnoPreparado.telefonoEmergencia,
        cantidadHijos: alumnoPreparado.cantidadHijos,
      };
      const guardado = await setAlumno(
        alumnoEditando
          ? {
              ...datosAlumno,
              id: alumnoEditando.id,
            }
          : datosAlumno
      );
      if (!alumnoEditando) {
        await matricularAlumno(
          guardado.id,
          alumnoPreparado.cursoId,
          alumnoPreparado.moduloId
        );
      }

      const alumnoConCursada = {
        ...guardado,
        curso: alumnoPreparado.curso,
        division: alumnoPreparado.division,
        moduloId: alumnoPreparado.moduloId,
        moduloActual: alumnoPreparado.moduloActual,
        faltas: guardado.faltas ?? 0,
        condicion: guardado.condicion ?? "Regular",
      };

      setAlumnos((anteriores) =>
        alumnoEditando
          ? anteriores.map((alumno) =>
              alumno.id === alumnoEditando.id ? alumnoConCursada : alumno
            )
          : [...anteriores, alumnoConCursada]
      );

      alert(
        alumnoEditando
          ? "Datos del alumno actualizados correctamente."
          : `¡Alumno ${alumnoPreparado.nombre} ${alumnoPreparado.apellido} registrado con éxito!`
      );

      cerrarFormulario();
    } catch (e) {
      setErrorGuardar(e.message);
    }
  }

  if (cargando) {
    return <p>Cargando alumnos...</p>;
  }

  if (error) {
    return <p role="alert">{error}</p>;
  }

  return (
    <>
      <div className="encabezado-gestion">
        <div>
          <h1>Gestión de Alumnos</h1>
          <p>
            Administración de los alumnos registrados en la institución.
          </p>
        </div>

        <button
          type="button"
          className="btn-primario-gestion"
          onClick={abrirFormulario}
        >
          <i className="fa-solid fa-user-plus"></i>
          Registrar alumno
        </button>
      </div>

      {errorEliminar && (
        <p className="mensaje-error" role="alert">
          {errorEliminar}
        </p>
      )}

      <ListadoAlumnos
        alumnos={alumnos}
        asistencias={asistencias}
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
                      <span className="mensaje-error">{errores.dni}</span>
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
                          ? `${calcularEdad(valores.fechaNacimiento)} años`
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
                      <span className="mensaje-error">{errores.email}</span>
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
                    <label htmlFor="cantidadHijos">Cantidad de hijos</label>
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
                      {aniosCurso.map((anio) => (
                        <option key={anio} value={anio}>
                          {anio}° Año
                        </option>
                      ))}
                    </select>

                    {errores.curso && (
                      <span className="mensaje-error">{errores.curso}</span>
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
                      disabled={!valores.curso}
                    >
                      <option value="">Seleccione una división</option>
                      {divisiones.map((division) => (
                        <option key={division} value={division}>
                          {division}
                        </option>
                      ))}
                    </select>

                    {errores.division && (
                      <span className="mensaje-error">{errores.division}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="moduloId">Módulo actual *</label>
                    <select
                      id="moduloId"
                      name="moduloId"
                      value={valores.moduloId}
                      onChange={manejarCambio}
                      className={`input-gestion ${
                        errores.moduloId ? "input-error" : ""
                      }`}
                      required
                      disabled={!cursoSeleccionado}
                    >
                      <option value="">Seleccione un módulo</option>
                      {modulos.map((modulo) => (
                        <option key={modulo.id} value={modulo.id}>
                          {modulo.numeroLeyenda}
                        </option>
                      ))}
                    </select>
                    {errores.moduloId && (
                      <span className="mensaje-error">
                        {errores.moduloId}
                      </span>
                    )}
                  </div>
                </div>
              </fieldset>

              {errorGuardar && (
                <p className="mensaje-error" role="alert">
                  {errorGuardar}
                </p>
              )}

              <div className="acciones-formulario">
                <button
                  type="button"
                  onClick={cerrarFormulario}
                  className="btn-secundario"
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-primario-gestion">
                  <i
                    className={`fa-solid ${
                      alumnoEditando ? "fa-floppy-disk" : "fa-user-plus"
                    }`}
                  ></i>

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