import { pool } from "../../config/db.js";
import { HttpError } from "../../utils/httpError.js";

export const buscarPorEmail = async (email) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.apellido, u.email, u.contrahash, u.activo, u.persona_id, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
      WHERE LOWER(u.email) = LOWER($1)
      ORDER BY u.activo DESC, u.id
      LIMIT 1`,
    [email]
  );
  return rows[0];
};

export const crearUsuario = async ({ nombre, apellido, email, hash, rol }) => {
  const { rows } = await pool.query(
    `INSERT INTO usuarios (nombre, apellido, email, contrahash, rol_id)
     VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE nombre = $5))
     RETURNING id, nombre, apellido, email`,
    [nombre, apellido, email, hash, rol]
  );
  return rows[0];
};

/**
 * Borra el usuario que quedó de un docente o preceptor eliminado antes de que
 * la eliminación definitiva borrara también el usuario: sin persona y dado de
 * baja. Ese correo y esa contraseña ya no pertenecen a nadie, así que el
 * correo queda libre y la contraseña vieja no puede volver a usarse.
 * (La migración 010 borra todos los que hubiera en la base.)
 */
export const liberarUsuarioEliminado = async (email, db = pool) => {
  await db.query(
    `DELETE FROM usuarios u
      USING roles r
      WHERE r.id = u.rol_id
        AND r.nombre IN ('docente', 'preceptor')
        AND u.persona_id IS NULL
        AND u.activo = false
        AND LOWER(u.email) = LOWER($1)`,
    [email],
  );
};

/**
 * Deja listo el usuario de acceso de un docente o preceptor DENTRO de la
 * transacción que crea a la persona (recibe el client de esa transacción):
 * - si el correo no tiene usuario, lo crea;
 * - si existe un usuario de ese mismo rol registrado y todavía sin persona,
 *   lo reutiliza: lo vincula y, si se envió una contraseña nueva, la actualiza;
 * - el usuario que quedó de una persona eliminada no se reutiliza: se borra
 *   antes, así su contraseña vieja no vuelve a servir;
 * - en cualquier otro caso el correo está ocupado y devuelve null.
 */
export const vincularOCrearUsuario = async (
  client,
  { rol, email, nombre, apellido, hash = null, personaId },
) => {
  await liberarUsuarioEliminado(email, client);

  const { rows } = await client.query(
    `SELECT u.id, u.persona_id, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
      WHERE LOWER(u.email) = LOWER($1)
      ORDER BY u.id
      LIMIT 1
        FOR UPDATE OF u`,
    [email],
  );
  const existente = rows[0];

  if (!existente) {
    if (!hash) return null;
    const creado = await client.query(
      `INSERT INTO usuarios (nombre, apellido, email, contrahash, rol_id, persona_id)
       SELECT $1, $2, $3, $4, r.id, $5
         FROM roles r
        WHERE r.nombre = $6
       RETURNING id`,
      [nombre, apellido, email, hash, personaId, rol],
    );
    return creado.rows[0]?.id ?? null;
  }

  if (existente.persona_id !== null || existente.rol !== rol) return null;

  await client.query(
    `UPDATE usuarios
        SET persona_id = $2,
            nombre = $3,
            apellido = $4,
            contrahash = COALESCE($5, contrahash),
            activo = true
      WHERE id = $1`,
    [existente.id, personaId, nombre, apellido, hash],
  );
  return existente.id;
};

// Eliminación definitiva de un docente o preceptor: su usuario se borra con
// él. Su correo y su contraseña dejan de servir para iniciar sesión, su sesión
// abierta se corta en el próximo pedido y el correo queda libre para cualquier
// alta nueva.
export const eliminarUsuarioDePersona = async (client, personaId) => {
  await client.query("DELETE FROM usuarios WHERE persona_id = $1", [personaId]);
};

// Mantiene el correo de inicio de sesión igual al de la persona.
export const sincronizarEmailUsuario = async (client, personaId, email) => {
  // El login no distingue mayúsculas: "Director@escuela.com" es el mismo
  // correo que "director@escuela.com" y no puede quedar en otro usuario.
  const { rowCount } = await client.query(
    `SELECT 1 FROM usuarios
      WHERE LOWER(email) = LOWER($2)
        AND persona_id IS DISTINCT FROM $1`,
    [personaId, email],
  );
  if (rowCount > 0) {
    throw new HttpError(409, "Ese correo ya pertenece a otro usuario del sistema", {
      campo: "email",
    });
  }
  await client.query(
    "UPDATE usuarios SET email = $2 WHERE persona_id = $1 AND email <> $2",
    [personaId, email],
  );
};
