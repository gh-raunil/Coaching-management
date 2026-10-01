-- ==============================================================================
-- 001_create_tables.sql
-- Multi-Tenant Tuition & Coaching Management System
-- Schema Definition
-- ==============================================================================

-- Drop tables if exists in reverse dependency order for clean recreation
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS coaching_settings CASCADE;
DROP TABLE IF EXISTS coaching_admins CASCADE;
DROP TABLE IF EXISTS coachings CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. USERS TABLE
-- Stores credentials and base profile for SUPERADMIN and COACHING_ADMIN
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('SUPERADMIN', 'COACHING_ADMIN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. COACHINGS TABLE
-- Multi-tenant entity representing an individual tuition / coaching branch
CREATE TABLE coachings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    address_line1 TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    logo_url TEXT,
    website VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. COACHING_ADMINS TABLE
-- Relational mapping between coachings and coaching admin users (supports multiple admins per coaching)
CREATE TABLE coaching_admins (
    id SERIAL PRIMARY KEY,
    coaching_id INT NOT NULL REFERENCES coachings(id) ON DELETE CASCADE,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_coaching_user UNIQUE (coaching_id, user_id)
);

-- 4. COACHING_SETTINGS TABLE
-- Stores institute branding and invoice receipt configuration
CREATE TABLE coaching_settings (
    id SERIAL PRIMARY KEY,
    coaching_id INT NOT NULL UNIQUE REFERENCES coachings(id) ON DELETE CASCADE,
    receipt_header_title VARCHAR(255),
    receipt_footer_msg TEXT DEFAULT 'We appreciate your trust in us.',
    receipt_notes_line1 TEXT DEFAULT 'Fee paid are non-refundable nor transferable at any case. This is a system generated bill.',
    receipt_notes_line2 TEXT DEFAULT 'Please share the payment screenshot on our WhatsApp number or email.',
    receipt_notes_line3 TEXT DEFAULT 'For any queries or assistance, contact us via WhatsApp or email.',
    whatsapp_number VARCHAR(50),
    support_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. COURSES TABLE
-- Master catalog of courses managed exclusively by Superadmin
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    coaching_id INT REFERENCES coachings(id) ON DELETE SET NULL,
    course_name VARCHAR(255) NOT NULL,
    duration VARCHAR(100),
    default_fee NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5b. COACHING_COURSES TABLE
-- Junction table mapping courses allotted to specific coaching institutes
CREATE TABLE coaching_courses (
    id SERIAL PRIMARY KEY,
    coaching_id INT NOT NULL REFERENCES coachings(id) ON DELETE CASCADE,
    course_id INT NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_coaching_course_link UNIQUE (coaching_id, course_id)
);

-- 6. BATCHES TABLE
-- Batches tied to a course within an institute
CREATE TABLE batches (
    id SERIAL PRIMARY KEY,
    coaching_id INT NOT NULL REFERENCES coachings(id) ON DELETE CASCADE,
    course_id INT REFERENCES courses(id) ON DELETE SET NULL,
    batch_id_code VARCHAR(100) NOT NULL,
    batch_name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_coaching_batch_code UNIQUE (coaching_id, batch_id_code)
);

-- 7. STUDENTS TABLE
-- Student profiles mapped strictly to a coaching tenant
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    coaching_id INT NOT NULL REFERENCES coachings(id) ON DELETE CASCADE,
    registration_no VARCHAR(100) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    batch_id VARCHAR(100),
    course_name VARCHAR(255),
    address_line1 TEXT,
    city_state_pin VARCHAR(255),
    contact_no VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_coaching_reg_no UNIQUE (coaching_id, registration_no)
);

-- 8. INVOICES TABLE
-- Invoices issued to students. Calculations: subtotal = item total, total = max(subtotal - discount, 0)
CREATE TABLE invoices (
    id SERIAL PRIMARY KEY,
    coaching_id INT NOT NULL REFERENCES coachings(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    invoice_no VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'UNPAID' CHECK (payment_status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_coaching_inv_no UNIQUE (coaching_id, invoice_no)
);

-- 9. INVOICE_ITEMS TABLE
-- Items included in an invoice
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (rate >= 0),
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0)
);

-- 10. PAYMENTS TABLE
-- Actual collected payments against invoices. Only these count toward real revenue.
CREATE TABLE payments (
    id SERIAL PRIMARY KEY,
    coaching_id INT NOT NULL REFERENCES coachings(id) ON DELETE CASCADE,
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    invoice_id INT NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('CASH', 'UPI', 'BANK_TRANSFER', 'OTHER')),
    transaction_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. AUDIT_LOGS TABLE
-- Tracks sensitive actions like login, coaching status change, password resets
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    coaching_id INT REFERENCES coachings(id) ON DELETE CASCADE,
    user_id INT REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
