import { HttpError } from "../../utils/httpError.js";
import * as repo from "./preceptores.repository.js";

export const listar = async () =>{
    return await repo.listarTodos();
}

export const obtenerPorId = async (id) =>{
    if(!Number.isInteger(id)) throw new HttpError(400,"ID invalido");

    const preceptor = await repo.buscarPorId(id);
    if(!preceptor) throw new HttpError(404,"Preceptor no encontrado");

    return preceptor;
}

export const crear = async (datos) =>{
    const {nombre,apellido,dni,cuil,domicilio,telefono,email,titulo,antiguedad}=datos;
    if(!nombre || !apellido || !dni || !cuil || !domicilio || !titulo || antiguedad === undefined) {
      throw new HttpError(400,"Faltan datos Obligatorios (nombre,apellido,dni,cuil,domicilio,titulo,antiguedad)");
    }

    return await repo.crearPreceptor({nombre,apellido,dni,cuil,domicilio,telefono,email,titulo,antiguedad});

};

export const actualizar = async (id, datos) => {
  if (!Number.isInteger(id)) throw new HttpError(400, "ID inválido");
  
  const existe = await repo.buscarPorId(id);
  if (!existe) throw new HttpError(404, "Preceptor no encontrado");

  const { nombre, apellido, dni, cuil, domicilio, telefono, email, titulo, antiguedad } = datos;
  
  if (!nombre || !apellido || !dni || !cuil || !domicilio || !titulo || antiguedad === undefined) {
    throw new HttpError(400, "Faltan datos obligatorios para actualizar");
  }

  return await repo.modificarPreceptor(id, { nombre, apellido, dni, cuil, domicilio, telefono, email, titulo, antiguedad });
};


export const eliminar = async (id) =>{
    if(!Number.isInteger(id)) throw new HttpError(400, "ID invalido");

    const preceptorExiste = await repo.buscarPorId(id);
    if(!preceptorExiste) throw new HttpError(404,"Preceptor no encontrado");

    return await repo.eliminarPreceptor(id);
}




