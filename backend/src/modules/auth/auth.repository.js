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