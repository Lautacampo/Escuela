import { useRef, useState } from "react";
import { useForm } from "../../../shared/hooks/useForm";
import { esDniValido, esEmailValido } from "../../../shared/utils/validaciones";
import { capitalizarNombre, formatearDNI } from "../../../shared/utils/formato";

const CURSOS = ["1", "2", "3"];
const DIVISIONES = ["A", "B", "C"];

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

// Datos ficticios para probar el frontend.
const DOCENTES_INICIALES = [
  {
    id: 1,
    nombre: "Lucía",
    apellido: "Fernández",
    dni: "30123456",
    especialidad: "Matemáticas y Física",
    email: "lucia.fernandez@example.com",
    telefono: "",
    asignaciones: [
      { materia: "Matemáticas", curso: "1", division: "A" },
      { materia: "Matemáticas", curso: "2", division: "B" },
      { materia: "Física", curso: "3", division: "A" },
    ],
  },
  {
    id: 2,
    nombre: "Martín",
    apellido: "Suárez",
    dni: "28987654",
    especialidad: "Lengua y Literatura",
    email: "martin.suarez@example.com",
    telefono: "",
    asignaciones: [
      { materia: "Lengua", curso: "1", division: "B" },
      { materia: "Literatura", curso: "3", division: "C" },
    ],
  },
];

function normalizar(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function Docentes() {
  const [docentes, setDocentes] = useState(DOCENTES_INICIALES);
  const [valores, setValores] = useState(DOCENTE_INICIAL);
  const [editando, setEditando] = useState(null);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [hayCambios, setHayCambios] = useState(false);

  const modalRef = useRef(null);

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

  const filtrosSelect = [
    {
      nombre: "curso",
      etiqueta: "Curso",
      todos: "Todos los cursos",
      opciones: CURSOS,
    },
    {
      nombre: "division",
      etiqueta: "División",
      todos: "Todas",
      opciones: DIVISIONES,
    },
    {
      nombre: "materia",
      etiqueta: "Materia",
      todos: "Todas las materias",
      opciones: MATERIAS,
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
          (!filtros.curso || asignacion.curso === filtros.curso) &&
          (!filtros.division || asignacion.division === filtros.division) &&
          (!filtros.materia || asignacion.materia === filtros.materia),
      );

    return coincideBusqueda && coincideAsignacion;
  });

  function abrirFormulario(docente = null) {
    setEditando(docente?.id ?? null);

    setValores(
      docente
        ? {
            ...docente,
            asignaciones: docente.asignaciones.map((asignacion) => ({
              ...asignacion,
            })),
          }
        : { ...DOCENTE_INICIAL, asignaciones: [] },
    );

    setErrores({});
    setMensaje("");
    setHayCambios(false);
    modalRef.current.showModal();
  }

  function cerrarFormulario() {
    if (
      hayCambios &&
      !window.confirm("Hay cambios sin guardar. ¿Querés descartarlos?")
    ) {
      return;
    }

    modalRef.current.close();
    setHayCambios(false);
  }

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
        { materia: "", curso: "", division: "" },
      ],
    }));

    setErrores((anteriores) => ({ ...anteriores, asignaciones: "" }));
    setHayCambios(true);
  }

  function cambiarAsignacion(indice, campo, valor) {
    setValores((anteriores) => ({
      ...anteriores,
      asignaciones: anteriores.asignaciones.map((asignacion, posicion) =>
        posicion === indice ? { ...asignacion, [campo]: valor } : asignacion,
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

  function guardarDocente(evento) {
    evento.preventDefault();

    const nuevosErrores = {};
    const dni = valores.dni.trim();

    if (!valores.nombre.trim()) {
      nuevosErrores.nombre = "Ingresá el nombre.";
    }

    if (!valores.apellido.trim()) {
      nuevosErrores.apellido = "Ingresá el apellido.";
    }

    if (!/^\d{7,8}$/.test(dni) || !esDniValido(dni)) {
      nuevosErrores.dni = "Ingresá un DNI de 7 u 8 números, sin puntos.";
    } else if (
      docentes.some((docente) => docente.dni === dni && docente.id !== editando)
    ) {
      nuevosErrores.dni = "Ya existe un docente con ese DNI.";
    }

    if (!valores.especialidad.trim()) {
      nuevosErrores.especialidad = "Ingresá la especialidad.";
    }

    if (!esEmailValido(valores.email)) {
      nuevosErrores.email = "Ingresá un correo electrónico válido.";
    }

    const asignacionIncompleta = valores.asignaciones.some(
      ({ materia, curso, division }) =>
        !MATERIAS.includes(materia) ||
        !CURSOS.includes(curso) ||
        !DIVISIONES.includes(division),
    );

    const claves = valores.asignaciones.map(
      ({ materia, curso, division }) => `${materia}|${curso}|${division}`,
    );

    if (asignacionIncompleta) {
      nuevosErrores.asignaciones =
        "Completá materia, curso y división en cada fila, o quitá la fila vacía.";
    } else if (new Set(claves).size !== claves.length) {
      nuevosErrores.asignaciones =
        "No podés repetir la misma materia en el mismo curso y división.";
    }

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) return;

    const docentePreparado = {
      ...valores,
      id: editando ?? crypto.randomUUID(),
      nombre: capitalizarNombre(valores.nombre.trim().replace(/\s+/g, " ")),
      apellido: capitalizarNombre(valores.apellido.trim().replace(/\s+/g, " ")),
      dni,
      especialidad: valores.especialidad.trim(),
      email: valores.email.trim(),
      telefono: valores.telefono.trim(),
      asignaciones: valores.asignaciones.map((asignacion) => ({
        ...asignacion,
      })),
    };

    setDocentes((anteriores) =>
      editando !== null
        ? anteriores.map((docente) =>
            docente.id === editando ? docentePreparado : docente,
          )
        : [...anteriores, docentePreparado],
    );

    setMensaje(
      editando !== null
        ? "Datos del docente actualizados."
        : "Docente registrado correctamente.",
    );

    limpiarFiltros();
    setHayCambios(false);
    modalRef.current.close();
  }

  function eliminarDocente(docente) {
    const confirmar = window.confirm(
      `¿Querés eliminar a ${docente.apellido}, ${docente.nombre} del listado de docentes?`,
    );

    if (!confirmar) return;

    setDocentes((anteriores) =>
      anteriores.filter((registro) => registro.id !== docente.id),
    );

    setMensaje("Docente eliminado del listado.");
  }

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

      <div className="contenedor-tabla">
        <div className="cabecera-tabla">
          <div>
            <h2>Listado de Docentes</h2>
            <span className="cantidad-resultados">
              {docentesFiltrados.length} docente
              {docentesFiltrados.length !== 1 ? "s" : ""}
            </span>
          </div>
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
                      {docente.asignaciones.length === 0
                        ? "Sin asignaciones"
                        : docente.asignaciones.map((asignacion) => (
                            <div
                              className="personal-asignacion"
                              key={`${asignacion.materia}-${asignacion.curso}-${asignacion.division}`}
                            >
                              <strong>{asignacion.materia}</strong>
                              <span>
                                {asignacion.curso}° Año · División{" "}
                                {asignacion.division}
                              </span>
                            </div>
                          ))}
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

      <dialog
        ref={modalRef}
        className="modal-alumno personal-modal"
        aria-labelledby="titulo-formulario-docente"
        onCancel={(evento) => {
          evento.preventDefault();
          cerrarFormulario();
        }}
      >
        <div className="modal-alumno-header">
          <div>
            <h2 id="titulo-formulario-docente">
              {editando !== null ? "Modificar docente" : "Registrar docente"}
            </h2>
            <p>Completá los datos personales y las asignaciones.</p>
          </div>

          <button
            type="button"
            className="btn-cerrar-modal"
            onClick={cerrarFormulario}
            aria-label="Cerrar formulario"
          >
            ×
          </button>
        </div>

        <form className="form-gestion" onSubmit={guardarDocente} noValidate>
          <fieldset>
            <legend>Datos del docente</legend>

            <div className="personal-campos">
              {CAMPOS.map((campo) => (
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
                    inputMode={campo.nombre === "dni" ? "numeric" : undefined}
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
          </fieldset>

          <fieldset>
            <legend>Materias y cursos asignados</legend>

            <p className="personal-ayuda">
              Agregá una fila por cada materia, curso y división. También podés
              registrar al docente sin asignaciones.
            </p>

            {valores.asignaciones.map((asignacion, indice) => (
              <div className="personal-fila-asignacion" key={indice}>
                {[
                  { campo: "materia", etiqueta: "Materia", opciones: MATERIAS },
                  { campo: "curso", etiqueta: "Curso", opciones: CURSOS },
                  {
                    campo: "division",
                    etiqueta: "División",
                    opciones: DIVISIONES,
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
                        cambiarAsignacion(indice, campo, evento.target.value)
                      }
                      className="input-gestion"
                    >
                      <option value="">Seleccionar</option>
                      {opciones.map((opcion) => (
                        <option key={opcion} value={opcion}>
                          {campo === "curso" ? `${opcion}° Año` : opcion}
                        </option>
                      ))}
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
              + Agregar asignación
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
              {editando !== null ? "Guardar cambios" : "Registrar docente"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
