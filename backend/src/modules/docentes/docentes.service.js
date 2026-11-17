import bcrypt from "bcryptjs";
import { traducirUnicidadPersona } from "../../utils/errorUnicidadPersona.js";
import { HttpError } from "../../utils/httpError.js";
import {
  esCuilValido,
  esDniValido,
  esTelefonoValido,
  normalizarCuil,
  normalizarDni,
} from "../../utils/validacionesPersona.js";
import * as repo from "./docentes.repository.js";

const PASSWORD_SALT_ROUNDS = 10;
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validarDatosDocente(datos) {
  const nombre = String(datos.nombre ?? "").trim();
  const apellido = String(datos.apellido ?? "").trim();
  const dniIngresado = String(datos.dni ?? "").trim();
  const dni = normalizarDni(dniIngresado);
  const especialidad = String(datos.especialidad ?? datos.titulo ?? "").trim();
  const email = String(datos.email ?? "").trim();
  const telefono = String(datos.telefono ?? "").trim();
  const domicilio = String(datos.domicilio ?? "").trim();
  const cuilIngresado = String(datos.cuil ?? "").trim();
  const cuil = normalizarCuil(cuilIngresado);
  const antiguedad =
    datos.antiguedad !== undefined && datos.antiguedad !== ""
      ? Number(datos.antiguedad)
      : NaN;
  const asignaciones = Array.isArray(datos.asignaciones)
    ? datos.asignaciones
    : [];

  const obligatorios = [
    ["nombre", nombre, "El nombre es obligatorio"],
    ["apellido", apellido, "El apellido es obligatorio"],
    ["dni", dni, "El DNI es obligatorio"],
    ["cuil", cuilIngresado, "El CUIL es obligatorio"],
    ["domicilio", domicilio, "El domicilio es obligatorio"],
    ["especialidad", especialidad, "La especialidad o título es obligatorio"],
    ["email", email, "El correo electrónico es obligatorio"],
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
  if (cuilIngresado.length > 15) {
    throw new HttpError(400, "El CUIL no puede superar los 15 caracteres", {
      campo: "cuil",
    });
  }
  if (!esCuilValido(cuilIngresado, dni)) {
    throw new HttpError(
      400,
      "El CUIL debe tener 11 dígitos y corresponder al DNI",
      { campo: "cuil" },
    );
  }

  if (nombre.length > 100 || apellido.length > 100) {
    const campo = nombre.length > 100 ? "nombre" : "apellido";
    throw new HttpError(400, "No puede superar los 100 caracteres", { campo });
  }
  if (cuil.length > 15) {
    throw new HttpError(400, "El CUIL no puede superar los 15 caracteres", {
      campo: "cuil",
    });
  }
  if (domicilio.length > 200) {
    throw new HttpError(400, "El domicilio no puede superar los 200 caracteres", {
      campo: "domicilio",
    });
  }
  if (!especialidad || especialidad.length > 50) {
    throw new HttpError(
      400,
      "La especialidad o título no puede superar los 50 caracteres",
      { campo: "especialidad" },
    );
  }
  if (!REGEX_EMAIL.test(email) || email.length > 150) {
    throw new HttpError(
      400,
      "Ingrese un correo válido de hasta 150 caracteres",
      { campo: "email" },
    );
  }
  if (!esTelefonoValido(telefono) || telefono.length > 20) {
    throw new HttpError(
      400,
      "El teléfono debe tener entre 8 y 15 dígitos",
      { campo: "telefono" },
    );
  }

  if (
    !Number.isInteger(antiguedad) ||
    antiguedad < 0 ||
    antiguedad > 99
  ) {
    throw new HttpError(
      400,
      "La antigüedad debe ser un número entero entre 0 y 99",
      { campo: "antiguedad" },
    );
  }

  for (const asig of asignaciones) {
    if (
      !Number.isInteger(Number(asig.moduloId)) ||
      !asig.division ||
      !String(asig.materia ?? "").trim()
    ) {
      throw new HttpError(
        400,
        "Cada asignación debe incluir moduloId, division y materia válidos",
        { campo: "asignaciones" },
      );
    }
  }

  return {
    nombre,
    apellido,
    dni,
    cuil,
    domicilio,
    telefono: telefono || null,
    email,
    titulo: especialidad,
    antiguedad,
    asignaciones: asignaciones.map((a) => ({
      moduloId: Number(a.moduloId),
      division: String(a.division).trim().toUpperCase(),
      materia: String(a.materia).trim(),
    })),
  };
}

export const listarModulos = async () => {
  return repo.listarModulosConDivisionesYMaterias();
};

export const listar = async (query = {}) => {
  const docentes = await repo.listarDocentes();

  // Filtros opcionales por query params (?moduloId=1&division=A&materia=Historia)
  return docentes.filter((d) => {
    if (query.dni && d.dni !== String(query.dni).trim()) return false;
    if (query.moduloId) {
      const modId = Number(query.moduloId);
      if (!d.asignaciones.some((a) => a.moduloId === modId)) return false;
    }
    if (query.division) {
      const div = String(query.division).trim().toUpperCase();
      if (!d.asignaciones.some((a) => a.division === div)) return false;
    }
    if (query.materia) {
      const mat = String(query.materia).trim().toLowerCase();
      if (!d.asignaciones.some((a) => a.materia.toLowerCase().includes(mat))) {
        return false;
      }
    }
    return true;
  });
};

export const obtenerPorId = async (id) => {
  if (!Number.isInteger(id)) {
    throw new HttpError(400, "ID de docente inválido");
  }

  const docente = await repo.buscarDocentePorId(id);
  if (!docente) {
    throw new HttpError(404, "Docente no encontrado");
  }
  return docente;
};

export const crear = async (body) => {
  if (typeof body.password !== "string" || body.password.length < 4) {
    throw new HttpError(
      400,
      "La contraseña debe tener al menos 4 caracteres",
      { campo: "password" },
    );
  }

  const datos = validarDatosDocente(body);
  const passwordHash = await bcrypt.hash(body.password, PASSWORD_SALT_ROUNDS);

  try {
    return await repo.crearDocente(datos, passwordHash);
  } catch (err) {
    const duplicado = traducirUnicidadPersona(err);
    if (duplicado) throw duplicado;
    if (err.code === "23505") {
      throw new HttpError(409, "Ya existe un registro con esos datos");
    }
    throw err;
  }
};

export const actualizar = async (id, body) => {
  if (!Number.isInteger(id)) {
    throw new HttpError(400, "ID de docente inválido");
  }

  const existe = await repo.buscarDocentePorId(id);
  if (!existe) {
    throw new HttpError(404, "Docente no encontrado");
  }

  const datos = validarDatosDocente({
    ...existe,
    ...body,
    cuil: body.cuil ?? existe.cuil,
    domicilio: body.domicilio ?? existe.domicilio,
    antiguedad: body.antiguedad ?? existe.antiguedad,
  });

  try {
    return await repo.actualizarDocente(id, datos);
  } catch (err) {
    const duplicado = traducirUnicidadPersona(err);
    if (duplicado) throw duplicado;
    if (err.code === "23505") {
      throw new HttpError(409, "Ya existe un registro con esos datos");
    }
    throw err;
  }
};

export const eliminar = async (id) => {
  if (!Number.isInteger(id)) {
    throw new HttpError(400, "ID de docente inválido");
  }

  const existe = await repo.buscarDocentePorId(id);
  if (!existe) {
    throw new HttpError(404, "Docente no encontrado");
  }

  await repo.eliminarDocente(id);
};
