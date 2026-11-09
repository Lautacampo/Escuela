import { useEffect, useState } from "react";
import {
  getPlanEstudioActual,
  crearPlanEstudio,
  eliminarPlanEstudio,
  getMateriasPlan,
  crearMateriaPlan,
  getCicloLectivo,
} from "../services/planEstudiosService.js";

const MODULOS_BASE = [
  { moduloId: 1, nombre: "Módulo I", anio: 1 },
  { moduloId: 2, nombre: "Módulo II", anio: 1 },
  { moduloId: 3, nombre: "Módulo III", anio: 2 },
  { moduloId: 4, nombre: "Módulo IV", anio: 2 },
  { moduloId: 5, nombre: "Módulo V", anio: 3 },
  { moduloId: 6, nombre: "Módulo VI", anio: 3 },
];

export function PlanEstudios() {
  const [planActual, setPlanActual] = useState(null);
  const [planesInactivos, setPlanesInactivos] = useState([]);
  const [planSeleccionadoId, setPlanSeleccionadoId] = useState("actual");
  const [materiasDisponibles, setMateriasDisponibles] = useState([]);
  const [cicloActivo, setCicloActivo] = useState(null);
  const [filtroAnio, setFiltroAnio] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  // Modal de Crear Plan
  const [mostrarModal, setMostrarModal] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState("");
  const [nuevoPlan, setNuevoPlan] = useState({
    titulo: "",
    resolucion: "",
    orientacion: "Ciencias Sociales",
    anioInicio: 2026,
  });
  const [seleccionPorModulo, setSeleccionPorModulo] = useState({
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
    6: [],
  });

  // Alta rápida de materia dentro del modal
  const [nuevaMateriaNombre, setNuevaMateriaNombre] = useState("");
  const [creandoMateria, setCreandoMateria] = useState(false);

  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");
      const [datosPlanes, listaMat, datosCiclo] = await Promise.all([
        getPlanEstudioActual(),
        getMateriasPlan(),
        getCicloLectivo(),
      ]);

      setPlanActual(datosPlanes.planActual);
      setPlanesInactivos(datosPlanes.planesInactivos ?? []);
      setMateriasDisponibles(listaMat ?? []);
      setCicloActivo(datosCiclo?.cicloActivo ?? null);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // Determina qué plan se está visualizando en pantalla (el vigente o uno inactivo histórico)
  const planEnVista =
    planSeleccionadoId === "actual"
      ? planActual
      : (planesInactivos.find(
          (p) => String(p.id) === String(planSeleccionadoId),
        ) ?? planActual);

  const aniosVisibles = (planEnVista?.anios ?? []).filter(
    (curso) => !filtroAnio || curso.anio === Number(filtroAnio),
  );

  // Exporta el plan en vista como archivo CSV (compatible con Excel)
  const exportarPlanActual = () => {
    if (!planEnVista) return;

    const filas = [
      ["Plan de Estudios", planEnVista.titulo],
      ["Resolución / Decreto", planEnVista.resolucion],
      ["Orientación", planEnVista.orientacion],
      ["Estado", planEnVista.estado],
      ["Ciclo Lectivo", cicloActivo?.anio ?? 2026],
      [],
      ["Año", "Módulo", "Materia"],
    ];

    for (const bloqueAnio of planEnVista.anios ?? []) {
      for (const mod of bloqueAnio.modulos ?? []) {
        if ((mod.materias ?? []).length === 0) {
          filas.push([`${bloqueAnio.anio}º Año`, mod.nombre, "Sin materias"]);
        } else {
          for (const mat of mod.materias) {
            filas.push([`${bloqueAnio.anio}º Año`, mod.nombre, mat.nombre]);
          }
        }
      }
    }

    const contenidoCsv =
      "\uFEFF" +
      filas
        .map((fila) =>
          fila
            .map((celda) => `"${String(celda ?? "").replace(/"/g, '""')}"`)
            .join(";"),
        )
        .join("\n");

    const blob = new Blob([contenidoCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const nombreLimpio = planEnVista.titulo
      .toLowerCase()
      .replace(/[^a-z0-9]+/gi, "_");
    link.download = `plan_estudios_${nombreLimpio}_${planEnVista.estado.toLowerCase()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Abre el modal precargando las materias del plan actual para facilitar la creación
  const abrirModalNuevoPlan = () => {
    setErrorModal("");
    setNuevoPlan({
      titulo: "",
      resolucion: "",
      orientacion: "Ciencias Sociales",
      anioInicio: cicloActivo?.anio ?? 2026,
    });

    const preseleccion = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] };
    if (planActual?.anios) {
      for (const a of planActual.anios) {
        for (const m of a.modulos) {
          preseleccion[m.id] = (m.materias ?? []).map((mat) => mat.id);
        }
      }
    }
    setSeleccionPorModulo(preseleccion);
    setMostrarModal(true);
  };

  const alternarMateriaEnModulo = (moduloId, materiaId) => {
    setSeleccionPorModulo((prev) => {
      const actual = prev[moduloId] ?? [];
      const existe = actual.includes(materiaId);
      return {
        ...prev,
        [moduloId]: existe
          ? actual.filter((id) => id !== materiaId)
          : [...actual, materiaId],
      };
    });
  };

  const agregarNuevaMateria = async () => {
    if (!nuevaMateriaNombre.trim()) return;
    try {
      setCreandoMateria(true);
      setErrorModal("");
      const creada = await crearMateriaPlan({
        nombre: nuevaMateriaNombre.trim(),
      });
      setMateriasDisponibles((prev) =>
        [...prev, creada].sort((a, b) => a.nombre.localeCompare(b.nombre)),
      );
      setNuevaMateriaNombre("");
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setCreandoMateria(false);
    }
  };

  const guardarNuevoPlan = async (e) => {
    e.preventDefault();
    try {
      setGuardando(true);
      setErrorModal("");

      const modulosPayload = MODULOS_BASE.map((m) => ({
        moduloId: m.moduloId,
        materiasIds: seleccionPorModulo[m.moduloId] ?? [],
      }));

      await crearPlanEstudio({
        ...nuevoPlan,
        modulos: modulosPayload,
      });

      setMostrarModal(false);
      setPlanSeleccionadoId("actual");
      setAviso(
        "Nuevo plan de estudios creado como Vigente. El plan anterior pasó automáticamente a estado Inactivo.",
      );
      await cargarDatos();
    } catch (err) {
      setErrorModal(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const darDeBajaPlanActual = async () => {
    if (!planActual) return;
    const confirmar = window.confirm(
      `¿Desea dar de baja lógica el plan "${planActual.titulo}"?\n\nEl plan NO se borrará físicamente: pasará a estado INACTIVO para preservar el historial de los alumnos que continúan cursando bajo este plan.`,
    );
    if (!confirmar) return;

    try {
      setError("");
      const res = await eliminarPlanEstudio(planActual.id);
      setAviso(res.mensaje);
      await cargarDatos();
    } catch (err) {
      setError(err.message);
    }
  };

  if (cargando) return <p>Cargando plan de estudios...</p>;

  return (
    <div className="gestion-plan">
      {/* ENCABEZADO Y BOTONES */}
      <div className="pe-cabecera">
        <div>
          <h1>Plan de Estudios</h1>
          <p>
            Consultá las materias correspondientes a cada módulo{" "}
            {cicloActivo ? `· Ciclo Lectivo ${cicloActivo.anio}` : ""}.
          </p>
        </div>

        <div className="pe-acciones">
          <button
            type="button"
            className="pe-boton pe-secundario"
            onClick={exportarPlanActual}
            disabled={!planEnVista}
          >
            <i className="fa-solid fa-file-export" aria-hidden="true" />
            Exportar plan
          </button>

          <button
            type="button"
            className="pe-boton pe-principal"
            onClick={abrirModalNuevoPlan}
          >
            <i className="fa-solid fa-plus" aria-hidden="true" />
            Crear plan nuevo
          </button>

          <button
            type="button"
            className="pe-boton pe-peligro"
            onClick={darDeBajaPlanActual}
            disabled={!planActual}
          >
            <i className="fa-solid fa-box-archive" aria-hidden="true" />
            Dar de baja (Inactivar)
          </button>
        </div>
      </div>

      {aviso && (
        <div className="pe-aviso" role="status">
          <i className="fa-solid fa-circle-check" aria-hidden="true" /> {aviso}
        </div>
      )}

      {error && (
        <div className="pe-error" role="alert">
          {error}
        </div>
      )}

      {/* SELECTOR DE PLAN VIGENTE VS PLANES INACTIVOS (BAJA LÓGICA) */}
      <div className="pe-filtros" style={{ flexWrap: "wrap" }}>
        <label htmlFor="pe-selector-plan">Plan a visualizar:</label>
        <select
          id="pe-selector-plan"
          value={planSeleccionadoId}
          onChange={(e) => setPlanSeleccionadoId(e.target.value)}
          style={{ minWidth: "320px" }}
        >
          {planActual && (
            <option value="actual">
              [VIGENTE] {planActual.titulo} ({planActual.resolucion})
            </option>
          )}
          {planesInactivos.map((p) => (
            <option key={p.id} value={p.id}>
              [INACTIVO - Baja lógica] {p.titulo} ({p.resolucion})
            </option>
          ))}
        </select>

        <label htmlFor="pe-filtro-anio">Filtrar por año:</label>
        <select
          id="pe-filtro-anio"
          value={filtroAnio}
          onChange={(evento) => setFiltroAnio(evento.target.value)}
        >
          <option value="">Todos los años</option>
          {(planEnVista?.anios ?? []).map((curso) => (
            <option key={curso.anio} value={curso.anio}>
              {curso.anio}º año
            </option>
          ))}
        </select>
      </div>

      {/* INFORMACIÓN DEL PLAN EN VISTA */}
      {planEnVista ? (
        <>
          <div className="pe-resumen">
            <span
              className="pe-etiqueta"
              style={
                planEnVista.estado === "Inactivo"
                  ? { backgroundColor: "#fff1f2", color: "#a4161a" }
                  : undefined
              }
            >
              {planEnVista.estado === "Inactivo"
                ? "Plan Inactivo (Baja Lógica - Solo consulta para alumnos remanentes)"
                : "Plan de estudios actual (Vigente)"}
            </span>

            <h2>{planEnVista.titulo}</h2>

            <p>{planEnVista.resolucion}</p>

            <div className="pe-indicadores">
              <span>{planEnVista.anios?.length ?? 3} años</span>
              <span>6 módulos</span>
              <span>Orientación: {planEnVista.orientacion}</span>
              <span>Estado: {planEnVista.estado}</span>
            </div>
          </div>

          {/* MATERIAS SEPARADAS POR MÓDULO */}
          {aniosVisibles.map((curso) => (
            <div className="pe-anio" key={curso.anio}>
              <h2>{curso.anio}º año</h2>

              <div className="pe-grilla">
                {curso.modulos.map((modulo) => (
                  <article className="pe-tarjeta" key={modulo.id}>
                    <h3>{modulo.nombre}</h3>

                    <p className="pe-cantidad">
                      {modulo.materias.length} materias
                    </p>

                    <ul>
                      {modulo.materias.map((materia) => (
                        <li key={materia.id}>{materia.nombre}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </>
      ) : (
        <div className="pe-vacio">
          <i className="fa-solid fa-folder-open" aria-hidden="true" />
          <h2>No hay un plan de estudios vigente activo</h2>
          <p>
            Puede crear un nuevo plan de estudios o consultar los planes con
            baja lógica (estado Inactivo) en el selector superior.
          </p>
        </div>
      )}

      {/* HISTORIAL RESUMIDO DE PLANES INACTIVOS */}
      {planesInactivos.length > 0 && (
        <div className="pe-resumen" style={{ marginTop: "32px" }}>
          <h3>Historial de Planes con Baja Lógica (Inactivos)</h3>
          <p>
            Estos planes permanecen registrados en estado Inactivo para los
            alumnos que iniciaron su trayectoria antes del cambio de plan.
          </p>
          <ul style={{ margin: 0, paddingLeft: "20px" }}>
            {planesInactivos.map((plan) => (
              <li key={plan.id} style={{ marginBottom: "8px" }}>
                <strong>{plan.titulo}</strong> — {plan.resolucion} ·{" "}
                <span style={{ color: "#a4161a", fontWeight: 600 }}>
                  Estado: {plan.estado}
                </span>{" "}
                <button
                  type="button"
                  className="pe-boton pe-secundario"
                  style={{
                    minHeight: "30px",
                    padding: "4px 10px",
                    marginLeft: "10px",
                  }}
                  onClick={() => setPlanSeleccionadoId(String(plan.id))}
                >
                  Ver estructura
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* MODAL PARA CREAR NUEVO PLAN DE ESTUDIOS Y REGISTRAR MATERIAS */}
      {mostrarModal && (
        <div
          className="modal-alumno-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMostrarModal(false);
          }}
        >
          <div className="modal-alumno" style={{ maxWidth: "880px" }}>
            <div className="modal-alumno-header">
              <div>
                <h2>Crear Nuevo Plan de Estudios</h2>
                <p>
                  Al guardar este plan como Vigente, el plan anterior pasará a
                  estado Inactivo (baja lógica).
                </p>
              </div>
              <button
                type="button"
                className="btn-cerrar-modal"
                onClick={() => setMostrarModal(false)}
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <form className="form-gestion" onSubmit={guardarNuevoPlan}>
              <div className="pe-campos">
                <label className="pe-campo">
                  Título del Plan *
                  <input
                    type="text"
                    required
                    placeholder="Ej: Bachiller en Ciencias Sociales 2027"
                    value={nuevoPlan.titulo}
                    onChange={(e) =>
                      setNuevoPlan({ ...nuevoPlan, titulo: e.target.value })
                    }
                  />
                </label>

                <label className="pe-campo">
                  Resolución / Decreto *
                  <input
                    type="text"
                    required
                    placeholder="Ej: Decreto N.º 1420-ME-2026"
                    value={nuevoPlan.resolucion}
                    onChange={(e) =>
                      setNuevoPlan({ ...nuevoPlan, resolucion: e.target.value })
                    }
                  />
                </label>

                <label className="pe-campo">
                  Orientación
                  <input
                    type="text"
                    value={nuevoPlan.orientacion}
                    onChange={(e) =>
                      setNuevoPlan({
                        ...nuevoPlan,
                        orientacion: e.target.value,
                      })
                    }
                  />
                </label>

                <label className="pe-campo">
                  Año de inicio
                  <input
                    type="number"
                    value={nuevoPlan.anioInicio}
                    onChange={(e) =>
                      setNuevoPlan({ ...nuevoPlan, anioInicio: e.target.value })
                    }
                  />
                </label>
              </div>

              {/* Alta rápida de materia (#39 POST /api/materias) */}
              <div className="pe-configuracion">
                <strong>¿Falta alguna materia en el catálogo?</strong>
                <div style={{ display: "flex", gap: "10px", width: "100%" }}>
                  <input
                    type="text"
                    placeholder="Nombre de la nueva materia"
                    value={nuevaMateriaNombre}
                    onChange={(e) => setNuevaMateriaNombre(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="pe-boton pe-secundario"
                    onClick={agregarNuevaMateria}
                    disabled={creandoMateria}
                  >
                    {creandoMateria ? "Agregando..." : "Registrar materia"}
                  </button>
                </div>
              </div>

              {/* Selección de materias por cada Módulo */}
              <div className="pe-bloques">
                {MODULOS_BASE.map((mod) => (
                  <div className="pe-editor" key={mod.moduloId}>
                    <h3>
                      {mod.nombre} ({mod.anio}º Año) —{" "}
                      {(seleccionPorModulo[mod.moduloId] ?? []).length} materias
                      seleccionadas
                    </h3>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns:
                          "repeat(auto-fill, minmax(220px, 1fr))",
                        gap: "8px",
                      }}
                    >
                      {materiasDisponibles.map((mat) => {
                        const marcado = (
                          seleccionPorModulo[mod.moduloId] ?? []
                        ).includes(mat.id);
                        return (
                          <label key={mat.id} className="pe-checkbox">
                            <input
                              type="checkbox"
                              checked={marcado}
                              onChange={() =>
                                alternarMateriaEnModulo(mod.moduloId, mat.id)
                              }
                            />
                            <span>{mat.nombre}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {errorModal && (
                <div className="pe-error" role="alert">
                  {errorModal}
                </div>
              )}

              <div className="pe-pie-formulario">
                <button
                  type="button"
                  className="pe-boton pe-secundario"
                  onClick={() => setMostrarModal(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="pe-boton pe-principal"
                  disabled={guardando}
                >
                  {guardando ? "Guardando plan..." : "Guardar Plan de Estudios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
