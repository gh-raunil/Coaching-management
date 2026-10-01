import { Request, Response, NextFunction } from 'express';
import { studentService } from '../services/studentService';
import { createStudentWithInvoiceSchema, updateStudentSchema } from '../validators/schemas';
import { sendSuccess, sendError } from '../utils/response';

export const studentController = {
  async listStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const coachingId = req.user?.role === 'SUPERADMIN' 
        ? (req.query.coachingId ? parseInt(req.query.coachingId as string, 10) : null)
        : req.user!.coachingId;

      const search = req.query.search as string;
      const course = req.query.course as string;
      const batch = req.query.batch as string;
      const paymentStatus = req.query.paymentStatus as string;

      const students = await studentService.listStudents({
        coachingId,
        search,
        course,
        batch,
        paymentStatus,
      });

      return sendSuccess(res, students, 'Students retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async getStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const coachingId = req.user?.role === 'SUPERADMIN' ? null : req.user!.coachingId;
      const student = await studentService.getStudentDetails(id, coachingId);
      return sendSuccess(res, student, 'Student details retrieved');
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        return sendError(res, err.message, 404);
      }
      next(err);
    }
  },

  async createStudentWithInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const coachingId = req.user!.coachingId;
      if (!coachingId) {
        return sendError(res, 'User has no assigned coaching institute', 400);
      }

      const validated = createStudentWithInvoiceSchema.parse(req.body);
      const result = await studentService.createStudentWithInvoice(coachingId, validated);
      return sendSuccess(res, result, 'Student registered and invoice generated successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const coachingId = req.user!.coachingId!;
      const validated = updateStudentSchema.parse(req.body);
      const updated = await studentService.updateStudent(id, coachingId, validated);
      return sendSuccess(res, updated, 'Student updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async toggleStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const coachingId = req.user!.coachingId!;
      const { is_active } = req.body;
      if (typeof is_active !== 'boolean') {
        return sendError(res, 'is_active must be a boolean', 400);
      }
      const updated = await studentService.toggleStudentStatus(id, coachingId, is_active);
      return sendSuccess(res, updated, `Student status updated to ${is_active ? 'Active' : 'Inactive'}`);
    } catch (err) {
      next(err);
    }
  },
};
