import { Router } from 'express';
import { settingsController } from '../controllers/settingsController';
import { authenticate, requireCoachingAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate, requireCoachingAdmin);

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

export default router;
