import { Router } from "express";
import { verificarToken } from "../../middlewares/verificarToken.js";
import { permitirRoles } from "../../middlewares/permitirRoles.js";
import * as ctrl from "./planEstudios.controller.js";

const router = Router();

// Este router se monta en /api. La protección va en cada ruta (y no con
// router.use) para que un pedido a cualquier otra ruta /api/... no pase por
// acá y reciba su 404 en vez de un 401 o 403.
const soloDirectivo = [verificarToken, permitirRoles("directivo")];

// #35 - Obtiene el plan vigente + planes inactivos (baja lógica)
router.get("/plan-estudio/actual", soloDirectivo, ctrl.obtenerPlanActual);

// #36 - Crea un nuevo plan asignando materias a cada módulo
router.post("/plan-estudio", soloDirectivo, ctrl.crearPlanEstudio);

// #37 - Elimina (baja lógica -> estado Inactivo) un plan de estudio
router.delete("/plan-estudio/:id", soloDirectivo, ctrl.eliminarPlanEstudio);

// Reactiva un plan inactivo (vuelve a estado Vigente)
router.patch("/plan-estudio/:id/reactivar", soloDirectivo, ctrl.reactivarPlanEstudio);

// #38 y #39 - Materias para el plan de estudio
router.get("/materias", soloDirectivo, ctrl.listarMaterias);
router.post("/materias", soloDirectivo, ctrl.crearMateria);

// #40 - Ciclo lectivo activo
router.get("/ciclo-lectivo", soloDirectivo, ctrl.obtenerCicloLectivo);
router.post("/ciclo-lectivo", soloDirectivo, ctrl.crearCicloLectivo);

export default router;
