import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/authService';
import { loginSchema, changePasswordSchema } from '../validators/schemas';
import { setAuthCookie, clearAuthCookie } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validated = loginSchema.parse(req.body);
      const { token, user } = await authService.login(validated.email, validated.password);
      setAuthCookie(res, token);
      return sendSuccess(res, { user, token }, 'Logged in successfully');
    } catch (err: any) {
      if (err.message && err.message.includes('Invalid') || err.message?.includes('suspended') || err.message?.includes('deactivated')) {
        return sendError(res, err.message, 401);
      }
      next(err);
    }
  },

  async logout(req: Request, res: Response) {
    clearAuthCookie(res);
    return sendSuccess(res, null, 'Logged out successfully');
  },

  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return sendError(res, 'Not authenticated', 401);
      }
      const user = await authService.getMe(req.user.userId);
      return sendSuccess(res, user, 'User profile fetched');
    } catch (err) {
      next(err);
    }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return sendError(res, 'Not authenticated', 401);
      }
      const validated = changePasswordSchema.parse(req.body);
      await authService.changePassword(req.user.userId, validated.currentPassword, validated.newPassword);
      return sendSuccess(res, null, 'Password changed successfully');
    } catch (err: any) {
      if (err.message && err.message.includes('Incorrect')) {
        return sendError(res, err.message, 400);
      }
      next(err);
    }
  },
};
