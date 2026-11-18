# Endpoints de la API — Sistema de Gestión Académica Tomás Baras

Base: `/api` (en local, `http://localhost:4000/api`). Son 53 endpoints.

**Reglas comunes:**
- Todas las rutas, salvo `POST /auth/login`, piden `Authorization: Bearer <token>`.
- Sin token, con token vencido o con el usuario dado de baja: `401`. Con un rol que no corresponde: `403`.
- Una ruta inexistente responde `404`. Un id con formato inválido responde `400`; un recurso inexistente, `404`.
- Una regla de negocio que no se cumple (correlatividades, LIBRE, egresado, duplicados) responde `409`.
- Ningún pedido debe responder `500` (lo verifican las 667 pruebas de `npm run test:extremos`).

## Autenticación (`auth`)

| Método | Ruta | Roles | Qué hace | Parámetros o cuerpo | Respuestas |
| --- | --- | --- | --- | --- | --- |
| POST | `/auth/login` | Pública | Inicia sesión y devuelve el token JWT | `{ email, password }` (texto; el correo no distingue mayúsculas) | `200` token y usuario · `400` faltan datos · `401` credenciales · `403` usuario dado de baja · `429` 10 intentos fallidos en 15 min |
| POST | `/auth/registro` | Directivo | Crea un usuario de acceso | `{ nombre, apellido, email, password, rol }` | `201` · `400` · `409` correo ya usado |
| GET | `/auth/perfil` | Todos | Datos del usuario de la sesión | — | `200` |

## Cursos

| Método | Ruta | Roles | Qué hace | Parámetros o cuerpo | Respuestas |
| --- | --- | --- | --- | --- | --- |
| GET | `/cursos` | Directivo, preceptor | Cursos del ciclo vigente con sus módulos y los correlativos de cada módulo | — | `200` |

## Alumnos

| Método | Ruta | Roles | Qué hace | Parámetros o cuerpo | Respuestas |
| --- | --- | --- | --- | --- | --- |
| GET | `/alumnos` | Directivo | Padrón de alumnos activos (sin egresados) | `?incluirInactivos=true` suma los dados de baja · `?egresados=true` solo egresados | `200` |
| GET | `/alumnos/:id` | Directivo | Ficha: datos, trayectoria, materias por cursada, correlativos pendientes, si puede rendir, módulo de ingreso, módulos aprobados por equivalencia (los anteriores al ingreso), módulos acreditados, egresado y plan | — | `200` · `400` · `404` |
| POST | `/alumnos` | Directivo | Alta de alumno (persona + alumno) | Datos personales: `nombre`, `apellido`, `dni`, `cuil`, `fechaNacimiento`, `lugarNacimiento`, `domicilio`, `telefono`, `email`, `trabaja`, `telefonoEmergencia`, `cantidadHijos` | `201` · `400` validación · `409` DNI o CUIL repetido, o correo de otro alumno |
| PUT | `/alumnos/:id` | Directivo | Modifica los datos personales | Mismos campos; las reglas de formato se aplican solo a lo que cambia | `200` · `400` · `404` · `409` egresado, duplicado o correo de otro alumno |
| DELETE | `/alumnos/:id` | Directivo | Baja lógica (conserva matrícula e historial) | — | `204` · `404` · `409` egresado |
| PATCH | `/alumnos/:id/reactivar` | Directivo | Vuelve a dar de alta a un alumno dado de baja (si ya está activo, no cambia nada) | — | `200` · `404` |
| POST | `/alumnos/:id/cursadas` | Directivo | Primera matrícula. Puede ser en cualquier módulo: es su módulo de ingreso | `{ idCurso, idModulo }` | `201` `{ cursadaModuloId, tipo }` · `400` · `404` · `409` ya tiene cursada, dado de baja o egresado |
| PUT | `/alumnos/:id/cursadas` | Directivo | Cambia la matrícula: curso, división o módulo; también recursa | `{ idCurso, idModulo }` | `200` ficha + `matricula` (`NUEVA`, `RECURSADA`, `REACTIVADA`, `CORREGIDA`, `CAMBIO_DE_CURSO`, `SIN_CAMBIOS`) · `409` correlatividad (`codigo: CORRELATIVAS_PENDIENTES` + `pendientes`) o módulo ya aprobado |
| POST | `/alumnos/evaluaciones-modulo` | Directivo | Registra una instancia de evaluación del módulo (nota 7 o más lo aprueba) | `{ idCursadaModulo, fecha, nota, nroInstancia }` | `201` · `400` fecha futura o nota inválida · `409` libre, correlativas, materias sin aprobar, instancia salteada o módulo aprobado |

## Asistencias

El preceptor solo ve y carga los cursos que tiene asignados.

| Método | Ruta | Roles | Qué hace | Parámetros o cuerpo | Respuestas |
| --- | --- | --- | --- | --- | --- |
| GET | `/asistencias/modulos` | Directivo, preceptor | Módulos y divisiones por año para las tarjetas | — | `200` |
| GET | `/asistencias/modulos/:moduloId/divisiones` | Directivo, preceptor | Divisiones de un módulo | — | `200` · `400` |
| GET | `/asistencias/modulos/:moduloId/divisiones/:division` | Directivo, preceptor | Planilla del día: alumnos, faltas acumuladas y situación, más `modulo`, `periodo` y `cicloLectivo` | `?fecha=AAAA-MM-DD` | `200` · `400` · `403` curso ajeno |
| GET | `/asistencias` | Directivo, preceptor | Registros de asistencia | `?cursadaModuloId`, `?fecha` | `200` · `400` |
| POST | `/asistencias` | Directivo, preceptor | Carga la asistencia del día (si ya había una ese día, la reemplaza) y recalcula la situación | `{ cursadaModuloId, fecha, valorFalta }` (`0`, `0.5` o `1`) | `201` · `400` fecha futura, de otro año, fuera del período del módulo (I, III, V: marzo a julio; II, IV, VI: agosto a diciembre), sábado o domingo, o valor inválido · `403` · `409` módulo aprobado o alumno dado de baja |
| PUT | `/asistencias/:id` | Directivo, preceptor | Corrige una asistencia (si cambia la fecha, se revisa que sea día de clase) | `{ valorFalta, fecha }` | `200` · `400` · `404` · `409` |
| DELETE | `/asistencias/:id` | Directivo, preceptor | Borra una asistencia | — | `204` · `404` · `409` |

## Calificaciones

El docente solo ve y califica sus materias en sus cursos.

| Método | Ruta | Roles | Qué hace | Parámetros o cuerpo | Respuestas |
| --- | --- | --- | --- | --- | --- |
| GET | `/calificaciones/ciclos` | Directivo, docente | Ciclos lectivos y el vigente | — | `200` |
| GET | `/calificaciones/resumen` | Directivo, docente | Progreso por módulo y materia (alumnos, calificados, pendientes) | `?anio` | `200` · `400` |
| GET | `/calificaciones/modulos` | Directivo, docente | Módulos con alumnos para calificar | `?anio` | `200` |
| GET | `/calificaciones/modulos/:moduloId/divisiones` | Directivo, docente | Divisiones de un módulo | `?anio` | `200` · `400` |
| GET | `/calificaciones/modulos/:moduloId/divisiones/:division` | Directivo, docente | Grilla de materias por alumno | `?anio` | `200` · `400` · `403` |
| PUT | `/calificaciones` | Directivo, docente | Guarda el estado de una materia y devuelve la situación recalculada | `{ cursadaModuloId, materiaId, estado, anio }` (`Aprobado`, `Desaprobado`, `En Curso`) | `200` · `400` · `403` · `409` módulo aprobado o cursada cerrada |

## Docentes

| Método | Ruta | Roles | Qué hace | Parámetros o cuerpo | Respuestas |
| --- | --- | --- | --- | --- | --- |
| GET | `/docentes/modulos` | Directivo | Módulos con materias y divisiones para asignar | — | `200` |
| GET | `/docentes` | Directivo | Listado con asignaciones | `?estado=activos\|inactivos\|todos`, `?dni`, `?moduloId`, `?division`, `?materia` | `200` |
| GET | `/docentes/:id` | Directivo | Un docente | — | `200` · `400` · `404` |
| POST | `/docentes` | Directivo | Alta de docente con su usuario y asignaciones (una transacción). Cada asignación es de un módulo puntual | Datos personales, `especialidad`, `antiguedad` (0 a 35), `email`, `password`, `asignaciones: [{ moduloId, division, materia }]` | `201` · `400` · `409` DNI o correo repetido |
| PUT | `/docentes/:id` | Directivo | Modifica datos y asignaciones | Igual que el alta (sin `password`) | `200` · `400` · `404` · `409` si está inactivo o hay un duplicado |
| PATCH | `/docentes/:id/inactivar` | Directivo | Baja lógica: no inicia sesión y se corta su sesión | — | `200` · `404` |
| PATCH | `/docentes/:id/reactivar` | Directivo | Vuelve a activarlo | — | `200` · `404` |
| DELETE | `/docentes/:id` | Directivo | Eliminación definitiva, solo si está inactivo | — | `204` · `404` · `409` si está activo |

## Preceptores

| Método | Ruta | Roles | Qué hace | Parámetros o cuerpo | Respuestas |
| --- | --- | --- | --- | --- | --- |
| GET | `/preceptores` | Directivo | Listado con cursos a cargo | `?estado=activos\|inactivos\|todos` | `200` |
| GET | `/preceptores/cursos` | Directivo | Cursos con su preceptor (y si está activo) | — | `200` |
| GET | `/preceptores/:id` | Directivo | Un preceptor | — | `200` · `400` · `404` |
| POST | `/preceptores` | Directivo | Alta de preceptor con su usuario | Datos personales, `titulo`, `antiguedad` (0 a 35), `email`, `password` | `201` · `400` · `409` |
| PUT | `/preceptores/:id` | Directivo | Modifica datos | Igual que el alta (sin `password`) | `200` · `400` · `404` · `409` |
| PUT | `/preceptores/:id/cursos` | Directivo | Asigna los cursos a cargo | `{ cursoIds: [...] }` | `200` · `400` · `404` |
| PATCH | `/preceptores/:id/inactivar` | Directivo | Baja lógica (conserva sus cursos) | — | `200` · `404` |
| PATCH | `/preceptores/:id/reactivar` | Directivo | Vuelve a activarlo | — | `200` · `404` |
| DELETE | `/preceptores/:id` | Directivo | Eliminación definitiva, solo si está inactivo; sus cursos quedan sin preceptor | — | `204` · `404` · `409` si está activo |

## Plan de estudios, materias y ciclo lectivo

| Método | Ruta | Roles | Qué hace | Parámetros o cuerpo | Respuestas |
| --- | --- | --- | --- | --- | --- |
| GET | `/plan-estudio/actual` | Directivo | Plan vigente con sus materias por módulo y los planes inactivos | — | `200` |
| POST | `/plan-estudio` | Directivo | Crea un plan (lo usa el soporte técnico; la pantalla deriva a soporte) | `{ titulo, resolucion, orientacion, anioInicio, modulos }` | `201` · `400` |
| DELETE | `/plan-estudio/:id` | Directivo | Baja lógica del plan | — | `200` · `400` · `404` |
| PATCH | `/plan-estudio/:id/reactivar` | Directivo | Vuelve vigente un plan inactivo (el vigente pasa a inactivo) | — | `200` · `404` |
| GET | `/materias` | Directivo | Materias | — | `200` |
| POST | `/materias` | Directivo | Crea una materia | `{ nombre, modulosIds }` | `201` · `400` · `409` repetida |
| GET | `/ciclo-lectivo` | Directivo | Ciclos lectivos y el activo | — | `200` |
| POST | `/ciclo-lectivo` | Directivo | Crea el ciclo de un año (si ya existe, devuelve el existente) | `{ anio }` | `201` · `400` |

## Reportes

| Método | Ruta | Roles | Qué hace | Parámetros o cuerpo | Respuestas |
| --- | --- | --- | --- | --- | --- |
| GET | `/reportes/inasistencias` | Directivo | Por defecto, alumnos LIBRES por inasistencias (más de 25 faltas). Con `situacion=riesgo`, alumnos todavía regulares con 20 faltas o más (la tarjeta "Alumnos en riesgo" del panel) | `?anio`, `?curso`, `?division`, `?moduloId`, `?minFaltas`, `?situacion=libres\|riesgo` | `200` `{ umbralFaltas, umbralRiesgo, situacion, totalAlertas, alertas }` · `400` |
| GET | `/reportes/desaprobaciones` | Directivo | Evaluados, desaprobados y porcentaje por materia, curso y división | `?anio`, `?curso`, `?division` | `200` · `400` |
