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
    if (err.code === "23503") return new HttpError(409, "El alumno tiene asistencias o calificaciones y no puede eliminarse");
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

export const listar = async () => armar(await repo.listarAlumnos());

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
    await buscarOFallar(id);
    const datos = validar(body);
    try {
        await repo.actualizarAlumno(id, datos);
    } catch (err) {
        throw traducirError(err);
    }
    return obtener(id);
};

export const eliminar = async (id) => {
    await buscarOFallar(id);
    try {
        await repo.eliminarAlumno(id);
    } catch (err) {
        throw traducirError(err);
    }
};

export const matricular = async (id, { idCurso, idModulo }) => {
    await buscarOFallar(id);
    if (!Number.isInteger(idCurso) || !Number.isInteger(idModulo)) {
        throw new HttpError(400, "Curso o módulo inválido");
    }
    if (!(await repo.cursoTieneModulo(idCurso, idModulo))) {
        throw new HttpError(400, "El módulo no pertenece a ese curso");
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