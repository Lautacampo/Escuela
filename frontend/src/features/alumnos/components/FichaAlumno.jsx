import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  getAlumno,
  getCursos,
  quitarEquivalencia,
  registrarEquivalencias,
} from "../services/AlumnosServices";
import { crearEvaluacionModulo } from "../services/EvaluacionesModuloService";
import {
  DESCRIPCION_MOTIVO_LIBRE,
  analizarMatricula,
  catalogoDeModulos,
  esLibre,
  listar,
  ultimaCursada,
} from "../utils/correlatividades";

const NOMBRE_CURSO = {
  1: "1° Año",
  2: "2° Año",
  3: "3° Año",
};

function calcularEdad(fechaNacimiento) {
  if (!fechaNacimiento) return "-";

  const nacimiento = new Date(fechaNacimiento);
  const hoy = new Date();

  let edad = hoy.getFullYear() - nacimiento.getFullYear();

  const noCumplioEsteAnio =
    hoy.getMonth() < nacimiento.getMonth() ||
    (hoy.getMonth() === nacimiento.getMonth() &&
      hoy.getDate() < nacimiento.getDate());

  if (noCumplioEsteAnio) {
    edad--;
  }

  return `${edad} años`;
}

function formatearFecha(fecha) {
  if (!fecha) return "-";

  const partes = fecha.split("-");

  if (partes.length !== 3) return fecha;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function fechaActual() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");

  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

function obtenerTipoInstancia(nroInstancia) {
  if (nroInstancia === 1) return "COLEGIADA";
  if (nroInstancia === 4) return "ESPECIAL";
  if (nroInstancia === 2 || nroInstancia === 3) return "CALENDARIO";

  return "";
}

function formatearCondicion(condicion) {
  if (!condicion) return "-";

  const texto = String(condicion).toLowerCase();
  return `${texto[0].toUpperCase()}${texto.slice(1)}`;
}

const ETIQUETA_ESTADO = {
  EN_CURSO: "En curso",
  PENDIENTE: "Pendiente",
  APROBADO: "Aprobado",
  A_RECURSAR: "Libre · a recursar",
};

function formatearEstadoAcademico(estado) {
  if (!estado) return "Sin estado";
  return ETIQUETA_ESTADO[String(estado).toUpperCase()] ?? estado;
}

// Cursadas que todavía pueden recibir una evaluación de módulo.
const ESTADOS_ABIERTOS = ["EN_CURSO", "PENDIENTE"];

function motivoLibre(cursada) {
  return (
    DESCRIPCION_MOTIVO_LIBRE[cursada?.motivoLibre] ?? "perdió la regularidad"
  );
}

function obtenerResultadoEvaluacion(nota) {
  if (nota === null || nota === undefined || nota === "") {
    return "Sin calificación";
  }

  return Number(nota) >= 7 ? "Aprobado" : "Desaprobado";
}

export function FichaAlumno() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [alumno, setAlumno] = useState(location.state?.alumno ?? null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [cursos, setCursos] = useState([]);
  // Cursada elegida para calificar (por defecto, la activa).
  const [cursadaElegida, setCursadaElegida] = useState(null);
  const [evaluacion, setEvaluacion] = useState({
    fecha: fechaActual(),
    nota: "",
  });
  const [guardandoEvaluacion, setGuardandoEvaluacion] = useState(false);
  const [errorEvaluacion, setErrorEvaluacion] = useState("");
  const [evaluacionGuardada, setEvaluacionGuardada] = useState(null);
  const [equivalencia, setEquivalencia] = useState({
    moduloId: "",
    observacion: "",
  });
  const [guardandoEquivalencia, setGuardandoEquivalencia] = useState(false);
  const [errorEquivalencia, setErrorEquivalencia] = useState("");

  useEffect(() => {
    let activa = true;

    async function cargarAlumno() {
      try {
        // GET /alumnos/:id trae, por cada cursada, sus materias, los
        // correlativos pendientes y si admite una evaluación de módulo.
        const [alumnoDesdeApi, cursosDesdeApi] = await Promise.all([
          getAlumno(id),
          getCursos().catch(() => []),
        ]);

        if (activa) {
          setAlumno(alumnoDesdeApi);
          setCursos(cursosDesdeApi);
        }
      } catch (e) {
        if (activa) {
          setError(e.message);
        }
      } finally {
        if (activa) {
          setCargando(false);
        }
      }
    }

    cargarAlumno();

    return () => {
      activa = false;
    };
  }, [id]);

  async function guardarEvaluacion(e) {
    e.preventDefault();
    setErrorEvaluacion("");
    setEvaluacionGuardada(null);

    if (!cursadaParaCalificar?.evaluable) {
      setErrorEvaluacion(
        cursadaParaCalificar?.bloqueoEvaluacion ??
          "Esta cursada no admite una evaluación de módulo.",
      );
      return;
    }

    const payload = {
      idCursadaModulo: Number(cursadaParaCalificar.idCursada),
      fecha: evaluacion.fecha,
      nota: Number(evaluacion.nota),
      nroInstancia: cursadaParaCalificar.proximaInstancia,
      tipoInstancia: obtenerTipoInstancia(cursadaParaCalificar.proximaInstancia),
    };

    if (
      evaluacion.nota === "" ||
      !Number.isFinite(payload.nota) ||
      payload.nota < 0 ||
      payload.nota > 10
    ) {
      setErrorEvaluacion("La nota debe ser un número entre 0 y 10.");
      return;
    }

    try {
      setGuardandoEvaluacion(true);
      const respuesta = await crearEvaluacionModulo(payload);
      setEvaluacionGuardada({
        ...payload,
        ...respuesta,
        modulo: cursadaParaCalificar.modulo,
      });
      setEvaluacion({ fecha: fechaActual(), nota: "" });

      try {
        setAlumno(await getAlumno(id));
      } catch (errorActualizacion) {
        setErrorEvaluacion(
          `La nota se guardó, pero no se pudo actualizar la trayectoria: ${errorActualizacion.message}`,
        );
      }
    } catch (e) {
      setErrorEvaluacion(e.message);
    } finally {
      setGuardandoEvaluacion(false);
    }
  }

  async function guardarEquivalencia(e) {
    e.preventDefault();
    setErrorEquivalencia("");

    if (!equivalencia.moduloId) {
      setErrorEquivalencia("Seleccioná el módulo a acreditar.");
      return;
    }

    try {
      setGuardandoEquivalencia(true);
      setAlumno(
        await registrarEquivalencias(
          id,
          [Number(equivalencia.moduloId)],
          equivalencia.observacion.trim(),
        ),
      );
      setEquivalencia({ moduloId: "", observacion: "" });
    } catch (e) {
      setErrorEquivalencia(e.message);
    } finally {
      setGuardandoEquivalencia(false);
    }
  }

  async function eliminarEquivalencia(item) {
    const confirmar = window.confirm(
      `¿Quitar la equivalencia de ${item.modulo}?`,
    );
    if (!confirmar) return;

    setErrorEquivalencia("");
    try {
      setGuardandoEquivalencia(true);
      setAlumno(await quitarEquivalencia(id, item.moduloId));
    } catch (e) {
      setErrorEquivalencia(e.message);
    } finally {
      setGuardandoEquivalencia(false);
    }
  }

  if (cargando) {
    return <p>Cargando ficha del alumno...</p>;
  }

  if (error) {
    return (
      <div className="ficha-no-encontrada" role="alert">
        <i className="fa-solid fa-circle-exclamation"></i>
        <h2>No se pudo cargar la ficha</h2>
        <p>{error}</p>
        <button
          type="button"
          className="btn-primario-gestion"
          onClick={() => navigate("/gestion/alumnos")}
        >
          <i className="fa-solid fa-arrow-left"></i>
          Volver al listado
        </button>
      </div>
    );
  }

  if (!alumno) {
    return (
      <div className="ficha-no-encontrada">
        <i className="fa-solid fa-user-xmark"></i>
        <h2>Alumno no encontrado</h2>

        <p>No se encontró la información del alumno solicitado.</p>

        <button
          type="button"
          className="btn-primario-gestion"
          onClick={() => navigate("/gestion/alumnos")}
        >
          <i className="fa-solid fa-arrow-left"></i>
          Volver al listado
        </button>
      </div>
    );
  }

  const trayectoria = Array.isArray(alumno.trayectoria)
    ? alumno.trayectoria
    : [];
  const equivalencias = Array.isArray(alumno.equivalencias)
    ? alumno.equivalencias
    : [];
  const cursadaActiva = trayectoria.find((cursada) => cursada.activa);
  // Se puede calificar la cursada activa y también una anterior que siga
  // abierta (ej.: Módulo I pendiente mientras ya cursa el Módulo II).
  const cursadasCalificables = trayectoria.filter(
    (cursada) =>
      cursada.activa || ESTADOS_ABIERTOS.includes(cursada.estadoAcademico),
  );
  const cursadaParaCalificar =
    cursadasCalificables.find(
      (cursada) => String(cursada.idCursada) === String(cursadaElegida),
    ) ??
    cursadaActiva ??
    cursadasCalificables[0] ??
    null;
  const moduloActual = alumno.moduloActual ?? cursadaActiva?.modulo;
  const alumnoLibre = esLibre(alumno.condicion);

  // Módulos que admiten equivalencia: nunca cursados, sin acreditar y con sus
  // propios correlativos ya acreditados.
  const catalogo = catalogoDeModulos(cursos);
  const modulosParaEquivalencia = Object.values(catalogo)
    .sort((a, b) => a.id - b.id)
    .filter((modulo) => {
      if (ultimaCursada(alumno, modulo.id)) return false;
      const analisis = analizarMatricula(alumno, modulo.id, catalogo);
      return (
        !analisis.yaAcreditado &&
        analisis.bloqueantes.length === 0 &&
        analisis.porEquivalencia.length === 0
      );
    });
  const faltasActuales = alumno.faltas ?? alumno.faltasAcumuladas;
  const condicionActual = formatearCondicion(alumno.condicion);
  const datosAcademicos =
    trayectoria.length > 0
      ? trayectoria.map((cursada, index) => ({
          id: cursada.idCursada ?? cursada.cursadaModuloId ?? index,
          modulo: cursada.modulo ?? "Módulo sin nombre",
          año:
            NOMBRE_CURSO[String(cursada.anioCurso)] ??
            (cursada.anioCurso ? `${cursada.anioCurso}° Año` : "-"),
          estado: formatearEstadoAcademico(cursada.estadoAcademico),
          cicloLectivo: cursada.cicloLectivo,
          periodoDictado: cursada.periodoDictado,
          division: cursada.division,
          activa: cursada.activa,
          motivoLibre: esLibre(cursada.condicion) ? motivoLibre(cursada) : null,
          // Nota con la que acreditó el módulo (si lo aprobó).
          nota:
            (cursada.evaluaciones ?? []).find(
              (evaluacion) => Number(evaluacion.nota) >= 7,
            )?.nota ?? null,
          faltas: cursada.faltas ?? cursada.cantidadFaltasAcumuladas ?? null,
          condicion: formatearCondicion(cursada.condicion),
          instancias: (cursada.evaluaciones ?? cursada.instancias ?? []).map(
            (evaluacion) => ({
              ...evaluacion,
              resultado: obtenerResultadoEvaluacion(evaluacion.nota),
            }),
          ),
        }))
      : moduloActual
        ? [
            {
              id: alumno.cursadaModuloId ?? "actual",
              modulo: moduloActual,
              año:
                NOMBRE_CURSO[String(alumno.curso ?? alumno.anioCurso)] ?? "-",
              estado: "En curso",
              nota: null,
              faltas: faltasActuales,
              condicion: condicionActual,
              instancias: null,
            },
          ]
        : [];
  const historialTieneInstancias = trayectoria.some(
    (cursada) =>
      Array.isArray(cursada.evaluaciones) || Array.isArray(cursada.instancias),
  );
  const modulosAprobados = datosAcademicos.filter(
    (modulo) => modulo.estado.toLowerCase() === "aprobado",
  ).length;
  const modulosAcreditados = modulosAprobados + equivalencias.length;
  const totalFaltas = datosAcademicos.reduce(
    (total, modulo) => total + (Number(modulo.faltas) || 0),
    0,
  );
  const tieneDatosPersonales = [
    "fechaNacimiento",
    "cuil",
    "lugarNacimiento",
    "domicilio",
    "telefono",
    "email",
    "telefonoEmergencia",
    "cantidadHijos",
    "trabaja",
  ].some((campo) => alumno[campo] !== undefined && alumno[campo] !== null);

  return (
    <div className="ficha-alumno">
      <div className="ficha-cabecera">
        <button
          type="button"
          className="btn-volver"
          onClick={() => navigate("/gestion/alumnos")}
        >
          <i className="fa-solid fa-arrow-left"></i>
          Volver
        </button>

        <div className="ficha-titulo">
          <div className="ficha-avatar">
            <i className="fa-solid fa-user"></i>
          </div>

          <div>
            <h1>
              {alumno.apellido}, {alumno.nombre}
            </h1>

            <p>
              DNI {alumno.dni}
              {" · "}
              {NOMBRE_CURSO[alumno.curso] || "Sin curso"}
              {alumno.division && ` - División ${alumno.division}`}
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-secundario"
          onClick={() =>
            navigate("/gestion/alumnos", { state: { editarAlumno: alumno } })
          }
        >
          Editar datos
        </button>
      </div>

      <div className="ficha-resumen">
        <div className="ficha-resumen-item">
          <span className="ficha-resumen-icono">
            <i className="fa-solid fa-book"></i>
          </span>

          <div>
            <span>Módulo actual</span>
            <strong>{alumno.moduloActual || "-"}</strong>
          </div>
        </div>

        <div className="ficha-resumen-item">
          <span className="ficha-resumen-icono">
            <i className="fa-solid fa-graduation-cap"></i>
          </span>

          <div>
            <span>Módulos acreditados</span>
            <strong>
              {modulosAcreditados} de 6
              {equivalencias.length > 0 &&
                ` (${equivalencias.length} por equivalencia)`}
            </strong>
          </div>
        </div>

        <div className="ficha-resumen-item">
          <span className="ficha-resumen-icono">
            <i className="fa-solid fa-calendar-xmark"></i>
          </span>

          <div>
            <span>Faltas acumuladas</span>
            <strong>
              {datosAcademicos.length > 0
                ? totalFaltas
                : (faltasActuales ?? "-")}
            </strong>
          </div>
        </div>

        <div className="ficha-resumen-item">
          <span className="ficha-resumen-icono">
            <i className="fa-solid fa-user-check"></i>
          </span>

          <div>
            <span>Condición actual</span>

            <strong className={alumnoLibre ? "texto-libre" : "texto-regular"}>
              {condicionActual}
            </strong>
          </div>
        </div>
      </div>

      <section className="ficha-seccion">
        <div className="ficha-seccion-titulo">
          <i className="fa-solid fa-id-card"></i>
          <div>
            <h2>Datos personales</h2>
            <p>Informacion personal del estudiante.</p>
          </div>
        </div>

        {!tieneDatosPersonales && (
          <div className="ficha-advertencia" role="status">
            <i className="fa-solid fa-circle-info"></i>
            <div>
              <strong>Datos personales no disponibles</strong>
              <p>
                La respuesta de GET /api/alumnos no incluye estos campos. Cuando
                el backend los devuelva, aparecerán aquí automáticamente.
              </p>
            </div>
          </div>
        )}

        <div className="ficha-datos-grid">
          <Dato label="Nombre" valor={alumno.nombre}></Dato>
          <Dato label="Apellido" valor={alumno.apellido}></Dato>
          <Dato label="DNI" valor={alumno.dni}></Dato>
          <Dato
            label="Fecha de nacimiento"
            valor={formatearFecha(alumno.fechaNacimiento)}
          ></Dato>
          <Dato
            label="Edad"
            valor={calcularEdad(alumno.fechaNacimiento)}
          ></Dato>
          <Dato label="CUIL" valor={alumno.cuil}></Dato>
          <Dato
            label="Lugar de nacimiento"
            valor={alumno.lugarNacimiento}
          ></Dato>
          <Dato label="Domicilio" valor={alumno.domicilio}></Dato>
          <Dato label="Teléfono" valor={alumno.telefono}></Dato>
          <Dato label="Correo electrónico" valor={alumno.email}></Dato>
          <Dato
            label="Teléfono de emergencia"
            valor={alumno.telefonoEmergencia}
          ></Dato>
          <Dato label="Cantidad de hijos" valor={alumno.cantidadHijos}></Dato>
          <Dato
            label="Situación laboral"
            valor={alumno.trabaja ? "Trabaja" : "No trabaja"}
          ></Dato>
        </div>
      </section>

      <section className="ficha-seccion">
        <div className="ficha-seccion-titulo">
          <i className="fa-solid fa-school"></i>
          <div>
            <h2>Situación académica</h2>
            <p>Estado actual dentro de la trayectoria educativa.</p>
          </div>
        </div>

        <div className="ficha-academica-info">
          <div>
            <span>Curso</span>
            <strong>{NOMBRE_CURSO[alumno.curso] || "-"}</strong>
          </div>

          <div>
            <span>División</span>
            <strong>{alumno.division || "-"}</strong>
          </div>

          <div>
            <span>Módulo actual</span>
            <strong>{alumno.moduloActual || "-"}</strong>
          </div>

          <div>
            <span>Condición</span>
            <strong className={alumnoLibre ? "texto-libre" : "texto-regular"}>
              {condicionActual}
            </strong>
          </div>
        </div>

        {alumnoLibre && (
          <div className="ficha-advertencia ficha-libre" role="status">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <div>
              <strong>Alumno LIBRE en {moduloActual}</strong>
              <p>
                El alumno {motivoLibre(alumno)}. No puede rendir la evaluación
                del módulo y debe recursarlo en su próximo dictado
                {cursadaActiva?.periodoDictado
                  ? ` (${cursadaActiva.periodoDictado})`
                  : ""}
                . Para inscribirlo de nuevo: Editar datos → Editar matrícula →
                elegir {moduloActual}.
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="ficha-seccion">
        <div className="ficha-seccion-titulo">
          <i className="fa-solid fa-pen-to-square"></i>
          <div>
            <h2>Calificar módulo</h2>
            <p>
              Registrar una instancia de acreditación para{" "}
              {cursadaParaCalificar?.modulo ?? "el módulo"}.
            </p>
          </div>
        </div>

        {cursadasCalificables.length > 1 && (
          <label className="ficha-selector-cursada">
            <span>Módulo a calificar</span>
            <select
              className="input-gestion"
              value={cursadaParaCalificar?.idCursada ?? ""}
              onChange={(e) => {
                setCursadaElegida(e.target.value);
                setErrorEvaluacion("");
                setEvaluacionGuardada(null);
              }}
            >
              {cursadasCalificables.map((cursada) => (
                <option key={cursada.idCursada} value={cursada.idCursada}>
                  {cursada.modulo} · ciclo {cursada.cicloLectivo} ·{" "}
                  {formatearEstadoAcademico(cursada.estadoAcademico)}
                  {cursada.activa ? " (cursada actual)" : ""}
                </option>
              ))}
            </select>
          </label>
        )}

        {!cursadaParaCalificar ? (
          <div className="ficha-advertencia" role="status">
            <i className="fa-solid fa-circle-info"></i>
            <div>
              <strong>Sin cursada para calificar</strong>
              <p>
                El alumno no tiene una matrícula vigente. Creala desde
                &quot;Editar datos&quot;.
              </p>
            </div>
          </div>
        ) : cursadaParaCalificar.estadoAcademico === "APROBADO" ? (
          <div className="ficha-evaluacion-guardada" role="status">
            <i className="fa-solid fa-circle-check"></i>
            {cursadaParaCalificar.modulo} ya está aprobado.
          </div>
        ) : esLibre(cursadaParaCalificar.condicion) ? (
          <div className="ficha-advertencia ficha-libre" role="status">
            <i className="fa-solid fa-triangle-exclamation"></i>
            <div>
              <strong>Alumno LIBRE: no puede rendir este módulo</strong>
              <p>
                El alumno {motivoLibre(cursadaParaCalificar)}. Debe recursar{" "}
                {cursadaParaCalificar.modulo}.
              </p>
            </div>
          </div>
        ) : cursadaParaCalificar.correlativosPendientes?.length > 0 ? (
          <div className="ficha-advertencia" role="status">
            <i className="fa-solid fa-circle-exclamation"></i>
            <div>
              <strong>Correlatividades pendientes</strong>
              <p>
                Para acreditar {cursadaParaCalificar.modulo} el alumno debe
                tener aprobados{" "}
                {listar(
                  cursadaParaCalificar.correlativosPendientes.map(
                    (modulo) => modulo.nombre,
                  ),
                )}
                .
              </p>
            </div>
          </div>
        ) : cursadaParaCalificar.materiasPendientes?.length > 0 ? (
          <div
            className="ficha-advertencia ficha-materias-pendientes"
            role="status"
          >
            <i className="fa-solid fa-circle-exclamation"></i>
            <div>
              <strong>Materias pendientes de aprobación</strong>
              <p>Para calificar este módulo, primero se deben aprobar:</p>
              <ul>
                {cursadaParaCalificar.materiasPendientes.map((materia) => (
                  <li key={materia.id}>
                    <strong>{materia.nombre}</strong>:{" "}
                    {materia.estado === "En Curso"
                      ? "Sin calificar"
                      : materia.estado}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : !cursadaParaCalificar.evaluable ? (
          <div className="ficha-advertencia" role="status">
            <i className="fa-solid fa-circle-exclamation"></i>
            <div>
              <strong>No se puede registrar la evaluación</strong>
              <p>{cursadaParaCalificar.bloqueoEvaluacion}</p>
            </div>
          </div>
        ) : (
          <form className="ficha-evaluacion-form" onSubmit={guardarEvaluacion}>
            <label>
              <span>Nota (0 a 10) *</span>
              <input
                className="input-gestion"
                type="number"
                name="nota"
                min="0"
                max="10"
                step="0.01"
                value={evaluacion.nota}
                onChange={(e) =>
                  setEvaluacion((anterior) => ({
                    ...anterior,
                    nota: e.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              <span>Fecha *</span>
              <input
                className="input-gestion"
                type="date"
                name="fecha"
                value={evaluacion.fecha}
                onChange={(e) =>
                  setEvaluacion((anterior) => ({
                    ...anterior,
                    fecha: e.target.value,
                  }))
                }
                required
              />
            </label>

            <label>
              <span>Instancia (de 4)</span>
              <input
                className="input-gestion"
                type="number"
                name="nroInstancia"
                value={cursadaParaCalificar.proximaInstancia}
                readOnly
              />
            </label>

            <label>
              <span>Tipo de instancia (automático)</span>
              <input
                className="input-gestion"
                type="text"
                value={obtenerTipoInstancia(
                  cursadaParaCalificar.proximaInstancia,
                )}
                readOnly
              />
            </label>

            {cursadaParaCalificar.proximaInstancia === 4 && (
              <p className="ficha-aviso-ultima-instancia">
                Es la última instancia: si no aprueba (nota menor a 7) el
                alumno queda LIBRE y debe recursar el módulo.
              </p>
            )}

            <button
              className="btn-primario-gestion"
              type="submit"
              disabled={guardandoEvaluacion}
            >
              {guardandoEvaluacion ? "Guardando..." : "Guardar calificación"}
            </button>
          </form>
        )}

        {errorEvaluacion && (
          <div
            className="ficha-advertencia ficha-evaluacion-mensaje"
            role="alert"
          >
            <i className="fa-solid fa-circle-exclamation"></i>
            <p>{errorEvaluacion}</p>
          </div>
        )}

        {evaluacionGuardada && (
          <div className="ficha-evaluacion-guardada" role="status">
            <i className="fa-solid fa-circle-check" aria-hidden="true"></i>
            <div>
              <strong>Evaluación registrada correctamente</strong>
              <p>
                Se guardó la nota <strong>{evaluacionGuardada.nota}</strong>{" "}
                de {evaluacionGuardada.modulo}, instancia{" "}
                {evaluacionGuardada.nroInstancia} (
                {evaluacionGuardada.tipoInstancia}), con fecha{" "}
                {formatearFecha(evaluacionGuardada.fecha)}.{" "}
                {evaluacionGuardada.aprobado
                  ? "El módulo quedó APROBADO."
                  : esLibre(evaluacionGuardada.condicion)
                    ? "El alumno agotó las 4 instancias: queda LIBRE y debe recursar el módulo."
                    : "El módulo queda pendiente: todavía tiene instancias disponibles."}
              </p>
            </div>
          </div>
        )}
      </section>

      <section className="ficha-seccion">
        <div className="ficha-seccion-titulo">
          <i className="fa-solid fa-route"></i>
          <div>
            <h2>Trayectoria académica</h2>
            <p>Historial de los módulos cursados y sus resultados.</p>
          </div>
        </div>

        <div className="trayectoria">
          {datosAcademicos.length === 0 ? (
            <div className="ficha-advertencia" role="status">
              <i className="fa-solid fa-circle-info"></i>
              <div>
                <strong>No hay trayectoria académica disponible</strong>
                <p>
                  El GET del alumno no devolvió módulos cursados para mostrar en
                  la trayectoria.
                </p>
              </div>
            </div>
          ) : (
            <>
              {!historialTieneInstancias && (
                <div className="ficha-advertencia" role="status">
                  <i className="fa-solid fa-circle-info"></i>
                  <div>
                    <strong>Detalle de instancias no disponible</strong>
                    <p>
                      Se muestra el estado real de cada cursada. La respuesta de
                      trayectoria todavía no incluye las evaluaciones rendidas,
                      por lo que no es posible mostrar sus fechas y notas.
                    </p>
                  </div>
                </div>
              )}
              {datosAcademicos.map((modulo) => (
                <div className="modulo-trayectoria" key={modulo.id}>
                  <div className="modulo-indicador">
                    <span></span>
                  </div>

                  <div className="modulo-contenido">
                    <div className="modulo-cabecera">
                      <div>
                        <span className="modulo-año">
                          {modulo.año}
                          {modulo.division ? ` · División ${modulo.division}` : ""}
                          {modulo.cicloLectivo
                            ? ` · Ciclo ${modulo.cicloLectivo}`
                            : ""}
                          {modulo.periodoDictado
                            ? ` · ${modulo.periodoDictado}`
                            : ""}
                        </span>

                        <h3>
                          {modulo.modulo}
                          {modulo.activa ? " (cursada actual)" : ""}
                        </h3>
                      </div>

                      <EstadoModulo estado={modulo.estado} />
                    </div>

                    <div className="modulo-detalles">
                      <div>
                        <span>Calificación final</span>
                        <strong>{modulo.nota ?? "-"}</strong>
                      </div>

                      <div>
                        <span>Faltas</span>
                        <strong>{modulo.faltas}</strong>
                      </div>

                      <div>
                        <span>Condición</span>
                        <strong>{modulo.condicion}</strong>
                      </div>

                      <div>
                        <span>Instancias utilizadas</span>
                        <strong>{modulo.instancias?.length ?? "-"}</strong>
                      </div>
                    </div>

                    {modulo.motivoLibre && (
                      <p className="modulo-motivo-libre">
                        <i className="fa-solid fa-triangle-exclamation"></i>{" "}
                        Quedó libre porque {modulo.motivoLibre}. Debe recursar
                        el módulo.
                      </p>
                    )}

                    {modulo.instancias?.length > 0 && (
                      <div className="instancias-acreditacion">
                        <h4>
                          <i className="fa solid fa-clipboard-check"></i>
                          Instancias de acreditación
                        </h4>

                        {modulo.instancias.map((instancia, index) => (
                          <div className="instancia" key={index}>
                            <span>
                              Instancia{" "}
                              {instancia.nroInstancia ??
                                instancia.numero ??
                                "-"}
                              {instancia.tipoInstancia
                                ? ` · ${instancia.tipoInstancia}`
                                : ""}
                            </span>

                            <span>{formatearFecha(instancia.fecha)}</span>

                            <strong
                              className={
                                instancia.resultado === "Aprobado"
                                  ? "resultado-instancia-aprobada"
                                  : instancia.resultado === "Desaprobado"
                                    ? "resultado-instancia-desaprobada"
                                    : ""
                              }
                            >
                              Nota: {instancia.nota ?? "-"} —{" "}
                              {instancia.resultado}
                            </strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </section>

      <section className="ficha-seccion">
        <div className="ficha-seccion-titulo">
          <i className="fa-solid fa-right-left"></i>
          <div>
            <h2>Equivalencias</h2>
            <p>
              Módulos acreditados en otra institución (Res. N.º 195-ME-2024).
              Cuentan como aprobados para las correlatividades.
            </p>
          </div>
        </div>

        {equivalencias.length === 0 ? (
          <p className="ficha-sin-equivalencias">
            El alumno no tiene módulos acreditados por equivalencia.
          </p>
        ) : (
          <div className="tabla-responsive">
            <table className="tabla-gestion">
              <thead>
                <tr>
                  <th>Módulo</th>
                  <th>Fecha de registro</th>
                  <th>Observación</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {equivalencias.map((item) => (
                  <tr key={item.moduloId}>
                    <td>
                      <strong>{item.modulo}</strong>
                    </td>
                    <td>{formatearFecha(item.fecha)}</td>
                    <td>{item.observacion || "—"}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-secundario"
                        disabled={guardandoEquivalencia}
                        onClick={() => eliminarEquivalencia(item)}
                      >
                        Quitar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modulosParaEquivalencia.length > 0 && (
          <form
            className="ficha-evaluacion-form ficha-equivalencia-form"
            onSubmit={guardarEquivalencia}
          >
            <label>
              <span>Módulo a acreditar *</span>
              <select
                className="input-gestion"
                value={equivalencia.moduloId}
                onChange={(e) =>
                  setEquivalencia((anterior) => ({
                    ...anterior,
                    moduloId: e.target.value,
                  }))
                }
              >
                <option value="">Seleccione un módulo</option>
                {modulosParaEquivalencia.map((modulo) => (
                  <option key={modulo.id} value={modulo.id}>
                    {modulo.numeroLeyenda}
                  </option>
                ))}
              </select>
            </label>

            <label className="ficha-equivalencia-observacion">
              <span>Observación (opcional)</span>
              <input
                className="input-gestion"
                type="text"
                maxLength={300}
                placeholder="Ej.: escuela de origen"
                value={equivalencia.observacion}
                onChange={(e) =>
                  setEquivalencia((anterior) => ({
                    ...anterior,
                    observacion: e.target.value,
                  }))
                }
              />
            </label>

            <button
              className="btn-primario-gestion"
              type="submit"
              disabled={guardandoEquivalencia}
            >
              {guardandoEquivalencia ? "Guardando..." : "Registrar equivalencia"}
            </button>
          </form>
        )}

        {errorEquivalencia && (
          <div
            className="ficha-advertencia ficha-evaluacion-mensaje"
            role="alert"
          >
            <i className="fa-solid fa-circle-exclamation"></i>
            <p>{errorEquivalencia}</p>
          </div>
        )}
      </section>

      <section className="ficha-seccion">
        <div className="ficha-seccion-titulo">
          <i className="fa-solid fa-calendar-check"></i>

          <div>
            <h2>Asistencia</h2>
            <p>Situación de asistencia correspondiente a cada módulo.</p>
          </div>
        </div>

        <div className="tabla-responsive">
          <table className="tabla-gestion tabla-asistencia">
            <thead>
              <tr>
                <th>Módulo</th>
                <th>Faltas</th>
                <th>Límite</th>
                <th>Por asistencia</th>
              </tr>
            </thead>

            <tbody>
              {datosAcademicos.length === 0 ? (
                <tr>
                  <td colSpan="4">No hay datos de cursada disponibles.</td>
                </tr>
              ) : (
                datosAcademicos.map((modulo) => (
                  <tr key={modulo.id}>
                    <td>
                      <strong>{modulo.modulo}</strong>
                    </td>

                    <td>{modulo.faltas ?? "-"}</td>

                    <td>25</td>

                    <td>
                      {/* Acá solo se informa la situación por asistencia. */}
                      <span
                        className={
                          Number(modulo.faltas) > 25
                            ? "condicion-libre"
                            : "condicion-regular"
                        }
                      >
                        {Number(modulo.faltas) > 25
                          ? "Libre por inasistencias"
                          : "Regular"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="ficha-advertencia">
        <i className="fa-solid fa-circle-info"></i>

        <div>
          <strong>Información académica</strong>

          <p>
            Correlatividades: para cursar o acreditar los módulos de 2.º año
            (III y IV) hay que tener aprobados los módulos I y II; para los de
            3.º año (V y VI), los módulos III y IV. Un alumno queda LIBRE y debe
            recursar el módulo si supera las 25 inasistencias, si desaprueba una
            materia del módulo o si agota las 4 instancias de acreditación.
          </p>
        </div>
      </div>
    </div>
  );
}

function Dato({ label, valor }) {
  return (
    <div className="ficha-dato">
      <span>{label}</span>
      <strong>{valor ?? "-"}</strong>
    </div>
  );
}

function EstadoModulo({ estado }) {
  let clase = "estado-modulo";

  if (estado === "Aprobado") {
    clase += " estado-aprobado";
  } else if (estado === "Desaprobado" || estado === ETIQUETA_ESTADO.A_RECURSAR) {
    clase += " estado-desaprobado";
  } else if (estado === "Pendiente") {
    clase += " estado-pendiente";
  } else if (estado === "En curso") {
    clase += " estado-curso";
  } else {
    clase += " estado-no-cursado";
  }

  return <span className={clase}> {estado} </span>;
}
