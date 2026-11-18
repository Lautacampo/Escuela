# Uso de inteligencia artificial

Usé Claude, el asistente de inteligencia artificial de Anthropic, como ayuda en cinco partes del proyecto. Las reglas del sistema (correlatividades, asistencia, alumnos en riesgo, qué hacer con las equivalencias) las definió el equipo. Claude ayudó a implementarlas, probarlas y documentarlas.

| Para qué | Cómo ayudó | Dónde quedó |
| --- | --- | --- |
| Pruebas de la API | Armar y correr pruebas automáticas contra la API real: permisos por rol, datos inválidos y casos límite. Así aparecieron errores, como el de la eliminación definitiva. | `backend/tests/`: `npm run test:reglas` (46), `npm run test:api` (37) y `npm run test:extremos` (667 casos) |
| Neon y los datos | Las migraciones para llevar la base de Neon al modelo nuevo sin perder datos, el orden de despliegue y la sincronización de secuencias. El backend completa solo lo que le falta a la base al iniciar. | `database/migrations/005` a `010` y `backend/src/config/migracionesAlIniciar.js` |
| Sesiones | Revisar en cada pedido que el usuario siga activo: al inactivar a un docente o preceptor, su sesión abierta se corta y no puede volver a entrar. También el límite de intentos de login y el borrado del usuario al eliminar. | `backend/src/middlewares/verificarToken.js` y `backend/src/modules/auth/` |
| Correlatividades | Las reglas de la Resolución N.º 195 en la base (funciones y trigger), el módulo de ingreso y la misma regla en el formulario de matrícula, con pruebas. | Migraciones `005` y `008`, y `frontend/src/features/alumnos/utils/correlatividades.js` |
| Equivalencias | Primero se registraban módulo por módulo. Después, para simplificar, se reemplazaron por el módulo de ingreso: los módulos anteriores se muestran como "Aprobado por equivalencia". | Migración `008` y `frontend/src/features/alumnos/components/FichaAlumno.jsx` |
