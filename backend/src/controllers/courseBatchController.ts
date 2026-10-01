import { Request, Response, NextFunction } from 'express';
import { courseBatchService } from '../services/courseBatchService';
import { courseSchema, batchSchema } from '../validators/schemas';
import { sendSuccess, sendError } from '../utils/response';

export const courseBatchController = {
  async getCourses(req: Request, res: Response, next: NextFunction) {
    try {
      const coachingId = req.user?.role === 'SUPERADMIN'
        ? (req.query.coachingId ? parseInt(req.query.coachingId as string, 10) : null)
        : req.user!.coachingId;

      const courses = await courseBatchService.listCourses(coachingId);
      return sendSuccess(res, courses, 'Courses retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async createCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = courseSchema.parse(req.body);
      const coachingId = req.user?.role === 'SUPERADMIN'
        ? (validated.coaching_id || (req.query.coachingId ? parseInt(req.query.coachingId as string, 10) : null))
        : req.user!.coachingId;

      if (!coachingId) {
        return sendError(res, 'Target coaching institute is required to allot course', 400);
      }

      const course = await courseBatchService.createCourse({
        coaching_id: coachingId,
        course_name: validated.course_name,
        duration: validated.duration || undefined,
        default_fee: validated.default_fee,
        is_active: validated.is_active,
      });
      return sendSuccess(res, course, 'Course allotted to institute successfully', 201);
    } catch (err: any) {
      if (err.message && err.message.includes('unique') || err.code === '23505') {
        return sendError(res, 'This course already exists for the selected coaching institute', 400);
      }
      next(err);
    }
  },

  async updateCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await courseBatchService.updateCourse(id, req.body);
      return sendSuccess(res, updated, 'Course updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async deleteCourse(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      await courseBatchService.deleteCourse(id);
      return sendSuccess(res, null, 'Course deleted successfully');
    } catch (err: any) {
      if (err.code === '23503') {
        return sendError(res, 'Cannot delete course as it is linked to existing student records or batches', 400);
      }
      next(err);
    }
  },

  async getBatches(req: Request, res: Response, next: NextFunction) {
    try {
      const coachingId = req.user?.role === 'SUPERADMIN'
        ? (req.query.coachingId ? parseInt(req.query.coachingId as string, 10) : null)
        : req.user!.coachingId;

      const courseId = req.query.courseId ? parseInt(req.query.courseId as string, 10) : undefined;
      const batches = await courseBatchService.listBatches(coachingId, courseId);
      return sendSuccess(res, batches, 'Batches retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async createBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const coachingId = req.user!.coachingId;
      if (!coachingId) return sendError(res, 'No coaching assigned', 400);

      const validated = batchSchema.parse(req.body);
      const batch = await courseBatchService.createBatch(coachingId, validated);
      return sendSuccess(res, batch, 'Batch created successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateBatch(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const coachingId = req.user!.coachingId!;
      const updated = await courseBatchService.updateBatch(id, coachingId, req.body);
      return sendSuccess(res, updated, 'Batch updated successfully');
    } catch (err) {
      next(err);
    }
  },
};
