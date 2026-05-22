import { Router } from 'express';

import * as ctrl from '../controllers/reports.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { householdMiddleware } from '../middleware/household.middleware.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();
router.use(authMiddleware, householdMiddleware);

router.get('/summary', asyncHandler(ctrl.getSummary));
router.get('/export', asyncHandler(ctrl.exportSummary));

export default router;
