import { db } from '../config/db';

export interface PaymentRow {
  id: number;
  coaching_id: number;
  student_id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
  transaction_reference: string | null;
  notes: string | null;
  created_at: Date;
}

export const paymentRepository = {
  async findAll({
    coachingId,
    studentId,
    invoiceId,
    startDate,
    endDate,
  }: {
    coachingId?: number | null;
    studentId?: number;
    invoiceId?: number;
    startDate?: string;
    endDate?: string;
  }) {
    let query = `
      SELECT 
        p.*,
        s.student_name,
        s.registration_no,
        i.invoice_no,
        i.total_amount AS invoice_total,
        c.name AS coaching_name
      FROM payments p
      JOIN students s ON p.student_id = s.id
      JOIN invoices i ON p.invoice_id = i.id
      JOIN coachings c ON p.coaching_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (coachingId) {
      params.push(coachingId);
      query += ` AND p.coaching_id = $${params.length}`;
    }

    if (studentId) {
      params.push(studentId);
      query += ` AND p.student_id = $${params.length}`;
    }

    if (invoiceId) {
      params.push(invoiceId);
      query += ` AND p.invoice_id = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND p.payment_date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND p.payment_date <= $${params.length}`;
    }

    query += ` ORDER BY p.payment_date DESC, p.created_at DESC`;

    const res = await db.query(query, params);
    return res.rows.map((r) => ({
      ...r,
      amount: parseFloat(r.amount),
      invoice_total: parseFloat(r.invoice_total),
    }));
  },

  async create(data: Partial<PaymentRow>, client = db): Promise<PaymentRow> {
    const res = await client.query<PaymentRow>(
      `INSERT INTO payments (
        coaching_id, student_id, invoice_id, amount, payment_date,
        payment_method, transaction_reference, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        data.coaching_id,
        data.student_id,
        data.invoice_id,
        data.amount,
        data.payment_date,
        data.payment_method,
        data.transaction_reference || '',
        data.notes || '',
      ]
    );
    return res.rows[0];
  },

  async getRevenueStats(coachingId?: number | null, range: string = 'THIS_MONTH', customStart?: string, customEnd?: string) {
    let dateFilter = '';
    const params: any[] = [];

    if (coachingId) {
      params.push(coachingId);
      dateFilter += ` AND p.coaching_id = $${params.length}`;
    }

    if (range === 'TODAY') {
      dateFilter += ` AND p.payment_date = CURRENT_DATE`;
    } else if (range === 'THIS_WEEK') {
      dateFilter += ` AND p.payment_date >= DATE_TRUNC('week', CURRENT_DATE)`;
    } else if (range === 'THIS_MONTH') {
      dateFilter += ` AND p.payment_date >= DATE_TRUNC('month', CURRENT_DATE)`;
    } else if (range === 'THIS_YEAR') {
      dateFilter += ` AND p.payment_date >= DATE_TRUNC('year', CURRENT_DATE)`;
    } else if (range === 'CUSTOM' && customStart && customEnd) {
      params.push(customStart, customEnd);
      dateFilter += ` AND p.payment_date BETWEEN $${params.length - 1} AND $${params.length}`;
    }

    // 1. Total revenue collected in this range
    const totalRes = await db.query(
      `SELECT COALESCE(SUM(p.amount), 0) AS total_revenue, COUNT(*) AS payment_count
       FROM payments p
       WHERE 1=1 ${dateFilter}`,
      params
    );

    // 2. Invoice metrics
    let invFilter = '';
    const invParams: any[] = [];
    if (coachingId) {
      invParams.push(coachingId);
      invFilter += ` WHERE coaching_id = $1`;
    }

    const invStatsRes = await db.query(
      `SELECT 
        COUNT(*) AS total_invoices,
        COUNT(*) FILTER (WHERE payment_status = 'PAID') AS paid_invoices,
        COUNT(*) FILTER (WHERE payment_status = 'PARTIALLY_PAID') AS partially_paid_invoices,
        COUNT(*) FILTER (WHERE payment_status = 'UNPAID') AS unpaid_invoices,
        COALESCE(SUM(total_amount), 0) AS total_invoiced,
        COALESCE(SUM(paid_amount), 0) AS total_collected,
        COALESCE(SUM(total_amount - paid_amount), 0) AS total_pending
       FROM invoices
       ${invFilter}`,
      invParams
    );

    // 3. Revenue Trend by Day or Month
    const trendRes = await db.query(
      `SELECT 
        TO_CHAR(p.payment_date, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(p.amount), 0) AS amount
       FROM payments p
       WHERE 1=1 ${dateFilter}
       GROUP BY TO_CHAR(p.payment_date, 'YYYY-MM-DD'), p.payment_date
       ORDER BY p.payment_date ASC`,
      params
    );

    // 4. Revenue by Method
    const methodRes = await db.query(
      `SELECT 
        p.payment_method,
        COALESCE(SUM(p.amount), 0) AS total_amount,
        COUNT(*) AS count
       FROM payments p
       WHERE 1=1 ${dateFilter}
       GROUP BY p.payment_method
       ORDER BY total_amount DESC`,
      params
    );

    return {
      revenue: parseFloat(totalRes.rows[0]?.total_revenue || '0'),
      paymentCount: parseInt(totalRes.rows[0]?.payment_count || '0', 10),
      invoices: {
        total: parseInt(invStatsRes.rows[0]?.total_invoices || '0', 10),
        paid: parseInt(invStatsRes.rows[0]?.paid_invoices || '0', 10),
        partiallyPaid: parseInt(invStatsRes.rows[0]?.partially_paid_invoices || '0', 10),
        unpaid: parseInt(invStatsRes.rows[0]?.unpaid_invoices || '0', 10),
        totalInvoiced: parseFloat(invStatsRes.rows[0]?.total_invoiced || '0'),
        totalCollected: parseFloat(invStatsRes.rows[0]?.total_collected || '0'),
        totalPending: parseFloat(invStatsRes.rows[0]?.total_pending || '0'),
      },
      trend: trendRes.rows.map((t) => ({
        date: t.date,
        amount: parseFloat(t.amount),
      })),
      byMethod: methodRes.rows.map((m) => ({
        method: m.payment_method,
        amount: parseFloat(m.total_amount),
        count: parseInt(m.count, 10),
      })),
    };
  },
};
