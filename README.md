# Sistema de Gestión Académica — Colegio Tomás Baras

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

npm install --include=dev

Esperar a que termine la instalación. 
Este comando instala las dependencias del proyecto, incluidas las de desarrollo, y genera la carpeta `node_modules`.
Este paso se realiza la primera vez que se prepara el proyecto en una computadora. Debe repetirse si se elimina `node_modules` o cambian las dependencias.

## 4. Iniciar el frontend
En la primera terminal, ejecutar:

npm run dev

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

npx json-server ./database/db.json --port 3000

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

- http://localhost:3001/docentes
- http://localhost:3001/preceptores
- http://localhost:3001/materias
- http://localhost:3001/modulos
- http://localhost:3001/asistencias
- http://localhost:3001/calificaciones

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

La aplicación necesita dos procesos en ejecución:

| Proceso|                  |  Comando |                                         | Función |

| Frontend     | `npm run dev`                                    | Ejecuta la interfaz React mediante Vite. |
| API simulada | `npx json-server ./database/db.json --port 3000` | Proporciona los datos del archivo JSON. |

Las pantallas que consultan la API necesitan que JSON Server esté funcionando.

Reportes y Plan de Estudios contienen datos definidos directamente en sus componentes, por lo que pueden mostrarse aunque JSON Server esté detenido.

Algunas acciones se presentan únicamente de forma visual. Por ejemplo, los botones de crear y eliminar planes todavía no ejecutan operaciones de algunas funcionalidades como plan de estudios y reportes,  el formulario de consultas valida los campos pero no envía el mensaje.

Las operaciones de escritura que estén conectadas a JSON Server pueden modificar el archivo `database/db.json`.


