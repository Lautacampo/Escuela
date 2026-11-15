import { pool } from "../../config/db.js";

const SELECT_ALUMNO = `
    SELECT p.id, p.nombre, p.apellido, p.dni, p.cuil, p.domicilio,
        p.telefono, p.email, to_char(a.fecha_nacimiento, 'YYYY-MM-DD') AS fecha_nacimiento,
        a.lugar_nacimiento, a.trabaja, a.telefono_emergencia, a.cantidad_hijos,
        a.activo
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

export const listarAlumnos = async ({ incluirInactivos = false } = {}) => {
    const filtro = incluirInactivos ? "" : "WHERE a.activo";
    const { rows } = await pool.query(
        `${SELECT_ALUMNO} ${filtro} ORDER BY p.apellido, p.nombre`
    );
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
               cm.cantidad_faltas_acumuladas, cm.estado_academico, cm.activa,
               m.numero_leyenda, c.anio_curso, c.division, cl.anio AS ciclo_anio
        FROM cursada_modulo cm
        JOIN modulo m ON m.id = cm.modulo_id
        JOIN curso c ON c.id = cm.curso_id
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

/**
 * Baja lógica: el alumno deja de aparecer en el padrón y en las planillas,
 * pero se conservan sus datos personales y todo su historial académico.
 * Las cursadas no se tocan para poder reactivarlo sin perder la matrícula.
 */
export const darDeBajaAlumno = async (id) => {
    const { rowCount } = await pool.query(
        "UPDATE alumno SET activo = false WHERE id = $1 AND activo",
        [id]
    );
    return rowCount > 0;
};

export const reactivarAlumno = async (id) => {
    const { rowCount } = await pool.query(
        "UPDATE alumno SET activo = true WHERE id = $1 AND NOT activo",
        [id]
    );
    return rowCount > 0;
};

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
                (alumno_id, curso_id, modulo_id, condicion, cantidad_faltas_acumuladas, estado_academico, activa)
        VALUES ($1, $2, $3, 'REGULAR', 0, 'EN_CURSO', true)
        RETURNING id`,
        [alumnoId, cursoId, moduloId]
    );
    return rows[0].id;
};

export const buscarCursadaActiva = async (alumnoId) => {
    const { rows } = await pool.query(
        `SELECT id, curso_id, modulo_id
           FROM cursada_modulo
          WHERE alumno_id = $1 AND activa
          ORDER BY id DESC
          LIMIT 1`,
        [alumnoId]
    );
    return rows[0] ?? null;
};

// Módulos correlativos del módulo indicado que el alumno todavía no aprobó.
export const correlativosPendientes = async (alumnoId, moduloId) => {
    const { rows } = await pool.query(
        `SELECT m.id, m.numero_leyenda AS nombre
           FROM modulo_correlativo mc
           JOIN modulo m ON m.id = mc.modulo_correlativo_id
          WHERE mc.modulo_id = $1
            AND NOT EXISTS (
                SELECT 1
                  FROM cursada_modulo cm
                 WHERE cm.alumno_id = $2
                   AND cm.modulo_id = mc.modulo_correlativo_id
                   AND cm.estado_academico = 'APROBADO'
            )
          ORDER BY m.id`,
        [moduloId, alumnoId]
    );
    return rows;
};

/**
 * Cambia la cursada activa del alumno.
 *
 * - Si el módulo no cambia, sólo se actualiza el curso (año/división).
 * - Si el módulo cambia y la cursada actual no tiene datos académicos
 *   (evaluaciones, asistencias o calificaciones), se corrige la misma fila.
 * - Si la cursada actual ya tiene datos, se marca como inactiva y se crea
 *   una nueva cursada activa, conservando el historial.
 */
export const actualizarCursadaActiva = (alumnoId, { cursoId, moduloId }) =>
    enTransaccion(async (db) => {
        const { rows } = await db.query(
            `SELECT cm.id, cm.curso_id, cm.modulo_id, cm.estado_academico,
                    EXISTS (
                        SELECT 1 FROM evaluacion_modulo e
                         WHERE e.cursada_modulo_id = cm.id
                    ) AS tiene_evaluaciones,
                    EXISTS (
                        SELECT 1 FROM asistencia a
                         WHERE a.cursada_modulo_id = cm.id
                    ) AS tiene_asistencias,
                    EXISTS (
                        SELECT 1 FROM calificacion c
                         WHERE c.cursada_modulo_id = cm.id
                    ) AS tiene_calificaciones
               FROM cursada_modulo cm
              WHERE cm.alumno_id = $1 AND cm.activa
              ORDER BY cm.id DESC
              LIMIT 1
              FOR UPDATE`,
            [alumnoId]
        );
        const actual = rows[0] ?? null;

        if (actual && Number(actual.modulo_id) === Number(moduloId)) {
            if (Number(actual.curso_id) !== Number(cursoId)) {
                await db.query(
                    `UPDATE cursada_modulo SET curso_id = $2 WHERE id = $1`,
                    [actual.id, cursoId]
                );
            }
            return { cursadaModuloId: actual.id, creada: false };
        }

        const esCorreccion =
            actual != null &&
            actual.estado_academico !== "APROBADO" &&
            !actual.tiene_evaluaciones &&
            !actual.tiene_asistencias &&
            !actual.tiene_calificaciones;

        if (esCorreccion) {
            await db.query(
                `UPDATE cursada_modulo
                    SET curso_id = $2, modulo_id = $3
                  WHERE id = $1`,
                [actual.id, cursoId, moduloId]
            );
            return { cursadaModuloId: actual.id, creada: false };
        }

        if (actual) {
            await db.query(
                `UPDATE cursada_modulo SET activa = false WHERE id = $1`,
                [actual.id]
            );
        }

        const { rows: nuevas } = await db.query(
            `INSERT INTO cursada_modulo
                    (alumno_id, curso_id, modulo_id, condicion, cantidad_faltas_acumuladas, estado_academico, activa)
            VALUES ($1, $2, $3, 'REGULAR', 0, 'EN_CURSO', true)
            RETURNING id`,
            [alumnoId, cursoId, moduloId]
        );

        return { cursadaModuloId: nuevas[0].id, creada: true };
    });

/**
 * Registra una evaluación de módulo y, si la nota alcanza, acredita el módulo.
 *
 * Todo ocurre en una transacción con la fila de cursada bloqueada: así dos
 * envíos simultáneos no pueden insertar la misma instancia ni evaluar un
 * módulo que acaba de ser aprobado.
 *
 * Devuelve { creada: false, motivo, ... } cuando una regla de negocio no se
 * cumple, para que el service traduzca el motivo a un error HTTP.
 */
export const registrarEvaluacionModulo = (
    cursadaId,
    { fecha, nota, nroInstancia, tipoInstancia }
) =>
    enTransaccion(async (db) => {
        const { rows } = await db.query(
            `SELECT cm.id, cm.modulo_id,
                    UPPER(TRIM(cm.estado_academico)) AS estado_academico,
                    al.activo AS alumno_activo,
                    EXISTS (
                        SELECT 1
                          FROM evaluacion_modulo e
                         WHERE e.cursada_modulo_id = cm.id
                           AND e.nota >= 7
                    ) AS tiene_aprobacion
               FROM cursada_modulo cm
               JOIN alumno al ON al.id = cm.alumno_id
              WHERE cm.id = $1
              FOR UPDATE`,
            [cursadaId]
        );

        const cursada = rows[0];
        if (!cursada) return { creada: false, motivo: "NO_EXISTE" };
        if (!cursada.alumno_activo) {
            return { creada: false, motivo: "ALUMNO_INACTIVO" };
        }
        if (cursada.estado_academico === "APROBADO" || cursada.tiene_aprobacion) {
            return { creada: false, motivo: "MODULO_APROBADO" };
        }

        // Para evaluar el módulo todas sus materias deben estar aprobadas.
        const { rows: pendientes } = await db.query(
            `SELECT ma.nombre
               FROM materia_modulo mm
               JOIN materia ma ON ma.id = mm.materia_id
              WHERE mm.modulo_id = $1
                AND NOT EXISTS (
                    SELECT 1
                      FROM calificacion c
                     WHERE c.cursada_modulo_id = $2
                       AND c.materia_id = mm.materia_id
                       AND UPPER(TRIM(c.estado)) = 'APROBADO'
                )
              ORDER BY ma.nombre`,
            [cursada.modulo_id, cursadaId]
        );

        if (pendientes.length > 0) {
            return {
                creada: false,
                motivo: "MATERIAS_PENDIENTES",
                pendientes: pendientes.map((m) => m.nombre),
            };
        }

        const { rows: instancias } = await db.query(
            `SELECT COALESCE(MAX(nro_instancia), 0)::int AS ultima
               FROM evaluacion_modulo
              WHERE cursada_modulo_id = $1`,
            [cursadaId]
        );
        const ultima = instancias[0].ultima;

        if (ultima >= 4) {
            return { creada: false, motivo: "MAXIMO_INSTANCIAS" };
        }

        const siguiente = ultima + 1;
        if (nroInstancia !== siguiente) {
            return {
                creada: false,
                motivo: "INSTANCIA_INVALIDA",
                instanciaEsperada: siguiente,
            };
        }

        const { rows: evaluaciones } = await db.query(
            `INSERT INTO evaluacion_modulo
                    (cursada_modulo_id, fecha, nota, nro_instancia, tipo_instancia)
             VALUES ($1, $2::date, $3, $4, $5)
             RETURNING id,
                       cursada_modulo_id,
                       to_char(fecha, 'YYYY-MM-DD') AS fecha,
                       nota::float AS nota,
                       nro_instancia,
                       tipo_instancia`,
            [cursadaId, fecha, nota, siguiente, tipoInstancia]
        );

        const aprobado = Number(nota) >= 7;
        if (aprobado) {
            await db.query(
                `UPDATE cursada_modulo
                    SET estado_academico = 'APROBADO'
                  WHERE id = $1`,
                [cursadaId]
            );
        }

        return {
            creada: true,
            evaluacion: evaluaciones[0],
            aprobado,
            estadoAcademico: aprobado ? "APROBADO" : cursada.estado_academico,
        };
    });