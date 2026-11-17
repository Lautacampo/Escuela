import { HttpError } from "./httpError.js";

const ERRORES_UNICOS = {
  persona_dni_key: {
    mensaje: "Ya existe una persona con ese DNI",
    campo: "dni",
  },
  persona_cuil_key: {
    mensaje: "Ya existe una persona con ese CUIL",
    campo: "cuil",
  },
  usuarios_email_key: {
    mensaje: "Ese correo ya lo usa otro usuario",
    campo: "email",
  },
};

export const traducirUnicidadPersona = (error) => {
  if (error.code !== "23505") return null;

  const duplicado = ERRORES_UNICOS[error.constraint];
  if (!duplicado) return null;

  return new HttpError(409, duplicado.mensaje, { campo: duplicado.campo });
};
