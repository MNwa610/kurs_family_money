import { Router } from 'express';

import * as authController from '../controllers/auth.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/register', (_req, res) => {
  res.status(405).set('Allow', 'POST').json({
    message: 'Нужен POST и JSON: { "email", "password", "name?" }',
  });
});

router.get('/login', (_req, res) => {
  res.status(405).set('Allow', 'POST').json({
    message: 'Нужен POST и JSON: { "email", "password" }',
  });
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authMiddleware, authController.me);
router.patch('/me', authMiddleware, authController.updateProfile);

export default router;
