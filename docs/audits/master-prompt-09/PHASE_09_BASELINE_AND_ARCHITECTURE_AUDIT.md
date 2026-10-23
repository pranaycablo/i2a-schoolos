# PHASE 09 BASELINE AND ARCHITECTURE AUDIT
**i2A SchoolOS | Organization, Branch, Campus & Academic Configuration OS**
**Date:** 2026-10-20  
**Phase:** 09 — Architecture & Baseline Assessment  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Branch:** `phase-a-remediation`  
**Auditor:** Principal SaaS Architect & Senior Full-Stack Engineer  

---

## 1. Executive Summary

This forensic baseline assessment audits the existing i2A SchoolOS architectural components, database models, multi-tenant boundaries, and service layers prior to implementing **Phase 09: Organization, Branch, Campus & Academic Configuration OS**.

Phase 08 successfully established institution registration, credential verification, and tenant provisioning with cryptographic tracking and atomic single-use invitations. Phase 09 extends this foundation to support complex, real-world educational hierarchies: from single standalone schools to multi-institution educational trusts, regional branches, satellite campuses, and policy-driven academic sessions.

---

## 2. Existing Component Forensic Trace

| Subsystem | Existing Source Files | Current Capabilities | Phase 09 Extensions Required |
| :--- | :--- | :--- | :--- |
| **Tenant Model & Resolution** | [`server/routes/tenants.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/routes/tenants.js), [`server/db.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/db.js) | Stores basic tenant record (`tenants` collection) created upon Phase 08 approval. | Add branch and campus awareness to tenant resolution; link tenants to parent organizations. |
| **Organization Model & Hierarchy** | [`server/routes/organizations.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/routes/organizations.js), [`server/services/hierarchyService.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js) | Supports root and child organizations, anti-cycle detection, distributed graph mutex. | Integrate full hierarchy: Organization/Trust $\to$ Institution $\to$ Branch $\to$ Campus. Add safe archival. |
| **Academic Session Management** | [`server/services/academicCalendarService.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/academicCalendarService.js) | Computes dynamic session dates by category (`calculateAcademicSessionPolicy`). Initial session inserted upon approval. | Full CRUD for academic sessions; enforce strict single-active-session invariant; session lifecycle management. |
| **Authentication & RBAC** | [`server/middleware/auth.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/middleware/auth.js), [`docs/ROLE_PERMISSION_MATRIX.md`](file:///D:/i2A_School%20ERP%20&%20Managment/docs/ROLE_PERMISSION_MATRIX.md) | Enforces JWT authentication, tenant isolation (`enforceTenant`), role checks (`requireRoles`). | Support granular hierarchy roles: `SUPER_ADMIN`, `ORG_DIRECTOR`, `PRINCIPAL` (Institution Admin), `BRANCH_ADMIN`, `CAMPUS_ADMIN`. |
| **Frontend Architecture** | [`src/components/shell/`](file:///D:/i2A_School%20ERP%20&%20Managment/src/components/shell/), [`src/design-system/`](file:///D:/i2A_School%20ERP%20&%20Managment/src/design-system/) | Enterprise App Shell, breadcrumb navigation, unified tokens. | Add dedicated Institutional Hierarchy & Academic OS management module with visual tree and breadcrumbs. |

---

## 3. Canonical Hierarchy Specification

$$\text{Platform} \longrightarrow \text{Trust / Group} \longrightarrow (\text{Optional Region}) \longrightarrow \text{Institution} \longrightarrow \text{Branch} \longrightarrow \text{Campus} \longrightarrow \text{Academic Session} \longrightarrow \text{Program/Class} \longrightarrow \text{Batch/Section}$$

### Invariants:
1. **Zero Mandatory Overhead for Standalone Schools:** A standalone school does not require creating a parent Trust or secondary campuses to be fully operational.
2. **Strict Multi-Tenant Scoping:** Every branch, campus, and session belongs to an authorized `institutionId` and root `tenantId`.
3. **Single Active Session Invariant:** Exactly one session may be active (`isCurrent: true`) for a given institution at any time.
4. **Code Uniqueness Within Boundary:** Branch codes unique per institution; Campus codes unique per branch.
5. **Non-Destructive Archival:** Hard deletes are prohibited; deactivating parent entities preserves historical student and academic records.

---

## 4. Safety Preflight Status

- **Production Database (`i2a_schoolos`):** STRICT ZERO TOUCH. No connections or migrations.
- **Quarantined Database (`i2a_schoolos_test`):** STRICT ZERO TOUCH.
- **Test Database:** `i2a_schoolos_synthetic_test` at `mongodb://127.0.0.1:27017`.
- **Preflight Verdict:** **PASS — SAFE TO PROCEED WITH IMPLEMENTATION**
