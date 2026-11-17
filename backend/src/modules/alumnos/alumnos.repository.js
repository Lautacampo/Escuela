import { pool } from "../../config/db.js";
import { ReglaNegocio } from "../../utils/reglaNegocio.js";
import { asegurarEsquemaPlanEstudio } from "../planestudios/planEstudios.repository.js";

// Una cursada "abierta" todavía puede acreditarse (no está aprobada ni libre).
const ESTADOS_ABIERTOS = ["EN_CURSO", "PENDIENTE"];

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

// Egresado: tiene acreditados todos los módulos del plan y aprobó al menos uno
// en la institución. Se calcula a partir de la trayectoria; no se guarda.
const ES_EGRESADO = (alumno) => `(
    EXISTS (SELECT 1 FROM modulo)
    AND NOT EXISTS (SELECT 1 FROM modulo m
                     WHERE NOT modulo_acreditado(${alumno}, m.id))
    AND EXISTS (SELECT 1 FROM cursada_modulo cm
                 WHERE cm.alumno_id = ${alumno}
                   AND cm.estado_academico = 'APROBADO'))`;

/**
 * Padrón de alumnos.
 * - Por defecto: alumnos activos que todavía no egresaron.
 * - soloEgresados: únicamente los egresados.
 */
export const listarAlumnos = async ({
    incluirInactivos = false,
    soloEgresados = false,
} = {}) => {
    const filtro = soloEgresados
        ? `WHERE ${ES_EGRESADO("a.id")}`
        : `WHERE NOT ${ES_EGRESADO("a.id")}${incluirInactivos ? "" : " AND a.activo"}`;
    const { rows } = await pool.query(
        `${SELECT_ALUMNO} ${filtro} ORDER BY p.apellido, p.nombre`
    );
    return rows;
}

export const esEgresado = async (alumnoId) => {
    const { rows } = await pool.query(
        `SELECT ${ES_EGRESADO("$1::int")} AS egresado`,
        [alumnoId]
    );
    return rows[0].egresado;
};

// Plan de estudios al que pertenece cada alumno (solo los que tienen uno).
export const listarPlanesDeAlumnos = async (alumnoIds) => {
    await asegurarEsquemaPlanEstudio();
    const { rows } = await pool.query(
        `SELECT a.id AS alumno_id, pe.id, pe.titulo, pe.resolucion, pe.activo
           FROM alumno a
           JOIN plan_estudio pe ON pe.id = a.plan_estudio_id
          WHERE a.id = ANY($1::int[])`,
        [alumnoIds]
    );
    return rows;
};

export const listarIdsModulos = async () => {
    const { rows } = await pool.query("SELECT id FROM modulo ORDER BY id");
    return rows.map((r) => r.id);
};

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
               cm.motivo_libre, m.periodo,
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

export const listarEquivalencias = async (alumnoIds, db = pool) => {
    const { rows } = await db.query(
        `SELECT e.alumno_id, e.modulo_id, m.numero_leyenda,
                to_char(e.fecha, 'YYYY-MM-DD') AS fecha, e.observacion
           FROM equivalencia_modulo e
           JOIN modulo m ON m.id = e.modulo_id
          WHERE e.alumno_id = ANY($1::int[])
          ORDER BY m.id`,
        [alumnoIds]
    );
    return rows;
};

// Materias del módulo de cada cursada con su estado (sin fila = "En Curso").
export const listarMateriasDeCursadas = async (cursadaIds) => {
    const { rows } = await pool.query(
        `SELECT cm.id AS cursada_modulo_id, ma.id, ma.nombre,
                COALESCE(c.estado, 'En Curso') AS estado
           FROM cursada_modulo cm
           JOIN materia_modulo mm ON mm.modulo_id = cm.modulo_id
           JOIN materia ma ON ma.id = mm.materia_id
           LEFT JOIN calificacion c
             ON c.cursada_modulo_id = cm.id AND c.materia_id = ma.id
          WHERE cm.id = ANY($1::int[])
          ORDER BY ma.nombre`,
        [cursadaIds]
    );
    return rows;
};

export const buscarModulo = async (moduloId, db = pool) => {
    const { rows } = await db.query(
        `SELECT id, numero_leyenda AS nombre, anio_curso, periodo
           FROM modulo WHERE id = $1`,
        [moduloId]
    );
    return rows[0] ?? null;
};

export const cursoTieneModulo = async (cursoId, moduloId) => {
    const { rowCount } = await pool.query(
        "SELECT 1 FROM curso_modulo WHERE curso_id = $1 AND modulo_id = $2",
        [cursoId, moduloId]
    );
    return rowCount > 0;
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

/**
 * Correlativos del módulo que el alumno todavía NO acreditó (ni aprobados ni
 * por equivalencia), con la situación de su última cursada en cada uno:
 *   estado = null        -> nunca lo cursó en la institución
 *   estado = A_RECURSAR  -> quedó libre, debe recursarlo
 *   estado = EN_CURSO / PENDIENTE -> todavía lo está acreditando
 */
export const correlativosPendientes = async (alumnoId, moduloId, db = pool) => {
    const { rows } = await db.query(
        `SELECT m.id, m.numero_leyenda AS nombre,
                (SELECT cm.estado_academico
                   FROM cursada_modulo cm
                  WHERE cm.alumno_id = $2 AND cm.modulo_id = m.id
                  ORDER BY cm.id DESC
                  LIMIT 1) AS estado
           FROM modulo_correlativo mc
           JOIN modulo m ON m.id = mc.modulo_correlativo_id
          WHERE mc.modulo_id = $1
            AND NOT modulo_acreditado($2, m.id)
          ORDER BY m.id`,
        [moduloId, alumnoId]
    );
    return rows;
};

// Correlativos pendientes de varias cursadas a la vez (para la ficha).
export const correlativosPendientesDeCursadas = async (cursadaIds) => {
    const { rows } = await pool.query(
        `SELECT cm.id AS cursada_modulo_id, m.id, m.numero_leyenda AS nombre
           FROM cursada_modulo cm
           JOIN modulo_correlativo mc ON mc.modulo_id = cm.modulo_id
           JOIN modulo m ON m.id = mc.modulo_correlativo_id
          WHERE cm.id = ANY($1::int[])
            AND NOT modulo_acreditado(cm.alumno_id, m.id)
          ORDER BY m.id`,
        [cursadaIds]
    );
    return rows;
};

/**
 * Registra módulos acreditados por equivalencia (dentro de una transacción).
 *
 * Reglas:
 * - Solo módulos que el alumno NUNCA cursó en la institución: si los cursó,
 *   debe aprobarlos o recursarlos; la equivalencia no reemplaza una cursada.
 * - Cada módulo necesita sus propios correlativos acreditados (o incluidos en
 *   el mismo pedido): no puede acreditarse III por equivalencia sin I y II.
 */
const insertarEquivalencias = async (db, alumnoId, modulosIds, observacion) => {
    const { rows: modulos } = await db.query(
        `SELECT id, numero_leyenda AS nombre
           FROM modulo
          WHERE id = ANY($1::int[])
          ORDER BY anio_curso, periodo, id`,
        [modulosIds]
    );
    if (modulos.length !== new Set(modulosIds).size) {
        throw new ReglaNegocio("EQUIVALENCIA_MODULO_INEXISTENTE");
    }

    for (const modulo of modulos) {
        if (
            (await db.query(
                `SELECT 1 FROM equivalencia_modulo
                  WHERE alumno_id = $1 AND modulo_id = $2`,
                [alumnoId, modulo.id]
            )).rowCount > 0
        ) {
            continue; // ya estaba registrada
        }

        const { rowCount: cursadas } = await db.query(
            "SELECT 1 FROM cursada_modulo WHERE alumno_id = $1 AND modulo_id = $2",
            [alumnoId, modulo.id]
        );
        if (cursadas > 0) {
            throw new ReglaNegocio("EQUIVALENCIA_CON_CURSADA", { modulo: modulo.nombre });
        }

        const pendientes = await correlativosPendientes(alumnoId, modulo.id, db);
        if (pendientes.length > 0) {
            throw new ReglaNegocio("EQUIVALENCIA_SIN_CORRELATIVAS", {
                modulo: modulo.nombre,
                pendientes,
            });
        }

        await db.query(
            `INSERT INTO equivalencia_modulo (alumno_id, modulo_id, observacion)
             VALUES ($1, $2, $3)`,
            [alumnoId, modulo.id, observacion]
        );
    }
};

export const registrarEquivalencias = (alumnoId, modulosIds, observacion) =>
    enTransaccion(async (db) => {
        await db.query("SELECT id FROM alumno WHERE id = $1 FOR UPDATE", [alumnoId]);
        await insertarEquivalencias(db, alumnoId, modulosIds, observacion);
    });

/**
 * Matricula al alumno en un módulo (alta o cambio de matrícula) manteniendo
 * una única cursada activa. Todo ocurre en una transacción: si una regla no
 * se cumple se lanza ReglaNegocio y no queda nada a medio guardar.
 *
 * Casos:
 * - Mismo módulo y cursada todavía abierta  -> solo cambia el curso/división.
 * - Módulo distinto, o mismo módulo en el que quedó LIBRE -> nueva inscripción:
 *     1. registra las equivalencias de ingreso (si se enviaron);
 *     2. rechaza si el módulo ya está acreditado;
 *     3. rechaza si faltan correlativos (correlatividades);
 *     4. si ya había una cursada abierta de ese módulo, la reactiva en lugar
 *        de duplicarla;
 *     5. si la cursada actual estaba vacía (error de carga) la corrige;
 *     6. si no, la cursada actual pasa al historial y se crea la nueva. Si el
 *        alumno estaba LIBRE en ese módulo, la nueva cursada es la recursada.
 */
export const guardarMatricula = async (
    alumnoId,
    { cursoId, moduloId, equivalencias = [], observacion = null, soloAlta = false }
) => {
    await asegurarEsquemaPlanEstudio();
    return enTransaccion(async (db) => {
        // Serializa las matrículas simultáneas del mismo alumno.
        await db.query("SELECT id FROM alumno WHERE id = $1 FOR UPDATE", [alumnoId]);

        // En su primera matrícula el alumno queda asociado al plan de estudios
        // vigente. Después no cambia, aunque entre en vigencia otro plan.
        await db.query(
            `UPDATE alumno
                SET plan_estudio_id = (SELECT id FROM plan_estudio
                                        WHERE activo
                                        ORDER BY id DESC
                                        LIMIT 1)
              WHERE id = $1 AND plan_estudio_id IS NULL`,
            [alumnoId]
        );

        const { rows } = await db.query(
            `SELECT cm.id, cm.curso_id, cm.modulo_id, cm.estado_academico,
                    (EXISTS (SELECT 1 FROM evaluacion_modulo e
                              WHERE e.cursada_modulo_id = cm.id)
                  OR EXISTS (SELECT 1 FROM asistencia a
                              WHERE a.cursada_modulo_id = cm.id)
                  OR EXISTS (SELECT 1 FROM calificacion c
                              WHERE c.cursada_modulo_id = cm.id)) AS tiene_datos
               FROM cursada_modulo cm
              WHERE cm.alumno_id = $1 AND cm.activa
              ORDER BY cm.id DESC
              LIMIT 1
              FOR UPDATE OF cm`,
            [alumnoId]
        );
        const actual = rows[0] ?? null;

        if (soloAlta && actual) throw new ReglaNegocio("YA_TIENE_CURSADA_ACTIVA");

        // Mismo módulo y cursada abierta: es un cambio de curso/división.
        if (
            actual &&
            Number(actual.modulo_id) === Number(moduloId) &&
            ESTADOS_ABIERTOS.includes(actual.estado_academico)
        ) {
            if (Number(actual.curso_id) === Number(cursoId)) {
                return { cursadaModuloId: actual.id, tipo: "SIN_CAMBIOS" };
            }
            await db.query(
                "UPDATE cursada_modulo SET curso_id = $2 WHERE id = $1",
                [actual.id, cursoId]
            );
            return { cursadaModuloId: actual.id, tipo: "CAMBIO_DE_CURSO" };
        }

        // --- Nueva inscripción en el módulo ---
        if (equivalencias.length > 0) {
            await insertarEquivalencias(db, alumnoId, equivalencias, observacion);
        }

        const { rows: acreditado } = await db.query(
            `SELECT EXISTS (SELECT 1 FROM equivalencia_modulo
                             WHERE alumno_id = $1 AND modulo_id = $2) AS por_equivalencia,
                    modulo_acreditado($1, $2) AS acreditado`,
            [alumnoId, moduloId]
        );
        if (acreditado[0].acreditado) {
            throw new ReglaNegocio("MODULO_ACREDITADO", {
                porEquivalencia: acreditado[0].por_equivalencia,
            });
        }

        const pendientes = await correlativosPendientes(alumnoId, moduloId, db);
        if (pendientes.length > 0) {
            throw new ReglaNegocio("CORRELATIVAS_PENDIENTES", { pendientes });
        }

        const actualVacia =
            actual != null &&
            actual.estado_academico === "EN_CURSO" &&
            !actual.tiene_datos;

        // ¿Ya existe una cursada abierta de ese módulo en el historial?
        const { rows: abiertas } = await db.query(
            `SELECT id FROM cursada_modulo
              WHERE alumno_id = $1 AND modulo_id = $2
                AND estado_academico = ANY($3::text[])
                AND NOT activa
              ORDER BY id DESC
              LIMIT 1
              FOR UPDATE`,
            [alumnoId, moduloId, ESTADOS_ABIERTOS]
        );

        if (abiertas.length > 0) {
            if (actualVacia) {
                await db.query("DELETE FROM cursada_modulo WHERE id = $1", [actual.id]);
            } else if (actual) {
                await db.query(
                    "UPDATE cursada_modulo SET activa = false WHERE id = $1",
                    [actual.id]
                );
            }
            await db.query(
                "UPDATE cursada_modulo SET activa = true, curso_id = $2 WHERE id = $1",
                [abiertas[0].id, cursoId]
            );
            return { cursadaModuloId: abiertas[0].id, tipo: "REACTIVADA" };
        }

        if (actualVacia) {
            await db.query(
                "UPDATE cursada_modulo SET curso_id = $2, modulo_id = $3 WHERE id = $1",
                [actual.id, cursoId, moduloId]
            );
            return { cursadaModuloId: actual.id, tipo: "CORREGIDA" };
        }

        const { rowCount: cursadasPrevias } = await db.query(
            "SELECT 1 FROM cursada_modulo WHERE alumno_id = $1 AND modulo_id = $2",
            [alumnoId, moduloId]
        );

        if (actual) {
            await db.query(
                "UPDATE cursada_modulo SET activa = false WHERE id = $1",
                [actual.id]
            );
        }

        // La situación inicial la fija el trigger cursada_modulo_nueva_recalcular.
        const { rows: nuevas } = await db.query(
            `INSERT INTO cursada_modulo
                    (alumno_id, curso_id, modulo_id, condicion,
                     cantidad_faltas_acumuladas, estado_academico, activa)
             VALUES ($1, $2, $3, 'REGULAR', 0, 'EN_CURSO', true)
             RETURNING id`,
            [alumnoId, cursoId, moduloId]
        );

        return {
            cursadaModuloId: nuevas[0].id,
            tipo: cursadasPrevias > 0 ? "RECURSADA" : "NUEVA",
        };
    });
};

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
            `SELECT cm.id, cm.modulo_id, cm.alumno_id,
                    cm.estado_academico, cm.condicion, cm.motivo_libre,
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

        // Escenarios de LIBRE (inasistencias, materia desaprobada o instancias
        // agotadas): el alumno no rinde; debe recursar el módulo.
        if (cursada.condicion === "LIBRE") {
            return {
                creada: false,
                motivo: "ALUMNO_LIBRE",
                motivoLibre: cursada.motivo_libre,
            };
        }

        // Correlatividades al acreditar: los módulos previos deben estar aprobados.
        const correlativos = await correlativosPendientes(
            cursada.alumno_id,
            cursada.modulo_id,
            db
        );
        if (correlativos.length > 0) {
            return {
                creada: false,
                motivo: "CORRELATIVAS_PENDIENTES",
                pendientes: correlativos,
            };
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

        // El trigger evaluacion_modulo_recalcular_situacion ya dejó la cursada
        // en su situación real: APROBADO, PENDIENTE o LIBRE (4.ª instancia).
        const { rows: situacion } = await db.query(
            `SELECT estado_academico, condicion, motivo_libre
               FROM cursada_modulo WHERE id = $1`,
            [cursadaId]
        );

        return {
            creada: true,
            evaluacion: evaluaciones[0],
            aprobado: situacion[0].estado_academico === "APROBADO",
            estadoAcademico: situacion[0].estado_academico,
            condicion: situacion[0].condicion,
            motivoLibre: situacion[0].motivo_libre,
        };
    });
