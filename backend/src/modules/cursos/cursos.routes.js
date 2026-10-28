import { Router } from "express";
import * as controller from "./cursos.controller.js";
import { verificarToken } from "../../middlewares/verificarToken.js";
import { permitirRoles } from "../../middlewares/permitirRoles";

const router = Router();

router.use(verificarToken, permitirRoles("directivo", "preceptor"));

router.get("/", controller.listar);

export default router;