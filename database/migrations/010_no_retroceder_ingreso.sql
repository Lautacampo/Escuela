-- 010_no_retroceder_ingreso.sql
--
-- Un alumno con datos en su cursada (asistencias, calificaciones o
-- evaluaciones) no puede volver a un módulo anterior al de su ingreso.
--
-- Antes: se podía matricular en cualquier módulo anterior al ingreso. Eso
-- bajaba el módulo de ingreso (es el primero, en orden, que el alumno cursó) y
-- hacía desaparecer las equivalencias de los módulos previos. Además podía ser
-- irreversible: si el alumno pasaba de IV a I, para volver a IV se le exigían
-- I y II aprobados, que ya no tenía.
--
-- Ahora: el módulo de ingreso queda consolidado en cuanto la cursada tiene
-- datos. Retroceder antes de él se rechaza. La excepción sigue siendo la
-- matrícula recién cargada, sin asistencias, notas ni evaluaciones: esa cursada
-- se puede corregir a cualquier módulo porque no cuenta como ingreso.
--
-- Es idempotente: se puede ejecutar más de una vez.
--   psql "<cadena de conexión>" -f database/migrations/010_no_retroceder_ingreso.sql

BEGIN;

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

-- Última barrera de correlatividades al matricular (alta o cambio de módulo).
CREATE OR REPLACE FUNCTION public.trg_cursada_validar_correlativas()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
    v_pendientes     text;
    v_modulo         text;
    v_modulo_ingreso text;
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

COMMIT;
