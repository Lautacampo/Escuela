import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { getPlanilla, setAsistencia } from "../services/asistenciaServices.js";
import { AsistenciaAlumnos } from "../components/AsistenciaAlumnos.jsx";
import "../components/asistenciaAlumnos.css";

const LIMITE_FALTAS = 25;

function hoy() {
  const fecha = new Date();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function DivisionAsistenciaPage() {
  const { moduloId, division } = useParams();
  const [fecha, setFecha] = useState(hoy);
  const [planilla, setPlanilla] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [errorGuardar, setErrorGuardar] = useState(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError(null);
    setPlanilla(null);
    setErrorGuardar(null);

    getPlanilla(moduloId, division, fecha)
      .then((datos) => {
        if (!Array.isArray(datos?.alumnos)) {
          throw new Error("El servidor devolvió una planilla inesperada.");
        }
        if (activo) setPlanilla(datos);
      })
      .catch((e) => {
        if (activo) setError(e.message);
      })
      .finally(() => {
        if (activo) setCargando(false);
      });

    return () => {
      activo = false;
    };
  }, [moduloId, division, fecha]);

  const alumnos = (planilla?.alumnos ?? []).map((a) => ({
    ...a,
    id: a.alumnoId,
  }));
  const registrosDia = {};
  const totales = {};
  for (const alumno of alumnos) {
    totales[alumno.id] = alumno.faltasAcumuladas;
    if (alumno.asistenciaHoy) registrosDia[alumno.id] = alumno.asistenciaHoy;
  }

  async function cambiarFalta(alumnoId, valor) {
    if (guardando) return;
    const alumno = alumnos.find((a) => Number(a.id) === Number(alumnoId));
    if (!alumno) return;

    setGuardando(true);
    setErrorGuardar(null);
    try {
      await setAsistencia({
        id: alumno.asistenciaHoy?.id,
        cursadaModuloId: Number(alumno.cursadaId),
        fecha,
        valorFalta: Number(valor),
      });
      // Recargar el resumen para mantener sincronizados los totales y el estado.
      const actualizada = await getPlanilla(moduloId, division, fecha);
      setPlanilla(actualizada);
    } catch (e) {
      setErrorGuardar(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="pagina-asistencia-division">
      <Link to="/gestion/asistencia" className="btn-volver-calificaciones">
        <span aria-hidden="true">←</span> Volver
      </Link>
      <h2>
        Módulo {moduloId} - División {division}
      </h2>
      {errorGuardar && (
        <p className="error-asistencia" role="alert">
          {errorGuardar}
        </p>
      )}
      {cargando ? (
        <p>Cargando planilla de asistencia...</p>
      ) : error ? (
        <p className="error-asistencia" role="alert">
          {error}
        </p>
      ) : (
        <AsistenciaAlumnos
          alumnos={alumnos}
          fecha={fecha}
          onCambiarFecha={setFecha}
          registrosDia={registrosDia}
          totales={totales}
          limite={LIMITE_FALTAS}
          guardando={guardando}
          onCambiar={cambiarFalta}
        />
      )}
    </section>
  );
}
