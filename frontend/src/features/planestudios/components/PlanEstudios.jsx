import { useEffect, useState } from "react";
import {
  getPlanEstudioActual,
  eliminarPlanEstudio,
  reactivarPlanEstudio,
  getCicloLectivo,
} from "../services/planEstudiosService.js";

// Los planes nuevos los carga el soporte técnico: la estructura curricular
// cambia de un plan a otro y afecta materias, docentes y calificaciones.
const EMAIL_SOPORTE = "soporte3tomasbaras@gmail.com";

export function PlanEstudios() {
  const [planActual, setPlanActual] = useState(null);
  const [planesInactivos, setPlanesInactivos] = useState([]);
  const [planSeleccionadoId, setPlanSeleccionadoId] = useState("actual");
  const [cicloActivo, setCicloActivo] = useState(null);
  const [filtroAnio, setFiltroAnio] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState("");

  // Aviso de "Crear plan nuevo": deriva al soporte técnico.
  const [mostrarAvisoSoporte, setMostrarAvisoSoporte] = useState(false);

  const aplicarDatos = ([datosPlanes, datosCiclo]) => {
    setPlanActual(datosPlanes.planActual);
    setPlanesInactivos(datosPlanes.planesInactivos ?? []);
    setCicloActivo(datosCiclo?.cicloActivo ?? null);
  };

  const pedirDatos = () =>
    Promise.all([getPlanEstudioActual(), getCicloLectivo()]);

  // Recarga después de una baja o una reactivación.
  const cargarDatos = async () => {
    try {
      setCargando(true);
      setError("");
      aplicarDatos(await pedirDatos());
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  // Carga inicial: el estado se actualiza recién cuando llegan los datos.
  useEffect(() => {
    let activo = true;
    Promise.all([getPlanEstudioActual(), getCicloLectivo()])
      .then(([datosPlanes, datosCiclo]) => {
        if (!activo) return;
        setPlanActual(datosPlanes.planActual);
        setPlanesInactivos(datosPlanes.planesInactivos ?? []);
        setCicloActivo(datosCiclo?.cicloActivo ?? null);
      })
      .catch((err) => activo && setError(err.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
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

  // Un plan inactivo puede volver a estar vigente. Como solo hay un plan
  // vigente a la vez, el que lo esté en ese momento pasa a inactivo.
  const reactivarPlan = async (plan) => {
    const confirmar = window.confirm(
      planActual
        ? `¿Desea reactivar el plan "${plan.titulo}"?\n\nPasará a estado VIGENTE y el plan vigente actual ("${planActual.titulo}") pasará a estado INACTIVO.`
        : `¿Desea reactivar el plan "${plan.titulo}"?\n\nPasará a estado VIGENTE.`,
    );
    if (!confirmar) return;

    try {
      setError("");
      const res = await reactivarPlanEstudio(plan.id);
      setAviso(res.mensaje);
      setPlanSeleccionadoId("actual");
      await cargarDatos();
    } catch (err) {
      setAviso("");
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
            onClick={() => setMostrarAvisoSoporte(true)}
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
          // En celular no puede ser más ancho que la pantalla.
          style={{ minWidth: "min(320px, 100%)" }}
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
                <button
                  type="button"
                  className="pe-boton pe-principal"
                  style={{
                    minHeight: "30px",
                    padding: "4px 10px",
                    marginLeft: "8px",
                  }}
                  onClick={() => reactivarPlan(plan)}
                >
                  <i className="fa-solid fa-rotate-left" aria-hidden="true" />{" "}
                  Reactivar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* AVISO: los planes nuevos se cargan a través del soporte técnico */}
      {mostrarAvisoSoporte && (
        <div
          className="modal-alumno-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setMostrarAvisoSoporte(false);
          }}
        >
          <div
            className="modal-alumno"
            style={{ maxWidth: "560px" }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-aviso-soporte"
          >
            <div className="modal-alumno-header">
              <div>
                <h2 id="titulo-aviso-soporte">Crear un nuevo plan de estudios</h2>
                <p>Los planes nuevos los registra el soporte técnico.</p>
              </div>
              <button
                type="button"
                className="btn-cerrar-modal"
                aria-label="Cerrar"
                onClick={() => setMostrarAvisoSoporte(false)}
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div className="form-gestion">
              <p>
                Para informar un nuevo plan de estudios, comuníquese con el
                soporte técnico indicando la resolución o decreto y las
                materias de cada módulo:
              </p>
              <p style={{ margin: "16px 0", fontSize: "1.05rem" }}>
                <i className="fa-solid fa-envelope" aria-hidden="true" />{" "}
                <a href={`mailto:${EMAIL_SOPORTE}`}>
                  <strong>{EMAIL_SOPORTE}</strong>
                </a>
              </p>
              <p>
                El soporte cargará el plan y lo dejará vigente. El plan actual
                no se modifica mientras tanto.
              </p>

              <div className="acciones-formulario">
                <button
                  type="button"
                  className="pe-boton pe-principal"
                  onClick={() => setMostrarAvisoSoporte(false)}
                >
                  Entendido
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
