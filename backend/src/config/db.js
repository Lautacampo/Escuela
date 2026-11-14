import pg from "pg";
import { env } from "./env.js";

const { Pool } = pg;

// Configuración de la conexión:
// Si existe DATABASE_URL, utilizamos Neon.
// Si no existe, utilizamos PostgreSQL local.

const conexion = env.DATABASE_URL
  ? {connectionString: env.DATABASE_URL,}
  : {
      host: env.PGHOST,
      port: env.PGPORT,
      user: env.PGUSER,
      password: env.PGPASSWORD,
      database: env.PGDATABASE,
    };

// Creamos el pool de conexiones a PostgreSQL.
export const pool = new Pool({
  ...conexion,

  max: 5,
  min: 0,

  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,

  query_timeout: 10000,
  statement_timeout: 10000,

  allowExitOnIdle: false,
});

// Controlamos los errores de conexiones inactivas.
pool.on("error", (err) => {
  console.error(
    "Error inesperado en PostgreSQL:",
    err.message
  );
});


