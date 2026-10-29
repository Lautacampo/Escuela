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
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

// 1. Middleware propio: Logger de peticiones
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// 2. CORS y parseo de JSON
app.use(cors(corsOptions));
app.use(express.json());

// 3. Rutas de la API REST
app.use("/api/auth", authRoutes);
app.use("/api/calificaciones", calificacionesRoutes);
app.use("/api/asistencias", asistenciasRoutes);
app.use("/api/docentes", docentesRoutes);
app.use("/api/preceptores", preceptoresRoutes);
app.use("/api/cursos", cursosRoutes);
app.use("/api/alumnos", alumnosRoutes);

// 4. Respuesta 404 para rutas inexistentes
app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// 5. Manejador centralizado de errores
app.use(errorHandler);

export default app;
