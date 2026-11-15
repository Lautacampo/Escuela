export function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function esDniValido(dni) {
  const numero = parseInt(dni, 10);
  return numero >= 1000000 && numero <= 99999999;
}

export function esCuilValido(cuil, dni) {
  const cuilLimpio = String(cuil).replace(/[^0-9]/g, '');
  const dniLimpio = String(dni).replace(/[^0-9]/g, '');

  if(cuilLimpio.length !== 11 || dniLimpio.length < 7 || dniLimpio.length > 8) {
    return false;
  }

  const dniEnCuil = cuilLimpio.slice(2, 10);
  const dniNormalizado = dniLimpio.padStart(8, '0');

  if(dniEnCuil !== dniNormalizado) {
    return false;
  }

  const mult = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const digitos = limpiocuil.split('').map(Number);
  const digitoVerificador = digitos.pop();

  const acum = digitos.reduce((acc, curr, index) => {
    return acc + curr * mult[index];
  }, 0);

  let calculo = 11 - (acum % 11);

  if (calculo === 11) {
    calculo = 0;
  } else if (calculo === 10) {
    calculo = 9;
  }

  return digitoVerificador === calculo;
}

export function esEdadValidaParaNocturna(edad) {
  const num = parseInt(edad, 10);
  return num >= 18 && num <= 99;
}
