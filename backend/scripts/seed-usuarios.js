import bcrypt from "bcryptjs";
import { pool } from "../src/config/db.js";

const usuarios = [
  { nombre: "Ana", apellido: "Directora", email: "director@escuela.com", rol: "directivo" },
  { nombre: "Luis", apellido: "Docente", email: "docente@escuela.com", rol: "docente" },
  { nombre: "Marta", apellido: "Preceptora", email: "preceptor@escuela.com", rol: "preceptor" },
];

try {
  const hash = await bcrypt.hash("1234", 10);

  for (const u of usuarios) {
    await pool.query(
      `INSERT INTO usuarios (nombre, apellido, email, contrahash, rol_id)
       VALUES ($1, $2, $3, $4, (SELECT id FROM roles WHERE nombre = $5))
       ON CONFLICT (email) DO NOTHING`,
      [u.nombre, u.apellido, u.email, hash, u.rol],
    );
  }
  console.log("✅ Usuarios de prueba cargados (contraseña: 1234)");
} catch (err) {
  console.error("❌ Error:", err.message);
} finally {
  await pool.end();
}