import { pool } from "../../config/db.js";

const SELECT_CURSO = `
    SELECT c.id, c.anio_curso, c.division, 
        cl.id AS ciclo_id, cl.anio AS ciclo_anio,
        p.id AS preceptor_id, p.nombre AS preceptor_nombre, p.apellido AS preceptor_apellido,
        (SELECT COUNT(DISTINCT cu.alumno_id)
            FROM cursada_modulo cu
            WHERE cu.curso_id = c.id)::int AS cantidad_alumnos
    FROM curso c
        JOIN ciclo_lectivo cl ON cl.id = c.ciclo_lectivo_id
        JOIN persona p ON p.id = c.preceptor_id`;


export const buscarPersonaIdDeUsuario = async (usuarioId) => {
    const { rows } = await pool.query(
        "SELECT persona_id FROM usuarios WHERE id = $1",
        [usuarioId]
    );
    return rows[0]?.persona_id ?? null;
};

// CICLOS LECTIVOS

export const listarCiclos = async () => {
    const { rows } = await pool.query(
        "SELECT id, anio FROM ciclo_lectivo ORDER BY anio DESC"
    );
    return rows;
};

export const buscarCicloVigente = async () => {
    const { rows } = await pool.query(
        "SELECT id, anio FROM ciclo_lectivo ORDER BY anio DESC LIMIT 1"
    );
    return rows[0] ?? null;
};

export const crearCiclo = async (anio) => {
    const {rows} = await pool.query(
        "INSERT INTO ciclo_lectivo (anio) VALUES $1 RETURNING id, anio",
        [anio]
    );
    return rows[0];
};

// CURSOS

export const listarCursos = async ({
    cicloLectivoId, anioCurso = null, docenteId = null, preceptorId = null
}) => {
    const params = [cicloLectivoId];
    const condiciones = ["c.ciclo_lectivo_id = $1"];

    if (anioCurso !== null) {
        params.push(anioCurso);
        condiciones.push(`c.anio_curso = $${params.length}`);
    }
    if (preceptorId !== null) {
        params.push(preceptorId);
        condiciones.push(`c.preceptor_id = $${params.length}`);
    }
    if (docenteId !== null) {
        params.push(docenteId);
        condiciones.push(`EXISTS (SELECT 1 FROM docente_curso dc
                                    WHERE dc.curso_id = c.id AND dc.docente_id = $${params.length})`);
    }

    const { rows } = await pool.query(
        `${SELECT_CURSO}
            WHERE ${condiciones.join(" AND ")}
            ORDER BY c.anio_curso, c.division`,
        params
    );
    return rows;
};

export const buscarCursoPorId = async (id) => {
    const { rows } = await pool.query(`${SELECT_CURSO} WHERE c.id = $1` [id]);
    return rows[0] ?? null;
};

export const crearCurso = async ({cicloLectivoId, anioCurso, division, preceptorId}) => {
    const { rows } = await pool.query(
        `
        INSERT INTO curso (ciclo_lectivo_id, anio_curso, division, preceptor_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id
        `,
        [cicloLectivoId, anioCurso, division, preceptorId]
    );
    return rows[0];
};

export const actualizarPreceptor = async (id, preceptorId) => {
    const { rowCount } = await pool.query(
        "UPDATE curso SET preceptor_id = $2 WHERE id = $1",
        [id, preceptorId]
    );
    return rowCount > 0;
};

export const docenteTieneCurso = async (docenteId, cursoId) => {
    const { rowCount } = await pool.query(
        "SELECT 1 FROM docente_curso WHERE docente_id = $1 AND curso_id = $2",
        [docenteId, cursoId]
    );
    return rowCount > 0;
};

export const listarModulosDeCurso = async (cursoId) => {
    const { rows } = await pool.query(
        `
        SELECT m.id, m.numero_leyenda
        FROM curso_modulo cm
        JOIN modulo m ON m.id = cm.modulo_id
        WHERE cm.curso_id = $1
        ORDER BY m.id
        `,
        [cursoId]
    );
    return rows;
};

export const agregarModulo = async (cursoId, moduloId) => {
    await pool.query(
        "INSERT INTO curso_modulo (curso_id, modulo_id) VALUES ($1, $2)",
        [cursoId, moduloId]
    );
};

export const quitarModulo = async (cursoId, moduloId) => {
    const { rowCount } = await pool.query(
        "DELETE FROM curso_modulo WHERE curso_id = $1 AND modulo_id = $2",
        [cursoId, moduloId]
    );
    return rowCount > 0;
};

export const hayCursadas = async (cursoId, moduloId) => {
    const { rowCount } = await pool.query(
        "SELECT 1 FROM cursada_modulo WHERE curso_id = $1 AND modulo_id = $2 LIMIT 1",
        [cursoId, moduloId]
    );
    return rowCount > 0;
};