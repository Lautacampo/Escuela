import { useEffect, useState } from "react";
import { useParams, Link, useSearchParams } from "react-router";
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
  const [grilla, setGrilla] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [errorGuardar, setErrorGuardar] = useState(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);
    if (anio === null) {
      getCiclosCalificaciones()
        .then((respuesta) => {
          if (!activo) return;
          const vigente = respuesta?.cicloActivo?.anio;
          if (vigente) setAnio(Number(vigente));
          else {
            setError("No hay un ciclo lectivo vigente.");
            setCargando(false);
          }
        })
        .catch((e) => {
          if (!activo) return;
          setError(e.message);
          setCargando(false);
        });
      return () => {
        activo = false;
      };
    }
    getGrilla(moduloId, division, anio)
      .then((datos) => activo && setGrilla(datos))
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [moduloId, division, anio]);

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
        moduloId={moduloId}
        division={division}
        onCambiar={cambiarEstado}
      />
    </section>
  );
}
