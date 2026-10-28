import { Router } from "express";
import * as controller from "./cursos.controller.js";
import { verificarToken } from "../../middlewares/verificarToken.js";
import { permitirRoles } from "../../middlewares/permitirRoles";

const router = Router();

const lectura = permitirRoles("directivo", "preceptor", "docente");
const gestion = permitirRoles("directivo");

router.use(verificarToken);

router.get("/ciclos", lectura, controller.listarCiclos);
router.post("/ciclos", gestion, controller.crearCiclo);

router.get("/", lectura, controller.listar);
router.get("/:id", lectura, controller.obtener);
router.post("/", gestion, controller.crear);
router.patch("/:id", gestion, controller.actualizar);

router.post("/:id/modulos", gestion, controller.agregarModulo);
router.delete("/:id/modulos/:moduloId", gestion, controller.quitarModulo);

export default router;