export const normalizarDni = (dni) => String(dni ?? "").replace(/\D/g, "");

export const esDniValido = (dni) => {
  const valor = String(dni ?? "").trim();
  if (!/^[\d\s.-]+$/.test(valor)) return false;

  const digitos = normalizarDni(valor);
  return /^\d{7,8}$/.test(digitos) && Number(digitos) >= 1000000;
};

export const esCuilValido = (cuil, dni) => {
  const valor = String(cuil ?? "").trim();
  if (!/^[\d\s.-]+$/.test(valor)) return false;

  const cuilDigitos = valor.replace(/\D/g, "");
  const dniDigitos = normalizarDni(dni);
  if (
    cuilDigitos.length !== 11 ||
    dniDigitos.length < 7 ||
    dniDigitos.length > 8 ||
    cuilDigitos.slice(2, 10) !== dniDigitos.padStart(8, "0")
  ) {
    return false;
  }

  return true;
};

export const normalizarCuil = (cuil) => {
  const digitos = String(cuil ?? "").replace(/\D/g, "");
  if (digitos.length !== 11) return String(cuil ?? "").trim();
  return `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos[10]}`;
};

export const esTelefonoValido = (telefono, obligatorio = false) => {
  const valor = String(telefono ?? "").trim();
  if (!valor) return !obligatorio;
  if (!/^[+\d\s().-]+$/.test(valor)) return false;

  const cantidadDigitos = valor.replace(/\D/g, "").length;
  return cantidadDigitos >= 8 && cantidadDigitos <= 15;
};

/**
 * Al editar, las reglas de formato se aplican solo a los datos que cambian.
 * Así un registro cargado antes de que existieran esas reglas (un CUIL que no
 * coincide con el DNI, un teléfono corto) se puede seguir editando sin tener
 * que corregir todo de una vez. En un alta (sin `anterior`) se valida todo.
 */
export const sinCambios = (anterior, campo, valorNuevo, normalizar = textoPlano) =>
  anterior != null && normalizar(anterior[campo]) === normalizar(valorNuevo);

const textoPlano = (valor) => String(valor ?? "").trim();
export const soloDigitos = (valor) => String(valor ?? "").replace(/\D/g, "");

// Nombre o apellido: letras (con tildes y ñ), espacios, apóstrofo, guion y
// punto; de 2 a 100 caracteres. Rechaza números y símbolos como "<", ">", ";".
const REGEX_NOMBRE = /^[\p{L}][\p{L}\p{M} .'’-]*$/u;
export const esNombreValido = (valor) => {
  const texto = String(valor ?? "").trim();
  return texto.length >= 2 && texto.length <= 100 && REGEX_NOMBRE.test(texto);
};

// Antigüedad máxima de docentes y preceptores (en años).
export const ANTIGUEDAD_MAXIMA = 35;
