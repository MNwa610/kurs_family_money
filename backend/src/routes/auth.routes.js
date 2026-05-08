import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';

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

export default router;
