import { Request, Response, NextFunction } from 'express';
import { settingsService } from '../services/settingsService';
import { settingsSchema } from '../validators/schemas';
import { sendSuccess, sendError } from '../utils/response';

export const settingsController = {
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const coachingId = req.user!.coachingId;
      if (!coachingId) return sendError(res, 'No coaching assigned', 400);

      const settings = await settingsService.getSettings(coachingId);
      return sendSuccess(res, settings, 'Settings retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const coachingId = req.user!.coachingId;
      if (!coachingId) return sendError(res, 'No coaching assigned', 400);

      const validated = settingsSchema.parse(req.body);
      const updated = await settingsService.updateSettings(coachingId, validated);
      return sendSuccess(res, updated, 'Settings updated successfully');
    } catch (err) {
      next(err);
    }
  },
};
