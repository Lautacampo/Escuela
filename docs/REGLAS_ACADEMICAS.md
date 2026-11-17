# Reglas académicas: correlatividades, condición LIBRE y equivalencias

Resumen de cómo el sistema aplica la Resolución N.º 195-ME-2024 desde la migración 005.

## 1. Estructura

| Año | Marzo a julio (período 1) | Agosto a diciembre (período 2) |
| --- | --- | --- |
| 1.º | Módulo I | Módulo II |
| 2.º | Módulo III | Módulo IV |
| 3.º | Módulo V | Módulo VI |

## 2. Correlatividades

Se validan **al matricular** y **al acreditar** (evaluación de módulo).

| Para cursar / acreditar | Debe tener aprobados |
| --- | --- |
| Módulo III o IV (2.º año) | Módulo I y Módulo II |
| Módulo V o VI (3.º año) | Módulo III y Módulo IV |

- Dentro del mismo año no hay correlatividad: se puede cursar el II con el I desaprobado (o el IV con el III desaprobado), pero no se pasa de año hasta aprobar los dos.
- "Aprobado" incluye los módulos acreditados por equivalencia.
- La tabla vive en `modulo_correlativo`. No está escrita en el código.

## 3. Condición LIBRE

Un alumno queda `LIBRE` en un módulo (estado académico `A_RECURSAR`) en tres escenarios:

| `motivo_libre` | Cuándo |
| --- | --- |
| `INASISTENCIAS` | Supera las 25 faltas (25 exactas sigue regular). |
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

## 4. Recursar

Se hace desde **Editar alumno → Editar matrícula**, eligiendo el mismo módulo. El sistema crea una cursada nueva (faltas y notas en cero) y la anterior queda cerrada en la trayectoria. Una cursada cerrada ya no admite cambios de notas ni de asistencias.

## 5. Ingreso por equivalencia

Un alumno puede empezar en cualquier módulo si acredita los anteriores por equivalencia. Se registra en `equivalencia_modulo`. La observación (por ejemplo, la escuela de origen) es opcional.

- Solo para módulos que el alumno **nunca cursó** en la escuela: no sirve para saltear un módulo desaprobado.
- Exige la cadena completa: para entrar al Módulo V hacen falta I, II, III y IV.
- No se puede quitar una equivalencia de la que depende una cursada.

## 6. Módulos aprobados y egresados

- **Módulo aprobado:** el alumno deja de figurar en la planilla de asistencia y en la grilla de calificaciones de ese módulo. Vuelve a aparecer en el módulo en el que se lo matricule después, con faltas y materias en cero. Su cursada aprobada queda en la trayectoria.
- **Egresado:** alumno con los 6 módulos acreditados y al menos uno aprobado en la institución. No se guarda en la base: se calcula a partir de la trayectoria.
- El egresado sale del padrón de alumnos y se consulta desde **Gestión de Alumnos → Alumnos egresados**.
- Su legajo es de solo lectura: no se modifica, no se da de baja, no se matricula, no se califica y no se le cambian equivalencias (el backend responde 409).

## 7. Plan de estudios y reportes

- **Plan de estudios de cada alumno:** queda fijado en su primera matrícula con el plan vigente de ese momento y no cambia aunque después se reemplace el plan. Se ve en el listado de alumnos, en la ficha, en el listado de egresados y en los reportes. Un alumno sin matrícula figura como "Sin asignar".
- Se guarda en la columna `alumno.plan_estudio_id`. El backend la crea al iniciar (igual que las tablas del plan) y asigna el plan vigente a los alumnos que ya tenían matrícula. No requiere ejecutar nada en Neon.
- **Crear plan nuevo:** el botón muestra un aviso para comunicarse con el soporte técnico (`soporte3tomasbaras@gmail.com`). El plan nuevo lo carga el soporte; el endpoint `POST /api/plan-estudio` se conserva para eso. La baja y la reactivación de planes no cambian.
- **Alertas de inasistencias (Reportes):** solo figuran los alumnos que están LIBRES por inasistencias, es decir, que superaron las 25 faltas en un módulo que no tienen aprobado. Un alumno regular con 25 faltas o menos, o con el módulo aprobado, no aparece. Si se corrige la asistencia y vuelve a 25 o menos, sale del reporte.

## 8. Endpoints

| Método | Ruta | Cambio |
| --- | --- | --- |
| POST | `/api/alumnos/:id/cursadas` | Valida correlatividades. Acepta `equivalencias` y `observacionEquivalencia`. |
| PUT | `/api/alumnos/:id/cursadas` | Igual; además recursa. Devuelve `matricula` (`NUEVA`, `RECURSADA`, `REACTIVADA`, `CORREGIDA`, `CAMBIO_DE_CURSO`, `SIN_CAMBIOS`). |
| POST | `/api/alumnos/:id/equivalencias` | Nuevo. Body: `{ modulosIds, observacion }` (`observacion` opcional). |
| PATCH | `/api/plan-estudio/:id/reactivar` | Nuevo. Un plan inactivo vuelve a estar vigente; el que estaba vigente pasa a inactivo. |
| POST | `/api/preceptores` | Acepta `password`: crea el preceptor y su usuario de acceso en una sola operación. |
| DELETE | `/api/alumnos/:id/equivalencias/:moduloId` | Nuevo. |
| POST | `/api/alumnos/evaluaciones-modulo` | Rechaza si el alumno está libre o le faltan correlativas. |
| PUT | `/api/calificaciones` | Devuelve la situación recalculada. Rechaza cambios en módulos aprobados. |
| GET | `/api/alumnos/:id` | Agrega equivalencias, módulos acreditados y, por cursada, materias y si es evaluable. |
| GET | `/api/cursos` | Cada módulo trae sus `correlativos`. |
| GET | `/api/alumnos` | Ya no incluye egresados. Cada alumno trae `egresado` y `fechaEgreso`. |
| GET | `/api/alumnos?egresados=true` | Nuevo. Solo los egresados. |
| GET | `/api/alumnos`, `/api/alumnos/:id` | Cada alumno trae `planEstudio` (`id`, `titulo`, `resolucion`, `vigente`) o `null`. |
| GET | `/api/reportes/inasistencias` | Solo alumnos libres por inasistencias. Cada fila trae `planEstudio`. `minFaltas` pasa a ser un filtro opcional. |

## 9. Puesta en producción (Neon + Render + Vercel)

1. En Neon, crear una rama o un respaldo de la base.
2. Ejecutar `database/migrations/005_correlatividades_condicion_equivalencias.sql` en el SQL Editor de Neon (o con `psql`). Se puede ejecutar más de una vez.
   Ejecutar también `database/migrations/006_sincronizar_secuencias.sql`: adelanta las secuencias de ids que quedaron atrasadas (sin esto puede fallar el alta de materias, ciclos lectivos o planes). No modifica datos.
3. Enseguida, desplegar el backend (Render) y el frontend (Vercel). Entre el paso 2 y el despliegue del backend, la carga de asistencias del backend viejo falla.

La migración regulariza los datos existentes:

- A los alumnos ya matriculados en 2.º o 3.er año sin módulos previos cargados les registra esos módulos como equivalencia.
- Recalcula la situación de todas las cursadas. Las que tengan una materia desaprobada pasan a `LIBRE`.

## 10. Pruebas

Con una base **local** y el backend corriendo:

```bash
cd backend
npm run test:reglas
```

Son 47 casos de reglas académicas contra la API real. Hay además una suite de todos los endpoints (auth, cursos, alumnos, asistencias, calificaciones, docentes, preceptores, plan de estudios y reportes, con permisos por rol):

```bash
npm run test:api
```

Las dos crean datos de prueba con apellido `ZZ-TEST`, por eso solo corren contra `localhost`.
