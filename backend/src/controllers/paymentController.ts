import { Request, Response, NextFunction } from 'express';
import { paymentService } from '../services/paymentService';
import { recordPaymentSchema } from '../validators/schemas';
import { sendSuccess, sendError } from '../utils/response';

export const paymentController = {
  async listPayments(req: Request, res: Response, next: NextFunction) {
    try {
      const coachingId = req.user?.role === 'SUPERADMIN'
        ? (req.query.coachingId ? parseInt(req.query.coachingId as string, 10) : null)
        : req.user!.coachingId;

      const studentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined;
      const invoiceId = req.query.invoiceId ? parseInt(req.query.invoiceId as string, 10) : undefined;
      const startDate = req.query.startDate as string;
      const endDate = req.query.endDate as string;

      const payments = await paymentService.listPayments({
        coachingId,
        studentId,
        invoiceId,
        startDate,
        endDate,
      });

      return sendSuccess(res, payments, 'Payments retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async recordPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const coachingId = req.user!.coachingId;
      if (!coachingId) {
        return sendError(res, 'User has no assigned coaching institute', 400);
      }

      const validated = recordPaymentSchema.parse(req.body);
      const result = await paymentService.recordPayment(coachingId, validated);
      return sendSuccess(res, result, 'Payment recorded successfully', 201);
    } catch (err: any) {
      if (err.message && (err.message.includes('exceeds') || err.message.includes('already fully paid') || err.message.includes('not found'))) {
        return sendError(res, err.message, 400);
      }
      next(err);
    }
  },

  async getRevenue(req: Request, res: Response, next: NextFunction) {
    try {
      const coachingId = req.user?.role === 'SUPERADMIN'
        ? (req.query.coachingId ? parseInt(req.query.coachingId as string, 10) : null)
        : req.user!.coachingId;

      const range = (req.query.range as string) || 'THIS_MONTH';
      const customStart = req.query.startDate as string;
      const customEnd = req.query.endDate as string;

      const stats = await paymentService.getRevenueAnalytics(coachingId, range, customStart, customEnd);
      return sendSuccess(res, stats, 'Revenue analytics retrieved successfully');
    } catch (err) {
      next(err);
    }
  },
};
