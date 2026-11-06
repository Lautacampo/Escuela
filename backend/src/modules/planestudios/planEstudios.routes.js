import { Router } from "express";
import { verificarToken } from "../../middlewares/verificarToken.js";
import { permitirRoles } from "../../middlewares/permitirRoles.js";
import * as ctrl from "./planEstudios.controller.js";

const router = Router();

router.use(verificarToken, permitirRoles("directivo"));

// #35 - Obtiene el plan vigente + planes inactivos (baja lógica)
router.get("/plan-estudio/actual", ctrl.obtenerPlanActual);

// #36 - Crea un nuevo plan asignando materias a cada módulo
router.post("/plan-estudio", ctrl.crearPlanEstudio);

// #37 - Elimina (baja lógica -> estado Inactivo) un plan de estudio
router.delete("/plan-estudio/:id", ctrl.eliminarPlanEstudio);

// #38 y #39 - Materias para el plan de estudio
router.get("/materias", ctrl.listarMaterias);
router.post("/materias", ctrl.crearMateria);

// #40 - Ciclo lectivo activo
router.get("/ciclo-lectivo", ctrl.obtenerCicloLectivo);

export default router;
