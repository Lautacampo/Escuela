import { Router } from 'express';
import * as controller from './auth.controller.js';
import { verificarToken } from '../../middlewares/verificarToken.js';
import { permitirRoles } from '../../middlewares/permitirRoles.js';

const router = Router();

router.post('/registro',verificarToken, permitirRoles('directivo'), controller.registro);         
router.post('/login', controller.login);                // pública
router.get('/perfil', verificarToken, controller.perfil); // protegida

export default router;