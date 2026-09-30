import { useRef, useState } from "react";
import { ListadoAsistencias } from "./ListadoAsistencias";

// Datos ficticios para presentar el frontend.
const ALUMNOS = [
  {
    id: 1,
    apellido: "Pérez",
    nombre: "Juan",
    dni: "40123456",
    curso: "1",
    division: "A",
  },
  {
    id: 2,
    apellido: "González",
    nombre: "María",
    dni: "38987654",
    curso: "1",
    division: "A",
  },
  {
    id: 3,
    apellido: "López",
    nombre: "Carlos",
    dni: "41567890",
    curso: "1",
    division: "B",
  },
  {
    id: 4,
    apellido: "Rodríguez",
    nombre: "Laura",
    dni: "37543210",
    curso: "1",
    division: "B",
  },
  {
    id: 5,
    apellido: "Martínez",
    nombre: "Ana",
    dni: "42123456",
    curso: "2",
    division: "A",
  },
  {
    id: 6,
    apellido: "Sánchez",
    nombre: "Diego",
    dni: "43987654",
    curso: "3",
    division: "B",
  },
];

// Cada fecha tiene sus propios registros por ID de alumno.
const ASISTENCIAS_INICIALES = {
  "2026-09-28": {
    1: "Presente",
    2: "Ausente",
    3: "Presente",
    4: "Presente",
  },
  "2026-09-29": {
    1: "Ausente",
    2: "Presente",
    3: "Presente",
    4: "Ausente",
  },
};

function obtenerFechaActual() {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function mostrarFecha(fecha) {
  return fecha ? fecha.split("-").reverse().join("/") : "";
}

export function Asistencia() {
  const modalRef = useRef(null);

  const [asistencias, setAsistencias] = useState(ASISTENCIAS_INICIALES);

  const [filtros, setFiltros] = useState({
    fecha: obtenerFechaActual(),
    curso: "",
    division: "",
    busqueda: "",
  });

  const [grupo, setGrupo] = useState(null);
  const [marcas, setMarcas] = useState({});
  const [hayCambios, setHayCambios] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const alumnosDelGrupo = grupo
    ? ALUMNOS.filter(
        (alumno) =>
          alumno.curso === grupo.curso && alumno.division === grupo.division,
      )
    : [];

  const presentes = alumnosDelGrupo.filter(
    (alumno) => marcas[alumno.id] === "Presente",
  ).length;

  const ausentes = alumnosDelGrupo.filter(
    (alumno) => marcas[alumno.id] === "Ausente",
  ).length;

  const pendientes = alumnosDelGrupo.length - presentes - ausentes;

  function cambiarFiltro(evento) {
    const { name, value } = evento.target;

    setFiltros((anteriores) => ({
      ...anteriores,
      [name]: value,
    }));

    setMensaje("");
  }

  function abrirPlanilla(alumno = null) {
    const seleccion = {
      fecha: filtros.fecha,
      curso: alumno ? alumno.curso : filtros.curso,
      division: alumno ? alumno.division : filtros.division,
    };

    if (!seleccion.fecha || !seleccion.curso || !seleccion.division) {
      setMensaje(
        "Seleccioná una fecha, un curso y una división para registrar asistencia.",
      );
      return;
    }

    const tieneAlumnos = ALUMNOS.some(
      (item) =>
        item.curso === seleccion.curso && item.division === seleccion.division,
    );

    if (!tieneAlumnos) {
      setMensaje("No hay alumnos registrados en ese curso y división.");
      return;
    }

    setGrupo(seleccion);

    // Cargamos los estados guardados exclusivamente para esa fecha.
    setMarcas({
      ...(asistencias[seleccion.fecha] || {}),
    });

    setHayCambios(false);
    setError("");
    setMensaje("");
    modalRef.current.showModal();
  }

  function marcarAsistencia(alumnoId, estado) {
    setMarcas((anteriores) => ({
      ...anteriores,
      [alumnoId]: estado,
    }));

    setHayCambios(true);
    setError("");
  }

  function cerrarPlanilla() {
    if (
      hayCambios &&
      !window.confirm("Hay cambios sin guardar. ¿Querés descartarlos?")
    ) {
      return;
    }

    modalRef.current.close();
    setHayCambios(false);
    setError("");
  }

  function guardarPlanilla(evento) {
    evento.preventDefault();

    if (!grupo || alumnosDelGrupo.length === 0) return;

    if (pendientes > 0) {
      setError(
        "Marcá presente o ausente en todos los alumnos antes de guardar.",
      );
      return;
    }

    const registrosDelGrupo = Object.fromEntries(
      alumnosDelGrupo.map((alumno) => [alumno.id, marcas[alumno.id]]),
    );

    setAsistencias((anteriores) => ({
      ...anteriores,
      [grupo.fecha]: {
        // Conservamos los registros de otros grupos del mismo día.
        ...(anteriores[grupo.fecha] || {}),
        ...registrosDelGrupo,
      },
    }));

    setMensaje(
      `Asistencia de ${grupo.curso}° ${grupo.division}, del ${mostrarFecha(
        grupo.fecha,
      )}, guardada correctamente.`,
    );

    setHayCambios(false);
    setError("");
    modalRef.current.close();
  }

  return (
    <section className="gestion-asistencias">
      <div className="encabezado-gestion">
        <div>
          <h1>Gestión de Asistencias</h1>
          <p>Consultá y registrá la asistencia de los alumnos por día.</p>
        </div>

        <button
          type="button"
          className="btn-primario-gestion"
          onClick={() => abrirPlanilla()}
        >
          <i className="fa-solid fa-calendar-check" aria-hidden="true"></i>
          Registrar asistencia
        </button>
      </div>

      {mensaje && (
        <div className="asistencia-aviso" role="status">
          {mensaje}
        </div>
      )}

      <ListadoAsistencias
        alumnos={ALUMNOS}
        filtros={filtros}
        estados={asistencias[filtros.fecha] || {}}
        onCambiarFiltro={cambiarFiltro}
        onEditar={abrirPlanilla}
      />

      <dialog
        ref={modalRef}
        className="modal-alumno asistencia-modal"
        aria-labelledby="titulo-planilla-asistencia"
        onCancel={(evento) => {
          evento.preventDefault();
          cerrarPlanilla();
        }}
      >
        <div className="modal-alumno-header">
          <div>
            <h2 id="titulo-planilla-asistencia">Registrar asistencia</h2>

            {grupo && (
              <p>
                {grupo.curso}° Año · División {grupo.division}
                {" · "}
                {mostrarFecha(grupo.fecha)}
              </p>
            )}
          </div>

          <button
            type="button"
            className="btn-cerrar-modal"
            onClick={cerrarPlanilla}
            aria-label="Cerrar planilla"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true"></i>
          </button>
        </div>

        <form
          className="form-gestion asistencia-formulario"
          onSubmit={guardarPlanilla}
        >
          <div className="asistencia-resumen" aria-live="polite">
            <span>
              Alumnos: <strong>{alumnosDelGrupo.length}</strong>
            </span>
            <span>
              Presentes: <strong>{presentes}</strong>
            </span>
            <span>
              Ausentes: <strong>{ausentes}</strong>
            </span>
            <span>
              Sin registrar: <strong>{pendientes}</strong>
            </span>
          </div>

          <div className="tabla-responsive">
            <table className="tabla-gestion asistencia-planilla">
              <thead>
                <tr>
                  <th scope="col">Apellido y nombre</th>
                  <th scope="col">DNI</th>
                  <th scope="col">Presente</th>
                  <th scope="col">Ausente</th>
                </tr>
              </thead>

              <tbody>
                {alumnosDelGrupo.map((alumno) => (
                  <tr key={alumno.id}>
                    <td>
                      <strong>
                        {alumno.apellido}, {alumno.nombre}
                      </strong>
                    </td>

                    <td>{alumno.dni}</td>

                    {["Presente", "Ausente"].map((estado) => (
                      <td className="asistencia-celda-radio" key={estado}>
                        <input
                          type="radio"
                          name={`asistencia-${alumno.id}`}
                          value={estado}
                          checked={marcas[alumno.id] === estado}
                          onChange={() => marcarAsistencia(alumno.id, estado)}
                          aria-label={`${estado}: ${alumno.apellido}, ${alumno.nombre}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {error && (
            <p className="asistencia-error" role="alert">
              {error}
            </p>
          )}

          <div className="acciones-formulario asistencia-acciones">
            <button
              type="button"
              className="btn-secundario"
              onClick={cerrarPlanilla}
            >
              Cancelar
            </button>

            <button type="submit" className="btn-primario-gestion">
              Guardar asistencia
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
