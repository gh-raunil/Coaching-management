# Database Documentation & Migration Guide

This directory contains the SQL migration and seed scripts for the **Multi-Tenant Tuition & Coaching Management System**.

## Schema Overview

The database uses PostgreSQL with a relational multi-tenant architecture. Every tenant-specific table contains a `coaching_id` foreign key referencing the `coachings` table, enforcing strict data isolation at the database and application levels.

### Tables & Purpose

1. `users`: Authentication records for `SUPERADMIN` and `COACHING_ADMIN` roles with bcrypt-hashed passwords.
2. `coachings`: Multi-tenant institutes/branches. Each branch operates independently with its own status (`ACTIVE` or `SUSPENDED`).
3. `coaching_admins`: Junction table mapping administrators to coachings, allowing multiple admins per institute.
4. `coaching_settings`: Custom branding, WhatsApp numbers, support emails, and receipt notes/footers for each institute.
5. `courses`: Courses provided by an institute with default fees and duration.
6. `batches`: Specific cohorts for courses with unique batch IDs within each coaching.
7. `students`: Enrolled students scoped to a coaching with unique registration numbers per coaching.
8. `invoices`: Invoices generated for students with subtotal, discount, total amount, paid amount, and payment status (`UNPAID`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`).
9. `invoice_items`: Itemized billing breakdown (description, quantity, rate, amount) for each invoice.
10. `payments`: Actual collected money records. **Revenue is strictly calculated from these verified payment records, never from pending/unpaid invoices.**
11. `audit_logs`: Activity log recording authentication events, status changes, and critical tenant modifications.

## SQL Files

- `001_create_tables.sql`: DDL for tables, constraints, foreign keys, and checks.
- `002_create_indexes.sql`: Performance indexes on foreign keys, search fields, status, and reporting date ranges.
- `003_seed_data.sql`: Seed data for Superadmin, two active coaching institutes with courses, batches, students, invoices, and payments, plus one suspended coaching to verify security and isolation.

## How to Execute

### Option A: Using the Automated Backend Migration Script
From the `backend/` directory:
```bash
npm run db:init
```

### Option B: Using psql CLI Directly
```bash
psql -U postgres -d tuition_management_db -f 001_create_tables.sql
psql -U postgres -d tuition_management_db -f 002_create_indexes.sql
psql -U postgres -d tuition_management_db -f 003_seed_data.sql
```
