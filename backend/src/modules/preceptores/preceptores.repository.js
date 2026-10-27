import {pool} from "../../config/db.js"

const SELECTgeneral=
` SELECT prece.id, perso.nombre, perso.apellido, perso.dni, perso.cuil, perso.domicilio, perso.telefono, perso.email, pl.titulo, pl.antiguedad,
  COALESCE((SELECT json_agg(json_build_object('id', c.id, 'anio', c.anio_curso, 'division', c.division) ORDER BY c.anio_curso, c.division)
    FROM curso c WHERE c.preceptor_id = prece.id),'[]'::json) AS cursos
    FROM preceptor prece
    JOIN personal pl ON pl.id = prece.id
    JOIN persona perso ON perso.id = pl.id`;



export const listarTodos = async() =>{
    const{rows} = await pool.query(
        `${SELECTgeneral} ORDER BY perso.apellido, perso.nombre`);
        return rows;
};


export const buscarPorId = async (id) =>{
    const{rows} =await pool.query(`${SELECTgeneral} WHERE prece.id=$1`,[id]);
    return rows [0] ?? null;

}

export const crearPreceptor = async (datos) =>{
    const cliente = await pool.connect();
    try{
        await cliente.query("BEGIN");
        //primero inserta una persona , recuepramos el id para insertarlo en personal
        const resPersona = await cliente.query(`
            INSERT INTO persona (nombre,apellido,dni,cuil,domicilio,telefono,email)
            VALUES($1,$2,$3,$4,$5,$6,$7)
            RETURNING id            
            `,[datos.nombre, datos.apellido, datos.dni, datos.cuil, datos.domicilio, datos.telefono, datos.email]);

        const nuevoId=resPersona.rows[0].id;

        //metemos personal con ese id
        await cliente.query(
            `INSERT INTO personal(id,titulo,antiguedad)
             VALUES($1,$2,$3)
             `,[nuevoId, datos.titulo, datos.antiguedad]);
        
        //ahora preceptor con el mismo id

        await cliente.query(`INSERT INTO preceptor(id) VALUES($1)`,[nuevoId]);

        await cliente.query("COMMIT");
        return{id: nuevoId, ...datos};
    }catch(error){
        await cliente.query("ROLLBACK");
        throw error;
    }finally{
        cliente.release();
    }
};


export const modificarPreceptor = async (id, datos) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    
    // primero actualiza persona
    await client.query(`
      UPDATE persona 
      SET nombre=$1, apellido=$2, dni=$3, cuil=$4, domicilio=$5, telefono=$6, email=$7
      WHERE id=$8
    `, [datos.nombre, datos.apellido, datos.dni, datos.cuil, datos.domicilio, datos.telefono, datos.email, id]);
    
    // actualiza personal
    await client.query(`
      UPDATE personal
      SET titulo=$1, antiguedad=$2
      WHERE id=$3
    `, [datos.titulo, datos.antiguedad, id]);
    
    await client.query("COMMIT");
    return { id, ...datos };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};


export const eliminarPreceptor = async (id) =>{
    const cliente = await pool.connect();
    try{
        await cliente.query("BEGIN");
        //borrar va desde prece a persona por las claves foraneas
        await cliente.query("DELETE FROM preceptor WHERE id=$1", [id]);
        await cliente.query("DELETE FROM personal WHERE id=$1", [id]);
        await cliente.query("DELETE FROM persona WHERE id=$1", [id]);

        await cliente.query("COMMIT");
    }catch(error){
        await cliente.query("ROLLBACK");
        throw error;
    } finally {
        cliente.release();
    }
};


// parte de cursos

export const listarCursos = async()=>{
    const {rows} = await pool.query(
        `SELECT c.id,c.anio_curso,c.division,c.preceptor_id,p.apellido AS preceptor_apellido, p.nombre AS preceptor_nombre
        FROM curso c 
        LEFT JOIN persona p ON p.id = c.preceptor_id
        ORDER BY c.anio_curso, c.division 
        `,
    );
    return rows;
}

export const contadorCursos = async (cursosId) =>{
    const {rows} = await pool.query(
        "SELECT COUNT(*) ::int AS total FROM curso WHERE id = ANY($1::int[])",
        [cursosId],
    );
    return rows[0].total;
}

export const asignarCurso = async (preceptorId, cursoIds) => {
    const cliente = await pool.connect();
    try {
    await cliente.query("BEGIN");
    await cliente.query(
      `UPDATE curso SET preceptor_id = NULL
        WHERE preceptor_id = $1 AND NOT (id = ANY($2::int[]))`,
      [preceptorId, cursoIds],
    );
    await cliente.query(
      "UPDATE curso SET preceptor_id = $1 WHERE id = ANY($2::int[])",
      [preceptorId, cursoIds],
    );
    await cliente.query("COMMIT");
  } catch (error) {
    await cliente.query("ROLLBACK");
    throw error;
  } finally {
    cliente.release();
  }
}