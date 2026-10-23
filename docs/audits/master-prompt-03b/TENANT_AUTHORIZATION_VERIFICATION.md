# i2A SchoolOS — Master Prompt 03B: Tenant Authorization Verification
**Document ID:** `DOC-MP03B-TENANT-AUTH-002`  
**Phase:** Master Prompt 03B — Domain Model Forensic Verification & Regression Gate  
**Auditor:** Senior Multi-Tenant SaaS Security Engineer, Application Security Lead  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Executive Summary & Audit Scope

This document provides a forensic verification of the multi-tenant authorization layer in i2A SchoolOS, examining:
- [`server/middleware/auth.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/middleware/auth.js)
- [`src/services/TenantSecurityService.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/services/TenantSecurityService.ts)
- Associated route handlers in `server/routes/`

The goal is to verify that:
1. Client-supplied tenant parameters in HTTP headers, paths, queries, or bodies cannot bypass tenant isolation.
2. `req.tenantFilter` is authoritatively derived and applied to database queries.
3. Multi-branch organization directors are restricted strictly to child branches under their organization.
4. Branch administrators, teachers, parents, and students cannot access unauthorized cross-tenant or object-level records.

---

## 2. In-Depth Middleware Code Inspection (`server/middleware/auth.js`)

### 2.1 Authoritative User Session Extraction (`authenticateToken`, lines 34–103)
- **Token Decoding & Verification (lines 35–48):**
  - Extracts Bearer JWT from `Authorization` header.
  - Verifies signature using `JWT_SECRET`.
- **Database User Liveness & Status Verification (lines 50–70):**
  - Queries active database: `await database.collection('users').findOne({ id: decoded.id })`.
  - Rejects missing accounts with `401 USER_NOT_FOUND`.
  - Rejects accounts with `status === 'SUSPENDED'` or `'LOCKED'` with `403 ACCOUNT_SUSPENDED`.
- **Authoritative Context Injection (lines 72–84):**
  ```javascript
  req.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    schoolId: user.schoolId,
    orgId: user.orgId || null,
    studentId: user.studentId,
    childrenIds: user.childrenIds,
    assignedClasses: user.assignedClasses,
    subjects: user.subjects
  };
  ```
- **Finding:** Client-supplied claims are ignored; `req.user` is built strictly from the authoritative database record.
- **Status:** **`PASS`**

---

### 2.2 Client Parameter Tampering Interception (`enforceTenant`, lines 111–158)

#### A. Standard School Tenant Check (lines 144–157)
```javascript
const requestedSchoolId = req.params.schoolId || req.query.schoolId || req.body?.schoolId;

if (requestedSchoolId && requestedSchoolId !== req.user.schoolId) {
  return res.status(403).json({
    success: false,
    error: `FORBIDDEN: Cross-tenant access violation. Your account belongs to [${req.user.schoolId}] and cannot access [${requestedSchoolId}].`,
    code: 'CROSS_TENANT_VIOLATION',
    requestId: req.requestId
  });
}

// Inject authoritative tenant filter for all subsequent database queries
req.tenantFilter = { schoolId: req.user.schoolId };
next();
```
- **Forensic Assessment:**
  - If a client account belonging to `I2A-SCH-000001` specifies `schoolId = 'I2A-SCH-000002'` in the URL path, query string, or JSON body, the middleware immediately intercepts the request and terminates execution with HTTP 403 `CROSS_TENANT_VIOLATION`.
  - Regardless of client payload, `req.tenantFilter` is authoritatively assigned `{ schoolId: req.user.schoolId }`.
- **Status:** **`PASS`**

#### B. Organization Director Governance Check (lines 124–142)
```javascript
if (req.user.role === 'ORG_DIRECTOR' && req.user.orgId) {
  const requestedSchoolId = req.params.schoolId || req.query.schoolId || req.body?.schoolId;
  if (!requestedSchoolId) {
    req.tenantFilter = { orgId: req.user.orgId };
    return next();
  }
  const database = await getDb();
  const isAuthorized = await isSchoolUnderOrganization(req.user.orgId, requestedSchoolId, database);
  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      error: `FORBIDDEN: Cross-tenant organization violation. Organization [${req.user.orgId}] does not govern school [${requestedSchoolId}].`,
      code: 'CROSS_TENANT_VIOLATION',
      requestId: req.requestId
    });
  }
  req.tenantFilter = { schoolId: requestedSchoolId };
  return next();
}
```
- **Forensic Assessment:**
  - An Organization Director can access child schools **only** if `isSchoolUnderOrganization(req.user.orgId, requestedSchoolId, database)` confirms that the school belongs to their organization tree.
  - Attempting to query an external school (e.g. DPS Director requesting St. Xavier's data) returns HTTP 403 `CROSS_TENANT_VIOLATION`.
- **Status:** **`PASS`**

---

## 3. Object-Level Authorization (`src/services/TenantSecurityService.ts`)

### 3.1 Branch Administrator Isolation (`validateBranchAccess`, lines 82–108)
- **Code Logic:**
  - Verifies session is active.
  - Allows `SUPER_ADMIN`.
  - Allows if `user.tenantId === targetBranchId`.
  - Allows if `authorizedBranchIds` explicitly includes `targetBranchId`.
  - Otherwise throws `TenantSecurityException`:
    `DENIED: Branch administrator isolation violation. User branch (${user.tenantId}) cannot access branch (${targetBranchId}).`
- **Audit Verification:** Tested in `DomainModelAndHierarchy.test.ts` (Scenario 3): Branch 1 administrator is strictly blocked from Branch 2 and Branch 3.
- **Status:** **`PASS`**

### 3.2 Parent & Student Object Authorization (`authorizeObjectAccess`, lines 117–163)
- **Parent Object Authorization (lines 135–142):**
  - Parents are restricted strictly to students listed in `user.childrenIds`.
  - Attempting to inspect another student triggers `TenantSecurityException`:
    `DENIED: Parent attempted to access unauthorized child profile.`
- **Student Object Authorization (lines 144–150):**
  - Students are restricted strictly to their own ID (`resource.studentId === user.id`).
  - Attempting to inspect another student triggers `TenantSecurityException`.
- **Status:** **`PASS`**

---

## 4. Empirical Test Evidence Matrix

| Security Scenario | Test Suite & Test Case | Verified Result | Status |
| :--- | :--- | :--- | :---: |
| Cross-Tenant Query Parameter Manipulation | `ApiContractsAndValidation.test.ts` (Scenario 4) | Client passing foreign `schoolId` receives 403 `CROSS_TENANT_VIOLATION`. | **PASS** |
| Cross-Tenant Record ID Access (IDOR) | `DomainModelAndHierarchy.test.ts` (Scenario 4) | Access to foreign record ID throws `TenantSecurityException`. | **PASS** |
| Organization Director Boundary Enforcement | `DomainModelAndHierarchy.test.ts` (Scenario 2) | DPS Director allowed on Branches 1 & 3; blocked on St. Xavier and Independent. | **PASS** |
| Branch Administrator Sister-Branch Isolation | `DomainModelAndHierarchy.test.ts` (Scenario 3) | Branch 1 admin blocked from Branch 3 despite sharing parent trust. | **PASS** |
| Foreign Tenant Student Enrollment Boundary | `DomainModelAndHierarchy.test.ts` (Scenario 5) | Enrolling School 1 student into School 2 rejected via `validateEnrollmentBoundaries`. | **PASS** |
| Suspended / Unauthenticated Session | `DomainModelAndHierarchy.test.ts` (Scenario 13) | Missing or suspended session rejected with 401 Unauthorized. | **PASS** |
| Parent Object-Level Child Access | `TenantSecurity.test.ts` (T008) | Parent querying unlinked child record blocked with 403. | **PASS** |
