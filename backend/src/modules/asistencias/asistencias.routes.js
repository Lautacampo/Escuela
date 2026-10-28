import { Router } from "express";
import * as controller from "./asistencias.controller.js";
import { verificarToken } from "../../middlewares/verificarToken.js";
import { permitirRoles } from "../../middlewares/permitirRoles.js";

const router = Router();

// Todas las rutas de asistencias requieren token válido y rol directivo o preceptor
router.use(verificarToken, permitirRoles("directivo", "preceptor"));

// Endpoints para la vista de tarjetas y planilla del Frontend
router.get("/modulos", controller.listarModulos);
router.get("/modulos/:moduloId/divisiones", controller.listarDivisiones);
router.get(
  "/modulos/:moduloId/divisiones/:division",
  controller.obtenerPlanilla,
);

// Endpoints REST sobre el recurso asistencias (ABM y consulta)
router.get("/", controller.listar);
router.post("/", controller.registrar);
router.put("/:id", controller.actualizar);
router.delete("/:id", controller.eliminar);

export default router;
