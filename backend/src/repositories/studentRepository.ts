import { db } from '../config/db';

export interface StudentRow {
  id: number;
  coaching_id: number;
  registration_no: string;
  student_name: string;
  father_name: string | null;
  batch_id: string | null;
  course_name: string | null;
  address_line1: string | null;
  city_state_pin: string | null;
  contact_no: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const studentRepository = {
  async findAll({
    coachingId,
    search,
    course,
    batch,
    paymentStatus,
  }: {
    coachingId?: number | null;
    search?: string;
    course?: string;
    batch?: string;
    paymentStatus?: string;
  }) {
    let query = `
      SELECT 
        s.*,
        c.name AS coaching_name,
        COALESCE(
          (
            SELECT i.payment_status 
            FROM invoices i 
            WHERE i.student_id = s.id 
            ORDER BY i.created_at DESC 
            LIMIT 1
          ),
          'NO_INVOICE'
        ) AS latest_payment_status,
        (
          SELECT COALESCE(SUM(i.total_amount), 0)
          FROM invoices i
          WHERE i.student_id = s.id
        ) AS total_billed,
        (
          SELECT COALESCE(SUM(i.paid_amount), 0)
          FROM invoices i
          WHERE i.student_id = s.id
        ) AS total_paid
      FROM students s
      JOIN coachings c ON s.coaching_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (coachingId) {
      params.push(coachingId);
      query += ` AND s.coaching_id = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(s.student_name) LIKE $${params.length} OR LOWER(s.registration_no) LIKE $${params.length} OR LOWER(s.contact_no) LIKE $${params.length})`;
    }

    if (course && course !== 'ALL') {
      params.push(course);
      query += ` AND s.course_name = $${params.length}`;
    }

    if (batch && batch !== 'ALL') {
      params.push(batch);
      query += ` AND s.batch_id = $${params.length}`;
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      params.push(paymentStatus);
      query += ` AND (
        SELECT i.payment_status 
        FROM invoices i 
        WHERE i.student_id = s.id 
        ORDER BY i.created_at DESC 
        LIMIT 1
      ) = $${params.length}`;
    }

    query += ` ORDER BY s.created_at DESC`;

    const res = await db.query(query, params);
    return res.rows.map((row) => ({
      ...row,
      total_billed: parseFloat(row.total_billed || '0'),
      total_paid: parseFloat(row.total_paid || '0'),
    }));
  },

  async findById(id: number, coachingId?: number | null) {
    let query = `
      SELECT 
        s.*,
        c.name AS coaching_name,
        c.email AS coaching_email,
        c.contact_number AS coaching_contact,
        c.address_line1 AS coaching_address,
        c.city AS coaching_city,
        c.state AS coaching_state,
        c.pincode AS coaching_pincode,
        c.logo_url AS coaching_logo
      FROM students s
      JOIN coachings c ON s.coaching_id = c.id
      WHERE s.id = $1
    `;
    const params: any[] = [id];

    if (coachingId) {
      params.push(coachingId);
      query += ` AND s.coaching_id = $2`;
    }

    const res = await db.query(query, params);
    if (res.rows.length === 0) return null;

    const student = res.rows[0];

    // Fetch invoices for this student
    const invoicesRes = await db.query(
      `SELECT * FROM invoices WHERE student_id = $1 ORDER BY created_at DESC`,
      [id]
    );

    // Fetch payments for this student
    const paymentsRes = await db.query(
      `SELECT p.*, i.invoice_no 
       FROM payments p
       JOIN invoices i ON p.invoice_id = i.id
       WHERE p.student_id = $1 
       ORDER BY p.payment_date DESC, p.created_at DESC`,
      [id]
    );

    return {
      ...student,
      invoices: invoicesRes.rows.map((i) => ({
        ...i,
        subtotal: parseFloat(i.subtotal),
        discount: parseFloat(i.discount),
        total_amount: parseFloat(i.total_amount),
        paid_amount: parseFloat(i.paid_amount),
        balance_amount: Math.max(parseFloat(i.total_amount) - parseFloat(i.paid_amount), 0),
      })),
      payments: paymentsRes.rows.map((p) => ({
        ...p,
        amount: parseFloat(p.amount),
      })),
    };
  },

  async create(data: Partial<StudentRow>, client = db): Promise<StudentRow> {
    const res = await client.query<StudentRow>(
      `INSERT INTO students (
        coaching_id, registration_no, student_name, father_name,
        batch_id, course_name, address_line1, city_state_pin,
        contact_no, is_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
      RETURNING *`,
      [
        data.coaching_id,
        data.registration_no,
        data.student_name,
        data.father_name || '',
        data.batch_id || '',
        data.course_name || '',
        data.address_line1 || '',
        data.city_state_pin || '',
        data.contact_no || '',
      ]
    );
    return res.rows[0];
  },

  async update(id: number, coachingId: number, data: Partial<StudentRow>): Promise<StudentRow | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowed: (keyof StudentRow)[] = [
      'student_name', 'father_name', 'registration_no', 'batch_id', 'course_name',
      'address_line1', 'city_state_pin', 'contact_no', 'is_active'
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = $${idx++}`);
        values.push(data[key]);
      }
    }

    if (fields.length === 0) {
      return (await this.findById(id, coachingId)) as any;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id, coachingId);

    const res = await db.query<StudentRow>(
      `UPDATE students 
       SET ${fields.join(', ')} 
       WHERE id = $${idx++} AND coaching_id = $${idx}
       RETURNING *`,
      values
    );

    return res.rows[0] || null;
  },

  async checkDuplicateRegNo(coachingId: number, registrationNo: string, excludeStudentId?: number): Promise<boolean> {
    let query = `SELECT id FROM students WHERE coaching_id = $1 AND LOWER(registration_no) = LOWER($2)`;
    const params: any[] = [coachingId, registrationNo];
    if (excludeStudentId) {
      params.push(excludeStudentId);
      query += ` AND id != $3`;
    }
    const res = await db.query(query, params);
    return res.rows.length > 0;
  },
};
