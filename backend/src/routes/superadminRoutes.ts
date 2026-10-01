import { Router } from 'express';
import { superadminController } from '../controllers/superadminController';
import { authenticate, requireSuperAdmin } from '../middleware/auth';

const router = Router();

// Protect all routes in this router with Superadmin role
router.use(authenticate, requireSuperAdmin);

router.get('/dashboard-stats', superadminController.getDashboardStats);
router.get('/coachings', superadminController.listCoachings);
router.get('/coachings/:id', superadminController.getCoaching);
router.post('/coachings', superadminController.registerCoaching);
router.put('/coachings/:id', superadminController.updateCoaching);
router.patch('/coachings/:id/status', superadminController.setCoachingStatus);

// Coaching Admins Management
router.post('/coachings/:id/admins', superadminController.addAdmin);
router.patch('/admins/:userId/status', superadminController.toggleAdminActive);
router.post('/admins/:userId/reset-password', superadminController.resetAdminPassword);
router.delete('/coachings/:id/admins/:userId', superadminController.removeAdmin);

// Global lists
router.get('/students', superadminController.getGlobalStudents);
router.get('/revenue', superadminController.getGlobalRevenue);

export default router;
