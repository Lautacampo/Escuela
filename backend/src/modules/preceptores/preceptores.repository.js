import {pool} from "../../config/db.js"

export const listarTodos = async() =>{
    const{rows} = await pool.query(
        `SELECT prece.id, perso.nombre, perso.apellido, perso.dni, perso.cuil, perso.domicilio, perso.telefono, perso.email, pl.titulo, pl.antiguedad 
         FROM preceptor prece   
         JOIN personal pl ON prece.id=pl.id
         JOIN persona perso ON pl.id=perso.id
         ORDER BY perso.apellido, perso.nombre
        `);
        return rows;
};


export const buscarPorId = async (id) =>{
    const{rows} =await pool.query(
        `SELECT prece.id, perso.nombre, perso.apellido, perso.dni, perso.cuil, perso.domicilio, perso.telefono, perso.email, pl.titulo, pl.antiguedad
         FROM preceptor prece
         JOIN personal pl ON prece.id=pl.id
         JOIN persona perso ON pl.id=perso.id
         WHERE prece.id =$1        
        `,[id]);

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

        await cliente.query(
            `INSERT INTO preceptor(id)
             VALUES($1)
             `,[nuevoId]);

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


