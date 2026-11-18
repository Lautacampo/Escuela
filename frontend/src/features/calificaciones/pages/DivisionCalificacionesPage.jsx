import { useEffect, useRef, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router";
import { useAutoActualizar } from "../../../shared/hooks/useAutoActualizar";
import {
  getCiclosCalificaciones,
  getGrilla,
  setCalificacion,
} from "../services/CalificacionesServices";
import { CalificacionesAlumnos } from "../components/CalificacionesAlumnos";
import "../components/calificacionesdivision.css";

export function DivisionCalificacionesPage() {
  const { moduloId, division } = useParams();
  const [searchParams] = useSearchParams();
  const anioUrl = Number(searchParams.get("anio"));
  // Ciclo lectivo sobre el que se califica: el de la URL o, si no viene, el vigente.
  const [anio, setAnio] = useState(
    Number.isInteger(anioUrl) && anioUrl >= 2000 && anioUrl <= 2100
      ? anioUrl
      : null,
  );
  const [errorCiclo, setErrorCiclo] = useState(null);
  const [errorGuardar, setErrorGuardar] = useState(null);

  // La grilla cargada queda asociada a su módulo, división y ciclo: si alguno
  // cambia, se muestra "Cargando..." hasta tener la nueva.
  const clave = `${moduloId}|${division}|${anio}`;
  const [resultado, setResultado] = useState({
    clave: null,
    grilla: null,
    error: null,
  });
  const cargando =
    anio === null ? errorCiclo === null : resultado.clave !== clave;
  const grilla = cargando ? null : resultado.grilla;
  const error = errorCiclo ?? (cargando ? null : resultado.error);
  const setGrilla = (cambio) =>
    setResultado((previo) => ({
      ...previo,
      grilla: typeof cambio === "function" ? cambio(previo.grilla) : cambio,
    }));

  // Guardados en curso y realizados: una actualización de fondo que empezó
  // antes de un guardado trae datos viejos y se descarta.
  const guardados = useRef({ enCurso: 0, total: 0 });

  // Sin ciclo en la URL se usa el vigente.
  useEffect(() => {
    if (anio !== null) return undefined;
    let activo = true;
    getCiclosCalificaciones()
      .then((respuesta) => {
        if (!activo) return;
        const vigente = respuesta?.cicloActivo?.anio;
        if (vigente) setAnio(Number(vigente));
        else setErrorCiclo("No hay un ciclo lectivo vigente.");
      })
      .catch((e) => activo && setErrorCiclo(e.message));
    return () => {
      activo = false;
    };
  }, [anio]);

  useEffect(() => {
    if (anio === null) return undefined;
    let activo = true;
    const claveActual = `${moduloId}|${division}|${anio}`;
    getGrilla(moduloId, division, anio)
      .then(
        (datos) =>
          activo && setResultado({ clave: claveActual, grilla: datos, error: null }),
      )
      .catch(
        (e) =>
          activo &&
          setResultado({ clave: claveActual, grilla: null, error: e.message }),
      );
    return () => {
      activo = false;
    };
  }, [moduloId, division, anio]);

  // Lo que cargan otros usuarios (otro docente, el directivo) aparece solo.
  useAutoActualizar(
    async () => {
      if (guardados.current.enCurso > 0) return;
      const antes = guardados.current.total;
      const datos = await getGrilla(moduloId, division, anio);
      if (guardados.current.enCurso > 0 || guardados.current.total !== antes) {
        return;
      }
      setResultado((previo) =>
        previo.clave === clave ? { ...previo, grilla: datos } : previo,
      );
    },
    { activo: !cargando && !error },
  );

  async function cambiarEstado(cursadaId, materiaId, estado) {
    const anterior = grilla;
    setErrorGuardar(null);

    // Desaprobar una materia deja al alumno LIBRE en el módulo.
    const alumno = grilla.alumnos.find((a) => a.id === cursadaId);
    if (
      estado === "desaprobado" &&
      alumno?.condicion !== "LIBRE" &&
      !window.confirm(
        `Al desaprobar una materia, ${alumno.apellido}, ${alumno.nombre} queda LIBRE en el módulo: no podrá rendir la evaluación del módulo y deberá recursarlo.\n\n¿Confirmás la calificación?`,
      )
    ) {
      return;
    }

    setGrilla({
      ...grilla,
      alumnos: grilla.alumnos.map((a) =>
        a.id === cursadaId
          ? { ...a, estados: { ...a.estados, [materiaId]: estado } }
          : a,
      ),
    });

    guardados.current.enCurso += 1;
    guardados.current.total += 1;
    try {
      const guardada = await setCalificacion(cursadaId, materiaId, estado, anio);
      // El backend devuelve la situación recalculada (REGULAR / LIBRE).
      setGrilla((actual) => ({
        ...actual,
        alumnos: actual.alumnos.map((a) =>
          a.id === cursadaId
            ? {
                ...a,
                condicion: guardada.condicion,
                estadoAcademico: guardada.estadoAcademico,
                motivoLibre: guardada.motivoLibre,
              }
            : a,
        ),
      }));
    } catch (e) {
      setGrilla(anterior); // se vuelve como se veia antes  si la API rechaza el cambio
      setErrorGuardar(e.message);
    } finally {
      guardados.current.enCurso -= 1;
    }
  }

  if (cargando) return <p>Cargando...</p>;

  const volver = (
    <Link
      to="/gestion/calificaciones"
      className="btn-volver-calificaciones"
    >
      <span aria-hidden="true">←</span>Volver
    </Link>
  );

  if (error) {
    return (
      <section className="pagina-calificaciones-division">
        {volver}
        <p className="error-calificacion" role="alert">
          {error}
        </p>
      </section>
    );
  }

  const notas = {};
  for (const a of grilla.alumnos) {
    for (const m of grilla.materias) {
      notas[`${a.id}-${m.id}`] = { estado: a.estados[m.id] ?? "en_curso" };
    }
  }

  return (
    <section className="pagina-calificaciones-division">
      {volver}
      <h2>
        Módulo {moduloId} - División {division}
      </h2>
      {errorGuardar && (
        <p className="error-calificacion" role="alert">
          {errorGuardar}
        </p>
      )}
      <CalificacionesAlumnos
        alumnos={grilla.alumnos}
        materias={grilla.materias}
        notas={notas}
        onCambiar={cambiarEstado}
      />
    </section>
  );
}
