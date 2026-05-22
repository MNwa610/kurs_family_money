import { Router } from 'express';

import * as ctrl from '../controllers/household.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { householdMiddleware, requireOwner } from '../middleware/household.middleware.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();
router.use(authMiddleware);

router.post('/create', asyncHandler(ctrl.setupCreateHousehold));
router.post('/invites/accept', asyncHandler(ctrl.acceptInvite));

router.use(householdMiddleware);

router.get('/', asyncHandler(ctrl.getHousehold));
router.patch('/', requireOwner, asyncHandler(ctrl.updateHousehold));
router.post('/invites', requireOwner, asyncHandler(ctrl.createInvite));
router.delete('/invites/:id', requireOwner, asyncHandler(ctrl.cancelInvite));
router.delete('/members/:id', requireOwner, asyncHandler(ctrl.removeMember));
router.post('/recurring/process', asyncHandler(ctrl.processRecurring));

export default router;
