import { pool } from "../../config/db.js";

// #41 - GET /api/reportes/inasistencias
// Lista los alumnos que alcanzaron o superaron el límite de faltas (por defecto 25)
// Reporta faltas por cursada de módulo, sin sumarlas entre módulos.
// Sin filtro de módulo, muestra solo la cursada más reciente del alumno
// dentro del ciclo seleccionado. Con módulo, permite consultar su historial.
export const listarInasistenciasCriticas = async ({
  minFaltas = 25,
  curso = null,
  division = null,
  anio = null,
  moduloId = null,
} = {}) => {
  const params = [minFaltas];
  const filtros = [];

  if (anio !== null) {
    params.push(anio);
    filtros.push(`cl.anio = $${params.length}`);
  }
  if (curso !== null) {
    params.push(curso);
    filtros.push(`c.anio_curso = $${params.length}`);
  }
  if (division !== null) {
    params.push(division);
    filtros.push(`TRIM(c.division) = $${params.length}`);
  }
  if (moduloId !== null) {
    params.push(moduloId);
    filtros.push(`cm.modulo_id = $${params.length}`);
  }

  const whereExtra = filtros.length ? `AND ${filtros.join(" AND ")}` : "";

  // Un ID de cursada posterior representa una inscripción más reciente.
  // Este criterio respeta el funcionamiento actual del proyecto.
  const filtroCursadaActual =
    moduloId === null
      ? `AND NOT EXISTS (
         SELECT 1
           FROM cursada_modulo cm_nueva
           JOIN curso c_nuevo ON c_nuevo.id = cm_nueva.curso_id
          WHERE cm_nueva.alumno_id = cm.alumno_id
            AND c_nuevo.ciclo_lectivo_id = c.ciclo_lectivo_id
            AND cm_nueva.id > cm.id
       )`
      : "";

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
                  COALESCE((
                    SELECT SUM(a.valor_falta)
                      FROM asistencia a
                     WHERE a.cursada_modulo_id = cm.id
                  ), 0)
                )::float AS faltas,
                cm.condicion
           FROM cursada_modulo cm
           JOIN persona p ON p.id = cm.alumno_id
           JOIN curso c ON c.id = cm.curso_id
           JOIN ciclo_lectivo cl ON cl.id = c.ciclo_lectivo_id
           JOIN modulo m ON m.id = cm.modulo_id
          WHERE 1 = 1 ${whereExtra}
            ${filtroCursadaActual}
       ) sub
      WHERE sub.faltas > $1
      ORDER BY sub.faltas DESC, sub.curso ASC,
               sub.division ASC, sub.apellido ASC`,
    params,
  );

  return rows;
};

// #42 - GET /api/reportes/desaprobaciones
// Calcula evaluados, desaprobados y porcentaje de desaprobación por materia, curso y división
export const listarDesaprobacionesPorMateria = async ({
  curso = null,
  division = null,
  anio = null,
} = {}) => {
  const params = [];
  const filtros = [];

  if (anio !== null) {
    params.push(anio);
    filtros.push(`cl.anio = $${params.length}`);
  }

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
       JOIN ciclo_lectivo cl ON cl.id = c.ciclo_lectivo_id
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
