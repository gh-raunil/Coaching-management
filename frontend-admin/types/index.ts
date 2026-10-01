export interface User {
  id: number;
  email: string;
  name: string;
  role: 'SUPERADMIN' | 'COACHING_ADMIN';
  is_active: boolean;
  coachingId: number;
  coachingName?: string;
  coachingStatus?: 'ACTIVE' | 'SUSPENDED';
}

export interface Student {
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
  created_at: string;
  latest_payment_status?: string;
  total_billed?: number;
  total_paid?: number;
  invoices?: Invoice[];
  payments?: Payment[];
}

export interface InvoiceItem {
  id?: number;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export interface Invoice {
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
  balance_amount?: number;
  payment_status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
  created_at: string;
  student_name?: string;
  registration_no?: string;
  student_contact?: string;
  course_name?: string;
  batch_id?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface Payment {
  id: number;
  coaching_id: number;
  student_id: number;
  invoice_id: number;
  amount: number;
  payment_date: string;
  payment_method: 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'OTHER';
  transaction_reference?: string;
  notes?: string;
  invoice_no?: string;
  student_name?: string;
  registration_no?: string;
}

export interface Course {
  id: number;
  coaching_id: number;
  course_name: string;
  duration?: string;
  default_fee: number;
  is_active: boolean;
  batch_count?: number;
  student_count?: number;
  created_at: string;
}

export interface Batch {
  id: number;
  coaching_id: number;
  course_id?: number | null;
  batch_id_code: string;
  batch_name: string;
  course_name?: string;
  start_date?: string | null;
  end_date?: string | null;
  is_active: boolean;
  student_count?: number;
  created_at: string;
}

export interface CoachingSettings {
  coaching_id: number;
  name: string;
  email: string;
  contact_number: string;
  address_line1: string;
  city: string;
  state: string;
  pincode: string;
  logo_url: string | null;
  website: string | null;
  receipt_header_title?: string | null;
  receipt_footer_msg?: string | null;
  receipt_notes_line1?: string | null;
  receipt_notes_line2?: string | null;
  receipt_notes_line3?: string | null;
  whatsapp_number?: string | null;
  support_email?: string | null;
}
