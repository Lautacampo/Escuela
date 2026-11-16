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

Un alumno puede empezar en cualquier módulo si acredita los anteriores por equivalencia. Se registra en `equivalencia_modulo` con la institución de origen o la norma.

- Solo para módulos que el alumno **nunca cursó** en la escuela: no sirve para saltear un módulo desaprobado.
- Exige la cadena completa: para entrar al Módulo V hacen falta I, II, III y IV.
- No se puede quitar una equivalencia de la que depende una cursada.

## 6. Endpoints

| Método | Ruta | Cambio |
| --- | --- | --- |
| POST | `/api/alumnos/:id/cursadas` | Valida correlatividades. Acepta `equivalencias` y `observacionEquivalencia`. |
| PUT | `/api/alumnos/:id/cursadas` | Igual; además recursa. Devuelve `matricula` (`NUEVA`, `RECURSADA`, `REACTIVADA`, `CORREGIDA`, `CAMBIO_DE_CURSO`, `SIN_CAMBIOS`). |
| POST | `/api/alumnos/:id/equivalencias` | Nuevo. Body: `{ modulosIds, observacion }`. |
| DELETE | `/api/alumnos/:id/equivalencias/:moduloId` | Nuevo. |
| POST | `/api/alumnos/evaluaciones-modulo` | Rechaza si el alumno está libre o le faltan correlativas. |
| PUT | `/api/calificaciones` | Devuelve la situación recalculada. Rechaza cambios en módulos aprobados. |
| GET | `/api/alumnos/:id` | Agrega equivalencias, módulos acreditados y, por cursada, materias y si es evaluable. |
| GET | `/api/cursos` | Cada módulo trae sus `correlativos`. |

## 7. Puesta en producción (Neon + Render + Vercel)

1. En Neon, crear una rama o un respaldo de la base.
2. Ejecutar `database/migrations/005_correlatividades_condicion_equivalencias.sql` en el SQL Editor de Neon (o con `psql`). Se puede ejecutar más de una vez.
3. Enseguida, desplegar el backend (Render) y el frontend (Vercel). Entre el paso 2 y el despliegue del backend, la carga de asistencias del backend viejo falla.

La migración regulariza los datos existentes:

- A los alumnos ya matriculados en 2.º o 3.er año sin módulos previos cargados les registra esos módulos como equivalencia.
- Recalcula la situación de todas las cursadas. Las que tengan una materia desaprobada pasan a `LIBRE`.

## 8. Pruebas

Con una base **local** y el backend corriendo:

```bash
cd backend
npm run test:reglas
```

Son 42 casos contra la API real. Crean alumnos de prueba con apellido `ZZ-TEST`, por eso el script solo corre contra `localhost`.
