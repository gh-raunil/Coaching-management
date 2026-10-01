import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const registerCoachingSchema = z.object({
  name: z.string().min(2, 'Coaching name is required'),
  email: z.string().email('Valid coaching email is required'),
  contact_number: z.string().min(5, 'Valid contact number is required'),
  address_line1: z.string().min(3, 'Address line 1 is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().min(3, 'Pincode is required'),
  website: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  admin_name: z.string().min(2, 'Admin name is required'),
  admin_email: z.string().email('Valid admin email is required'),
  admin_password: z.string().min(6, 'Admin password must be at least 6 characters'),
});

export const updateCoachingSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  contact_number: z.string().min(5).optional(),
  address_line1: z.string().min(3).optional(),
  city: z.string().min(2).optional(),
  state: z.string().min(2).optional(),
  pincode: z.string().min(3).optional(),
  website: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'SUSPENDED']).optional(),
});

export const addCoachingAdminSchema = z.object({
  name: z.string().min(2, 'Admin name is required'),
  email: z.string().email('Valid admin email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  is_primary: z.boolean().optional().default(false),
});

export const createStudentWithInvoiceSchema = z.object({
  // Invoice fields
  invoice_no: z.string().min(1, 'Invoice number is required'),
  invoice_date: z.string().min(4, 'Invoice date is required'),
  due_date: z.string().min(4, 'Due date is required'),
  // Student fields
  student_name: z.string().min(2, 'Student name is required'),
  father_name: z.string().optional().nullable().default(''),
  registration_no: z.string().min(1, 'Registration number is required'),
  batch_id: z.string().optional().nullable().default(''),
  course_name: z.string().optional().nullable().default(''),
  address_line1: z.string().optional().nullable().default(''),
  city_state_pin: z.string().optional().nullable().default(''),
  contact_no: z.string().optional().nullable().default(''),
  // Payment / Item fields
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1').default(1),
  rate: z.coerce.number().min(0, 'Rate cannot be negative').default(0),
  discount: z.coerce.number().min(0, 'Discount cannot be negative').default(0),
});

export const updateStudentSchema = z.object({
  student_name: z.string().min(2).optional(),
  father_name: z.string().optional().nullable(),
  registration_no: z.string().min(1).optional(),
  batch_id: z.string().optional().nullable(),
  course_name: z.string().optional().nullable(),
  address_line1: z.string().optional().nullable(),
  city_state_pin: z.string().optional().nullable(),
  contact_no: z.string().optional().nullable(),
  is_active: z.boolean().optional(),
});

export const recordPaymentSchema = z.object({
  invoice_id: z.coerce.number().int().positive('Valid invoice ID required'),
  amount: z.coerce.number().positive('Payment amount must be greater than 0'),
  payment_date: z.string().min(4, 'Payment date is required'),
  payment_method: z.enum(['CASH', 'UPI', 'BANK_TRANSFER', 'OTHER']),
  transaction_reference: z.string().optional().nullable().default(''),
  notes: z.string().optional().nullable().default(''),
});

export const courseSchema = z.object({
  coaching_id: z.coerce.number().int().positive('Valid coaching ID is required').optional(),
  course_name: z.string().min(2, 'Course name is required'),
  duration: z.string().optional().nullable().default(''),
  default_fee: z.coerce.number().min(0).default(0),
  is_active: z.boolean().optional().default(true),
});

export const batchSchema = z.object({
  course_id: z.coerce.number().int().positive().optional().nullable(),
  batch_id_code: z.string().min(2, 'Batch ID/code is required'),
  batch_name: z.string().min(2, 'Batch name is required'),
  start_date: z.string().optional().nullable(),
  end_date: z.string().optional().nullable(),
  is_active: z.boolean().optional().default(true),
});

export const settingsSchema = z.object({
  receipt_header_title: z.string().optional().nullable(),
  receipt_footer_msg: z.string().optional().nullable(),
  receipt_notes_line1: z.string().optional().nullable(),
  receipt_notes_line2: z.string().optional().nullable(),
  receipt_notes_line3: z.string().optional().nullable(),
  whatsapp_number: z.string().optional().nullable(),
  support_email: z.string().optional().nullable(),
  logo_url: z.string().optional().nullable(),
  name: z.string().optional(),
  contact_number: z.string().optional(),
  website: z.string().optional().nullable(),
  address_line1: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
});
