# Sistema de Gestión Académica — Colegio N° 3 “Tomás Baras”
**Desarrollado por:** Becerra Santiago, Campo Lautaro y Gallardo Máximo.

---

## 1. Requisitos

Para instalar y ejecutar el proyecto se requiere:

- **Node.js** (versión LTS vigente, ej. v20 / v24) y **npm** (ej. v10 / v11)
- **PostgreSQL** (v14 o superior)
- **Git** y un navegador web

Comprobar en la terminal que Node.js, npm y PostgreSQL estén instalados:
```bash
node --version
npm --version
psql --version
```

---

## 2. Crear la base de datos con el script SQL

1. Abrir **pgAdmin** o la consola de **PostgreSQL (`psql`)** y crear una base de datos vacía llamada `escuela_db`:
   ```sql
   CREATE DATABASE escuela_db;
   ```
2. Ejecutar el script `database/schema.sql` incluido en el repositorio (crea todas las tablas, restricciones y carga los datos de prueba iniciales):
   ```bash
   psql -U postgres -d escuela_db -f database/schema.sql
   ```
   *(En pgAdmin: hacer clic derecho sobre `escuela_db` → **Query Tool** → abrir el archivo `database/schema.sql` y presionar **Execute / F5**).*

3. Si la base ya existía (por ejemplo, la de Neon), ejecutar las migraciones necesarias. `schema.sql` ya las incluye para bases nuevas:
   ```bash
   psql -U postgres -d escuela_db -f database/migrations/003_alumno_baja_logica.sql
   psql -U postgres -d escuela_db -f database/migrations/005_correlatividades_condicion_equivalencias.sql
   psql -U postgres -d escuela_db -f database/migrations/006_sincronizar_secuencias.sql
   psql -U postgres -d escuela_db -f database/migrations/007_baja_logica_personal_y_plan_estudio.sql
   psql -U postgres -d escuela_db -f database/migrations/008_sin_equivalencias_modulo_de_ingreso.sql
   psql -U postgres -d escuela_db -f database/migrations/009_asignacion_docente_por_modulo.sql
   psql -U postgres -d escuela_db -f database/migrations/010_borrar_usuarios_de_personal_eliminado.sql
   ```
   Las reglas (correlatividades, módulo de ingreso, condición LIBRE) están explicadas en `docs/REGLAS_ACADEMICAS.md`, los endpoints en `docs/ENDPOINTS.md` y el uso de IA en `docs/USO_IA.md`.

---

## 3. Configurar el archivo `.env` del Backend

1. Abrir una terminal y ubicarse en la carpeta `backend`:
   ```bash
   cd backend
   ```
2. Crear el archivo `.env` a partir de la plantilla `.env.example` (el archivo `.env` está ignorado en `.gitignore` y no se sube al repositorio):
   ```bash
   cp .env.example .env
   ```
3. Editar el archivo `backend/.env` completando los datos de conexión locales de PostgreSQL y la clave secreta de JWT:
   ```env
   PORT=4000
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=postgres
   DB_PASSWORD=tu_password_de_postgres
   DB_NAME=escuela_db
   JWT_SECRET=clave_secreta_desarrollo_tomas_baras_2026
   JWT_EXPIRES_IN=8h
   ```

---

## 4. Levantar el Backend y el Front-end

El sistema requiere dos terminales en ejecución simultánea:

### Terminal 1 — Levantar el Backend (Node.js + Express)
1. Dentro de la carpeta `backend`, instalar las dependencias:
   ```bash
   npm install
   ```
2. (Opcional) Si se desea regenerar los usuarios de prueba con sus contraseñas hasheadas con `bcrypt`:
   ```bash
   npm run seed:usuarios
   ```
3. Iniciar el servidor backend:
   ```bash
   npm run dev
   ```
   El backend quedará corriendo en **`http://localhost:4000`**.

### Terminal 2 — Levantar el Front-end (React + Vite)
1. Abrir una segunda terminal y ubicarse en la carpeta `frontend`:
   ```bash
   cd frontend
   ```
2. Instalar las dependencias y crear `frontend/.env` a partir de `.env.example` (define `VITE_API_URL`, la dirección del backend: en local `http://localhost:4000/api`; en Vercel, la de Render terminada en `/api`). Se acepta también sin `/api` o con barra final. Si se cambia, hay que reiniciar `npm run dev` o volver a desplegar en Vercel, porque Vite la lee al compilar:
   ```bash
   npm install
   cp .env.example .env
   ```
3. Iniciar la aplicación de React:
   ```bash
   npm run dev
   ```
   Abrir en el navegador la dirección indicada por Vite: **`http://localhost:5173`**.

---



## 5. Pruebas de las reglas académicas

Con una base local y el backend corriendo, desde `backend/`:

```bash
npm run test:reglas   # 47 casos: correlatividades, módulo de ingreso, LIBRE, recursadas y egresados
npm run test:api      # 37 casos: todos los endpoints, permisos por rol, bajas y sesión
npm run test:extremos # 673 casos extremos: permisos, datos raros, fechas, límites (nunca 500)
```

Y en `frontend/`:

```bash
npm test              # 32 casos: correlatividades y equivalencias del formulario, días de clase y URL de la API
```

Solo corren contra `localhost` porque crean datos de prueba.
