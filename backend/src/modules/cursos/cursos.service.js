import * as repo from "./cursos.repository.js";

export const listar = async () => {
    const cursos = await repo.listarCursosVigentes();
    return cursos.map((c) => ({
        id: c.id,
        anioCurso: c.anio_curso,
        division: c.division,
        modulos: c.modulos
    }));
};