import { HttpError } from "../../utils/httpError.js";
import bcrypt from "bcryptjs";
import { traducirUnicidadPersona } from "../../utils/errorUnicidadPersona.js";
import {
  esCuilValido,
  esDniValido,
  esTelefonoValido,
  normalizarCuil,
  normalizarDni,
} from "../../utils/validacionesPersona.js";
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
const PASSWORD_SALT_ROUNDS = 10;

// Valida y normaliza los datos personales de un preceptor.
const validarDatos = (datos = {}) => {
  const texto = (valor) => String(valor ?? "").trim();
  const dniIngresado = texto(datos.dni);
  const d = {
    nombre: texto(datos.nombre),
    apellido: texto(datos.apellido),
    dni: normalizarDni(dniIngresado),
    cuil: normalizarCuil(datos.cuil),
    domicilio: texto(datos.domicilio),
    telefono: texto(datos.telefono) || null,
    email: texto(datos.email),
    titulo: texto(datos.titulo),
    antiguedad:
      datos.antiguedad === undefined || datos.antiguedad === ""
        ? NaN
        : Number(datos.antiguedad),
  };

  const obligatorios = [
    ["nombre", d.nombre, "El nombre es obligatorio"],
    ["apellido", d.apellido, "El apellido es obligatorio"],
    ["dni", d.dni, "El DNI es obligatorio"],
    ["cuil", d.cuil, "El CUIL es obligatorio"],
    ["domicilio", d.domicilio, "El domicilio es obligatorio"],
    ["titulo", d.titulo, "El título es obligatorio"],
    ["email", d.email, "El correo electrónico es obligatorio"],
  ];
  for (const [campo, valor, mensaje] of obligatorios) {
    if (!valor) throw new HttpError(400, mensaje, { campo });
  }
  if (!esDniValido(dniIngresado)) {
    throw new HttpError(
      400,
      "El DNI debe tener entre 7 y 8 dígitos numéricos",
      { campo: "dni" },
    );
  }
  if (texto(datos.cuil).length > 15) {
    throw new HttpError(400, "El CUIL no puede superar los 15 caracteres", {
      campo: "cuil",
    });
  }
  if (!esCuilValido(datos.cuil, d.dni)) {
    throw new HttpError(
      400,
      "El CUIL debe tener 11 dígitos y corresponder al DNI",
      { campo: "cuil" },
    );
  }
  if (d.nombre.length > 100 || d.apellido.length > 100) {
    const campo = d.nombre.length > 100 ? "nombre" : "apellido";
    throw new HttpError(400, "No puede superar los 100 caracteres", { campo });
  }
  if (d.cuil.length > 15) {
    throw new HttpError(400, "El CUIL no puede superar los 15 caracteres", {
      campo: "cuil",
    });
  }
  if (d.domicilio.length > 200) {
    throw new HttpError(400, "El domicilio no puede superar los 200 caracteres", {
      campo: "domicilio",
    });
  }
  if (d.titulo.length > 50) {
    throw new HttpError(400, "El título no puede superar los 50 caracteres", {
      campo: "titulo",
    });
  }
  if (!REGEX_EMAIL.test(d.email) || d.email.length > 150) {
    throw new HttpError(
      400,
      "Ingrese un correo válido de hasta 150 caracteres",
      { campo: "email" },
    );
  }
  if (!esTelefonoValido(d.telefono) || (d.telefono && d.telefono.length > 20)) {
    throw new HttpError(
      400,
      "El teléfono debe tener entre 8 y 15 dígitos",
      { campo: "telefono" },
    );
  }
  if (
    !Number.isInteger(d.antiguedad) ||
    d.antiguedad < 0 ||
    d.antiguedad > 99
  ) {
    throw new HttpError(
      400,
      "La antigüedad debe ser un número entero entre 0 y 99",
      { campo: "antiguedad" },
    );
  }
  return d;
};

const traducirDuplicado = (err) => {
  const duplicado = traducirUnicidadPersona(err);
  if (duplicado) return duplicado;
  return err.code === "23505"
    ? new HttpError(409, "Ya existe un registro con esos datos")
    : err;
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
      throw new HttpError(
        400,
        "La contraseña debe tener al menos 4 caracteres",
        { campo: "password" },
      );
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
