import { Router } from 'express';
import authRoutes from './authRoutes';
import superadminRoutes from './superadminRoutes';
import coachingRoutes from './coachingRoutes';
import adminRoutes from './adminRoutes';
import studentRoutes from './studentRoutes';
import invoiceRoutes from './invoiceRoutes';
import paymentRoutes from './paymentRoutes';
import courseRoutes from './courseRoutes';
import batchRoutes from './batchRoutes';
import revenueRoutes from './revenueRoutes';
import settingsRoutes from './settingsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/superadmin', superadminRoutes);
router.use('/coachings', coachingRoutes);
router.use('/admins', adminRoutes);
router.use('/students', studentRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/payments', paymentRoutes);
router.use('/courses', courseRoutes);
router.use('/batches', batchRoutes);
router.use('/revenue', revenueRoutes);
router.use('/settings', settingsRoutes);

export default router;
