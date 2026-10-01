import { useEffect, useRef, useState } from "react";
import { useForm } from "../../../shared/hooks/useForm";
import { esDniValido, esEmailValido } from "../../../shared/utils/validaciones";
import { capitalizarNombre, formatearDNI } from "../../../shared/utils/formato";
import {
  getPreceptores,
  getModulos,
  setPreceptor,
  borrarPreceptor,
} from "../services/PreceptoresServices";

const PRECEPTOR_INICIAL = {
  nombre: "",
  apellido: "",
  dni: "",
  email: "",
  telefono: "",
  asignaciones: [],
};

const CAMPOS = [
  { nombre: "nombre", etiqueta: "Nombre", tipo: "text", obligatorio: true },
  { nombre: "apellido", etiqueta: "Apellido", tipo: "text", obligatorio: true },
  { nombre: "dni", etiqueta: "DNI", tipo: "text", obligatorio: true },
  {
    nombre: "email",
    etiqueta: "Correo electrónico",
    tipo: "email",
    obligatorio: true,
  },
  { nombre: "telefono", etiqueta: "Teléfono", tipo: "tel" },
];

function normalizar(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function Preceptores() {
  const [preceptores, setPreceptores] = useState([]);
  const [valores, setValores] = useState(PRECEPTOR_INICIAL);
  const [editando, setEditando] = useState(null);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [hayCambios, setHayCambios] = useState(false);
  const [modulos, setModulos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [errorGuardar, setErrorGuardar] = useState("");

  const modalRef = useRef(null);

  useEffect(() => {
    async function cargar() {
      try {
        const [datosPreceptores, datosModulos] = await Promise.all([
          getPreceptores(),
          getModulos(),
        ]);
        setPreceptores(datosPreceptores);
        setModulos(datosModulos);
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const {
    valores: filtros,
    manejarCambio: cambiarFiltro,
    resetearFormulario: limpiarFiltros,
  } = useForm({
    modulo: "",
    division: "",
    busqueda: "",
  });

  // Todas las divisiones que existen en algún módulo (A, B, C, D)
  const divisionesTodas = [
    ...new Set(modulos.flatMap((modulo) => modulo.divisiones)),
  ].sort();

  const filtrosSelect = [
    {
      nombre: "modulo",
      etiqueta: "Módulo",
      todos: "Todos los módulos",
      opciones: modulos.map((m) => ({ valor: String(m.id), texto: m.nombre })),
    },
    {
      nombre: "division",
      etiqueta: "División",
      todos: "Todas",
      opciones: divisionesTodas.map((d) => ({ valor: d, texto: d })),
    },
  ];

  function nombreModulo(id) {
    return (
      modulos.find((m) => Number(m.id) === Number(id))?.nombre ??
      `Módulo ${id}`
    );
  }

  const preceptoresFiltrados = preceptores.filter((preceptor) => {
    const texto = normalizar(
      `${preceptor.apellido} ${preceptor.nombre} ${preceptor.dni}`,
    );

    const coincideBusqueda = normalizar(filtros.busqueda)
      .split(/\s+/)
      .every((palabra) => texto.includes(palabra));

    const hayFiltroAsignacion = filtros.modulo || filtros.division;

    const coincideAsignacion =
      !hayFiltroAsignacion ||
      preceptor.asignaciones.some(
        (asignacion) =>
          (!filtros.modulo || asignacion.moduloId === Number(filtros.modulo)) &&
          (!filtros.division || asignacion.division === filtros.division),
      );

    return coincideBusqueda && coincideAsignacion;
  });

  function abrirFormulario(preceptor = null) {
    setEditando(preceptor?.id ?? null);

    setValores(
      preceptor
        ? {
            ...preceptor,
            asignaciones: preceptor.asignaciones.map((asignacion) => ({
              ...asignacion,
            })),
          }
        : { ...PRECEPTOR_INICIAL, asignaciones: [] },
    );

    setErrores({});
    setMensaje("");
    setErrorGuardar("");
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
      asignaciones: [...anteriores.asignaciones, { moduloId: "", division: "" }],
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
            ? // al cambiar de módulo se reinicia la división (cada módulo tiene las suyas)
              { moduloId: valor === "" ? "" : Number(valor), division: "" }
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

  async function guardarPreceptor(evento) {
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
      preceptores.some(
        (preceptor) => preceptor.dni === dni && preceptor.id !== editando,
      )
    ) {
      nuevosErrores.dni = "Ya existe un preceptor con ese DNI.";
    }

    if (!esEmailValido(valores.email)) {
      nuevosErrores.email = "Ingresá un correo electrónico válido.";
    }

    const asignacionIncompleta = valores.asignaciones.some(
      ({ moduloId, division }) => {
        const modulo = modulos.find(
          (m) => Number(m.id) === Number(moduloId),
        );
        return !modulo || !modulo.divisiones.includes(division);
      },
    );

    const claves = valores.asignaciones.map(
      ({ moduloId, division }) => `${moduloId}|${division}`,
    );
    const asignacionesPrevias =
      preceptores.find((preceptor) => preceptor.id === editando)?.asignaciones ??
      [];

    const conflictoAsignacion = valores.asignaciones
      .map((asignacion) => ({
        asignacion,
        preceptor: asignacionesPrevias.some(
          (asignacionPrevia) =>
            Number(asignacionPrevia.moduloId) === Number(asignacion.moduloId) &&
            asignacionPrevia.division === asignacion.division,
        )
          ? null
          : preceptores.find(
              (existente) =>
                existente.id !== editando &&
                existente.asignaciones.some(
                  (asignacionExistente) =>
                    Number(asignacionExistente.moduloId) ===
                      Number(asignacion.moduloId) &&
                    asignacionExistente.division === asignacion.division,
                ),
            ),
      }))
      .find(({ preceptor }) => preceptor);

    if (asignacionIncompleta) {
      nuevosErrores.asignaciones =
        "Completá módulo y división en cada fila, o quitá la fila vacía.";
    } else if (new Set(claves).size !== claves.length) {
      nuevosErrores.asignaciones =
        "No podés asignar dos veces el mismo módulo y división.";
    } else if (conflictoAsignacion) {
      const { asignacion, preceptor } = conflictoAsignacion;
      nuevosErrores.asignaciones = `${nombreModulo(asignacion.moduloId)}, división ${asignacion.division} ya está asignado a ${preceptor.apellido}, ${preceptor.nombre}.`;
    }

    setErrores(nuevosErrores);

    if (Object.keys(nuevosErrores).length > 0) return;

    const preceptorPreparado = {
      ...valores,
      nombre: capitalizarNombre(valores.nombre.trim().replace(/\s+/g, " ")),
      apellido: capitalizarNombre(valores.apellido.trim().replace(/\s+/g, " ")),
      dni,
      email: valores.email.trim(),
      telefono: valores.telefono.trim(),
      asignaciones: valores.asignaciones.map((asignacion) => ({
        ...asignacion,
      })),
    };

    try {
      setErrorGuardar("");

      // Si preceptorPreparado trae id -> PUT (editar). Si no -> POST (crear).
      const guardado = await setPreceptor(preceptorPreparado);

      setPreceptores((anteriores) =>
        editando !== null
          ? anteriores.map((preceptor) =>
              preceptor.id === editando ? guardado : preceptor,
            )
          : [...anteriores, guardado],
      );

      setMensaje(
        editando !== null
          ? "Datos del preceptor actualizados."
          : "Preceptor registrado correctamente.",
      );

      limpiarFiltros();
      setHayCambios(false);
      modalRef.current.close();
    } catch (e) {
      setErrorGuardar(e.message);
    }
  }

  async function eliminarPreceptor(preceptor) {
    const confirmar = window.confirm(
      `¿Querés eliminar a ${preceptor.apellido}, ${preceptor.nombre} del listado de preceptores?`,
    );

    if (!confirmar) return;

    try {
      await borrarPreceptor(preceptor.id);

      setPreceptores((anteriores) =>
        anteriores.filter((registro) => registro.id !== preceptor.id),
      );

      setMensaje("Preceptor eliminado del listado.");
    } catch (e) {
      setMensaje(e.message);
    }
  }

  if (cargando) return <p>Cargando preceptores...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div className="gestion-personal">
      <div className="encabezado-gestion">
        <div>
          <h1>Gestión de Preceptores</h1>
          <p>Administración de preceptores y grupos a cargo.</p>
        </div>

        <button
          type="button"
          className="btn-primario-gestion"
          onClick={() => abrirFormulario()}
        >
          <i className="fa-solid fa-user-plus" aria-hidden="true" />
          Registrar preceptor
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
            <h2>Listado de Preceptores</h2>
            <span className="cantidad-resultados">
              {preceptoresFiltrados.length}{" "}
              {preceptoresFiltrados.length === 1 ? "preceptor" : "preceptores"}
            </span>
          </div>
        </div>

        <div className="barra-filtros">
          {filtrosSelect.map((filtro) => (
            <div className="form-group" key={filtro.nombre}>
              <label htmlFor={`preceptor-filtro-${filtro.nombre}`}>
                {filtro.etiqueta}
              </label>

              <select
                id={`preceptor-filtro-${filtro.nombre}`}
                name={filtro.nombre}
                value={filtros[filtro.nombre]}
                onChange={cambiarFiltro}
                className="input-gestion"
              >
                <option value="">{filtro.todos}</option>

                {filtro.opciones.map((opcion) => (
                  <option key={opcion.valor} value={opcion.valor}>
                    {opcion.texto}
                  </option>
                ))}
              </select>
            </div>
          ))}

          <div className="form-group form-group-buscador">
            <label htmlFor="preceptor-busqueda">Buscar</label>
            <input
              id="preceptor-busqueda"
              name="busqueda"
              type="search"
              placeholder="Nombre, apellido o DNI"
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
                <th>Contacto</th>
                <th>Módulos y divisiones</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody>
              {preceptoresFiltrados.map((preceptor) => (
                <tr key={preceptor.id}>
                  <td>
                    <strong>
                      {preceptor.apellido}, {preceptor.nombre}
                    </strong>
                  </td>

                  <td>{formatearDNI(preceptor.dni)}</td>

                  <td>
                    <div className="personal-contacto">
                      <span>{preceptor.email}</span>
                      <span>{preceptor.telefono || "Sin teléfono"}</span>
                    </div>
                  </td>

                  <td>
                    <div className="personal-asignaciones">
                      {preceptor.asignaciones.length === 0
                        ? "Sin asignaciones"
                        : preceptor.asignaciones.map((asignacion) => (
                            <div
                              className="personal-asignacion"
                              key={`${asignacion.moduloId}-${asignacion.division}`}
                            >
                              {nombreModulo(asignacion.moduloId)} · División{" "}
                              {asignacion.division}
                            </div>
                          ))}
                    </div>
                  </td>

                  <td>
                    <div className="acciones-tabla">
                      <button
                        type="button"
                        className="btn-accion btn-editar"
                        onClick={() => abrirFormulario(preceptor)}
                        aria-label={`Editar a ${preceptor.nombre} ${preceptor.apellido}`}
                      >
                        <i className="fa-solid fa-pen" aria-hidden="true" />
                        Editar
                      </button>

                      <button
                        type="button"
                        className="btn-accion btn-eliminar"
                        onClick={() => eliminarPreceptor(preceptor)}
                        aria-label={`Eliminar a ${preceptor.nombre} ${preceptor.apellido}`}
                      >
                        <i className="fa-solid fa-trash" aria-hidden="true" />
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {preceptoresFiltrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="sin-resultados">
                    No se encontraron preceptores con esos filtros.
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
        aria-labelledby="titulo-formulario-preceptor"
        onCancel={(evento) => {
          evento.preventDefault();
          cerrarFormulario();
        }}
      >
        <div className="modal-alumno-header">
          <div>
            <h2 id="titulo-formulario-preceptor">
              {editando !== null
                ? "Modificar preceptor"
                : "Registrar preceptor"}
            </h2>
            <p>Completá los datos personales y los grupos a cargo.</p>
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

        <form className="form-gestion" onSubmit={guardarPreceptor} noValidate>
          <fieldset>
            <legend>Datos del preceptor</legend>

            <div className="personal-campos">
              {CAMPOS.map((campo) => (
                <div className="form-group" key={campo.nombre}>
                  <label htmlFor={`preceptor-${campo.nombre}`}>
                    {campo.etiqueta}
                    {campo.obligatorio && " *"}
                  </label>

                  <input
                    id={`preceptor-${campo.nombre}`}
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
                        ? `preceptor-error-${campo.nombre}`
                        : undefined
                    }
                  />

                  {errores[campo.nombre] && (
                    <span
                      id={`preceptor-error-${campo.nombre}`}
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
            <legend>Módulos y divisiones a cargo</legend>

            <p className="personal-ayuda">
              Agregá una fila por cada grupo. También podés registrar al
              preceptor sin asignaciones.
            </p>

            {valores.asignaciones.map((asignacion, indice) => {
              const moduloElegido = modulos.find(
                (m) => Number(m.id) === Number(asignacion.moduloId),
              );

              return (
                <div className="personal-fila-asignacion" key={indice}>
                  <div className="form-group">
                    <label htmlFor={`preceptor-asignacion-${indice}-moduloId`}>
                      Módulo
                    </label>
                    <select
                      id={`preceptor-asignacion-${indice}-moduloId`}
                      value={asignacion.moduloId}
                      onChange={(evento) =>
                        cambiarAsignacion(indice, "moduloId", evento.target.value)
                      }
                      className="input-gestion"
                    >
                      <option value="">Seleccionar</option>
                      {modulos.map((modulo) => (
                        <option key={modulo.id} value={modulo.id}>
                          {modulo.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor={`preceptor-asignacion-${indice}-division`}>
                      División
                    </label>
                    <select
                      id={`preceptor-asignacion-${indice}-division`}
                      value={asignacion.division}
                      onChange={(evento) =>
                        cambiarAsignacion(indice, "division", evento.target.value)
                      }
                      disabled={!moduloElegido}
                      className="input-gestion"
                    >
                      <option value="">Seleccionar</option>
                      {(moduloElegido?.divisiones ?? []).map((division) => (
                        <option key={division} value={division}>
                          {division}
                        </option>
                      ))}
                    </select>
                  </div>

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
              );
            })}

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
              + Agregar grupo
            </button>
          </fieldset>

          {errorGuardar && (
            <p className="mensaje-error" role="alert">
              {errorGuardar}
            </p>
          )}

          <div className="acciones-formulario personal-acciones">
            <button
              type="button"
              className="btn-secundario"
              onClick={cerrarFormulario}
            >
              Cancelar
            </button>

            <button type="submit" className="btn-primario-gestion">
              {editando !== null ? "Guardar cambios" : "Registrar preceptor"}
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
