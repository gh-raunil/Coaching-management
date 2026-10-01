-- ==============================================================================
-- 003_seed_data_mysql.sql
-- Multi-Tenant Tuition & Coaching Management System
-- Realistic Development Seed Data for MySQL
-- ==============================================================================

-- 1. SUPERADMIN ACCOUNT
-- Default Password for all seed users is: Admin@123
-- Bcrypt Hash (cost 10): $2a$10$jeLXd7HAvNbpl2t4h7zApe9RbrtoqLAPpeYuQHjWMZrOBpG6cZedC

INSERT IGNORE INTO users (id, email, password_hash, name, role, is_active)
VALUES (
    1,
    'superadmin@platform.com',
    '$2a$10$jeLXd7HAvNbpl2t4h7zApe9RbrtoqLAPpeYuQHjWMZrOBpG6cZedC',
    'Platform Super Administrator',
    'SUPERADMIN',
    true
);

-- 2. COACHINGS
INSERT IGNORE INTO coachings (id, name, email, contact_number, address_line1, city, state, pincode, website, status)
VALUES 
(
    1,
    'Apex Science & IIT Academy',
    'info@apexacademy.com',
    '+91 9876543210',
    'Plot 42, Knowledge Park III',
    'Greater Noida',
    'Uttar Pradesh',
    '201306',
    'https://www.apexacademy.com',
    'ACTIVE'
),
(
    2,
    'Quantum Commerce & CA Classes',
    'contact@quantumclasses.in',
    '+91 9123456780',
    'Suite 104, Commerce Plaza, FC Road',
    'Pune',
    'Maharashtra',
    '411004',
    'https://www.quantumclasses.in',
    'ACTIVE'
),
(
    3,
    'Horizon Olympiad Institute',
    'support@horizonolympiad.org',
    '+91 9345678901',
    '15 MG Road, Near Metro Station',
    'Bengaluru',
    'Karnataka',
    '560001',
    'https://www.horizonolympiad.org',
    'SUSPENDED'
);

-- 3. COACHING SETTINGS
INSERT IGNORE INTO coaching_settings (coaching_id, receipt_header_title, receipt_footer_msg, receipt_notes_line1, receipt_notes_line2, receipt_notes_line3, whatsapp_number, support_email)
VALUES 
(
    1,
    'Apex Science & IIT Academy - Excellence in Competitive Prep',
    'We appreciate your trust in Apex Academy. Building future engineers & doctors.',
    'Fee paid are non-refundable nor transferable at any case. This is a system generated bill.',
    'Please share the payment screenshot on our WhatsApp number: +91 9876543210 or email.',
    'For any academic queries or fee inquiries, contact our student cell: info@apexacademy.com',
    '+919876543210',
    'billing@apexacademy.com'
),
(
    2,
    'Quantum Commerce Institute - Professional CA & CS Studies',
    'We appreciate your trust in Quantum Commerce Institute.',
    'Fee paid are non-refundable nor transferable at any case. This is a system generated bill.',
    'Please share transaction reference on WhatsApp (+91 9123456780) within 24 hours.',
    'Account inquiries: accounts@quantumclasses.in',
    '+919123456780',
    'accounts@quantumclasses.in'
),
(
    3,
    'Horizon Olympiad Institute',
    'Thank you for joining Horizon.',
    'Fee paid are non-refundable nor transferable.',
    'Send receipt copies to support@horizonolympiad.org',
    'Contact helpdesk for support.',
    '+919345678901',
    'support@horizonolympiad.org'
);

-- 4. COACHING ADMIN USERS & MAPPINGS
-- Password for all: Admin@123
INSERT IGNORE INTO users (id, email, password_hash, name, role, is_active)
VALUES 
(
    2,
    'admin1@apexacademy.com',
    '$2a$10$jeLXd7HAvNbpl2t4h7zApe9RbrtoqLAPpeYuQHjWMZrOBpG6cZedC',
    'Vikram Malhotra (Senior Director)',
    'COACHING_ADMIN',
    true
),
(
    3,
    'admin2@apexacademy.com',
    '$2a$10$jeLXd7HAvNbpl2t4h7zApe9RbrtoqLAPpeYuQHjWMZrOBpG6cZedC',
    'Sunita Sharma (Operations Manager)',
    'COACHING_ADMIN',
    true
),
(
    4,
    'admin@quantumclasses.in',
    '$2a$10$jeLXd7HAvNbpl2t4h7zApe9RbrtoqLAPpeYuQHjWMZrOBpG6cZedC',
    'Rajesh Kulkarni (Head of Accounts)',
    'COACHING_ADMIN',
    true
),
(
    5,
    'admin@horizonolympiad.org',
    '$2a$10$jeLXd7HAvNbpl2t4h7zApe9RbrtoqLAPpeYuQHjWMZrOBpG6cZedC',
    'Deepak Verma (Suspended Branch Head)',
    'COACHING_ADMIN',
    true
);

INSERT IGNORE INTO coaching_admins (coaching_id, user_id, is_primary)
VALUES 
(1, 2, true),
(1, 3, false),
(2, 4, true),
(3, 5, true);

-- 5. COURSES
INSERT IGNORE INTO courses (id, coaching_id, course_name, duration, default_fee, is_active)
VALUES 
(1, 1, 'JEE Advanced Physics & Mathematics (2-Year Program)', '24 Months', 45000.00, true),
(2, 1, 'NEET Medical Biology & Organic Chemistry', '12 Months', 38000.00, true),
(3, 1, 'Class 10 CBSE Board Excellence Foundation', '10 Months', 22000.00, true),
(4, 2, 'Chartered Accountancy (CA) Foundation Comprehensive', '8 Months', 32000.00, true),
(5, 2, 'Class 12 Commerce Mastery (Accounts & Eco)', '12 Months', 18000.00, true);

-- 6. BATCHES
INSERT IGNORE INTO batches (id, coaching_id, course_id, batch_id_code, batch_name, start_date, end_date, is_active)
VALUES 
(1, 1, 1, 'APEX-JEE-2026-A', 'JEE Super 30 Morning Batch', '2026-04-01', '2028-03-31', true),
(2, 1, 2, 'APEX-NEET-2026-B', 'NEET Target Regular Batch', '2026-05-15', '2027-05-14', true),
(3, 1, 3, 'APEX-CBSE10-2026-C', 'CBSE Class 10 Toppers Weekend Batch', '2026-04-10', '2027-02-28', true),
(4, 2, 4, 'QNT-CAF-2026-A', 'CA Foundation Fast-Track Batch', '2026-06-01', '2027-01-31', true),
(5, 2, 5, 'QNT-C12-2026-B', 'Class 12 Commerce Evening Batch', '2026-04-15', '2027-03-15', true);

-- 7. STUDENTS
INSERT IGNORE INTO students (id, coaching_id, registration_no, student_name, father_name, batch_id, course_name, address_line1, city_state_pin, contact_no, is_active)
VALUES 
(
    1,
    1,
    'APEX/2026/001',
    'Rahul Verma',
    'Ramesh Verma',
    'APEX-JEE-2026-A',
    'JEE Advanced Physics & Mathematics (2-Year Program)',
    'Flat 302, Green Valley Apartments, Sector 62',
    'Noida, UP - 201301',
    '+91 9811223344',
    true
),
(
    2,
    1,
    'APEX/2026/002',
    'Priya Nair',
    'K. G. Nair',
    'APEX-NEET-2026-B',
    'NEET Medical Biology & Organic Chemistry',
    'House 14, Lotus Enclave, Alpha 1',
    'Greater Noida, UP - 201308',
    '+91 9822334455',
    true
),
(
    3,
    1,
    'APEX/2026/003',
    'Ananya Gupta',
    'Suresh Gupta',
    'APEX-CBSE10-2026-C',
    'Class 10 CBSE Board Excellence Foundation',
    'C-45, Ashok Nagar',
    'Ghaziabad, UP - 201001',
    '+91 9833445566',
    true
),
(
    4,
    1,
    'APEX/2026/004',
    'Rohan Mehta',
    'Sunil Mehta',
    'APEX-JEE-2026-A',
    'JEE Advanced Physics & Mathematics (2-Year Program)',
    'B-108, Mayur Vihar Phase 1',
    'East Delhi, Delhi - 110091',
    '+91 9844556677',
    true
),
(
    5,
    2,
    'QNT/2026/101',
    'Aditya Joshi',
    'Prabhakar Joshi',
    'QNT-CAF-2026-A',
    'Chartered Accountancy (CA) Foundation Comprehensive',
    '12 Narayan Peth, Laxmi Road',
    'Pune, Maharashtra - 411030',
    '+91 9711223344',
    true
),
(
    6,
    2,
    'QNT/2026/102',
    'Sneha Deshmukh',
    'Vijay Deshmukh',
    'QNT-C12-2026-B',
    'Class 12 Commerce Mastery (Accounts & Eco)',
    'Flat 15, Silver Oak Heights, Kothrud',
    'Pune, Maharashtra - 411038',
    '+91 9722334455',
    true
);

-- 8. INVOICES
INSERT IGNORE INTO invoices (id, coaching_id, student_id, invoice_no, invoice_date, due_date, subtotal, discount, total_amount, paid_amount, payment_status)
VALUES 
(
    1,
    1,
    1,
    'INV-APX-2026-001',
    '2026-09-01',
    '2026-09-15',
    45000.00,
    5000.00,
    40000.00,
    40000.00,
    'PAID'
),
(
    2,
    1,
    2,
    'INV-APX-2026-002',
    '2026-09-05',
    '2026-09-19',
    38000.00,
    3000.00,
    35000.00,
    20000.00,
    'PARTIALLY_PAID'
),
(
    3,
    1,
    3,
    'INV-APX-2026-003',
    '2026-09-10',
    '2026-09-24',
    22000.00,
    2000.00,
    20000.00,
    0.00,
    'UNPAID'
),
(
    4,
    2,
    5,
    'INV-QNT-2026-001',
    '2026-09-02',
    '2026-09-16',
    32000.00,
    2000.00,
    30000.00,
    30000.00,
    'PAID'
),
(
    5,
    2,
    6,
    'INV-QNT-2026-002',
    '2026-09-12',
    '2026-09-26',
    18000.00,
    0.00,
    18000.00,
    10000.00,
    'PARTIALLY_PAID'
);

-- 9. INVOICE ITEMS
INSERT IGNORE INTO invoice_items (invoice_id, description, quantity, rate, amount)
VALUES 
(1, 'Course fee — JEE Advanced Physics & Mathematics (Year 1)', 1, 45000.00, 45000.00),
(2, 'Course fee — NEET Medical Biology & Chemistry Comprehensive', 1, 38000.00, 38000.00),
(3, 'Course fee — Class 10 CBSE Board Preparation & Study Pack', 1, 22000.00, 22000.00),
(4, 'Course fee — CA Foundation Fast-Track & Study Modules', 1, 32000.00, 32000.00),
(5, 'Course fee — Class 12 Commerce Mastery Full Year', 1, 18000.00, 18000.00);

-- 10. PAYMENTS (ACTUAL COLLECTED REVENUE)
INSERT IGNORE INTO payments (id, coaching_id, student_id, invoice_id, amount, payment_date, payment_method, transaction_reference, notes)
VALUES 
(
    1,
    1,
    1,
    1,
    25000.00,
    '2026-09-02',
    'UPI',
    'UPI/2609028811/OKAXIS',
    'First installment paid via GPay'
),
(
    2,
    1,
    1,
    1,
    15000.00,
    '2026-09-10',
    'BANK_TRANSFER',
    'NEFT/HDFC299104882',
    'Second installment final settlement'
),
(
    3,
    1,
    2,
    2,
    20000.00,
    '2026-09-06',
    'UPI',
    'UPI/2609067719/PAYTM',
    'Registration & initial seat booking fee'
),
(
    4,
    2,
    5,
    4,
    30000.00,
    '2026-09-03',
    'BANK_TRANSFER',
    'RTGS/ICIC009182341',
    'Full course fee paid at admission'
),
(
    5,
    2,
    6,
    5,
    10000.00,
    '2026-09-15',
    'CASH',
    'RCPT/CASH/2026/091',
    'Cash deposit at center reception desk'
);
