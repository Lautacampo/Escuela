import { HttpError } from "../../utils/httpError.js";
import * as repo from "./calificaciones.repository.js";

const ESTADOS = ["Aprobado", "Desaprobado", "En Curso"];

// Devuelve el id del docente si el usuario lo es; null si es directivo
const resolverDocenteId = async (usuario) => {
  if (usuario.rol !== "docente") return null;
  const id = await repo.buscarPersonaIdDeUsuario(usuario.id);
  if (!id) throw new HttpError(403, "Tu usuario no está vinculado a un docente");
  return id;
};

export const listarModulos = async (usuario) => {
  const docenteId = await resolverDocenteId(usuario);
  const filas = await repo.listarCursosModulos(docenteId);

  const anios = new Map();
  for (const f of filas) {
    if (!anios.has(f.anio_curso)) anios.set(f.anio_curso, new Map());
    const mods = anios.get(f.anio_curso);
    if (!mods.has(f.modulo_id)) {
      mods.set(f.modulo_id, {
        moduloId: f.modulo_id,
        nombre: f.numero_leyenda,
        materias: f.materias,
        divisiones: [],
      });
    }
    mods.get(f.modulo_id).divisiones.push(f.division);
  }
  return [...anios].map(([anio, mods]) => ({ anio, modulos: [...mods.values()] }));
};

export const listarDivisiones = async (usuario, moduloId) => {
  if (!Number.isInteger(moduloId)) throw new HttpError(400, "Módulo inválido");

  const modulo = await repo.buscarModulo(moduloId);
  if (!modulo) throw new HttpError(404, "Módulo no encontrado");

  const docenteId = await resolverDocenteId(usuario);
  const divisiones = await repo.listarDivisionesDeModulo(moduloId, docenteId);

  return { moduloId: modulo.id, nombre: modulo.numero_leyenda, divisiones };
};

export const obtenerGrilla = async (usuario, moduloId, division) => {
  if (!Number.isInteger(moduloId)) throw new HttpError(400, "Módulo inválido");

  const curso = await repo.buscarCurso(moduloId, division);
  if (!curso) throw new HttpError(404, "División no encontrada");

  const docenteId = await resolverDocenteId(usuario);
  if (docenteId !== null && !(await repo.docenteTieneCurso(docenteId, curso.id))) {
    throw new HttpError(403, "No tienes asignada esta división");
  }

  const materias = await repo.listarMaterias(moduloId, docenteId);
  if (docenteId !== null && materias.length === 0) {
    throw new HttpError(403, "No tienes materias en este módulo");
  }

  const alumnos = await repo.listarAlumnos(curso.id, moduloId);
  const estados = await repo.listarEstados(
    alumnos.map((a) => a.cursada_id),
    materias.map((m) => m.id),
  );
  const mapa = new Map(estados.map((e) => [`${e.cursada_modulo_id}-${e.materia_id}`, e.estado]));

  return {
    moduloId,
    division,
    materias,
    alumnos: alumnos.map((a) => ({
      cursadaId: a.cursada_id,
      apellido: a.apellido,
      nombre: a.nombre,
      calificaciones: Object.fromEntries(
        materias.map((m) => [m.id, mapa.get(`${a.cursada_id}-${m.id}`) ?? "En Curso"]),
      ),
    })),
  };
};

export const actualizar = async (usuario, { cursadaModuloId, materiaId, estado }) => {
  if (
    !Number.isInteger(cursadaModuloId) ||
    !Number.isInteger(materiaId) ||
    !ESTADOS.includes(estado)
  ) {
    throw new HttpError(400, "Datos inválidos");
  }

  const cursada = await repo.buscarCursadaConMateria(cursadaModuloId, materiaId);
  if (!cursada) throw new HttpError(404, "La cursada o la materia no existe");

  const docenteId = await resolverDocenteId(usuario);
  if (
    docenteId !== null &&
    !(await repo.docenteDaMateriaEnCurso(docenteId, materiaId, cursada.curso_id))
  ) {
    throw new HttpError(403, "No puedes calificar esta materia");
  }

  return repo.guardarEstado(materiaId, cursadaModuloId, estado);
};