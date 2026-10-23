# i2A SchoolOS — Master Prompt 03: Tenant Ownership & Access Matrix
**Document ID:** `DOC-MP03-TENANT-MATRIX-005`  
**Phase:** Master Prompt 03 — Domain Model, Data Dictionary & Organization Hierarchy  
**Architect:** Senior Multi-Tenant SaaS Security Engineer, Application Security Lead  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Authoritative Identity & Scoping Principles

1. **Zero Client Parameter Trust:** The authoritative tenant context (`schoolId` or `orgId`) is derived exclusively from the cryptographically verified JWT bearer token (`req.user.schoolId` / `req.user.orgId`). Any client-supplied tenant identifier in HTTP query, path, or body parameters is strictly cross-checked against `req.user`.
2. **Server-Side Query Injection:** All database queries automatically receive `req.tenantFilter` injected by `enforceTenant` middleware.
3. **Cross-Tenant IDOR Prevention:** Attempting to query or mutate a record using an ID belonging to a different tenant triggers immediate access rejection (`403 CROSS_TENANT_VIOLATION` or `404 RESOURCE_NOT_FOUND`).
4. **Foreign Key Multi-Tenant Boundary Enforcement:** When inserting or updating relational documents (such as enrolling a student in a session), all related entities (`studentId`, `academicSessionId`, `classId`, `sectionId`) must strictly belong to the authoritative school ID.

---

## 2. Multi-Tenant Role Access Matrix

| Role | Authoritative Tenant Scope | Organization Hierarchy Access | Cross-School Access Rule | Object-Level Authorization Restrictions |
| :--- | :--- | :--- | :--- | :--- |
| **`SUPER_ADMIN`** | Global Platform (`schoolId: "ALL"`) | All Organizations & Branches | **Unrestricted** (Cross-tenant allowed for platform maintenance) | Full platform administration |
| **`ORG_DIRECTOR`**| Parent Organization (`req.user.orgId`) | All branches governed by `orgId` | **Allowed only across branches under own organization** | Read/governance of child branches; prohibited from foreign org branches |
| **`PRINCIPAL`** | Single Branch (`req.user.schoolId`) | Own Branch Only | **STRICTLY DENIED** (Cannot access sister or foreign branches) | Full school administration within own branch |
| **`ADMIN`** | Single Branch (`req.user.schoolId`) | Own Branch Only | **STRICTLY DENIED** | Full operational access within own branch |
| **`ACCOUNTANT`**| Single Branch (`req.user.schoolId`) | Own Branch Only | **STRICTLY DENIED** | Financial ledgers, fee types, receipts within own branch |
| **`TEACHER`** | Single Branch (`req.user.schoolId`) | Own Branch Only | **STRICTLY DENIED** | Only assigned classes, sections, and timetables |
| **`STAFF`** | Single Branch (`req.user.schoolId`) | Own Branch Only | **STRICTLY DENIED** | Front-desk operations within own branch |
| **`TRANSPORT`** | Single Branch (`req.user.schoolId`) | Own Branch Only | **STRICTLY DENIED** | Assigned transport routes and vehicle stops |
| **`PARENT`** | Single Branch (`req.user.schoolId`) | Own Branch Only | **STRICTLY DENIED** | Only linked children (`childrenIds` or `guardian_relationships`) |
| **`STUDENT`** | Single Branch (`req.user.schoolId`) | Own Branch Only | **STRICTLY DENIED** | Only own student record (`studentId === user.studentId`) |

---

## 3. Detailed Cross-Tenant Boundary Enforcement Matrix

| Attempted Operation | Target Entity | Caller Context | Target Context | Enforcement Mechanism | Evaluation | Enforced HTTP Status & Code |
| :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **Query Students** | `students` | School A (`I2A-SCH-000001`) | School A (`I2A-SCH-000001`) | `enforceTenant` | **ALLOW** | `200 OK` |
| **Query Students** | `students` | School A (`I2A-SCH-000001`) | School B (`I2A-SCH-000002`) | `enforceTenant` | **DENY** | `403 CROSS_TENANT_VIOLATION` |
| **Get Student Profile** | `students` | School A (`I2A-SCH-000001`) | Student ID of School B | `req.tenantFilter` | **DENY** | `404 RESOURCE_NOT_FOUND` |
| **Enroll Student** | `student_enrollments` | School A (`I2A-SCH-000001`) | Student from School B | `validateEnrollmentBoundaries` | **DENY** | `400 / 403 CROSS_TENANT_VIOLATION` |
| **Org Analytics** | `tenants` / `students` | Org Director (`org-synth-dps`) | Branch 1 of DPS Group | `isSchoolUnderOrganization` | **ALLOW** | `200 OK` |
| **Org Analytics** | `tenants` / `students` | Org Director (`org-synth-dps`) | St. Xavier (Foreign Org) | `isSchoolUnderOrganization` | **DENY** | `403 CROSS_TENANT_VIOLATION` |
| **Branch Admin sister**| `tenants` / `students` | Branch 1 Admin | Branch 3 Admin (Same Trust) | `validateBranchAccess` | **DENY** | `403 Branch Admin Isolation Violation` |
| **Parent View Student**| `students` | Parent P1 (Child: `std-101`) | Student `std-101` | `authorizeObjectAccess` | **ALLOW** | `200 OK` |
| **Parent View Student**| `students` | Parent P1 (Child: `std-101`) | Student `std-102` (Unlinked) | `authorizeObjectAccess` | **DENY** | `403 INSUFFICIENT_PERMISSIONS` |
| **Student View Record**| `students` | Student S1 (`std-101`) | Student `std-102` | `authorizeObjectAccess` | **DENY** | `403 INSUFFICIENT_PERMISSIONS` |
| **Teacher Attendance** | `attendance` | Teacher (Assigned: Class VIII) | Class VIII | `authorizeObjectAccess` | **ALLOW** | `200 OK` |
| **Teacher Attendance** | `attendance` | Teacher (Assigned: Class VIII) | Class X (Unassigned) | `authorizeObjectAccess` | **DENY** | `403 INSUFFICIENT_PERMISSIONS` |
