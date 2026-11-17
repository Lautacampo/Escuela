import { HttpError } from "../../utils/httpError.js";
import { ReglaNegocio } from "../../utils/reglaNegocio.js";
import {
  esFechaISOValida,
  esMayorDeEdad,
  hoyISO,
} from "../../utils/fechas.js";
import { traducirUnicidadPersona } from "../../utils/errorUnicidadPersona.js";
import {
  esCuilValido,
  esDniValido,
  esTelefonoValido,
  normalizarCuil,
  normalizarDni,
} from "../../utils/validacionesPersona.js";
import * as repo from "./alumnos.repository.js";

// Campos de texto obligatorios (NOT NULL en persona/alumno) y su etiqueta.
const ETIQUETAS_REQUERIDOS = {
  nombre: "El nombre",
  apellido: "El apellido",
  cuil: "El CUIL",
  domicilio: "El domicilio",
  lugarNacimiento: "El lugar de nacimiento",
  telefonoEmergencia: "El teléfono de emergencia",
};

export const REQUERIDOS = Object.keys(ETIQUETAS_REQUERIDOS);

const DESCRIPCION_MOTIVO_LIBRE = {
  INASISTENCIAS: "superó el límite de 25 inasistencias",
  MATERIA_DESAPROBADA: "tiene una materia del módulo desaprobada",
  INSTANCIAS_AGOTADAS: "agotó las 4 instancias de acreditación sin aprobar",
};

const NOMBRE_PERIODO = { 1: "marzo a julio", 2: "agosto a diciembre" };

const validar = (body) => {
  const d = {};
  for (const campo of REQUERIDOS) {
    d[campo] = String(body[campo] ?? "").trim();
    if (!d[campo]) {
      throw new HttpError(
        400,
        `${ETIQUETAS_REQUERIDOS[campo]} es obligatorio`,
        { campo },
      );
    }
  }

  d.dni = normalizarDni(body.dni);
  if (!esDniValido(body.dni)) {
    throw new HttpError(
      400,
      "El DNI debe tener entre 7 y 8 dígitos numéricos",
      { campo: "dni" },
    );
  }

  if (d.cuil.length > 15) {
    throw new HttpError(400, "El CUIL no puede superar los 15 caracteres", {
      campo: "cuil",
    });
  }
  if (!esCuilValido(d.cuil, d.dni)) {
    throw new HttpError(
      400,
      "El CUIL debe tener 11 dígitos y corresponder al DNI",
      { campo: "cuil" },
    );
  }
  d.cuil = normalizarCuil(d.cuil);

  for (const [campo, maximo] of [
    ["nombre", 100],
    ["apellido", 100],
    ["cuil", 15],
    ["domicilio", 200],
    ["lugarNacimiento", 100],
    ["telefonoEmergencia", 30],
  ]) {
    if (String(d[campo]).length > maximo) {
      throw new HttpError(
        400,
        `${ETIQUETAS_REQUERIDOS[campo] ?? `El campo ${campo}`} no puede superar ${maximo} caracteres`,
        { campo },
      );
    }
  }

  d.email = String(body.email ?? "").trim();
  if (!d.email) {
    throw new HttpError(400, "El correo electrónico es obligatorio", {
      campo: "email",
    });
  }
  if (
    d.email.length > 200 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)
  ) {
    throw new HttpError(400, "El correo electrónico no es válido", {
      campo: "email",
    });
  }

  d.telefono = String(body.telefono ?? "").trim() || null;
  if (
    !esTelefonoValido(d.telefono) ||
    (d.telefono && d.telefono.length > 20)
  ) {
    throw new HttpError(
      400,
      "El teléfono debe tener entre 8 y 15 dígitos",
      { campo: "telefono" },
    );
  }

  if (
    !esTelefonoValido(d.telefonoEmergencia, true) ||
    d.telefonoEmergencia.length > 30
  ) {
    throw new HttpError(
      400,
      "El teléfono de emergencia debe tener entre 8 y 15 dígitos",
      { campo: "telefonoEmergencia" },
    );
  }

  d.fechaNacimiento = body.fechaNacimiento;
  if (!esFechaISOValida(d.fechaNacimiento)) {
    throw new HttpError(
      400,
      "La fecha de nacimiento debe ser una fecha válida (AAAA-MM-DD)",
      { campo: "fechaNacimiento" },
    );
  }
  if (d.fechaNacimiento > hoyISO() || d.fechaNacimiento < "1900-01-01") {
    throw new HttpError(
      400,
      "La fecha de nacimiento no puede ser futura ni anterior a 1900",
      { campo: "fechaNacimiento" },
    );
  }
  if (!esMayorDeEdad(d.fechaNacimiento)) {
    throw new HttpError(
      400,
      "El alumno debe tener 18 años o más",
      { campo: "fechaNacimiento" },
    );
  }

  d.trabaja = Boolean(body.trabaja);
  d.cantidadHijos = Number(body.cantidadHijos ?? 0);
  if (
    !Number.isInteger(d.cantidadHijos) ||
    d.cantidadHijos < 0 ||
    d.cantidadHijos > 99
  ) {
    throw new HttpError(
      400,
      "La cantidad de hijos debe ser un entero entre 0 y 99",
      { campo: "cantidadHijos" },
    );
  }
  return d;
};

const traducirError = (err) => {
  if (err instanceof HttpError) return err;
  const duplicado = traducirUnicidadPersona(err);
  if (duplicado) return duplicado;
  if (err.constraint === "equivalencia_modulo_alumno_modulo_uk")
    return new HttpError(409, "Esa equivalencia ya está registrada");
  if (err.constraint === "cursada_modulo_abierta_uk")
    return new HttpError(409, "El alumno ya tiene una cursada abierta de ese módulo");
  if (err.constraint === "cursada_en_curso_unica")
    return new HttpError(409, "El alumno ya está cursando ese módulo");
  if (err.constraint === "cursada_modulo_activa_uk")
    return new HttpError(409, "El alumno ya tiene una cursada activa");
  if (err.code === "22007" || err.code === "22008")
    return new HttpError(400, "Fecha inválida");
  if (err.code === "P0001") return new HttpError(409, err.message);
  return err;
};

// Describe en palabras la situación del alumno en un correlativo pendiente.
const describirPendiente = (p) => {
  if (p.estado === "A_RECURSAR") return `${p.nombre} (quedó libre: debe recursarlo)`;
  if (p.estado === "EN_CURSO" || p.estado === "PENDIENTE")
    return `${p.nombre} (todavía sin aprobar)`;
  return `${p.nombre} (sin cursar ni acreditar por equivalencia)`;
};

/**
 * Indica si una cursada puede recibir una nueva evaluación de módulo y, si no,
 * por qué. Es la misma secuencia de reglas que aplica evaluarModulo.
 */
const analizarEvaluacion = (cursada, materias, correlativos) => {
  const instancias = cursada.evaluaciones.length;
  const materiasPendientes = materias
    .filter((m) => m.estado !== "Aprobado")
    .map((m) => ({ id: m.id, nombre: m.nombre, estado: m.estado }));

  let bloqueo = null;
  if (cursada.estadoAcademico === "APROBADO") {
    bloqueo = "El módulo ya está aprobado.";
  } else if (cursada.condicion === "LIBRE") {
    bloqueo = `El alumno está LIBRE en este módulo porque ${
      DESCRIPCION_MOTIVO_LIBRE[cursada.motivoLibre] ?? "perdió la regularidad"
    }. Debe recursarlo.`;
  } else if (correlativos.length > 0) {
    bloqueo = `Correlatividad: para acreditar ${cursada.modulo} debe tener aprobados ${correlativos
      .map((c) => c.nombre)
      .join(" y ")}.`;
  } else if (materiasPendientes.length > 0) {
    bloqueo = "Todas las materias del módulo deben estar aprobadas.";
  } else if (instancias >= 4) {
    bloqueo = "El módulo ya alcanzó el máximo de 4 instancias.";
  }

  return {
    evaluable: bloqueo === null,
    bloqueoEvaluacion: bloqueo,
    proximaInstancia: instancias < 4 ? instancias + 1 : null,
    materias: materias.map((m) => ({ id: m.id, nombre: m.nombre, estado: m.estado })),
    materiasPendientes,
    correlativosPendientes: correlativos.map((c) => ({ id: c.id, nombre: c.nombre })),
  };
};

/**
 * Arma la respuesta de alumnos con su trayectoria y equivalencias.
 * Con `detalle` se agrega, por cursada, lo necesario para la ficha:
 * materias, correlativos pendientes y si admite una evaluación de módulo.
 */
const armar = async (filas, { detalle = false } = {}) => {
  if (filas.length === 0) return [];

  const ids = filas.map((f) => f.id);
  const cursadas = await repo.listarCursadas(ids);
  const cursadaIds = cursadas.map((c) => c.id);
  const equivalencias = await repo.listarEquivalencias(ids);
  const evaluaciones = cursadaIds.length
    ? await repo.listarEvaluaciones(cursadaIds)
    : [];
  const materias =
    detalle && cursadaIds.length
      ? await repo.listarMateriasDeCursadas(cursadaIds)
      : [];
  const correlativos =
    detalle && cursadaIds.length
      ? await repo.correlativosPendientesDeCursadas(cursadaIds)
      : [];
  const idsModulos = await repo.listarIdsModulos();

  return filas.map((f) => {
    const trayectoria = cursadas
      .filter((c) => c.alumno_id === f.id)
      .map((c) => {
        const cursada = {
          idCursada: c.id,
          cursoId: c.curso_id,
          moduloId: c.modulo_id,
          modulo: c.numero_leyenda,
          periodo: c.periodo,
          periodoDictado: NOMBRE_PERIODO[c.periodo] ?? null,
          anioCurso: c.anio_curso,
          cicloLectivo: c.ciclo_anio,
          division: c.division,
          estadoAcademico: c.estado_academico,
          condicion: c.condicion,
          motivoLibre: c.motivo_libre,
          descripcionMotivoLibre: DESCRIPCION_MOTIVO_LIBRE[c.motivo_libre] ?? null,
          activa: c.activa,
          faltas: c.cantidad_faltas_acumuladas,
          evaluaciones: evaluaciones
            .filter((e) => e.cursada_modulo_id === c.id)
            .map((e) => ({
              id: e.id,
              fecha: e.fecha,
              nota: e.nota === null ? null : Number(e.nota),
              nroInstancia: e.nro_instancia,
              tipoInstancia: e.tipo_instancia,
            })),
        };

        if (!detalle) return cursada;
        return {
          ...cursada,
          ...analizarEvaluacion(
            cursada,
            materias.filter((m) => m.cursada_modulo_id === c.id),
            correlativos.filter((k) => k.cursada_modulo_id === c.id),
          ),
        };
      });

    const equivalenciasAlumno = equivalencias
      .filter((e) => e.alumno_id === f.id)
      .map((e) => ({
        moduloId: e.modulo_id,
        modulo: e.numero_leyenda,
        fecha: e.fecha,
        observacion: e.observacion,
      }));

    // Módulos acreditados: aprobados en la escuela o reconocidos por equivalencia.
    const modulosAcreditados = [
      ...new Set([
        ...trayectoria
          .filter((c) => c.estadoAcademico === "APROBADO")
          .map((c) => c.moduloId),
        ...equivalenciasAlumno.map((e) => e.moduloId),
      ]),
    ].sort((a, b) => a - b);

    // Egresado: todos los módulos acreditados y al menos uno aprobado acá.
    const egresado =
      idsModulos.length > 0 &&
      idsModulos.every((id) => modulosAcreditados.includes(id)) &&
      trayectoria.some((c) => c.estadoAcademico === "APROBADO");
    // Fecha de egreso: la de la última evaluación con la que aprobó un módulo.
    const fechaEgreso = egresado
      ? trayectoria
          .flatMap((c) => c.evaluaciones)
          .filter((e) => e.nota !== null && e.nota >= 7)
          .map((e) => e.fecha)
          .sort()
          .at(-1) ?? null
      : null;

    const actual =
      trayectoria.find((c) => c.activa) ??
      [...trayectoria]
        .reverse()
        .find((c) => c.estadoAcademico !== "APROBADO") ??
      trayectoria.at(-1);

    return {
      id: f.id,
      nombre: f.nombre,
      apellido: f.apellido,
      dni: f.dni,
      cuil: f.cuil,
      fechaNacimiento: f.fecha_nacimiento,
      lugarNacimiento: f.lugar_nacimiento,
      domicilio: f.domicilio,
      telefono: f.telefono,
      email: f.email,
      trabaja: f.trabaja,
      telefonoEmergencia: f.telefono_emergencia,
      cantidadHijos: f.cantidad_hijos,
      activo: f.activo,
      cursadaModuloId: actual?.idCursada ?? null,
      cursoId: actual?.cursoId ?? null,
      curso: actual?.anioCurso ?? null,
      cicloLectivo: actual?.cicloLectivo ?? null,
      division: actual?.division ?? null,
      moduloId: actual?.moduloId ?? null,
      moduloActual: actual?.modulo ?? null,
      faltas: actual?.faltas ?? null,
      condicion: actual?.condicion ?? null,
      estadoAcademico: actual?.estadoAcademico ?? null,
      motivoLibre: actual?.motivoLibre ?? null,
      descripcionMotivoLibre: actual?.descripcionMotivoLibre ?? null,
      egresado,
      fechaEgreso,
      modulosAcreditados,
      equivalencias: equivalenciasAlumno,
      trayectoria,
    };
  });
};

const buscarOFallar = async (id) => {
  if (!Number.isInteger(id)) throw new HttpError(400, "Alumno inválido");
  const fila = await repo.buscarAlumno(id);
  if (!fila) throw new HttpError(404, "Alumno no encontrado");
  return fila;
};

// El legajo de un egresado es de solo lectura: no se modifica, no se da de
// baja, no se matricula ni se le cambian equivalencias.
const exigirNoEgresado = async (id) => {
  if (await repo.esEgresado(id)) {
    throw new HttpError(
      409,
      "El alumno es egresado: su legajo es de solo lectura y no admite cambios",
    );
  }
};

const buscarActivoOFallar = async (id) => {
  const fila = await buscarOFallar(id);
  await exigirNoEgresado(id);
  if (!fila.activo) throw new HttpError(409, "El alumno está dado de baja");
  return fila;
};

/**
 * GET /alumnos                -> alumnos activos que todavía no egresaron
 * GET /alumnos?egresados=true -> solo los egresados
 */
export const listar = async ({
  incluirInactivos = false,
  soloEgresados = false,
} = {}) => armar(await repo.listarAlumnos({ incluirInactivos, soloEgresados }));

export const obtener = async (id) =>
  (await armar([await buscarOFallar(id)], { detalle: true }))[0];

export const crear = async (body) => {
  const datos = validar(body);
  let id;
  try {
    id = await repo.crearAlumno(datos);
  } catch (err) {
    throw traducirError(err);
  }
  return obtener(id);
};

export const actualizar = async (id, body) => {
  await buscarActivoOFallar(id);
  const datos = validar(body);
  try {
    await repo.actualizarAlumno(id, datos);
  } catch (err) {
    throw traducirError(err);
  }
  return obtener(id);
};

/**
 * Baja lógica (DELETE /alumnos/:id): no se borra ningún dato. El alumno queda
 * inactivo, desaparece del padrón y de las planillas, y puede reactivarse.
 */
export const eliminar = async (id) => {
  const fila = await buscarOFallar(id);
  await exigirNoEgresado(id);
  if (!fila.activo) return;
  try {
    await repo.darDeBajaAlumno(id);
  } catch (err) {
    throw traducirError(err);
  }
};

export const reactivar = async (id) => {
  await buscarOFallar(id);
  try {
    await repo.reactivarAlumno(id);
  } catch (err) {
    throw traducirError(err);
  }
  return obtener(id);
};

// Traduce las reglas de negocio de matrícula/equivalencias a errores HTTP.
const traducirRegla = (err, modulo = null) => {
  if (!(err instanceof ReglaNegocio)) return traducirError(err);
  const d = err.datos;
  const nombreModulo = modulo?.nombre ?? "ese módulo";

  switch (err.motivo) {
    case "YA_TIENE_CURSADA_ACTIVA":
      return new HttpError(
        409,
        "El alumno ya tiene una cursada activa. Editá su matrícula para cambiarla",
      );
    case "MODULO_ACREDITADO":
      return new HttpError(
        409,
        d.porEquivalencia
          ? `El alumno ya tiene acreditado ${nombreModulo} por equivalencia`
          : `El alumno ya aprobó ${nombreModulo}`,
      );
    case "CORRELATIVAS_PENDIENTES": {
      const error = new HttpError(
        409,
        `Correlatividad: para cursar ${nombreModulo} el alumno debe tener aprobados ${d.pendientes
          .map(describirPendiente)
          .join(" y ")}`,
      );
      // El frontend usa este detalle para ofrecer el ingreso por equivalencia.
      error.detalle = {
        codigo: "CORRELATIVAS_PENDIENTES",
        pendientes: d.pendientes.map((p) => ({
          id: p.id,
          nombre: p.nombre,
          estado: p.estado,
          admiteEquivalencia: p.estado === null,
        })),
      };
      return error;
    }
    case "EQUIVALENCIA_MODULO_INEXISTENTE":
      return new HttpError(400, "Alguno de los módulos de equivalencia no existe");
    case "EQUIVALENCIA_CON_CURSADA":
      return new HttpError(
        409,
        `No corresponde equivalencia para ${d.modulo}: el alumno ya lo cursó en la institución y debe aprobarlo o recursarlo`,
      );
    case "EQUIVALENCIA_SIN_CORRELATIVAS":
      return new HttpError(
        409,
        `Para acreditar ${d.modulo} por equivalencia también deben estar acreditados ${d.pendientes
          .map((p) => p.nombre)
          .join(" y ")}`,
      );
    default:
      return err;
  }
};

// Valida el pedido de equivalencias: lista de módulos + observación obligatoria.
const validarEquivalencias = (equivalencias, observacion, { obligatorias }) => {
  const lista = equivalencias ?? [];
  if (!Array.isArray(lista) || !lista.every(Number.isInteger)) {
    throw new HttpError(400, "Las equivalencias deben ser una lista de módulos");
  }
  const ids = [...new Set(lista)];
  if (obligatorias && ids.length === 0) {
    throw new HttpError(400, "Indicá al menos un módulo a acreditar por equivalencia");
  }

  // La observación (institución de origen, norma) es opcional. La columna es
  // NOT NULL, así que sin dato se guarda vacía.
  const texto = String(observacion ?? "").trim();
  if (texto.length > 300) {
    throw new HttpError(400, "La observación de la equivalencia admite hasta 300 caracteres");
  }
  return { ids, observacion: texto };
};

/**
 * Lógica común de POST y PUT /alumnos/:id/cursadas.
 * Las correlatividades se validan SIEMPRE, también en el alta: un alumno solo
 * puede empezar en un módulo avanzado si acredita los anteriores por
 * equivalencia (campo `equivalencias` + `observacionEquivalencia`).
 */
const guardarMatricula = async (id, body, { soloAlta }) => {
  await buscarActivoOFallar(id);

  const { idCurso, idModulo } = body;
  if (!Number.isInteger(idCurso) || !Number.isInteger(idModulo)) {
    throw new HttpError(400, "Curso o módulo inválido");
  }

  const modulo = await repo.buscarModulo(idModulo);
  if (!modulo) throw new HttpError(404, "El módulo no existe");

  if (!(await repo.cursoTieneModulo(idCurso, idModulo))) {
    throw new HttpError(400, "El módulo no pertenece a ese curso");
  }

  const equivalencias = validarEquivalencias(
    body.equivalencias,
    body.observacionEquivalencia,
    { obligatorias: false },
  );

  try {
    return await repo.guardarMatricula(id, {
      cursoId: idCurso,
      moduloId: idModulo,
      equivalencias: equivalencias.ids,
      observacion: equivalencias.observacion,
      soloAlta,
    });
  } catch (err) {
    throw traducirRegla(err, modulo);
  }
};

/** POST /alumnos/:id/cursadas — primera matrícula del alumno. */
export const matricular = async (id, body = {}) => {
  const resultado = await guardarMatricula(id, body, { soloAlta: true });
  return { cursadaModuloId: resultado.cursadaModuloId, tipo: resultado.tipo };
};

/**
 * PUT /alumnos/:id/cursadas — cambia la matrícula (curso, división o módulo)
 * manteniendo una única cursada activa. También es la vía para recursar un
 * módulo en el que el alumno quedó LIBRE.
 */
export const actualizarCursada = async (id, body = {}) => {
  const resultado = await guardarMatricula(id, body, { soloAlta: false });
  return { ...(await obtener(id)), matricula: resultado.tipo };
};

/** POST /alumnos/:id/equivalencias */
export const registrarEquivalencias = async (id, body = {}) => {
  await buscarActivoOFallar(id);
  const { ids, observacion } = validarEquivalencias(
    body.modulosIds,
    body.observacion,
    { obligatorias: true },
  );
  try {
    await repo.registrarEquivalencias(id, ids, observacion);
  } catch (err) {
    throw traducirRegla(err);
  }
  return obtener(id);
};

// Tipos de instancia definidos por la cátedra: la 1 es colegiada, la 4 es
// especial y las intermedias son de calendario. Se derivan del número para
// que el cliente no pueda guardar combinaciones inconsistentes.
const TIPO_POR_INSTANCIA = {
  1: "COLEGIADA",
  2: "CALENDARIO",
  3: "CALENDARIO",
  4: "ESPECIAL",
};

/**
 * POST /alumnos/evaluaciones-modulo
 * Registra una instancia de evaluación para la cursada de un módulo.
 *
 * Requisitos:
 * - La cursada debe existir y pertenecer a un alumno activo.
 * - El módulo no puede estar aprobado ni superar las 4 instancias.
 * - El alumno no puede estar LIBRE en el módulo (inasistencias, materia
 *   desaprobada o instancias agotadas): debe recursarlo.
 * - Correlatividades: los módulos previos deben estar aprobados.
 * - Todas las materias del módulo deben estar calificadas como Aprobado.
 * - La instancia enviada debe ser la próxima (MAX + 1), para evitar
 *   duplicados o saltos si la ficha quedó desactualizada.
 */
export const evaluarModulo = async (body = {}) => {
  const cursadaModuloId = Number(body.idCursadaModulo);
  const nota = Number(body.nota);
  const nroInstancia = Number(body.nroInstancia);
  const fecha = String(body.fecha ?? "").trim();
  const tipoRecibido = String(body.tipoInstancia ?? "")
    .trim()
    .toUpperCase();

  if (!Number.isInteger(cursadaModuloId) || cursadaModuloId <= 0) {
    throw new HttpError(400, "idCursadaModulo inválido");
  }

  if (!esFechaISOValida(fecha)) {
    throw new HttpError(
      400,
      "La fecha debe ser válida y tener el formato AAAA-MM-DD",
    );
  }

  if (!Number.isFinite(nota) || nota < 0 || nota > 10) {
    throw new HttpError(400, "La nota debe ser un número entre 0 y 10");
  }

  if (!Number.isInteger(nroInstancia) || nroInstancia < 1 || nroInstancia > 4) {
    throw new HttpError(400, "La instancia debe ser un entero entre 1 y 4");
  }

  const tipoInstancia = TIPO_POR_INSTANCIA[nroInstancia];
  if (tipoRecibido && tipoRecibido !== tipoInstancia) {
    throw new HttpError(
      400,
      `La instancia ${nroInstancia} corresponde al tipo ${tipoInstancia}`,
    );
  }

  let resultado;
  try {
    resultado = await repo.registrarEvaluacionModulo(cursadaModuloId, {
      fecha,
      nota: Math.round(nota * 100) / 100,
      nroInstancia,
      tipoInstancia,
    });
  } catch (err) {
    throw traducirError(err);
  }

  switch (resultado.motivo) {
    case "NO_EXISTE":
      throw new HttpError(404, "La cursada del alumno no existe");
    case "ALUMNO_INACTIVO":
      throw new HttpError(409, "El alumno está dado de baja");
    case "MODULO_APROBADO":
      throw new HttpError(
        409,
        "El módulo ya está aprobado y no admite otra instancia",
      );
    case "ALUMNO_LIBRE":
      throw new HttpError(
        409,
        `El alumno está LIBRE en este módulo porque ${
          DESCRIPCION_MOTIVO_LIBRE[resultado.motivoLibre] ?? "perdió la regularidad"
        }. Debe recursarlo; no puede rendir la evaluación`,
      );
    case "CORRELATIVAS_PENDIENTES":
      throw new HttpError(
        409,
        `Correlatividad: para acreditar este módulo el alumno debe tener aprobados ${resultado.pendientes
          .map(describirPendiente)
          .join(" y ")}`,
      );
    case "MATERIAS_PENDIENTES":
      throw new HttpError(
        409,
        `Todas las materias del módulo deben estar aprobadas. Pendientes: ${resultado.pendientes.join(", ")}`,
      );
    case "MAXIMO_INSTANCIAS":
      throw new HttpError(
        409,
        "El módulo ya alcanzó el máximo de 4 instancias",
      );
    case "INSTANCIA_INVALIDA":
      throw new HttpError(
        409,
        `La próxima instancia es la ${resultado.instanciaEsperada}. Actualizá la ficha e intentá de nuevo`,
      );
    default:
      break;
  }

  const evaluacion = resultado.evaluacion;

  return {
    id: evaluacion.id,
    idCursadaModulo: evaluacion.cursada_modulo_id,
    fecha: evaluacion.fecha,
    nota: Number(evaluacion.nota),
    nroInstancia: evaluacion.nro_instancia,
    tipoInstancia: evaluacion.tipo_instancia,
    estadoAcademico: resultado.estadoAcademico,
    condicion: resultado.condicion,
    motivoLibre: resultado.motivoLibre,
    descripcionMotivoLibre:
      DESCRIPCION_MOTIVO_LIBRE[resultado.motivoLibre] ?? null,
    aprobado: resultado.aprobado,
  };
};

