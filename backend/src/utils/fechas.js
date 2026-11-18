// Valida una fecha AAAA-MM-DD que exista en el calendario
// (rechaza, por ejemplo, 2026-02-31).
export const esFechaISOValida = (valor) => {
  if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const [anio, mes, dia] = valor.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    fecha.getUTCFullYear() === anio &&
    fecha.getUTCMonth() === mes - 1 &&
    fecha.getUTCDate() === dia
  );
};

// Fecha de hoy en AAAA-MM-DD en la hora de Argentina. El servidor de Render
// corre en UTC: con la hora local, después de las 21 h ya sería "mañana".
const FORMATO_FECHA_ARGENTINA = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

export const hoyISO = (fecha = new Date()) =>
  FORMATO_FECHA_ARGENTINA.format(fecha);

export const esMayorDeEdad = (fechaNacimiento, fechaActual = hoyISO()) => {
  if (!esFechaISOValida(fechaNacimiento) || !esFechaISOValida(fechaActual)) {
    return false;
  }

  const [anioNacimiento, mesNacimiento, diaNacimiento] =
    fechaNacimiento.split("-").map(Number);
  const [anioActual, mesActual, diaActual] = fechaActual.split("-").map(Number);

  let edad = anioActual - anioNacimiento;
  if (
    mesActual < mesNacimiento ||
    (mesActual === mesNacimiento && diaActual < diaNacimiento)
  ) {
    edad--;
  }

  return edad >= 18;
};
