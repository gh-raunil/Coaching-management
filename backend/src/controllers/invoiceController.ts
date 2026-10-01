import { Request, Response, NextFunction } from 'express';
import { invoiceService } from '../services/invoiceService';
import { sendSuccess, sendError } from '../utils/response';

export const invoiceController = {
  async listInvoices(req: Request, res: Response, next: NextFunction) {
    try {
      const coachingId = req.user?.role === 'SUPERADMIN'
        ? (req.query.coachingId ? parseInt(req.query.coachingId as string, 10) : null)
        : req.user!.coachingId;

      const studentId = req.query.studentId ? parseInt(req.query.studentId as string, 10) : undefined;
      const paymentStatus = req.query.paymentStatus as string;
      const search = req.query.search as string;

      const invoices = await invoiceService.listInvoices({
        coachingId,
        studentId,
        paymentStatus,
        search,
      });

      return sendSuccess(res, invoices, 'Invoices retrieved successfully');
    } catch (err) {
      next(err);
    }
  },

  async getInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id, 10);
      const coachingId = req.user?.role === 'SUPERADMIN' ? null : req.user!.coachingId;
      const invoice = await invoiceService.getInvoiceDetails(id, coachingId);
      return sendSuccess(res, invoice, 'Invoice details retrieved successfully');
    } catch (err: any) {
      if (err.message && err.message.includes('not found')) {
        return sendError(res, err.message, 404);
      }
      next(err);
    }
  },
};
