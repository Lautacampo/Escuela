-- Asignación docente por (curso, materia).
--
-- Reemplaza el modelo anterior, que guardaba por separado docente_curso y
-- docente_materia: como docente_materia era global, un docente asignado a una
-- materia en un módulo/división quedaba habilitado para calificarla en todos
-- sus cursos. La nueva tabla acota cada habilitación a un curso concreto.
--
-- docente_curso y docente_materia quedan como tablas legadas (sin uso por la
-- aplicación). Se conservan sus datos para no perder información.
--
-- Ejecutar una sola vez sobre bases creadas antes de este cambio:
--   psql -U postgres -d escuela_db -f database/migrations/004_docente_curso_materia.sql

BEGIN;

CREATE TABLE IF NOT EXISTS public.docente_curso_materia (
    docente_id integer NOT NULL,
    curso_id integer NOT NULL,
    materia_id integer NOT NULL,
    CONSTRAINT docente_curso_materia_pkey
        PRIMARY KEY (docente_id, curso_id, materia_id),
    CONSTRAINT docente_curso_materia_docente_id_fkey
        FOREIGN KEY (docente_id) REFERENCES public.docente(id) ON DELETE CASCADE,
    CONSTRAINT docente_curso_materia_curso_id_fkey
        FOREIGN KEY (curso_id) REFERENCES public.curso(id) ON DELETE CASCADE,
    CONSTRAINT docente_curso_materia_materia_id_fkey
        FOREIGN KEY (materia_id) REFERENCES public.materia(id) ON DELETE CASCADE
);

ALTER TABLE public.docente_curso_materia OWNER TO postgres;

-- Migra las asignaciones existentes: cada par (docente, curso) hereda las
-- materias que el docente tenía asignadas y que pertenecen a un módulo de ese
-- curso. Es el mismo alcance que antes tenían las lecturas.
INSERT INTO public.docente_curso_materia (docente_id, curso_id, materia_id)
SELECT DISTINCT dc.docente_id, dc.curso_id, dm.materia_id
  FROM public.docente_curso dc
  JOIN public.curso_modulo cm ON cm.curso_id = dc.curso_id
  JOIN public.materia_modulo mm ON mm.modulo_id = cm.modulo_id
  JOIN public.docente_materia dm
    ON dm.docente_id = dc.docente_id AND dm.materia_id = mm.materia_id
 WHERE NOT EXISTS (SELECT 1 FROM public.docente_curso_materia)
ON CONFLICT (docente_id, curso_id, materia_id) DO NOTHING;

COMMIT;
