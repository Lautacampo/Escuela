import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import { getPlanilla, setAsistencia } from "../services/asistenciaServices.js";
import { useAutoActualizar } from "../../../shared/hooks/useAutoActualizar";
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
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState(null);

  // La planilla cargada queda asociada a su módulo, división y fecha: si
  // alguno cambia, la pantalla muestra "Cargando..." hasta tener la nueva.
  const clave = `${moduloId}|${division}|${fecha}`;
  const [resultado, setResultado] = useState({
    clave: null,
    planilla: null,
    error: null,
  });
  const cargando = resultado.clave !== clave;
  const planilla = cargando ? null : resultado.planilla;
  const error = cargando ? null : resultado.error;

  // Cuenta los guardados: una actualización de fondo que empezó antes de un
  // guardado trae datos viejos y se descarta.
  const guardados = useRef(0);

  useEffect(() => {
    let activo = true;
    const claveActual = `${moduloId}|${division}|${fecha}`;

    getPlanilla(moduloId, division, fecha)
      .then((datos) => {
        if (!Array.isArray(datos?.alumnos)) {
          throw new Error("El servidor devolvió una planilla inesperada.");
        }
        if (activo) setResultado({ clave: claveActual, planilla: datos, error: null });
      })
      .catch((e) => {
        if (activo) setResultado({ clave: claveActual, planilla: null, error: e.message });
      });

    return () => {
      activo = false;
    };
  }, [moduloId, division, fecha]);

  // Lo que carga otro usuario (por ejemplo, el preceptor) aparece solo.
  useAutoActualizar(
    async () => {
      const antes = guardados.current;
      const datos = await getPlanilla(moduloId, division, fecha);
      if (guardados.current !== antes || !Array.isArray(datos?.alumnos)) return;
      setResultado((previo) =>
        previo.clave === clave ? { ...previo, planilla: datos } : previo,
      );
    },
    { activo: !cargando && !guardando },
  );

  function cambiarFecha(nuevaFecha) {
    setErrorGuardar(null);
    setFecha(nuevaFecha);
  }

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
    guardados.current += 1;
    try {
      await setAsistencia({
        id: alumno.asistenciaHoy?.id,
        cursadaModuloId: Number(alumno.cursadaId),
        fecha,
        valorFalta: Number(valor),
      });
      // Recargar el resumen para mantener sincronizados los totales y el estado.
      const actualizada = await getPlanilla(moduloId, division, fecha);
      setResultado({ clave, planilla: actualizada, error: null });
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
          onCambiarFecha={cambiarFecha}
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
