import { Router } from 'express';
import { superadminController } from '../controllers/superadminController';
import { authenticate, requireSuperAdmin } from '../middleware/auth';

const router = Router();

// Used for superadmin coaching endpoints
router.get('/', authenticate, requireSuperAdmin, superadminController.listCoachings);
router.get('/:id', authenticate, superadminController.getCoaching);

export default router;
