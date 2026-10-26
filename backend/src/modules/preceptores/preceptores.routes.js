import {Routes} from "express";
import * as controlador from "./preceptores.controller.js"
import { verificarToken } from "../../middlewares/verificarToken.js"
import { permitirRoles } from "../../middlewares/permitirRoles.js"

const router = Router();

router.use(verificarToken, permitirRoles("directivo"));

router.get("/", )