import { Router } from 'express';

import * as ctrl from '../controllers/transaction.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();
router.use(authMiddleware);

router.get('/', asyncHandler(ctrl.list));

export default router;
