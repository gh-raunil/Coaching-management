import { db } from '../config/db';

export interface InvoiceRow {
  id: number;
  coaching_id: number;
  student_id: number;
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  subtotal: number;
  discount: number;
  total_amount: number;
  paid_amount: number;
  payment_status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  created_at: Date;
  updated_at: Date;
}

export interface InvoiceItemRow {
  id: number;
  invoice_id: number;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export const invoiceRepository = {
  async findAll({
    coachingId,
    studentId,
    paymentStatus,
    search,
  }: {
    coachingId?: number | null;
    studentId?: number;
    paymentStatus?: string;
    search?: string;
  }) {
    let query = `
      SELECT 
        i.*,
        s.student_name,
        s.registration_no,
        s.contact_no AS student_contact,
        s.course_name,
        s.batch_id,
        c.name AS coaching_name
      FROM invoices i
      JOIN students s ON i.student_id = s.id
      JOIN coachings c ON i.coaching_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (coachingId) {
      params.push(coachingId);
      query += ` AND i.coaching_id = $${params.length}`;
    }

    if (studentId) {
      params.push(studentId);
      query += ` AND i.student_id = $${params.length}`;
    }

    if (paymentStatus && paymentStatus !== 'ALL') {
      params.push(paymentStatus);
      query += ` AND i.payment_status = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim().toLowerCase()}%`);
      query += ` AND (LOWER(i.invoice_no) LIKE $${params.length} OR LOWER(s.student_name) LIKE $${params.length} OR LOWER(s.registration_no) LIKE $${params.length})`;
    }

    query += ` ORDER BY i.created_at DESC`;

    const res = await db.query(query, params);
    return res.rows.map((row) => ({
      ...row,
      subtotal: parseFloat(row.subtotal),
      discount: parseFloat(row.discount),
      total_amount: parseFloat(row.total_amount),
      paid_amount: parseFloat(row.paid_amount),
      balance_amount: Math.max(parseFloat(row.total_amount) - parseFloat(row.paid_amount), 0),
    }));
  },

  async findById(id: number, coachingId?: number | null) {
    let query = `
      SELECT 
        i.*,
        s.student_name,
        s.father_name,
        s.registration_no,
        s.batch_id,
        s.course_name,
        s.address_line1 AS student_address,
        s.city_state_pin AS student_city_state_pin,
        s.contact_no AS student_contact,
        c.name AS coaching_name,
        c.email AS coaching_email,
        c.contact_number AS coaching_contact,
        c.address_line1 AS coaching_address,
        c.city AS coaching_city,
        c.state AS coaching_state,
        c.pincode AS coaching_pincode,
        c.website AS coaching_website,
        c.logo_url AS coaching_logo,
        cs.receipt_header_title,
        cs.receipt_footer_msg,
        cs.receipt_notes_line1,
        cs.receipt_notes_line2,
        cs.receipt_notes_line3,
        cs.whatsapp_number AS coaching_whatsapp,
        cs.support_email AS coaching_support_email
      FROM invoices i
      JOIN students s ON i.student_id = s.id
      JOIN coachings c ON i.coaching_id = c.id
      LEFT JOIN coaching_settings cs ON cs.coaching_id = c.id
      WHERE i.id = $1
    `;
    const params: any[] = [id];

    if (coachingId) {
      params.push(coachingId);
      query += ` AND i.coaching_id = $2`;
    }

    const res = await db.query(query, params);
    if (res.rows.length === 0) return null;

    const invoice = res.rows[0];

    // Fetch invoice items
    const itemsRes = await db.query<InvoiceItemRow>(
      `SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY id ASC`,
      [id]
    );

    // Fetch payments made against this invoice
    const paymentsRes = await db.query(
      `SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date ASC`,
      [id]
    );

    return {
      ...invoice,
      subtotal: parseFloat(invoice.subtotal),
      discount: parseFloat(invoice.discount),
      total_amount: parseFloat(invoice.total_amount),
      paid_amount: parseFloat(invoice.paid_amount),
      balance_amount: Math.max(parseFloat(invoice.total_amount) - parseFloat(invoice.paid_amount), 0),
      items: itemsRes.rows.map((it) => ({
        ...it,
        rate: parseFloat(it.rate as any),
        amount: parseFloat(it.amount as any),
      })),
      payments: paymentsRes.rows.map((p) => ({
        ...p,
        amount: parseFloat(p.amount),
      })),
    };
  },

  async create(data: Partial<InvoiceRow>, client = db): Promise<InvoiceRow> {
    const res = await client.query<InvoiceRow>(
      `INSERT INTO invoices (
        coaching_id, student_id, invoice_no, invoice_date, due_date,
        subtotal, discount, total_amount, paid_amount, payment_status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        data.coaching_id,
        data.student_id,
        data.invoice_no,
        data.invoice_date,
        data.due_date,
        data.subtotal || 0,
        data.discount || 0,
        data.total_amount || 0,
        data.paid_amount || 0,
        data.payment_status || 'UNPAID',
      ]
    );
    return res.rows[0];
  },

  async createItem(data: Partial<InvoiceItemRow>, client = db): Promise<InvoiceItemRow> {
    const res = await client.query<InvoiceItemRow>(
      `INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.invoice_id,
        data.description,
        data.quantity || 1,
        data.rate || 0,
        data.amount || 0,
      ]
    );
    return res.rows[0];
  },

  async updatePaymentProgress(
    invoiceId: number,
    additionalAmount: number,
    client = db
  ): Promise<InvoiceRow> {
    // Lock row for update
    const invRes = await client.query<InvoiceRow>(
      `SELECT * FROM invoices WHERE id = $1 FOR UPDATE`,
      [invoiceId]
    );

    if (invRes.rows.length === 0) {
      throw new Error('Invoice not found');
    }

    const inv = invRes.rows[0];
    const newPaidAmount = parseFloat(inv.paid_amount as any) + additionalAmount;
    const totalAmount = parseFloat(inv.total_amount as any);

    let newStatus: InvoiceRow['payment_status'] = 'PARTIALLY_PAID';
    if (newPaidAmount >= totalAmount) {
      newStatus = 'PAID';
    } else if (newPaidAmount <= 0) {
      newStatus = 'UNPAID';
    }

    const updateRes = await client.query<InvoiceRow>(
      `UPDATE invoices 
       SET paid_amount = $1, payment_status = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [newPaidAmount, newStatus, invoiceId]
    );

    return updateRes.rows[0];
  },

  async checkDuplicateInvoiceNo(coachingId: number, invoiceNo: string, excludeInvoiceId?: number): Promise<boolean> {
    let query = `SELECT id FROM invoices WHERE coaching_id = $1 AND LOWER(invoice_no) = LOWER($2)`;
    const params: any[] = [coachingId, invoiceNo];
    if (excludeInvoiceId) {
      params.push(excludeInvoiceId);
      query += ` AND id != $3`;
    }
    const res = await db.query(query, params);
    return res.rows.length > 0;
  },
};
