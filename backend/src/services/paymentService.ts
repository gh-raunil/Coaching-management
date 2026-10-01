import { db } from '../config/db';
import { paymentRepository } from '../repositories/paymentRepository';
import { invoiceRepository } from '../repositories/invoiceRepository';

export const paymentService = {
  async listPayments(params: {
    coachingId?: number | null;
    studentId?: number;
    invoiceId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    return await paymentRepository.findAll(params);
  },

  async recordPayment(
    coachingId: number,
    data: {
      invoice_id: number;
      amount: number;
      payment_date: string;
      payment_method: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
      transaction_reference?: string | null;
      notes?: string | null;
    }
  ) {
    if (data.amount <= 0) {
      throw new Error('Payment amount must be greater than zero.');
    }

    return await db.transaction(async (client) => {
      // 1. Fetch and Lock Invoice row for update to prevent race conditions
      const invRes = await client.query(
        `SELECT id, coaching_id, student_id, total_amount, paid_amount, payment_status
         FROM invoices
         WHERE id = $1 AND coaching_id = $2
         FOR UPDATE`,
        [data.invoice_id, coachingId]
      );

      if (invRes.rows.length === 0) {
        throw new Error('Invoice not found or does not belong to this coaching institute.');
      }

      const invoice = invRes.rows[0];
      const totalAmount = parseFloat(invoice.total_amount);
      const currentPaid = parseFloat(invoice.paid_amount);
      const remainingBalance = Math.max(totalAmount - currentPaid, 0);

      if (remainingBalance <= 0) {
        throw new Error('This invoice is already fully paid.');
      }

      if (data.amount > remainingBalance + 0.01) { // 0.01 tolerance for floating point
        throw new Error(
          `Payment amount (₹${data.amount.toFixed(2)}) exceeds the remaining balance (₹${remainingBalance.toFixed(2)}).`
        );
      }

      // 2. Insert Payment record
      const payRes = await client.query(
        `INSERT INTO payments (
          coaching_id, student_id, invoice_id, amount,
          payment_date, payment_method, transaction_reference, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          coachingId,
          invoice.student_id,
          invoice.id,
          data.amount,
          data.payment_date,
          data.payment_method,
          data.transaction_reference || '',
          data.notes || '',
        ]
      );
      const payment = payRes.rows[0];

      // 3. Update Invoice with new paid_amount and status
      const newPaid = currentPaid + data.amount;
      let newStatus = 'PARTIALLY_PAID';
      if (newPaid >= totalAmount - 0.01) {
        newStatus = 'PAID';
      }

      const updatedInvRes = await client.query(
        `UPDATE invoices 
         SET paid_amount = $1, payment_status = $2, updated_at = CURRENT_TIMESTAMP
         WHERE id = $3
         RETURNING *`,
        [newPaid, newStatus, invoice.id]
      );

      return {
        payment: {
          ...payment,
          amount: parseFloat(payment.amount),
        },
        invoice: {
          ...updatedInvRes.rows[0],
          total_amount: parseFloat(updatedInvRes.rows[0].total_amount),
          paid_amount: parseFloat(updatedInvRes.rows[0].paid_amount),
          balance_amount: Math.max(
            parseFloat(updatedInvRes.rows[0].total_amount) - parseFloat(updatedInvRes.rows[0].paid_amount),
            0
          ),
        },
      };
    });
  },

  async getRevenueAnalytics(
    coachingId?: number | null,
    range: string = 'THIS_MONTH',
    customStart?: string,
    customEnd?: string
  ) {
    return await paymentRepository.getRevenueStats(coachingId, range, customStart, customEnd);
  },
};
