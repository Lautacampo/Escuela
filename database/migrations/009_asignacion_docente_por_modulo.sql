-- 009_asignacion_docente_por_modulo.sql
--
-- Asignación de docentes por MÓDULO.
--
-- Antes: docente_curso_materia guardaba (docente, curso, materia). Un curso
-- (por ejemplo 1.er año División A) dicta dos módulos (I y II), así que
-- asignar Matemática en Módulo I División A también la asignaba en Módulo II.
--
-- Ahora: se guarda (docente, curso, módulo, materia). El docente queda
-- asignado solo al módulo y la división que elige el directivo.
--
-- Datos existentes: como antes no se sabía qué módulo se había elegido, cada
-- asignación vieja se desdobla en una fila por cada módulo del curso donde se
-- dicta esa materia. Así nadie pierde acceso; el directivo puede quitar el
-- módulo que sobre desde Gestión de Docentes.
--
-- Es idempotente: se puede ejecutar más de una vez.
--   psql "<cadena de conexión>" -f database/migrations/009_asignacion_docente_por_modulo.sql

BEGIN;

ALTER TABLE public.docente_curso_materia ADD COLUMN IF NOT EXISTS modulo_id integer;

-- La clave vieja (docente, curso, materia) no admite el mismo par en dos módulos.
ALTER TABLE public.docente_curso_materia DROP CONSTRAINT IF EXISTS docente_curso_materia_pkey;

-- Asignaciones viejas: una fila por módulo del curso que dicta la materia.
INSERT INTO public.docente_curso_materia (docente_id, curso_id, materia_id, modulo_id)
SELECT DISTINCT dcm.docente_id, dcm.curso_id, dcm.materia_id, cm.modulo_id
  FROM public.docente_curso_materia dcm
  JOIN public.curso_modulo cm ON cm.curso_id = dcm.curso_id
  JOIN public.materia_modulo mm
    ON mm.modulo_id = cm.modulo_id AND mm.materia_id = dcm.materia_id
 WHERE dcm.modulo_id IS NULL;

DELETE FROM public.docente_curso_materia WHERE modulo_id IS NULL;

ALTER TABLE public.docente_curso_materia ALTER COLUMN modulo_id SET NOT NULL;

ALTER TABLE public.docente_curso_materia
    ADD CONSTRAINT docente_curso_materia_pkey
    PRIMARY KEY (docente_id, curso_id, modulo_id, materia_id);

-- El módulo tiene que ser uno de los que dicta ese curso.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint
                    WHERE conname = 'docente_curso_materia_curso_modulo_fkey') THEN
        ALTER TABLE public.docente_curso_materia
            ADD CONSTRAINT docente_curso_materia_curso_modulo_fkey
            FOREIGN KEY (curso_id, modulo_id)
            REFERENCES public.curso_modulo (curso_id, modulo_id) ON DELETE CASCADE;
    END IF;
END;
$$;

COMMIT;
