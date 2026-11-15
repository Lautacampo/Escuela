-- 002_cursada_modulo_activa.sql
--
-- Agrega el estado "activa" a cursada_modulo para que cada alumno tenga una
-- única cursada vigente. Las cursadas anteriores quedan como historial.
--
-- Ejecutar con psql (o el cliente habitual) sobre la base del proyecto:
--   psql -U postgres -d escuela_db -f database/migrations/002_cursada_modulo_activa.sql

BEGIN;

ALTER TABLE public.cursada_modulo
    ADD COLUMN IF NOT EXISTS activa boolean DEFAULT true NOT NULL;

-- Si ya hubiera más de una cursada por alumno, se conserva como activa la
-- última cursada no aprobada (o, en su defecto, la más reciente).
UPDATE public.cursada_modulo cm
   SET activa = false
 WHERE cm.activa
   AND cm.id <> (
        SELECT cm2.id
          FROM public.cursada_modulo cm2
         WHERE cm2.alumno_id = cm.alumno_id
         ORDER BY (cm2.estado_academico = 'APROBADO'), cm2.id DESC
         LIMIT 1
   );

CREATE UNIQUE INDEX IF NOT EXISTS cursada_modulo_activa_uk
    ON public.cursada_modulo USING btree (alumno_id)
    WHERE activa;

COMMIT;
