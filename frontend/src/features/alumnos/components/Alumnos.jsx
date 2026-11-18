import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import {
  esCuilValido,
  esDniValido,
  esEmailValido,
  esTelefonoValido,
  limitarDigitos,
  normalizarCuil,
  sinCambios,
  soloDigitos,
  esNombreValido,
  MENSAJE_NOMBRE_INVALIDO,
} from "../../../shared/utils/validaciones";
import { capitalizarNombre } from "../../../shared/utils/formato";
import { ListadoAlumnos } from "./ListadoAlumnos";
import { ListadoEgresados } from "./ListadoEgresados";
import { ListadoBajas } from "./ListadoBajas";
import {
  getAlumnos,
  getAlumnosEgresados,
  getAlumno,
  getCursos,
  setAlumno,
  matricularAlumno,
  actualizarMatricula,
  borrarAlumno,
  reactivarAlumno,
} from "../services/AlumnosServices";
import { useAutoActualizar } from "../../../shared/hooks/useAutoActualizar";
import { IngresoEquivalencia } from "./IngresoEquivalencia";
import {
  DESCRIPCION_MOTIVO_LIBRE,
  INGRESO_INICIAL,
  analizarMatricula,
  catalogoDeModulos,
  correlativosFaltantes,
  esLibre,
  etiquetaModulo,
  listar,
  validarIngreso,
} from "../utils/correlatividades";

// Campos de texto obligatorios (NOT NULL en la base) además de DNI, CUIL,
// fecha de nacimiento y correo, que tienen su propia validación.
const CAMPOS_OBLIGATORIOS = {
  nombre: "Debe ingresar el nombre.",
  apellido: "Debe ingresar el apellido.",
  lugarNacimiento: "Debe ingresar el lugar de nacimiento.",
  domicilio: "Debe ingresar el domicilio.",
  telefonoEmergencia: "Debe ingresar un teléfono de emergencia.",
};

const MENSAJE_MATRICULA = {
  NUEVA: (modulo) => `Matrícula registrada en ${modulo}.`,
  RECURSADA: (modulo) =>
    `Matrícula registrada: el alumno recursa ${modulo}. La cursada anterior queda en su trayectoria.`,
  REACTIVADA: (modulo) =>
    `Se retomó la cursada que el alumno tenía abierta en ${modulo}.`,
  CORREGIDA: (modulo) => `Matrícula corregida: ahora cursa ${modulo}.`,
  CAMBIO_DE_CURSO: () => "Curso y división actualizados.",
  SIN_CAMBIOS: () => "La matrícula ya estaba registrada con esos datos.",
};
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

  const [anioNacimiento, mesNacimiento, diaNacimiento] = fechaNacimiento
    .split("-")
    .map(Number);
  const hoy = new Date();

  let edad = hoy.getFullYear() - anioNacimiento;

  const noCumplio =
    hoy.getMonth() + 1 < mesNacimiento ||
    (hoy.getMonth() + 1 === mesNacimiento && hoy.getDate() < diaNacimiento);

  if (noCumplio) {
    edad--;
  }

  return edad;
}

function fechaMaximaMayorDeEdad() {
  const hoy = new Date();
  const anio = hoy.getFullYear() - 18;
  const mes = hoy.getMonth();
  const dia = Math.min(hoy.getDate(), new Date(anio, mes + 1, 0).getDate());

  return `${anio}-${String(mes + 1).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
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
  // Ingreso por equivalencia: uno para el alta y otro para el editor de matrícula.
  const [ingresoAlta, setIngresoAlta] = useState(INGRESO_INICIAL);
  const [ingresoMatricula, setIngresoMatricula] = useState(INGRESO_INICIAL);
  const [aviso, setAviso] = useState("");
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  // Vista de egresados (solo lectura): /gestion/alumnos?vista=egresados
  const [searchParams, setSearchParams] = useSearchParams();
  const vista = searchParams.get("vista");
  const viendoEgresados = vista === "egresados";
  // Alumnos dados de baja (baja lógica): /gestion/alumnos?vista=bajas
  const viendoBajas = vista === "bajas";
  const [bajas, setBajas] = useState(null);
  const [errorBajas, setErrorBajas] = useState("");
  const [reactivando, setReactivando] = useState(null);
  const [egresados, setEgresados] = useState(null);
  const [errorEgresados, setErrorEgresados] = useState("");

  useEffect(() => {
    if (!viendoEgresados) return;
    let activo = true;
    getAlumnosEgresados()
      .then((datos) => {
        if (activo) {
          setEgresados(datos);
          setErrorEgresados("");
        }
      })
      .catch((e) => {
        if (activo) setErrorEgresados(e.message);
      });
    return () => {
      activo = false;
    };
  }, [viendoEgresados]);

  useEffect(() => {
    if (!viendoBajas) return;
    let activo = true;
    getAlumnos(true)
      .then((datos) => {
        if (activo) {
          setBajas(datos.filter((alumno) => !alumno.activo));
          setErrorBajas("");
        }
      })
      .catch((e) => {
        if (activo) setErrorBajas(e.message);
      });
    return () => {
      activo = false;
    };
  }, [viendoBajas]);
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
        const [datosAlumnos, datosCursos] = await Promise.all([
          getAlumnos(),
          getCursos(),
        ]);
        setAlumnos(
          datosAlumnos.map((alumno) => prepararAlumnoLista(alumno, datosCursos))
        );
        setCursos(datosCursos);
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  // El padrón se actualiza solo: si un docente desaprueba o un preceptor carga
  // faltas, la condición del alumno cambia sin recargar la página. Se pausa
  // mientras hay un formulario abierto.
  useAutoActualizar(
    async () => {
      if (viendoEgresados) {
        setEgresados(await getAlumnosEgresados());
      } else if (viendoBajas) {
        const todos = await getAlumnos(true);
        setBajas(todos.filter((alumno) => !alumno.activo));
      } else {
        const datosAlumnos = await getAlumnos();
        setAlumnos(
          datosAlumnos.map((alumno) => prepararAlumnoLista(alumno, cursos))
        );
      }
    },
    { activo: !cargando && !mostrarFormulario && reactivando === null }
  );

  async function reactivar(alumno) {
    try {
      setReactivando(alumno.id);
      setErrorBajas("");
      setAviso("");
      await reactivarAlumno(alumno.id);
      setBajas((anteriores) =>
        (anteriores ?? []).filter((registro) => registro.id !== alumno.id)
      );
      const datosAlumnos = await getAlumnos();
      setAlumnos(
        datosAlumnos.map((registro) => prepararAlumnoLista(registro, cursos))
      );
      setAviso(
        `${alumno.apellido}, ${alumno.nombre} volvió al padrón con su matrícula y su historial.`
      );
    } catch (e) {
      setErrorBajas(e.message);
    } finally {
      setReactivando(null);
    }
  }

  const manejarCambio = (e) => {
    const { name, type, checked } = e.target;
    let { value } = e.target;

    if (name === "dni") value = limitarDigitos(value, 8);
    if (["telefono", "telefonoEmergencia"].includes(name)) {
      value = limitarDigitos(value, 15);
    }
    if (name === "cantidadHijos") value = limitarDigitos(value, 2);

    setValores((anteriores) => ({
      ...anteriores,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "curso" ? { division: "", moduloId: "" } : {}),
      ...(name === "division" ? { moduloId: "" } : {}),
    }));
    if (["curso", "division", "moduloId"].includes(name)) {
      setIngresoAlta(INGRESO_INICIAL);
    }
    if (errores[name]) {
      setErrores((anteriores) => ({ ...anteriores, [name]: undefined }));
    }
  };

  const manejarCambioMatricula = (e) => {
    const { name, value } = e.target;

    setMatricula((anteriores) => ({
      ...anteriores,
      [name]: value,
      ...(name === "curso" ? { division: "", moduloId: "" } : {}),
      ...(name === "division" ? { moduloId: "" } : {}),
    }));
    setIngresoMatricula(INGRESO_INICIAL);
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

  // Correlatividades: qué necesita el alumno para el módulo elegido.
  const catalogo = catalogoDeModulos(cursos);
  const analisisAlta = moduloSeleccionado
    ? analizarMatricula(null, moduloSeleccionado.id, catalogo)
    : null;
  const moduloMatriculaElegido = modulosMatricula.find(
    (modulo) => String(modulo.id) === String(matricula.moduloId)
  );
  const analisisMatricula = moduloMatriculaElegido
    ? analizarMatricula(alumnoEditando, moduloMatriculaElegido.id, catalogo)
    : null;
  const matriculaBloqueada =
    analisisMatricula != null &&
    (analisisMatricula.yaAcreditado ||
      analisisMatricula.bloqueantes.length > 0);

  const reiniciarIngresos = () => {
    setIngresoAlta(INGRESO_INICIAL);
    setIngresoMatricula(INGRESO_INICIAL);
  };

  const abrirFormulario = () => {
    setAlumnoEditando(null);
    setValores(ALUMNO_INICIAL);
    setMatricula(MATRICULA_INICIAL);
    setEditorMatricula(false);
    reiniciarIngresos();
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
    reiniciarIngresos();
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
    reiniciarIngresos();
    setErrorMatricula("");
    setMensajeMatricula("");
    setErrorGuardar("");
    setErrores({});
  };

  const abrirEditorMatricula = () => {
    setMatricula(matriculaInicial(alumnoEditando));
    setIngresoMatricula(INGRESO_INICIAL);
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
    } else if (matriculaBloqueada) {
      mensaje = "El alumno no cumple las correlatividades de ese módulo.";
    } else if (analisisMatricula.porEquivalencia.length > 0) {
      mensaje = validarIngreso(ingresoMatricula);
    }

    if (mensaje) {
      setErrorMatricula(mensaje);
      return;
    }

    const ingreso =
      analisisMatricula.porEquivalencia.length > 0
        ? {
            equivalencias: analisisMatricula.porEquivalencia.map((m) => m.id),
            observacion: ingresoMatricula.observacion.trim(),
          }
        : null;

    try {
      setGuardandoMatricula(true);
      setErrorMatricula("");
      setMensajeMatricula("");

      const actualizado = await actualizarMatricula(
        alumnoEditando.id,
        cursoMatricula.id,
        Number(matricula.moduloId),
        ingreso
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
        estadoAcademico: actualizado.estadoAcademico,
        motivoLibre: actualizado.motivoLibre,
        trayectoria: actualizado.trayectoria,
        equivalencias: actualizado.equivalencias,
        modulosAcreditados: actualizado.modulosAcreditados,
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
      setIngresoMatricula(INGRESO_INICIAL);
      setMensajeMatricula(
        (MENSAJE_MATRICULA[actualizado.matricula] ?? MENSAJE_MATRICULA.NUEVA)(
          actualizado.moduloActual
        )
      );
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
      `¿Dar de baja a ${alumno.apellido}, ${alumno.nombre}?\n\n` +
        "Sale del padrón y de las planillas, pero se conserva su historial. " +
        'Podés reactivarlo desde "Dados de baja".'
    );

    if (!confirmar) return;

    try {
      setErrorEliminar("");
      await borrarAlumno(id);
      setAlumnos((anteriores) =>
        anteriores.filter((alumno) => alumno.id !== id)
      );
      setAviso(
        `${alumno.apellido}, ${alumno.nombre} quedó dado de baja. Podés reactivarlo desde "Dados de baja".`
      );
    } catch (e) {
      setErrorEliminar(e.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrorGuardar("");
    setErrores({});

    const nuevosErrores = {};
    const dni = limitarDigitos(valores.dni, 8);
    // Al editar, las reglas de formato se aplican solo a lo que cambia.
    const original = alumnoEditando;
    const igual = (campo, valor, normalizar) =>
      sinCambios(original, campo, valor, normalizar);
    const mismoDni = igual("dni", dni, soloDigitos);

    for (const [campo, mensaje] of Object.entries(CAMPOS_OBLIGATORIOS)) {
      if (!String(valores[campo] ?? "").trim()) {
        nuevosErrores[campo] = mensaje;
      }
    }

    if (!dni) {
      nuevosErrores.dni = "Debe ingresar el DNI.";
    } else if (!mismoDni && !esDniValido(dni)) {
      nuevosErrores.dni =
        "El DNI debe tener entre 7 y 8 dígitos numéricos.";
    }

    if (!valores.cuil.trim()) {
      nuevosErrores.cuil = "Debe ingresar el CUIL.";
    } else if (
      !(mismoDni && igual("cuil", valores.cuil, soloDigitos)) &&
      !esCuilValido(valores.cuil, dni)
    ) {
      nuevosErrores.cuil =
        "El CUIL debe tener 11 dígitos y corresponder al DNI.";
    }

    if (!valores.email.trim()) {
      nuevosErrores.email = "Debe ingresar el correo electrónico.";
    } else if (
      (!igual("email", valores.email) && !esEmailValido(valores.email)) ||
      valores.email.trim().length > 200
    ) {
      nuevosErrores.email =
        "Ingrese un correo válido de hasta 200 caracteres.";
    }

    if (!valores.fechaNacimiento) {
      nuevosErrores.fechaNacimiento = "Debe ingresar la fecha de nacimiento.";
    } else if (calcularEdad(valores.fechaNacimiento) < 0) {
      nuevosErrores.fechaNacimiento =
        "La fecha de nacimiento no puede ser futura.";
    } else if (
      !igual("fechaNacimiento", valores.fechaNacimiento) &&
      calcularEdad(valores.fechaNacimiento) < 18
    ) {
      nuevosErrores.fechaNacimiento =
        "El alumno debe tener 18 años o más.";
    }
    if (
      (!igual("telefono", valores.telefono) &&
        !esTelefonoValido(valores.telefono)) ||
      (valores.telefono && valores.telefono.length > 20)
    ) {
      nuevosErrores.telefono = "El teléfono debe tener entre 8 y 15 dígitos.";
    }
    if (
      valores.telefonoEmergencia.trim() &&
      ((!igual("telefonoEmergencia", valores.telefonoEmergencia) &&
        !esTelefonoValido(valores.telefonoEmergencia, true)) ||
        valores.telefonoEmergencia.length > 30)
    ) {
      nuevosErrores.telefonoEmergencia =
        "El teléfono de emergencia debe tener entre 8 y 15 dígitos.";
    }
    const cantidadHijos = Number(valores.cantidadHijos || 0);
    if (
      !Number.isInteger(cantidadHijos) ||
      cantidadHijos < 0 ||
      cantidadHijos > 99
    ) {
      nuevosErrores.cantidadHijos =
        "La cantidad de hijos debe ser un entero entre 0 y 99.";
    }

    for (const [campo, maximo] of [
      ["nombre", 100],
      ["apellido", 100],
      ["lugarNacimiento", 100],
      ["domicilio", 200],
    ]) {
      if (String(valores[campo] ?? "").trim().length > maximo) {
        nuevosErrores[campo] = `No puede superar los ${maximo} caracteres.`;
      }
    }
    for (const campo of ["nombre", "apellido"]) {
      if (
        !nuevosErrores[campo] &&
        !igual(campo, valores[campo]) &&
        !esNombreValido(valores[campo])
      ) {
        nuevosErrores[campo] = MENSAJE_NOMBRE_INVALIDO;
      }
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
      } else if (analisisAlta.porEquivalencia.length > 0) {
        // Empieza en un módulo avanzado: debe acreditar los anteriores.
        const errorIngreso = validarIngreso(ingresoAlta);
        if (errorIngreso) nuevosErrores.ingreso = errorIngreso;
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
      dni,
      fechaNacimiento: valores.fechaNacimiento,
      cuil: normalizarCuil(valores.cuil),
      lugarNacimiento: valores.lugarNacimiento.trim(),
      domicilio: valores.domicilio.trim(),
      telefono: valores.telefono,
      email: valores.email,
      trabaja: valores.trabaja,
      telefonoEmergencia: valores.telefonoEmergencia.trim(),
      cantidadHijos,
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
          Number(valores.moduloId),
          analisisAlta.porEquivalencia.length > 0
            ? {
                equivalencias: analisisAlta.porEquivalencia.map((m) => m.id),
                observacion: ingresoAlta.observacion.trim(),
              }
            : null
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
      if (e.campo) {
        setErrores((anteriores) => ({
          ...anteriores,
          [e.campo]: e.message,
        }));
      } else {
        setErrorGuardar(e.message);
      }
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
            {viendoEgresados
              ? "Alumnos que completaron los 6 módulos. Sus legajos son de solo consulta."
              : viendoBajas
                ? "Alumnos dados de baja: no figuran en el padrón ni en las planillas. Se pueden reactivar."
                : "Administración de los alumnos registrados en la institución."}
          </p>
        </div>

        <div className="encabezado-acciones">
          {viendoEgresados || viendoBajas ? (
            <button
              type="button"
              className="btn-secundario"
              onClick={() => setSearchParams({})}
            >
              <i className="fa-solid fa-users" aria-hidden="true"></i>{" "}
              Volver a alumnos
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn-secundario"
                onClick={() => setSearchParams({ vista: "egresados" })}
              >
                <i className="fa-solid fa-graduation-cap" aria-hidden="true"></i>{" "}
                Alumnos egresados
              </button>
              <button
                type="button"
                className="btn-secundario"
                onClick={() => setSearchParams({ vista: "bajas" })}
              >
                <i className="fa-solid fa-user-slash" aria-hidden="true"></i>{" "}
                Dados de baja
              </button>
            </>
          )}

          {!viendoEgresados && !viendoBajas && (
            <button
              type="button"
              className="btn-primario-gestion"
              onClick={abrirFormulario}
            >
              <i className="fa-solid fa-user-plus"></i>
              Registrar alumno
            </button>
          )}
        </div>
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

      {viendoEgresados ? (
        errorEgresados ? (
          <p className="mensaje-error" role="alert">
            {errorEgresados}
          </p>
        ) : egresados === null ? (
          <p>Cargando alumnos egresados...</p>
        ) : (
          <ListadoEgresados egresados={egresados} />
        )
      ) : viendoBajas ? (
        <>
          {errorBajas && (
            <p className="mensaje-error" role="alert">
              {errorBajas}
            </p>
          )}
          {bajas === null ? (
            <p>Cargando alumnos dados de baja...</p>
          ) : (
            <ListadoBajas
              bajas={bajas}
              onReactivar={reactivar}
              reactivando={reactivando}
            />
          )}
        </>
      ) : (
        <ListadoAlumnos
          alumnos={alumnos}
          onEditar={abrirEdicion}
          onEliminar={eliminarAlumno}
        />
      )}

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

            <form
              onSubmit={handleSubmit}
              className="form-gestion"
              noValidate
            >
              <p className="nota-obligatorios">
                Los campos marcados con * son obligatorios.
              </p>

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
                      maxLength={100}
                      className={`input-gestion ${
                        errores.nombre ? "input-error" : ""
                      }`}
                      required
                    />
                    {errores.nombre && (
                      <span className="mensaje-error">{errores.nombre}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="apellido">Apellido *</label>
                    <input
                      type="text"
                      id="apellido"
                      name="apellido"
                      value={valores.apellido}
                      onChange={manejarCambio}
                      maxLength={100}
                      className={`input-gestion ${
                        errores.apellido ? "input-error" : ""
                      }`}
                      required
                    />
                    {errores.apellido && (
                      <span className="mensaje-error">{errores.apellido}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dni">DNI *</label>
                    <input
                      type="text"
                      inputMode="numeric"
                      id="dni"
                      name="dni"
                      value={valores.dni}
                      onChange={manejarCambio}
                      maxLength={8}
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
                      max={fechaMaximaMayorDeEdad()}
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
                    <label htmlFor="cuil">CUIL *</label>
                    <input
                      type="text"
                      id="cuil"
                      name="cuil"
                      value={valores.cuil}
                      onChange={manejarCambio}
                      maxLength={15}
                      inputMode="numeric"
                      className={`input-gestion ${
                        errores.cuil ? "input-error" : ""
                      }`}
                      placeholder="20-12345678-9"
                      required
                    />
                    {errores.cuil && (
                      <span className="mensaje-error">{errores.cuil}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="lugarNacimiento">
                      Lugar de nacimiento *
                    </label>
                    <input
                      type="text"
                      id="lugarNacimiento"
                      name="lugarNacimiento"
                      value={valores.lugarNacimiento}
                      onChange={manejarCambio}
                      maxLength={100}
                      className={`input-gestion ${
                        errores.lugarNacimiento ? "input-error" : ""
                      }`}
                      required
                    />
                    {errores.lugarNacimiento && (
                      <span className="mensaje-error">
                        {errores.lugarNacimiento}
                      </span>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="domicilio">Domicilio *</label>
                  <input
                    type="text"
                    id="domicilio"
                    name="domicilio"
                    value={valores.domicilio}
                    onChange={manejarCambio}
                    maxLength={200}
                    className={`input-gestion ${
                      errores.domicilio ? "input-error" : ""
                    }`}
                    required
                  />
                  {errores.domicilio && (
                    <span className="mensaje-error">{errores.domicilio}</span>
                  )}
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
                      inputMode="numeric"
                      maxLength={15}
                      className={`input-gestion ${
                        errores.telefono ? "input-error" : ""
                      }`}
                    />
                    {errores.telefono && (
                      <span className="mensaje-error">{errores.telefono}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Correo electrónico *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={valores.email}
                      onChange={manejarCambio}
                      maxLength={200}
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
                      Teléfono de emergencia *
                    </label>
                    <input
                      type="tel"
                      id="telefonoEmergencia"
                      name="telefonoEmergencia"
                      value={valores.telefonoEmergencia}
                      onChange={manejarCambio}
                      inputMode="numeric"
                      maxLength={15}
                      className={`input-gestion ${
                        errores.telefonoEmergencia ? "input-error" : ""
                      }`}
                      required
                    />
                    {errores.telefonoEmergencia && (
                      <span className="mensaje-error">
                        {errores.telefonoEmergencia}
                      </span>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="cantidadHijos">Cantidad de hijos</label>
                    <input
                      type="number"
                      min="0"
                      max="99"
                      step="1"
                      id="cantidadHijos"
                      name="cantidadHijos"
                      value={valores.cantidadHijos}
                      onChange={manejarCambio}
                      className={`input-gestion ${
                        errores.cantidadHijos ? "input-error" : ""
                      }`}
                    />
                    {errores.cantidadHijos && (
                      <span className="mensaje-error">
                        {errores.cantidadHijos}
                      </span>
                    )}
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

                  {esLibre(alumnoEditando.condicion) && (
                    <p className="mensaje-aviso" role="status">
                      <strong>Condición: LIBRE.</strong> El alumno{" "}
                      {DESCRIPCION_MOTIVO_LIBRE[alumnoEditando.motivoLibre] ??
                        "perdió la regularidad"}{" "}
                      y debe recursar {alumnoEditando.moduloActual}. Para
                      inscribirlo de nuevo usá &quot;Editar matrícula&quot; y
                      elegí ese mismo módulo.
                    </p>
                  )}

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
                            {modulosMatricula.map((modulo) => {
                              const analisis = analizarMatricula(
                                alumnoEditando,
                                modulo.id,
                                catalogo
                              );
                              return (
                                <option
                                  key={modulo.id}
                                  value={modulo.id}
                                  disabled={analisis.yaAcreditado}
                                >
                                  {etiquetaModulo(modulo, analisis)}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>

                      {analisisMatricula?.bloqueantes.length > 0 && (
                        <p className="mensaje-error" role="alert">
                          <strong>Correlatividad:</strong> para cursar{" "}
                          {moduloMatriculaElegido.numeroLeyenda} el alumno debe
                          aprobar antes{" "}
                          {listar(
                            correlativosFaltantes(analisisMatricula).map(
                              (m) => `${m.nombre} (${m.detalle})`
                            )
                          )}
                          .
                        </p>
                      )}

                      {analisisMatricula &&
                        !matriculaBloqueada &&
                        analisisMatricula.porEquivalencia.length > 0 && (
                          <IngresoEquivalencia
                            idBase="ingreso-matricula"
                            modulo={moduloMatriculaElegido.numeroLeyenda}
                            modulosPrevios={analisisMatricula.porEquivalencia}
                            valor={ingresoMatricula}
                            onCambiar={setIngresoMatricula}
                          />
                        )}

                      {analisisMatricula &&
                        !matriculaBloqueada &&
                        analisisMatricula.recursa && (
                          <p className="mensaje-aviso" role="status">
                            El alumno quedó libre en{" "}
                            {moduloMatriculaElegido.numeroLeyenda}: al guardar
                            se lo inscribe para recursarlo, con asistencias y
                            calificaciones en cero. La cursada anterior queda
                            en su trayectoria.
                          </p>
                        )}

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
                          disabled={guardandoMatricula || matriculaBloqueada}
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
                            {etiquetaModulo(
                              modulo,
                              analizarMatricula(null, modulo.id, catalogo)
                            )}
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

                  {analisisAlta?.porEquivalencia.length > 0 && (
                    <IngresoEquivalencia
                      idBase="ingreso-alta"
                      modulo={moduloSeleccionado.numeroLeyenda}
                      modulosPrevios={analisisAlta.porEquivalencia}
                      valor={ingresoAlta}
                      onCambiar={(valor) => {
                        setIngresoAlta(valor);
                        setErrores((anteriores) => ({
                          ...anteriores,
                          ingreso: undefined,
                        }));
                      }}
                      error={errores.ingreso}
                    />
                  )}
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
