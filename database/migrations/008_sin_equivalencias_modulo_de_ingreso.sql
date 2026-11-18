-- 008_sin_equivalencias_modulo_de_ingreso.sql
--
-- Se quitan las equivalencias del sistema.
--
-- Antes: para entrar directamente en un módulo avanzado había que registrar
-- por equivalencia los módulos anteriores (tabla equivalencia_modulo).
--
-- Ahora: al registrar al alumno se lo puede matricular en cualquier módulo.
-- Ese primer módulo es su MÓDULO DE INGRESO. Los módulos anteriores al de
-- ingreso no se le exigen. Desde el ingreso en adelante, las correlatividades
-- se aplican igual que antes:
--   - Módulo III o IV: Módulo I y Módulo II aprobados.
--   - Módulo V o VI:   Módulo III y Módulo IV aprobados.
--
-- Ejemplos:
--   - Alumno nuevo: se matricula en I, III, V o en cualquier otro.
--   - Ingresó en III: para cursar V necesita III y IV aprobados (I y II no).
--   - Ingresó en I y aprobó I: no puede pasar a III sin aprobar II.
--   - Egresa al aprobar todos los módulos desde el de ingreso hasta el VI.
--
-- Es idempotente: se puede ejecutar más de una vez.
--   psql "<cadena de conexión>" -f database/migrations/008_sin_equivalencias_modulo_de_ingreso.sql

BEGIN;

-- 1. Funciones -------------------------------------------------------------

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
    v_pendientes text;
    v_modulo     text;
BEGIN
    IF TG_OP = 'UPDATE'
       AND NEW.modulo_id = OLD.modulo_id
       AND NEW.alumno_id = OLD.alumno_id THEN
        RETURN NEW;
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

    v_pendientes := correlativos_pendientes(NEW.alumno_id, NEW.modulo_id, NEW.id);
    IF v_pendientes IS NOT NULL THEN
        RAISE EXCEPTION 'Correlatividad: para cursar % el alumno debe tener aprobados: %',
              v_modulo, v_pendientes
              USING ERRCODE = 'P0001';
    END IF;

    RETURN NEW;
END;
$$;

-- 2. Aviso: alumnos que tenían una equivalencia de un módulo posterior a su
--    ingreso. Con la regla nueva ese módulo se les exige (deben cursarlo).
DO $$
DECLARE
    v_casos integer := 0;
BEGIN
    IF to_regclass('public.equivalencia_modulo') IS NOT NULL THEN
        EXECUTE $q$
            SELECT count(DISTINCT e.alumno_id)
              FROM public.equivalencia_modulo e
             WHERE NOT public.modulo_acreditado(e.alumno_id, e.modulo_id)
        $q$ INTO v_casos;
    END IF;
    RAISE NOTICE 'Alumnos con una equivalencia que ya no cuenta: %', v_casos;
END;
$$;

-- 3. Se elimina la tabla de equivalencias ----------------------------------
DROP TABLE IF EXISTS public.equivalencia_modulo;

COMMIT;
