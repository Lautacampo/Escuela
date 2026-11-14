import { Router } from "express";
import { verificarToken } from "../../middlewares/verificarToken.js";
import { permitirRoles } from "../../middlewares/permitirRoles.js";
import * as ctrl from "./reportes.controller.js";

const router = Router();

router.use(verificarToken, permitirRoles("directivo"));

// #41 - GET /api/reportes/inasistencias
router.get("/inasistencias", ctrl.obtenerInasistencias);

// #42 - GET /api/reportes/desaprobaciones
router.get("/desaprobaciones", ctrl.obtenerDesaprobaciones);

export default router;
