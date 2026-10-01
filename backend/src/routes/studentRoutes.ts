import { Router } from 'express';
import { studentController } from '../controllers/studentController';
import { authenticate, requireCoachingAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Listing and detail can be accessed by both Superadmin (global) and Coaching Admin (isolated)
router.get('/', studentController.listStudents);
router.get('/:id', studentController.getStudent);

// Creation and modification requires Coaching Admin permissions for tenant integrity
router.post('/', requireCoachingAdmin, studentController.createStudentWithInvoice);
router.put('/:id', requireCoachingAdmin, studentController.updateStudent);
router.patch('/:id/status', requireCoachingAdmin, studentController.toggleStatus);

export default router;
