import { redirect } from "react-router";
import { apiFetch } from "../../../shared/services/api.js";

/**
 * Sesión del usuario.
 *
 * Se persiste en localStorage como un único objeto versionado:
 *   { v: 1, token, usuario, exp }
 *
 * `exp` es la expiración del JWT en segundos (epoch), tal como la firma el
 * backend. Este módulo es la única fuente de verdad de la sesión; los
 * componentes de React se suscriben a través de `SesionProvider`/`useSesion`.
 */

const CLAVE_SESION = "sesion";
const CLAVE_TOKEN_ANTERIOR = "token";
const VERSION_SESION = 1;
// setTimeout no admite demoras mayores a 2^31 - 1 ms.
const ESPERA_MAXIMA = 2_147_483_647;

let sesionActual = null;
let temporizadorExpiracion = null;
const oyentes = new Set();

function leerStorage(clave) {
  try {
    return localStorage.getItem(clave);
  } catch {
    return null;
  }
}

function escribirStorage(clave, valor) {
  try {
    localStorage.setItem(clave, valor);
  } catch {
    // Sin almacenamiento disponible la sesión sigue funcionando en memoria.
  }
}

function borrarStorage(clave) {
  try {
    localStorage.removeItem(clave);
  } catch {
    // Nada que hacer si el almacenamiento no está disponible.
  }
}

// El payload del JWT viene en base64url; se decodifica sólo para leer `exp`.
function decodificarPayload(token) {
  try {
    const partes = String(token).split(".");
    if (partes.length !== 3) return null;

    const base64 = partes[1].replace(/-/g, "+").replace(/_/g, "/");
    const relleno = (4 - (base64.length % 4)) % 4;
    const binario = atob(base64 + "=".repeat(relleno));
    const bytes = Uint8Array.from(binario, (caracter) =>
      caracter.charCodeAt(0),
    );

    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function obtenerExpiracionToken(token) {
  const payload = decodificarPayload(token);
  return typeof payload?.exp === "number" ? payload.exp : null;
}

function normalizarSesion(datos) {
  if (!datos || typeof datos !== "object") return null;
  if (datos.v !== VERSION_SESION) return null;
  if (typeof datos.token !== "string" || !datos.token) return null;
  if (!datos.usuario || typeof datos.usuario !== "object") return null;

  const exp = Number(datos.exp);

  return {
    v: VERSION_SESION,
    token: datos.token,
    usuario: datos.usuario,
    exp: Number.isFinite(exp) && exp > 0 ? exp : null,
  };
}

function sigueVigente(sesion) {
  if (!sesion) return false;
  if (!sesion.exp) return true;
  return sesion.exp * 1000 > Date.now();
}

// Acepta el formato versionado y migra el formato anterior (dos claves:
// `sesion` con el usuario y `token` con el JWT).
function leerSesionGuardada() {
  const crudo = leerStorage(CLAVE_SESION);
  if (!crudo) return null;

  try {
    const datos = JSON.parse(crudo);

    if (datos?.v !== undefined) {
      return normalizarSesion(datos);
    }

    const token = leerStorage(CLAVE_TOKEN_ANTERIOR);
    if (!token) return null;

    return normalizarSesion({
      v: VERSION_SESION,
      token,
      usuario: datos,
      exp: obtenerExpiracionToken(token),
    });
  } catch {
    return null;
  }
}

function iniciarSesionDesdeStorage() {
  const guardada = leerSesionGuardada();

  if (!guardada || !sigueVigente(guardada)) {
    borrarStorage(CLAVE_SESION);
    borrarStorage(CLAVE_TOKEN_ANTERIOR);
    return null;
  }

  escribirStorage(CLAVE_SESION, JSON.stringify(guardada));
  borrarStorage(CLAVE_TOKEN_ANTERIOR);
  return guardada;
}

function notificar() {
  for (const oyente of oyentes) {
    try {
      oyente();
    } catch {
      // Un suscriptor roto no debe impedir notificar al resto.
    }
  }
}

function programarExpiracion(sesion) {
  if (temporizadorExpiracion !== null) {
    clearTimeout(temporizadorExpiracion);
    temporizadorExpiracion = null;
  }

  if (!sesion?.exp) return;

  const restante = sesion.exp * 1000 - Date.now();

  if (restante <= 0) {
    logout();
    return;
  }

  temporizadorExpiracion = setTimeout(
    () => {
      temporizadorExpiracion = null;

      if (!sigueVigente(sesionActual)) {
        logout();
      } else if (sesionActual) {
        programarExpiracion(sesionActual);
      }
    },
    Math.min(restante, ESPERA_MAXIMA),
  );
}

function guardarSesion(sesion) {
  sesionActual = sesion;
  escribirStorage(CLAVE_SESION, JSON.stringify(sesion));
  programarExpiracion(sesion);
  notificar();
}

function obtenerSesionVigente() {
  if (!sesionActual) return null;

  if (!sigueVigente(sesionActual)) {
    logout();
    return null;
  }

  return sesionActual;
}

export async function login(email, password) {
  const datos = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (!datos?.token || !datos?.usuario) {
    throw new Error("La respuesta del servidor no incluyó una sesión válida");
  }

  guardarSesion({
    v: VERSION_SESION,
    token: datos.token,
    usuario: datos.usuario,
    exp: obtenerExpiracionToken(datos.token),
  });

  return datos.usuario;
}

export function logout() {
  sesionActual = null;

  if (temporizadorExpiracion !== null) {
    clearTimeout(temporizadorExpiracion);
    temporizadorExpiracion = null;
  }

  borrarStorage(CLAVE_SESION);
  borrarStorage(CLAVE_TOKEN_ANTERIOR);
  notificar();
}

export function getToken() {
  return sesionActual?.token ?? null;
}

export function getSesionCompleta() {
  return sesionActual;
}

export function suscribirSesion(oyente) {
  oyentes.add(oyente);

  return () => {
    oyentes.delete(oyente);
  };
}

export const controlSesion = (roles) => () => {
  const sesion = obtenerSesionVigente();
  if (!sesion) return redirect("/login");
  if (roles && !roles.includes(sesion.usuario.rol)) {
    return redirect("/gestion/sin-permiso");
  }
  return null;
};

export const yahaySesion = () => {
  return obtenerSesionVigente() ? redirect("/gestion") : null;
};

// Se restaura la sesión una sola vez al cargar el módulo.
sesionActual = iniciarSesionDesdeStorage();
programarExpiracion(sesionActual);
