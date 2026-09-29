import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { getAlumnos, getMaterias } from "../services/CalificacionesServices";
import "../components/calificacionesdivision.css";

export function DivisionCalificacionesPage() {
  const { moduloId, division } = useParams();
  const [alumnos, setAlumnos] = useState([]);
  const [materias, setMaterias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function cargar() {
      try {
        const [todosAlumnos, todasMaterias] = await Promise.all([
          getAlumnos(),
          getMaterias(),
        ]);
        setAlumnos(todosAlumnos);
        setMaterias(todasMaterias);
      } catch (e) {
        setError(e.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, []);

  const alumnosDivision = alumnos.filter(
    (alumno) =>
      alumno.moduloId === Number(moduloId) && alumno.division === division,
  );
  const materiasModulo = materias.filter(
    (materia) => materia.moduloId === Number(moduloId),
  );

  if (cargando) return <p>Cargando planilla...</p>;
  if (error) return <p role="alert">No se pudo cargar la planilla: {error}</p>;

  return (
    <section>
      <Link to="/gestion/calificaciones">← Volver</Link>
      <h2>Módulo {moduloId} - División {division}</h2>
      <table className="planilla">
        <thead>
          <tr>
            <th>Alumno</th>
            {materiasModulo.map((materia) => (
              <th key={materia.id}>{materia.nombre}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {alumnosDivision.map((alumno) => (
            <tr key={alumno.id}>
              <td>{alumno.apellido}, {alumno.nombre}</td>
              {materiasModulo.map((materia) => (
                <td key={materia.id}>En curso</td>
              ))}
            </tr>
          ))}
          {alumnosDivision.length === 0 && (
            <tr>
              <td colSpan={Math.max(materiasModulo.length + 1, 1)}>
                No hay alumnos en esta división.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}