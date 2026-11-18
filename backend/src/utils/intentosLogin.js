/**
 * Límite de intentos fallidos de inicio de sesión, en memoria.
 *
 * Se cuenta por IP + correo: después de MAX_FALLIDOS intentos con clave
 * incorrecta en VENTANA_MS, ese correo queda bloqueado desde esa IP hasta que
 * pase la ventana. Un inicio de sesión correcto reinicia el contador.
 * Alcanza para frenar la prueba de contraseñas por fuerza bruta en una sola
 * instancia (Render). Con varias instancias habría que guardarlo en la base.
 */
const MAX_FALLIDOS = 10;
const VENTANA_MS = 15 * 60 * 1000;

const intentos = new Map(); // clave -> { fallidos, desde }

const clave = (ip, email) => `${ip}|${email}`;

const vigente = (registro, ahora) =>
  registro && ahora - registro.desde < VENTANA_MS;

// Minutos que faltan para poder reintentar, o 0 si no está bloqueado.
export const minutosDeBloqueo = (ip, email, ahora = Date.now()) => {
  const registro = intentos.get(clave(ip, email));
  if (!vigente(registro, ahora) || registro.fallidos < MAX_FALLIDOS) return 0;
  return Math.ceil((registro.desde + VENTANA_MS - ahora) / 60000);
};

export const registrarFallido = (ip, email, ahora = Date.now()) => {
  const k = clave(ip, email);
  const registro = intentos.get(k);
  if (vigente(registro, ahora)) {
    registro.fallidos += 1;
  } else {
    intentos.set(k, { fallidos: 1, desde: ahora });
  }

  // Limpieza ocasional para que el mapa no crezca sin límite.
  if (intentos.size > 5000) {
    for (const [c, r] of intentos) {
      if (!vigente(r, ahora)) intentos.delete(c);
    }
  }
};

export const registrarExitoso = (ip, email) => {
  intentos.delete(clave(ip, email));
};
