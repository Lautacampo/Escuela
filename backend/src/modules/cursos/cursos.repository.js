import { pool } from "../../config/db.js";

export const listarCursosVigentes = async () => {
    const { rows } = await pool.query(
        `SELECT c.id, c.anio_curso, c.division,
                COALESCE(
                json_agg(json_build_object('id', m.id, 'numeroLeyenda', m.numero_leyenda)
                        ORDER BY m.id) FILTER (WHERE m.id IS NOT NULL),
                '[]') AS modulos
        FROM curso c
        LEFT JOIN curso_modulo cm ON cm.curso_id = c.id
        LEFT JOIN modulo m ON m.id = cm.modulo_id
        WHERE c.ciclo_lectivo_id = (SELECT id FROM ciclo_lectivo ORDER BY anio DESC LIMIT 1)
        GROUP BY c.id
        ORDER BY c.anio_curso, c.division`,
    );
    return rows;
};