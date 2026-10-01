import { db } from '../config/db';
import { studentRepository } from '../repositories/studentRepository';
import { invoiceRepository } from '../repositories/invoiceRepository';

export interface CreateStudentPayload {
  // Invoice fields
  invoice_no: string;
  invoice_date: string;
  due_date: string;
  // Student fields
  student_name: string;
  father_name?: string | null;
  registration_no: string;
  batch_id?: string | null;
  course_name?: string | null;
  address_line1?: string | null;
  city_state_pin?: string | null;
  contact_no?: string | null;
  // Payment / Item fields
  description: string;
  quantity: number;
  rate: number;
  discount: number;
}

export const studentService = {
  async listStudents(params: {
    coachingId?: number | null;
    search?: string;
    course?: string;
    batch?: string;
    paymentStatus?: string;
  }) {
    return await studentRepository.findAll(params);
  },

  async getStudentDetails(id: number, coachingId?: number | null) {
    const student = await studentRepository.findById(id, coachingId);
    if (!student) throw new Error('Student not found');
    return student;
  },

  async createStudentWithInvoice(coachingId: number, data: CreateStudentPayload) {
    // 1. Check duplicate registration number within coaching
    const isDupReg = await studentRepository.checkDuplicateRegNo(coachingId, data.registration_no);
    if (isDupReg) {
      throw new Error(`Registration number "${data.registration_no}" is already assigned in this institute.`);
    }

    // 2. Check duplicate invoice number within coaching
    const isDupInv = await invoiceRepository.checkDuplicateInvoiceNo(coachingId, data.invoice_no);
    if (isDupInv) {
      throw new Error(`Invoice number "${data.invoice_no}" already exists in this institute.`);
    }

    // 3. Authoritative Backend Calculation
    const qty = Math.max(1, parseInt(data.quantity as any, 10) || 1);
    const rate = Math.max(0, parseFloat(data.rate as any) || 0);
    const discount = Math.max(0, parseFloat(data.discount as any) || 0);
    const amount = qty * rate;
    const subtotal = amount;
    const totalAmount = Math.max(subtotal - discount, 0);

    // 4. Perform atomic transaction
    return await db.transaction(async (client) => {
      // Step A: Insert Student
      const studentRes = await client.query(
        `INSERT INTO students (
          coaching_id, registration_no, student_name, father_name,
          batch_id, course_name, address_line1, city_state_pin,
          contact_no, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)
        RETURNING *`,
        [
          coachingId,
          data.registration_no.trim(),
          data.student_name.trim(),
          data.father_name?.trim() || '',
          data.batch_id?.trim() || '',
          data.course_name?.trim() || '',
          data.address_line1?.trim() || '',
          data.city_state_pin?.trim() || '',
          data.contact_no?.trim() || '',
        ]
      );
      const student = studentRes.rows[0];

      // Step B: Insert Invoice (Initially UNPAID with 0 paid_amount)
      const invoiceRes = await client.query(
        `INSERT INTO invoices (
          coaching_id, student_id, invoice_no, invoice_date, due_date,
          subtotal, discount, total_amount, paid_amount, payment_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 0, 'UNPAID')
        RETURNING *`,
        [
          coachingId,
          student.id,
          data.invoice_no.trim(),
          data.invoice_date,
          data.due_date,
          subtotal,
          discount,
          totalAmount,
        ]
      );
      const invoice = invoiceRes.rows[0];

      // Step C: Insert Line Item
      const itemRes = await client.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, rate, amount)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [
          invoice.id,
          data.description.trim(),
          qty,
          rate,
          amount,
        ]
      );
      const item = itemRes.rows[0];

      return {
        student,
        invoice: {
          ...invoice,
          subtotal: parseFloat(invoice.subtotal),
          discount: parseFloat(invoice.discount),
          total_amount: parseFloat(invoice.total_amount),
          paid_amount: 0,
          items: [item],
        },
      };
    });
  },

  async updateStudent(id: number, coachingId: number, data: any) {
    if (data.registration_no) {
      const isDup = await studentRepository.checkDuplicateRegNo(coachingId, data.registration_no, id);
      if (isDup) {
        throw new Error(`Registration number "${data.registration_no}" is already used by another student.`);
      }
    }

    const updated = await studentRepository.update(id, coachingId, data);
    if (!updated) throw new Error('Student not found or unauthorized');
    return updated;
  },

  async toggleStudentStatus(id: number, coachingId: number, isActive: boolean) {
    const updated = await studentRepository.update(id, coachingId, { is_active: isActive });
    if (!updated) throw new Error('Student not found');
    return updated;
  },
};
