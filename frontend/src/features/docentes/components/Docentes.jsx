import { useEffect, useState } from "react";
import { useForm } from "../../../shared/hooks/useForm";
import { esDniValido, esEmailValido } from "../../../shared/utils/validaciones";
import { capitalizarNombre, formatearDNI } from "../../../shared/utils/formato";
import { exportarExcel } from "../../../shared/utils/exportarExcel.js";
import {
  borrarDocente as borrarDocenteApi,
  getDocentes,
  getModulos,
  setDocente,
} from "../services/DocentesServices";

const MATERIAS = [
  "Biología",
  "Criminalística",
  "Derecho",
  "Economía",
  "Educación Cívica",
  "Filosofía",
  "Física",
  "Historia",
  "Identificación Humana",
  "Inglés",
  "Lengua",
  "Literatura",
  "Matemáticas",
  "Psicología",
  "Química",
  "Sociología",
  "Toxicomanía",
  "Tránsito Público",
];

const DOCENTE_INICIAL = {
  nombre: "",
  apellido: "",
  dni: "",
  especialidad: "",
  email: "",
  telefono: "",
  asignaciones: [],
};

const CAMPOS = [
  { nombre: "nombre", etiqueta: "Nombre", tipo: "text", obligatorio: true },
  { nombre: "apellido", etiqueta: "Apellido", tipo: "text", obligatorio: true },
  { nombre: "dni", etiqueta: "DNI", tipo: "text", obligatorio: true },
  {
    nombre: "especialidad",
    etiqueta: "Especialidad / área de formación",
    tipo: "text",
    obligatorio: true,
  },
  {
    nombre: "email",
    etiqueta: "Correo electrónico",
    tipo: "email",
    obligatorio: true,
  },
  { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel" },
];

const FILAS_CAMPOS = [
  [CAMPOS[0], CAMPOS[1]],
  [CAMPOS[2], CAMPOS[3]],
  [CAMPOS[4], CAMPOS[5]],
];

function normalizar(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// El backend identifica curso y división con el id del módulo: cada curso
// tiene dos módulos consecutivos (módulos 1 y 2 => 1° año, 3 y 4 => 2° año...).
function cursoDeModulo(moduloId) {
  const numero = Number(moduloId);

  if (!Number.isInteger(numero) || numero <= 0) return "";

  return String(Math.ceil(numero / 2));
}

export function Docentes() {
  const [docentes, setDocentes] = useState([]);
  const [modulos, setModulos] = useState([]);
  const [valores, setValores] = useState(DOCENTE_INICIAL);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [hayCambios, setHayCambios] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState("");
  const [errorOperacion, setErrorOperacion] = useState("");

  useEffect(() => {
    async function cargarDocentes() {
      try {
        const [datosDocentes, datosModulos] = await Promise.all([
          getDocentes(),
          getModulos(),
        ]);
        setDocentes(datosDocentes);
        setModulos(datosModulos);
      } catch (error) {
        setErrorCarga(error.message);
      } finally {
        setCargando(false);
      }
    }

    cargarDocentes();
  }, []);

  const {
    valores: filtros,
    manejarCambio: cambiarFiltro,
    resetearFormulario: limpiarFiltros,
  } = useForm({
    curso: "",
    division: "",
    materia: "",
    busqueda: "",
  });

  const divisionesPorCurso = modulos.reduce((cursosPorDivision, modulo) => {
    const curso = String(modulo.anioCurso ?? Math.ceil(Number(modulo.id) / 2));

    const divisionesCurso = new Set([
      ...(cursosPorDivision[curso] ?? []),
      ...(modulo.divisiones ?? []),
    ]);

    cursosPorDivision[curso] = [...divisionesCurso].sort();

    return cursosPorDivision;
  }, {});

  const cursos = Object.keys(divisionesPorCurso).sort(
    (a, b) => Number(a) - Number(b),
  );
  const divisiones = [
    ...new Set(Object.values(divisionesPorCurso).flat()),
  ].sort();

  const materiasDisponibles = [
    ...new Set([
      ...MATERIAS,
      ...modulos.flatMap((modulo) => modulo.materias ?? []),
      ...docentes.flatMap((docente) =>
        (docente.asignaciones ?? []).map((asignacion) => asignacion.materia),
      ),
    ]),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "es"));

  const filtrosSelect = [
    {
      nombre: "curso",
      etiqueta: "Curso",
      todos: "Todos los cursos",
      opciones: cursos,
    },
    {
      nombre: "division",
      etiqueta: "División",
      todos: "Todas",
      opciones: divisiones,
    },
    {
      nombre: "materia",
      etiqueta: "Materia",
      todos: "Todas las materias",
      opciones: materiasDisponibles,
    },
  ];

  const docentesFiltrados = docentes.filter((docente) => {
    const texto = normalizar(
      `${docente.apellido} ${docente.nombre} ${docente.dni} ${docente.especialidad}`,
    );

    const coincideBusqueda = normalizar(filtros.busqueda)
      .split(/\s+/)
      .every((palabra) => texto.includes(palabra));

    const hayFiltroAsignacion =
      filtros.curso || filtros.division || filtros.materia;

    // Los tres filtros deben coincidir en una misma asignación.
    const coincideAsignacion =
      !hayFiltroAsignacion ||
      docente.asignaciones.some(
        (asignacion) =>
          (!filtros.curso ||
            cursoDeModulo(asignacion.moduloId) === filtros.curso) &&
          (!filtros.division || asignacion.division === filtros.division) &&
          (!filtros.materia || asignacion.materia === filtros.materia),
      );
    return coincideBusqueda && coincideAsignacion;
  });

  const exportarListado = () => {
    if (!docentesFiltrados.length) return;

    const filas = docentesFiltrados.flatMap((docente) => {
      // Aplicar los mismos filtros que utiliza la pantalla
      const asignaciones = (docente.asignaciones ?? []).filter(
        (asignacion) =>
          (!filtros.curso || String(asignacion.curso) === filtros.curso) &&
          (!filtros.division || asignacion.division === filtros.division) &&
          (!filtros.materia || asignacion.materia === filtros.materia),
      );

      // Generar una fila por asignación
      return (asignaciones.length ? asignaciones : [null]).map(
        (asignacion) => ({
          apellido: docente.apellido ?? "",
          nombre: docente.nombre ?? "",
          dni: String(docente.dni ?? ""),
          cuil: String(docente.cuil ?? ""),
          especialidad: docente.especialidad ?? "",
          antiguedad:
            docente.antiguedad == null ? "" : Number(docente.antiguedad),
          domicilio: docente.domicilio ?? "",
          telefono: String(docente.telefono ?? ""),
          email: docente.email ?? "",

          curso: asignacion?.curso ? `${asignacion.curso}º año` : "",

          division: asignacion?.division ?? "",
          materia: asignacion?.materia ?? "",

          modulo: asignacion
            ? (modulos.find(
                (modulo) => String(modulo.id) === String(asignacion.moduloId),
              )?.nombre ?? `Módulo ${asignacion.moduloId}`)
            : "",

          cicloLectivo: asignacion?.cicloLectivo ?? "",
        }),
      );
    });

    const detalle =
      [
        filtros.curso && `curso_${filtros.curso}`,
        filtros.division && `division_${filtros.division}`,
      ]
        .filter(Boolean)
        .join("_") || "completo";

    exportarExcel({
      nombreArchivo: `docentes_${detalle}`,
      nombreHoja: "Listado de docentes",

      columnas: [
        { titulo: "Apellido", clave: "apellido", ancho: 22 },
        { titulo: "Nombre", clave: "nombre", ancho: 22 },
        { titulo: "DNI", clave: "dni", ancho: 16 },
        { titulo: "CUIL", clave: "cuil", ancho: 20 },
        { titulo: "Especialidad", clave: "especialidad", ancho: 32 },
        { titulo: "Antigüedad (años)", clave: "antiguedad", ancho: 21 },
        { titulo: "Domicilio", clave: "domicilio", ancho: 28 },
        { titulo: "Teléfono", clave: "telefono", ancho: 20 },
        { titulo: "Correo electrónico", clave: "email", ancho: 32 },
        { titulo: "Curso", clave: "curso", ancho: 15 },
        { titulo: "División", clave: "division", ancho: 12 },
        { titulo: "Materia", clave: "materia", ancho: 40 },
        { titulo: "Módulo", clave: "modulo", ancho: 20 },
        { titulo: "Ciclo lectivo", clave: "cicloLectivo", ancho: 17 },
      ],

      filas,
    });
  };

  function abrirFormulario(docente = null) {
    setEditando(docente?.id ?? null);

    setValores(
      docente
        ? {
            ...DOCENTE_INICIAL,
            ...docente,
            asignaciones: (docente.asignaciones ?? []).map(
              ({ moduloId, division, materia }) => ({
                moduloId: moduloId === null ? "" : String(moduloId),
                division: division ?? "",
                materia: materia ?? "",
              }),
            ),
          }
        : { ...DOCENTE_INICIAL, asignaciones: [] },
    );

    setErrores({});
    setMensaje("");
    setErrorOperacion("");
    setHayCambios(false);
    setMostrarFormulario(true);
  }

  function cerrarSinConfirmar() {
    setMostrarFormulario(false);
    setEditando(null);
    setValores(DOCENTE_INICIAL);
    setErrores({});
    setHayCambios(false);
  }

  function cerrarFormulario() {
    if (
      hayCambios &&
      !window.confirm("Hay cambios sin guardar. ¿Desea descartarlos?")
    ) {
      return;
    }

    cerrarSinConfirmar();
  }

  // Cierra el modal con la tecla Escape (lo que antes hacía <dialog>).
  useEffect(() => {
    if (!mostrarFormulario) return undefined;

    function alPresionarTecla(evento) {
      if (evento.key === "Escape") cerrarFormulario();
    }

    document.addEventListener("keydown", alPresionarTecla);
    return () => document.removeEventListener("keydown", alPresionarTecla);
  });

  function manejarCambio(evento) {
    const { name, value } = evento.target;

    setValores((anteriores) => ({
      ...anteriores,
      [name]: value,
    }));

    setErrores((anteriores) => ({ ...anteriores, [name]: "" }));
    setHayCambios(true);
  }

  function agregarAsignacion() {
    setValores((anteriores) => ({
      ...anteriores,
      asignaciones: [
        ...anteriores.asignaciones,
        { materia: "", moduloId: "", division: "" },
      ],
    }));

    setErrores((anteriores) => ({ ...anteriores, asignaciones: "" }));
    setHayCambios(true);
  }

  function cambiarAsignacion(indice, campo, valor) {
    setValores((anteriores) => ({
      ...anteriores,
      asignaciones: anteriores.asignaciones.map((asignacion, posicion) =>
        posicion !== indice
          ? asignacion
          : campo === "moduloId"
            ? { ...asignacion, moduloId: valor, division: "" }
            : { ...asignacion, [campo]: valor },
      ),
    }));

    setErrores((anteriores) => ({ ...anteriores, asignaciones: "" }));
    setHayCambios(true);
  }

  function quitarAsignacion(indice) {
    setValores((anteriores) => ({
      ...anteriores,
      asignaciones: anteriores.asignaciones.filter(
        (_, posicion) => posicion !== indice,
      ),
    }));

    setErrores((anteriores) => ({ ...anteriores, asignaciones: "" }));
    setHayCambios(true);
  }

  async function guardarDocente(evento) {
    evento.preventDefault();

    const nuevosErrores = {};
    const dni = valores.dni.trim();

    if (!valores.nombre.trim()) {
      nuevosErrores.nombre = "Debe ingresar el nombre.";
    }

    if (!valores.apellido.trim()) {
      nuevosErrores.apellido = "Debe ingresar el apellido.";
    }

    if (!/^\d{7,8}$/.test(dni) || !esDniValido(dni)) {
      nuevosErrores.dni = "Debe ingresar un DNI de 7 u 8 números, sin puntos.";
    } else if (
      docentes.some((docente) => docente.dni === dni && docente.id !== editando)
    ) {
      nuevosErrores.dni = "Ya existe un docente con ese DNI.";
    }

    if (!valores.especialidad.trim()) {
      nuevosErrores.especialidad = "Debe ingresar la especialidad.";
    }

    if (!esEmailValido(valores.email)) {
      nuevosErrores.email =
        "El formato del correo electrónico ingresado no es válido.";
    }

    const asignacionIncompleta = valores.asignaciones.some(
      ({ materia, moduloId, division }) => {
        const modulo = modulos.find(
          (modulo) => String(modulo.id) === String(moduloId),
        );

        return (
          !MATERIAS.includes(materia) ||
          !modulo ||
          !(modulo.divisiones ?? []).includes(division)
        );
      },
    );

    const claves = valores.asignaciones.map(
      ({ materia, moduloId, division }) => `${materia}|${moduloId}|${division}`,
    );

    if (asignacionIncompleta) {
      nuevosErrores.asignaciones =
        "Complete materia, curso y división en cada fila, o quite la fila vacía.";
    } else if (new Set(claves).size !== claves.length) {
      nuevosErrores.asignaciones =
        "No puede repetir la misma materia en el mismo curso y división.";
    }

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) return;

    const asignacionesPreparadas = valores.asignaciones.map((asignacion) => {
      const modulosDelCurso = modulos.filter(
        (modulo) =>
          String(modulo.anioCurso) === String(asignacion.curso) &&
          (modulo.divisiones ?? []).includes(asignacion.division),
      );

      const modulo =
        modulosDelCurso.find((modulo) =>
          (modulo.materias ?? []).includes(asignacion.materia),
        ) ?? modulosDelCurso[0];

      return {
        ...asignacion,
        moduloId: modulo?.id ?? null,
      };
    });

    if (asignacionesPreparadas.some((a) => a.moduloId == null)) {
      setErrores({
        ...nuevosErrores,
        asignaciones:
          "No se encontró un módulo para el curso y división seleccionados.",
      });
      return;
    }

    const docentePreparado = {
      ...valores,
      nombre: capitalizarNombre(valores.nombre.trim().replace(/\s+/g, " ")),
      apellido: capitalizarNombre(valores.apellido.trim().replace(/\s+/g, " ")),
      dni,
      especialidad: valores.especialidad.trim(),
      email: valores.email.trim(),
      telefono: valores.telefono.trim(),
      asignaciones: valores.asignaciones.map(
        ({ materia, moduloId, division }) => ({
          materia: materia.trim(),
          moduloId: Number(moduloId),
          division: division.trim().toUpperCase(),
        }),
      ),
    };

    if (editando !== null) docentePreparado.id = editando;

    try {
      setErrorOperacion("");
      const guardado = await setDocente(docentePreparado);

      setDocentes((anteriores) =>
        editando !== null
          ? anteriores.map((docente) =>
              docente.id === editando ? guardado : docente,
            )
          : [...anteriores, guardado],
      );

      setMensaje(
        editando !== null
          ? "Datos del docente actualizados."
          : "Docente registrado correctamente.",
      );

      limpiarFiltros();
      setHayCambios(false);
      cerrarSinConfirmar();
    } catch (error) {
      setErrorOperacion(error.message);
    }
  }

  async function eliminarDocente(docente) {
    const confirmar = window.confirm(
      `¿Está seguro de eliminar al docente ${docente.apellido}, ${docente.nombre}?`,
    );

    if (!confirmar) return;

    try {
      setErrorOperacion("");
      await borrarDocenteApi(docente.id);
      setDocentes((anteriores) =>
        anteriores.filter((registro) => registro.id !== docente.id),
      );

      setMensaje("Docente eliminado del listado.");
    } catch (error) {
      setErrorOperacion(error.message);
    }
  }

  if (cargando) return <p>Cargando docentes...</p>;
  if (errorCarga) return <p role="alert">{errorCarga}</p>;

  return (
    <div className="gestion-personal">
      <div className="encabezado-gestion">
        <div>
          <h1>Gestión de Docentes</h1>
          <p>Administración de docentes y sus asignaciones.</p>
        </div>

        <button
          type="button"
          className="btn-primario-gestion"
          onClick={() => abrirFormulario()}
        >
          <i className="fa-solid fa-user-plus" aria-hidden="true" />
          Registrar docente
        </button>
      </div>

      {mensaje && (
        <p className="personal-aviso" role="status">
          {mensaje}
        </p>
      )}

      {errorOperacion && (
        <p className="mensaje-error" role="alert">
          {errorOperacion}
        </p>
      )}

      <div className="contenedor-tabla">
        <div className="cabecera-tabla">
          <div>
            <h2>Listado de Docentes</h2>

            <span className="cantidad-resultados">
              {docentesFiltrados.length} docente
              {docentesFiltrados.length !== 1 ? "s" : ""}
            </span>
          </div>

          <button
            type="button"
            className="btn-secundario"
            onClick={exportarListado}
            disabled={!docentesFiltrados.length}
            title="Exportar listado de docentes a Excel"
          >
            <i className="fa-solid fa-file-excel" aria-hidden="true" /> Exportar
            Excel
          </button>
        </div>

        <div className="barra-filtros">
          {filtrosSelect.map((filtro) => (
            <div className="form-group" key={filtro.nombre}>
              <label htmlFor={`docente-filtro-${filtro.nombre}`}>
                {filtro.etiqueta}
              </label>

              <select
                id={`docente-filtro-${filtro.nombre}`}
                name={filtro.nombre}
                value={filtros[filtro.nombre]}
                onChange={cambiarFiltro}
                className="input-gestion"
              >
                <option value="">{filtro.todos}</option>

                {filtro.opciones.map((opcion) => (
                  <option key={opcion} value={opcion}>
                    {filtro.nombre === "curso" ? `${opcion}° Año` : opcion}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className="form-group form-group-buscador">
            <label htmlFor="docente-busqueda">Buscar</label>
            <input
              id="docente-busqueda"
              name="busqueda"
              type="search"
              placeholder="Nombre, apellido, DNI o especialidad"
              value={filtros.busqueda}
              onChange={cambiarFiltro}
              className="input-gestion"
            />
          </div>

          <button
            type="button"
            className="btn-secundario"
            onClick={limpiarFiltros}
          >
            Limpiar
          </button>
        </div>

        <div className="tabla-responsive">
          <table className="tabla-gestion personal-tabla">
            <thead>
              <tr>
                <th>Apellido y nombre</th>
                <th>DNI</th>
                <th>Especialidad</th>
                <th>Materias, cursos y divisiones</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {docentesFiltrados.map((docente) => (
                <tr key={docente.id}>
                  <td>
                    <strong>
                      {docente.apellido}, {docente.nombre}
                    </strong>
                  </td>

                  <td>{formatearDNI(docente.dni)}</td>

                  <td>{docente.especialidad}</td>

                  <td>
                    <div className="personal-asignaciones">
                      {(docente.asignaciones ?? []).length === 0
                        ? "Sin asignaciones"
                        : docente.asignaciones.map((asignacion) => {
                            const curso = cursoDeModulo(asignacion.moduloId);

                            return (
                              <div
                                className="personal-asignacion"
                                key={`${asignacion.materia}-${asignacion.moduloId}-${asignacion.division}`}
                              >
                                <strong>{asignacion.materia} · </strong>
                                <span>
                                  {curso ? `${curso}° Año` : "Módulo sin curso"}
                                  {" · "}
                                  División {asignacion.division}
                                </span>
                              </div>
                            );
                          })}
                    </div>
                  </td>

                  <td>
                    <div className="acciones-tabla">
                      <button
                        type="button"
                        className="btn-accion btn-editar"
                        onClick={() => abrirFormulario(docente)}
                        aria-label={`Editar a ${docente.nombre} ${docente.apellido}`}
                      >
                        <i className="fa-solid fa-pen" aria-hidden="true" />
                        Editar
                      </button>

                      <button
                        type="button"
                        className="btn-accion btn-eliminar"
                        onClick={() => eliminarDocente(docente)}
                        aria-label={`Eliminar a ${docente.nombre} ${docente.apellido}`}
                      >
                        <i className="fa-solid fa-trash" aria-hidden="true" />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {docentesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="sin-resultados">
                    No se encontraron docentes con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {mostrarFormulario && (
        <div
          className="modal-alumno-overlay"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) {
              cerrarFormulario();
            }
          }}
        >
          <div
            className="modal-alumno personal-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-formulario-docente"
          >
            <div className="modal-alumno-header">
              <div>
                <h2 id="titulo-formulario-docente">
                  {editando !== null ? "Editar docente" : "Registrar docente"}
                </h2>
                <p>Complete los datos personales y las asignaciones.</p>
              </div>

              <button
                type="button"
                className="btn-cerrar-modal"
                onClick={cerrarFormulario}
                aria-label="Cerrar"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <form className="form-gestion" onSubmit={guardarDocente} noValidate>
              {errorOperacion && (
                <p className="mensaje-error" role="alert">
                  {errorOperacion}
                </p>
              )}

              <fieldset>
                <legend>Datos del docente</legend>

                {FILAS_CAMPOS.map((fila) => (
                  <div className="form-row" key={fila[0].nombre}>
                    {fila.map((campo) => (
                      <div className="form-group" key={campo.nombre}>
                        <label htmlFor={`docente-${campo.nombre}`}>
                          {campo.etiqueta}
                          {campo.obligatorio && " *"}
                        </label>

                        <input
                          id={`docente-${campo.nombre}`}
                          name={campo.nombre}
                          type={campo.tipo}
                          value={valores[campo.nombre]}
                          onChange={manejarCambio}
                          required={campo.obligatorio}
                          inputMode={
                            campo.nombre === "dni" ? "numeric" : undefined
                          }
                          maxLength={campo.nombre === "dni" ? 8 : undefined}
                          className={`input-gestion ${
                            errores[campo.nombre] ? "input-error" : ""
                          }`}
                          aria-invalid={Boolean(errores[campo.nombre])}
                          aria-describedby={
                            errores[campo.nombre]
                              ? `docente-error-${campo.nombre}`
                              : undefined
                          }
                        />

                        {errores[campo.nombre] && (
                          <span
                            id={`docente-error-${campo.nombre}`}
                            className="mensaje-error"
                            role="alert"
                          >
                            {errores[campo.nombre]}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </fieldset>

              <fieldset>
                <legend>Materias y cursos asignados</legend>

            {valores.asignaciones.map((asignacion, indice) => (
              <div className="personal-fila-asignacion" key={indice}>
                {[
                  {
                    campo: "materia", 
                    etiqueta: "Materia", 
                    opciones: MATERIAS
                  },
                  { 
                    campo: "moduloId", 
                    etiqueta: "Curso / Módulo", 
                    opciones: modulos
                  },
                  {
                    campo: "division",
                    etiqueta: "División",
                    opciones: modulos.find(
                      (modulo) => String(modulo.id) === String(asignacion.moduloId)
                    )?.divisiones ?? [],
                  },
                ].map(({ campo, etiqueta, opciones }) => (
                  <div className="form-group" key={campo}>
                    <label htmlFor={`docente-asignacion-${indice}-${campo}`}>
                      {etiqueta}
                    </label>

                        <select
                          id={`docente-asignacion-${indice}-${campo}`}
                          value={asignacion[campo]}
                          onChange={(evento) =>
                            cambiarAsignacion(
                              indice,
                              campo,
                              evento.target.value,
                            )
                          }
                          className="input-gestion"
                          disabled={campo === "division" && !asignacion.moduloId}
                        >
                          <option value="">Seleccionar</option>

                          {opciones.map((opcion) => {
                            const valor =
                              campo === "moduloId" ? String(opcion.id) : opcion;

                            const etiquetaOpcion =
                              campo === "moduloId"
                                ? `${cursoDeModulo(opcion.id)}° Año - Módulo ${opcion.id}`
                                : opcion;

                            return (
                              <option key={valor} value={valor}>
                                {etiquetaOpcion}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    ))}

                    <button
                      type="button"
                      className="btn-accion btn-eliminar"
                      onClick={() => quitarAsignacion(indice)}
                      aria-label={`Quitar asignación ${indice + 1}`}
                    >
                      <i className="fa-solid fa-trash" aria-hidden="true" />
                      Quitar
                    </button>
                  </div>
                ))}

                {errores.asignaciones && (
                  <p className="mensaje-error" role="alert">
                    {errores.asignaciones}
                  </p>
                )}

                <button
                  type="button"
                  className="btn-secundario"
                  onClick={agregarAsignacion}
                >
                  <i className="fa-solid fa-plus" aria-hidden="true" />
                  Agregar asignación
                </button>
              </fieldset>

              <div className="acciones-formulario personal-acciones">
                <button
                  type="button"
                  className="btn-secundario"
                  onClick={cerrarFormulario}
                >
                  Cancelar
                </button>

                <button type="submit" className="btn-primario-gestion">
                  <i
                    className={`fa-solid ${
                      editando !== null ? "fa-floppy-disk" : "fa-user-plus"
                    }`}
                    aria-hidden="true"
                  />
                  {editando !== null ? "Guardar cambios" : "Registrar docente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
