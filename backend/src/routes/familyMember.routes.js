import { Router } from 'express';

import * as ctrl from '../controllers/familyMember.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { householdMiddleware } from '../middleware/household.middleware.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();
router.use(authMiddleware, householdMiddleware);

router.get('/', asyncHandler(ctrl.list));
router.post('/', asyncHandler(ctrl.create));
router.get('/:id', asyncHandler(ctrl.getOne));
router.patch('/:id', asyncHandler(ctrl.update));
router.delete('/:id', asyncHandler(ctrl.remove));

export default router;
