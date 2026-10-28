import { Router } from 'express';
import * as controller from './auth.controller.js';
import { verificarToken } from '../../middlewares/verificarToken.js';

const router = Router();

router.post('/registro',verificarToken, controller.registro);         
router.post('/login', controller.login);                // pública
router.get('/perfil', verificarToken, controller.perfil); // protegida

export default router;