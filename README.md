# Sistema de Gestión Académica — Colegio Tomás Baras
### Desarrollado por: Becerra Santiago, Campo Lautaro y Gallardo Máximo.

Proyecto de frontend para el Colegio para Adultos Nº 3 “Tomás Baras”.

La aplicación incluye una página institucional y un panel de gestión académica. En esta etapa se utilizan datos de ejemplo almacenados en un archivo JSON y funcionalidades simuladas. El backend definitivo se desarrollará posteriormente.

## Tecnologías utilizadas

- React.
- Vite.
- JavaScript.
- HTML y CSS.
- React Router.
- JSON Server para simular una API.

## 1. Requisitos previos

Para ejecutar el proyecto se necesita:

- Node.js en una versión LTS vigente utilizamos la version v24.20.0, con npm utilizamos la version 11.19.0.
- Un navegador web.
- Una herramienta para extraer archivos `.rar`.

Se utiliza Visual Studio Code 

Node.js se puede descargar desde:

https://nodejs.org/en/download

Después de instalarlo, abrir una terminal y comprobar:

node --version
npm --version

Ambos comandos deben mostrar un número de versión.


## 2. Extraer y abrir el proyecto

1. Extraer completamente el archivo `.rar` en una carpeta de la computadora.
2. Abrir la carpeta extraída.
3. Ubicar la carpeta del frontend que contiene `package.json`.
4. Abrir una terminal en esa carpeta.

En Visual Studio Code:

1. Seleccionar **Archivo → Abrir carpeta**.
2. Elegir la carpeta que contiene `package.json`.
3. Seleccionar **Terminal → Nueva terminal**.


## 3. Instalar las dependencias si no estan instaladas previamente

Ejecutar:

```bash
npm install --include=dev
```

Esperar a que termine la instalación. 
Este comando instala las dependencias del proyecto, incluidas las de desarrollo, y genera la carpeta `node_modules`.
Este paso se realiza la primera vez que se prepara el proyecto en una computadora. Debe repetirse si se elimina `node_modules` o cambian las dependencias.

## 4. Iniciar el frontend
En la primera terminal, ejecutar:

```bash
npm run dev
```

Vite mostrará la dirección donde está disponible la aplicación, normalmente:

text: http://localhost:5173/

Abrir en el navegador la dirección que indique la terminal.

Si el puerto 5173 está ocupado, Vite puede indicar otro puerto.

**Mantener esta terminal abierta y el proceso en ejecución.**

## 5. Iniciar el servidor de datos

Abrir una segunda terminal en la misma carpeta del frontend, sin detener la primera.

En Visual Studio Code abrir una nueva terminal **Terminal → Nueva terminal**.

Atencion al aplicar el comando se tiene que asegurar de no estar ubicado dentro de carpeta frontend, sino en la carpeta de la Escuela. Si estamos en la carpeta frontend simplemente ejecutar cd ../ para volver atras
Ejecutar:

```bash
npx json-server ./database/db.json --port 3000
```

Este proceso utiliza el archivo `database/db.json` para ofrecer una API local en:

text
http://localhost:3000

**Mantener también esta segunda terminal abierta y el proceso en ejecución.**

El puerto 3000 debe coincidir con la dirección configurada en los servicios del frontend.

## 6. Comprobar que los datos están disponibles

Abrir esta dirección en el navegador:

http://localhost:3000/alumnos

Debe aparecer una lista de alumnos en formato JSON.

También están disponibles las siguientes rutas:

- http://localhost:3000/docentes
- http://localhost:3000/preceptores
- http://localhost:3000/materias
- http://localhost:3000/modulos
- http://localhost:3000/asistencias
- http://localhost:3000/calificaciones

Una vez iniciado el servidor de datos, volver a la aplicación y recargar la página.

## 7. Ingresar a la aplicación

1. Abrir la dirección indicada por Vite cuando ejecutamos npm run dev.
2. Desde la página principal, acceder al inicio de sesión.
3. Completar los campos del formulario respetando sus validaciones.
4. Presionar el botón de inicio de sesión para acceder al panel.

En esta versión, el inicio de sesión es simulado: no se validan las credenciales contra una base de datos real.

El frontend guarda una marca en `localStorage` para representar la sesión iniciada. Al cerrar sesión, esa marca se elimina.

Esta implementación se utiliza para demostrar la navegación del frontend. La autenticación y los permisos definitivos quedan pendientes del backend.

## 8. Funcionamiento de esta entrega

La aplicación necesita dos procesos en ejecución en la terminal:

 Frontend: `npm run dev`. Ejecuta la interfaz React mediante Vite. 
 API simulada : `npx json-server ./database/db.json --port 3000. Proporciona los datos del archivo JSON. 

Las pantallas que consultan la API necesitan que JSON Server esté funcionando.

Reportes y Plan de Estudios contienen datos definidos directamente en sus componentes, por lo que pueden mostrarse aunque JSON Server esté detenido.

Algunas acciones se presentan únicamente de forma visual. Por ejemplo, los botones de crear y eliminar planes todavía no ejecutan operaciones de algunas funcionalidades como plan de estudios y reportes,  el formulario de consultas valida los campos pero no envía el mensaje.

Las operaciones de escritura que estén conectadas a JSON Server pueden modificar el archivo `database/db.json`.


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
2. Instalar las dependencias:
   ```bash
   npm install
   ```
3. Iniciar la aplicación de React:
   ```bash
   npm run dev
   ```
   Abrir en el navegador la dirección indicada por Vite: **`http://localhost:5173`**.

---

## 5. Usuario de prueba

Para iniciar sesión desde el formulario de Login en el front-end (`http://localhost:5173/login`) o probar los endpoints protegidos en Postman, utilizar las siguientes credenciales (la contraseña está almacenada hasheada con `bcrypt` en la tabla `usuarios`):

| Rol | Correo electrónico (`email`) | Contraseña (`password`) | Permisos en el sistema |
| :--- | :--- | :--- | :--- |
| **Directivo** | `director@escuela.com` | `1234` | Acceso total (ABM de preceptores, docentes, alumnos, calificaciones, asistencias, plan de estudio y reportes) |
| **Docente** | `docente@escuela.com` | `1234` | Gestión de calificaciones de sus módulos, divisiones y materias asignadas |
| **Preceptor** | `preceptor@escuela.com` | `1234` | Gestión de asistencias de los cursos y divisiones asignados a su cargo |
