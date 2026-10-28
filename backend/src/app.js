import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import calificacionesRoutes from "./modules/calificaciones/calificaciones.routes.js";
import cursosRoutes from "./modules/cursos/cursos.routes.js";
import alumnosRoutes from "./modules/alumnos/alumnos.routes.js"
import { errorHandler } from "./middlewares/errorHandler.js";

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/calificaciones", calificacionesRoutes);
app.use("/api/cursos", cursosRoutes);
app.use("/api/alumnos", alumnosRoutes);

app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use(errorHandler);

export default app;