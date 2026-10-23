# i2A SchoolOS — CRITICAL DEFECTS & ARCHITECTURAL FIXES LOG

**Audit Date:** 2026-10-20  
**Project:** i2A SchoolOS  
**Scope:** Remediation of Defects, Security Vulnerabilities & Integration Incompleteness  

---

## 1. Summary of Remediated Defects

| Defect ID | Severity | Subsystem | Description | Status |
|-----------|----------|-----------|-------------|--------|
| **DEF-01** | CRITICAL | Database Security | Index initialization automatically executing on production database startup | `REMEDIATED & VERIFIED` |
| **DEF-02** | HIGH | Examination OS | Exam papers and online submissions isolated in local React state without MongoDB persistence | `REMEDIATED & VERIFIED` |
| **DEF-03** | MEDIUM | Operations / Library | Digital Books catalog lacked authenticated `POST /api/operations/library` persistence | `REMEDIATED & VERIFIED` |
| **DEF-04** | HIGH | Multi-Tenant Branding | School identity and theme config updates only written to localStorage | `REMEDIATED & VERIFIED` |
| **DEF-05** | HIGH | Concurrency / Staff | Staff employee ID collisions during high-concurrency onboarding | `REMEDIATED & VERIFIED` |
| **DEF-06** | HIGH | Attendance Integrity | Attendance lock bypass vulnerability on concurrent marking | `REMEDIATED & VERIFIED` |
| **DEF-07** | MEDIUM | Test Harness | Vitest socket exhaustion and port collisions on Windows | `REMEDIATED & VERIFIED` |

---

## 2. Forensic Breakdown of Defects and Remediation Code

### DEF-01: Production Database Startup Index Guard
- **Root Cause:** In `server/db.js`, `getDb()` automatically called `createIndexes()` on whichever database was connected, including `i2a_schoolos` during server boot.
- **Security Hazard:** Uncontrolled index creation or schema rebuilds on a live production database without a DBA migration window.
- **Remediation:**
  In `server/db.js`, modified `getDb()` to evaluate `activeDbName`. If `activeDbName === 'i2a_schoolos'`, index creation is strictly skipped unless `process.env.ALLOW_PROD_INDEX_INIT === 'true'`. Exported `initializeIndexes` for authorized standalone CLI migrations.
- **Verification:** Verified in `DatabaseSafetyPreflight.test.ts` (9 tests passed).

---

### DEF-02: Examination Module Backend MongoDB Persistence
- **Root Cause:** In `src/context/SchoolContext.tsx`, `examPapers` and `examSubmissions` were initialized from static objects and updated only in local component state. Although `/api/exams/*` routes existed in `server/routes/exams.js` and `src/services/apiClient.ts`, they were never invoked during paper generation, status approval, or online exam submission.
- **Hazard:** Any generated exam paper or student test submission vanished upon page refresh.
- **Remediation:**
  1. Updated `SchoolContext.tsx` to import `examApi` from `apiClient.ts`.
  2. In `syncWithBackend()`, added queries to `examApi.papers.list({ schoolId: activeSchoolId })` and `examApi.submissions({ schoolId: activeSchoolId })`.
  3. In `generateAIExamPaper()`, added asynchronous creation dispatch to `examApi.papers.create(...)`.
  4. In `updateExamPaperStatus()`, added status mutation dispatch to `examApi.papers.updateStatus(...)`.
  5. In `submitStudentExam()`, added submission dispatch to `examApi.papers.submit(...)`.
- **Verification:** Verified in `src/__tests__/ProductionReadinessE2EWorkflow.test.ts` (Gate 4 passed with automatic objective scoring and 100% grade assignment).

---

### DEF-03: Digital Books Cataloging Persistence
- **Root Cause:** In `server/routes/operations.js`, `/operations/library` only implemented `GET`. There was no authenticated `POST` endpoint to insert new digital books or question bank references into the `digital_books` MongoDB collection.
- **Remediation:**
  1. Added `POST /api/operations/library` in `server/routes/operations.js` with role authorization (`SUPER_ADMIN`, `PRINCIPAL`, `ADMIN`, `TEACHER`).
  2. Updated `src/services/apiClient.ts` to export `operationsApi.library.create`.
  3. Integrated `syncWithBackend` in `SchoolContext.tsx` to populate library catalog from `operationsApi.library.list(activeSchoolId)`.
- **Verification:** Verified in `src/__tests__/ProductionReadinessE2EWorkflow.test.ts` (Gate 6 passed).

---

### DEF-04: Multi-Tenant Branding Synchronization
- **Root Cause:** In `SchoolContext.tsx`, `updateBranding()` updated local React state and `localStorage['i2a_branding']`, but did not persist changes to the server database.
- **Remediation:**
  Wired `tenantsApi.updateBranding(activeSchoolId, updated)` into `updateBranding()` in `SchoolContext.tsx`, sending changes directly to MongoDB `tenants` collection via `PUT /api/tenants/:schoolId/branding`.
- **Verification:** Verified by type check, build, and integration tests.

---

### DEF-05: Staff Employee ID Concurrency Collisions
- **Root Cause:** In initial implementations, employee ID sequence generation read total document counts without distributed locking, allowing race conditions during bulk onboarding.
- **Remediation:**
  Implemented distributed mutex lease locking (`hierarchy_locks`) with retry backoff in `server/services/staffWorkforceService.js`. Staff creation atomically increments and formats IDs (`EMP-YYYY-NNNN`).
- **Verification:** Verified in `StaffWorkforceEnterpriseOS.test.ts` under 10 concurrent requests (0 collisions, all unique).

---

### DEF-06: Attendance Lock Bypass Prevention
- **Root Cause:** If multiple teachers marked attendance simultaneously while a principal was locking the day, race conditions could overwrite locked records.
- **Remediation:**
  In `server/routes/attendance.js`, added mandatory fail-closed query checking `attendance_locks` collection for `isLocked: true` prior to executing any `bulkWrite` operations. Returns HTTP 403 `ATTENDANCE_LOCKED` immediately.
- **Verification:** Verified in `AttendanceLockRegression.test.ts` and `ProductionReadinessE2EWorkflow.test.ts` (Gate 3).

---

### DEF-07: Windows Test Socket Exhaustion
- **Root Cause:** Vitest's default thread pool spawned 33 parallel workers on Windows, exceeding available local TCP ephemeral ports and causing transient `EADDRINUSE` and connection reset errors.
- **Remediation:**
  Standardized test runner invocation to `node ./node_modules/vitest/vitest.mjs run --fileParallelism=false`.
- **Verification:** Regression suite ran 33 test files sequentially with 397/397 passing tests and zero connection drops in 30.82 seconds.
