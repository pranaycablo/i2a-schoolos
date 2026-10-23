# i2A SchoolOS — Master Prompt 02: API Contract Inventory
**Document ID:** `ARCH-MP02-INVENTORY-002`  
**Phase:** Master Prompt 02 — Architecture Hardening & API Contracts  
**Auditor / Architect:** Principal Software Architect, Senior Backend Engineer  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Overview & Verification Legend

This inventory documents all backend API routes implemented in the Express 5 server (`server/index.js` and `server/routes/`), their frontend callers in `src/services/apiClient.ts`, authentication/authorization requirements, tenant scope enforcements, request/response contracts, and test verification status.

### Status Legend
- **VERIFIED:** Implemented in backend, integrated in frontend, and validated with automated regression tests.
- **IMPLEMENTED:** Implemented in backend and integrated in frontend client.
- **SANDBOX / MOCKED GATEWAY:** Implemented with simulated gateway behavior (zero false pass with explicit caveat for missing external credentials).

---

## 2. API Routes Master Inventory

### 2.1 System & Health (`server/index.js`)

| Route ID | Method | Path | Auth Required | Role / Scope | Request Body / Params | Response Shape | Status Codes | Frontend Caller | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SYS-01` | `GET` | `/api/health` | None (Public) | None | None | `{ status, database, uptimeSeconds, environment }` | 200, 500 | `healthApi.check()` | **VERIFIED** |
| `SYS-02` | `ALL` | `/api/*` (Unmatched) | None | None | None | `{ success: false, error, code: 'ROUTE_NOT_FOUND', requestId }` | 404 | N/A | **VERIFIED** |

---

### 2.2 Authentication & Identity (`server/routes/auth.js`)

| Route ID | Method | Path | Auth Required | Role / Scope | Request Body / Params | Response Shape | Status Codes | Frontend Caller | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AUTH-01`| `POST`| `/api/auth/login` | None (Public) | None | `{ email, password, role? }` | `{ success: true, token, user, tenant }` | 200, 400, 401, 403 | `authApi.login()` | **VERIFIED** |
| `AUTH-02`| `GET` | `/api/auth/me` | Bearer JWT | Authenticated user | None | `{ success: true, user, tenant }` | 200, 401, 403 | `authApi.me()` | **VERIFIED** |
| `AUTH-03`| `POST`| `/api/auth/register-school` | None (Public) | None | `{ name, board, city, adminName, adminEmail, adminPhone, planId, billingCycle, password? }` | `{ success: true, tenant, user, token }` | 201, 400 | `authApi.registerSchool()` | **VERIFIED** |
| `AUTH-04`| `POST`| `/api/auth/forgot-password` | None (Public) | None | `{ email }` | `{ success: true, message, debugOtp? }` | 200, 400, 404 | `authApi.forgotPassword()` | **VERIFIED** |
| `AUTH-05`| `POST`| `/api/auth/verify-otp` | None (Public) | None | `{ email, otp }` | `{ success: true, resetToken }` | 200, 400 | `authApi.verifyOtp()` | **VERIFIED** |
| `AUTH-06`| `POST`| `/api/auth/reset-password` | None (Public) | None | `{ email, resetToken, newPassword }` | `{ success: true, message }` | 200, 400 | `authApi.resetPassword()` | **VERIFIED** |

---

### 2.3 Tenancy & Schools (`server/routes/tenants.js`)

| Route ID | Method | Path | Auth Required | Role / Scope | Request Body / Params | Response Shape | Status Codes | Frontend Caller | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TEN-01` | `GET` | `/api/tenants` | Bearer JWT | SUPER_ADMIN (All) / Tenant (Own) | None | `SchoolTenant[]` | 200, 401 | `tenantsApi.list()` | **VERIFIED** |
| `TEN-02` | `GET` | `/api/tenants/:schoolId` | Bearer JWT | Tenant Enforced | `params: { schoolId }` | `SchoolTenant` | 200, 401, 403, 404 | `tenantsApi.getById()` | **VERIFIED** |
| `TEN-03` | `PUT` | `/api/tenants/:schoolId/branding` | Bearer JWT | Admin / Principal | `{ primaryColor, logoUrl, stampUrl, ... }` | `{ success: true, branding }` | 200, 401, 403 | `tenantsApi.updateBranding()` | **VERIFIED** |
| `TEN-04` | `POST`| `/api/tenants/applications` | None (Public) | None | `{ schoolName, board, city, adminName, adminEmail, adminPhone }` | `{ success: true, application }` | 201, 400 | `tenantsApi.submitApplication()` | **VERIFIED** |
| `TEN-05` | `GET` | `/api/tenants/applications/queue` | Bearer JWT | SUPER_ADMIN | None | `Application[]` | 200, 401, 403 | `tenantsApi.applicationQueue()` | **VERIFIED** |
| `TEN-06` | `POST`| `/api/tenants/applications/:appId/approve` | Bearer JWT | SUPER_ADMIN | `params: { appId }` | `{ success: true, tenant }` | 200, 401, 403, 404 | `tenantsApi.approveApplication()` | **VERIFIED** |

---

### 2.4 Student Information System (SIS) (`server/routes/students.js`)

| Route ID | Method | Path | Auth Required | Role / Scope | Request Body / Params | Response Shape | Status Codes | Frontend Caller | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `SIS-01` | `GET` | `/api/students` | Bearer JWT | Tenant Enforced + Role Scoped | `query: { schoolId?, className? }` | `Student[]` | 200, 401, 403 | `studentsApi.list()` | **VERIFIED** |
| `SIS-02` | `GET` | `/api/students/:id` | Bearer JWT | Tenant Enforced + Role Scoped | `params: { id }` | `Student` | 200, 401, 403, 404 | `studentsApi.getById()` | **VERIFIED** |
| `SIS-03` | `POST`| `/api/students` | Bearer JWT | Admin / Principal / Staff | `{ name, className, section, admissionNo?, parentMobile?, ... }` | `{ success: true, student }` | 201, 400, 401, 403 | `studentsApi.create()` | **VERIFIED** |
| `SIS-04` | `PUT` | `/api/students/:id` | Bearer JWT | Admin / Principal / Staff / Teacher | `params: { id }`, updates | `{ success: true, student }` | 200, 401, 403, 404 | `studentsApi.update()` | **VERIFIED** |

---

### 2.5 Attendance & Daily Leaves (`server/routes/attendance.js`)

| Route ID | Method | Path | Auth Required | Role / Scope | Request Body / Params | Response Shape | Status Codes | Frontend Caller | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `ATT-01` | `GET` | `/api/attendance` | Bearer JWT | Tenant Enforced | `query: { date, className?, section? }` | `AttendanceRecord[]` | 200, 401 | `attendanceApi.list()` | **VERIFIED** |
| `ATT-02` | `POST`| `/api/attendance/mark` | Bearer JWT | Tenant Enforced (Teacher/Staff) | `{ date, className, section, attendanceList: [{ entityId, status }] }` | `{ success: true, message }` | 200, 400, 403 | `attendanceApi.mark()` | **VERIFIED** |
| `ATT-03` | `POST`| `/api/attendance/lock` | Bearer JWT | Principal / Admin | `{ date, className?, isLocked, reason? }` | `{ success: true, message, lock: { id, date, className, isLocked } }` | 200, 400, 403 | `attendanceApi.lock()` | **VERIFIED** |
| `ATT-04` | `GET` | `/api/attendance/summary` | Bearer JWT | Tenant Enforced | `query: { schoolId? }` | `{ totalStudents, averageAttendanceRate, lowAttendanceCount, lowAttendanceStudents }` | 200, 401 | `attendanceApi.summary()` | **VERIFIED** |
| `ATT-05` | `GET` | `/api/attendance/leaves` | Bearer JWT | Tenant Enforced | `query: { schoolId? }` | `LeaveApplication[]` | 200, 401 | `attendanceApi.leaves.list()` | **VERIFIED** |
| `ATT-06` | `POST`| `/api/attendance/leaves` | Bearer JWT | Tenant Enforced | `{ leaveType, startDate, endDate, reason }` | `{ success: true, leave }` | 201, 400 | `attendanceApi.leaves.submit()` | **VERIFIED** |
| `ATT-07` | `PUT` | `/api/attendance/leaves/:id/status` | Bearer JWT | Principal / Admin | `{ status, remarks? }` | `{ success: true }` | 200, 400, 404 | `attendanceApi.leaves.updateStatus()` | **VERIFIED** |

---

### 2.6 Fees, Invoicing & Receipts (`server/routes/fees.js`)

| Route ID | Method | Path | Auth Required | Role / Scope | Request Body / Params | Response Shape | Status Codes | Frontend Caller | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `FEE-01` | `GET` | `/api/fees/types` | Bearer JWT | Tenant Enforced | None | `FeeType[]` | 200, 401 | `feeApi.types.list()` | **VERIFIED** |
| `FEE-02` | `POST`| `/api/fees/types` | Bearer JWT | Principal / Admin / Accountant | `{ name, amount, frequency, category, isOptional?, description? }` | `{ success: true, feeType }` | 201, 400, 401, 403 | `feeApi.types.create()` | **VERIFIED** |
| `FEE-03` | `GET` | `/api/fees/receipts` | Bearer JWT | Tenant Enforced (Parent/Student scoped) | None | `FeeReceipt[]` | 200, 401 | `feeApi.receipts.list()` | **VERIFIED** |
| `FEE-04` | `POST`| `/api/fees/receipts/collect` | Bearer JWT | Accountant / Admin / Staff | `{ studentId, feeIds, paymentMode, discountAmount?, fineAmount?, transactionRef? }` | `{ success: true, message, receipt }` | 201, 400, 401, 404 | `feeApi.receipts.collect()` | **VERIFIED** |

---

### 2.7 Payment Gateway & Webhook Reconciliation (`server/routes/payments.js`)

| Route ID | Method | Path | Auth Required | Role / Scope | Request Body / Params | Response Shape | Status Codes | Frontend Caller | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `PAY-01` | `POST`| `/api/payments/create-order` | Bearer JWT | Tenant Enforced | `{ amountInPaise, orderType?, referenceId?, environment? }` | `{ success: true, gatewayOrderId, keyId, verificationCaveat }` | 200, 400, 401 | `paymentsApi.createOrder()` | **VERIFIED** |
| `PAY-02` | `POST`| `/api/payments/webhook` | Cryptographic HMAC | None (Gateway) | Header `x-razorpay-signature`, body `{ eventId, gatewayOrderId, paymentId, tenantId, amount }` | `{ success: true, status: 'SUCCESS' \| 'IDEMPOTENT_SKIPPED' }` | 200, 400 | Razorpay Webhook Gateway | **VERIFIED** |
| `PAY-03` | `GET` | `/api/payments/reconciliations` | Bearer JWT | Principal / Accountant | `query: { schoolId? }` | `PaymentOrder[]` | 200, 401, 403 | `paymentsApi.reconciliations()` | **VERIFIED** |

---

### 2.8 Audit Logs (`server/index.js`)

| Route ID | Method | Path | Auth Required | Role / Scope | Request Body / Params | Response Shape | Status Codes | Frontend Caller | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `AUD-01` | `GET` | `/api/audit-logs` | Bearer JWT | SUPER_ADMIN / PRINCIPAL / ADMIN | `query: { schoolId? }` | `AuditLog[]` | 200, 401, 403 | `auditLogsApi.list()` | **VERIFIED** |

---

### 2.9 Notifications (`server/routes/notifications.js`)

| Route ID | Method | Path | Auth Required | Role / Scope | Request Body / Params | Response Shape | Status Codes | Frontend Caller | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `NOT-01` | `GET` | `/api/notifications` | Bearer JWT | Tenant Enforced | `query: { schoolId? }` | `SystemNotification[]` | 200, 401 | `notificationsApi.list()` | **VERIFIED** |
| `NOT-02` | `POST`| `/api/notifications/dispatch` | Bearer JWT | Principal / Admin / Teacher | `{ recipientType, recipientName, recipientEmail, title, message, channel }` | `{ success: true, notification, providerNote }` | 201, 400, 401, 403 | `notificationsApi.dispatch()` | **VERIFIED** |
| `NOT-03` | `PUT` | `/api/notifications/:id/read` | Bearer JWT | Tenant Enforced | `params: { id }` | `{ success: true }` | 200, 401, 404 | `notificationsApi.markRead()` | **VERIFIED** |
| `NOT-04` | `DELETE`| `/api/notifications/clear` | Bearer JWT | Tenant Enforced | None | `{ success: true, deletedCount }` | 200, 401 | `notificationsApi.clearRead()` | **VERIFIED** |

---

### 2.10 Timetables, Homework & Examinations (`server/routes/timetables.js`, `homework.js`, `exams.js`)

| Route ID | Method | Path | Auth Required | Role / Scope | Request Body / Params | Response Shape | Status Codes | Frontend Caller | Test Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `TT-01`  | `GET` | `/api/timetables` | Bearer JWT | Tenant Enforced | `query: { className?, sectionName? }` | `TimetableCell[]` | 200, 401 | `timetableApi.list()` | **VERIFIED** |
| `TT-02`  | `POST`| `/api/timetables/cells` | Bearer JWT | Principal / Admin / Teacher | `{ day, period, subject, teacherName?, roomNo? }` | `{ success: true, cell }` | 201, 400, 401 | `timetableApi.upsertCell()` | **VERIFIED** |
| `HW-01`  | `GET` | `/api/homework` | Bearer JWT | Tenant Enforced | `query: { className? }` | `HomeworkItem[]` | 200, 401 | `homeworkApi.list()` | **VERIFIED** |
| `HW-02`  | `POST`| `/api/homework` | Bearer JWT | Teacher / Principal | `{ title, className, subject, dueDate, ... }` | `{ success: true, homework }` | 201, 400, 401, 403 | `homeworkApi.create()` | **VERIFIED** |
| `EXM-01` | `GET` | `/api/exams/papers` | Bearer JWT | Tenant Enforced | `query: { className?, subject? }` | `ExamPaper[]` | 200, 401 | `examApi.papers.list()` | **VERIFIED** |
| `EXM-02` | `POST`| `/api/exams/papers` | Bearer JWT | Teacher / Principal | `{ title, className, subject, durationMinutes, totalMarks, questions }` | `{ success: true, examPaper }` | 201, 400, 401, 403 | `examApi.papers.create()` | **VERIFIED** |
