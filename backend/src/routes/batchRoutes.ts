import { Router } from 'express';
import { courseBatchController } from '../controllers/courseBatchController';
import { authenticate, requireCoachingAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', courseBatchController.getBatches);
router.post('/', requireCoachingAdmin, courseBatchController.createBatch);
router.put('/:id', requireCoachingAdmin, courseBatchController.updateBatch);

export default router;
