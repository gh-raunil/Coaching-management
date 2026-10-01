-- 002_create_indexes_mysql.sql – MySQL version of indexes

-- 1. User & Auth Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- 2. Coaching Admin Mapping Indexes
CREATE INDEX idx_coaching_admins_coaching_id ON coaching_admins(coaching_id);
CREATE INDEX idx_coaching_admins_user_id ON coaching_admins(user_id);

-- 3. Coaching Status Indexes
CREATE INDEX idx_coachings_status ON coachings(status);

-- 4. Course & Batch Indexes
CREATE INDEX idx_courses_coaching_id ON courses(coaching_id);
CREATE INDEX idx_courses_active ON courses(coaching_id, is_active);
CREATE INDEX idx_batches_coaching_id ON batches(coaching_id);
CREATE INDEX idx_batches_course_id ON batches(course_id);
CREATE INDEX idx_batches_active ON batches(coaching_id, is_active);

-- 5. Student Indexes
CREATE INDEX idx_students_coaching_id ON students(coaching_id);
CREATE INDEX idx_students_reg_no ON students(coaching_id, registration_no);
CREATE INDEX idx_students_name ON students(coaching_id, student_name);
CREATE INDEX idx_students_active ON students(coaching_id, is_active);

-- 6. Invoice Indexes
CREATE INDEX idx_invoices_coaching_id ON invoices(coaching_id);
CREATE INDEX idx_invoices_student_id ON invoices(student_id);
CREATE INDEX idx_invoices_status ON invoices(coaching_id, payment_status);
CREATE INDEX idx_invoices_date ON invoices(coaching_id, invoice_date);
CREATE INDEX idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- 7. Payment Indexes
CREATE INDEX idx_payments_coaching_id ON payments(coaching_id);
CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_student_id ON payments(student_id);
CREATE INDEX idx_payments_date ON payments(coaching_id, payment_date);
CREATE INDEX idx_payments_method ON payments(coaching_id, payment_method);

-- 8. Audit Log Indexes
CREATE INDEX idx_audit_coaching ON audit_logs(coaching_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at);
