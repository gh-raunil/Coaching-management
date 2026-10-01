import { invoiceRepository } from '../repositories/invoiceRepository';

export const invoiceService = {
  async listInvoices(params: {
    coachingId?: number | null;
    studentId?: number;
    paymentStatus?: string;
    search?: string;
  }) {
    return await invoiceRepository.findAll(params);
  },

  async getInvoiceDetails(id: number, coachingId?: number | null) {
    const invoice = await invoiceRepository.findById(id, coachingId);
    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  },
};
