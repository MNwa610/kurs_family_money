import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import * as familyMemberController from '../controllers/familyMember.controller.js';

const router = Router();

router.use(authMiddleware);

router.get('/', familyMemberController.list);
router.post('/', familyMemberController.create);

export default router;
