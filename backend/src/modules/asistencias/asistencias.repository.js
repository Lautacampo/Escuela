import { pool } from "../../config/db.js";

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
              cm.cantidad_faltas_acumuladas
            ) AS faltas_acumuladas,
            -- Condición real de la cursada: contempla los 3 escenarios de
            -- LIBRE (inasistencias, materia desaprobada, instancias agotadas).
            INITCAP(cm.condicion) AS condicion,
            cm.motivo_libre,
            cm.estado_academico,
            asi.id AS asistencia_id,
            asi.valor_falta
       FROM cursada_modulo cm
       JOIN persona p ON p.id = cm.alumno_id
       JOIN alumno al ON al.id = cm.alumno_id
       LEFT JOIN asistencia asi
         ON asi.cursada_modulo_id = cm.id AND asi.fecha = $3::date
      WHERE cm.curso_id = $1 AND cm.modulo_id = $2 AND al.activo
        -- Quien ya aprobó el módulo sale de la planilla: vuelve a aparecer en
        -- el módulo en el que se lo matricule después.
        AND cm.estado_academico <> 'APROBADO'
        -- Si el alumno recursa el módulo, solo se lista su cursada nueva.
        AND NOT EXISTS (
            SELECT 1 FROM cursada_modulo nueva
             WHERE nueva.alumno_id = cm.alumno_id
               AND nueva.modulo_id = cm.modulo_id
               AND nueva.id > cm.id)
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
  const condiciones = ["al.activo"];

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
       JOIN alumno al ON al.id = cm.alumno_id
       ${where}
      ORDER BY a.fecha DESC, p.apellido, p.nombre`,
    params,
  );
  return rows;
};

export const buscarCursada = async (cursadaId) => {
  const { rows } = await pool.query(
    `SELECT cm.id, cm.alumno_id, cm.modulo_id, cm.curso_id,
            cm.estado_academico, al.activo AS alumno_activo, cl.anio AS ciclo_anio,
            EXISTS (SELECT 1 FROM cursada_modulo nueva
                     WHERE nueva.alumno_id = cm.alumno_id
                       AND nueva.modulo_id = cm.modulo_id
                       AND nueva.id > cm.id) AS reemplazada
       FROM cursada_modulo cm
       JOIN alumno al ON al.id = cm.alumno_id
       JOIN curso c ON c.id = cm.curso_id
       JOIN ciclo_lectivo cl ON cl.id = c.ciclo_lectivo_id
      WHERE cm.id = $1`,
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
            cm.curso_id,
            cm.estado_academico, al.activo AS alumno_activo, cl.anio AS ciclo_anio,
            EXISTS (SELECT 1 FROM cursada_modulo nueva
                     WHERE nueva.alumno_id = cm.alumno_id
                       AND nueva.modulo_id = cm.modulo_id
                       AND nueva.id > cm.id) AS reemplazada
       FROM asistencia a
       JOIN cursada_modulo cm ON cm.id = a.cursada_modulo_id
       JOIN alumno al ON al.id = cm.alumno_id
       JOIN curso c ON c.id = cm.curso_id
       JOIN ciclo_lectivo cl ON cl.id = c.ciclo_lectivo_id
      WHERE a.id = $1`,
    [id],
  );
  return rows[0] ?? null;
};

// Las faltas acumuladas y la condición las mantiene la base (trigger
// asistencia_recalcular_situacion): acá solo se lee el resultado para
// devolverlo al cliente.
const sincronizarFaltasCursada = async (cursadaId, db = pool) => {
  const { rows } = await db.query(
    `SELECT COALESCE((SELECT SUM(a.valor_falta) FROM asistencia a
                       WHERE a.cursada_modulo_id = cm.id), 0)::float AS total,
            INITCAP(cm.condicion) AS condicion,
            cm.motivo_libre
       FROM cursada_modulo cm
      WHERE cm.id = $1`,
    [cursadaId],
  );

  return {
    faltasAcumuladas: rows[0]?.total ?? 0,
    condicion: rows[0]?.condicion ?? "Regular",
    motivoLibre: rows[0]?.motivo_libre ?? null,
  };
};

// Guarda o actualiza la asistencia de un alumno en una fecha (Upsert)
export const guardarAsistencia = async (cursadaId, fecha, valorFalta) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO asistencia (cursada_modulo_id, fecha, valor_falta)
       VALUES ($1, $2::date, $3)
       ON CONFLICT (cursada_modulo_id, fecha)
       DO UPDATE SET valor_falta = EXCLUDED.valor_falta
       RETURNING id, cursada_modulo_id AS "cursadaModuloId", TO_CHAR(fecha, 'YYYY-MM-DD') as fecha, valor_falta::float AS "valorFalta"`,
      [cursadaId, fecha, valorFalta]
    );
    const registro = rows[0];

    const resumen = await sincronizarFaltasCursada(cursadaId, client);

    await client.query('COMMIT');
    return { ...registro, ...resumen};
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
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
