export interface User {
  id: number;
  email: string;
  name: string;
  role: 'SUPERADMIN' | 'COACHING_ADMIN';
  is_active: boolean;
  coachingId?: number | null;
}

export interface Coaching {
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
  created_at: string;
  updated_at: string;
  student_count?: number;
  admin_count?: number;
  course_count?: number;
  total_revenue?: number;
  assigned_courses?: Course[];
  assigned_course_ids?: number[];
  stats?: {
    student_count: number;
    admin_count: number;
    total_revenue: number;
    total_invoices: number;
    paid_invoices: number;
    pending_invoices: number;
    pending_amount: number;
  };
  admins?: CoachingAdmin[];
}

export interface CoachingAdmin {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: boolean;
  is_primary: boolean;
  created_at: string;
}

export interface Student {
  id: number;
  coaching_id: number;
  coaching_name?: string;
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
  coaching_name?: string;
}

export interface Course {
  id: number;
  coaching_id?: number | null;
  coaching_name?: string;
  coaching_count?: number;
  course_name: string;
  duration?: string;
  default_fee: number;
  is_active: boolean;
  batch_count?: number;
  student_count?: number;
  created_at: string;
}

export interface DashboardStats {
  totalCoachings: number;
  activeCoachings: number;
  totalStudents: number;
  totalAdmins: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalInvoices: number;
  pendingReceivables: number;
  coachingBreakdown: {
    id: number;
    name: string;
    city: string;
    status: 'ACTIVE' | 'SUSPENDED';
    student_count: number;
    admin_count: number;
    total_revenue: number;
  }[];
  monthlyTrend: {
    month: string;
    revenue: number;
  }[];
}
