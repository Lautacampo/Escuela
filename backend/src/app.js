import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import authRoutes from "./modules/auth/auth.routes.js";
import calificacionesRoutes from "./modules/calificaciones/calificaciones.routes.js";
import preceptoresRoutes from "./modules/preceptores/preceptores.routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";


const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/calificaciones", calificacionesRoutes);
app.use("/api/preceptores", preceptoresRoutes);



app.use((req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

app.use(errorHandler);

export default app;