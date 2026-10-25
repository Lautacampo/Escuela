import pkg from "pg";
import { env } from "./src/config/env.js";
const { Client } = pkg;

const client = new Client({
  host: env.PGHOST,
  port: env.PGPORT,
  user: env.PGUSER,
  password: env.PGPASSWORD,
  database: env.PGDATABASE,
});

try {
  await client.connect();
  console.log("✅ Conectado a PostgreSQL");

  const hora = await client.query("SELECT NOW() AS ahora");
  console.log("Hora del servidor:", hora.rows[0].ahora);

  const roles = await client.query("SELECT id, nombre FROM roles ORDER BY id");
  console.log("Roles:", roles.rows);
} catch (err) {
  console.error("❌ Error:", err.message);
} finally {
  await client.end();
}