export function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function esDniValido(dni) {
  const valor = String(dni ?? "").trim();
  return /^\d{7,8}$/.test(valor) && Number(valor) >= 1000000;
}

export function esCuilValido(cuil, dni) {
  const valor = String(cuil ?? "").trim();
  if (!/^[\d\s.-]+$/.test(valor)) return false;

  const cuilLimpio = valor.replace(/\D/g, "");
  const dniLimpio = String(dni ?? "").replace(/\D/g, "");

  if (
    cuilLimpio.length !== 11 ||
    dniLimpio.length < 7 ||
    dniLimpio.length > 8
  ) {
    return false;
  }

  const dniEnCuil = cuilLimpio.slice(2, 10);
  const dniNormalizado = dniLimpio.padStart(8, "0");

  return dniEnCuil === dniNormalizado;
}

export function normalizarCuil(cuil) {
  const digitos = String(cuil ?? "").replace(/\D/g, "");
  if (digitos.length !== 11) return String(cuil ?? "").trim();
  return `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos[10]}`;
}

export function esTelefonoValido(telefono, obligatorio = false) {
  const valor = String(telefono ?? "").trim();
  if (!valor) return !obligatorio;
  if (!/^[+\d\s().-]+$/.test(valor)) return false;

  const cantidadDigitos = valor.replace(/\D/g, "").length;
  return cantidadDigitos >= 8 && cantidadDigitos <= 15;
}

export function limitarDigitos(valor, maximo) {
  return String(valor ?? "")
    .replace(/\D/g, "")
    .slice(0, maximo);
}

export function esEdadValidaParaNocturna(edad) {
  const num = parseInt(edad, 10);
  return num >= 18 && num <= 99;
}

// Al editar, las reglas de formato se aplican solo a los datos que cambian,
// igual que en el backend: un registro cargado antes de esas reglas (un CUIL
// que no coincide con el DNI, un teléfono corto) se puede seguir editando.
// En un alta (`original` nulo) se valida todo.
export function sinCambios(
  original,
  campo,
  valor,
  normalizar = (v) => String(v ?? "").trim(),
) {
  return original != null && normalizar(original[campo]) === normalizar(valor);
}

export const soloDigitos = (valor) => String(valor ?? "").replace(/\D/g, "");
