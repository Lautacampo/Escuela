-- 006_sincronizar_secuencias.sql
--
-- Los datos iniciales se cargaron con ids explícitos y varias secuencias
-- quedaron atrasadas respecto del id más alto de su tabla. Con la secuencia
-- atrasada, un INSERT nuevo intenta reutilizar un id que ya existe y falla:
--   - crear una materia        -> "Ya existe una materia registrada con ese nombre"
--   - crear un ciclo lectivo   -> error 500
--   - crear un plan de estudio -> error al asociar materias a módulos
--   - alta de personas         -> choque al llegar a los ids ya usados
--
-- Este script adelanta cada secuencia hasta el máximo id de su tabla. Nunca la
-- hace retroceder y no modifica ningún dato. Es idempotente.
--   psql "<cadena de conexión>" -f database/migrations/006_sincronizar_secuencias.sql

DO $$
DECLARE
    r        record;
    v_max    bigint;
    v_actual bigint;
    v_usada  boolean;
BEGIN
    FOR r IN
        SELECT t.relname AS tabla,
               a.attname AS columna,
               pg_get_serial_sequence(format('public.%I', t.relname), a.attname) AS secuencia
          FROM pg_class t
          JOIN pg_namespace n ON n.oid = t.relnamespace
          JOIN pg_attribute a ON a.attrelid = t.oid
         WHERE t.relkind = 'r'
           AND n.nspname = 'public'
           AND a.attnum > 0
           AND NOT a.attisdropped
           AND pg_get_serial_sequence(format('public.%I', t.relname), a.attname) IS NOT NULL
    LOOP
        EXECUTE format('SELECT max(%I) FROM public.%I', r.columna, r.tabla) INTO v_max;
        EXECUTE format('SELECT last_value, is_called FROM %s', r.secuencia)
           INTO v_actual, v_usada;

        IF v_max IS NOT NULL AND (v_actual < v_max OR (v_actual = v_max AND NOT v_usada)) THEN
            PERFORM setval(r.secuencia, v_max, true);
            RAISE NOTICE 'Secuencia de %.%: % -> %', r.tabla, r.columna, v_actual, v_max;
        END IF;
    END LOOP;
END;
$$;
