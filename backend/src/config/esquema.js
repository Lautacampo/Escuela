import { pool } from "./db.js";
import { asegurarEsquemaPlanEstudio } from "../modules/planestudios/planEstudios.repository.js";
import {
  SQL_ASIGNACION_POR_MODULO,
  SQL_FUNCIONES_INGRESO,
} from "./migracionesAlIniciar.js";

/**
 * Verificación del esquema al iniciar.
 *
 * La migración 007 agrega el estado (activo/inactivo) de docentes y
 * preceptores y las tablas del plan de estudios. Si la base todavía no la
 * tiene (por ejemplo, en Neon antes de ejecutarla), se crea lo que falta para
 * que la aplicación no falle. Lo mismo con las funciones de la migración 008
 * (módulo de ingreso) y la asignación de docentes por módulo (009). Se
 * ejecuta una sola vez por proceso.
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

  // Migración 008: correlatividades desde el módulo de ingreso.
  const { rows: funciones } = await pool.query(
    `SELECT to_regprocedure(
              'public.correlativo_cumplido(integer, integer, integer, integer)'
            ) IS NOT NULL AS existe`,
  );
  if (!funciones[0].existe) {
    await pool.query(SQL_FUNCIONES_INGRESO);
  }

  // Migración 009: asignación de docentes por módulo.
  const { rowCount: conModulo } = await pool.query(
    `SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'docente_curso_materia'
        AND column_name = 'modulo_id'`,
  );
  if (conModulo === 0) {
    await pool.query(SQL_ASIGNACION_POR_MODULO);
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
