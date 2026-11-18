-- 010: Usuarios de docentes y preceptores eliminados definitivamente
--
-- Hasta ahora, al eliminar definitivamente a un docente o preceptor su
-- usuario quedaba en la tabla `usuarios`, sin persona y dado de baja. Ese
-- correo no se podía volver a usar en otro rol, y si se daba de alta a otro
-- preceptor con el mismo correo y sin contraseña, la contraseña vieja volvía
-- a servir.
--
-- Desde esta versión la eliminación definitiva borra también el usuario.
-- Esta migración borra los que ya habían quedado: usuarios de docente o de
-- preceptor, sin persona y dados de baja. No toca usuarios activos (por
-- ejemplo, los registrados que todavía no tienen persona) ni al directivo.
--
-- Se puede ejecutar más de una vez. El backend nuevo funciona antes y
-- después de ejecutarla: mientras tanto trata a esos usuarios como si no
-- existieran.

BEGIN;

DO $$
DECLARE
  borrados integer;
BEGIN
  DELETE FROM public.usuarios u
   USING public.roles r
   WHERE r.id = u.rol_id
     AND r.nombre IN ('docente', 'preceptor')
     AND u.persona_id IS NULL
     AND u.activo = false;
  GET DIAGNOSTICS borrados = ROW_COUNT;
  RAISE NOTICE 'Usuarios de docentes o preceptores eliminados que se borraron: %', borrados;
END $$;

COMMIT;
