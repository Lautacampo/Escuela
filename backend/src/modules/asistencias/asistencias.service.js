import { HttpError } from "../../utils/httpError.js";
import * as repo from "./asistencias.repository.js";

const VALORES_FALTA_VALIDOS = [0, 0.5, 1];
const REGEX_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function fechaHoyISO() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

const resolverPreceptorId = async (usuario) => {
  if (usuario.rol !== "preceptor") return null;
  const id = await repo.buscarPreceptorIdDeUsuario(usuario.id);
  if (!id) {
    throw new HttpError(403, "Tu usuario no está vinculado a un preceptor");
  }
  return id;
};

export const listarModulos = async (usuario) => {
  const preceptorId = await resolverPreceptorId(usuario);
  const filas = await repo.listarCursosModulos(preceptorId);

  const anios = new Map();
  for (const f of filas) {
    if (!anios.has(f.anio_curso)) anios.set(f.anio_curso, new Map());
    const mods = anios.get(f.anio_curso);
    if (!mods.has(f.modulo_id)) {
      mods.set(f.modulo_id, {
        moduloId: f.modulo_id,
        nombre: f.numero_leyenda,
        divisiones: [],
      });
    }
    mods.get(f.modulo_id).divisiones.push(f.division);
  }

  return [...anios].map(([anio, mods]) => ({
    anio,
    modulos: [...mods.values()],
  }));
};

export const listarDivisiones = async (usuario, moduloId) => {
  if (!Number.isInteger(moduloId)) {
    throw new HttpError(400, "Módulo inválido");
  }

  const modulo = await repo.buscarModulo(moduloId);
  if (!modulo) {
    throw new HttpError(404, "Módulo no encontrado");
  }

  const preceptorId = await resolverPreceptorId(usuario);
  const divisiones = await repo.listarDivisionesDeModulo(moduloId, preceptorId);

  return {
    moduloId: modulo.id,
    nombre: modulo.numero_leyenda,
    divisiones,
  };
};

export const obtenerPlanilla = async (
  usuario,
  moduloId,
  division,
  fechaQuery,
) => {
  if (!Number.isInteger(moduloId)) {
    throw new HttpError(400, "Módulo inválido");
  }

  const fecha = fechaQuery ?? fechaHoyISO();
  if (!REGEX_FECHA.test(fecha)) {
    throw new HttpError(400, "Formato de fecha inválido (use YYYY-MM-DD)");
  }

  const curso = await repo.buscarCurso(moduloId, division);
  if (!curso) {
    throw new HttpError(404, "División no encontrada para este módulo");
  }

  const preceptorId = await resolverPreceptorId(usuario);
  if (
    preceptorId !== null &&
    !(await repo.preceptorTieneCurso(preceptorId, curso.id))
  ) {
    throw new HttpError(403, "No tienes asignada esta división");
  }

  const alumnos = await repo.listarAlumnosPlanilla(curso.id, moduloId, fecha);

  return {
    moduloId,
    division,
    fecha,
    alumnos: alumnos.map((a) => ({
      cursadaId: a.cursada_id,
      alumnoId: a.alumno_id,
      apellido: a.apellido,
      nombre: a.nombre,
      dni: a.dni,
      faltasAcumuladas: Number(a.faltas_acumuladas),
      condicion: a.condicion,
      asistenciaHoy: a.asistencia_id
        ? {
            id: a.asistencia_id,
            valorFalta: Number(a.valor_falta),
          }
        : null,
    })),
  };
};

export const listar = async (usuario, query = {}) => {
  const preceptorId = await resolverPreceptorId(usuario);
  const cursadaModuloId =
    query.cursadaModuloId !== undefined ? Number(query.cursadaModuloId) : null;
  const fecha = query.fecha ?? null;

  if (cursadaModuloId !== null && !Number.isInteger(cursadaModuloId)) {
    throw new HttpError(400, "cursadaModuloId inválido");
  }
  if (fecha !== null && !REGEX_FECHA.test(fecha)) {
    throw new HttpError(400, "Formato de fecha inválido (use YYYY-MM-DD)");
  }

  return repo.listarAsistencias({ cursadaModuloId, fecha, preceptorId });
};

export const registrar = async (
  usuario,
  { cursadaModuloId, fecha, valorFalta },
) => {
  const numValor = Number(valorFalta);
  if (
    !Number.isInteger(cursadaModuloId) ||
    !fecha ||
    !REGEX_FECHA.test(fecha) ||
    !VALORES_FALTA_VALIDOS.includes(numValor)
  ) {
    throw new HttpError(
      400,
      "Datos inválidos: cursadaModuloId (entero), fecha (YYYY-MM-DD) y valorFalta (0, 0.5 o 1) son obligatorios",
    );
  }

  const cursada = await repo.buscarCursada(cursadaModuloId);
  if (!cursada) {
    throw new HttpError(404, "La cursada del alumno no existe");
  }

  const preceptorId = await resolverPreceptorId(usuario);
  if (
    preceptorId !== null &&
    !(await repo.preceptorTieneCurso(preceptorId, cursada.curso_id))
  ) {
    throw new HttpError(
      403,
      "No tienes permiso para tomar asistencia en este curso",
    );
  }

  return repo.guardarAsistencia(cursadaModuloId, fecha, numValor);
};

export const actualizar = async (usuario, id, { valorFalta, fecha }) => {
  if (!Number.isInteger(id)) {
    throw new HttpError(400, "ID de asistencia inválido");
  }

  const numValor = Number(valorFalta);
  if (!VALORES_FALTA_VALIDOS.includes(numValor)) {
    throw new HttpError(400, "valorFalta inválido (debe ser 0, 0.5 o 1)");
  }
  if (fecha !== undefined && !REGEX_FECHA.test(fecha)) {
    throw new HttpError(400, "Formato de fecha inválido (use YYYY-MM-DD)");
  }

  const existente = await repo.buscarAsistenciaPorId(id);
  if (!existente) {
    throw new HttpError(404, "Registro de asistencia no encontrado");
  }

  const preceptorId = await resolverPreceptorId(usuario);
  if (
    preceptorId !== null &&
    !(await repo.preceptorTieneCurso(preceptorId, existente.curso_id))
  ) {
    throw new HttpError(
      403,
      "No tienes permiso para modificar asistencias de este curso",
    );
  }

  return repo.actualizarAsistenciaPorId(
    id,
    existente.cursada_modulo_id,
    numValor,
    fecha ?? existente.fecha_iso,
  );
};

export const eliminar = async (usuario, id) => {
  if (!Number.isInteger(id)) {
    throw new HttpError(400, "ID de asistencia inválido");
  }

  const existente = await repo.buscarAsistenciaPorId(id);
  if (!existente) {
    throw new HttpError(404, "Registro de asistencia no encontrado");
  }

  const preceptorId = await resolverPreceptorId(usuario);
  if (
    preceptorId !== null &&
    !(await repo.preceptorTieneCurso(preceptorId, existente.curso_id))
  ) {
    throw new HttpError(
      403,
      "No tienes permiso para eliminar asistencias de este curso",
    );
  }

  await repo.eliminarAsistenciaPorId(id, existente.cursada_modulo_id);
};
