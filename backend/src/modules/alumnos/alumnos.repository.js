import { pool } from "../../config/db.js";

const SELECT_ALUMNO = `
    SELECT p.id, p.nombre, p.apellido, p.dni, p.cuil, p.domicilio,
        p.telefono, p.email, to_char(a.fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
        a.lugar_nacimiento, a.trabaja, a.telefono_emergencia, a.cant_hijos
    FROM alumno a
    JOIN persona p ON p.id = a.id
`;

const enTransaccion = async (fn) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const resultado = await fn(client);
        await client.query("COMMIT");
        return resultado;
    } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
    } finally {
        client.release();
    }
};

export const listarAlumnos = async () => {
    const { rows } = await pool.query(`${SELECT_ALUMNO} ORDER BY p.apellido, p.nombre`);
    return rows;
}

export const buscarAlumno = async (id) => {
    const { rows } = await pool.query(
        `${SELECT_ALUMNO} WHERE a.id = $1`, [id]);
    return rows[0] ?? null;
};

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

export const crearAlumno = (d) =>
    enTransaccion(async (db) => {
        const { rows } = await db.query(
        `INSERT INTO persona (nombre, apellido, dni, cuil, domicilio, telefono, email)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [d.nombre, d.apellido, d.dni, d.cuil, d.domicilio, d.telefono, d.email]
        );
        const id = rows[0].id;
        await db.query(
        `INSERT INTO alumno (id, fecha_nacimiento, lugar_nacimiento, trabaja,
                            telefono_emergencia, cantidad_hijos)
        VALUES ($1, $2, $3, $4, $5, $6)`,
        [id, d.fechaNacimiento, d.lugarNacimiento, d.trabaja, d.telefonoEmergencia, d.cantidadHijos]
        );
        return id;
});

export const actualizarAlumno = (id, d) =>
    enTransaccion(async (db) => {
        await db.query(
        `UPDATE persona
            SET nombre = $2, apellido = $3, dni = $4, cuil = $5,
                domicilio = $6, telefono = $7, email = $8
            WHERE id = $1`,
        [id, d.nombre, d.apellido, d.dni, d.cuil, d.domicilio, d.telefono, d.email]
        );
        await db.query(
        `UPDATE alumno
            SET fecha_nacimiento = $2, lugar_nacimiento = $3, trabaja = $4,
                telefono_emergencia = $5, cantidad_hijos = $6
            WHERE id = $1`,
        [id, d.fechaNacimiento, d.lugarNacimiento, d.trabaja, d.telefonoEmergencia, d.cantidadHijos]
        );
});

export const eliminarAlumno = (id) =>
    enTransaccion(async (db) => {
        await db.query("DELETE FROM cursada_modulo WHERE alumno_id = $1", [id]);
        await db.query("DELETE FROM alumno WHERE id = $1", [id]);
        await db.query("DELETE FROM persona WHERE id = $1", [id]);
});

export const cursoTieneModulo = async (cursoId, moduloId) => {
    const { rowCount } = await pool.query(
        "SELECT 1 FROM curso_modulo WHERE curso_id = $1 AND modulo_id = $2",
        [cursoId, moduloId]
    );
    return rowCount > 0;
};

export const yaAproboModulo = async (alumnoId, moduloId) => {
    const { rowCount } = await pool.query(
        `SELECT 1 FROM cursada_modulo
        WHERE alumno_id = $1 AND modulo_id = $2 AND estado_academico = 'APROBADO'`,
        [alumnoId, moduloId]
    );
    return rowCount > 0;
};

export const crearCursada = async (alumnoId, cursoId, moduloId) => {
    const { rows } = await pool.query(
        `INSERT INTO cursada_modulo
                (alumno_id, curso_id, modulo_id, condicion, cantidad_faltas_acumuladas, estado_academico)
        VALUES ($1, $2, $3, 'REGULAR', 0, 'EN_CURSO')
        RETURNING id`,
        [alumnoId, cursoId, moduloId]
    );
    return rows[0].id;
};