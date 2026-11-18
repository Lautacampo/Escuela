# AGENTS.md

Guía para agentes que trabajen en este repositorio (Sistema de Gestión Académica — Colegio Tomás Baras).

## Estructura y estado
- `frontend/`: React 19 + Vite 8 + Bootstrap 5, JavaScript/JSX. `backend/`: Express 5 + PostgreSQL (`pg`) + JWT, ESM. No hay `package.json` raíz ni workspaces: instalar y ejecutar cada carpeta por separado (el `package-lock.json` de la raíz está vacío).
- `labtech-proyecto/` es una copia local sin versionar (solo `node_modules/public/src`); no forma parte de la app ni se debe editar.
- `database/schema.sql` es un volcado completo de PostgreSQL 18.6; `database/db.json` es data vieja de la etapa JSON Server.
- `README.md` mezcla la etapa JSON Server con la actual; `READMEv2.md` describe el flujo con backend/JWT. Ante dudas, confiar en `package.json` y en el código.
- Hay tres suites de pruebas del backend en `backend/tests/` (ver Comandos). No hay typecheck, CI ni pre-commit.

## Comandos
Backend (desde `backend/`):
- `npm install`
- Crear `.env` a partir de `.env.example` (`Copy-Item .env.example .env`) y ajustar `PORT`, `PGDATABASE`, `PGPASSWORD` y `JWT_SECRET`.
- `npm run dev` (`node --watch src/server.js`) o `npm start`.
- `node test-db.js`: comprueba la conexión a PostgreSQL y lista roles.
- Pruebas (con el backend corriendo contra una base **local**; crean datos `ZZ-TEST`/`ZZ-EXT`): `npm run test:reglas` (46 casos de correlatividades, módulo de ingreso, LIBRE y egresados), `npm run test:api` (36 casos de todos los endpoints), `npm run test:extremos` (667 casos extremos en 20 áreas: ninguna respuesta puede ser 500) y `node --test tests/validaciones-persona.test.mjs`.
- Sin `JWT_SECRET` el backend no arranca.
- `node scripts/seed-usuarios.js`: inserta usuarios de prueba con contraseña `1234`. El README menciona `npm run seed:usuarios`, pero ese script no existe en `package.json`.

Frontend (desde `frontend/`):
- `npm install`
- `npm run dev` → http://localhost:5173
- `npm run lint` (sin errores), `npm test` (23 casos: correlatividades del formulario y días de clase de la planilla) y `npm run build`.
- `npm run server` levanta json-server sobre `../database/db.json` en el puerto 3000, pero ya no lo consume el frontend. Es legado.
- Node 24 LTS (probado con v24.20.0 / npm 11.19.0). El backend necesita Node 20 o posterior.

## API: puertos y endpoints
- `frontend/src/shared/services/api.js` toma la base de `VITE_API_URL` (en local, `http://localhost:4000/api`, que es el puerto por defecto del backend). `FRONTEND_URL` (o `CORS_ORIGIN`) del backend debe coincidir con el origen de Vite (5173 por defecto).
- El backend monta `/api/auth`, `/api/calificaciones`, `/api/asistencias`, `/api/docentes`, `/api/preceptores`, `/api/cursos`, `/api/alumnos`, `/api/reportes` y, en `/api`, las rutas del plan de estudios (`/plan-estudio*`, `/materias`, `/ciclo-lectivo`). Cualquier otra ruta `/api/...` responde 404. El detalle de endpoints está en `docs/REGLAS_ACADEMICAS.md`.
- `apiFetch` agrega `Authorization: Bearer <token>` y, ante un 401, borra la sesión y redirige a `/login`. `verificarToken` además rechaza con 401 a un usuario dado de baja.
- Los roles del backend van en minúscula: `directivo`, `docente`, `preceptor`. Los permisos se validan dos veces: loaders de `frontend/src/router.jsx` (`controlSesion`) y middleware `verificarToken`/`permitirRoles`.

## Base de datos
- Crear primero la base (por ejemplo `escuela_db`) y cargar el dump con **psql**, no con pgAdmin Query Tool: `psql -U postgres -d escuela_db -f database/schema.sql`. El archivo usa metacomandos `\restrict`/`\unrestrict` y `COPY ... FROM stdin` de `pg_dump`; carga en PostgreSQL 16 o posterior.
- `schema.sql` ya incluye las migraciones `database/migrations/005` a `009`. En una base existente (Neon) se ejecutan en orden; de la 005 en adelante se pueden ejecutar más de una vez (la 001 no).
- No hay equivalencias (migración 008): el primer módulo del alumno es su módulo de ingreso y las correlatividades se exigen desde ahí. La regla está en la base y en `frontend/src/features/alumnos/utils/correlatividades.js`; si se cambia una, cambiar la otra.
- Los endpoints están listados en `docs/ENDPOINTS.md`.
- `backend/src/config/migracionesAlIniciar.js` tiene copias de la 008 (funciones) y de la 009: el backend las aplica al iniciar si la base no las tiene. Si se cambia una migración, cambiar también su copia.
- Asistencia: solo de lunes a viernes y en los meses del módulo (I, III, V de marzo a julio; II, IV, VI de agosto a diciembre). Backend en `asistencias.service.js`, frontend en `features/asistencia/utils/diasDeClase.js`.
- Docentes: cada asignación es curso + módulo + materia (migración 009); asignar el Módulo I no asigna el II.
- Las reglas académicas (condición LIBRE, correlatividades) viven en triggers de la base: ver `docs/REGLAS_ACADEMICAS.md`.
- `backend/.env.example` usa `PGDATABASE=Colegio` y una contraseña placeholder. El schema ya incluye `roles` y `usuarios`, con `director@escuela.com`, `docente@escuela.com` y `preceptor@escuela.com` (contraseña `1234`).
- Arrancar el backend desde `backend/`: `dotenv` lee `.env` del directorio actual. Los defaults de `env.js` (`PGDATABASE=database`) no sirven para este proyecto.

## Convenciones
- Frontend feature-first: `src/features/<dominio>/{pages,components,services}`; lo compartido está en `src/shared/`. Las rutas se centralizan en `src/router.jsx` con `react-router` v8 (importar de `react-router`, no de `react-router-dom`).
- Backend por módulos: `routes → controller → service → repository`, con SQL crudo sobre el pool de `pg`; los errores se centralizan en `middlewares/errorHandler.js`.
- Hay extensiones mezcladas `.js`/`.jsx` en los servicios; confirmar cuál importa la página antes de editar.
- `npm run lint` pasa sin errores: mantenerlo así. Para cargar datos en un efecto, actualizar el estado recién en el `.then` (la regla `react-hooks/set-state-in-effect` rechaza el `setState` sincrónico).
- Las pantallas que muestran datos que cambian otros usuarios usan `shared/hooks/useAutoActualizar.js` (consulta cada 15 s y al volver a la pestaña).
- Bajas: alumnos con baja lógica y reactivación; docentes y preceptores con baja lógica (inactivo), reactivación y eliminación definitiva solo estando inactivos.
- Correlatividades del formulario: `features/alumnos/utils/correlatividades.js`. Dentro del mismo año no hay correlatividad; solo bloquea un correlativo de un año anterior. Si se toca, correr `npm test` en `frontend/`.
- Nombres y apellidos se validan con `esNombreValido` (frontend `shared/utils/validaciones.js`, backend `utils/validacionesPersona.js`), solo cuando el campo cambia.
- Celular (≤ 768 px): la barra superior (`NavbarGestion`) queda fija y tiene el botón del menú; el estado del menú vive en `LayoutPrivado` y el menú lateral se despliega debajo de la barra. Escape, tocar afuera o elegir una opción lo cierran.
- Tablas en celular (≤ 700 px): con la clase `tabla-tarjetas` en la `<table>` y `data-label="Título"` en cada `<td>`, cada fila se muestra como tarjeta (`gestion.css`). Usarlo en tablas nuevas del panel.
- `index.css` tiene `main p, main li` con color claro (es del sitio público): en el panel, todo texto suelto necesita su propio color.
