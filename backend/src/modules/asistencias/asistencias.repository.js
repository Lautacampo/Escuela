import { pool } from "../../config/db.js";

const LIMITE_FALTAS_LIBRE = 25;

// Verifica que el usuario esté vinculado a una persona que además sea preceptor
export const buscarPreceptorIdDeUsuario = async (usuarioId) => {
  const { rows } = await pool.query(
    `SELECT pr.id
       FROM usuarios u
       JOIN preceptor pr ON pr.id = u.persona_id
      WHERE u.id = $1`,
    [usuarioId],
  );
  return rows[0]?.id ?? null;
};

export const listarCursosModulos = async (preceptorId = null) => {
  const params = [];
  let filtro = "";
  if (preceptorId !== null) {
    params.push(preceptorId);
    filtro = "WHERE c.preceptor_id = $1";
  }

  const { rows } = await pool.query(
    `SELECT c.anio_curso, m.id AS modulo_id, m.numero_leyenda, c.division
       FROM curso_modulo cm
       JOIN curso c ON c.id = cm.curso_id
       JOIN modulo m ON m.id = cm.modulo_id
       ${filtro}
      ORDER BY c.anio_curso, m.id, c.division`,
    params,
  );
  return rows;
};

export const buscarModulo = async (moduloId) => {
  const { rows } = await pool.query(
    "SELECT id, numero_leyenda FROM modulo WHERE id = $1",
    [moduloId],
  );
  return rows[0] ?? null;
};

export const listarDivisionesDeModulo = async (
  moduloId,
  preceptorId = null,
) => {
  const params = [moduloId];
  let filtro = "";
  if (preceptorId !== null) {
    params.push(preceptorId);
    filtro = "AND c.preceptor_id = $2";
  }

  const { rows } = await pool.query(
    `SELECT c.division
       FROM curso_modulo cm
       JOIN curso c ON c.id = cm.curso_id
      WHERE cm.modulo_id = $1 ${filtro}
      ORDER BY c.division`,
    params,
  );
  return rows.map((r) => r.division.trim());
};

export const buscarCurso = async (moduloId, division) => {
  const { rows } = await pool.query(
    `SELECT c.id, c.preceptor_id
       FROM curso c
       JOIN curso_modulo cm ON cm.curso_id = c.id
      WHERE cm.modulo_id = $1 AND c.division = $2`,
    [moduloId, division],
  );
  return rows[0] ?? null;
};

export const preceptorTieneCurso = async (preceptorId, cursoId) => {
  const { rowCount } = await pool.query(
    "SELECT 1 FROM curso WHERE id = $1 AND preceptor_id = $2",
    [cursoId, preceptorId],
  );
  return rowCount > 0;
};

// Obtiene la planilla de alumnos de un curso+módulo con su asistencia en la fecha elegida y el total acumulado
export const listarAlumnosPlanilla = async (cursoId, moduloId, fecha) => {
  const { rows } = await pool.query(
    `SELECT cm.id AS cursada_id,
            cm.alumno_id,
            p.apellido,
            p.nombre,
            p.dni,
            COALESCE(
              (SELECT SUM(a2.valor_falta) FROM asistencia a2 WHERE a2.cursada_modulo_id = cm.id),
              0
            ) AS faltas_acumuladas,
            CASE
              WHEN COALESCE(
                (SELECT SUM(a2.valor_falta) FROM asistencia a2 WHERE a2.cursada_modulo_id = cm.id),
                0
              ) >= ${LIMITE_FALTAS_LIBRE} THEN 'Libre'
              ELSE 'Regular'
            END AS condicion,
            asi.id AS asistencia_id,
            asi.valor_falta
       FROM cursada_modulo cm
       JOIN persona p ON p.id = cm.alumno_id
       LEFT JOIN asistencia asi
         ON asi.cursada_modulo_id = cm.id AND asi.fecha = $3::date
      WHERE cm.curso_id = $1 AND cm.modulo_id = $2
      ORDER BY p.apellido, p.nombre`,
    [cursoId, moduloId, fecha],
  );
  return rows;
};

export const listarAsistencias = async ({
  cursadaModuloId,
  fecha,
  preceptorId,
}) => {
  const params = [];
  const condiciones = [];

  if (cursadaModuloId !== null) {
    params.push(cursadaModuloId);
    condiciones.push(`a.cursada_modulo_id = $${params.length}`);
  }
  if (fecha !== null) {
    params.push(fecha);
    condiciones.push(`a.fecha = $${params.length}::date`);
  }
  if (preceptorId !== null) {
    params.push(preceptorId);
    condiciones.push(`c.preceptor_id = $${params.length}`);
  }

  const where =
    condiciones.length > 0 ? `WHERE ${condiciones.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT a.id,
            a.cursada_modulo_id AS "cursadaModuloId",
            cm.alumno_id AS "alumnoId",
            p.apellido,
            p.nombre,
            p.dni,
            cm.modulo_id AS "moduloId",
            c.division,
            TO_CHAR(a.fecha, 'YYYY-MM-DD') AS fecha,
            a.valor_falta::float AS "valorFalta"
       FROM asistencia a
       JOIN cursada_modulo cm ON cm.id = a.cursada_modulo_id
       JOIN curso c ON c.id = cm.curso_id
       JOIN persona p ON p.id = cm.alumno_id
       ${where}
      ORDER BY a.fecha DESC, p.apellido, p.nombre`,
    params,
  );
  return rows;
};

export const buscarCursada = async (cursadaId) => {
  const { rows } = await pool.query(
    "SELECT id, alumno_id, modulo_id, curso_id FROM cursada_modulo WHERE id = $1",
    [cursadaId],
  );
  return rows[0] ?? null;
};

export const buscarAsistenciaPorId = async (id) => {
  const { rows } = await pool.query(
    `SELECT a.id,
            a.cursada_modulo_id,
            TO_CHAR(a.fecha, 'YYYY-MM-DD') AS fecha_iso,
            a.valor_falta::float AS valor_falta,
            cm.curso_id
       FROM asistencia a
       JOIN cursada_modulo cm ON cm.id = a.cursada_modulo_id
      WHERE a.id = $1`,
    [id],
  );
  return rows[0] ?? null;
};

// Recalcula y sincroniza cantidad_faltas_acumuladas y condicion en cursada_modulo
const sincronizarFaltasCursada = async (cursadaId) => {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(valor_falta), 0)::float AS total
       FROM asistencia
      WHERE cursada_modulo_id = $1`,
    [cursadaId],
  );
  const total = rows[0]?.total ?? 0;
  const condicion = total >= LIMITE_FALTAS_LIBRE ? "Libre" : "Regular";

  await pool.query(
    `UPDATE cursada_modulo
        SET cantidad_faltas_acumuladas = CEIL($2::numeric)::int,
            condicion = $3
      WHERE id = $1`,
    [cursadaId, total, condicion],
  );

  return { faltasAcumuladas: total, condicion };
};

// Guarda o actualiza la asistencia de un alumno en una fecha (Upsert)
export const guardarAsistencia = async (cursadaId, fecha, valorFalta) => {
  // Buscamos si ya existe un registro para esa cursada y fecha
  const existente = await pool.query(
    `SELECT id FROM asistencia WHERE cursada_modulo_id = $1 AND fecha = $2::date`,
    [cursadaId, fecha],
  );

  let registro;
  if (existente.rowCount > 0) {
    const { rows } = await pool.query(
      `UPDATE asistencia
          SET valor_falta = $2
        WHERE id = $1
        RETURNING id, cursada_modulo_id AS "cursadaModuloId", TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, valor_falta::float AS "valorFalta"`,
      [existente.rows[0].id, valorFalta],
    );
    registro = rows[0];
  } else {
    const { rows } = await pool.query(
      `INSERT INTO asistencia (cursada_modulo_id, fecha, valor_falta)
       VALUES ($1, $2::date, $3)
       RETURNING id, cursada_modulo_id AS "cursadaModuloId", TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, valor_falta::float AS "valorFalta"`,
      [cursadaId, fecha, valorFalta],
    );
    registro = rows[0];
  }

  const resumen = await sincronizarFaltasCursada(cursadaId);
  return { ...registro, ...resumen };
};

export const actualizarAsistenciaPorId = async (
  id,
  cursadaId,
  valorFalta,
  fecha,
) => {
  const { rows } = await pool.query(
    `UPDATE asistencia
        SET valor_falta = $2,
            fecha = $3::date
      WHERE id = $1
      RETURNING id, cursada_modulo_id AS "cursadaModuloId", TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, valor_falta::float AS "valorFalta"`,
    [id, valorFalta, fecha],
  );
  const resumen = await sincronizarFaltasCursada(cursadaId);
  return { ...rows[0], ...resumen };
};

export const eliminarAsistenciaPorId = async (id, cursadaId) => {
  await pool.query("DELETE FROM asistencia WHERE id = $1", [id]);
  await sincronizarFaltasCursada(cursadaId);
};
