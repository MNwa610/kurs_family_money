import { Router } from 'express';

import * as ctrl from '../controllers/catalog.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { householdMiddleware } from '../middleware/household.middleware.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();
router.use(authMiddleware, householdMiddleware);

router.get('/', asyncHandler(ctrl.listExpenseCategories));
router.post('/', asyncHandler(ctrl.createExpenseCategory));
router.delete('/:id', asyncHandler(ctrl.removeExpenseCategory));

export default router;
