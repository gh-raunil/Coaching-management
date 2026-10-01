import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';
import { authenticate, requireCoachingAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', paymentController.listPayments);
router.post('/', requireCoachingAdmin, paymentController.recordPayment);

export default router;
