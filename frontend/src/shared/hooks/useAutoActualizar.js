import { useEffect, useRef } from "react";

const CADA_MS = 15000;
const ESPERA_MINIMA_MS = 2000;

/**
 * Vuelve a pedir los datos de una pantalla cada `cada` milisegundos y cuando
 * el usuario vuelve a la pestaña. Así lo que carga otro usuario (un docente
 * que desaprueba, un preceptor que toma asistencia) aparece solo, sin
 * recargar la página.
 *
 * - Solo consulta mientras la pestaña está visible.
 * - `activo: false` lo pausa (por ejemplo, mientras se guarda un cambio o hay
 *   un formulario abierto), para no pisar lo que el usuario está haciendo.
 * - `recargar` debe actualizar los datos "en silencio": sin spinner.
 */
export function useAutoActualizar(recargar, { cada = CADA_MS, activo = true } = {}) {
  const recargarActual = useRef(recargar);
  const ultimaVez = useRef(0);

  // Siempre se usa la última versión de `recargar` sin reiniciar el intervalo.
  useEffect(() => {
    recargarActual.current = recargar;
  });

  useEffect(() => {
    if (!activo) return undefined;

    const ejecutar = () => {
      if (document.visibilityState !== "visible") return;
      const ahora = Date.now();
      // Volver a la pestaña dispara "focus" y "visibilitychange" juntos.
      if (ahora - ultimaVez.current < ESPERA_MINIMA_MS) return;
      ultimaVez.current = ahora;
      Promise.resolve(recargarActual.current()).catch(() => {
        // Un error en una actualización de fondo no interrumpe la pantalla;
        // se reintenta en la próxima vuelta.
      });
    };

    const intervalo = setInterval(ejecutar, cada);
    document.addEventListener("visibilitychange", ejecutar);
    window.addEventListener("focus", ejecutar);

    return () => {
      clearInterval(intervalo);
      document.removeEventListener("visibilitychange", ejecutar);
      window.removeEventListener("focus", ejecutar);
    };
  }, [cada, activo]);
}
