import { Request, Response, NextFunction } from 'express';
import { superadminService } from '../services/superadminService';
import {
  registerCoachingSchema,
  updateCoachingSchema,
  addCoachingAdminSchema,
} from '../validators/schemas';
import { sendSuccess, sendError } from '../utils/response';

export const superadminController = {
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await superadminService.getDashboardStats();
      return sendSuccess(res, stats, 'Superadmin dashboard stats retrieved');
    } catch (err) {
      next(err);
    }
  },

  async listCoachings(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const status = req.query.status as string;
      const coachings = await superadminService.listCoachings(search, status);
      return sendSuccess(res, coachings, 'Coachings retrieved');
    } catch (err) {
      next(err);
    }
  },

  async getCoaching(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const coaching = await superadminService.getCoachingDetails(id);
      return sendSuccess(res, coaching, 'Coaching details retrieved');
    } catch (err) {
      next(err);
    }
  },

  async registerCoaching(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = registerCoachingSchema.parse(req.body);
      const result = await superadminService.registerCoaching(validated);
      return sendSuccess(res, result, 'Coaching registered successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async updateCoaching(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const validated = updateCoachingSchema.parse(req.body);
      const updated = await superadminService.updateCoaching(id, validated);
      return sendSuccess(res, updated, 'Coaching updated successfully');
    } catch (err) {
      next(err);
    }
  },

  async setCoachingStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const { status } = req.body;
      if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
        return sendError(res, 'Invalid status. Must be ACTIVE or SUSPENDED.', 400);
      }
      const updated = await superadminService.setCoachingStatus(id, status);
      return sendSuccess(res, updated, `Coaching status updated to ${status}`);
    } catch (err) {
      next(err);
    }
  },

  async addAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const coachingId = parseInt(req.params.id, 10);
      const validated = addCoachingAdminSchema.parse(req.body);
      const admin = await superadminService.addCoachingAdmin(coachingId, validated);
      return sendSuccess(res, admin, 'Coaching admin added successfully', 201);
    } catch (err) {
      next(err);
    }
  },

  async toggleAdminActive(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.userId, 10);
      const { is_active } = req.body;
      if (typeof is_active !== 'boolean') {
        return sendError(res, 'is_active must be a boolean', 400);
      }
      const result = await superadminService.toggleAdminActive(userId, is_active);
      return sendSuccess(res, result, `Admin active status updated to ${is_active}`);
    } catch (err) {
      next(err);
    }
  },

  async resetAdminPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.params.userId, 10);
      const { password } = req.body;
      if (!password || password.length < 6) {
        return sendError(res, 'Password must be at least 6 characters long', 400);
      }
      await superadminService.resetAdminPassword(userId, password);
      return sendSuccess(res, null, 'Admin password reset successfully');
    } catch (err) {
      next(err);
    }
  },

  async removeAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const coachingId = parseInt(req.params.id, 10);
      const userId = parseInt(req.params.userId, 10);
      await superadminService.removeAdmin(coachingId, userId);
      return sendSuccess(res, null, 'Admin removed successfully');
    } catch (err) {
      next(err);
    }
  },

  async getGlobalStudents(req: Request, res: Response, next: NextFunction) {
    try {
      const search = req.query.search as string;
      const course = req.query.course as string;
      const batch = req.query.batch as string;
      const paymentStatus = req.query.paymentStatus as string;
      const coachingId = req.query.coachingId ? parseInt(req.query.coachingId as string, 10) : undefined;

      const students = await superadminService.getGlobalStudents({
        search,
        course,
        batch,
        paymentStatus,
        coachingId,
      });
      return sendSuccess(res, students, 'Global students retrieved');
    } catch (err) {
      next(err);
    }
  },

  async getGlobalRevenue(req: Request, res: Response, next: NextFunction) {
    try {
      const range = (req.query.range as string) || 'THIS_MONTH';
      const customStart = req.query.startDate as string;
      const customEnd = req.query.endDate as string;
      const revenue = await superadminService.getGlobalRevenue(range, customStart, customEnd);
      return sendSuccess(res, revenue, 'Global revenue retrieved');
    } catch (err) {
      next(err);
    }
  },
};
