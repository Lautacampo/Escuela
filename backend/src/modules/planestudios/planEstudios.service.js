import { HttpError } from "../../utils/httpError.js";
import * as repo from "./planEstudios.repository.js";

export const obtenerPlanActual = async () => {
  return await repo.obtenerPlanes();
};

export const crearPlanEstudio = async (body = {}) => {
  const { titulo, resolucion, orientacion, anioInicio, modulos } = body;

  if (!titulo || !String(titulo).trim()) {
    throw new HttpError(400, "El título del plan de estudios es obligatorio");
  }
  if (!resolucion || !String(resolucion).trim()) {
    throw new HttpError(400, "La resolución o decreto del plan es obligatorio");
  }
  if (!Array.isArray(modulos) || modulos.length === 0) {
    throw new HttpError(
      400,
      "Debe asignar materias a los módulos para crear el plan de estudios",
    );
  }

  for (const mod of modulos) {
    if (!Number.isInteger(Number(mod?.moduloId))) {
      throw new HttpError(400, "Cada módulo debe tener un moduloId válido");
    }
    if (
      !Array.isArray(mod.materiasIds) ||
      mod.materiasIds.length === 0 ||
      !mod.materiasIds.every((id) => Number.isInteger(Number(id)))
    ) {
      throw new HttpError(
        400,
        `El Módulo ${mod.moduloId} debe tener al menos una materia válida seleccionada`,
      );
    }
  }

  const anio =
    anioInicio === undefined || anioInicio === null || anioInicio === ""
      ? new Date().getFullYear()
      : Number(anioInicio);
  if (!Number.isInteger(anio) || anio < 1900 || anio > 2100) {
    throw new HttpError(400, "El año de inicio del plan no es válido");
  }

  // Módulos y materias deben existir: se valida antes de tocar nada.
  const modulosIds = [...new Set(modulos.map((m) => Number(m.moduloId)))];
  const materiasIds = [
    ...new Set(modulos.flatMap((m) => m.materiasIds.map(Number))),
  ];
  if ((await repo.modulosInexistentes(modulosIds)).length > 0) {
    throw new HttpError(400, "Alguno de los módulos indicados no existe");
  }
  if ((await repo.materiasInexistentes(materiasIds)).length > 0) {
    throw new HttpError(400, "Alguna de las materias indicadas no existe");
  }

  return await repo.crearPlanEstudio({
    titulo: String(titulo),
    resolucion: String(resolucion),
    orientacion: String(orientacion || "Ciencias Sociales"),
    anioInicio: anio,
    modulos,
  });
};

export const eliminarPlanEstudio = async (id) => {
  const planId = Number(id);
  if (!Number.isInteger(planId) || planId <= 0) {
    throw new HttpError(400, "ID de plan de estudio inválido");
  }

  const existe = await repo.buscarPlanPorId(planId);
  if (!existe) {
    throw new HttpError(404, "Plan de estudio no encontrado");
  }

  // Baja lógica: no se borra de la base, pasa a estado 'Inactivo' (activo = false)
  const desactivado = await repo.desactivarPlanEstudio(planId);
  return {
    mensaje:
      "Plan de estudios dado de baja lógicamente (Estado: Inactivo). Se conserva en el historial para los alumnos que continúan bajo este plan.",
    plan: desactivado,
  };
};

/**
 * PATCH /api/plan-estudio/:id/reactivar
 * Vuelve a poner vigente un plan dado de baja. Solo hay un plan vigente a la
 * vez: si había otro, pasa a Inactivo.
 */
export const reactivarPlanEstudio = async (id) => {
  const planId = Number(id);
  if (!Number.isInteger(planId) || planId <= 0) {
    throw new HttpError(400, "ID de plan de estudio inválido");
  }

  const existe = await repo.buscarPlanPorId(planId);
  if (!existe) {
    throw new HttpError(404, "Plan de estudio no encontrado");
  }
  if (existe.activo) {
    throw new HttpError(409, "Ese plan de estudios ya está vigente");
  }

  const reactivado = await repo.reactivarPlanEstudio(planId);
  return {
    mensaje: "Plan de estudios reactivado (Estado: Vigente).",
    plan: reactivado,
  };
};

export const listarMaterias = async () => {
  return await repo.listarMaterias();
};

export const crearMateria = async (body = {}) => {
  const { nombre, modulosIds } = body;
  if (!nombre || !String(nombre).trim()) {
    throw new HttpError(400, "El nombre de la materia es obligatorio");
  }

  const ids = Array.isArray(modulosIds)
    ? [...new Set(modulosIds.map(Number))]
    : [];
  if (
    !ids.every(Number.isInteger) ||
    (await repo.modulosInexistentes(ids)).length > 0
  ) {
    throw new HttpError(400, "Alguno de los módulos indicados no existe");
  }

  try {
    return await repo.crearMateria({ nombre, modulosIds: ids });
  } catch (err) {
    if (err.code === "23505") {
      throw new HttpError(
        409,
        "Ya existe una materia registrada con ese nombre",
      );
    }
    throw err;
  }
};

export const crearCicloLectivo = async (body = {}) => {
  const anio = Number(body.anio);

  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    throw new HttpError(
      400,
      "El ciclo lectivo debe ser un año válido entre 2000 y 2100",
    );
  }

  return await repo.crearCicloLectivo(anio);
};

export const obtenerCicloLectivo = async () => {
  const ciclos = await repo.listarCiclosLectivos();
  const cicloActivo = ciclos.find((c) => c.activo) ?? {
    id: 1,
    anio: 2026,
    activo: true,
    estado: "Activo",
  };
  return {
    cicloActivo,
    ciclos,
  };
};
