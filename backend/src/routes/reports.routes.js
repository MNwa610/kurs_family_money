import { Router } from 'express';

import * as ctrl from '../controllers/reports.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();
router.use(authMiddleware);

router.get('/summary', asyncHandler(ctrl.getSummary));
router.get('/export', asyncHandler(ctrl.exportSummary));

export default router;
