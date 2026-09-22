export function esEmailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function esDniValido(dni) {
  const numero = parseInt(dni, 10);
  return numero >= 1000000 && numero <= 99999999;
}

export function esEdadValidaParaNocturna(edad) {
  const num = parseInt(edad, 10);
  return num >= 18 && num <= 99;
}
