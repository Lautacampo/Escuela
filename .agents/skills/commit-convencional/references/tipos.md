# Tipos de commits convencionales
Los mensajes de commit deben comenzar con uno de los siguientes tipos, seguido de dos puntos y una descripción breve en español, escrita en modo imperativo.

## Tipos disponibles
| Tipo | Cuándo utilizarlo |
|---|---|
| `feat` | Cuando se agrega una nueva funcionalidad al sistema. |
| `fix` | Cuando se corrige un error o comportamiento incorrecto. |
| `style` | Cuando se realizan cambios de formato o presentación que no modifican la lógica del código. |
| `refactor` | Cuando se reorganiza o mejora el código sin cambiar su comportamiento. |
| `test` | Cuando se agregan, modifican o corrigen pruebas. |
| `build` | Cuando se modifican dependencias o herramientas del proceso de compilación. |
| `revert` | Cuando se revierte un commit anterior. |

## Ejemplos
- `feat: agrega formulario de registro de alumnos`
- `fix: corrige la validación de credenciales`
- `style: ajusta los estilos de la pantalla de inicio`
- `refactor: reorganiza los servicios de autenticación`
- `test: agrega pruebas para el registro de usuarios`
- `build: actualiza las dependencias del proyecto`
- `revert: revierte los cambios del formulario de registro`

## Reglas generales
1. Utilizar siempre uno de los tipos definidos en este documento.
2. Escribir la descripción en español y en modo imperativo.
3. Comenzar la descripción con una letra minúscula.
4. No terminar el mensaje con un punto.
5. Mantener el mensaje breve y específico.
6. Si un conjunto de cambios incluye funcionalidades o correcciones independientes, proponer dividirlo en varios commits.
7. No utilizar `feat` para modificaciones que solamente corrigen errores; en esos casos utilizar `fix`.
8. No utilizar `refactor` cuando el cambio modifica el comportamiento observable del sistema.