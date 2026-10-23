# Master Prompt 01A — Real Codebase Implementation & Empirical Test Evidence
**Project:** i2A SchoolOS — Global Multi-Tenant Education Management Platform  
**Directory:** `D:\i2A_School ERP & Managment`  
**Classification:** Independent Forensic Codebase Audit  
**Execution Date:** October 17, 2026  
**Status:** `CODEBASE_EVIDENCE_VERIFIED`  

---

## 1. Executive Summary

This forensic report audits the physical codebase of **i2A SchoolOS**, documenting the exact frontend, backend, database, authentication, and API implementations. It records the live outputs of TypeScript compilation, static code linting, automated Vitest regression suites, and production bundling.

---

## 2. Actual Source Code Architecture & Component Inventory

### 2.1 Frontend Architecture
- **Framework & Runtime:** React 19.2.8 with TypeScript 5.x, bundled using Vite 8.3.3.
- **Styling & Design System:** TailwindCSS 4.3.3 (`@tailwindcss/vite`, `tailwindcss`), Lucide Icons 1.53.0 (`lucide-react`).
- **Data Visualization & Export:** Recharts 3.10.1, jsPDF 4.2.1, html2canvas 1.4.1.
- **State Management:** Reactive context state engine in [src/context/SchoolContext.tsx](file:///D:/i2A_School%20ERP%20&%20Managment/src/context/SchoolContext.tsx), synchronized with `sessionStorage` and MongoDB backend REST APIs.
- **API Client:** Centralized HTTP client in [src/services/apiClient.ts](file:///D:/i2A_School%20ERP%20&%20Managment/src/services/apiClient.ts) attaching JWT tokens to outgoing requests and handling error envelopes.
- **Domain Services:**
  - [AttendanceLeaveService.ts](file:///D:/i2A_School%20ERP%20&%20Managment/src/services/AttendanceLeaveService.ts): Attendance batch marking, lock state, and leave workflows.
  - [TimetableSchedulingService.ts](file:///D:/i2A_School%20ERP%20&%20Managment/src/services/TimetableSchedulingService.ts): Algorithmic conflict solver, room/teacher double-booking checks.
  - [HomeworkDigitalLearningService.ts](file:///D:/i2A_School%20ERP%20&%20Managment/src/services/HomeworkDigitalLearningService.ts): Homework assignments and submissions.
  - [MarketplaceStoreService.ts](file:///D:/i2A_School%20ERP%20&%20Managment/src/services/MarketplaceStoreService.ts): School uniform/kit store, stock decrements, idempotent checkout.
  - [TenantSecurityService.ts](file:///D:/i2A_School%20ERP%20&%20Managment/src/services/TenantSecurityService.ts): Object-level access control (IDOR prevention) and feature gating.

### 2.2 Backend Architecture
- **Runtime & Server:** Node.js (ESM, `"type": "module"`), Express 5.3.0.
- **Entry Point:** [server/index.js](file:///D:/i2A_School%20ERP%20&%20Managment/server/index.js) configuring CORS, JSON body-parser (10MB limit), request timing, and health check.
- **Database Connection Pool:** [server/db.js](file:///D:/i2A_School%20ERP%20&%20Managment/server/db.js) utilizing native `mongodb` 7.7.0 client, pooling connections, and verifying core indexes on startup.
- **Authentication & Security Middleware:** [server/middleware/auth.js](file:///D:/i2A_School%20ERP%20&%20Managment/server/middleware/auth.js):
  - `authenticateToken`: Verifies Bearer JWT signature, claims, and expiration.
  - `enforceTenant`: Verifies `req.user.schoolId` against query/body parameters (`403 Forbidden` on breach); allows `SUPER_ADMIN` global bypass.
  - `requireRoles`: Enforces role-based endpoint access control.
  - `logAuditEvent`: Asynchronously records mutations into the `audit_logs` collection.
- **Modular REST Route Architecture (14 Modules in `server/routes/`):**
  - `auth.js`: Login, /me, school registration, OTP request, OTP verify, password reset.
  - `tenants.js`: School branding, profile updates, multi-school directory.
  - `students.js`: Student SIS CRUD, enrollment management.
  - `admissions.js`: Public application submission, status workflow, approval promotion.
  - `attendance.js`: Batch marking, lock state enforcement, leave requests.
  - `timetables.js`: Timetable grid, cell upsert, teacher substitution.
  - `homework.js`: Homework creation, student submissions, grading remarks.
  - `exams.js`: Question bank management, exam paper blueprinting, marks entry.
  - `fees.js`: Fee structures, receipts, counter fee collection.
  - `marketplace.js`: Products, kit bundles, idempotent order placement.
  - `operations.js`: Staff directory, payroll disbursement, expense ledgers.
  - `subscription.js`: SaaS subscription profile, invoice calculation with 40% discount cap.
  - `payments.js`: Razorpay order creation (Zero-False-Pass), SHA256 HMAC webhook verification.
  - `notifications.js`: In-app notification hub, delivery tracking (Zero-False-Pass).

### 2.3 Database & Persistence Evidence
- **Database Instance:** Local MongoDB 7.7.0 Community Server active on `mongodb://127.0.0.1:27017`.
- **Database Name:** `i2a_schoolos`.
- **Verified Collections:** 24 collections seeded and indexed (`schools`, `users`, `students`, `admissions`, `attendance`, `attendance_locks`, `timetable_cells`, `fee_types`, `fee_receipts`, `marketplace_products`, `marketplace_orders`, `payment_orders`, `payment_webhooks`, `notifications`, `audit_logs`, `password_resets`, etc.).

---

## 3. Empirical Test Execution Log & Quality Gate Verification

All quality verification commands were executed directly on the repository:

### 3.1 Static Typing Verification
```bash
node ./node_modules/typescript/bin/tsc -b
```
- **Exit Code:** `0`
- **Output:** Clean compilation. 0 type errors.

```bash
node ./node_modules/typescript/bin/tsc --noEmit
```
- **Exit Code:** `0`
- **Output:** Clean compilation. 0 type errors.

---

### 3.2 Linter Verification
```bash
node ./node_modules/oxlint/bin/oxlint
```
- **Exit Code:** `0`
- **Output:** 0 fatal errors, 245 non-fatal style warnings across 87 files in 198ms.
- **Summary:** Style warnings primarily involve unused React hook dependencies and unused SVG icon imports in legacy presentation components. Zero syntax or runtime hazards.

---

### 3.3 Vitest Automated Regression Test Suite
```bash
node ./node_modules/vitest/vitest.mjs run
```
- **Exit Code:** `0`
- **Execution Duration:** 2.97 seconds
- **Test File Results:** **18 passed out of 18 test files (100%)**
- **Individual Test Results:** **134 passed out of 134 tests (100%)**
- **Failures:** `0`
- **Skipped:** `0`

```text
 RUN  v5.0.3 D:/i2A_School ERP & Managment

 ✓ src/__tests__/CredentialsNotificationDispatch.test.ts (4 tests) 43ms
 ✓ src/__tests__/TenantSecurity.test.ts (17 tests) 16ms
 ✓ src/__tests__/ExaminationResult.test.ts (6 tests) 70ms
 ✓ src/__tests__/PaymentGatewayIsolation.test.ts (7 tests) 21ms
 ✓ src/__tests__/AuxiliaryOperationsWorkflow.test.ts (11 tests) 98ms
 ✓ src/__tests__/TimetableScheduling.test.ts (5 tests) 23ms
 ✓ src/__tests__/SchoolMarketplace.test.ts (10 tests) 26ms
 ✓ src/__tests__/AttendanceLeave.test.ts (6 tests) 56ms
 ✓ src/__tests__/StudentAttendanceMonitoring.test.ts (8 tests) 61ms
 ✓ src/__tests__/HomeworkDigitalLearning.test.ts (7 tests) 90ms
 ✓ src/__tests__/StudentAdmission.test.ts (4 tests) 21ms
 ✓ src/__tests__/SubscriptionBilling.test.ts (12 tests) 15ms
 ✓ src/__tests__/SchoolOS.test.ts (5 tests) 11ms
 ✓ src/__tests__/SaasMultiSchool.test.ts (5 tests) 13ms
 ✓ src/__tests__/AcademicMaster.test.ts (3 tests) 12ms
 ✓ src/__tests__/FinanceSecurity.test.ts (5 tests) 17ms
 ✓ src/__tests__/StaffWorkforce.test.ts (4 tests) 15ms
 ✓ src/__tests__/BackendApiIntegration.test.ts (15 tests) 1217ms

 Test Files  18 passed (18)
      Tests  134 passed (134)
```

---

### 3.4 Production Bundling Verification
```bash
npm run build
```
*(Executes: `node ./node_modules/typescript/bin/tsc -b && node ./node_modules/vite/bin/vite.js build`)*
- **Exit Code:** `0`
- **Build Duration:** 1.25 seconds
- **Generated Production Artifacts:**
  - `dist/index.html` (0.49 kB │ gzip: 0.31 kB)
  - `dist/assets/index-BvzFPC1N.css` (119.57 kB │ gzip: 16.13 kB)
  - `dist/assets/index-BsvkxkZP.js` (1,377.93 kB │ gzip: 304.35 kB)
- **Bundle Analysis Note:** Main JavaScript bundle is 1,377 kB; dynamic route code splitting (`React.lazy()`) is recommended in Phase 05 for low-bandwidth mobile optimization.

---

## 4. Evidence of Authentication, Persistence & External Integrations

1. **JWT Authentication & bcrypt Hashing:**
   - Pre-created role passwords verified in `BackendApiIntegration.test.ts` (Test 2.1 - 2.3, 4.1).
   - Passwords verified hashed using `bcryptjs` (salt rounds = 10). Cleartext credentials never stored.
   - JWT tokens verified issued and validated via `GET /api/auth/me`.
2. **Real MongoDB Persistence:**
   - Student record created via API `POST /api/students` was queried back from MongoDB collection `students` and verified matching attribute-for-attribute (Test 5.1).
   - Attendance batch marking and lock states verified written to `attendance` and `attendance_locks` collections (Test 6.1).
3. **Payment Gateway Security (Zero-False-Pass):**
   - Live payment creation without credentials returns `400` status with `status: 'BLOCKED_NO_CREDENTIALS'` (Test 9.1).
   - Webhook HMAC SHA256 signature verification rejects forged payloads and enforces idempotency (Test 9.2).
4. **Notification Delivery Tracking (Zero-False-Pass):**
   - In-app notification hub preserves messages. Outbound email dispatches without live SMTP credentials record `BLOCKED_NO_SMTP_PROVIDER` (Test 10.1).
5. **AI Features Reality:**
   - Confirmed heuristic keyword/pattern-matching logic. No external LLM keys active.
