# i2A SchoolOS — API Authorization & Route Security Inventory
**Document Reference:** `docs/audits/master-prompt-04/API_AUTHORIZATION_INVENTORY.md`  
**Phase:** Master Prompt 04 — Enterprise Security, Privacy, RBAC & Tenant Isolation  
**Date:** October 18, 2026  
**Status:** IMPLEMENTED & VERIFIED  

---

## 1. Central Security Architecture & Pipeline

Every incoming HTTP request traverses a strictly ordered security middleware pipeline:

```
Request
  ├── Security Headers Middleware (nosniff, DENY, STS)
  ├── NoSQL Injection Sanitizer ($ stripping on body, query, params)
  ├── Body Parser (JSON limit: 10mb)
  ├── Request ID & Latency Profiler
  │
  ├── [If Route is in Public Allowlist] ──> Public Controller Handler
  │
  └── [Default Policy: DENY - Protected Endpoints]
        ├── 1. Authentication (Bearer JWT verification)
        ├── 2. Active Session & Revocation Check (isTokenRevoked)
        ├── 3. Tenant Resolution (enforceTenant -> req.tenantFilter)
        ├── 4. Role & Permission Evaluation (requireRoles / requirePermissions)
        ├── 5. Resource Ownership & Object Authorization (Parent/Teacher/Student checks)
        ├── 6. Input Schema Validation & Whitelisting (Mass assignment defense)
        ├── 7. Business Service Layer
        ├── 8. Database Scoped Query Execution
        ├── 9. Structured Forensic Audit Event
        └── 10. Safe Sanitized API Response
```

---

## 2. Public API Allowlist

Only the following endpoints are permitted without a Bearer authentication token. All other routes default to `DENY` (`401 UNAUTHORIZED`):

| Endpoint | Method | Purpose | Security Safeguards |
| :--- | :---: | :--- | :--- |
| `/api/health` | GET | Monitoring / Load Balancer Health Check | Read-only; returns database online status without internal credentials. |
| `/api/auth/login` | POST | User Credential Verification | Brute-force throttling (5 attempts $\rightarrow$ 15m lockout); NoSQL string type validation. |
| `/api/auth/forgot-password`| POST | Password Reset OTP Request | Rate limit (1 request/60s per email); SHA-256 hashed OTP storage. |
| `/api/auth/verify-otp` | POST | OTP Verification | Max 3 attempts; single-use 32-byte cryptographic token. |
| `/api/auth/reset-password` | POST | Password Update | Single-use token verification; bcrypt hashing; auto-invalidation of existing sessions. |
| `/api/auth/register-school`| POST | School Tenant Self-Onboarding | Email uniqueness validation; bcrypt password initialization. |
| `/api/tenants/applications`| POST | School Onboarding Inquiries | Public applicant queue; audited event capture. |
| `/api/admissions/public` | POST | Parent Student Application | Sanitized input; assigned unique application number. |
| `/api/subscription/plans` | GET | Public SaaS Pricing Plans | Read-only static tier catalog. |
| `/api/subscription/calculate-price`| POST | Interactive Plan Pricing Calculator| Pure compute function; no database mutation. |
| `/api/payments/webhook` | POST | Payment Gateway Callback | Cryptographic signature verification. |

---

## 3. Comprehensive Protected API Inventory

| Module | Route Endpoint | HTTP Method | Authentication | Tenant Isolation | Authorized Roles / Permissions |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Auth** | `/api/auth/me` | GET | Yes | Scoped | Authenticated User |
| | `/api/auth/logout` | POST | Yes | N/A | Authenticated User (Revokes Token) |
| **Tenants** | `/api/tenants` | GET | Yes | Scoped | `SUPER_ADMIN` (All), Others (Own) |
| | `/api/tenants/:schoolId` | GET | Yes | `enforceTenant` | Scoped School User |
| | `/api/tenants/:schoolId/branding`| PUT | Yes | `enforceTenant` | `SUPER_ADMIN`, `PRINCIPAL`, `ADMIN` |
| | `/api/tenants/applications/queue`| GET | Yes | Scoped | `SUPER_ADMIN` Only |
| | `/api/tenants/applications/:id/approve`| POST | Yes| Scoped | `SUPER_ADMIN` Only |
| **Organizations**| `/api/organizations` | GET | Yes | Org Scoped | `SUPER_ADMIN`, `ORG_DIRECTOR` |
| | `/api/organizations/:id` | GET | Yes | Org Scoped | `SUPER_ADMIN`, `ORG_DIRECTOR` |
| | `/api/organizations` | POST | Yes | Global/Org | `organization.manage` |
| | `/api/organizations/:id/parent`| PUT | Yes | ACID Mutex | `organization.manage` |
| | `/api/organizations/:id/tree` | GET | Yes | Org Scoped | Authenticated Org User |
| **Students** | `/api/students` | GET | Yes | `enforceTenant` | Scoped (PII Redacted by Role) |
| | `/api/students/:id` | GET | Yes | `enforceTenant` | Scoped (Ownership Checked) |
| | `/api/students` | POST | Yes | `enforceTenant` | `students.create` |
| | `/api/students/:id` | PUT | Yes | `enforceTenant` | `students.update` (Whitelisted) |
| | `/api/students/export` | GET | Yes | `enforceTenant` | `students.export` (Audited) |
| **Privacy** | `/api/privacy/requests` | POST | Yes | `enforceTenant` | Parent / Student (Self Wards) |
| | `/api/privacy/requests` | GET | Yes | `enforceTenant` | `privacy.manage` |
| | `/api/privacy/requests/:id/status`| PUT| Yes | `enforceTenant` | `privacy.manage` |
| **Admissions** | `/api/admissions` | GET | Yes | `enforceTenant` | `admissions.read` |
| | `/api/admissions/:id/approve`| POST | Yes | `enforceTenant` | `admissions.approve` |
| **Attendance** | `/api/attendance` | GET | Yes | `enforceTenant` | `attendance.read` |
| | `/api/attendance/mark` | POST | Yes | `enforceTenant` | `attendance.mark` |
| | `/api/attendance/lock` | POST | Yes | `enforceTenant` | `attendance.lock` |
| **Timetables** | `/api/timetables` | GET | Yes | `enforceTenant` | `timetable.read` |
| | `/api/timetables/cells` | POST | Yes | `enforceTenant` | `timetable.manage` |
| **Homework** | `/api/homework` | GET | Yes | `enforceTenant` | `homework.read` |
| | `/api/homework` | POST | Yes | `enforceTenant` | `homework.manage` |
| | `/api/homework/:id/submit`| POST | Yes | `enforceTenant` | `homework.submit` (`STUDENT`) |
| **Exams** | `/api/exams/papers` | GET | Yes | `enforceTenant` | `exams.read` |
| | `/api/exams/papers` | POST | Yes | `enforceTenant` | `exams.manage` |
| | `/api/exams/papers/:id/submit`| POST| Yes| `enforceTenant` | `exams.take` (`STUDENT`) |
| **Fees** | `/api/fees/types` | GET | Yes | `enforceTenant` | `fees.read` |
| | `/api/fees/receipts` | GET | Yes | `enforceTenant` | `fees.read` |
| | `/api/fees/receipts/collect`| POST | Yes| `enforceTenant` | `fees.collect` |
| **Operations** | `/api/operations/staff` | GET | Yes | `enforceTenant` | `staff.read` |
| | `/api/operations/payroll` | GET | Yes | `enforceTenant` | `payroll.manage` |
| | `/api/operations/payroll/disburse`| POST| Yes| `enforceTenant` | `payroll.manage` |
| **Audit Logs** | `/api/audit-logs` | GET | Yes | `enforceTenant` | `audit.read` (`SUPER_ADMIN`, `PRINCIPAL`, `ORG_DIRECTOR`) |

---

## 4. Input Sanitization & Attack Surface Hardening

1. **NoSQL Injection Defense:**
   - Any client payload containing `$gt`, `$ne`, `$where`, `$regex`, or MongoDB operators is stripped recursively before route handler invocation.
   - Non-string primitives on login inputs are immediately rejected with `400 INVALID_INPUT_TYPE`.
2. **Security Headers:**
   - `X-Content-Type-Options: nosniff` (Prevents MIME-type sniffing).
   - `X-Frame-Options: DENY` (Clickjacking defense).
   - `X-XSS-Protection: 1; mode=block` (Legacy cross-site scripting filter).
   - `Strict-Transport-Security: max-age=31536000; includeSubDomains` (HSTS).
3. **Payload Bounds:**
   - Body parsing limit is capped at `10mb`.
   - List query endpoints enforce pagination limits (max `200` items).
