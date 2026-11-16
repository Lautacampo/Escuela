import { pool } from "../../config/db.js";

export const buscarPorEmail = async (email) => {
  const { rows } = await pool.query(
    `SELECT u.id, u.nombre, u.apellido, u.email, u.contrahash, u.activo,  r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
      WHERE u.email = $1`,
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
 * Deja listo el usuario de acceso de un docente o preceptor DENTRO de la
 * transacción que crea a la persona (recibe el client de esa transacción):
 * - si el correo no tiene usuario, lo crea;
 * - si existe un usuario de ese mismo rol que quedó sin persona (por un alta
 *   fallida o porque se eliminó a la persona), lo reutiliza: lo vincula,
 *   lo reactiva y, si se envió una contraseña nueva, la actualiza;
 * - en cualquier otro caso el correo está ocupado y devuelve null.
 */
export const vincularOCrearUsuario = async (
  client,
  { rol, email, nombre, apellido, hash = null, personaId },
) => {
  const { rows } = await client.query(
    `SELECT u.id, u.persona_id, r.nombre AS rol
       FROM usuarios u
       JOIN roles r ON r.id = u.rol_id
      WHERE u.email = $1
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

// Al eliminar a la persona, su usuario queda sin vínculo y sin acceso.
// El correo puede volver a usarse si se la registra de nuevo.
export const desvincularUsuario = async (client, personaId) => {
  await client.query(
    "UPDATE usuarios SET persona_id = NULL, activo = false WHERE persona_id = $1",
    [personaId],
  );
};

// Mantiene el correo de inicio de sesión igual al de la persona.
export const sincronizarEmailUsuario = async (client, personaId, email) => {
  await client.query(
    "UPDATE usuarios SET email = $2 WHERE persona_id = $1 AND email <> $2",
    [personaId, email],
  );
};
