import { HttpError } from "../../utils/httpError.js";
import { parseId } from "../../utils/parseId.js";
import * as repo from "./cursos.repository.js";

const ANIOS_CURSO = [1, 2, 3];

const formatearCurso = (f) => ({
    id: f.id,
    anioCurso: f.anio_curso,
    division: f.division, 
    cicloLectivo: { id: f.ciclo_id, anio: f.ciclo_anio },
    preceptor: {
        id: f.preceptor_id,
        nombre: f.preceptor_nombre,
        apellido: f.preceptor_apellido
    },
    cantidadAlumnos: f.cantidad_alumnos
});

const resolverAlcance = async (usuario) => {
    if (usuario.rol === "directivo") return {};

    const personaId = await repo.buscarPersonaIdDeUsuario(usuario.id);
    if (!personaId) {
        throw new HttpError(403, "El usuario no está vinculado a ninguna persona");
    }
    return usuario.rol === "docente"
        ? { docenteId: personaId }
        : { preceptorId: personaId };
};

const puedeVerCurso = async (alcance, curso) => {
    if (alcance.preceptorId !== undefined) return curso.preceptor_id === alcance.preceptorId;
    if (alcance.docenteId !== undefined) return repo.docenteTieneCurso(alcance.docenteId, curso.id);
    return true;
};

const validarCicloId = (valor) => parseId(valor, "Ciclo lectivo");

const validarDivision = (valor) => {
    const division = String(valor ?? "").trim().toUpperCase();
    if (!/^[A-Z]$/.test(division)) {
        throw new HttpError(400, "La división debe ser una letra (A, B, C...)");
    }
    return division;
};

const validarAnioCurso = (valor) => {
    const anio = Number(valor);
    if (!ANIOS_CURSO.includes(anio)) {
        throw new HttpError(400, `El año de curso debe ser ${ANIOS_CURSO.join(", ")}`);
    }
    return anio;
};

export const listarCiclos = async () => {
    const ciclos = await repo.listarCiclos();
    return ciclos.map((c) => ({ id: c.id, anio: c.anio}));
};

export const crearCiclo = async ({ anio }) => {
    const n = Number(anio);
    if (!Number.isInteger(n) || n < 2000 || n > 2100) {
        throw new HttpError(400, "Año inválido");
    }
    try {
        const ciclo = await repo.crearCiclo(n);
        return { id: ciclo.id, anio: ciclo_anio };
    } catch (err) {
        if (err.code === "23505") throw new HttpError(409, `El ciclo lectivo ${n} ya existe`);
        throw err;
    }
};

export const listar = async (usuario, { cicloLectivoId, anioCurso } = {}) => {
    const alcance = await resolverAlcance(usuario);

    let cicloId;
    if (cicloLectivoId !== undefined) {
        cicloId = validarCicloId(cicloLectivoId);
    } else {
        const vigente = await repo.buscarCicloVigente();
        if (!vigente) return [];
        cicloId = vigente.id;
    }

    const filas = await repo.listarCursos({
        cicloLectivoId: cicloId,
        anioCurso: anioCurso !== undefined ? validarAnioCurso(anioCurso) : undefined,
        ...alcance
    });
    return filas.map(formatearCurso);
};

export const obtener = async(usuario, idParam) => {
    const id = parseId(idParam);

    const curso = await repo.buscarCursoPorId(id);
    if (!curso) throw new HttpError(404, "Curso no encontrado");

    const alcance = await repo.resolverAlcance(usuario);
    if (!(await puedeVerCurso(alcance, curso))) {
        throw new HttpError(403, "No tiene acceso a este curso");
    }

    const modulos = await repo.listarModulosDeCurso(id);
    return {
        ...formatearCurso(curso),
        modulos: modulos.map((m) => ({id: m.id, nombre: m.numero_leyenda}))
    };
};

export const crear = async ({ cicloLectivoId, anioCurso, division, preceptorId }) => {
    const datos = {
        cicloLectivoId: validarCicloId(cicloLectivoId),
        anioCurso: validarAnioCurso(anioCurso),
        division: validarDivision(division),
        preceptorId: parseId(preceptorId, "Preceptor")
    };

    try {
        const { id } = await repo.crearCurso(datos);
        return formatearCurso(await repo.buscarCursoPorId(id));
    } catch (err) {
        throw traducirErrorCurso(err);
    }
};

export const actualizar = async (idParam, { preceptorId }) => {
    const id = parseId(idParam);
    const nuevoPreceptorId = parseId(preceptorId, "Preceptor");

    try {
        const actualizado = await repo.actualizarPreceptor(id, nuevoPreceptorId);
        if (!actualizado) throw new HttpError(404, "Curso no encontrado");
    } catch (err) {
        throw new traducirErrorCurso(err)
    }
    return formatearCurso(await repo.buscarCursoPorId(id));
};

export const agregarModulo = async (idParam, {moduloId}) => {
    const id = parseId(idParam);
    const modId = parseId(moduloId, "Módulo");

    try {
        await repo.agregarModulo(id, modId);   
    } catch (err) {
        if (err.code === "23505") throw new HttpError(409, "El curso ya tiene ese módulo");
        if (err.code === "23503") {
            const msg = err.constraint === "curso_modulo_curso_id_fkey"
                ? "Curso no encontrado"
                : "Módulo no encontrado";
            throw new HttpError(404, msg);
        }
        throw err;
    }
    return { cursoId: id, moduloId: modId };
};

export const quitarModulo = async (idParam, moduloIdParam) => {
    const id = parseId(idParam, "Curso");
    const modId = parseId(moduloIdParam, "Módulo");

    if (await repo.hayCursadas(id, modId)) {
        throw new HttpError(409, "Hay alumnos cursando este módulo en el curso");
    }
    const quitado = await repo.quitarModulo(id, modId);
    if (!quitado) throw new HttpError(404, "El curso no tiene ese módulo");
};

const traducirErrorCurso = (err) => {
    if (err instanceof HttpError) return err;
    if (err.code === "23505") {
        return new HttpError(409, "Ya existe ese curso y división en el ciclo lectivo");
    }
    if (err.code === "23503") {
        if (err.constraint === "curso_ciclo_lectivo_id_fkey") {
            return new HttpError(404, "Ciclo lectivo no encontrado");
        }
        if (err.constraint === "curso_preceptor_id_fkey") {
            return new HttpError(404, "El preceptor no existe");
        }
        return err;
    }
}