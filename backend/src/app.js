import express from "express";
import cors from "cors";
import { corsOptions } from "./config/cors.js";
import authRoutes from "./modules/auth/auth.routes.js";
import calificacionesRoutes from "./modules/calificaciones/calificaciones.routes.js";
import asistenciasRoutes from "./modules/asistencias/asistencias.routes.js";
import docentesRoutes from "./modules/docentes/docentes.routes.js";
import preceptoresRoutes from "./modules/preceptores/preceptores.routes.js";
import cursosRoutes from "./modules/cursos/cursos.routes.js";
import alumnosRoutes from "./modules/alumnos/alumnos.routes.js"
import planEstudiosRoutes from "./modules/planestudios/planEstudios.routes.js";
import reportesRoutes from "./modules/reportes/reportes.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { exigirEsquema } from "./config/esquema.js";

const app = express();

// En Render la API está detrás de un proxy: así req.ip es la IP del cliente
// (la usa el límite de intentos de inicio de sesión).
app.set("trust proxy", 1);

// 1. Middleware propio: Logger de peticiones
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// 2. CORS y parseo de JSON
app.use(cors(corsOptions));
app.use(express.json());

// Verifica una sola vez que la base tenga las columnas de la migración 007.
app.use("/api", exigirEsquema);

// 3. Rutas de la API REST
app.use("/api/auth", authRoutes);
app.use("/api/calificaciones", calificacionesRoutes);
app.use("/api/asistencias", asistenciasRoutes);
app.use("/api/docentes", docentesRoutes);
app.use("/api/preceptores", preceptoresRoutes);
app.use("/api/cursos", cursosRoutes);
app.use("/api/alumnos", alumnosRoutes);
app.use("/api", planEstudiosRoutes);
app.use("/api/reportes", reportesRoutes);


// 4. Respuesta 404 para rutas inexistentes
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// 5. Manejador centralizado de errores
app.use(errorHandler);

export default app;
