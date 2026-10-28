import { pool } from "../../config/db.js";

const SELECT_ALUMNO = `
    SELECT p.id, p.nombre, p.apellido, p.dni, p.cuil, p.domicilio,
        p.telefono, p.email, to_char(a.fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
        a.lugar_nacimiento, a.trabaja, a.telefono_emergencia, a.cant_hijos
    FROM alumno a
    JOIN persona p ON p.id = a.id
`;

const filtroAlcance = (alcance, params) => {
    if (alcance.docenteId !== undefined) {
        params.push(alcance.docenteId);
        return `EXISTS (SELECT 1 FROM cursada_modulo cm
                        JOIN docente_curso dc ON dc.curso_id = cm.curso_id
                        WHERE cm.alumno_id = a.id AND dc.docente_id = $${params.length})`;
    }
    if (alcance.preceptorId !== undefined) {
        params.push(alcance.preceptorId);
        return `EXISTS (SELECT 1 FROM cursada_modulo cm
                        JOIN curso c ON c.id = cm.curso_id
                        WHERE cm.alumno_id = a.id AND c.preceptor_id = $${params.length})`;
    }
    return null;
}

export const buscarAlumnoPorId = async (id) => {
    const { rows } = await pool.query(
        `${SELECT_ALUMNO} WHERE a.id = $1`, [id]);
    return rows[0] ?? null;
};

export const alumnoVisible = async (id, alcance) => {
    const filtro = filtroAlcance(alcance);
    const { rowCount } = await pool.query(
        `SELECT 1 FROM alumno a WHERE a.id = $1 ${filtro ?  `AND ${filtro}` : ""}`, [id]
    );
    return rowCount > 0;
}

export const listarCursadas = async (alumnoIds) => {
    const { rows } = await pool.query(
        `
        SELECT cm.id, cm.alumno_id, cm.curso_id, cm.modulo_id, cm.condicion,
               cm.cantidad_faltas_acumuladas, cm.estado_academico, m.numero_leyenda,
               c.anio_curso, c.division, cl.anio AS ciclo_anio
        FROM cursada_modulo cm
        JOIN modulo m ON m.id = cm.modulo_id
        JOIN ciclo_lectivo cl ON cl.id = c.ciclo_lectivo_id
        WHERE cm.alumno_id = ANY($1::int[])
        ORDER BY cl.anio, m.id, cm.id
        `,
        [alumnoIds]
    );
    return rows;
};

export const listarEvaluaciones = async (cursadaIds) => {
    const { rows } = await pool.query(
        `SELECT id, cursada_modulo_id, to_char(fecha, 'YYYY-MM-DD') AS fecha,
                nota, nro_instancia, tipo_instancia
         FROM evaluacion_modulo
         WHERE cursada_modulo_id = ANY($1::int[])
         ORDER BY nro_instancia`,
        [cursadaIds]
    );
    return rows;
};

export const crearPersona = async (d) => {
    const { rows } = await pool.query(
        `
        INSERT INTO persona (nombre, apellido, dni, cuil, domicilio, telefono, email)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id 
        `,
        [d.nombre, d.apellido, d.dni, d.cuil, d.domicilio, d.telefono, d.email]
    );
    return rows[0].id;
}

export const crearAlumno = async (id, d) => {
    await pool.query(
        `INSERT INTO alumno (id, fecha_nacimiento, lugar_nacimiento, trabaja,
                            telefono_emergencia, cantidad_hijos)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, d.fechaNacimiento, d.lugarNacimiento, d.trabaja, d.telefonoEmergencia, d.cantidadHijos]
    );
};

export const actualizarPersona = async (id, d) => {
    await pool.query(
        `
        UPDATE persona
            SET nombre = $2, apellido = $3, dni = $4, cuil = $5,
                domicilio = $6, telefono = $7, email = $8
        WHERE id = $1
        `,
        [id, d.nombre, d.apellido, d.dni, d.cuil, d.domicilio, d.telefono, d.email]
    );
};

export const actualizarAlumno = async (id, d) => {
    await pool.query(
        `
        UPDATE alumno
            SET fecha_nacimiento = $2, lugar_nacimiento = $3, trabaja = $4,
                telefono_emergencia = $5, cantidad_hijos = $6
        WHERE id = $1
        `,
        [id, d.fechaNacimiento, d.lugarNacimiento, d.trabaja, d.telefonoEmergencia, d.cantidadHijos]
    );
};

export const hayActividadAcademica = async (alumnoId) => {
    const { rows } = await pool.query(
        `
        SELECT EXISTS (
            SELECT 1 FROM cursada_modulo cm
            JOIN asistencia a ON a.cursada_modulo_id = cm.id
            WHERE cm.alumno_id = $1)
        OR EXISTS (
            SELECT 1 FROM cursada_modulo cm
            JOIN evaluacion_modulo e ON e.cursada_modulo_id = cm.id
            WHERE cm.alumno_id = $1)
        OR EXISTS (
            SELECT 1 FROM cursada_modulo cm
            JOIN calificacion c ON c.cursada_modulo_id = cm.id
            WHERE cm.alumno_id = $1) AS hay
        `,
        [alumnoId]
    ); 
    return rows[0].hay;
};

export const eliminarCursadas = async (alumnoId) => {
    await pool.query("DELETE FROM cursada_modulo WHERE alumno_id = $1", [alumnoId]);
};

export const eliminarAlumno = async (id) => {
    await pool.query("DELETE FROM alumno WHERE id = $1", [id]);
};

export const eliminarPersona = async (id) => {
    await pool.query("DELETE FROM persona WHERE id = $1", [id]);
};

export const bloquearAlumno = async (id) => {
    const { rows } = await pool.query("SELECT id FROM alumno WHERE id = $1 FOR UPDATE", [id]);
    return rows[0] ?? null;
};

export const buscarCursoConModulo = async (cursoId, moduloId) => {
    const { rows } = await pool.query(
        `
        SELECT c.id, c.preceptor_id,
            EXISTS (SELECT 1 FROM curso_modulo cm
                    WHERE cm.curso_id = c.id AND cm.modulo_id = $2) AS tiene_modulo
        FROM curso c
        WHERE c.id = $1
        `,
        [cursoId, moduloId]
    );
    return rows[0] ?? null;
};

export const listarCursadasDeModulo = async (alumnoId, moduloId) => {
    const { rows } = await pool.query(
        "SELECT id, estado_academico FROM cursada_modulo WHERE alumno_id = $1 AND modulo_id = $2",
        [alumnoId, moduloId]
    );
    return rows;
};

export const listarCorrelativasPendientes = async (alumnoId, moduloId) => {
    const { rows } = await pool.query(
        `
        SELECT m.id, m.numero_leyenda
        FROM modulo_correlativo mc
        JOIN modulo m ON m.id = mc.modulo_correlativo_id
        WHERE mc.modulo_id = $2
        AND NOT EXISTS (
            SELECT 1 FROM cursada_modulo cm
            WHERE cm.alumno_id = $1
            AND cm.modulo_id = mc.modulo_correlativo_id
            AND cm.estado_academico = 'APROBADO')
        ORDER BY m.id`,
        [alumnoId, moduloId]
    );
    return rows;
};

export const crearCursada = async (alumnoId, cursoId, moduloId, estado, condicion) => {
    const { rows } = await pool.query(
        `INSERT INTO cursada_modulo
            (alumno_id, curso_id, modulo_id, condicion, cantidad_faltas_acumuladas, estado_academico)
        VALUES ($1, $2, $3, $4, 0, $5)
        RETURNING id`,
        [alumnoId, cursoId, moduloId, condicion, estado]
    );
    return rows[0].id;
};