import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { esEmailValido, esDniValido } from "../../../shared/utils/validaciones";
import { capitalizarNombre } from "../../../shared/utils/formato";
import { ListadoAlumnos } from "./ListadoAlumnos";
import {
  getAlumnos,
  getAlumno,
  getCursos,
  setAlumno,
  matricularAlumno,
  actualizarMatricula,
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

const MATRICULA_INICIAL = {
  curso: "",
  division: "",
  moduloId: "",
};

function valoresDesdeAlumno(alumno) {
  return {
    ...ALUMNO_INICIAL,
    ...alumno,
    curso: String(alumno?.curso ?? ""),
    division: alumno?.division ?? "",
    moduloId: alumno?.moduloId == null ? "" : String(alumno.moduloId),
  };
}

function matriculaDesdeAlumno(alumno) {
  return {
    curso: String(alumno?.curso ?? ""),
    division: alumno?.division ?? "",
    moduloId: alumno?.moduloId == null ? "" : String(alumno.moduloId),
  };
}

function tieneCursadaActiva(alumno) {
  if (Array.isArray(alumno?.trayectoria)) {
    return alumno.trayectoria.some((cursada) => cursada.activa);
  }
  return alumno?.cursadaModuloId != null;
}

// Al crear una nueva matrícula no se precarga el módulo: el alumno ya terminó
// el módulo actual y debe elegir el siguiente.
function matriculaInicial(alumno) {
  const inicial = matriculaDesdeAlumno(alumno);
  return tieneCursadaActiva(alumno) ? inicial : { ...inicial, moduloId: "" };
}

function aniosDe(cursos) {
  return [...new Set(cursos.map((curso) => String(curso.anioCurso)))].sort(
    (a, b) => Number(a) - Number(b)
  );
}

function divisionesDe(cursos, anio) {
  return [
    ...new Set(
      cursos
        .filter((curso) => String(curso.anioCurso) === String(anio))
        .map((curso) => curso.division)
    ),
  ].sort();
}

function cursoDe(cursos, anio, division) {
  return cursos.find(
    (curso) =>
      String(curso.anioCurso) === String(anio) &&
      curso.division === division
  );
}

function modulosDe(curso) {
  return curso?.modulos ?? [];
}

// Normaliza la respuesta del backend para el listado de alumnos.
function prepararAlumnoLista(alumno, cursos) {
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
  const anioCurso = alumno.curso ?? alumno.anioCurso ?? cursadaActual?.anioCurso;
  const division = alumno.division ?? cursadaActual?.division;
  const curso = cursoDe(cursos, anioCurso, division);
  const nombreModulo =
    alumno.moduloActual ?? alumno.modulo ?? cursadaActual?.modulo;
  const modulo = modulosDe(curso).find(
    (opcion) =>
      String(opcion.numeroLeyenda).trim().toLowerCase() ===
      String(nombreModulo ?? "").trim().toLowerCase()
  );
  const condicion = alumno.condicion ?? cursadaActual?.condicion;

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
    condicion: condicion
      ? `${condicion[0]}${condicion.slice(1).toLowerCase()}`
      : condicion,
  };
}

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
  const location = useLocation();
  const navigate = useNavigate();
  const alumnoDesdeFicha = location.state?.editarAlumno ?? null;

  const [alumnos, setAlumnos] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(
    Boolean(alumnoDesdeFicha)
  );
  const [alumnoEditando, setAlumnoEditando] = useState(alumnoDesdeFicha);
  const [valores, setValores] = useState(() =>
    valoresDesdeAlumno(alumnoDesdeFicha)
  );
  const [matricula, setMatricula] = useState(() =>
    matriculaInicial(alumnoDesdeFicha)
  );
  const [editorMatricula, setEditorMatricula] = useState(false);
  const [guardandoMatricula, setGuardandoMatricula] = useState(false);
  const [errorMatricula, setErrorMatricula] = useState("");
  const [mensajeMatricula, setMensajeMatricula] = useState("");
  const [aviso, setAviso] = useState("");
  const [errores, setErrores] = useState({});
  const [asistencias, setAsistencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [errorGuardar, setErrorGuardar] = useState("");
  const [errorEliminar, setErrorEliminar] = useState("");

  // Si se llega desde la ficha del alumno, se abre su edición y se limpia
  // el state de navegación para que no se reabra al recargar.
  useEffect(() => {
    if (location.state?.editarAlumno) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate]);

  useEffect(() => {
    async function cargar() {
      try {
        const [datosAlumnos, datosAsistencias, datosCursos] =
          await Promise.all([getAlumnos(), getAsistencias(), getCursos()]);
        setAlumnos(
          datosAlumnos.map((alumno) => prepararAlumnoLista(alumno, datosCursos))
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

  const manejarCambioMatricula = (e) => {
    const { name, value } = e.target;

    setMatricula((anteriores) => ({
      ...anteriores,
      [name]: value,
      ...(name === "curso" ? { division: "", moduloId: "" } : {}),
      ...(name === "division" ? { moduloId: "" } : {}),
    }));
    setErrorMatricula("");
    setMensajeMatricula("");
  };

  const aniosCurso = aniosDe(cursos);
  const divisiones = divisionesDe(cursos, valores.curso);
  const cursoSeleccionado = cursoDe(
    cursos,
    valores.curso,
    valores.division
  );
  const modulos = modulosDe(cursoSeleccionado);
  const moduloSeleccionado = modulos.find(
    (modulo) => String(modulo.id) === String(valores.moduloId)
  );

  const divisionesMatricula = divisionesDe(cursos, matricula.curso);
  const cursoMatricula = cursoDe(
    cursos,
    matricula.curso,
    matricula.division
  );
  const modulosMatricula = modulosDe(cursoMatricula);

  const abrirFormulario = () => {
    setAlumnoEditando(null);
    setValores(ALUMNO_INICIAL);
    setMatricula(MATRICULA_INICIAL);
    setEditorMatricula(false);
    setErrorMatricula("");
    setMensajeMatricula("");
    setAviso("");
    setErrorGuardar("");
    setErrores({});
    setMostrarFormulario(true);
  };

  const abrirEdicion = (alumno) => {
    setAlumnoEditando(alumno);
    setValores(valoresDesdeAlumno(alumno));
    setMatricula(matriculaInicial(alumno));
    setEditorMatricula(false);
    setErrorMatricula("");
    setMensajeMatricula("");
    setAviso("");
    setErrorGuardar("");
    setErrores({});
    setMostrarFormulario(true);
  };

  const cerrarFormulario = () => {
    setMostrarFormulario(false);
    setAlumnoEditando(null);
    setValores(ALUMNO_INICIAL);
    setMatricula(MATRICULA_INICIAL);
    setEditorMatricula(false);
    setErrorMatricula("");
    setMensajeMatricula("");
    setErrorGuardar("");
    setErrores({});
  };

  const abrirEditorMatricula = () => {
    setMatricula(matriculaInicial(alumnoEditando));
    setErrorMatricula("");
    setMensajeMatricula("");
    setEditorMatricula(true);
  };

  const cancelarEditorMatricula = () => {
    setEditorMatricula(false);
    setErrorMatricula("");
    setMensajeMatricula("");
  };

  async function guardarMatricula() {
    const moduloMatricula = modulosMatricula.find(
      (modulo) => String(modulo.id) === String(matricula.moduloId)
    );

    let mensaje = "";
    if (!matricula.curso) {
      mensaje = "Seleccioná un curso.";
    } else if (!cursoMatricula) {
      mensaje = "El curso seleccionado ya no está disponible.";
    } else if (!matricula.division) {
      mensaje = "Seleccioná una división.";
    } else if (!matricula.moduloId) {
      mensaje = "Seleccioná un módulo.";
    } else if (!moduloMatricula) {
      mensaje = "El módulo seleccionado no corresponde al curso.";
    }

    if (mensaje) {
      setErrorMatricula(mensaje);
      return;
    }

    try {
      setGuardandoMatricula(true);
      setErrorMatricula("");
      setMensajeMatricula("");

      const actualizado = await actualizarMatricula(
        alumnoEditando.id,
        cursoMatricula.id,
        Number(matricula.moduloId)
      );

      setAlumnoEditando((anterior) => ({
        ...anterior,
        cursadaModuloId: actualizado.cursadaModuloId,
        cursoId: actualizado.cursoId,
        curso: actualizado.curso,
        division: actualizado.division,
        moduloId: actualizado.moduloId,
        moduloActual: actualizado.moduloActual,
        faltas: actualizado.faltas,
        condicion: actualizado.condicion,
        trayectoria: actualizado.trayectoria,
      }));
      setValores((anterior) => ({
        ...anterior,
        curso: String(actualizado.curso ?? ""),
        division: actualizado.division ?? "",
        moduloId:
          actualizado.moduloId == null ? "" : String(actualizado.moduloId),
      }));
      setMatricula(matriculaDesdeAlumno(actualizado));
      setAlumnos((anteriores) =>
        anteriores.map((alumno) =>
          alumno.id === actualizado.id
            ? prepararAlumnoLista(actualizado, cursos)
            : alumno
        )
      );
      setEditorMatricula(false);
      setMensajeMatricula("Matrícula actualizada correctamente.");
    } catch (e) {
      setErrorMatricula(e.message);
    } finally {
      setGuardandoMatricula(false);
    }
  }

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
    setErrorGuardar("");

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

    // Al editar, los datos académicos se cambian sólo desde el editor de
    // matrícula (PUT /alumnos/:id/cursadas); este formulario guarda únicamente
    // los datos personales.
    if (!alumnoEditando) {
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
        nuevosErrores.moduloId =
          "El módulo seleccionado no corresponde al curso.";
      }
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    const datosAlumno = {
      nombre: capitalizarNombre(valores.nombre.trim().replace(/\s+/g, " ")),
      apellido: capitalizarNombre(
        valores.apellido.trim().replace(/\s+/g, " ")
      ),
      dni: String(valores.dni).trim(),
      fechaNacimiento: valores.fechaNacimiento,
      cuil: valores.cuil,
      lugarNacimiento: valores.lugarNacimiento,
      domicilio: valores.domicilio,
      telefono: valores.telefono,
      email: valores.email,
      trabaja: valores.trabaja,
      telefonoEmergencia: valores.telefonoEmergencia,
      cantidadHijos: Number(valores.cantidadHijos) || 0,
    };

    try {
      const guardado = await setAlumno(
        alumnoEditando ? { ...datosAlumno, id: alumnoEditando.id } : datosAlumno
      );

      if (alumnoEditando) {
        setAlumnos((anteriores) =>
          anteriores.map((alumno) =>
            alumno.id === guardado.id
              ? prepararAlumnoLista(guardado, cursos)
              : alumno
          )
        );
        alert("Datos del alumno actualizados correctamente.");
        cerrarFormulario();
        return;
      }

      try {
        await matricularAlumno(
          guardado.id,
          cursoSeleccionado.id,
          Number(valores.moduloId)
        );
      } catch (e) {
        // El alumno ya quedó registrado: se informa el problema de matrícula
        // y se ofrece completarla desde "Editar".
        const creado = await getAlumno(guardado.id).catch(() => guardado);
        setAlumnos((anteriores) => [
          ...anteriores,
          prepararAlumnoLista(creado, cursos),
        ]);
        setAviso(
          `El alumno ${guardado.apellido}, ${guardado.nombre} se registró correctamente, pero no se pudo crear la matrícula: ${e.message}. Podés crearla desde "Editar".`
        );
        cerrarFormulario();
        return;
      }

      const creado = await getAlumno(guardado.id).catch(() => guardado);
      setAlumnos((anteriores) => [
        ...anteriores,
        prepararAlumnoLista(creado, cursos),
      ]);

      alert(
        `¡Alumno ${datosAlumno.nombre} ${datosAlumno.apellido} registrado con éxito!`
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

      {aviso && (
        <p className="mensaje-aviso" role="status">
          {aviso}
        </p>
      )}

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
                  {alumnoEditando
                    ? "Actualizá los datos personales del estudiante o su matrícula."
                    : "Complete los datos personales y académicos del estudiante."}
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

              {alumnoEditando ? (
                <fieldset>
                  <legend>Matrícula</legend>

                  <div className="matricula-resumen">
                    <p>
                      {alumnoEditando.moduloActual
                        ? [
                            alumnoEditando.curso
                              ? `${alumnoEditando.curso}° Año`
                              : null,
                            alumnoEditando.division
                              ? `División ${alumnoEditando.division}`
                              : null,
                            alumnoEditando.moduloActual,
                          ]
                            .filter(Boolean)
                            .join(" · ")
                        : "El alumno no tiene una matrícula registrada."}
                    </p>
                    <span
                      className={`matricula-estado ${
                        tieneCursadaActiva(alumnoEditando)
                          ? "activa"
                          : "inactiva"
                      }`}
                    >
                      {tieneCursadaActiva(alumnoEditando)
                        ? "Cursada activa"
                        : "Sin cursada activa"}
                    </span>
                  </div>

                  {mensajeMatricula && (
                    <p className="mensaje-exito" role="status">
                      {mensajeMatricula}
                    </p>
                  )}

                  {!editorMatricula ? (
                    <button
                      type="button"
                      className="btn-secundario"
                      onClick={abrirEditorMatricula}
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                      {tieneCursadaActiva(alumnoEditando)
                        ? "Editar matrícula"
                        : "Crear nueva matrícula"}
                    </button>
                  ) : (
                    <div className="editor-matricula">
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="cursoMatricula">Curso *</label>
                          <select
                            id="cursoMatricula"
                            name="curso"
                            value={matricula.curso}
                            onChange={manejarCambioMatricula}
                            className="input-gestion"
                          >
                            <option value="">Seleccione un curso</option>
                            {aniosCurso.map((anio) => (
                              <option key={anio} value={anio}>
                                {anio}° Año
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="divisionMatricula">División *</label>
                          <select
                            id="divisionMatricula"
                            name="division"
                            value={matricula.division}
                            onChange={manejarCambioMatricula}
                            className="input-gestion"
                            disabled={!matricula.curso}
                          >
                            <option value="">Seleccione una división</option>
                            {divisionesMatricula.map((division) => (
                              <option key={division} value={division}>
                                {division}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor="moduloMatricula">Módulo *</label>
                          <select
                            id="moduloMatricula"
                            name="moduloId"
                            value={matricula.moduloId}
                            onChange={manejarCambioMatricula}
                            className="input-gestion"
                            disabled={!cursoMatricula}
                          >
                            <option value="">Seleccione un módulo</option>
                            {modulosMatricula.map((modulo) => (
                              <option key={modulo.id} value={modulo.id}>
                                {modulo.numeroLeyenda}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {errorMatricula && (
                        <p className="mensaje-error" role="alert">
                          {errorMatricula}
                        </p>
                      )}

                      <div className="acciones-formulario">
                        <button
                          type="button"
                          className="btn-secundario"
                          onClick={cancelarEditorMatricula}
                          disabled={guardandoMatricula}
                        >
                          Cancelar
                        </button>

                        <button
                          type="button"
                          className="btn-primario-gestion"
                          onClick={guardarMatricula}
                          disabled={guardandoMatricula}
                        >
                          <i className="fa-solid fa-floppy-disk"></i>
                          {guardandoMatricula
                            ? "Guardando..."
                            : "Guardar matrícula"}
                        </button>
                      </div>
                    </div>
                  )}
                </fieldset>
              ) : (
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
                        <span className="mensaje-error">
                          {errores.division}
                        </span>
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
              )}

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

                  {alumnoEditando
                    ? "Guardar datos personales"
                    : "Registrar alumno"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}