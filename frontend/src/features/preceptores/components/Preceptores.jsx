import { useEffect, useState } from "react";
import { useForm } from "../../../shared/hooks/useForm";
import { esDniValido, esEmailValido } from "../../../shared/utils/validaciones";
import { capitalizarNombre, formatearDNI } from "../../../shared/utils/formato";
import {
  getPreceptores,
  setPreceptor,
  registrarUsuarioPreceptor,
  borrarPreceptor,
  getCursos,
  asignarCursos,
} from "../services/PreceptoresServices.jsx";

const PRECEPTOR_INICIAL = {
  nombre: "",
  apellido: "",
  dni: "",
  cuil: "",
  email: "",
  telefono: "",
  domicilio: "",
  titulo: "",
  antiguedad: "",
  password: "",
};

const CAMPOS = [
  { nombre: "nombre", etiqueta: "Nombre", tipo: "text", obligatorio: true },
  { nombre: "apellido", etiqueta: "Apellido", tipo: "text", obligatorio: true },
  { nombre: "dni", etiqueta: "DNI", tipo: "text", obligatorio: true },
  {
    nombre: "cuil",
    etiqueta: "CUIL (ej: 20-12345678-9)",
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
  {
    nombre: "domicilio",
    etiqueta: "Domicilio",
    tipo: "text",
    obligatorio: true,
  },
  { nombre: "titulo", etiqueta: "Título", tipo: "text", obligatorio: true },
  {
    nombre: "antiguedad",
    etiqueta: "Antigüedad (años)",
    tipo: "number",
    obligatorio: true,
  },
  {
    nombre: "password",
    etiqueta: "Contraseña de acceso (mín. 4 caracteres)",
    tipo: "password",
    obligatorio: true,
    soloAlta: true,
  },
];

const FILAS_CAMPOS = [
  CAMPOS.slice(0, 2),
  CAMPOS.slice(2, 4),
  CAMPOS.slice(4, 6),
  CAMPOS.slice(6, 8),
  CAMPOS.slice(8, 10),
];

const NOMBRES_ANIOS = {
  1: "Primer Año",
  2: "Segundo Año",
  3: "Tercer Año",
};

function normalizar(texto) {
  return String(texto)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function aValoresFormulario(preceptor) {
  const valores = { ...PRECEPTOR_INICIAL };
  for (const clave of Object.keys(PRECEPTOR_INICIAL)) {
    valores[clave] = preceptor[clave] == null ? "" : String(preceptor[clave]);
  }
  return valores;
}

const nombreCurso = (c) => {
  if (Array.isArray(c.modulos) && c.modulos.length > 0) {
    const mods = c.modulos.map((m) => m.nombre).join(" y ");
    return `${mods} · Div. ${c.division}`;
  }
  return `${NOMBRES_ANIOS[c.anio ?? c.anio_curso] ?? `${c.anio_curso}.º Año`} · Div. ${c.division}`;
};

export function Preceptores() {
  const [preceptores, setPreceptores] = useState([]);
  const [valores, setValores] = useState(PRECEPTOR_INICIAL);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editando, setEditando] = useState(null);
  const [errores, setErrores] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [hayCambios, setHayCambios] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [errorGuardar, setErrorGuardar] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Asignación de cursos
  const [cursos, setCursos] = useState([]);
  const [asignando, setAsignando] = useState(null);
  const [seleccion, setSeleccion] = useState([]);
  const [errorAsignar, setErrorAsignar] = useState("");
  const [guardandoAsig, setGuardandoAsig] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.all([getPreceptores(), getCursos()])
      .then(([p, c]) => {
        if (!activo) return;
        setPreceptores(p);
        setCursos(c);
      })
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  const {
    valores: filtros,
    manejarCambio: cambiarFiltro,
    resetearFormulario: limpiarFiltros,
  } = useForm({ busqueda: "" });

  const preceptoresFiltrados = preceptores.filter((preceptor) => {
    const texto = normalizar(
      `${preceptor.apellido} ${preceptor.nombre} ${preceptor.dni}`,
    );
    return normalizar(filtros.busqueda)
      .split(/\s+/)
      .every((palabra) => texto.includes(palabra));
  });

  function abrirFormulario(preceptor = null) {
    setEditando(preceptor?.id ?? null);
    setValores(
      preceptor ? aValoresFormulario(preceptor) : { ...PRECEPTOR_INICIAL },
    );
    setErrores({});
    setMensaje("");
    setErrorGuardar("");
    setHayCambios(false);
    setMostrarFormulario(true);
  }

  function cerrarSinConfirmar() {
    setMostrarFormulario(false);
    setEditando(null);
    setValores(PRECEPTOR_INICIAL);
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
    setValores((anteriores) => ({ ...anteriores, [name]: value }));
    setErrores((anteriores) => ({ ...anteriores, [name]: "" }));
    setHayCambios(true);
  }

  async function guardarPreceptor(evento) {
    evento.preventDefault();

    const nuevosErrores = {};
    const dni = valores.dni.trim();
    const cuil = valores.cuil.trim();

    if (!valores.nombre.trim())
      nuevosErrores.nombre = "Debe ingresar el nombre.";
    if (!valores.apellido.trim())
      nuevosErrores.apellido = "Debe ingresar el apellido.";

    if (!/^\d{7,8}$/.test(dni) || !esDniValido(dni)) {
      nuevosErrores.dni = "Debe ingresar un DNI de 7 u 8 números, sin puntos.";
    } else if (
      preceptores.some(
        (preceptor) =>
          String(preceptor.dni) === dni && preceptor.id !== editando,
      )
    ) {
      nuevosErrores.dni = "Ya existe un preceptor con ese DNI.";
    }

    if (!/^\d{2}-\d{7,8}-\d$/.test(cuil)) {
      nuevosErrores.cuil = "Formato de CUIL inválido (ej: 20-12345678-9).";
    }

    if (!esEmailValido(valores.email)) {
      nuevosErrores.email =
        "El formato del correo electrónico ingresado no es válido.";
    }

    if (!valores.domicilio.trim())
      nuevosErrores.domicilio = "Debe ingresar el domicilio.";
    if (!valores.titulo.trim())
      nuevosErrores.titulo = "Debe ingresar el título.";

    const antiguedad = Number(valores.antiguedad);
    if (
      valores.antiguedad === "" ||
      !Number.isInteger(antiguedad) ||
      antiguedad < 0
    ) {
      nuevosErrores.antiguedad =
        "Ingrese la antigüedad en años (número entero, 0 o más).";
    }

    if (
      editando === null &&
      (!valores.password || valores.password.length < 4)
    ) {
      nuevosErrores.password =
        "Debe ingresar una contraseña de al menos 4 caracteres.";
    }

    setErrores(nuevosErrores);
    if (Object.keys(nuevosErrores).length > 0) return;

    const preceptorPreparado = {
      ...(editando !== null && { id: editando }),
      nombre: capitalizarNombre(valores.nombre.trim().replace(/\s+/g, " ")),
      apellido: capitalizarNombre(valores.apellido.trim().replace(/\s+/g, " ")),
      dni,
      cuil,
      email: valores.email.trim(),
      telefono: valores.telefono.trim() || null,
      domicilio: valores.domicilio.trim(),
      titulo: valores.titulo.trim(),
      antiguedad,
    };

    try {
      setErrorGuardar("");
      setGuardando(true);

      // Si es un alta nueva, registramos primero su usuario con rol "preceptor" en /api/auth/registro
      if (editando === null) {
        await registrarUsuarioPreceptor({
          nombre: preceptorPreparado.nombre,
          apellido: preceptorPreparado.apellido,
          email: preceptorPreparado.email,
          password: valores.password,
        });
      }

      const guardado = await setPreceptor(preceptorPreparado);

      setPreceptores((anteriores) =>
        editando !== null
          ? anteriores.map((p) => (p.id === editando ? guardado : p))
          : [...anteriores, guardado],
      );

      setMensaje(
        editando !== null
          ? "Datos del preceptor actualizados."
          : "Preceptor y usuario de acceso registrados correctamente.",
      );

      limpiarFiltros();
      cerrarSinConfirmar();
    } catch (e) {
      setErrorGuardar(e.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarPreceptor(preceptor) {
    const confirmar = window.confirm(
      `¿Está seguro de eliminar al preceptor ${preceptor.apellido}, ${preceptor.nombre}?`,
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

  // ---------- Asignar cursos ----------
  function abrirAsignacion(preceptor) {
    setAsignando(preceptor);
    setSeleccion((preceptor.cursos ?? []).map((c) => c.id));
    setErrorAsignar("");
    setMensaje("");
  }

  function alternarCurso(id) {
    setSeleccion((previos) =>
      previos.includes(id) ? previos.filter((x) => x !== id) : [...previos, id],
    );
  }

  async function guardarAsignacion() {
    try {
      setGuardandoAsig(true);
      setErrorAsignar("");
      await asignarCursos(asignando.id, seleccion);

      const [p, c] = await Promise.all([getPreceptores(), getCursos()]);
      setPreceptores(p);
      setCursos(c);
      setMensaje(
        `Cursos de ${asignando.apellido}, ${asignando.nombre} actualizados.`,
      );
      setAsignando(null);
    } catch (e) {
      setErrorAsignar(e.message);
    } finally {
      setGuardandoAsig(false);
    }
  }

  // Agrupamiento de cursos por Año y Módulos
  const cursosPorAnio = cursos.reduce((acumulador, curso) => {
    const claveAnio = curso.anio_curso ?? curso.anio;
    if (!acumulador[claveAnio]) acumulador[claveAnio] = [];
    acumulador[claveAnio].push(curso);
    return acumulador;
  }, {});

  if (cargando) return <p>Cargando preceptores...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <div className="gestion-personal">
      <div className="encabezado-gestion">
        <div>
          <h1>Gestión de Preceptores</h1>
          <p>Administración de preceptores y módulos a cargo.</p>
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
                <th>DNI / CUIL</th>
                <th>Contacto</th>
                <th>Título y antigüedad</th>
                <th>Módulos y divisiones a cargo</th>
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

                  <td>
                    <div className="personal-contacto">
                      <span>
                        <span className="personal-contacto-etiqueta">DNI:</span>{" "}
                        {formatearDNI(preceptor.dni)}
                      </span>
                      <span>
                        <span className="personal-contacto-etiqueta">
                          CUIL:
                        </span>{" "}
                        {preceptor.cuil}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className="personal-contacto">
                      <span>
                        <span className="personal-contacto-etiqueta">
                          Correo:
                        </span>{" "}
                        {preceptor.email || "Sin correo"}
                      </span>
                      <span>
                        <span className="personal-contacto-etiqueta">
                          Teléfono:
                        </span>{" "}
                        {preceptor.telefono || "Sin teléfono"}
                      </span>
                      <span>
                        <span className="personal-contacto-etiqueta">
                          Domicilio:
                        </span>{" "}
                        {preceptor.domicilio}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className="personal-contacto">
                      <span>
                        <span className="personal-contacto-etiqueta">
                          Título:
                        </span>{" "}
                        {preceptor.titulo}
                      </span>
                      <span>
                        <span className="personal-contacto-etiqueta">
                          Antigüedad:
                        </span>{" "}
                        {preceptor.antiguedad}{" "}
                        {Number(preceptor.antiguedad) === 1 ? "año" : "años"}
                      </span>
                    </div>
                  </td>

                  <td>
                    <div className="personal-asignaciones">
                      {(preceptor.cursos ?? []).length === 0
                        ? "Sin módulos asignados"
                        : preceptor.cursos.map((c) => (
                            <div className="personal-asignacion" key={c.id}>
                              {nombreCurso(c)}
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
                        className="btn-accion btn-editar"
                        onClick={() => abrirAsignacion(preceptor)}
                        aria-label={`Asignar cursos a ${preceptor.nombre} ${preceptor.apellido}`}
                      >
                        <i className="fa-solid fa-school" aria-hidden="true" />
                        Asignar módulos
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
                  <td colSpan={6} className="sin-resultados">
                    No se encontraron preceptores con esos filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: alta y edición */}
      {mostrarFormulario && (
        <div
          className="modal-alumno-overlay"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) cerrarFormulario();
          }}
        >
          <div
            className="modal-alumno personal-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-formulario-preceptor"
          >
            <div className="modal-alumno-header">
              <div>
                <h2 id="titulo-formulario-preceptor">
                  {editando !== null
                    ? "Editar preceptor"
                    : "Registrar preceptor"}
                </h2>
                <p>Complete los datos personales, laborales y de acceso.</p>
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

            <form
              className="form-gestion"
              onSubmit={guardarPreceptor}
              noValidate
            >
              <fieldset>
                <legend>Datos del preceptor</legend>

                {FILAS_CAMPOS.map((fila) => (
                  <div className="form-row" key={fila[0].nombre}>
                    {fila
                      .filter((campo) => !campo.soloAlta || editando === null)
                      .map((campo) => (
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
                            inputMode={
                              campo.nombre === "dni" ? "numeric" : undefined
                            }
                            maxLength={
                              campo.nombre === "dni"
                                ? 8
                                : campo.nombre === "cuil"
                                  ? 15
                                  : undefined
                            }
                            min={campo.nombre === "antiguedad" ? 0 : undefined}
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
                ))}
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
                  disabled={guardando}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="btn-primario-gestion"
                  disabled={guardando}
                >
                  <i
                    className={`fa-solid ${
                      editando !== null ? "fa-floppy-disk" : "fa-user-plus"
                    }`}
                    aria-hidden="true"
                  />
                  {guardando
                    ? "Guardando..."
                    : editando !== null
                      ? "Guardar cambios"
                      : "Registrar preceptor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: asignar cursos agrupados por Año y Módulo */}
      {asignando && (
        <div
          className="modal-alumno-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setAsignando(null);
          }}
        >
          <div
            className="modal-alumno personal-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-asignar-cursos"
            style={{ maxWidth: "680px" }}
          >
            <div className="modal-alumno-header">
              <div>
                <h2 id="titulo-asignar-cursos">Asignar Módulos y Divisiones</h2>
              </div>
              <button
                type="button"
                className="btn-cerrar-modal"
                onClick={() => setAsignando(null)}
                aria-label="Cerrar"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="form-gestion">
              {Object.entries(cursosPorAnio).map(([anio, cursosDelAnio]) => {
                const modulosAnio = Array.from(
                  new Set(
                    cursosDelAnio.flatMap((c) =>
                      (c.modulos ?? []).map((m) => m.nombre),
                    ),
                  ),
                ).join(" y ");

                return (
                  <fieldset key={anio} style={{ marginBottom: "20px" }}>
                    <legend
                      style={{
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                        color: "#0369a1",
                      }}
                    >
                      {NOMBRES_ANIOS[anio] ?? `${anio}.º Año`}{" "}
                      {modulosAnio ? `(${modulosAnio})` : ""}
                    </legend>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: "12px",
                      }}
                    >
                      {cursosDelAnio.map((c) => {
                        const tildado = seleccion.includes(c.id);
                        const esDeOtro =
                          c.preceptor_id && c.preceptor_id !== asignando.id;
                        const textoModulos = (c.modulos ?? [])
                          .map((m) => m.nombre)
                          .join(" y ");

                        return (
                          <label
                            key={c.id}
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: "10px",
                              padding: "10px",
                              border: tildado
                                ? "2px solid #0284c7"
                                : "1px solid #cbd5e1",
                              borderRadius: "8px",
                              backgroundColor: tildado ? "#f0f9ff" : "#ffffff",
                              cursor: "pointer",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={tildado}
                              onChange={() => alternarCurso(c.id)}
                              style={{
                                marginTop: "3px",
                                width: "16px",
                                height: "16px",
                              }}
                            />
                            <div>
                              <strong style={{ fontSize: "0.95rem" }}>
                                División {c.division}
                              </strong>
                              {textoModulos && (
                                <span
                                  style={{
                                    display: "block",
                                    fontSize: "0.82rem",
                                    color: "#475569",
                                  }}
                                >
                                  {textoModulos}
                                </span>
                              )}
                              {esDeOtro && (
                                <small
                                  style={{
                                    color: "#d97706",
                                    display: "block",
                                    marginTop: "4px",
                                  }}
                                >
                                  A cargo de: {c.preceptor_apellido},{" "}
                                  {c.preceptor_nombre}
                                  {tildado ? " → reasignar" : ""}
                                </small>
                              )}
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}

              {errorAsignar && (
                <p className="mensaje-error" role="alert">
                  {errorAsignar}
                </p>
              )}

              <div className="acciones-formulario personal-acciones">
                <button
                  type="button"
                  className="btn-secundario"
                  onClick={() => setAsignando(null)}
                  disabled={guardandoAsig}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className="btn-primario-gestion"
                  onClick={guardarAsignacion}
                  disabled={guardandoAsig}
                >
                  {guardandoAsig ? "Guardando..." : "Guardar asignación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
