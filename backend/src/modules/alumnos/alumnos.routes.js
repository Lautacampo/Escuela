import { Router } from "express";
import * as controller from "./alumnos.controller.js";
import { verificarToken } from "../../middlewares/verificarToken.js";
import { permitirRoles } from "../../middlewares/permitirRoles.js";

const router = Router();;

router.use(verificarToken, permitirRoles("directivo"));

router.get("/", controller.listar);
router.get("/:id", controller.obtener);
router.post("/", controller.crear);
router.delete("/:id", controller.eliminar);
router.put("/:id", controller.actualizar);
router.post("/:id/cursadas", controller.crearCursada);

export default router;