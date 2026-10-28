import { Router } from "express";
import * as controller from "./alumnos.controller.js";
import { verificarToken } from "../../middlewares/verificarToken.js";
import { permitirRoles } from "../../middlewares/permitirRoles";

const router = Router();

const lectura = permitirRoles("directivo", "docente");
const gestion = permitirRoles("directivo");

router.use(verificarToken);

router.get("/alumnos", lectura, controller.listarAlumnos);
router.get("/alumnos/:id", lectura, controller.obtenerAlumno);
router.post("/alumnos", gestion, controller.crearAlumno);
router.delete("/alumnos/:id", gestion, controller.crearAlumno);
router.put("/alumnos/:id", gestion, controller.actualizar);
router.post("/:id/matricular", gestion, controller.matricular);

export default router;