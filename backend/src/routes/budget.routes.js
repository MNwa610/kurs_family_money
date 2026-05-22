import { Router } from 'express';

import * as ctrl from '../controllers/budget.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { householdMiddleware } from '../middleware/household.middleware.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();
router.use(authMiddleware, householdMiddleware);

router.get('/', asyncHandler(ctrl.list));
router.put('/', asyncHandler(ctrl.upsert));
router.delete('/:id', asyncHandler(ctrl.remove));

export default router;
