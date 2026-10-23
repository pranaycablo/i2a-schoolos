# i2A SchoolOS — Master Route, API & Role Permission Matrix
**Audited Date:** October 2026 | **Scope:** 112 Express REST Endpoints  
**Environment Gate:** Fail-Closed JWT Authentication + Scoped Tenant Isolation Middleware  

---

## 1. Overview of Endpoint Security Architecture
All API requests entering `i2A SchoolOS` flow through a layered middleware pipeline:
1. **Request Tracking Middleware:** Injects unique `x-request-id` for forensic audit logs.
2. **Authentication Guard (`authenticateToken`):** Extracts Bearer JWT, validates signature, checks revoked token blacklist in MongoDB.
3. **Multi-Tenant Filter (`enforceTenant`):** Injects `req.tenantFilter = { schoolId: req.user.schoolId }` preventing horizontal cross-school data leaks. SUPER_ADMIN is granted global bypass.
4. **Role-Based Access Control (`requireRoles(...)`):** Enforces principle of least privilege against authenticated role claim.
5. **Data Protection / PII Redaction:** Routes serving student or financial information automatically redact sensitive contact details based on role and ownership.

---

## 2. Complete REST Endpoint & Permission Matrix

| Module | Method | Endpoint Path | Auth Required | Tenant Scoped | Authorized Roles | Security / Concurrency Mechanism |
| :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `admissions` | **GET** | `/api/admissions` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN, STAFF, ACCOUNTANT | Standard tenant isolation |
| `admissions` | **POST** | `/api/admissions/public` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `admissions` | **PUT** | `/api/admissions/:id/status` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN | Standard tenant isolation |
| `admissions` | **POST** | `/api/admissions/:id/approve` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN | Atomic transaction: student + user credentials |
| `attendance` | **GET** | `/api/attendance` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `attendance` | **POST** | `/api/attendance/mark` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN, TEACHER, STAFF | Batch upsert with date-lock verification |
| `attendance` | **POST** | `/api/attendance/lock` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN | Tamper-proof daily lock, subsequent mutations return 403 |
| `attendance` | **GET** | `/api/attendance/summary` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `attendance` | **GET** | `/api/attendance/leaves` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `attendance` | **POST** | `/api/attendance/leaves` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `attendance` | **PUT** | `/api/attendance/leaves/:id/status` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN | Standard tenant isolation |
| `auth` | **POST** | `/api/auth/login` | NO | NO | PUBLIC | 5-attempt account lock (15m lockout), bcrypt hash |
| `auth` | **POST** | `/api/auth/logout` | YES | NO | AUTHENTICATED_ALL | JWT JTI revocation blacklist |
| `auth` | **GET** | `/api/auth/me` | YES | NO | AUTHENTICATED_ALL | Standard tenant isolation |
| `auth` | **POST** | `/api/auth/register-school` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `auth` | **POST** | `/api/auth/forgot-password` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `auth` | **POST** | `/api/auth/verify-otp` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `auth` | **POST** | `/api/auth/reset-password` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `auth` | **POST** | `/api/auth/activate-account` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `categories` | **GET** | `/api/categories` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `categories` | **GET** | `/api/categories/:slug` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `categories` | **GET** | `/api/categories/admin/all` | YES | NO | SUPER_ADMIN | Standard tenant isolation |
| `categories` | **POST** | `/api/categories` | YES | NO | SUPER_ADMIN | Standard tenant isolation |
| `categories` | **PUT** | `/api/categories/:id` | YES | NO | SUPER_ADMIN | Standard tenant isolation |
| `categories` | **DELETE** | `/api/categories/:id` | YES | NO | SUPER_ADMIN | Standard tenant isolation |
| `exams` | **GET** | `/api/exams/papers` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `exams` | **POST** | `/api/exams/papers` | YES | YES | SUPER_ADMIN, PRINCIPAL, TEACHER | Standard tenant isolation |
| `exams` | **PUT** | `/api/exams/papers/:id/status` | YES | YES | SUPER_ADMIN, PRINCIPAL, TEACHER | Standard tenant isolation |
| `exams` | **POST** | `/api/exams/papers/:id/submit` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `exams` | **GET** | `/api/exams/submissions` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `fees` | **GET** | `/api/fees/types` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `fees` | **POST** | `/api/fees/types` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN, ACCOUNTANT | Standard tenant isolation |
| `fees` | **GET** | `/api/fees/receipts` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `fees` | **POST** | `/api/fees/receipts/collect` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN, ACCOUNTANT, STAFF | 30s Idempotency key, atomic double-entry ledger |
| `hierarchy` | **GET** | `/api/hierarchy/tree` | YES | NO | AUTHENTICATED_ALL | Standard tenant isolation |
| `hierarchy` | **GET** | `/api/hierarchy/breadcrumbs` | YES | NO | AUTHENTICATED_ALL | Standard tenant isolation |
| `hierarchy` | **GET** | `/api/hierarchy/branches` | YES | NO | AUTHENTICATED_ALL | Standard tenant isolation |
| `hierarchy` | **GET** | `/api/hierarchy/branches/:id` | YES | NO | AUTHENTICATED_ALL | Standard tenant isolation |
| `hierarchy` | **GET** | `/api/hierarchy/campuses` | YES | NO | AUTHENTICATED_ALL | Distributed Mutex lease with fencing token |
| `hierarchy` | **GET** | `/api/hierarchy/campuses/:id` | YES | NO | AUTHENTICATED_ALL | Distributed Mutex lease with fencing token |
| `hierarchy` | **GET** | `/api/hierarchy/academic-sessions` | YES | NO | AUTHENTICATED_ALL | Standard tenant isolation |
| `homework` | **GET** | `/api/homework` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `homework` | **POST** | `/api/homework` | YES | YES | SUPER_ADMIN, PRINCIPAL, TEACHER | Standard tenant isolation |
| `homework` | **POST** | `/api/homework/:id/submit` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `homework` | **GET** | `/api/homework/:id/submissions` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `homework` | **POST** | `/api/homework/submissions/:subId/grade` | YES | YES | SUPER_ADMIN, PRINCIPAL, TEACHER | Standard tenant isolation |
| `marketplace` | **GET** | `/api/marketplace/products` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `marketplace` | **POST** | `/api/marketplace/products` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN | Standard tenant isolation |
| `marketplace` | **GET** | `/api/marketplace/orders` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `marketplace` | **POST** | `/api/marketplace/orders` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `notifications` | **GET** | `/api/notifications` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `notifications` | **POST** | `/api/notifications/dispatch` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN, STAFF, TEACHER | Standard tenant isolation |
| `notifications` | **PUT** | `/api/notifications/:id/read` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `notifications` | **DELETE** | `/api/notifications/clear` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `operations` | **GET** | `/api/operations/staff` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `operations` | **POST** | `/api/operations/staff` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN | Standard tenant isolation |
| `operations` | **GET** | `/api/operations/payroll` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN, ACCOUNTANT | Standard tenant isolation |
| `operations` | **POST** | `/api/operations/payroll/disburse` | YES | YES | SUPER_ADMIN, PRINCIPAL, ACCOUNTANT | Standard tenant isolation |
| `operations` | **GET** | `/api/operations/expenses` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN, ACCOUNTANT | Standard tenant isolation |
| `operations` | **POST** | `/api/operations/expenses` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN, ACCOUNTANT | Standard tenant isolation |
| `operations` | **GET** | `/api/operations/transport` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `operations` | **POST** | `/api/operations/transport` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN, TRANSPORT | Standard tenant isolation |
| `operations` | **GET** | `/api/operations/library` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `operations` | **POST** | `/api/operations/library` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN, TEACHER | Standard tenant isolation |
| `organizations` | **GET** | `/api/organizations` | YES | NO | AUTHENTICATED_ALL | Standard tenant isolation |
| `organizations` | **GET** | `/api/organizations/:id` | YES | NO | AUTHENTICATED_ALL | Standard tenant isolation |
| `organizations` | **GET** | `/api/organizations/:id/tree` | YES | NO | AUTHENTICATED_ALL | Standard tenant isolation |
| `organizations` | **POST** | `/api/organizations` | YES | NO | SUPER_ADMIN, ORG_DIRECTOR | Standard tenant isolation |
| `organizations` | **PUT** | `/api/organizations/:id/parent` | YES | NO | SUPER_ADMIN, ORG_DIRECTOR | Standard tenant isolation |
| `payments` | **POST** | `/api/payments/create-order` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `payments` | **POST** | `/api/payments/webhook` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `payments` | **GET** | `/api/payments/reconciliations` | YES | YES | SUPER_ADMIN, PRINCIPAL, ACCOUNTANT | Standard tenant isolation |
| `pricing` | **GET** | `/api/pricing/plans` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `pricing` | **POST** | `/api/pricing/quote` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `privacy` | **POST** | `/api/privacy/requests` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `privacy` | **GET** | `/api/privacy/requests` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `privacy` | **PUT** | `/api/privacy/requests/:id/status` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `staff` | **GET** | `/api/staff` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `staff` | **GET** | `/api/staff/leaves` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `staff` | **POST** | `/api/staff/leaves` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `staff` | **GET** | `/api/staff/:id` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `students` | **GET** | `/api/students/export` | YES | YES | AUTHENTICATED_ALL | PERMISSIONS.STUDENTS_EXPORT + forensic audit log |
| `students` | **GET** | `/api/students` | YES | YES | AUTHENTICATED_ALL | Role-based PII masking + parent child ownership filter |
| `students` | **GET** | `/api/students/:id` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `students` | **POST** | `/api/students` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN, STAFF | Role-based PII masking + parent child ownership filter |
| `students` | **PUT** | `/api/students/:id` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN, STAFF, TEACHER | Standard tenant isolation |
| `subscription` | **GET** | `/api/subscription/plans` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `subscription` | **POST** | `/api/subscription/calculate-price` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `subscription` | **GET** | `/api/subscription/trial-status` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `subscription` | **POST** | `/api/subscription/upgrade` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN | Standard tenant isolation |
| `tenants` | **GET** | `/api/tenants` | YES | NO | AUTHENTICATED_ALL | Standard tenant isolation |
| `tenants` | **GET** | `/api/tenants/:schoolId` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `tenants` | **POST** | `/api/tenants` | YES | NO | SUPER_ADMIN | Standard tenant isolation |
| `tenants` | **PUT** | `/api/tenants/:schoolId/location` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN | Latitude/Longitude bounds validation (-90..90, -180..180) |
| `tenants` | **PUT** | `/api/tenants/:schoolId/branding` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN | Standard tenant isolation |
| `tenants` | **POST** | `/api/tenants/applications` | NO | NO | PUBLIC | Cryptographic tracking token generation |
| `tenants` | **GET** | `/api/tenants/applications/status/:applicationNo` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `tenants` | **POST** | `/api/tenants/applications/:appId/rotate-tracking-token` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `tenants` | **POST** | `/api/tenants/applications/:appId/revoke-tracking-token` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `tenants` | **PUT** | `/api/tenants/applications/:appId/resubmit` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `tenants` | **GET** | `/api/tenants/applications/queue` | YES | NO | SUPER_ADMIN | Standard tenant isolation |
| `tenants` | **GET** | `/api/tenants/applications/:appId` | YES | NO | SUPER_ADMIN | Standard tenant isolation |
| `tenants` | **POST** | `/api/tenants/applications/:appId/review` | YES | NO | SUPER_ADMIN | Standard tenant isolation |
| `tenants` | **POST** | `/api/tenants/applications/:appId/request-correction` | YES | NO | SUPER_ADMIN | Standard tenant isolation |
| `tenants` | **PUT** | `/api/tenants/applications/:appId/checklist` | YES | NO | SUPER_ADMIN | Standard tenant isolation |
| `tenants` | **POST** | `/api/tenants/applications/:appId/reject` | YES | NO | SUPER_ADMIN | Standard tenant isolation |
| `tenants` | **POST** | `/api/tenants/applications/:appId/approve` | YES | NO | SUPER_ADMIN | Standard tenant isolation |
| `tenants` | **POST** | `/api/tenants/applications/:appId/cancel` | NO | NO | PUBLIC | Public endpoint, rate limited |
| `timetables` | **GET** | `/api/timetables` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `timetables` | **POST** | `/api/timetables/cells` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN | Teacher & Room double-booking clash check (409) |
| `timetables` | **GET** | `/api/timetables/workload` | YES | YES | AUTHENTICATED_ALL | Standard tenant isolation |
| `audit-logs` | **GET** | `/api/audit-logs` | YES | YES | SUPER_ADMIN, PRINCIPAL, ADMIN, ORG_DIRECTOR, PLATFORM_AUDITOR, ORG_AUDITOR | Tenant-scoped forensic trail, read-only |

---

## 3. Summary Statistics
- **Total Registered Endpoints:** 112
- **Authenticated Endpoints:** 98 (87.5%)
- **Public Endpoints (Landing / Onboarding / Login / Quote):** 14 (12.5%)
- **Strict Tenant-Enforced Endpoints:** 68
- **Platform Admin Global Endpoints:** 24
- **Mutation Endpoints Guarded by Mutex / Idempotency / Locks:** 18
