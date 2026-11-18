/**
 * Migraciones que el backend aplica al iniciar si la base todavía no las tiene,
 * para que se pueda desplegar antes de correrlas en Neon. Son copias de:
 *
 * - SQL_FUNCIONES_INGRESO: sección 1 de
 *   database/migrations/008_sin_equivalencias_modulo_de_ingreso.sql y
 *   database/migrations/010_no_retroceder_ingreso.sql (no borra nada: la tabla
 *   de equivalencias la elimina solo la migración).
 * - SQL_ASIGNACION_POR_MODULO:
 *   database/migrations/009_asignacion_docente_por_modulo.sql
 *
 * Si se cambia una migración, cambiar también su copia acá.
 */
export const SQL_FUNCIONES_INGRESO = `
-- Posición del módulo en la carrera: I = 1, II = 2, ..., VI = 6.
CREATE OR REPLACE FUNCTION public.modulo_orden(p_modulo_id integer)
RETURNS integer
LANGUAGE sql STABLE
SET search_path = public
AS $$
    SELECT anio_curso * 2 + periodo - 2
      FROM modulo
     WHERE id = p_modulo_id;
$$;

-- Posición del módulo de ingreso: el primero (en orden) que el alumno cursó
-- en la escuela. NULL si todavía no tiene cursadas. p_excluir_cursada deja
-- afuera una cursada (la que se está corrigiendo).
CREATE OR REPLACE FUNCTION public.orden_ingreso(
    p_alumno_id integer,
    p_excluir_cursada integer DEFAULT NULL
)
RETURNS integer
LANGUAGE sql STABLE
SET search_path = public
AS $$
    SELECT min(modulo_orden(cm.modulo_id))
      FROM cursada_modulo cm
     WHERE cm.alumno_id = p_alumno_id
       AND (p_excluir_cursada IS NULL OR cm.id <> p_excluir_cursada);
$$;

-- ¿El destino es anterior al módulo de ingreso ya consolidado?
-- p_excluir_cursada deja afuera la cursada que se está corrigiendo (la vacía).
CREATE OR REPLACE FUNCTION public.modulo_anterior_al_ingreso(
    p_alumno_id integer,
    p_modulo_destino integer,
    p_excluir_cursada integer DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql STABLE
SET search_path = public
AS $$
    SELECT COALESCE(
        modulo_orden(p_modulo_destino) < orden_ingreso(p_alumno_id, p_excluir_cursada),
        false);
$$;

-- Solo consolida el ingreso si existe actividad académica en la trayectoria.
CREATE OR REPLACE FUNCTION public.modulo_anterior_al_ingreso_con_datos(
    p_alumno_id integer,
    p_modulo_destino integer,
    p_excluir_cursada integer DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
               SELECT 1
                 FROM cursada_modulo cm
                WHERE cm.alumno_id = p_alumno_id
                  AND (p_excluir_cursada IS NULL OR cm.id <> p_excluir_cursada)
                  AND (
                      EXISTS (SELECT 1 FROM asistencia a
                               WHERE a.cursada_modulo_id = cm.id)
                      OR EXISTS (SELECT 1 FROM calificacion c
                                  WHERE c.cursada_modulo_id = cm.id)
                      OR EXISTS (SELECT 1 FROM evaluacion_modulo e
                                  WHERE e.cursada_modulo_id = cm.id)
                  )
           )
       AND modulo_anterior_al_ingreso(
               p_alumno_id, p_modulo_destino, p_excluir_cursada);
$$;

-- Aprobado en la escuela.
CREATE OR REPLACE FUNCTION public.modulo_aprobado(p_alumno_id integer, p_modulo_id integer)
RETURNS boolean
LANGUAGE sql STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM cursada_modulo cm
         WHERE cm.alumno_id = p_alumno_id
           AND cm.modulo_id = p_modulo_id
           AND cm.estado_academico = 'APROBADO');
$$;

-- Acreditado: aprobado en la escuela o anterior al módulo de ingreso.
-- Se usa para saber si el alumno egresó.
CREATE OR REPLACE FUNCTION public.modulo_acreditado(p_alumno_id integer, p_modulo_id integer)
RETURNS boolean
LANGUAGE sql STABLE
SET search_path = public
AS $$
    SELECT modulo_aprobado(p_alumno_id, p_modulo_id)
        OR COALESCE(modulo_orden(p_modulo_id) < orden_ingreso(p_alumno_id), false);
$$;

-- ¿El correlativo está cumplido para cursar o acreditar p_modulo_destino?
-- Sí, si está aprobado o si es anterior al ingreso. Un alumno sin cursadas
-- (o cuya única cursada se está corrigiendo) ingresa en p_modulo_destino.
CREATE OR REPLACE FUNCTION public.correlativo_cumplido(
    p_alumno_id integer,
    p_correlativo_id integer,
    p_modulo_destino integer,
    p_excluir_cursada integer DEFAULT NULL
)
RETURNS boolean
LANGUAGE sql STABLE
SET search_path = public
AS $$
    SELECT modulo_aprobado(p_alumno_id, p_correlativo_id)
        OR COALESCE(
               modulo_orden(p_correlativo_id)
                 < LEAST(orden_ingreso(p_alumno_id, p_excluir_cursada),
                         modulo_orden(p_modulo_destino)),
               false);
$$;

-- Nombres de los correlativos que faltan (NULL si no falta ninguno).
DROP FUNCTION IF EXISTS public.correlativos_pendientes(integer, integer);
CREATE OR REPLACE FUNCTION public.correlativos_pendientes(
    p_alumno_id integer,
    p_modulo_id integer,
    p_excluir_cursada integer DEFAULT NULL
)
RETURNS text
LANGUAGE sql STABLE
SET search_path = public
AS $$
    SELECT string_agg(m.numero_leyenda, ', ' ORDER BY m.id)
      FROM modulo_correlativo mc
      JOIN modulo m ON m.id = mc.modulo_correlativo_id
     WHERE mc.modulo_id = p_modulo_id
       AND NOT correlativo_cumplido(p_alumno_id, mc.modulo_correlativo_id,
                                    p_modulo_id, p_excluir_cursada);
$$;

-- Última barrera de correlatividades al matricular (alta o cambio de módulo).
CREATE OR REPLACE FUNCTION public.trg_cursada_validar_correlativas()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_pendientes      text;
    v_modulo          text;
    v_modulo_ingreso  text;
    v_excluir_cursada integer;
BEGIN
    IF TG_OP = 'UPDATE'
       AND NEW.modulo_id = OLD.modulo_id
       AND NEW.alumno_id = OLD.alumno_id
       AND NOT (NEW.activa AND NOT OLD.activa) THEN
        RETURN NEW;
    END IF;

    v_excluir_cursada := NEW.id;
    IF TG_OP = 'UPDATE'
       AND NEW.alumno_id = OLD.alumno_id
       AND (
           EXISTS (SELECT 1 FROM asistencia a
                    WHERE a.cursada_modulo_id = OLD.id)
           OR EXISTS (SELECT 1 FROM calificacion c
                       WHERE c.cursada_modulo_id = OLD.id)
           OR EXISTS (SELECT 1 FROM evaluacion_modulo e
                       WHERE e.cursada_modulo_id = OLD.id)
       ) THEN
        v_excluir_cursada := NULL;
    END IF;

    SELECT numero_leyenda INTO v_modulo FROM modulo WHERE id = NEW.modulo_id;

    IF NEW.estado_academico <> 'APROBADO' AND EXISTS (
           SELECT 1 FROM cursada_modulo cm
            WHERE cm.alumno_id = NEW.alumno_id
              AND cm.modulo_id = NEW.modulo_id
              AND cm.estado_academico = 'APROBADO'
              AND cm.id <> NEW.id) THEN
        RAISE EXCEPTION 'El alumno ya tiene aprobado %', v_modulo
              USING ERRCODE = 'P0001';
    END IF;

    -- Con datos cargados el módulo de ingreso ya está consolidado: retroceder
    -- perdería las equivalencias de los módulos anteriores.
    IF modulo_anterior_al_ingreso_con_datos(
           NEW.alumno_id, NEW.modulo_id, v_excluir_cursada) THEN
        SELECT numero_leyenda INTO v_modulo_ingreso
          FROM modulo
         WHERE modulo_orden(id) = orden_ingreso(NEW.alumno_id, v_excluir_cursada);
        RAISE EXCEPTION 'El alumno ya tiene datos en el % (su módulo de ingreso): no se puede volver a un módulo anterior del plan',
              v_modulo_ingreso
              USING ERRCODE = 'P0001';
    END IF;

    v_pendientes := correlativos_pendientes(
        NEW.alumno_id, NEW.modulo_id, v_excluir_cursada);
    IF v_pendientes IS NOT NULL THEN
        RAISE EXCEPTION 'Correlatividad: para cursar % el alumno debe tener aprobados: %',
              v_modulo, v_pendientes
              USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$;
`;

export const SQL_ASIGNACION_POR_MODULO = `
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
`;
