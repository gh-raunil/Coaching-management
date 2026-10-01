# Multi-Tenant Tuition & Coaching Management System

A production-oriented, multi-tenant SaaS platform built for educational institutions and coaching academies. Features complete tenant isolation, role-based authorization, live bill receipt generation matching the official ITBEES invoice standard, real-time revenue analytics based on collected payments, and dedicated portals for platform Superadmins and Coaching Branch Admins.

---

## 1. Project Architecture & Structure

The repository is structured into three completely independent, modular applications sharing a single PostgreSQL relational database:

```
tuition-management-system/
│
├── backend/                             # Express.js + TypeScript REST API (Port 4000)
│   ├── src/
│   │   ├── config/                      # Environment and PostgreSQL connection pool
│   │   ├── controllers/                 # Request handlers (auth, students, invoices, payments, etc.)
│   │   ├── middleware/                  # JWT auth, role authorization, tenant isolation, error handler
│   │   ├── repositories/                # Direct SQL query repositories
│   │   ├── routes/                      # Express route definitions
│   │   ├── services/                    # Core business logic & database transactions
│   │   ├── utils/                       # Response formatting, password hashing
│   │   ├── validators/                  # Zod validation schemas
│   │   └── server.ts                    # Server bootstrap
│   ├── database/
│   │   └── sql/
│   │       ├── 001_create_tables.sql    # Relational DDL definitions & constraints
│   │       ├── 002_create_indexes.sql   # Performance indexes & foreign key indexes
│   │       ├── 003_seed_data.sql        # Realistic multi-tenant seed data
│   │       └── README.md                # PostgreSQL schema documentation
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend-superadmin/                 # Next.js 14 App Router (Port 3002)
│   ├── app/
│   │   ├── page.tsx                     # Superadmin Login
│   │   ├── dashboard/page.tsx           # Global statistics & branch overview
│   │   ├── coachings/page.tsx           # Two-panel coaching management & admin assignment
│   │   ├── students/page.tsx            # Global cross-coaching student directory
│   │   ├── revenue/page.tsx             # System-wide collected revenue & branch breakdown
│   │   ├── admins/page.tsx              # Platform admin directory
│   │   └── settings/page.tsx            # Superadmin profile & security
│   ├── components/                      # Reusable UI (Sidebar, Header, TwoPanel, Modal, StatCard)
│   ├── lib/                             # Axios client & currency utilities
│   ├── types/                           # TypeScript interfaces
│   ├── .env.example
│   └── package.json
│
├── frontend-admin/                      # Next.js 14 App Router (Port 3001)
│   ├── app/
│   │   ├── page.tsx                     # Coaching Admin Login
│   │   ├── dashboard/page.tsx           # Branch dashboard & KPI cards
│   │   ├── students/page.tsx            # Two-panel student list + Live Bill Generator
│   │   ├── courses/page.tsx             # Course catalog & pricing
│   │   ├── batches/page.tsx             # Batch cohorts & scheduling
│   │   ├── invoices/page.tsx            # Fee invoices ledger & printable bill receipts
│   │   ├── payments/page.tsx            # Realized payment ledger (UPI/Cash/Bank)
│   │   ├── revenue/page.tsx             # Branch revenue analytics & collection trends
│   │   └── settings/page.tsx            # Institute profile & Live Receipt customization
│   ├── components/
│   │   ├── BillReceipt.tsx              # Exact recreation of reference HTML receipt
│   │   ├── RecordPaymentModal.tsx       # Partial/full payment recording dialog
│   │   ├── Sidebar.tsx, Header.tsx      # Navigation and header
│   │   └── TwoPanel.tsx, Modal.tsx      # Layout primitives
│   ├── lib/                             # Axios client with credentials
│   ├── types/                           # TypeScript interfaces
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## 2. Technology Stack

- **Backend:** Node.js, Express.js, TypeScript, PostgreSQL (via native `pg` pool with parameterized SQL), JWT (`jsonwebtoken`), `bcryptjs`, `zod`, `cookie-parser`, `cors`.
- **Superadmin Portal:** Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide React, Recharts, Sonner.
- **Coaching Admin Portal:** Next.js 14, React 18, TypeScript, Tailwind CSS, Lucide React, Recharts, Sonner, Print CSS for A4 receipts.
- **Database:** PostgreSQL directly connected via SQL migrations. No MongoDB, Firebase, or Supabase.

---

## 3. Database Setup (PostgreSQL)

### Prerequisites
- PostgreSQL 14+ installed and running locally on port `5432`.
- Default username: `postgres` (or adjust in `backend/.env`).

### Step-by-Step Setup
1. Create the database:
   ```sql
   CREATE DATABASE tuition_management_db;
   ```
2. Execute the migration scripts in order:
   ```bash
   psql -U postgres -d tuition_management_db -f backend/database/sql/001_create_tables.sql
   psql -U postgres -d tuition_management_db -f backend/database/sql/002_create_indexes.sql
   psql -U postgres -d tuition_management_db -f backend/database/sql/003_seed_data.sql
   ```

---

## 4. Development Credentials

All seeded accounts use the default password: **`Admin@123`**

| Portal | Role | Email | Password | Branch / Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Superadmin (3002)** | SUPERADMIN | `superadmin@platform.com` | `Admin@123` | Platform Owner (All Coachings) |
| **Coaching Admin (3001)** | COACHING_ADMIN | `admin@apex.com` | `Admin@123` | Apex Science Academy (Active) |
| **Coaching Admin (3001)** | COACHING_ADMIN | `faculty@apex.com` | `Admin@123` | Apex Science Academy (Active Secondary Admin) |
| **Coaching Admin (3001)** | COACHING_ADMIN | `admin@quantum.com` | `Admin@123` | Quantum Commerce Institute (Active) |
| **Coaching Admin (3001)** | COACHING_ADMIN | `admin@horizon.com` | `Admin@123` | Horizon Olympiad School (*Suspended - Login Blocked*) |

---

## 5. Starting the Applications

Run each service in a separate terminal:

### Terminal 1: Backend API (Port 4000)
```bash
cd tuition-management-system/backend
npm install
npm run build
npm start
# Server starts on http://localhost:4000
```

### Terminal 2: Superadmin Frontend (Port 3002)
```bash
cd tuition-management-system/frontend-superadmin
npm install
npm run dev
# Portal accessible at http://localhost:3002
```

### Terminal 3: Coaching Admin Frontend (Port 3001)
```bash
cd tuition-management-system/frontend-admin
npm install
npm run dev
# Portal accessible at http://localhost:3001
```

---

## 6. Key Features & Business Logic

### A. True Multi-Tenant Isolation
- Every student, course, batch, invoice, payment, and setting record is tied to a specific `coaching_id`.
- The backend authentication middleware extracts the `coachingId` from the cryptographically verified JWT.
- Coaching admins cannot access, query, or mutate records of another coaching branch even by manipulating URLs or request payloads.
- Suspended coachings are strictly blocked from logging in or calling backend APIs.

### B. Accurate Revenue Calculation
- **Rule:** Unpaid or pending invoices do *not* count as revenue.
- Revenue is computed strictly from actual recorded and settled payments in the `payments` ledger.
- Invoices support partial payments with balance checks. Overpayments beyond the outstanding balance are rejected at the service layer.

### C. Live Bill Generator & A4 Printable Receipt
- Recreated directly from `bill_generator.html` into a reactive Next.js component (`BillReceipt.tsx`).
- Live dual-panel interface: changes in the student/fee form update the receipt instantly without page reloads.
- Preserves the distinct emerald-teal-sky gradient header, diagonal clipped edge, bill notes, and Indian rupee formatting (`₹ 10,000.00`).
- Print styles configured to print clean A4 receipts with no forms, headers, or backgrounds cut off.
- Dynamic institute branding pulls logo, name, contact info, and custom notes from coaching settings.

### D. Transactional Student Registration
- Enrolling a student with their initial fee invoice is wrapped in a PostgreSQL transaction (`BEGIN ... COMMIT`).
- If invoice creation fails, student insertion rolls back cleanly to prevent orphaned records.
- Unique constraints prevent duplicate registration numbers or invoice codes within the same branch.

---

## 7. Verification & Testing

- **Backend compilation:** `tsc` passed with 0 errors.
- **Frontend Superadmin build:** `next build` compiled all routes statically with 0 errors.
- **Frontend Admin build:** `next build` compiled all routes statically with 0 errors.
- **Tenant Isolation test:** Verified Cross-tenant API access returns `404 Not Found`.
- **Suspension test:** Verified suspended branch `admin@horizon.com` returns `403 Coaching institute is suspended`.
- **Payment validation test:** Verified recording payments exceeding invoice balance is blocked with `400 Bad Request`.
