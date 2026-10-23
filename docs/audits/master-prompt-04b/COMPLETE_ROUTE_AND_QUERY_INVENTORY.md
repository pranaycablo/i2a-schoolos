# i2A SchoolOS — Master Prompt 04B: Report 01
# Complete Forensic Route & Database Access Inventory

**Project Root:** `D:\i2A_School ERP & Managment`  
**Phase:** Master Prompt 04B  
**Target Environment:** Node.js Express Backend & MongoDB 8.3  
**Auditor:** Antigravity Senior Forensic Security Agent  
**Date:** October 18, 2026  

---

## 1. Executive Summary & Inventory Scope

This document provides a forensic, endpoint-by-endpoint inventory of all Express routes mounted on `server/index.js`, their HTTP methods, middleware authorization chains, tenant predicates, MongoDB read/write operations, returned sensitive data fields, and audit event dispatch.

Every route follows the default security stance: **FAIL-CLOSED / DENY BY DEFAULT**. Only explicitly whitelisted public endpoints (`/api/health`, `/api/auth/login`, `/api/auth/register-school`, `/api/auth/forgot-password`, `/api/auth/verify-otp`, `/api/auth/reset-password`, `/api/admissions/public`, `/api/tenants/applications`, `/api/payments/webhook`, `/api/subscription/plans`, `/api/subscription/calculate-price`) allow unauthenticated ingestion, all of which enforce strict schema validation, cryptographic HMAC verification, or public admission queuing.

---

## 2. Complete Mounted Router Matrix (16 Express Routers)

| # | Router Module | Mount Point | Total Endpoints | Default Scope |
|---|---------------|-------------|-----------------|---------------|
| 1 | `server/routes/auth.js` | `/api/auth` | 6 | Public & Authenticated Session |
| 2 | `server/routes/tenants.js` | `/api/tenants` | 5 | Tenant-Scoped / SuperAdmin |
| 3 | `server/routes/organizations.js` | `/api/organizations` | 5 | Multi-Tenant Hierarchy Mutex |
| 4 | `server/routes/students.js` | `/api/students` | 4 | Tenant & Role-Scoped (PII Redacted) |
| 5 | `server/routes/privacy.js` | `/api/privacy` | 3 | DPDP Rights & Consent Queue |
| 6 | `server/routes/admissions.js` | `/api/admissions` | 4 | Public Ingest & Tenant Approval |
| 7 | `server/routes/attendance.js` | `/api/attendance` | 5 | Tenant & Class/Teacher Scoped |
| 8 | `server/routes/timetables.js` | `/api/timetables` | 3 | Tenant & Classroom Scoped |
| 9 | `server/routes/homework.js` | `/api/homework` | 5 | Tenant & Student/Teacher Scoped |
| 10 | `server/routes/exams.js` | `/api/exams` | 4 | Tenant & Objective Auto-Grade |
| 11 | `server/routes/fees.js` | `/api/fees` | 3 | Immutable Financial Ledger |
| 12 | `server/routes/marketplace.js` | `/api/marketplace` | 3 | Tenant Inventory & Idempotent Orders |
| 13 | `server/routes/operations.js` | `/api/operations` | 8 | Staff, Payroll, Expenses, Transport |
| 14 | `server/routes/subscription.js` | `/api/subscription` | 4 | Tier Plans, Invoices & Upgrades |
| 15 | `server/routes/payments.js` | `/api/payments` | 3 | HMAC Webhooks & Gateway Orders |
| 16 | `server/routes/notifications.js` | `/api/notifications` | 4 | In-App Notification Hub |
| 17 | `server/index.js` (Root) | `/api/audit-logs` | 1 | Platform & School Auditor Read-Only |
| 18 | `server/index.js` (Root) | `/api/health` | 1 | Public Health / Monitoring Probe |

---

## 3. Forensic Endpoint Inventory by Module

### 3.1 Authentication & Session (`server/routes/auth.js`)
1. **`POST /api/auth/login`**
   - **Auth:** Public
   - **Validation:** Strict string validation, NoSQL injection rejection (`$`, `.`), Brute-force lockout check.
   - **DB Operations:** `users.findOne({ $or: [{ email }, { id }, { name }] })`, `tenants.findOne({ id: user.schoolId })`.
   - **Audit:** `FAILED_LOGIN_ATTEMPT` or `SUCCESSFUL_LOGIN`.
   - **Returns:** Signed JWT (`HS256`, 24h), user profile (passwords omitted), tenant metadata.

2. **`POST /api/auth/logout`**
   - **Auth:** `authenticateToken`
   - **DB Operations:** `revoked_tokens.updateOne({ tokenHash }, { $set: ... }, { upsert: true })`.
   - **Audit:** `USER_LOGOUT` with correlation and IP address.
   - **Returns:** Revocation confirmation.

3. **`GET /api/auth/me`**
   - **Auth:** `authenticateToken`
   - **DB Operations:** `tenants.findOne({ id: req.user.schoolId })`.
   - **Returns:** Active user profile and school tenant branding.

4. **`POST /api/auth/register-school`**
   - **Auth:** Public self-service onboarding.
   - **DB Operations:** `users.findOne`, `tenants.countDocuments`, `tenants.insertOne`, `users.insertOne`.
   - **Audit:** `REGISTER_SCHOOL`.

5. **`POST /api/auth/forgot-password`**
   - **Auth:** Public (Rate limited: 1 req/60s).
   - **DB Operations:** `password_resets.deleteMany({ email })`, `password_resets.insertOne`.
   - **Returns:** Generic message preventing user enumeration.

6. **`POST /api/auth/verify-otp`**
   - **Auth:** Public (Max 3 failed attempts before deletion).
   - **DB Operations:** `password_resets.findOne`, `password_resets.updateOne`.

7. **`POST /api/auth/reset-password`**
   - **Auth:** Public (Requires verified single-use reset token).
   - **DB Operations:** `users.updateOne({ email }, { $set: { passwordHash, passwordChangedAt } })`, `password_resets.deleteOne`.

---

### 3.2 Tenant Isolation & Setup (`server/routes/tenants.js`)
1. **`GET /api/tenants`**
   - **Auth:** `authenticateToken`. SUPER_ADMIN sees all; others restricted strictly to `req.user.schoolId`.
2. **`GET /api/tenants/:schoolId`**
   - **Auth:** `authenticateToken`, `enforceTenant`. Foreign tenant rejected with 403 `CROSS_TENANT_VIOLATION`.
3. **`PUT /api/tenants/:schoolId/branding`**
   - **Auth:** `authenticateToken`, `enforceTenant`, `requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN')`.
   - **DB Mutation:** `tenants.updateOne({ id: targetTenantId }, { $set: { branding: ... } })`.
   - **Remediation Applied in 04B:** Fixed collection query filter to `{ id: targetTenantId }` avoiding non-existent `schoolId` field in tenant schema.

---

### 3.3 Student Information System & Privacy (`server/routes/students.js`)
1. **`GET /api/students`**
   - **Auth:** `authenticateToken`, `enforceTenant`.
   - **Tenant Predicate:** `req.tenantFilter` (`{ schoolId: req.user.schoolId }`).
   - **Privacy Redaction:** `redactStudentPii(student, req.user)` applied to all results.
2. **`GET /api/students/:id`**
   - **Auth:** `authenticateToken`, `enforceTenant`.
   - **Ownership Checks:** Parent restricted to linked children; Student restricted to self; foreign tenant rejected.
3. **`POST /api/students`**
   - **Auth:** `authenticateToken`, `enforceTenant`, `requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'STAFF')`.
   - **Whitelisting:** Strict field whitelist preventing injection of `id`, `schoolId`, or `role`.
4. **`PUT /api/students/:id`**
   - **Auth:** `authenticateToken`, `enforceTenant`, `requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'STAFF', 'TEACHER')`.
   - **DB Mutation:** `students.updateOne({ id: req.params.id, ...req.tenantFilter }, { $set: ... })`.
   - **Post-Update Fetch:** Hardened in 04B to `{ id: req.params.id, ...req.tenantFilter }`.

---

### 3.4 Attendance & Leaves (`server/routes/attendance.js`)
1. **`GET /api/attendance`**: Scoped by `req.tenantFilter` and role constraints.
2. **`POST /api/attendance/mark`**: Validates `attendance_locks` before allowing bulk writes.
3. **`POST /api/attendance/lock`**: Locks roster edits for specific date/class.
4. **`GET /api/attendance/summary`**: Hardened in 04B to mask `parentMobile` using `maskPhone()` for non-administrative roles.
5. **`PUT /api/attendance/leaves/:id/status`**: Hardened in 04B with `matchedCount === 0` 404 response.

---

### 3.5 Homework, Exams, Fees & Marketplace
1. **`POST /api/homework/submissions/:subId/grade`**: Hardened in 04B with `{ id: req.params.subId, ...req.tenantFilter }` and `matchedCount === 0` check.
2. **`PUT /api/exams/papers/:id/status`**: Hardened in 04B with `matchedCount === 0` check.
3. **`POST /api/marketplace/orders`**: Hardened in 04B with tenant-scoped inventory decrement `{ id: item.productId, ...req.tenantFilter }`.
4. **`POST /api/operations/payroll/disburse`**: Hardened in 04B with `{ id: recordId, ...req.tenantFilter }` and `matchedCount === 0` check.
5. **`POST /api/timetables/cells`**: Hardened in 04B with `{ id: cellId, schoolId: req.user.schoolId }`.

---

## 4. Default Authorization & Rejection Verification

All routes without explicit public exemption require:
1. `authenticateToken` $\rightarrow$ Checks cryptographic signature, expiration, and MongoDB-persisted revocation status.
2. `enforceTenant` $\rightarrow$ Injects server-verified `req.tenantFilter = { schoolId: req.user.schoolId }` and blocks foreign tenant requests with 403 `CROSS_TENANT_VIOLATION`.
3. `requireRoles` / `requirePermissions` $\rightarrow$ Validates caller privileges against the Role Permission Matrix.
