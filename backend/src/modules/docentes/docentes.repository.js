import { pool } from "../../config/db.js";

// Devuelve los módulos con sus divisiones y sus materias para los selectores del Front
export const listarModulosConDivisionesYMaterias = async () => {
  const { rows } = await pool.query(
    `SELECT m.id,
            m.numero_leyenda AS nombre,
            COALESCE(
              ARRAY(
                SELECT DISTINCT TRIM(c.division)
                  FROM curso_modulo cm
                  JOIN curso c ON c.id = cm.curso_id
                 WHERE cm.modulo_id = m.id
                 ORDER BY TRIM(c.division)
              ),
              ARRAY[]::text[]
            ) AS divisiones,
            COALESCE(
              ARRAY(
                SELECT DISTINCT ma.nombre
                  FROM materia_modulo mm
                  JOIN materia ma ON ma.id = mm.materia_id
                 WHERE mm.modulo_id = m.id
                 ORDER BY ma.nombre
              ),
              ARRAY[]::text[]
            ) AS materias
       FROM modulo m
      ORDER BY m.id`,
  );
  return rows;
};

// Obtiene las asignaciones (módulo, división, materia) de todos los docentes o de uno en particular
const obtenerMapaAsignaciones = async (docenteId = null) => {
  const params = [];
  let filtro = "";
  if (docenteId !== null) {
    params.push(docenteId);
    filtro = "WHERE d.id = $1";
  }

  const { rows } = await pool.query(
    `SELECT DISTINCT
            d.id AS docente_id,
            cm.modulo_id AS "moduloId",
            TRIM(c.division) AS division,
            ma.nombre AS materia
       FROM docente d
       JOIN docente_curso dc ON dc.docente_id = d.id
       JOIN curso c ON c.id = dc.curso_id
       JOIN curso_modulo cm ON cm.curso_id = c.id
       JOIN docente_materia dm ON dm.docente_id = d.id
       JOIN materia_modulo mm ON mm.materia_id = dm.materia_id AND mm.modulo_id = cm.modulo_id
       JOIN materia ma ON ma.id = dm.materia_id
       ${filtro}
      ORDER BY cm.modulo_id, TRIM(c.division), ma.nombre`,
    params,
  );

  const mapa = new Map();
  for (const r of rows) {
    if (!mapa.has(r.docente_id)) mapa.set(r.docente_id, []);
    mapa.get(r.docente_id).push({
      moduloId: r.moduloId,
      division: r.division,
      materia: r.materia,
    });
  }
  return mapa;
};

export const listarDocentes = async () => {
  const { rows } = await pool.query(
    `SELECT d.id,
            p.nombre,
            p.apellido,
            p.dni,
            p.cuil,
            p.domicilio,
            COALESCE(p.telefono, '') AS telefono,
            COALESCE(p.email, '') AS email,
            pe.titulo AS especialidad,
            pe.antiguedad
       FROM docente d
       JOIN personal pe ON pe.id = d.id
       JOIN persona p ON p.id = pe.id
      ORDER BY p.apellido, p.nombre`,
  );

  const mapaAsignaciones = await obtenerMapaAsignaciones();

  return rows.map((r) => ({
    ...r,
    asignaciones: mapaAsignaciones.get(r.id) ?? [],
  }));
};

export const buscarDocentePorId = async (id) => {
  const { rows } = await pool.query(
    `SELECT d.id,
            p.nombre,
            p.apellido,
            p.dni,
            p.cuil,
            p.domicilio,
            COALESCE(p.telefono, '') AS telefono,
            COALESCE(p.email, '') AS email,
            pe.titulo AS especialidad,
            pe.antiguedad
       FROM docente d
       JOIN personal pe ON pe.id = d.id
       JOIN persona p ON p.id = pe.id
      WHERE d.id = $1`,
    [id],
  );

  if (rows.length === 0) return null;

  const mapaAsignaciones = await obtenerMapaAsignaciones(id);
  return {
    ...rows[0],
    asignaciones: mapaAsignaciones.get(id) ?? [],
  };
};

// Sincroniza las tablas intermedias docente_curso y docente_materia dentro de la transacción
const guardarAsignacionesDocente = async (client, docenteId, asignaciones) => {
  await client.query("DELETE FROM docente_curso WHERE docente_id = $1", [
    docenteId,
  ]);
  await client.query("DELETE FROM docente_materia WHERE docente_id = $1", [
    docenteId,
  ]);

  for (const asig of asignaciones) {
    // 1. Buscar el curso correspondiente a ese moduloId y division
    const resCurso = await client.query(
      `SELECT c.id
         FROM curso c
         JOIN curso_modulo cm ON cm.curso_id = c.id
        WHERE cm.modulo_id = $1 AND TRIM(c.division) = $2
        LIMIT 1`,
      [asig.moduloId, asig.division],
    );

    if (resCurso.rowCount > 0) {
      await client.query(
        `INSERT INTO docente_curso (docente_id, curso_id)
         VALUES ($1, $2)
         ON CONFLICT (docente_id, curso_id) DO NOTHING`,
        [docenteId, resCurso.rows[0].id],
      );
    }

    // 2. Buscar la materia por nombre (o crearla y vincularla al módulo si no existía)
    let resMateria = await client.query(
      `SELECT ma.id
         FROM materia ma
         JOIN materia_modulo mm ON mm.materia_id = ma.id
        WHERE mm.modulo_id = $1 AND LOWER(TRIM(ma.nombre)) = LOWER(TRIM($2))
        LIMIT 1`,
      [asig.moduloId, asig.materia],
    );

    if (resMateria.rowCount === 0) {
      resMateria = await client.query(
        `SELECT id FROM materia WHERE LOWER(TRIM(nombre)) = LOWER(TRIM($1)) LIMIT 1`,
        [asig.materia],
      );
    }

    let materiaId;
    if (resMateria.rowCount > 0) {
      materiaId = resMateria.rows[0].id;
    } else {
      const nuevaMat = await client.query(
        `INSERT INTO materia (nombre) VALUES ($1) RETURNING id`,
        [asig.materia],
      );
      materiaId = nuevaMat.rows[0].id;
    }

    // Asegurar que la materia esté vinculada al módulo en materia_modulo
    await client.query(
      `INSERT INTO materia_modulo (materia_id, modulo_id)
       VALUES ($1, $2)
       ON CONFLICT (materia_id, modulo_id) DO NOTHING`,
      [materiaId, asig.moduloId],
    );

    // Vincular al docente con la materia en docente_materia
    await client.query(
      `INSERT INTO docente_materia (docente_id, materia_id)
       VALUES ($1, $2)
       ON CONFLICT (docente_id, materia_id) DO NOTHING`,
      [docenteId, materiaId],
    );
  }
};

export const crearDocente = async (datos) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Insertar en persona
    const resPersona = await client.query(
      `INSERT INTO persona (nombre, apellido, dni, cuil, domicilio, telefono, email)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        datos.nombre,
        datos.apellido,
        datos.dni,
        datos.cuil,
        datos.domicilio,
        datos.telefono,
        datos.email,
      ],
    );
    const nuevoId = resPersona.rows[0].id;

    // 2. Insertar en personal (mismo id por herencia)
    await client.query(
      `INSERT INTO personal (id, titulo, antiguedad)
       VALUES ($1, $2, $3)`,
      [nuevoId, datos.titulo, datos.antiguedad],
    );

    // 3. Insertar en docente (mismo id por herencia)
    await client.query(`INSERT INTO docente (id) VALUES ($1)`, [nuevoId]);

    // 4. Guardar asignaciones en docente_curso y docente_materia
    await guardarAsignacionesDocente(client, nuevoId, datos.asignaciones);

    await client.query("COMMIT");
    return await buscarDocentePorId(nuevoId);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const actualizarDocente = async (id, datos) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE persona
          SET nombre = $2,
              apellido = $3,
              dni = $4,
              cuil = $5,
              domicilio = $6,
              telefono = $7,
              email = $8
        WHERE id = $1`,
      [
        id,
        datos.nombre,
        datos.apellido,
        datos.dni,
        datos.cuil,
        datos.domicilio,
        datos.telefono,
        datos.email,
      ],
    );

    await client.query(
      `UPDATE personal
          SET titulo = $2,
              antiguedad = $3
        WHERE id = $1`,
      [id, datos.titulo, datos.antiguedad],
    );

    await guardarAsignacionesDocente(client, id, datos.asignaciones);

    await client.query("COMMIT");
    return await buscarDocentePorId(id);
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const eliminarDocente = async (id) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // 1. Desvincular si algún usuario apuntaba a esta persona
    await client.query(
      "UPDATE usuarios SET persona_id = NULL WHERE persona_id = $1",
      [id],
    );

    // 2. Eliminar relaciones del docente y de su registro de personal
    await client.query("DELETE FROM docente_curso WHERE docente_id = $1", [id]);
    await client.query("DELETE FROM docente_materia WHERE docente_id = $1", [
      id,
    ]);
    await client.query(
      "DELETE FROM asistencia_personal WHERE personal_id = $1",
      [id],
    );

    // 3. Eliminar en orden inverso de la jerarquía (docente -> personal -> persona)
    await client.query("DELETE FROM docente WHERE id = $1", [id]);
    await client.query("DELETE FROM personal WHERE id = $1", [id]);
    await client.query("DELETE FROM persona WHERE id = $1", [id]);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
