import { Router } from 'express';
import { paymentController } from '../controllers/paymentController';
import { studentController } from '../controllers/studentController';
import { authenticate, requireCoachingAdmin } from '../middleware/auth';

const router = Router();

// Coaching Admin Dashboard Overview
router.get('/dashboard-stats', authenticate, requireCoachingAdmin, paymentController.getRevenue);

export default router;
