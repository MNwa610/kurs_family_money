import { Router } from 'express';
import authRoutes from './auth.routes.js';
import familyMemberRoutes from './familyMember.routes.js';

const router = Router();

router.get('/', (_req, res) => {
  res.status(200).json({
    service: 'family-budget-api',
    endpoints: [
      'POST /api/auth/register',
      'POST /api/auth/login',
      'GET /api/family-members (Authorization: Bearer …)',
      'POST /api/family-members (Authorization: Bearer …)',
    ],
  });
});

router.use('/auth', authRoutes);
router.use('/family-members', familyMemberRoutes);

export default router;
