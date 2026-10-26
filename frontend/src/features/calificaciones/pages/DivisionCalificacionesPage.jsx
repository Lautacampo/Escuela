import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { getGrilla, setCalificacion } from "../services/CalificacionesServices";
import { CalificacionesAlumnos } from "../components/CalificacionesAlumnos";
import "../components/calificacionesdivision.css";

export function DivisionCalificacionesPage() {
  const { moduloId, division } = useParams();
  const [grilla, setGrilla] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [errorGuardar, setErrorGuardar] = useState(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);
    getGrilla(moduloId, division)
      .then((datos) => activo && setGrilla(datos))
      .catch((e) => activo && setError(e.message))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, [moduloId, division]);

  async function cambiarEstado(cursadaId, materiaId, estado) {
    const anterior = grilla;
    setErrorGuardar(null);

   
    setGrilla({
      ...grilla,
      alumnos: grilla.alumnos.map((a) =>
        a.id === cursadaId
          ? { ...a, estados: { ...a.estados, [materiaId]: estado } }
          : a,
      ),
    });

    try {
      await setCalificacion(cursadaId, materiaId, estado);
    } catch (e) {
      setGrilla(anterior); // se vuelve como se veia antes  si la API rechaza el cambio
      setErrorGuardar(e.message);
    }
  }

  if (cargando) return <p>Cargando...</p>;

  const volver = (
    <Link to="/gestion/calificaciones" className="btn-volver-calificaciones">
      <span aria-hidden="true">←</span>Volver
    </Link>
  );

  if (error) {
    return (
      <section className="pagina-calificaciones-division">
        {volver}
        <p className="error-calificacion" role="alert">{error}</p>
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
      <h2>Módulo {moduloId} - División {division}</h2>
      {errorGuardar && (
        <p className="error-calificacion" role="alert">{errorGuardar}</p>
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