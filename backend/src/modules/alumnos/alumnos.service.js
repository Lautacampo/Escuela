import { HttpError } from "../../utils/httpError.js";
import * as repo from "./alumnos.repository.js";

export const REQUERIDOS = ["nombre", "apellido", "cuil", "domicilio", "lugarNacimiento", "telefonoEmergencia"];

const validar = (body) => {
    const d = {};
    for (const campo of REQUERIDOS) {
        d[campo] = String(body[campo] ?? "").trim();
        if (!d[campo]) throw new HttpError(400, `Falta el campo ${campo}`);
    }

    d.dni = String(body.dni ?? "").replace(/\./g, "").trim();
    if (!/^\d{7,8}$/.test(d.dni) || Number(d.dni) < 1000000) {
        throw new HttpError(400, "DNI inválido");
    }

    d.email = String(body.email ?? "").trim() || null;
    if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
        throw new HttpError(400, "Correo electrónico inválido");
    }

    d.telefono = String(body.telefono ?? "").trim() || null;
    d.fechaNacimiento = body.fechaNacimiento;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d.fechaNacimiento ?? "")) {
        throw new HttpError(400, "La fecha de nacimiento debe ser AAAA-MM-DD");
    }

    d.trabaja = Boolean(body.trabaja);
    d.cantidadHijos = Number(body.cantidadHijos ?? 0);
    if (!Number.isInteger(d.cantidadHijos) || d.cantidadHijos < 0) {
        throw new HttpError(400, "Cantidad de hijos inválida");
    }
    return d;
};

const traducirError = (err) => {
    if (err instanceof HttpError) return err;
    if (err.constraint === "persona_dni_key") return new HttpError(409, "Ya existe una persona con ese DNI");
    if (err.constraint === "persona_cuil_key") return new HttpError(409, "Ya existe una persona con ese CUIL");
    if (err.constraint === "cursada_en_curso_unica") return new HttpError(409, "El alumno ya está cursando ese módulo");
    if (err.constraint === "cursada_modulo_activa_uk") return new HttpError(409, "El alumno ya tiene una cursada activa");
    if (err.code === "22007" || err.code === "22008") return new HttpError(400, "Fecha inválida");
    if (err.code === "P0001") return new HttpError(409, err.message);
    return err;
};

const armar = async (filas) => {
    if (filas.length === 0) return [];

    const cursadas = await repo.listarCursadas(filas.map((f) => f.id));
    const evaluaciones = cursadas.length
        ? await repo.listarEvaluaciones(cursadas.map((c) => c.id))
        : [];
    
    return filas.map((f) => {
        const trayectoria = cursadas
            .filter((c) => c.alumno_id === f.id)
            .map((c) => ({
                idCursada: c.id,
                cursoId: c.curso_id,
                moduloId: c.modulo_id,
                modulo: c.numero_leyenda,
                anioCurso: c.anio_curso,
                division: c.division,
                estadoAcademico: c.estado_academico,
                condicion: c.condicion,
                activa: c.activa,
                faltas: c.cantidad_faltas_acumuladas,
                evaluaciones: evaluaciones
                    .filter((e) => e.cursada_modulo_id === c.id)
                    .map((e) => ({
                        id: e.id,
                        fecha: e.fecha,
                        nota: e.nota === null ? null : Number(e.nota),
                        nroInstancia: e.nro_instancia,
                        tipoInstancia: e.tipo_instancia 
                    }))
            }));

        const actual = 
            trayectoria.find((c) => c.activa) ??
            [...trayectoria].reverse().find((c) => c.estadoAcademico !== "APROBADO") ??
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
            division: actual?.division ?? null,
            moduloId: actual?.moduloId ?? null,
            moduloActual: actual?.modulo ?? null,
            faltas: actual?.faltas ?? null,
            condicion: actual?.condicion ?? null,
            trayectoria
        };
    });
};

const buscarOFallar = async (id) => {
    if (!Number.isInteger(id)) throw new HttpError(400, "Alumno inválido");
    const fila = await repo.buscarAlumno(id);
    if (!fila) throw new HttpError(404, "Alumno no encontrado");
    return fila;
};

const buscarActivoOFallar = async (id) => {
    const fila = await buscarOFallar(id);
    if (!fila.activo) throw new HttpError(409, "El alumno está dado de baja");
    return fila;
};

export const listar = async ({ incluirInactivos = false } = {}) =>
    armar(await repo.listarAlumnos({ incluirInactivos }));

export const obtener = async (id) => (await armar([await buscarOFallar(id)]))[0];

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

export const matricular = async (id, { idCurso, idModulo }) => {
    await buscarActivoOFallar(id);
    if (!Number.isInteger(idCurso) || !Number.isInteger(idModulo)) {
        throw new HttpError(400, "Curso o módulo inválido");
    }
    if (!(await repo.cursoTieneModulo(idCurso, idModulo))) {
        throw new HttpError(400, "El módulo no pertenece a ese curso");
    }
    if (await repo.buscarCursadaActiva(id)) {
        throw new HttpError(409, "El alumno ya tiene una cursada activa. Editá su matrícula para cambiarla");
    }
    if (await repo.yaAproboModulo(id, idModulo)) {
        throw new HttpError(409, "El alumno ya aprobó ese módulo");
    }
    try {
        return { cursadaModuloId: await repo.crearCursada(id, idCurso, idModulo) };
    } catch (err) {
        throw traducirError(err);
    }
};

/**
 * PUT /alumnos/:id/cursadas
 * Modifica la matrícula del alumno (curso, división y módulo) manteniendo
 * una única cursada activa. Si se cambia de módulo se validan primero las
 * correlatividades configuradas en modulo_correlativo.
 */
export const actualizarCursada = async (id, { idCurso, idModulo }) => {
    await buscarActivoOFallar(id);

    if (!Number.isInteger(idCurso) || !Number.isInteger(idModulo)) {
        throw new HttpError(400, "Curso o módulo inválido");
    }

    if (!(await repo.cursoTieneModulo(idCurso, idModulo))) {
        throw new HttpError(400, "El módulo no pertenece a ese curso");
    }

    const cursadaActual = await repo.buscarCursadaActiva(id);
    const cambiaModulo =
        !cursadaActual || Number(cursadaActual.modulo_id) !== Number(idModulo);

    if (cambiaModulo) {
        if (await repo.yaAproboModulo(id, idModulo)) {
            throw new HttpError(409, "El alumno ya aprobó ese módulo");
        }

        const pendientes = await repo.correlativosPendientes(id, idModulo);

        if (pendientes.length > 0) {
            const nombres = pendientes.map((modulo) => modulo.nombre).join(", ");
            throw new HttpError(
                409,
                `Para cursar ese módulo debe aprobar antes: ${nombres}`
            );
        }
    }

    try {
        await repo.actualizarCursadaActiva(id, { cursoId: idCurso, moduloId: idModulo });
    } catch (err) {
        throw traducirError(err);
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

const esFechaISOValida = (valor) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;

    const [anio, mes, dia] = valor.split("-").map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));

    return (
        fecha.getUTCFullYear() === anio &&
        fecha.getUTCMonth() === mes - 1 &&
        fecha.getUTCDate() === dia
    );
};

/**
 * POST /alumnos/evaluaciones-modulo
 * Registra una instancia de evaluación para la cursada de un módulo.
 *
 * Requisitos:
 * - La cursada debe existir y pertenecer a un alumno activo.
 * - El módulo no puede estar aprobado ni superar las 4 instancias.
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
            "La fecha debe ser válida y tener el formato AAAA-MM-DD"
        );
    }

    if (!Number.isFinite(nota) || nota < 0 || nota > 10) {
        throw new HttpError(400, "La nota debe ser un número entre 0 y 10");
    }

    if (
        !Number.isInteger(nroInstancia) ||
        nroInstancia < 1 ||
        nroInstancia > 4
    ) {
        throw new HttpError(400, "La instancia debe ser un entero entre 1 y 4");
    }

    const tipoInstancia = TIPO_POR_INSTANCIA[nroInstancia];
    if (tipoRecibido && tipoRecibido !== tipoInstancia) {
        throw new HttpError(
            400,
            `La instancia ${nroInstancia} corresponde al tipo ${tipoInstancia}`
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
                "El módulo ya está aprobado y no admite otra instancia"
            );
        case "MATERIAS_PENDIENTES":
            throw new HttpError(
                409,
                `Todas las materias del módulo deben estar aprobadas. Pendientes: ${resultado.pendientes.join(", ")}`
            );
        case "MAXIMO_INSTANCIAS":
            throw new HttpError(
                409,
                "El módulo ya alcanzó el máximo de 4 instancias"
            );
        case "INSTANCIA_INVALIDA":
            throw new HttpError(
                409,
                `La próxima instancia es la ${resultado.instanciaEsperada}. Actualizá la ficha e intentá de nuevo`
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
        aprobado: resultado.aprobado,
    };
};