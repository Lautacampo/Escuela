// Carga las variables del archivo .env en process.env
import "dotenv/config";

export const env = {
  PORT: Number(process.env.PORT ?? 4000),
  CORS_ORIGIN:process.env.FRONTEND_URL ?? process.env.CORS_ORIGIN ??"http://localhost:5173",
  DATABASE_URL: process.env.DATABASE_URL,
  PGHOST: process.env.PGHOST ?? 'localhost',
  PGPORT: Number(process.env.PGPORT ?? 5432),
  PGUSER: process.env.PGUSER ?? 'postgres',
  PGPASSWORD: process.env.PGPASSWORD ?? 'postgres',
  PGDATABASE: process.env.PGDATABASE ?? 'database',
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "1h"
};