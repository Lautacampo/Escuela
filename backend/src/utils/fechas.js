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

// Fecha de hoy en AAAA-MM-DD (hora local del servidor).
export const hoyISO = () => {
  const hoy = new Date();
  const dosDigitos = (n) => String(n).padStart(2, "0");
  return `${hoy.getFullYear()}-${dosDigitos(hoy.getMonth() + 1)}-${dosDigitos(hoy.getDate())}`;
};

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
