import { HttpError } from "../../utils/httpError.js";
import * as repo from "./calificaciones.repository.js";

const ESTADOS = ["Aprobado", "Desaprobado", "En Curso"];

// Todos los accesos a calificaciones deben identificar un ciclo concreto.
const validarAnio = (valor) => {
  const anio = Number(valor);
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    throw new HttpError(400, "Debe indicar un ciclo lectivo válido");
  }
  return anio;
};

export const listarCiclos = async () => {
  const ciclos = await repo.listarCiclos();
  const anioActual = new Date().getFullYear();
  // Crear el ciclo del año próximo no debe volverlo vigente automáticamente.
  const cicloActivo =
    ciclos.find((c) => Number(c.anio) === anioActual) ??
    ciclos.find((c) => Number(c.anio) < anioActual) ??
    ciclos[0] ??
    null;
  return { ciclos, cicloActivo };
};

const resolverDocenteId = async (usuario) => {
  if (usuario.rol !== "docente") return null;
  const id = await repo.buscarPersonaIdDeUsuario(usuario.id);
  if (!id)
    throw new HttpError(403, "Tu usuario no está vinculado a un docente");
  return id;
};

export const listarModulos = async (usuario, anioParametro) => {
  const anio = validarAnio(anioParametro);
  const docenteId = await resolverDocenteId(usuario);
  const filas = await repo.listarCursosModulos(docenteId, anio);

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
  return [...anios].map(([anio, mods]) => ({
    anio,
    modulos: [...mods.values()],
  }));
};

// Agrupa las filas por módulo y materia para el panel de inicio del docente.
const agruparResumen = (filas) => {
  const modulos = new Map();

  for (const fila of filas) {
    const clave = `${fila.anio_curso}-${fila.modulo_id}`;

    if (!modulos.has(clave)) {
      modulos.set(clave, {
        moduloId: fila.modulo_id,
        nombre: fila.modulo,
        anio: fila.anio_curso,
        divisiones: [],
        materias: [],
      });
    }

    const modulo = modulos.get(clave);
    if (!modulo.divisiones.includes(fila.division)) {
      modulo.divisiones.push(fila.division);
    }

    let materia = modulo.materias.find((m) => m.id === fila.materia_id);
    if (!materia) {
      materia = {
        id: fila.materia_id,
        nombre: fila.materia,
        alumnos: 0,
        calificados: 0,
      };
      modulo.materias.push(materia);
    }

    materia.alumnos += fila.alumnos;
    materia.calificados += fila.calificados;
  }

  return [...modulos.values()].map((modulo) => ({
    ...modulo,
    divisiones: [...modulo.divisiones].sort(),
    materias: modulo.materias
      .map((materia) => ({
        ...materia,
        pendientes: materia.alumnos - materia.calificados,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
  }));
};

// Progreso de carga de calificaciones por módulo y materia.
export const obtenerResumen = async (usuario, anioParametro) => {
  const anio = validarAnio(anioParametro);
  const docenteId = await resolverDocenteId(usuario);
  const filas = await repo.resumenCargaCalificaciones({ anio, docenteId });

  return { anio, modulos: agruparResumen(filas) };
};

export const listarDivisiones = async (usuario, moduloId, anioParametro) => {  const anio = validarAnio(anioParametro);
  if (!Number.isInteger(moduloId)) throw new HttpError(400, "Módulo inválido");

  const modulo = await repo.buscarModulo(moduloId);
  if (!modulo) throw new HttpError(404, "Módulo no encontrado");

  const docenteId = await resolverDocenteId(usuario);
  const divisiones = await repo.listarDivisionesDeModulo(
    moduloId,
    docenteId,
    anio,
  );

  return { moduloId: modulo.id, nombre: modulo.numero_leyenda, divisiones };
};

export const obtenerGrilla = async (
  usuario,
  moduloId,
  division,
  anioParametro,
) => {
  const anio = validarAnio(anioParametro);
  if (!Number.isInteger(moduloId)) throw new HttpError(400, "Módulo inválido");

  const curso = await repo.buscarCurso(moduloId, division, anio);
  if (!curso) throw new HttpError(404, "División no encontrada");

  const docenteId = await resolverDocenteId(usuario);
  if (
    docenteId !== null &&
    !(await repo.docenteTieneCurso(docenteId, curso.id))
  ) {
    throw new HttpError(403, "No tienes asignada esta división");
  }

  const materias = await repo.listarMaterias(moduloId, docenteId, curso.id);
  if (docenteId !== null && materias.length === 0) {
    throw new HttpError(403, "No tienes materias en este módulo");
  }

  const alumnos = await repo.listarAlumnos(curso.id, moduloId);
  const estados = await repo.listarEstados(
    alumnos.map((a) => a.cursada_id),
    materias.map((m) => m.id),
  );
  const mapa = new Map(
    estados.map((e) => [`${e.cursada_modulo_id}-${e.materia_id}`, e.estado]),
  );

  return {
    moduloId,
    division,
    anio,
    materias,
    alumnos: alumnos.map((a) => ({
      cursadaId: a.cursada_id,
      apellido: a.apellido,
      nombre: a.nombre,
      condicion: a.condicion,
      estadoAcademico: a.estado_academico,
      motivoLibre: a.motivo_libre,
      calificaciones: Object.fromEntries(
        materias.map((m) => [
          m.id,
          mapa.get(`${a.cursada_id}-${m.id}`) ?? "En Curso",
        ]),
      ),
    })),
  };
};

export const actualizar = async (
  usuario,
  { cursadaModuloId, materiaId, estado, anio: anioParametro },
) => {
  const anio = validarAnio(anioParametro);
  if (
    !Number.isInteger(cursadaModuloId) ||
    !Number.isInteger(materiaId)
  ) {
    throw new HttpError(400, "cursadaModuloId y materiaId deben ser números enteros");
  }
  // Se acepta con cualquier combinación de mayúsculas ("aprobado", "APROBADO").
  estado = ESTADOS.find(
    (e) => e.toLowerCase() === String(estado ?? "").trim().toLowerCase(),
  );
  if (!estado) {
    throw new HttpError(400, "El estado debe ser Aprobado, Desaprobado o En Curso");
  }

  const cursada = await repo.buscarCursadaConMateria(
    cursadaModuloId,
    materiaId,
  );
  if (!cursada) throw new HttpError(404, "La cursada o la materia no existe");
  if (Number(cursada.anio) !== anio) {
    throw new HttpError(
      409,
      "La cursada no corresponde al ciclo lectivo seleccionado",
    );
  }

  const docenteId = await resolverDocenteId(usuario);
  if (
    docenteId !== null &&
    !(await repo.docenteDaMateriaEnCurso(
      docenteId,
      materiaId,
      cursada.curso_id,
    ))
  ) {
    throw new HttpError(403, "No puedes calificar esta materia");
  }

  // La cursada quedó como historial: el alumno ya está recursando el módulo.
  if (cursada.reemplazada) {
    throw new HttpError(
      409,
      "Esta cursada está cerrada: el alumno ya se reinscribió para recursar el módulo. Calificá la cursada vigente",
    );
  }

  // Un módulo acreditado es definitivo: sus materias ya no se modifican.
  if (cursada.estado_academico === "APROBADO") {
    throw new HttpError(
      409,
      "El módulo ya está aprobado: no se pueden modificar las calificaciones de sus materias",
    );
  }

  const calificacion = await repo.guardarEstado(
    materiaId,
    cursadaModuloId,
    estado,
  );

  // Una materia desaprobada deja al alumno LIBRE en el módulo (debe
  // recursarlo); si se corrige la nota, vuelve a su situación anterior.
  // La base lo recalcula sola: acá solo se informa el resultado.
  const situacion = await repo.buscarSituacionCursada(cursadaModuloId);
  return {
    ...calificacion,
    condicion: situacion.condicion,
    estadoAcademico: situacion.estado_academico,
    motivoLibre: situacion.motivo_libre,
  };
};
