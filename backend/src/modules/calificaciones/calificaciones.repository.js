import { pool } from "../config/db.js";

export const buscarId = async (usuarioId)=>{
    const{rows} = await pool.query(
        "SELECT persona_id FROM usuarios WHERE id = $1 " 
        [usuarioId],
    );
    return rows[0]?.persona_id??null;
}

export const listarCursosModulos = async(docenteId = null)=>{
    const params ={};
    let filtro ="";
    if (docenteId != null){
        params.push(docenteId);
        filtro =
           ` WHERE EXISTS (SELECT 1 FROM docente_curso dc
            WHERE dc.docente_id = $1 AND dc.curso_id = c.id)
            AND EXISTS (SELECT 1 FROM docente_materia dm
            JOIN materia_modulo mm ON mm.materia_id = dm.materia_id
            WHERE dm.docente_id = $1 AND mm.modulo_id = m.id`;
    }

    const {row} = await pool.query(
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

export const buscarModulo = async (moduloId)=>{
    const {row} = await pool.query(
        "SELECT id, numero_leyenda FROM modulo WHERE id=$1",
        [moduloId],
    );
    return rows[0]??null;
}

export const listarDivisionesdeModulo = async (moduloId, docenteId = null)=>{
    const params = [moduloId];
  let filtro = "";
  if (docenteId !== null) {
    params.push(docenteId);
    filtro = `
        AND EXISTS (SELECT 1 FROM docente_curso dc
        WHERE dc.docente_id = $2 AND dc.curso_id = c.id)
        AND EXISTS (SELECT 1 FROM docente_materia dm
        JOIN materia_modulo mm ON mm.materia_id = dm.materia_id
        WHERE dm.docente_id = $2 AND mm.modulo_id = cm.modulo_id)`;
  }
  const {rows} = await pool.query(
    `   SELECT c.division
        FROM curso_modulo cm
        JOIN curso c ON c.id = cm.curso_id
        WHERE cm.modulo_id = $1 ${filtro}
        ORDER BY c.division`,
        params,
  );
  return rows.map((r)=>r.division);

};

export const buscarCurso = async (moduloId, division) => {
  const { rows } = await pool.query(
    `SELECT c.id FROM curso c
       JOIN curso_modulo cm ON cm.curso_id = c.id
      WHERE cm.modulo_id = $1 AND c.division = $2`,
    [moduloId, division],
  );
  return rows[0] ?? null;
};

export const docenteTieneCurso = async (docenteId, cursoId) => {
  const { rowCount } = await pool.query(
    "SELECT 1 FROM docente_curso WHERE docente_id = $1 AND curso_id = $2",
    [docenteId, cursoId],
  );
  return rowCount > 0;
};

export const listarMaterias = async (moduloId, docenteId = null) => {
  const params = [moduloId];
  let filtro = "";
  if (docenteId !== null) {
    params.push(docenteId);
    filtro = "AND ma.id IN (SELECT materia_id FROM docente_materia WHERE docente_id = $2)";
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
      WHERE cm.curso_id = $1 AND cm.modulo_id = $2
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
    `SELECT cm.curso_id
       FROM cursada_modulo cm
       JOIN materia_modulo mm ON mm.modulo_id = cm.modulo_id AND mm.materia_id = $2
      WHERE cm.id = $1`,
    [cursadaId, materiaId],
  );
  return rows[0] ?? null;
};

export const docenteDaMateriaEnCurso = async (docenteId, materiaId, cursoId) => {
  const { rowCount } = await pool.query(
    `SELECT 1 FROM docente_materia dm
       JOIN docente_curso dc ON dc.docente_id = dm.docente_id
      WHERE dm.docente_id = $1 AND dm.materia_id = $2 AND dc.curso_id = $3`,
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
