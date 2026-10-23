# i2A SchoolOS — Master Prompt 02: Current Architecture Findings
**Document ID:** `DOC-MP02-ARCH-FINDINGS-002`  
**Phase:** Master Prompt 02 — Architecture Hardening & API Contracts  
**Auditor:** Principal Software Architect, Senior Full-Stack Engineer  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Executive Summary

An architectural audit of the active repository was conducted to inspect modularity, coupling, data flow, validation patterns, error propagation, and database connection safety.

The codebase exhibits a strong domain-driven division across education modules, but previously suffered from three structural vulnerabilities:
1. **Silent Fallback to Production Database during Testing:** Remediated via fail-closed `getDatabaseName()` guards in `server/db.js`.
2. **Inconsistent Error Response Formatting:** Standardized via `server/middleware/apiResponse.js` and normalized `ApiResult` fields in `src/services/apiClient.ts`.
3. **Implicit Primary Key Assumptions on Fixture Creation:** Remediated by enforcing deterministic IDs on all entities.

---

## 2. Layer-by-Layer Architectural Assessment

### 2.1 Frontend Architecture (`src/`)

- **Routing & Navigation:** `src/App.tsx` routes between `PUBLIC_SAAS`, `SCHOOL_PORTAL`, and `PLATFORM_ADMIN` views based on state provided by `SchoolContext.tsx`.
- **State Management (`SchoolContext.tsx`):**
  - **Size & Complexity:** Large module (~1,840 lines) hosting initial fixture objects for 10+ school modules.
  - **Coupling:** Combines tenant state, role state, translation helpers, and initial mock data.
  - **Sync Mechanism:** On mount and on `activeSchoolId` change, calls `syncWithBackend()` to fetch live tenants, students, admissions, and fee receipts from Express backend.
  - **Finding:** Fallback state is effective for offline UI previews, but write operations must commit directly through backend APIs to prevent state divergence.
- **API Client (`src/services/apiClient.ts`):**
  - Well-structured typed facade with typed sub-APIs (`studentsApi`, `feeApi`, `attendanceApi`, etc.).
  - Successfully wraps `fetch()` with automated `Authorization: Bearer <token>` injection.
  - Remediated to parse and expose `code`, `details`, and `requestId` across all `ApiResult` returns.

### 2.2 Backend Gateway & Middleware Pipeline (`server/`)

- **Middleware Ordering in `server/index.js`:**
  1. `cors()`: Cross-Origin Resource Sharing.
  2. `express.json({ limit: '10mb' })`: Body parsing.
  3. Custom Request Correlation Middleware: Assigns `req.requestId` and `req.startTime`.
  4. Health check endpoint (`GET /api/health`).
  5. Route module dispatch (`/api/auth`, `/api/tenants`, `/api/students`, etc.).
  6. Global 404 handler for unmatched `/api` routes.
  7. Global 500 error handling middleware.
- **Middleware Correctness:** The ordering is correct. Security, parsing, and correlation precede route handlers. Global error interception prevents unhandled exceptions from terminating the Node process.

### 2.3 Authentication & Authorization (`server/middleware/auth.js`)

- **JWT Validation:** Validates signature, expiration, and verifies that the database user record is active.
- **RBAC:** `requireRoles()` cleanly rejects unauthorized roles with 403 `INSUFFICIENT_PERMISSIONS`.
- **Tenant Isolation:** `enforceTenant()` checks URL parameters, query strings, and body parameters against `req.user.schoolId`. Injects authoritative `req.tenantFilter` for query execution. Super Admin retains cross-tenant visibility.
- **Audit Logging:** Every critical administrative action triggers `logAuditEvent()` into MongoDB `audit_logs`.

### 2.4 Database Layer (`server/db.js`)

- **Connection Lifecycle:** Singleton connection pool managed via `getDb()` and `closeDb()`.
- **Database Selection:**
  - Standard run: `DB_NAME || 'i2a_schoolos'`.
  - Test run: Strictly requires `TEST_DB_NAME` (`i2a_schoolos_test`). Rejects execution if missing or if pointing at the primary application database.
- **Indexes:** Automatic verification on connection ensures unique constraints on users, tenants, students, attendance locks, and webhooks.

---

## 3. Architecture Health Matrix

| Dimension | Initial State | Remediated State | Current Health |
| :--- | :--- | :--- | :--- |
| **Database Safety** | Silent fallback to app DB in tests | Strict fail-closed exception if `TEST_DB_NAME` unset | **EXCELLENT** |
| **API Error Uniformity** | Inconsistent shapes (mix of string and object errors) | Standardized `{ success: false, error, code, requestId }` | **EXCELLENT** |
| **Request Correlation** | Server-side only | Forwarded through API client and error responses | **EXCELLENT** |
| **Cross-Tenant IDOR** | Protected in routes | Protected with authoritative `tenantFilter` and 404 on cross-lookup | **EXCELLENT** |
| **Input Validation** | Ad-hoc checks in some routes | Strict input validation on mutations | **EXCELLENT** |
| **Frontend Network Egress** | Centralized in `apiClient.ts` | Centralized with code/requestId propagation | **EXCELLENT** |
