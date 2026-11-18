// Días en que se puede cargar asistencia (misma regla que el backend):
// - Módulos I, III y V (período 1): de marzo a julio.
// - Módulos II, IV y VI (período 2): de agosto a diciembre.
// - Nunca sábados ni domingos, ni fechas futuras.

export const MESES_DEL_PERIODO = {
  1: { desde: 3, hasta: 7, texto: "de marzo a julio" },
  2: { desde: 8, hasta: 12, texto: "de agosto a diciembre" },
};

const dos = (n) => String(n).padStart(2, "0");

// Fecha local de hoy en AAAA-MM-DD.
export function fechaDeHoy(hoy = new Date()) {
  return `${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}-${dos(hoy.getDate())}`;
}

const ultimoDiaDelMes = (anio, mes) => new Date(Date.UTC(anio, mes, 0)).getUTCDate();

export function esFinDeSemana(fecha) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  return diaSemana === 0 || diaSemana === 6;
}

// Primer y último día que admite el calendario. Sin período conocido, solo
// se limita a hoy. `max < min` significa que el período todavía no empezó.
export function rangoDeClases(periodo, anio, hoy = fechaDeHoy()) {
  const meses = MESES_DEL_PERIODO[periodo];
  if (!meses || !anio) return { min: undefined, max: hoy };
  const min = `${anio}-${dos(meses.desde)}-01`;
  const fin = `${anio}-${dos(meses.hasta)}-${dos(ultimoDiaDelMes(anio, meses.hasta))}`;
  return { min, max: fin < hoy ? fin : hoy };
}

// Motivo por el que no se puede cargar asistencia ese día, o null si se puede.
export function motivoFechaSinClase(fecha, { periodo, anio, modulo } = {}, hoy = fechaDeHoy()) {
  if (!fecha) return "Elegí una fecha.";
  if (fecha > hoy) return "No se carga asistencia de una fecha futura.";
  if (esFinDeSemana(fecha)) return "No se carga asistencia los sábados ni los domingos.";
  const meses = MESES_DEL_PERIODO[periodo];
  if (meses) {
    const [anioFecha, mes] = fecha.split("-").map(Number);
    if ((anio && anioFecha !== Number(anio)) || mes < meses.desde || mes > meses.hasta) {
      return `${modulo ?? "Este módulo"} se dicta ${meses.texto}${anio ? ` de ${anio}` : ""}.`;
    }
  }
  return null;
}

// Último día de clase hasta hoy (para abrir la planilla en una fecha válida).
// null si el período todavía no empezó.
export function ultimoDiaDeClase(periodo, anio, hoy = fechaDeHoy()) {
  const { min, max } = rangoDeClases(periodo, anio, hoy);
  if (!min || max < min) return min ? null : hoy;
  const [a, m, d] = max.split("-").map(Number);
  const dia = new Date(Date.UTC(a, m - 1, d));
  while (dia.getUTCDay() === 0 || dia.getUTCDay() === 6) {
    dia.setUTCDate(dia.getUTCDate() - 1);
  }
  const fecha = dia.toISOString().slice(0, 10);
  return fecha < min ? null : fecha;
}
