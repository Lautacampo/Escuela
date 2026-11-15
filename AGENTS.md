# AGENTS.md

Guía para agentes que trabajen en este repositorio (Sistema de Gestión Académica — Colegio Tomás Baras).

## Estructura y estado
- `frontend/`: React 19 + Vite 8 + Bootstrap 5, JavaScript/JSX. `backend/`: Express 5 + PostgreSQL (`pg`) + JWT, ESM. No hay `package.json` raíz ni workspaces: instalar y ejecutar cada carpeta por separado (el `package-lock.json` de la raíz está vacío).
- `labtech-proyecto/` es una copia local sin versionar (solo `node_modules/public/src`); no forma parte de la app ni se debe editar.
- `database/schema.sql` es un volcado completo de PostgreSQL 18.6; `database/db.json` es data vieja de la etapa JSON Server.
- `README.md` mezcla la etapa JSON Server con la actual; `READMEv2.md` describe el flujo con backend/JWT. Ante dudas, confiar en `package.json` y en el código.
- No hay tests, typecheck, CI ni pre-commit.

## Comandos
Backend (desde `backend/`):
- `npm install`
- Crear `.env` a partir de `.env.example` (`Copy-Item .env.example .env`) y ajustar `PORT`, `PGDATABASE`, `PGPASSWORD` y `JWT_SECRET`.
- `npm run dev` (`node --watch src/server.js`) o `npm start`.
- `node test-db.js`: comprueba la conexión a PostgreSQL y lista roles. No es una suite de tests.
- `node scripts/seed-usuarios.js`: inserta usuarios de prueba con contraseña `1234`. El README menciona `npm run seed:usuarios`, pero ese script no existe en `package.json`.

Frontend (desde `frontend/`):
- `npm install`
- `npm run dev` → http://localhost:5173
- `npm run lint` y `npm run build` son la única verificación automática.
- `npm run server` levanta json-server sobre `../database/db.json` en el puerto 3000, pero ya no lo consume el frontend. Es legado.
- Node 24 LTS (probado con v24.20.0 / npm 11.19.0). El backend necesita `process.loadEnvFile()`, disponible desde Node 20.12.

## API: puertos y endpoints
- `frontend/src/shared/services/api.js` tiene la base hardcodeada en **`http://localhost:8080/api`**. El backend escucha por defecto en **4000** (`PORT`), así que hay que alinear ambos antes de depurar problemas de red/CORS. `CORS_ORIGIN` debe coincidir con el origen de Vite (5173 por defecto).
- El backend solo monta `/api/auth`, `/api/calificaciones`, `/api/asistencias`, `/api/docentes`, `/api/preceptores`, `/api/cursos` y `/api/alumnos` (ver `backend/src/app.js`).
- El frontend aún llama endpoints sin implementar: `/materias`, `/plan-estudio*`, `/ciclo-lectivo`, `/reportes/*`, `/evaluaciones-modulo`, `/modulos` (asistencia) y `GET`/`DELETE /calificaciones` (ficha y borrado de alumno). Los 404 en esas pantallas son esperables; no rompas otras pantallas para "arreglarlos".
- `apiFetch` agrega `Authorization: Bearer <token>` y, ante un 401, borra la sesión y redirige a `/login`.
- Los roles del backend van en minúscula: `directivo`, `docente`, `preceptor`. Los permisos se validan dos veces: loaders de `frontend/src/router.jsx` (`controlSesion`) y middleware `verificarToken`/`permitirRoles`.

## Base de datos
- Crear primero la base (por ejemplo `escuela_db`) y cargar el dump con **psql**, no con pgAdmin Query Tool: `psql -U postgres -d escuela_db -f database/schema.sql`. El archivo usa metacomandos `\restrict`/`\unrestrict` y `COPY ... FROM stdin` de `pg_dump` 18.6; conviene usar psql/PostgreSQL 18.
- `backend/.env.example` usa `PGDATABASE=Colegio` y una contraseña placeholder. El schema ya incluye `roles` y `usuarios`, con `director@escuela.com`, `docente@escuela.com` y `preceptor@escuela.com` (contraseña `1234`).
- Arrancar el backend desde `backend/`: `process.loadEnvFile()` lee `.env` del directorio actual. Los defaults de `env.js` (`PGDATABASE=database`) no sirven para este proyecto.

## Convenciones
- Frontend feature-first: `src/features/<dominio>/{pages,components,services}`; lo compartido está en `src/shared/`. Las rutas se centralizan en `src/router.jsx` con `react-router` v8 (importar de `react-router`, no de `react-router-dom`).
- Backend por módulos: `routes → controller → service → repository`, con SQL crudo sobre el pool de `pg`; los errores se centralizan en `middlewares/errorHandler.js`.
- Hay servicios duplicados/legados en `features/SoftwareII/` (`*-is`) y extensiones mezcladas `.js`/`.jsx`; confirmar cuál importa la página antes de editar.
- `npm run lint` ya falla con 7 errores preexistentes (`set-state-in-effect` en ConsultaMateria, DivisionCalificacionesPage y PlanEstudios; variables/imports sin usar). Comparar con `git diff` para no atribuirlos a cambios nuevos.
