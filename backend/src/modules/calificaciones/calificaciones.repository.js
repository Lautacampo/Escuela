import { pool } from "../../config/db.js";

// Ciclos disponibles para Directivos y Docentes (sin abrir las rutas de Plan de Estudios).
export const listarCiclos = async () => {
  const { rows } = await pool.query(
    "SELECT id, anio FROM ciclo_lectivo ORDER BY anio DESC",
  );
  return rows;
};

export const buscarPersonaIdDeUsuario = async (usuarioId) => {
  const { rows } = await pool.query(
    "SELECT persona_id FROM usuarios WHERE id = $1",
    [usuarioId],
  );
  return rows[0]?.persona_id ?? null;
};

export const listarCursosModulos = async (docenteId = null, anio) => {
  const params = [anio];
  let filtro = "WHERE cl.anio = $1";
  let filtroMaterias = "";

  if (docenteId !== null) {
    params.push(docenteId);
    filtro += `
      WHERE EXISTS (
        SELECT 1 FROM docente_curso_materia dcm
        JOIN materia_modulo mm
          ON mm.materia_id = dcm.materia_id AND mm.modulo_id = m.id
        WHERE dcm.docente_id = $2 AND dcm.curso_id = c.id
      )`;
    filtroMaterias = `
      AND ma.id IN (
        SELECT dcm.materia_id
          FROM docente_curso_materia dcm
          JOIN curso_modulo cm2 ON cm2.curso_id = dcm.curso_id
         WHERE dcm.docente_id = $2 AND cm2.modulo_id = m.id
      )`;
  }

  const { rows } = await pool.query(
    `SELECT c.anio_curso, m.id AS modulo_id, m.numero_leyenda, c.division,
            ARRAY(
              SELECT DISTINCT ma.nombre
                FROM materia_modulo mm
                JOIN materia ma ON ma.id = mm.materia_id
               WHERE mm.modulo_id = m.id ${filtroMaterias}
               ORDER BY ma.nombre
            ) AS materias
       FROM curso_modulo cm
       JOIN curso c ON c.id = cm.curso_id
       JOIN ciclo_lectivo cl ON cl.id = c.ciclo_lectivo_id
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
  docenteId = null,
  anio,
) => {
  const params = [moduloId, anio];
  let filtro = "";
  if (docenteId !== null) {
    params.push(docenteId);
    filtro = `
        AND EXISTS (SELECT 1 FROM docente_curso_materia dcm
        JOIN materia_modulo mm
          ON mm.materia_id = dcm.materia_id AND mm.modulo_id = cm.modulo_id
        WHERE dcm.docente_id = $3 AND dcm.curso_id = c.id)`;
  }
  const { rows } = await pool.query(
    `SELECT DISTINCT TRIM(c.division) AS division
       FROM curso_modulo cm
       JOIN curso c ON c.id = cm.curso_id
       JOIN ciclo_lectivo cl ON cl.id = c.ciclo_lectivo_id
      WHERE cm.modulo_id = $1 AND cl.anio = $2 ${filtro}
      ORDER BY division`,
    params,
  );
  return rows.map((r) => r.division);
};

export const buscarCurso = async (moduloId, division, anio) => {
  const { rows } = await pool.query(
    `SELECT c.id FROM curso c
       JOIN curso_modulo cm ON cm.curso_id = c.id
       JOIN ciclo_lectivo cl ON cl.id = c.ciclo_lectivo_id
      WHERE cm.modulo_id = $1
        AND TRIM(c.division) = $2
        AND cl.anio = $3
      ORDER BY c.id DESC
      LIMIT 1`,
    [moduloId, division, anio],
  );
  return rows[0] ?? null;
};

export const docenteTieneCurso = async (docenteId, cursoId) => {
  const { rowCount } = await pool.query(
    "SELECT 1 FROM docente_curso_materia WHERE docente_id = $1 AND curso_id = $2",
    [docenteId, cursoId],
  );
  return rowCount > 0;
};

export const listarMaterias = async (moduloId, docenteId = null, cursoId = null) => {
  const params = [moduloId];
  let filtro = "";
  if (docenteId !== null) {
    params.push(docenteId);
    let filtroCurso = "";
    if (cursoId !== null) {
      params.push(cursoId);
      filtroCurso = ` AND dcm.curso_id = $${params.length}`;
    }
    filtro = `AND ma.id IN (
      SELECT dcm.materia_id FROM docente_curso_materia dcm
      WHERE dcm.docente_id = $2${filtroCurso}
    )`;
  }
  const { rows } = await pool.query(
    `SELECT ma.id, ma.nombre
       FROM materia_modulo mm JOIN materia ma ON ma.id = mm.materia_id
      WHERE mm.modulo_id = $1 ${filtro}
      ORDER BY ma.nombre`,
    params,
  );
  return rows;
};

export const listarAlumnos = async (cursoId, moduloId) => {
  const { rows } = await pool.query(
    `SELECT cm.id AS cursada_id, p.apellido, p.nombre
       FROM cursada_modulo cm JOIN persona p ON p.id = cm.alumno_id
       JOIN alumno al ON al.id = cm.alumno_id
      WHERE cm.curso_id = $1 AND cm.modulo_id = $2 AND al.activo
      ORDER BY p.apellido, p.nombre`,
    [cursoId, moduloId],
  );
  return rows;
};

export const listarEstados = async (cursadaIds, materiaIds) => {
  const { rows } = await pool.query(
    `SELECT cursada_modulo_id, materia_id, estado FROM calificacion
      WHERE cursada_modulo_id = ANY($1::int[]) AND materia_id = ANY($2::int[])`,
    [cursadaIds, materiaIds],
  );
  return rows;
};

export const buscarCursadaConMateria = async (cursadaId, materiaId) => {
  const { rows } = await pool.query(
    `SELECT cm.curso_id, cl.anio
       FROM cursada_modulo cm
       JOIN curso c ON c.id = cm.curso_id
       JOIN ciclo_lectivo cl ON cl.id = c.ciclo_lectivo_id
       JOIN materia_modulo mm ON mm.modulo_id = cm.modulo_id AND mm.materia_id = $2
       JOIN alumno al ON al.id = cm.alumno_id
      WHERE cm.id = $1 AND al.activo`,
    [cursadaId, materiaId],
  );
  return rows[0] ?? null;
};

export const docenteDaMateriaEnCurso = async (
  docenteId,
  materiaId,
  cursoId,
) => {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM docente_curso_materia
      WHERE docente_id = $1 AND materia_id = $2 AND curso_id = $3`,
    [docenteId, materiaId, cursoId],
  );
  return rowCount > 0;
};

export const guardarEstado = async (materiaId, cursadaId, estado) => {
  const { rows } = await pool.query(
    `INSERT INTO calificacion (materia_id, cursada_modulo_id, estado)
     VALUES ($1, $2, $3)
     ON CONFLICT (cursada_modulo_id, materia_id)
     DO UPDATE SET estado = EXCLUDED.estado
     RETURNING id, materia_id, cursada_modulo_id, estado`,
    [materiaId, cursadaId, estado],
  );
  return rows[0];
};
