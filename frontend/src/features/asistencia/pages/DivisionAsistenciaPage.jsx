import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router";
import { getPlanilla, setAsistencia } from "../services/asistenciaServices.js";
import { useAutoActualizar } from "../../../shared/hooks/useAutoActualizar";
import { AsistenciaAlumnos } from "../components/AsistenciaAlumnos.jsx";
import {
  fechaDeHoy,
  motivoFechaSinClase,
  rangoDeClases,
  ultimoDiaDeClase,
} from "../utils/diasDeClase.js";
import "../components/asistenciaAlumnos.css";

const LIMITE_FALTAS = 25;

export function DivisionAsistenciaPage() {
  const { moduloId, division } = useParams();
  const [fecha, setFecha] = useState(() => fechaDeHoy());
  // Período y ciclo del módulo (llegan con la planilla). Sirven para limitar
  // el calendario a los días de clase.
  const [infoModulo, setInfoModulo] = useState({});
  // La primera vez, si hoy no es día de clase del módulo (por ejemplo, el
  // Módulo I en noviembre), la planilla se abre en el último día de clase.
  const fechaAjustada = useRef(false);
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
        if (!activo) return;
        const info = {
          periodo: datos.periodo,
          anio: datos.cicloLectivo,
          modulo: datos.modulo,
        };
        setInfoModulo(info);
        if (!fechaAjustada.current) {
          fechaAjustada.current = true;
          const sugerida = motivoFechaSinClase(fecha, info)
            ? ultimoDiaDeClase(info.periodo, info.anio)
            : null;
          if (sugerida && sugerida !== fecha) {
            setFecha(sugerida);
            return;
          }
        }
        setResultado({ clave: claveActual, planilla: datos, error: null });
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

  // Día sin clase (fin de semana, fuera del período o futuro): se puede ver
  // la planilla, pero no cargar asistencia.
  const motivoSinClase = motivoFechaSinClase(fecha, infoModulo);
  const rango = rangoDeClases(infoModulo.periodo, infoModulo.anio);

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
    if (!alumno || motivoSinClase) return;

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
        {infoModulo.modulo ?? `Módulo ${moduloId}`} - División {division}
      </h2>
      {motivoSinClase && !cargando && (
        <p className="aviso-asistencia" role="status">
          {motivoSinClase} Elegí un día de clase (de lunes a viernes) para cargar
          la asistencia.
        </p>
      )}
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
          fechaMinima={rango.min}
          fechaMaxima={rango.max}
          bloqueado={Boolean(motivoSinClase)}
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
