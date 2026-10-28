import { Router } from "express";
import * as controller from "./docentes.controller.js";
import { verificarToken } from "../../middlewares/verificarToken.js";
import { permitirRoles } from "../../middlewares/permitirRoles.js";

const router = Router();

// Solo el rol directivo puede gestionar el ABM de docentes y sus asignaciones
router.use(verificarToken, permitirRoles("directivo"));

router.get("/modulos", controller.listarModulos);
router.get("/", controller.listar);
router.get("/:id", controller.obtenerPorId);
router.post("/", controller.crear);
router.put("/:id", controller.actualizar);
router.delete("/:id", controller.eliminar);

export default router;
