import { Router } from "express";
import * as controller from "./calificaciones.controller.js";
import { verificarToken } from "../../middlewares/verificarToken.js";
import { permitirRoles } from "../../middlewares/permitirRoles.js";

const router = Router();

router.use(verificarToken, permitirRoles("directivo", "docente"));

router.get("/modulos", controller.listarModulos);
router.get("/modulos/:moduloId/divisiones", controller.listarDivisiones);
router.get("/modulos/:moduloId/divisiones/:division", controller.obtenerGrilla);
router.put("/", controller.actualizar);

export default router;