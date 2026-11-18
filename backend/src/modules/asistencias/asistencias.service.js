import { HttpError } from "../../utils/httpError.js";
import * as repo from "./asistencias.repository.js";
import { esFechaISOValida, hoyISO as fechaHoyISO } from "../../utils/fechas.js";

const VALORES_FALTA_VALIDOS = [0, 0.5, 1];

// Una cursada reemplazada por una recursada es historial: no se modifica.
const exigirCursadaVigente = (registro) => {
  if (registro.reemplazada) {
    throw new HttpError(
      409,
      "Esta cursada está cerrada: el alumno ya se reinscribió para recursar el módulo",
    );
  }
  if (registro.estado_academico === "APROBADO") {
    throw new HttpError(
      409,
      "El alumno ya aprobó este módulo: su asistencia no se modifica",
    );
  }
  if (registro.alumno_activo === false) {
    throw new HttpError(409, "El alumno está dado de baja");
  }
};

// La fecha de una asistencia no puede ser futura y tiene que ser del ciclo
// lectivo de la cursada (una falta cargada en 2030 o en 2019 por error de
// tipeo contaría para el límite de 25).
const exigirFechaDeLaCursada = (fecha, cursada) => {
  if (fecha > fechaHoyISO()) {
    throw new HttpError(400, "No se puede cargar asistencia de una fecha futura", {
      campo: "fecha",
    });
  }
  if (cursada.ciclo_anio && Number(fecha.slice(0, 4)) !== Number(cursada.ciclo_anio)) {
    throw new HttpError(
      400,
      `La fecha tiene que ser del ciclo lectivo ${cursada.ciclo_anio}, el de la cursada`,
      { campo: "fecha" },
    );
  }
};

// Meses en que se dicta cada período: I, III y V de marzo a julio; II, IV y VI
// de agosto a diciembre.
const MESES_DEL_PERIODO = {
  1: { desde: 3, hasta: 7, texto: "de marzo a julio" },
  2: { desde: 8, hasta: 12, texto: "de agosto a diciembre" },
};

// La asistencia se carga solo en días de clase del período del módulo: de
// lunes a viernes y dentro de sus meses.
const exigirDiaDeClase = (fecha, cursada) => {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  const diaSemana = new Date(Date.UTC(anio, mes - 1, dia)).getUTCDay();
  if (diaSemana === 0 || diaSemana === 6) {
    throw new HttpError(400, "No se carga asistencia los sábados ni los domingos", {
      campo: "fecha",
    });
  }
  const periodo = MESES_DEL_PERIODO[cursada.periodo];
  if (periodo && (mes < periodo.desde || mes > periodo.hasta)) {
    throw new HttpError(
      400,
      `${cursada.modulo_nombre ?? "Este módulo"} se dicta ${periodo.texto}: la fecha tiene que estar en ese período`,
      { campo: "fecha" },
    );
  }
};

// 0, 0.5 o 1 (como número o como texto numérico). null, true o "" no valen.
const leerValorFalta = (valor) => {
  if (typeof valor === "number") return valor;
  if (typeof valor === "string" && valor.trim() !== "") return Number(valor);
  return NaN;
};

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
  if (!esFechaISOValida(fecha)) {
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
    // Para que la planilla limite el calendario a los días de clase.
    modulo: curso.modulo_nombre,
    periodo: curso.periodo,
    cicloLectivo: curso.ciclo_anio,
    alumnos: alumnos.map((a) => ({
      cursadaId: a.cursada_id,
      alumnoId: a.alumno_id,
      apellido: a.apellido,
      nombre: a.nombre,
      dni: a.dni,
      faltasAcumuladas: Number(a.faltas_acumuladas),
      condicion: a.condicion,
      motivoLibre: a.motivo_libre,
      estadoAcademico: a.estado_academico,
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
  if (fecha !== null && !esFechaISOValida(fecha)) {
    throw new HttpError(400, "Formato de fecha inválido (use YYYY-MM-DD)");
  }

  return repo.listarAsistencias({ cursadaModuloId, fecha, preceptorId });
};

export const registrar = async (
  usuario,
  { cursadaModuloId, fecha, valorFalta },
) => {
  const numValor = leerValorFalta(valorFalta);
  if (
    !Number.isInteger(cursadaModuloId) ||
    !esFechaISOValida(fecha) ||
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

  exigirCursadaVigente(cursada);
  exigirFechaDeLaCursada(fecha, cursada);
  exigirDiaDeClase(fecha, cursada);

  return repo.guardarAsistencia(cursadaModuloId, fecha, numValor);
};

export const actualizar = async (usuario, id, { valorFalta, fecha }) => {
  if (!Number.isInteger(id)) {
    throw new HttpError(400, "ID de asistencia inválido");
  }

  const numValor = leerValorFalta(valorFalta);
  if (!VALORES_FALTA_VALIDOS.includes(numValor)) {
    throw new HttpError(400, "valorFalta inválido (debe ser 0, 0.5 o 1)");
  }
  if (fecha !== undefined && !esFechaISOValida(fecha)) {
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

  exigirCursadaVigente(existente);
  exigirFechaDeLaCursada(fecha ?? existente.fecha_iso, existente);
  // Al corregir solo el valor de una asistencia ya cargada no se revisa el día.
  if (fecha !== undefined && fecha !== existente.fecha_iso) {
    exigirDiaDeClase(fecha, existente);
  }

  try {
    return await repo.actualizarAsistenciaPorId(
      id,
      existente.cursada_modulo_id,
      numValor,
      fecha ?? existente.fecha_iso,
    );
  } catch (err) {
    // Mover el registro a una fecha que ya tiene asistencia cargada.
    if (err.constraint === "asistencia_cursada_fecha_uk") {
      throw new HttpError(
        409,
        "El alumno ya tiene una asistencia cargada en esa fecha",
      );
    }
    throw err;
  }
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

  exigirCursadaVigente(existente);

  await repo.eliminarAsistenciaPorId(id, existente.cursada_modulo_id);
};
