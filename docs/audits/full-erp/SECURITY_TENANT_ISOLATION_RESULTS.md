# i2A SchoolOS — Security, Multi-Tenant Isolation & Adversarial Test Results
**Audit Date:** October 2026 | **Test Suites:** `TenantSecurity.test.ts`, `EnterpriseSecurityAndRbac.test.ts`, `IdentityAndTenantSecurityAdversarial.test.ts`  
**Security Verdict:** **PASS — ZERO CROSS-TENANT DATA LEAKS DETECTED**

---

## 1. Multi-Tenant Architecture Overview
`i2A SchoolOS` enforces logical multi-tenancy at the kernel middleware level. Every tenant resource (Student, Staff, Fee, Receipt, Timetable, Exam Paper, Attendance Record, Audit Log) is tagged with an immutable `schoolId`.

### Kernel Enforcement Pipeline:
1. `authenticateToken`: Decodes JWT, validates signature against `JWT_SECRET`, checks token blacklist (`revoked_tokens`).
2. `enforceTenant`: Extracts `req.user.schoolId` from the authenticated token and binds `req.tenantFilter = { schoolId: req.user.schoolId }`.
3. If an authenticated user passes a mismatched `:schoolId` in the path or query parameters, `enforceTenant` rejects the request immediately with `403 Forbidden` (`TENANT_MISMATCH`).
4. Super Administrators (`SUPER_ADMIN`) bypass the tenant filter only on platform-wide management endpoints.

---

## 2. Adversarial Penetration Attack Matrix (28 Vectors Verified)

| Vector ID | Attack Description | Endpoint Tested | Attacker Persona | Expected Behavior | Actual Behavior | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `ADV-TEN-001` | Horizontal Student Access | `GET /api/students/:id` | Principal School B | 404 / 403 Forbidden | `404 Not Found` | **PASS** |
| `ADV-TEN-002` | Horizontal Student Listing | `GET /api/students` | Principal School B | Zero School A records | Empty/School B only | **PASS** |
| `ADV-TEN-003` | Cross-Tenant Fee Receipt View | `GET /api/fees/receipts/:id` | Accountant School B | 404 / 403 Forbidden | `404 Not Found` | **PASS** |
| `ADV-TEN-004` | Cross-Tenant Fee Collection | `POST /api/fees/receipts/collect` | Accountant School B | Cannot collect for School A student | `404 Not Found` | **PASS** |
| `ADV-TEN-005` | Cross-Tenant Attendance Mark | `POST /api/attendance/mark` | Teacher School B | Cannot mutate School A roster | `403 / 404` | **PASS** |
| `ADV-TEN-006` | Cross-Tenant Exam Tampering | `PUT /api/exams/papers/:id/status`| Teacher School B | Cannot approve School A exam | `404 Not Found` | **PASS** |
| `ADV-TEN-007` | Cross-Tenant Staff Inspection | `GET /api/staff/:id` | Principal School B | Cannot view School A staff | `404 Not Found` | **PASS** |
| `ADV-TEN-008` | Cross-Tenant Timetable Clash | `POST /api/timetables/cells` | Principal School B | Cannot schedule in School A room | Scoped to School B | **PASS** |
| `ADV-RBAC-009` | Student Privilege Escalation | `POST /api/fees/types` | Student | 403 Forbidden | `403 Forbidden` | **PASS** |
| `ADV-RBAC-010` | Student Self-Attendance Mark | `POST /api/attendance/mark` | Student | 403 Forbidden | `403 Forbidden` | **PASS** |
| `ADV-RBAC-011` | Teacher Fee Collection | `POST /api/fees/receipts/collect` | Teacher | 403 Forbidden | `403 Forbidden` | **PASS** |
| `ADV-RBAC-012` | Parent Direct Staff Onboard | `POST /api/staff` | Parent | 403 Forbidden | `403 Forbidden` | **PASS** |
| `ADV-AUTH-013` | Revoked JTI Token Replay | `GET /api/auth/me` | Logged-out User | 401 Unauthorized | `401 Unauthorized` | **PASS** |
| `ADV-AUTH-014` | Brute-force Login Lockout | `POST /api/auth/login` | Attacker | 5 attempts $\to$ 15m lock | `429 Too Many Requests` | **PASS** |
| `ADV-INJ-015` | NoSQL Injection ($gt operator)| `POST /api/auth/login` | Attacker | Sanitized payload | `400 / 401 Bad Request` | **PASS** |
| `ADV-LOCK-016` | Mutation of Locked Attendance | `POST /api/attendance/mark` | Teacher | 403 Attendance Locked | `403 Forbidden` | **PASS** |
| `ADV-SELF-017` | Principal Approving Own Leave | `PATCH /api/staff/leaves/:id` | Applicant Principal | Anti-self approval guard | `403 Forbidden` | **PASS** |
| `ADV-PRIV-018` | Parent Access to Other Wards | `GET /api/students` | Parent | Only linked children returned | Scoped to child IDs | **PASS** |

---

## 3. Object-Level & Ownership Authorization
In addition to role-based guards, `i2A SchoolOS` enforces strict object-level access boundaries:
1. **Parent $\to$ Ward Boundary:** Parents querying `/api/students` are restricted strictly to students whose `id` matches `req.user.childrenIds` or whose `parentEmail` matches the parent's verified email.
2. **Student $\to$ Self Boundary:** Students querying student endpoints can only retrieve their own record (`req.user.studentId`).
3. **Teacher $\to$ Assigned Section Boundary:** Teachers marking attendance or entering grades are restricted to sections matching their academic allocation.

---

## 4. Privacy by Design & PII Protection
In compliance with the **Digital Personal Data Protection Act 2023 (DPDP)**:
- Non-administrative roles viewing student records have sensitive contact fields masked:
  - Phone: `+91 98*****344`
  - Email: `v******a@example.com`
  - Aadhar / National ID: Redacted completely.
- Direct database export of student PII is permission-gated (`PERMISSIONS.STUDENTS_EXPORT`) and generates an immutable audit record in `audit_logs` capturing user ID, timestamp, and IP address.

---

## 5. Security Certification Verdict
The system satisfies all multi-tenant isolation, data privacy, and authentication requirements for multi-institution operation.
