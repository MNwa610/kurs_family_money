import { Router } from 'express';

import * as ctrl from '../controllers/transaction.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { householdMiddleware } from '../middleware/household.middleware.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();
router.use(authMiddleware, householdMiddleware);

router.get('/', asyncHandler(ctrl.list));

export default router;
