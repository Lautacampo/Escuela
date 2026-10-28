import { HttpError } from "../../utils/httpError.js";
import * as repo from "./docentes.repository.js";

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REGEX_DNI = /^\d{7,8}$/;

function generarCuilPorDefecto(dni) {
  return `20-${dni}-0`;
}

function validarDatosDocente(datos) {
  const nombre = String(datos.nombre ?? "").trim();
  const apellido = String(datos.apellido ?? "").trim();
  const dni = String(datos.dni ?? "").replace(/\D/g, "");
  const especialidad = String(datos.especialidad ?? datos.titulo ?? "").trim();
  const email = String(datos.email ?? "").trim();
  const telefono = String(datos.telefono ?? "").trim();
  const domicilio = String(datos.domicilio ?? "San Luis").trim();
  const cuil = String(datos.cuil ?? "").trim() || generarCuilPorDefecto(dni);
  const antiguedad =
    datos.antiguedad !== undefined && datos.antiguedad !== ""
      ? Number(datos.antiguedad)
      : 0;
  const asignaciones = Array.isArray(datos.asignaciones)
    ? datos.asignaciones
    : [];

  if (!nombre || !apellido || !dni || !especialidad || !email) {
    throw new HttpError(
      400,
      "Nombre, apellido, DNI, especialidad y email son obligatorios",
    );
  }

  if (!REGEX_DNI.test(dni)) {
    throw new HttpError(400, "El DNI debe tener entre 7 y 8 dígitos numéricos");
  }

  if (!REGEX_EMAIL.test(email)) {
    throw new HttpError(400, "El formato del correo electrónico es inválido");
  }

  if (!Number.isInteger(antiguedad) || antiguedad < 0) {
    throw new HttpError(
      400,
      "La antigüedad debe ser un número entero mayor o igual a 0",
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
  const datos = validarDatosDocente(body);

  try {
    return await repo.crearDocente(datos);
  } catch (err) {
    if (err.code === "23505") {
      throw new HttpError(
        409,
        "Ya existe una persona registrada con ese DNI o CUIL",
      );
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
    if (err.code === "23505") {
      throw new HttpError(
        409,
        "El DNI o CUIL ingresado ya pertenece a otra persona",
      );
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
