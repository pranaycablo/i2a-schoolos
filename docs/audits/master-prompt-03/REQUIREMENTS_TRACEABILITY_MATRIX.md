# i2A SchoolOS — Master Prompt 03: Requirements Traceability Matrix
**Document ID:** `DOC-MP03-RTM-010`  
**Phase:** Master Prompt 03 — Domain Model, Data Dictionary & Organization Hierarchy  
**Compliance Lead:** Principal Systems Auditor, Senior QA Architect  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Traceability Matrix

| Req ID | Business Requirement | Related Entity / Module | Implementation File | Verified Automated Test | Actual Test Result | Final Status |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: |
| **REQ-03-01** | Disambiguation of identical school names across tenants | `BranchCampus` (`tenants`) | [`server/routes/tenants.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/routes/tenants.js) | `DomainModelAndHierarchy.test.ts` (Scenario 1) | `I2A-SCH-000001` and `I2A-SCH-000004` disambiguated; 0 data leakage | **PASS** |
| **REQ-03-02** | Parent organization access limited to authorized child branches | `Organization`, `BranchCampus` | [`server/services/hierarchyService.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js) | `DomainModelAndHierarchy.test.ts` (Scenario 2) | DPS Group sees Branches 1 & 3; St. Xavier & Independent blocked | **PASS** |
| **REQ-03-03** | Branch admin restricted strictly to authorized branch | `TenantSecurityService` | [`src/services/TenantSecurityService.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/services/TenantSecurityService.ts) | `DomainModelAndHierarchy.test.ts` (Scenario 3) | Branch 1 admin blocked from Branch 3 and Branch 2 | **PASS** |
| **REQ-03-04** | Cross-tenant record ID access rejected (IDOR prevention) | `TenantSecurityService`, Middleware | [`server/middleware/auth.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/middleware/auth.js) | `DomainModelAndHierarchy.test.ts` (Scenario 4) | Throws `TenantSecurityException` with 403 Forbidden | **PASS** |
| **REQ-03-05** | Foreign tenant student or session enrollment rejected | `StudentEnrollmentEntity` | [`server/services/hierarchyService.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js) | `DomainModelAndHierarchy.test.ts` (Scenario 5) | Cross-school enrollment rejected with `CROSS_TENANT_VIOLATION` | **PASS** |
| **REQ-03-06** | Invalid parent organization (non-existent) rejected | `Organization` | [`server/services/hierarchyService.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js) | `DomainModelAndHierarchy.test.ts` (Scenario 6) | Returns `valid: false, code: 'INVALID_PARENT_ORGANIZATION'` | **PASS** |
| **REQ-03-07** | Self-parenting and circular hierarchy rejected (anti-cycle) | `Organization` | [`server/services/hierarchyService.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js) | `DomainModelAndHierarchy.test.ts` (Scenario 7) | DFS traversal detects loop; returns `CIRCULAR_HIERARCHY_DETECTED` | **PASS** |
| **REQ-03-08** | Duplicate identifier & enrollment validation | `Organization`, `Enrollment` | [`server/services/domainValidation.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/domainValidation.js) | `DomainModelAndHierarchy.test.ts` (Scenario 8) | Invalid orgCode rejected; duplicate enrollment triggers E11000 UK error | **PASS** |
| **REQ-03-09** | Standalone school works without regional hierarchy | `BranchCampus` (`tenants`) | [`src/types/domain.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/types/domain.ts) | `DomainModelAndHierarchy.test.ts` (Scenario 9) | `orgId: null` operates cleanly without region/district/block units | **PASS** |
| **REQ-03-10** | Multi-tier grade config (Nursery, K-12, Coaching) | `ClassGrade` (`classes`) | [`server/services/domainValidation.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/domainValidation.js) | `DomainModelAndHierarchy.test.ts` (Scenario 10) | Grades `-2` to `14` validated with 0 hardcoded string errors | **PASS** |
| **REQ-03-11** | Student progression across multiple academic sessions | `StudentEnrollmentEntity` | [`server/db.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/db.js) | `DomainModelAndHierarchy.test.ts` (Scenario 11) | Rahul Kumar: 2025 (`PROMOTED`) -> 2026 (`ENROLLED`) preserved | **PASS** |
| **REQ-03-12** | Many-to-many guardian relationships modeled | `StudentGuardianRelationshipEntity`| [`server/services/hierarchyService.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js) | `DomainModelAndHierarchy.test.ts` (Scenario 12) | Father & Mother linked to student; Father linked to 2 students | **PASS** |
| **REQ-03-13** | Unauthenticated & suspended sessions rejected | `TenantSecurityService` | [`src/services/TenantSecurityService.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/services/TenantSecurityService.ts) | `DomainModelAndHierarchy.test.ts` (Scenario 13) | Null session and suspended account denied with 401 | **PASS** |
| **REQ-03-14** | Zero unauthorized write/copy to primary DB (`i2a_schoolos`) | Database Safety | [`scripts/seed-synthetic-test-db.js`](file:///D:/i2A_School%20ERP%20&%20Managment/scripts/seed-synthetic-test-db.js) | `DatabaseSafetyPreflight.test.ts` (Check 6), Scenario 14 | Direct read confirms `users: 10`, `audit_logs: 207` (0 delta) | **PASS** |
| **REQ-03-15** | Official UDISE+ validation & regression compatibility | `BranchCampus` | [`server/services/domainValidation.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/domainValidation.js) | `DomainModelAndHierarchy.test.ts` (Scenario 15), Full Vitest Suite | 11-digit regex validated; 22 test files (171 tests) passed | **PASS** |

---

## 2. Status Summary

- **Total Tracked Requirements:** 15
- **Fully Passed (`PASS`):** 15 (100%)
- **Partial (`PARTIAL`):** 0
- **Not Implemented (`NOT_IMPLEMENTED`):** 0
- **Blocked (`BLOCKED`):** 0
