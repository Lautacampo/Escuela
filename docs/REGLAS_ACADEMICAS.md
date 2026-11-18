# Reglas académicas y de gestión: correlatividades, módulo de ingreso, condición LIBRE y bajas

Resumen de cómo el sistema aplica la Resolución N.º 195-ME-2024 (migraciones 005 a 010). La tabla completa de endpoints está en `docs/ENDPOINTS.md`.

## 1. Estructura

| Año | Marzo a julio (período 1) | Agosto a diciembre (período 2) |
| --- | --- | --- |
| 1.º | Módulo I | Módulo II |
| 2.º | Módulo III | Módulo IV |
| 3.º | Módulo V | Módulo VI |

## 2. Correlatividades

Se validan **al matricular** y **al acreditar** (evaluación de módulo), **desde el módulo de ingreso en adelante** (sección 5).

| Para cursar / acreditar | Debe tener aprobados |
| --- | --- |
| Módulo III o IV (2.º año) | Módulo I y Módulo II |
| Módulo V o VI (3.º año) | Módulo III y Módulo IV |

- Dentro del mismo año no hay correlatividad: se puede cursar el II con el I desaprobado (o el IV con el III desaprobado), pero no se pasa de año hasta aprobar los dos.
- El formulario de matrícula aplica la misma regla que el backend: con el I en curso, pendiente o libre se puede inscribir en el II (y con el III, en el IV). Solo bloquea un correlativo de un año anterior que el alumno no aprobó y que no es anterior a su módulo de ingreso. La lógica está en `frontend/src/features/alumnos/utils/correlatividades.js` y tiene pruebas (`npm test` en `frontend/`).
- Los módulos anteriores al módulo de ingreso no se exigen.
- La tabla vive en `modulo_correlativo`. No está escrita en el código.

## 3. Condición LIBRE

Un alumno queda `LIBRE` en un módulo (estado académico `A_RECURSAR`) en tres escenarios:

| `motivo_libre` | Cuándo |
| --- | --- |
| `INASISTENCIAS` | Supera las 25 faltas (25 exactas sigue regular; 25,5 ya es libre). |
| `MATERIA_DESAPROBADA` | Tiene una materia del módulo desaprobada. |
| `INSTANCIAS_AGOTADAS` | Rindió las 4 instancias sin llegar a 7. |

Estando libre no puede rendir la evaluación del módulo y debe recursarlo.

La situación la calcula **la base de datos** (función `recalcular_situacion_cursada` y triggers sobre `asistencia`, `calificacion` y `evaluacion_modulo`). Por eso se actualiza siempre, sin importar desde dónde se haga el cambio. Si se corrige una falta o una nota mal cargada, el alumno vuelve a `REGULAR`.

Estados de `cursada_modulo.estado_academico`:

| Estado | Significado |
| --- | --- |
| `EN_CURSO` | Cursando, sin evaluaciones de módulo. |
| `PENDIENTE` | Rindió y no aprobó; le quedan instancias. |
| `APROBADO` | Nota de módulo de 7 o más. Es definitivo. |
| `A_RECURSAR` | Quedó libre. |

### Faltas con media falta

Una media falta suma 0,5. El límite se compara con la suma exacta: 25 sigue regular y 25,5 queda libre. La columna `cursada_modulo.cantidad_faltas_acumuladas` es entera y guarda la suma redondeada hacia arriba (sirve para la regla porque "más de 25" da igual). Las pantallas y los reportes muestran la suma exacta de `asistencia.valor_falta` (por ejemplo, 25,5).

### Carga de asistencia

| Caso | Respuesta |
| --- | --- |
| Fecha futura | `400` "No se puede cargar asistencia de una fecha futura". El calendario de la planilla no deja elegir días posteriores a hoy. |
| Sábado o domingo | `400` "No se carga asistencia los sábados ni los domingos". |
| Fuera del período del módulo | `400`. Módulos I, III y V: solo de marzo a julio. Módulos II, IV y VI: solo de agosto a diciembre. |
| Fecha de otro año que el del ciclo lectivo de la cursada | `400`. |
| Módulo ya aprobado | `409`: su asistencia no se modifica (tampoco se edita ni se borra). |
| Alumno dado de baja | `409`. |
| `valorFalta` | `0`, `0.5` o `1`, como número o como texto (`"0.5"`). Vacío, `null` o `true`/`false` dan `400`. |

La planilla limita el calendario a los meses del módulo y hasta hoy. Si hoy no es día de clase del módulo (por ejemplo, el Módulo I en noviembre), abre en el último día de clase (el viernes 31 de julio). Un sábado o domingo se puede ver, pero las casillas quedan bloqueadas con un aviso. Al corregir solo el valor de una asistencia ya cargada no se revisa el día. La regla del frontend está en `frontend/src/features/asistencia/utils/diasDeClase.js` (con pruebas).

## 4. Recursar

Se recursa **el módulo** no aprobado, no el año completo: el otro módulo del año, si está aprobado, se conserva.

Se hace desde **Editar alumno → Editar matrícula**, eligiendo el mismo módulo. El sistema crea una cursada nueva y la anterior queda cerrada en la trayectoria. Una cursada cerrada ya no admite cambios de notas ni de asistencias.

**El contador de faltas vuelve a cero.** Un alumno que quedó libre por 26 faltas y se rematricula en el módulo arranca la cursada nueva con 0 faltas y sin materias calificadas; las 26 faltas quedan en la cursada anterior, que se sigue viendo en la trayectoria.

## 5. Módulo de ingreso (sin equivalencias, migración 008)

Las equivalencias se quitaron del sistema. Al registrar al alumno se lo puede matricular en **cualquier módulo**: ese primer módulo es su **módulo de ingreso**.

- Los módulos anteriores al de ingreso no se le exigen y cuentan como acreditados.
- Desde el ingreso en adelante, las correlatividades de la sección 2 se aplican igual.
- Una matrícula recién cargada, sin asistencias, notas ni evaluaciones, se puede corregir a cualquier módulo: no cuenta como ingreso.
- Un alumno puede volver a un módulo anterior a su ingreso (por ejemplo, para corregir un error); ese pasa a ser el nuevo ingreso.
- En la ficha, los módulos anteriores al ingreso figuran en la trayectoria académica como **"Aprobado por equivalencia"**, y el resumen dice, por ejemplo, "Módulos acreditados 4 de 6 (4 por equivalencia)". Es solo informativo: no hay que registrar nada. La API los devuelve en `modulosPorEquivalencia`.

| Caso | Resultado |
| --- | --- |
| Alumno nuevo en I, III, V o cualquier otro | Se matricula |
| Ingresó en III y quiere pasar a V | Necesita III y IV aprobados (I y II no) |
| Ingresó en IV y quiere pasar a V | Necesita IV aprobado (III es anterior a su ingreso) |
| Ingresó en I, aprobó I y nunca cursó II | No pasa a III: le falta II (sin cursar) |
| Ingresó en V y aprobó V y VI | Egresa |

La regla vive en la base (funciones `modulo_orden`, `orden_ingreso`, `modulo_aprobado`, `modulo_acreditado`, `correlativo_cumplido` y `correlativos_pendientes`, y el trigger de matrícula). El backend crea esas funciones al iniciar si la base todavía no tiene la migración 008.

## 6. Módulos aprobados y egresados

- **Módulo aprobado:** el alumno deja de figurar en la planilla de asistencia y en la grilla de calificaciones de ese módulo. Vuelve a aparecer en el módulo en el que se lo matricule después, con faltas y materias en cero. Su cursada aprobada queda en la trayectoria.
- **Egresado:** alumno con los 6 módulos acreditados (aprobados o anteriores a su ingreso) y al menos uno aprobado en la institución. Es decir, aprobó todos desde el de ingreso hasta el VI. No se guarda en la base: se calcula a partir de la trayectoria.
- El egresado sale del padrón de alumnos y se consulta desde **Gestión de Alumnos → Alumnos egresados**.
- Su legajo es de solo lectura: no se modifica, no se da de baja, no se matricula ni se califica (el backend responde 409).

## 7. Plan de estudios y reportes

- **Plan de estudios de cada alumno:** queda fijado en su primera matrícula con el plan vigente de ese momento y no cambia aunque después se reemplace el plan. Se ve en el listado de alumnos, en la ficha, en el listado de egresados y en los reportes. Un alumno sin matrícula figura como "Sin asignar".
- Se guarda en la columna `alumno.plan_estudio_id` (migración 007, junto con las tablas del plan). Si la base no tiene la migración, el backend crea lo mismo al iniciar y asigna el plan vigente a los alumnos que ya tenían matrícula.
- **Crear plan nuevo:** el botón muestra un aviso para comunicarse con el soporte técnico (`soporte3tomasbaras@gmail.com`). El plan nuevo lo carga el soporte; el endpoint `POST /api/plan-estudio` se conserva para eso. La baja y la reactivación de planes no cambian.
- **Alertas de inasistencias (Reportes):** solo figuran los alumnos que están LIBRES por inasistencias, es decir, que superaron las 25 faltas en un módulo que no tienen aprobado. Un alumno regular con 25 faltas o menos, o con el módulo aprobado, no aparece. Si se corrige la asistencia y vuelve a 25 o menos, sale del reporte.
- **Alumnos en riesgo (tarjeta del panel de inicio):** alumnos todavía regulares, con el módulo en curso o pendiente, que tienen **20 faltas o más**: se acercan a quedar libres. Un alumno con 26 faltas ya es libre y no cuenta como riesgo. Lo da `GET /api/reportes/inasistencias?situacion=riesgo`. La lista del panel debajo de las tarjetas se llama "Libres por inasistencias".

## 8. Asignación de docentes (migración 009)

Un docente se asigna a una **materia, en un módulo y una división**, y solo a eso. Asignar Matemática en Módulo I División A no lo asigna en Módulo II A, aunque los dos módulos sean del mismo curso: para eso el directivo agrega la otra asignación.

- Se guarda en `docente_curso_materia (docente_id, curso_id, modulo_id, materia_id)`.
- El docente ve y califica solo los módulos, divisiones y materias asignados (`403` en los demás).
- Las asignaciones cargadas antes de la 009 no sabían el módulo: la migración las pasó a los dos módulos del curso, para que nadie pierda acceso. El directivo puede quitar el que sobre.

## 9. Bajas: alumnos, docentes y preceptores

Ninguna baja borra datos de una. Lo hace siempre el directivo.

| Quién | Dar de baja | Mientras está dado de baja | Volver | Eliminar definitivamente |
| --- | --- | --- | --- | --- |
| Alumno | **Dar de Baja** en el padrón. | No figura en el padrón ni en las planillas. Conserva matrícula e historial. | **Gestión de Alumnos → Dados de baja → Reactivar**. | No existe: el historial académico se conserva siempre. |
| Docente | **Dar de baja** (licencia, pedido particular). Queda **Inactivo**. | No inicia sesión y su sesión abierta se corta. Conserva datos y asignaciones. No se edita. | Filtro **Estado: Inactivos → Reactivar**. | Solo estando inactivo: **Eliminar**. Borra sus datos, asignaciones y usuario: su correo y su contraseña ya no inician sesión. |
| Preceptor | **Dar de baja**. Queda **Inactivo**. | No inicia sesión y su sesión abierta se corta. Conserva datos y cursos (se le pueden reasignar los cursos a otro preceptor). No se edita. | Filtro **Estado: Inactivos → Reactivar**. | Solo estando inactivo: **Eliminar**. Borra sus datos y usuario (su correo y su contraseña ya no inician sesión); sus cursos quedan sin preceptor. |

El estado se guarda en `docente.activo` y `preceptor.activo` (migración 007). Al dar de baja o reactivar, el usuario de acceso acompaña el estado. Quien intenta entrar estando dado de baja ve "Tu usuario está dado de baja. Consultá con la dirección de la escuela".

**Eliminación definitiva (migración 010):** el usuario de acceso se borra junto con la persona. Con su correo y su contraseña el login responde `401` "Credenciales inválidas", igual que con un correo que no existe; su sesión abierta se corta; y el correo queda libre para cualquier alta nueva, de cualquier rol. Antes el usuario quedaba guardado sin persona y dado de baja: el backend trata a esos usuarios como inexistentes (no inician sesión y no se reutilizan, así su contraseña vieja no vuelve a servir) y la migración 010 los borra de la base.

## 10. Actualización automática de las pantallas

Las pantallas vuelven a pedir los datos cada 15 segundos y al volver a la pestaña: ficha del alumno, padrón de alumnos (también egresados y dados de baja), planilla de asistencia, grilla de calificaciones y reportes. El panel de inicio lo hace cada 30 segundos.

Así, si el docente desaprueba una materia o el preceptor carga la falta 26, el directivo ve al alumno LIBRE sin recargar la página. La actualización se pausa mientras hay un formulario abierto o un guardado en curso, y solo consulta con la pestaña visible.

## 11. Seguridad y edición de datos cargados antes

- **Sesión:** en cada pedido el backend verifica que el usuario siga activo. Un docente o preceptor dado de baja o eliminado pierde el acceso en el próximo pedido, sin esperar a que venza el token.
- **Inicio de sesión:** el correo no distingue mayúsculas ni espacios. Después de 10 intentos fallidos con el mismo correo desde la misma IP se bloquea 15 minutos (`429`).
- **Rutas inexistentes:** cualquier `/api/...` que no exista responde `404`, con o sin token.
- **Datos cargados antes de las validaciones nuevas** (CUIL que no coincide con el DNI, menor de 18, teléfono corto): se pueden seguir editando. Las reglas de formato se aplican solo a los datos que cambian, en el formulario y en el backend.
- **Nombre y apellido** (alumnos, docentes y preceptores): solo letras, espacios, apóstrofos y guiones, de 2 a 100 caracteres ("José María", "O'Brien", "Pérez-Gómez"). Con números o símbolos (`Juan2`, `<b>`) el formulario muestra "Solo letras, espacios, apóstrofos o guiones (mínimo 2)" y el backend responde `400`. Como las demás reglas de formato, se aplica solo si el campo cambia.
- **Correo de los alumnos:** dos alumnos no pueden tener el mismo correo (sin distinguir mayúsculas ni espacios): `409` "Ya hay otro alumno con ese correo electrónico", que el formulario muestra debajo del campo. Se controla al dar de alta y al cambiar el correo; los repetidos cargados antes se pueden seguir editando sin tocar el correo.
- **Antigüedad** de docentes y preceptores: de 0 a 35 años (`400` si no). Un dato viejo mayor que no se cambia se respeta.
- **Correo de los usuarios:** no se repite aunque cambien mayúsculas. Registrar un usuario o cambiarle el correo a un docente o preceptor con un correo que ya usa otro usuario responde `409` "Ese correo ya pertenece a otro usuario del sistema".
- **Evaluación de módulo:** la fecha no puede ser futura (`400`).
- **Calificaciones:** el estado se acepta sin distinguir mayúsculas (`aprobado`, `APROBADO`); cualquier otro valor da `400`. `cursadaModuloId` y `materiaId` deben ser enteros.
- **Números fuera de rango o con formato inválido** (por ejemplo, un id gigante o `"abc"` donde va un número): `400`, nunca `500`.
- `JWT_SECRET` es obligatorio: sin esa variable el backend no arranca.

## 12. Endpoints

| Método | Ruta | Cambio |
| --- | --- | --- |
| POST | `/api/alumnos/:id/cursadas` | Primera matrícula, en cualquier módulo (módulo de ingreso). Si llega `equivalencias`, se ignora. |
| PUT | `/api/alumnos/:id/cursadas` | Igual; además recursa. Devuelve `matricula` (`NUEVA`, `RECURSADA`, `REACTIVADA`, `CORREGIDA`, `CAMBIO_DE_CURSO`, `SIN_CAMBIOS`). |
| POST | `/api/alumnos/:id/equivalencias` | **Eliminado** en la migración 008: responde `404`. |
| PATCH | `/api/plan-estudio/:id/reactivar` | Nuevo. Un plan inactivo vuelve a estar vigente; el que estaba vigente pasa a inactivo. |
| POST | `/api/preceptores` | Acepta `password`: crea el preceptor y su usuario de acceso en una sola operación. |
| POST | `/api/alumnos/evaluaciones-modulo` | Rechaza si el alumno está libre o le faltan correlativas. |
| PUT | `/api/calificaciones` | Devuelve la situación recalculada. Rechaza cambios en módulos aprobados. |
| GET | `/api/alumnos/:id` | Trae `moduloIngresoId`, `modulosPorEquivalencia` (los anteriores al ingreso), módulos acreditados y, por cursada, materias, `tieneDatos` y si es evaluable. Ya no trae `equivalencias`. |
| GET | `/api/cursos` | Cada módulo trae sus `correlativos`. |
| GET | `/api/alumnos` | Ya no incluye egresados. Cada alumno trae `egresado` y `fechaEgreso`. |
| GET | `/api/alumnos?egresados=true` | Nuevo. Solo los egresados. |
| GET | `/api/alumnos`, `/api/alumnos/:id` | Cada alumno trae `planEstudio` (`id`, `titulo`, `resolucion`, `vigente`) o `null`. |
| GET | `/api/reportes/inasistencias` | Solo alumnos libres por inasistencias. Cada fila trae `planEstudio`. `minFaltas` pasa a ser un filtro opcional. Con `situacion=riesgo`, los regulares con 20 faltas o más (devuelve `umbralRiesgo: 20`). |
| GET | `/api/alumnos?incluirInactivos=true` | Incluye los dados de baja (campo `activo`). |
| PATCH | `/api/alumnos/:id/reactivar` | Vuelve a dar de alta a un alumno dado de baja. |
| GET | `/api/docentes?estado=activos\|inactivos\|todos` | Cada docente trae `activo`. Por defecto, todos. |
| PATCH | `/api/docentes/:id/inactivar` | Nuevo. Baja lógica. |
| PATCH | `/api/docentes/:id/reactivar` | Nuevo. |
| DELETE | `/api/docentes/:id` | Eliminación definitiva. Solo si está inactivo (si no, `409`). Responde `204`. Borra también su usuario (migración 010). |
| GET | `/api/preceptores?estado=activos\|inactivos\|todos` | Cada preceptor trae `activo`. Por defecto, todos. |
| PATCH | `/api/preceptores/:id/inactivar` | Nuevo. Baja lógica. Conserva sus cursos. |
| PATCH | `/api/preceptores/:id/reactivar` | Nuevo. |
| DELETE | `/api/preceptores/:id` | Eliminación definitiva. Solo si está inactivo (si no, `409`). Responde `204`. Borra también su usuario (migración 010). |
| GET | `/api/preceptores/cursos` | Cada curso trae `preceptor_activo`. |
| POST | `/api/auth/login` | Correo sin distinguir mayúsculas; `403` si el usuario está dado de baja; `401` con el correo de un docente o preceptor eliminado; `429` tras 10 intentos fallidos. `email` y `password` deben ser texto (`400`). |
| POST | `/api/auth/registro` | `409` si el correo ya existe (sin distinguir mayúsculas). |
| POST, PUT | `/api/asistencias` | `400` con fecha futura, de otro año, fuera del período del módulo o en sábado o domingo; `409` si el módulo está aprobado o el alumno dado de baja. |
| DELETE | `/api/asistencias/:id` | `409` si el módulo está aprobado o el alumno dado de baja. |
| POST, PUT | `/api/alumnos`, `/api/docentes`, `/api/preceptores` | Valida nombre y apellido (solo letras). `trabaja` del alumno solo acepta `true`/`false`. Alumnos: `409` si otro alumno tiene el mismo correo. Docentes y preceptores: antigüedad de 0 a 35. |
| POST, PUT | `/api/docentes` | Cada asignación `{ moduloId, division, materia }` se guarda con su módulo (migración 009). |
| GET | `/api/asistencias/modulos/:moduloId/divisiones/:division` | Además trae `modulo`, `periodo` y `cicloLectivo` para limitar el calendario. |
| GET | `/api/alumnos/:id`, `/api/reportes/inasistencias` | Las faltas son la suma exacta (admite decimales, por ejemplo `25.5`). |

## 13. Puesta en producción (Neon + Render + Vercel)

1. En Neon, crear una rama o un respaldo de la base.
2. Ejecutar `database/migrations/005_correlatividades_condicion_equivalencias.sql` en el SQL Editor de Neon (o con `psql`). Se puede ejecutar más de una vez.
   Ejecutar también `database/migrations/006_sincronizar_secuencias.sql`: adelanta las secuencias de ids que quedaron atrasadas (sin esto puede fallar el alta de materias, ciclos lectivos o planes). No modifica datos.
   Y `database/migrations/007_baja_logica_personal_y_plan_estudio.sql`: agrega el estado de docentes y preceptores y deja en una migración las tablas del plan de estudios. Se puede ejecutar más de una vez y no cambia los planes ya cargados. Si no se ejecuta, el backend crea lo mismo al iniciar.
3. Desplegar el backend (Render) y el frontend (Vercel). El backend nuevo funciona con o sin la 008: si no la encuentra, crea sus funciones al iniciar.
4. Después del despliegue, ejecutar `database/migrations/008_sin_equivalencias_modulo_de_ingreso.sql`: cambia las correlatividades al módulo de ingreso y elimina la tabla `equivalencia_modulo`. Se puede ejecutar más de una vez y avisa cuántos alumnos tenían una equivalencia que deja de contar (en la base de prueba, ninguno). No ejecutarla antes de desplegar: el backend viejo todavía lee esa tabla.
   Después, `database/migrations/009_asignacion_docente_por_modulo.sql`: agrega el módulo a las asignaciones de docentes. Se puede ejecutar más de una vez. El backend nuevo también la aplica solo al iniciar si falta.
   Y `database/migrations/010_borrar_usuarios_de_personal_eliminado.sql`: borra los usuarios que quedaron de docentes o preceptores eliminados. Avisa cuántos borró y se puede ejecutar más de una vez, antes o después del despliegue.
5. En Render, `JWT_SECRET` tiene que estar configurada.

La migración regulariza los datos existentes:

- La 005 registraba como equivalencia los módulos previos de los alumnos ya matriculados en 2.º o 3.er año. Con la 008 esos módulos quedan cubiertos por la regla del módulo de ingreso.
- Recalcula la situación de todas las cursadas. Las que tengan una materia desaprobada pasan a `LIBRE`.

## 14. Pruebas

Con una base **local** y el backend corriendo:

```bash
cd backend
npm run test:reglas
```

Son 46 casos de reglas académicas contra la API real. Hay además una suite de 37 casos con todos los endpoints (auth, cursos, alumnos, asistencias, calificaciones, docentes, preceptores, plan de estudios y reportes, con permisos por rol, bajas, sesión y límite de intentos):

```bash
npm run test:api
```

Y una tercera de casos extremos: 667 casos en 20 áreas (permisos de cada ruta por rol, ids y parámetros raros, cuerpos mal formados, login, alumnos y correo único, módulo de ingreso, correlatividades, matrícula, asistencias con días de clase, calificaciones, evaluaciones, alumnos en riesgo, usuarios, docentes con asignación por módulo y antigüedad, preceptores, ciclo lectivo, materias y plan). Ninguna respuesta puede ser `500`:

```bash
npm run test:extremos
```

Supone el ciclo 2026 y los datos de `schema.sql` (el docente de prueba dicta Matemática en los Módulos I y II, División B; el preceptor tiene los Módulos V y VI, Divisiones B y C).

Las tres crean datos de prueba con apellido `ZZ-TEST` o `ZZ-EXT`, por eso solo corren contra `localhost`.

En `frontend/`, `npm test` corre 23 casos: la regla de correlatividades del formulario de matrícula (módulo de ingreso incluido) y los días de clase de la planilla de asistencia.
