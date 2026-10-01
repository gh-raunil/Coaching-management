/* 001_create_tables_mysql.sql – MySQL version of the schema */
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoice_items;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS batches;
DROP TABLE IF EXISTS coaching_courses;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS coaching_settings;
DROP TABLE IF EXISTS coaching_admins;
DROP TABLE IF EXISTS coachings;
DROP TABLE IF EXISTS users;

-- USERS
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('SUPERADMIN','COACHING_ADMIN') NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- COACHINGS
CREATE TABLE coachings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50) NOT NULL,
    address_line1 TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    logo_url TEXT,
    website VARCHAR(255),
    status ENUM('ACTIVE','SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- COACHING_ADMINS
CREATE TABLE coaching_admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coaching_id INT NOT NULL,
    user_id INT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_coaching_user (coaching_id, user_id),
    CONSTRAINT fk_coaching_admin_coaching FOREIGN KEY (coaching_id) REFERENCES coachings(id) ON DELETE CASCADE,
    CONSTRAINT fk_coaching_admin_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- COACHING_SETTINGS
CREATE TABLE coaching_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coaching_id INT NOT NULL UNIQUE,
    receipt_header_title VARCHAR(255),
    receipt_footer_msg VARCHAR(1000) DEFAULT 'We appreciate your trust in us.',
    receipt_notes_line1 VARCHAR(1000) DEFAULT 'Fee paid are non‑refundable nor transferable at any case. This is a system generated bill.',
    receipt_notes_line2 VARCHAR(1000) DEFAULT 'Please share the payment screenshot on our WhatsApp number or email.',
    receipt_notes_line3 VARCHAR(1000) DEFAULT 'For any queries or assistance, contact us via WhatsApp or email.',
    whatsapp_number VARCHAR(50),
    support_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_coaching_setting_coaching FOREIGN KEY (coaching_id) REFERENCES coachings(id) ON DELETE CASCADE
);

-- COURSES
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coaching_id INT,
    course_name VARCHAR(255) NOT NULL,
    duration VARCHAR(100),
    default_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_course_coaching FOREIGN KEY (coaching_id) REFERENCES coachings(id) ON DELETE SET NULL
);

-- COACHING_COURSES (junction)
CREATE TABLE coaching_courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coaching_id INT NOT NULL,
    course_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_coaching_course (coaching_id, course_id),
    CONSTRAINT fk_coaching_course_coaching FOREIGN KEY (coaching_id) REFERENCES coachings(id) ON DELETE CASCADE,
    CONSTRAINT fk_coaching_course_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- BATCHES
CREATE TABLE batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coaching_id INT NOT NULL,
    course_id INT,
    batch_id_code VARCHAR(100) NOT NULL,
    batch_name VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_coaching_batch_code (coaching_id, batch_id_code),
    CONSTRAINT fk_batch_coaching FOREIGN KEY (coaching_id) REFERENCES coachings(id) ON DELETE CASCADE,
    CONSTRAINT fk_batch_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- STUDENTS
CREATE TABLE students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coaching_id INT NOT NULL,
    registration_no VARCHAR(100) NOT NULL,
    student_name VARCHAR(255) NOT NULL,
    father_name VARCHAR(255),
    batch_id VARCHAR(100),
    course_name VARCHAR(255),
    address_line1 TEXT,
    city_state_pin VARCHAR(255),
    contact_no VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_coaching_reg_no (coaching_id, registration_no),
    CONSTRAINT fk_student_coaching FOREIGN KEY (coaching_id) REFERENCES coachings(id) ON DELETE CASCADE
);

-- INVOICES
CREATE TABLE invoices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coaching_id INT NOT NULL,
    student_id INT NOT NULL,
    invoice_no VARCHAR(100) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    payment_status ENUM('UNPAID','PARTIALLY_PAID','PAID','OVERDUE') NOT NULL DEFAULT 'UNPAID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_coaching_inv_no (coaching_id, invoice_no),
    CONSTRAINT fk_invoice_coaching FOREIGN KEY (coaching_id) REFERENCES coachings(id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- INVOICE_ITEMS
CREATE TABLE invoice_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    description TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
    rate DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (rate >= 0),
    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
    CONSTRAINT fk_item_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- PAYMENTS
CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coaching_id INT NOT NULL,
    student_id INT NOT NULL,
    invoice_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_method ENUM('CASH','UPI','BANK_TRANSFER','OTHER') NOT NULL,
    transaction_reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_payment_coaching FOREIGN KEY (coaching_id) REFERENCES coachings(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_student FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    CONSTRAINT fk_payment_invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- AUDIT_LOGS
CREATE TABLE audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    coaching_id INT,
    user_id INT,
    action VARCHAR(100) NOT NULL,
    details JSON,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_coaching FOREIGN KEY (coaching_id) REFERENCES coachings(id) ON DELETE CASCADE,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

SET FOREIGN_KEY_CHECKS = 1;
