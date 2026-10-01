import { db } from '../config/db';

export interface CoachingRow {
  id: number;
  name: string;
  email: string;
  contact_number: string;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  logo_url: string | null;
  website: string | null;
  status: 'ACTIVE' | 'SUSPENDED';
  created_at: Date;
  updated_at: Date;
}

export const coachingRepository = {
  async findAll(search?: string, status?: string) {
    let query = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM students s WHERE s.coaching_id = c.id AND s.is_active = true) AS student_count,
        (SELECT COUNT(*) FROM coaching_admins ca WHERE ca.coaching_id = c.id) AS admin_count,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.coaching_id = c.id) AS total_revenue
      FROM coachings c
      WHERE 1=1
    `;
    const params: any[] = [];

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(c.name) LIKE $${params.length} OR LOWER(c.city) LIKE $${params.length} OR LOWER(c.email) LIKE $${params.length})`;
    }

    if (status && status !== 'ALL') {
      params.push(status);
      query += ` AND c.status = $${params.length}`;
    }

    query += ` ORDER BY c.created_at DESC`;

    const res = await db.query(query, params);
    return res.rows.map((row) => ({
      ...row,
      student_count: parseInt(row.student_count || '0', 10),
      admin_count: parseInt(row.admin_count || '0', 10),
      total_revenue: parseFloat(row.total_revenue || '0'),
    }));
  },

  async findById(id: number) {
    const res = await db.query<CoachingRow>(`SELECT * FROM coachings WHERE id = $1`, [id]);
    if (res.rows.length === 0) return null;

    const coaching = res.rows[0];

    // Fetch detailed statistics
    const statsRes = await db.query(
      `
      SELECT 
        (SELECT COUNT(*) FROM students WHERE coaching_id = $1 AND is_active = true) AS student_count,
        (SELECT COUNT(*) FROM coaching_admins WHERE coaching_id = $1) AS admin_count,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE coaching_id = $1) AS total_revenue,
        (SELECT COUNT(*) FROM invoices WHERE coaching_id = $1) AS total_invoices,
        (SELECT COUNT(*) FROM invoices WHERE coaching_id = $1 AND payment_status = 'PAID') AS paid_invoices,
        (SELECT COUNT(*) FROM invoices WHERE coaching_id = $1 AND payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'OVERDUE')) AS pending_invoices,
        (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM invoices WHERE coaching_id = $1 AND payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'OVERDUE')) AS pending_amount
      `,
      [id]
    );

    const stats = statsRes.rows[0];

    return {
      ...coaching,
      stats: {
        student_count: parseInt(stats.student_count || '0', 10),
        admin_count: parseInt(stats.admin_count || '0', 10),
        total_revenue: parseFloat(stats.total_revenue || '0'),
        total_invoices: parseInt(stats.total_invoices || '0', 10),
        paid_invoices: parseInt(stats.paid_invoices || '0', 10),
        pending_invoices: parseInt(stats.pending_invoices || '0', 10),
        pending_amount: parseFloat(stats.pending_amount || '0'),
      },
    };
  },

  async create(data: Partial<CoachingRow>, client = db): Promise<CoachingRow> {
    const res = await client.query<CoachingRow>(
      `INSERT INTO coachings (name, email, contact_number, address_line1, city, state, pincode, website, logo_url, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        data.name,
        data.email,
        data.contact_number,
        data.address_line1,
        data.city,
        data.state,
        data.pincode,
        data.website || null,
        data.logo_url || null,
        data.status || 'ACTIVE',
      ]
    );
    return res.rows[0];
  },

  async update(id: number, data: Partial<CoachingRow>): Promise<CoachingRow | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowedKeys: (keyof CoachingRow)[] = [
      'name', 'email', 'contact_number', 'address_line1', 'city', 'state', 'pincode', 'website', 'logo_url', 'status'
    ];

    for (const key of allowedKeys) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) {
      return (await this.findById(id)) as any;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const res = await db.query<CoachingRow>(
      `UPDATE coachings SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    return res.rows[0] || null;
  },

  async updateStatus(id: number, status: 'ACTIVE' | 'SUSPENDED'): Promise<CoachingRow | null> {
    const res = await db.query<CoachingRow>(
      `UPDATE coachings SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, id]
    );
    return res.rows[0] || null;
  },

  async getGlobalStats() {
    const countsRes = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM coachings) AS total_coachings,
        (SELECT COUNT(*) FROM coachings WHERE status = 'ACTIVE') AS active_coachings,
        (SELECT COUNT(*) FROM students WHERE is_active = true) AS total_students,
        (SELECT COUNT(*) FROM users WHERE role = 'COACHING_ADMIN' AND is_active = true) AS total_admins,
        (SELECT COALESCE(SUM(amount), 0) FROM payments) AS total_revenue,
        (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE payment_date >= CURRENT_DATE - INTERVAL '30 days') AS monthly_revenue,
        (SELECT COUNT(*) FROM invoices) AS total_invoices,
        (SELECT COALESCE(SUM(total_amount - paid_amount), 0) FROM invoices WHERE payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'OVERDUE')) AS pending_receivables
    `);

    const row = countsRes.rows[0];

    // Coaching breakdown
    const coachingBreakdownRes = await db.query(`
      SELECT 
        c.id,
        c.name,
        c.city,
        c.status,
        (SELECT COUNT(*) FROM students s WHERE s.coaching_id = c.id AND s.is_active = true) AS student_count,
        (SELECT COUNT(*) FROM coaching_admins ca WHERE ca.coaching_id = c.id) AS admin_count,
        (SELECT COALESCE(SUM(p.amount), 0) FROM payments p WHERE p.coaching_id = c.id) AS total_revenue
      FROM coachings c
      ORDER BY total_revenue DESC
    `);

    // Monthly revenue trend (last 6 months)
    const monthlyTrendRes = await db.query(`
      SELECT 
        TO_CHAR(payment_date, 'Mon YYYY') AS month,
        DATE_TRUNC('month', payment_date) AS month_date,
        COALESCE(SUM(amount), 0) AS revenue
      FROM payments
      WHERE payment_date >= CURRENT_DATE - INTERVAL '6 months'
      GROUP BY TO_CHAR(payment_date, 'Mon YYYY'), DATE_TRUNC('month', payment_date)
      ORDER BY month_date ASC
    `);

    return {
      totalCoachings: parseInt(row.total_coachings || '0', 10),
      activeCoachings: parseInt(row.active_coachings || '0', 10),
      totalStudents: parseInt(row.total_students || '0', 10),
      totalAdmins: parseInt(row.total_admins || '0', 10),
      totalRevenue: parseFloat(row.total_revenue || '0'),
      monthlyRevenue: parseFloat(row.monthly_revenue || '0'),
      totalInvoices: parseInt(row.total_invoices || '0', 10),
      pendingReceivables: parseFloat(row.pending_receivables || '0'),
      coachingBreakdown: coachingBreakdownRes.rows.map((b) => ({
        ...b,
        student_count: parseInt(b.student_count || '0', 10),
        admin_count: parseInt(b.admin_count || '0', 10),
        total_revenue: parseFloat(b.total_revenue || '0'),
      })),
      monthlyTrend: monthlyTrendRes.rows.map((t) => ({
        month: t.month,
        revenue: parseFloat(t.revenue || '0'),
      })),
    };
  },
};
