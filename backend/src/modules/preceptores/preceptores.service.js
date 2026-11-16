import { HttpError } from "../../utils/httpError.js";
import bcrypt from "bcryptjs";
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

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_DNI = /^\d{7,8}$/;
const PASSWORD_SALT_ROUNDS = 10;

// Valida y normaliza los datos personales de un preceptor.
const validarDatos = (datos = {}) => {
  const texto = (valor) => String(valor ?? "").trim();
  const d = {
    nombre: texto(datos.nombre),
    apellido: texto(datos.apellido),
    dni: texto(datos.dni).replace(/\D/g, ""),
    cuil: texto(datos.cuil),
    domicilio: texto(datos.domicilio),
    telefono: texto(datos.telefono) || null,
    email: texto(datos.email),
    titulo: texto(datos.titulo),
    antiguedad:
      datos.antiguedad === undefined || datos.antiguedad === ""
        ? NaN
        : Number(datos.antiguedad),
  };

  if (!d.nombre || !d.apellido || !d.dni || !d.cuil || !d.domicilio || !d.titulo || !d.email) {
    throw new HttpError(
      400,
      "Faltan datos obligatorios (nombre, apellido, DNI, CUIL, domicilio, correo, título y antigüedad)",
    );
  }
  if (!REGEX_DNI.test(d.dni)) {
    throw new HttpError(400, "El DNI debe tener entre 7 y 8 dígitos numéricos");
  }
  if (!REGEX_EMAIL.test(d.email)) {
    throw new HttpError(400, "El formato del correo electrónico es inválido");
  }
  if (!Number.isInteger(d.antiguedad) || d.antiguedad < 0) {
    throw new HttpError(
      400,
      "La antigüedad debe ser un número entero mayor o igual a 0",
    );
  }
  return d;
};

const traducirDuplicado = (err) => {
  if (err.code !== "23505") return err;
  if (err.constraint === "usuarios_email_key")
    return new HttpError(409, "Ese correo ya lo usa otro usuario del sistema");
  return new HttpError(409, "El DNI o CUIL ingresado ya pertenece a otra persona");
};

/**
 * Alta de preceptor. Con `password` se crea en la misma transacción su usuario
 * de acceso: si el alta falla no queda un usuario suelto. Sin `password` se
 * mantiene el camino anterior: vincula un usuario de preceptor ya registrado
 * con ese correo.
 */
export const crear = async (datos = {}) => {
  const d = validarDatos(datos);

  let passwordHash = null;
  if (datos.password !== undefined && datos.password !== null && datos.password !== "") {
    if (typeof datos.password !== "string" || datos.password.length < 4) {
      throw new HttpError(400, "La contraseña debe tener al menos 4 caracteres");
    }
    passwordHash = await bcrypt.hash(datos.password, PASSWORD_SALT_ROUNDS);
  }

  try {
    const nuevo = await repo.crearPreceptor(d, passwordHash);
    return await repo.buscarPorId(nuevo.id);
  } catch (err) {
    throw traducirDuplicado(err);
  }
};

export const actualizar = async (id, datos) => {
  if (!Number.isInteger(id)) throw new HttpError(400, "ID inválido");

  const existe = await repo.buscarPorId(id);
  if (!existe) throw new HttpError(404, "Preceptor no encontrado");

  const d = validarDatos(datos);

  try {
    await repo.modificarPreceptor(id, d);
  } catch (err) {
    throw traducirDuplicado(err);
  }
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
