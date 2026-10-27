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

    const nuevo = await repo.crearPreceptor({nombre,apellido,dni,cuil,domicilio,telefono,email,titulo,antiguedad});
    return repo.buscarPorId(nuevo.id);

};

export const actualizar = async (id, datos) => {
  if (!Number.isInteger(id)) throw new HttpError(400, "ID inválido");
  
  const existe = await repo.buscarPorId(id);
  if (!existe) throw new HttpError(404, "Preceptor no encontrado");

  const { nombre, apellido, dni, cuil, domicilio, telefono, email, titulo, antiguedad } = datos;
  
  if (!nombre || !apellido || !dni || !cuil || !domicilio || !titulo || antiguedad === undefined) {
    throw new HttpError(400, "Faltan datos obligatorios para actualizar");
  }

   await repo.modificarPreceptor(id, { nombre, apellido, dni, cuil, domicilio, telefono, email, titulo, antiguedad });
   return repo.buscarPorId(id);
};


export const eliminar = async (id) =>{
    if(!Number.isInteger(id)) throw new HttpError(400, "ID invalido");

    const preceptorExiste = await repo.buscarPorId(id);
    if(!preceptorExiste) throw new HttpError(404,"Preceptor no encontrado");

    return await repo.eliminarPreceptor(id);
}

//cursos del preceptor
export const listaCursos = async () => repo.listarCursos();

export const asignarCurso = async (id, cursoIdS) => {
  if(!Number.isInteger(id)) throw new HttpError(400, "ID invalido");
  if(!Array.isArray(cursoIdS) || !cursoIdS.every(Number.isInteger)){
    throw new HttpError (400, "Id de los cursos debe ser una lista");
  }

  const ids = [...new Set(cursoIdS)];
  if(!(await repo.buscarPorId(id))) throw new HttpError (404, "Preceptor no encontrado");
  if((await repo.contadorCursos(ids)) !== ids.length){
    throw new HttpError(404,"Alguno de los cursos no existe");
  }

  await repo.asignarCurso(id,ids);
  return repo.buscarPorId(id);

};
