import { Router } from 'express';

import * as ctrl from '../controllers/notifications.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();
router.use(authMiddleware);

router.get('/', asyncHandler(ctrl.list));
router.delete('/invites/:id', asyncHandler(ctrl.declineInvite));

export default router;
