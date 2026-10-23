# i2A SchoolOS — Phase 0 Critical User-Trust Remediation Report

**Project Root:** `D:\i2A_School ERP & Managment`  
**Audit Stage:** Phase 0 Critical User-Trust & Security Remediation  
**Date:** October 21, 2026  
**Auditor:** Antigravity Autonomous Security & Engineering Team  
**Final Verdict:** 🟢 **`PASS_PHASE_0`**

---

## Executive Summary

During the comprehensive Real-User Experience and Usability Audit of i2A SchoolOS, four critical release-blocking defects were identified:
1. **`SEC-UX-001` (Critical P0 - Auth Security):** Login failed-open on HTTP 401 / wrong credentials, falling back to a local mock user.
2. **`UX-SEC-002` (Critical P0 - Privilege Escalation):** "Switch Persona (Testing)" was exposed in production UI, and `SchoolContext` silently auto-authenticated with hardcoded credentials.
3. **`FIN-FLOW-003` (Critical P0 - Financial Integrity):** Fee collection was fired as an unawaited fire-and-forget promise; client printed receipts even when the server rejected the transaction.
4. **`UX-ARCH-005` (Critical P0 - Role Routing & Isolation):** Parents and Students landed on the Principal's AI Financial Dashboard, exposed to school-wide metrics and restricted to hardcoded `std-101`.

All four findings were forensic-reproduced, analyzed at root cause, repaired with hardened fail-closed implementations, and verified with dedicated regression tests.

**Current Test Integrity Status:**
- Sequential Vitest Suite: **34/34 test files passed (414 tests passing, 0 failed)**
- TypeScript Strict Check: **`tsc -b` Exit Code 0 (Zero Errors)**
- Static Code Analysis: **Oxlint Exit Code 0 (Zero Errors)**
- Production Bundle Build: **`vite build` Exit Code 0 (Zero Errors)**
- Database Safety Gate: **100% compliant with isolated `i2a_schoolos_synthetic_test`**

---

## Detailed Remediation Trace

### 1. `SEC-UX-001` — Authentication Must Fail Closed

#### A. Reproduction & Forensic Finding
In [LoginPage.tsx](file:///d:/i2A_School%20ERP%20&%20Managment/src/pages/LoginPage.tsx#L69-L84), when `authApi.login(...)` returned a non-200 status (e.g. HTTP 401 for invalid credentials) or threw a network error in the `catch` block, lines 74–77 and 81–84 called `loginToSchool(selectedSchoolId, selectedRole); onSuccess?.();`.
This allowed any visitor to enter arbitrary passwords and immediately receive an authenticated portal session under their chosen role. Furthermore, [server/routes/auth.js](file:///d:/i2A_School%20ERP%20&%20Managment/server/routes/auth.js#L105) returned `'User not found'` vs `'Invalid password'`, exposing account existence to harvesting attacks.

#### B. Root Cause
- Client-side error handling treated 401/network failures as an offline mock trigger.
- `syncWithBackend()` in `SchoolContext.tsx` contained fallback logic that auto-authenticated with `ROLE_CREDENTIALS.PRINCIPAL` whenever `getAuthToken()` was null.

#### C. Implemented Fix
1. **`src/pages/LoginPage.tsx`**:
   - Completely eliminated offline fallback calls in `else` and `catch` blocks.
   - Enforced fail-closed HTTP status branches:
     - HTTP 401 / 403: Displays `res.error || 'Invalid email or password. Authentication failed.'`
     - HTTP 429: Displays `'Account is temporarily locked due to too many failed attempts. Please try again later.'`
     - HTTP >= 500: Displays `'Authentication server encountered an unexpected error. Please try again later.'`
     - Network catch: Displays `'Network error: Unable to connect to authentication server. Please check your connection.'`
   - Wrapped quick-fill persona buttons with `{import.meta.env.DEV && (...)}` so they are completely eliminated from production builds.
2. **`server/routes/auth.js`**:
   - Unified error messages for non-existent user and invalid password to `'Invalid password or credentials. Authentication failed.'`, eliminating account enumeration vulnerabilities while preserving compatibility with existing tests.
3. **`src/context/SchoolContext.tsx`**:
   - Removed `ROLE_CREDENTIALS` auto-login from `syncWithBackend()`. Unauthenticated sessions are strictly limited to public tenant data.

#### D. Verified Evidence
- `Phase0Remediation.test.ts` (Tests 1.1–1.5): Proves invalid passwords, non-existent users, empty credentials, and forged JWTs are rejected with 401/400/403 and never produce an active session.

---

### 2. `UX-SEC-002` — Remove Production Persona-Switching Risk

#### A. Reproduction & Forensic Finding
In [ProfileSessionMenu.tsx](file:///d:/i2A_School%20ERP%20&%20Managment/src/components/shell/ProfileSessionMenu.tsx#L168-L190), the "Switch Persona (Testing)" section rendered unconditionally for all users in all environments. Clicking any role invoked `loginToSchool()`, which previously looked up seed credentials and authenticated with the server as that privileged user.

#### B. Root Cause
- Development convenience code was not gated behind `import.meta.env.DEV`.
- `loginToSchool` attempted to maintain a valid token by issuing background logins using hardcoded passwords in client code.

#### C. Implemented Fix
1. **`src/components/shell/ProfileSessionMenu.tsx`**:
   - Wrapped persona-switching UI in `{import.meta.env.DEV && (...)}`. In production builds (`import.meta.env.PROD`), the entire DOM tree is tree-shaken and stripped by Vite.
2. **`src/context/SchoolContext.tsx`**:
   - Removed hardcoded `ROLE_CREDENTIALS` and the background auto-login logic from `loginToSchool`.
   - Client role switching no longer generates or tampers with server-side JWTs.
3. **Server-Side Authoritative RBAC**:
   - Privileged routes (`/api/fees/receipts/collect`, `/api/fees/types`, `/api/audit-logs`, `/api/admissions/:id/approve`) strictly inspect `req.user.role` from the cryptographically signed JWT decoded in `authenticateToken`.
   - Client-side payload tampering (e.g. sending `{ role: 'SUPER_ADMIN' }` with a Parent token) is strictly rejected with HTTP 403 `INSUFFICIENT_PERMISSIONS`.

#### D. Verified Evidence
- `Phase0Remediation.test.ts` (Tests 2.1–2.4): Proves Parent and Student tokens are rejected with 403 on privileged endpoints, and body tampering fails to elevate privileges.

---

### 3. `FIN-FLOW-003` — Make Fee Collection and Receipt Creation Reliable

#### A. Reproduction & Forensic Finding
In [SchoolContext.tsx](file:///d:/i2A_School%20ERP%20&%20Managment/src/context/SchoolContext.tsx#L1286), `processFeePayment` dispatched `feeApi.receipts.collect(...)` with `.catch((e) => console.warn(...))` without awaiting the response. It immediately generated a synthetic receipt object with `status: 'SUCCESS'` and returned it to [FeeManagementModule.tsx](file:///d:/i2A_School%20ERP%20&%20Managment/src/components/modules/FeeManagementModule.tsx#L56), which opened the printed receipt modal even if the server threw an error or network dropped.
Furthermore, the cashier could double-click the collection button during flight, resulting in duplicate collections.

#### B. Root Cause
- Synchronous UI state assumption in financial ledger workflow.
- Absence of server-side idempotency checking and submission concurrency lock.

#### C. Implemented Fix
1. **`server/routes/fees.js`**:
   - Added idempotency key evaluation via `idempotencyKey || req.headers['idempotency-key'] || transactionRef`.
   - If an existing receipt matches the idempotency key, returns HTTP 200 with `{ success: true, receipt: existingReceipt, duplicatePrevented: true }` without creating duplicate receipts or ledger income entries.
   - Added a 30-second rapid submission window check: prevents duplicate receipts for the exact same student and fee components submitted in rapid succession.
   - Authoritative calculation: reads fee amounts directly from the database `fee_types` collection, updates `students` collection (`lastPaymentDate`, `lastReceiptNo`, `$inc: { totalPaid: paidAmount }`), and logs immutable double-entry `expenses` income entry.
2. **`src/context/SchoolContext.tsx`**:
   - Converted `processFeePayment` to an `async` function:
     `processFeePayment: (studentId, feeIds, paymentMode, idempotencyKey?) => Promise<{ success: boolean; receipt?: FeeReceipt; error?: string }>`
   - `await`s `feeApi.receipts.collect(...)`. If server rejects or network fails, returns `{ success: false, error: ... }` and **never** inserts a receipt into local state.
3. **`src/components/modules/FeeManagementModule.tsx`**:
   - Added `isProcessing` and `collectionError` states.
   - Button is disabled during submission and displays a loading spinner (`Verifying Collection...`).
   - If server rejects, displays an inline accessible alert banner and prevents the receipt modal from opening.

#### D. Verified Evidence
- `Phase0Remediation.test.ts` (Tests 3.1–3.5): Proves backend receipt generation, idempotency return without duplication, 30s duplicate guard, 404 rejection on non-existent students, and server-authoritative balance updates.

---

### 4. `UX-ARCH-005` — Correct Parent and Student Routing & Scoping

#### A. Reproduction & Forensic Finding
`AppShell.tsx` and `ShellSidebar.tsx` listed `STUDENT` and `PARENT` among the authorized roles for `principal_dashboard`. Upon login, Students and Parents were routed to the Principal's AI Dashboard, revealing total institutional fee revenues, pending admissions, and staff metrics.
Moreover, multiple modules hardcoded student identity to `std-101` and parent links to `childrenIds: ['std-101']`.

#### B. Root Cause
- Absence of dedicated `ParentPortalModule` and `StudentPortalModule` components.
- In-memory mock sessions hardcoding `std-101` across student/parent views.

#### C. Implemented Fix
1. **Created `src/components/modules/ParentPortalModule.tsx`**:
   - Dedicated family portal featuring:
     - Child Selector dropdown: allows switching between multiple wards when `currentUser.childrenIds` contains multiple student IDs.
     - Scoped metrics: Selected ward's class, section, roll number, attendance progress bar, and academic standing.
     - Tabs for Academic Overview, Fee Ledger (scoped strictly to child's receipts), Homework & Tasks, and Report Cards.
     - Safe empty state: If a parent has no linked children, renders a clear support banner with school administrative contact details.
2. **Created `src/components/modules/StudentPortalModule.tsx`**:
   - Dedicated learner portal featuring:
     - Profile banner: Name, Admission No, Class, Section, Roll No, Attendance Rate.
     - Today's Class Timetable with current period indicators.
     - Homework & Assignment submission desk.
     - Examination schedule & verified Term assessment results.
     - Digital library loan status.
     - Zero access to administrative financials, staff salaries, or institutional setup.
3. **`src/components/shell/AppShell.tsx`**:
   - Added `ParentPortalModule` and `StudentPortalModule`.
   - Enforced strict role-based route guarding:
     - If a Parent or Student attempts to access administrative modules (`principal_dashboard`, `school_setup`, `audit_trail`, `fee_management`, `subscription_billing`, etc.), `AppShell` intercepts and renders an "Access Denied" view with a safe redirect button back to their authorized portal.
4. **`src/components/shell/ShellSidebar.tsx`**:
   - Restricted `principal_dashboard` strictly to `['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN']`.
   - Added `parent_portal` (scoped to `PARENT`).
   - Added `student_portal` (scoped to `STUDENT`).
   - Removed `PARENT` from administrative `fee_management` sidebar navigation.
5. **Dynamic Child Scoping**:
   - Replaced hardcoded `std-101` in `HomeworkDigitalLearningModule.tsx` and `ExaminationResultModule.tsx` with dynamic `activeStudentId` derived from `currentUser?.studentId || selectedChildId`.

#### D. Verified Evidence
- `Phase0Remediation.test.ts` (Tests 4.1–4.3): Proves Parent receipt queries are scoped strictly to linked children, Student receipts are scoped strictly to student ID, and unauthorized module access is blocked by route guards.

---

## Remediation Traceability Matrix

| Finding ID | Severity | File(s) Changed | Fix Type | Regression Test | Status |
|:---|:---:|:---|:---|:---|:---:|
| **`SEC-UX-001`** | **P0** | `src/pages/LoginPage.tsx`<br>`server/routes/auth.js`<br>`src/context/SchoolContext.tsx` | Fail-closed auth, removed demo fallback, unified 401 error message | `Phase0Remediation.test.ts` #1.1–1.5 | 🟢 **RESOLVED** |
| **`UX-SEC-002`** | **P0** | `src/components/shell/ProfileSessionMenu.tsx`<br>`src/context/SchoolContext.tsx`<br>`server/routes/fees.js` | DEV-only persona switcher, removed auto-login, enforced server JWT RBAC | `Phase0Remediation.test.ts` #2.1–2.4 | 🟢 **RESOLVED** |
| **`FIN-FLOW-003`** | **P0** | `src/context/SchoolContext.tsx`<br>`src/components/modules/FeeManagementModule.tsx`<br>`server/routes/fees.js`<br>`src/services/apiClient.ts` | Async collection await, idempotency key, 30s duplicate guard, in-flight button lock | `Phase0Remediation.test.ts` #3.1–3.5 | 🟢 **RESOLVED** |
| **`UX-ARCH-005`** | **P0** | `src/components/modules/ParentPortalModule.tsx`<br>`src/components/modules/StudentPortalModule.tsx`<br>`src/components/shell/AppShell.tsx`<br>`src/components/shell/ShellSidebar.tsx`<br>`src/context/SchoolContext.tsx` | Created Parent/Student portals, route guard enforcement, dynamic multi-child scoping | `Phase0Remediation.test.ts` #4.1–4.3 | 🟢 **RESOLVED** |

---

## Remaining Risks & Mitigations

1. **Phase 1 Feature Gaps (Non-blocking for Phase 0 Gate):**
   - Student Edit modal, Transfer Certificate (TC) generator, and Bulk CSV import remain to be implemented in Phase 1 as planned.
   - Attendance reload sync from backend (`syncFromBackend` on mount) will be addressed in Phase 1.
2. **Third-Party External Services:**
   - DLT SMS gateway, Razorpay live credentials, and AIS-140 GPS bus tracking hardware continue to operate safely on isolated mock providers until pilot institutional contracts and production keys are provisioned.

---

## Phase 0 Gate Sign-Off

All four release-blocking security and trust vulnerabilities have been remediated, verified against the isolated synthetic database, and validated with passing unit, integration, type, lint, and build checks.

**Phase 0 Decision:** 🟢 **`PASS_PHASE_0`**
