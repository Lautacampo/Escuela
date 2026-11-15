-- Baja lógica de alumnos.
-- Agrega el estado activo/inactivo al alumno para poder darlo de baja sin
-- borrar su historial académico (asistencias, calificaciones, evaluaciones).
--
-- Ejecutar una sola vez sobre bases creadas antes de este cambio:
--   psql -U postgres -d escuela_db -f database/migrations/003_alumno_baja_logica.sql

ALTER TABLE public.alumno
    ADD COLUMN IF NOT EXISTS activo boolean DEFAULT true NOT NULL;

-- Facilita el filtrado de padrón activo (GET /api/alumnos).
CREATE INDEX IF NOT EXISTS alumno_activo_idx
    ON public.alumno (activo)
    WHERE activo = false;
