import { pool } from "../../config/db.js";

// #41 - GET /api/reportes/inasistencias
// Lista los alumnos que alcanzaron o superaron el límite de faltas (por defecto 25)
export const listarInasistenciasCriticas = async ({
  minFaltas = 25,
  curso = null,
  division = null,
} = {}) => {
  const params = [minFaltas];
  const filtros = [];

  if (curso !== null) {
    params.push(curso);
    filtros.push(`c.anio_curso = $${params.length}`);
  }
  if (division !== null) {
    params.push(division);
    filtros.push(`TRIM(c.division) = $${params.length}`);
  }

  const whereExtra = filtros.length > 0 ? `AND ${filtros.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT *
       FROM (
         SELECT cm.id AS id,
                p.id AS "alumnoId",
                p.nombre || ' ' || p.apellido AS nombre,
                p.apellido,
                p.dni,
                COALESCE(p.email, '') AS email,
                COALESCE(p.telefono, '') AS telefono,
                c.anio_curso::text AS curso,
                TRIM(c.division) AS division,
                m.numero_leyenda AS modulo,
                GREATEST(
                  cm.cantidad_faltas_acumuladas::numeric,
                  COALESCE((SELECT SUM(a.valor_falta) FROM asistencia a WHERE a.cursada_modulo_id = cm.id), 0)
                )::float AS faltas,
                cm.condicion
           FROM cursada_modulo cm
           JOIN persona p ON p.id = cm.alumno_id
           JOIN curso c ON c.id = cm.curso_id
           JOIN modulo m ON m.id = cm.modulo_id
          WHERE 1=1 ${whereExtra}
       ) sub
      WHERE sub.faltas >= $1
      ORDER BY sub.faltas DESC, sub.curso ASC, sub.division ASC, sub.apellido ASC`,
    params,
  );

  return rows;
};

// #42 - GET /api/reportes/desaprobaciones
// Calcula evaluados, desaprobados y porcentaje de desaprobación por materia, curso y división
export const listarDesaprobacionesPorMateria = async ({
  curso = null,
  division = null,
} = {}) => {
  const params = [];
  const filtros = [];

  if (curso !== null) {
    params.push(curso);
    filtros.push(`c.anio_curso = $${params.length}`);
  }
  if (division !== null) {
    params.push(division);
    filtros.push(`TRIM(c.division) = $${params.length}`);
  }

  const where = filtros.length > 0 ? `WHERE ${filtros.join(" AND ")}` : "";

  const { rows } = await pool.query(
    `SELECT ROW_NUMBER() OVER (
              ORDER BY
                ROUND(
                  (COUNT(*) FILTER (WHERE cal.estado = 'Desaprobado')::numeric /
                   NULLIF(COUNT(cal.id), 0)) * 100,
                  0
                ) DESC NULLS LAST,
                COUNT(*) FILTER (WHERE cal.estado = 'Desaprobado') DESC,
                ma.nombre ASC
            )::int AS id,
            ma.id AS "materiaId",
            ma.nombre AS materia,
            c.anio_curso::text AS curso,
            TRIM(c.division) AS division,
            m.numero_leyenda AS modulo,
            COUNT(cal.id)::int AS evaluados,
            COUNT(*) FILTER (WHERE cal.estado = 'Desaprobado')::int AS desaprobados,
            COUNT(*) FILTER (WHERE cal.estado = 'Aprobado')::int AS aprobados,
            COALESCE(
              ROUND(
                (COUNT(*) FILTER (WHERE cal.estado = 'Desaprobado')::numeric /
                 NULLIF(COUNT(cal.id), 0)) * 100,
                0
              )::int,
              0
            ) AS porcentaje
       FROM calificacion cal
       JOIN cursada_modulo cm ON cm.id = cal.cursada_modulo_id
       JOIN curso c ON c.id = cm.curso_id
       JOIN modulo m ON m.id = cm.modulo_id
       JOIN materia ma ON ma.id = cal.materia_id
       ${where}
      GROUP BY ma.id, ma.nombre, c.anio_curso, TRIM(c.division), m.id, m.numero_leyenda
     HAVING COUNT(cal.id) > 0
      ORDER BY porcentaje DESC, desaprobados DESC, ma.nombre ASC`,
    params,
  );

  return rows;
};
