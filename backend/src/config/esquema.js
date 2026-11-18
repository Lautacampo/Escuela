import { pool } from "./db.js";
import { asegurarEsquemaPlanEstudio } from "../modules/planestudios/planEstudios.repository.js";

/**
 * Verificación del esquema al iniciar.
 *
 * La migración 007 agrega el estado (activo/inactivo) de docentes y
 * preceptores y las tablas del plan de estudios. Si la base todavía no la
 * tiene (por ejemplo, en Neon antes de ejecutarla), se crea lo que falta para
 * que la aplicación no falle. Se ejecuta una sola vez por proceso.
 */
const TABLAS_CON_ESTADO = ["docente", "preceptor"];

let esquemaListo = null;

export const asegurarEsquema = () => {
  esquemaListo ??= inicializar().catch((err) => {
    esquemaListo = null; // se reintenta en el próximo pedido
    throw err;
  });
  return esquemaListo;
};

const inicializar = async () => {
  await asegurarEsquemaPlanEstudio();

  const { rows } = await pool.query(
    `SELECT table_name
       FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = 'activo'
        AND table_name = ANY($1::text[])`,
    [TABLAS_CON_ESTADO],
  );
  const conEstado = new Set(rows.map((r) => r.table_name));

  for (const tabla of TABLAS_CON_ESTADO) {
    if (!conEstado.has(tabla)) {
      // Nombre de tabla fijo (de la lista de arriba), no viene del usuario.
      await pool.query(
        `ALTER TABLE public.${tabla}
           ADD COLUMN IF NOT EXISTS activo boolean NOT NULL DEFAULT true`,
      );
    }
  }
};

// Middleware: garantiza el esquema antes de atender cualquier pedido.
export const exigirEsquema = async (req, res, next) => {
  try {
    await asegurarEsquema();
    next();
  } catch (err) {
    next(err);
  }
};
