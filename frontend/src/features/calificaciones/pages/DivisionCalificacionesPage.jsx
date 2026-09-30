import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { getAlumnos, getMaterias , getCalificaciones, setCalificacion } from "../services/calificacionesServices";
import { CalificacionesAlumnos } from "../components/CalificacionesAlumnos";
import "../components/calificacionesdivision.css";

export function DivisionCalificacionesPage() {
  const { moduloId, division } = useParams();
  const [alumnos, setAlumnos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const[calificaciones,setCalificaciones]=useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [errorGuardar,setErrorGuardar]=useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const [todosAlumnos, todasMaterias, todasCalificaciones] = await Promise.all([
          getAlumnos(),
          getMaterias(),
          getCalificaciones(),
        ]);
        setAlumnos(todosAlumnos);
        setMaterias(todasMaterias);
        setCalificaciones(todasCalificaciones);
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  async function cambiarEstado(alumnoId,materiaId,estado){
    const existente = calificaciones.find(
      (c)=>c.alumnoId === alumnoId && c.materiaId === materiaId
    );

    try{
      setErrorGuardar(null);
      const guardada = await setCalificacion({
        ...existente,
        alumnoId,
        materiaId,
        estado,
      });

      setCalificaciones((prev)=>
        existente
          ? prev.map((c)=>(c.id == guardada.id ? guardada : c ))
          : [...prev, guardada]
      );
    }catch(e){
      setErrorGuardar(e.message);
    }
  }
  if (cargando) return <p>Cargando...</p>;
  if (error) return <p>{error}</p>;



  const alumnosDivision = alumnos.filter(
    (alumno) =>
      alumno.moduloId === Number(moduloId) && alumno.division === division,
  ).sort((a, b) =>
    a.apellido.localeCompare(b.apellido, "es", { sensitivity: "base" }) ||
    a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }),
  );
  const materiasModulo = materias.filter(
    (materia) => materia.moduloId === Number(moduloId),
  );
  
  const notas = Object.fromEntries(
    calificaciones.map((calificacion) => [
      `${calificacion.alumnoId}-${calificacion.materiaId}`,
      calificacion,
    ]),
  );

  return (
    <section className="pagina-calificaciones-division">
      <Link
        to="/gestion/calificaciones"
        className="btn-volver-calificaciones"
      >
        <span aria-hidden="true">←</span>
        Volver a calificaciones
      </Link>
      <h2>Módulo {moduloId} - División {division}</h2>
      {errorGuardar && (
        <p className="error-calificacion" role="alert">
          No se pudo guardar la nota: {errorGuardar}
        </p>
      )}
      <CalificacionesAlumnos
        alumnos={alumnosDivision}
        materias={materiasModulo}
        notas={notas}
        moduloId={moduloId}
        division={division}
        onCambiar={cambiarEstado}
      />
    </section>
  );
}