import { Router } from 'express';
import { courseBatchController } from '../controllers/courseBatchController';
import { authenticate, requireSuperAdmin } from '../middleware/auth';

const router = Router();

router.use(authenticate);

// Get courses: Superadmin gets all (or by ?coachingId); Coaching Admin gets only allotted courses
router.get('/', courseBatchController.getCourses);

// Course addition and deletion power strictly with SUPERADMIN
router.post('/', requireSuperAdmin, courseBatchController.createCourse);
router.put('/:id', requireSuperAdmin, courseBatchController.updateCourse);
router.delete('/:id', requireSuperAdmin, courseBatchController.deleteCourse);

export default router;
