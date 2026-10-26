import {pool} from "../../config/db.js"

export const listarTodos = async() =>{
    const{rows} = await pool.query(
        "SELECT id,"
    )

}