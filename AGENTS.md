# Guía para trabajar en este repositorio

## Ubicación y comandos
- El código está en `Escuela-main/`, no en la raíz de Git. No hay un paquete npm raíz ni workspaces: `frontend/` y `backend/` tienen dependencias y lockfiles independientes. Las rutas siguientes parten de `Escuela-main/`.
- Usa Node.js 24 LTS: es compatible con los requisitos de Vite y ESLint del lockfile y con `process.loadEnvFile()` del backend.
- En `frontend/`: `npm ci --include=dev`; después, `npm run dev` para Vite y, en otra terminal, `npm run server` para JSON Server en el puerto 3000. Este último script ya apunta a `../database/db.json`; no hace falta ejecutar `npx` desde la raíz.
- En `backend/`: `npm ci`, preparar `.env` a partir de `.env.example` y ejecutar `npm run dev` (recarga automática) o `npm start`.
- Verificación del frontend, desde `frontend/`: `npm run lint` y `npm run build`. No hay scripts de tests ni de typecheck en ninguno de los dos paquetes.

## Dos API que todavía conviven
- El README principal describe una etapa anterior: el inicio de sesión ya usa JWT y PostgreSQL, no una autenticación simulada. Para recorrer toda la gestión hacen falta Vite, Express y JSON Server.
- **Configura `PORT=4000` en `backend/.env`**: `.env.example` propone 3000, pero ese puerto lo usa JSON Server. Tanto `frontend/src/shared/services/api.js` como `frontend/src/features/auth/services/authServices.js` apuntan a `http://localhost:4000/api`.
- El backend carga `.env` con `process.loadEnvFile()` desde el directorio de ejecución: arráncalo desde `backend/`. Ajusta `CORS_ORIGIN` si Vite no está en `http://localhost:5173`.
- Login, calificaciones y preceptores usan Express; los servicios de alumnos, docentes y asistencia siguen consultando JSON Server en `http://localhost:3000`, aunque ya existan rutas equivalentes en Express. Comprueba el servicio importado por cada pantalla antes de cambiar una API.
- Las escrituras de JSON Server modifican `database/db.json`: las pruebas manuales pueden alterar los datos de ejemplo.

## PostgreSQL y comprobaciones
- La conexión usa las variables `PG*` de `backend/.env.example`. `database/schema.sql` es un volcado de PostgreSQL 18.6, no una migración ni una inicialización completa: no define las tablas `usuarios` y `roles` que necesita la autenticación. No des por hecho que restaurarlo basta para iniciar sesión.
- Desde `backend/`, `node test-db.js` comprueba la conexión y consulta `roles`; no es una suite de tests. `node scripts/seed-usuarios.js` requiere `usuarios` y los roles ya creados; inserta cuentas de prueba con contraseña `1234`, sin actualizar las existentes.
- Tanto la comprobación de base de datos como el seed capturan errores y los imprimen sin fijar un código de salida de fallo: revisa su salida, no solo el estado del proceso.
- Hay una colección para comprobaciones manuales en `backend/postman/Escuela API.postman_collection.json`.

## Puntos de integración
- La navegación y los permisos de pantalla se definen en `frontend/src/router.jsx`, mediante loaders de `features/auth/services/authServices.js`. La sesión se guarda en `localStorage` con las claves `sesion` y `token`; `apiFetch` añade el Bearer token y cierra la sesión ante un 401.
- En Express, `backend/src/server.js` arranca `src/app.js`, que monta las rutas bajo `/api`. Cada módulo separa rutas, controladores, servicios y repositorios SQL; los permisos del servidor se aplican con `verificarToken` y `permitirRoles`, independientemente de los loaders del frontend.
- `frontend/dist/` es salida de compilación; modifica `frontend/src/` o `frontend/public/`, no los archivos generados.
