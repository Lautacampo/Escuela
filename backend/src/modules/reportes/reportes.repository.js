import { pool } from "../../config/db.js";
import { asegurarEsquemaPlanEstudio } from "../planestudios/planEstudios.repository.js";

// #41 - GET /api/reportes/inasistencias
// Lista los alumnos que quedaron LIBRES por inasistencias: superaron las 25
// faltas en un módulo que no tienen aprobado. Quien llegó a 25 justas sigue
// regular y no figura; tampoco quien ya aprobó el módulo.
// Con situacion = "riesgo" lista, en cambio, a los alumnos todavía REGULARES
// (módulo en curso o pendiente) con umbralRiesgo faltas o más: los que se
// acercan a quedar libres.
// Reporta faltas por cursada de módulo, sin sumarlas entre módulos.
// Sin filtro de módulo, muestra la cursada más reciente por alumno y módulo
// dentro del ciclo seleccionado. Con módulo, permite consultar su historial.
export const listarInasistenciasCriticas = async ({
  situacion = "libres",
  umbralRiesgo = 20,
  minFaltas = null,
  curso = null,
  division = null,
  anio = null,
  moduloId = null,
} = {}) => {
  const params = [minFaltas];
  const filtros = [];

  // Qué cursadas entran: las libres por inasistencias o las que están en riesgo.
  let filtroSituacion;
  if (situacion === "riesgo") {
    params.push(umbralRiesgo);
    filtroSituacion = `cm.condicion = 'REGULAR'
            AND cm.estado_academico IN ('EN_CURSO', 'PENDIENTE')
            AND COALESCE((SELECT SUM(a.valor_falta) FROM asistencia a
                           WHERE a.cursada_modulo_id = cm.id),
                         cm.cantidad_faltas_acumuladas) >= $${params.length}`;
  } else {
    filtroSituacion = `cm.condicion = 'LIBRE'
            AND cm.motivo_libre = 'INASISTENCIAS'`;
  }

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

  // Un ID posterior del mismo alumno y módulo representa una inscripción más reciente.
  const filtroCursadaActual =
    moduloId === null
      ? `AND NOT EXISTS (
         SELECT 1
           FROM cursada_modulo cm_nueva
           JOIN curso c_nuevo ON c_nuevo.id = cm_nueva.curso_id
          WHERE cm_nueva.alumno_id = cm.alumno_id
            AND cm_nueva.modulo_id = cm.modulo_id
            AND c_nuevo.ciclo_lectivo_id = c.ciclo_lectivo_id
            AND cm_nueva.id > cm.id
       )`
      : "";

  await asegurarEsquemaPlanEstudio();

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
                -- Total real de faltas (con medias faltas): 25,5 y no 26.
                COALESCE((
                  SELECT SUM(a.valor_falta)
                    FROM asistencia a
                   WHERE a.cursada_modulo_id = cm.id
                ), cm.cantidad_faltas_acumuladas)::float AS faltas,
                cm.condicion,
                pe.titulo AS "planEstudio"
           FROM cursada_modulo cm
           JOIN persona p ON p.id = cm.alumno_id
           JOIN alumno al ON al.id = cm.alumno_id
           LEFT JOIN plan_estudio pe ON pe.id = al.plan_estudio_id
           JOIN curso c ON c.id = cm.curso_id
           JOIN ciclo_lectivo cl ON cl.id = c.ciclo_lectivo_id
           JOIN modulo m ON m.id = cm.modulo_id
          -- Los alumnos dados de baja no generan alertas.
          WHERE al.activo
            -- Libres por inasistencias, o regulares en riesgo (nunca las aprobadas).
            AND ${filtroSituacion}
            ${whereExtra}
            ${filtroCursadaActual}
       ) sub
      WHERE ($1::numeric IS NULL OR sub.faltas >= $1)
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
