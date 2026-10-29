import { Router } from "express";
import * as controller from "./alumnos.controller.js";
import { verificarToken } from "../../middlewares/verificarToken.js";
import { permitirRoles } from "../../middlewares/permitirRoles";

const router = Router();;

router.use(verificarToken, permitirRoles("directivo"));

router.get("/alumnos", controller.listar);
router.get("/alumnos/:id", controller.obtener);
router.post("/alumnos", controller.crear);
router.delete("/alumnos/:id", controller.eliminar);
router.put("/alumnos/:id", controller.actualizar);
router.post("/:id/cursadas", controller.crearCursada);

export default router;