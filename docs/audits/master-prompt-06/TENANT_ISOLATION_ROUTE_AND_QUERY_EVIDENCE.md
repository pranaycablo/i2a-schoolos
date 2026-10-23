# i2A SchoolOS — Master Prompt 06
## Multi-Tenant Isolation Route & Query Evidence

**Status:** PASS_VERIFIED  
**Date:** October 18, 2026  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Security Domain:** Multi-Tenancy, Data Segregation & Cross-Tenant Boundary Defense  

---

### 1. Zero-Bypass Multi-Tenant Enforcement Engine

All authenticated endpoints in i2A SchoolOS enforce multi-tenancy through `enforceTenant` middleware:

1. **Super Admin Scope**: If `req.user.role === 'SUPER_ADMIN'`, caller can query all tenants or filter by a specific school (`req.tenantFilter = targetSchoolId ? { schoolId: targetSchoolId } : {}`).
2. **Organization Director Scope**: If `req.user.role === 'ORG_DIRECTOR'`, caller is restricted to branches under their governed organization. Target school validity is verified via `isSchoolUnderOrganization(req.user.orgId, schoolId, database)`. Unauthorized foreign schools are rejected with 403 `CROSS_TENANT_VIOLATION`.
3. **Institution Scoped User**: If caller is a school user (`PRINCIPAL`, `TEACHER`, `STUDENT`, `PARENT`, `STAFF`, `ACCOUNTANT`), `req.tenantFilter` is authoritatively locked to `{ schoolId: req.user.schoolId }`.
4. **Foreign School Injection Defense**: If a client passes an explicit foreign school ID in `req.params.schoolId`, `req.query.schoolId`, or `req.body.schoolId`, the middleware intercepts and rejects with HTTP 403 `CROSS_TENANT_VIOLATION`.

---

### 2. Route & Query Coverage Inventory

| Route | HTTP Method | Route Protection | Authoritative Tenant Filter | Direct Query Guard |
| :--- | :---: | :--- | :--- | :--- |
| `/api/students` | `GET` | `authenticateToken, enforceTenant` | `{ ...req.tenantFilter }` + role filter | `db.students.find(filter)` |
| `/api/students/:id` | `GET` | `authenticateToken, enforceTenant` | `{ id, ...req.tenantFilter }` | `db.students.findOne(...)` |
| `/api/students` | `POST` | `authenticateToken, enforceTenant, requireRoles` | Forced `schoolId: req.user.schoolId` | `db.students.insertOne(...)` |
| `/api/students/:id` | `PUT` | `authenticateToken, enforceTenant, requireRoles` | `{ id, ...req.tenantFilter }` | `db.students.updateOne(...)` |
| `/api/students/export` | `GET` | `authenticateToken, enforceTenant, requirePermissions` | `{ ...req.tenantFilter }` | `db.students.find(req.tenantFilter)` |
| `/api/attendance` | `GET` | `authenticateToken, enforceTenant` | `{ ...req.tenantFilter, entityType }` | `db.attendance.find(filter)` |
| `/api/attendance/mark` | `POST` | `authenticateToken, enforceTenant, requireRoles` | Locked to `req.user.schoolId` | `db.attendance.bulkWrite(...)` |
| `/api/attendance/lock` | `POST` | `authenticateToken, enforceTenant, requireRoles` | Locked to `req.user.schoolId` | `db.attendance_locks.updateOne(...)` |
| `/api/attendance/summary` | `GET` | `authenticateToken, enforceTenant` | `{ ...req.tenantFilter }` | `db.students.find(req.tenantFilter)` |
| `/api/admissions` | `GET` | `authenticateToken, enforceTenant, requireRoles` | `{ ...req.tenantFilter }` | `db.admissions.find(req.tenantFilter)` |
| `/api/admissions/:id/status`| `PUT` | `authenticateToken, enforceTenant, requireRoles` | `{ id, ...req.tenantFilter }` | `db.admissions.updateOne(...)` |
| `/api/admissions/:id/approve`| `POST` | `authenticateToken, enforceTenant, requireRoles` | `{ id, ...req.tenantFilter }` | `db.admissions.findOne/updateOne` |
| `/api/fees/types` | `GET` | `authenticateToken, enforceTenant` | `{ ...req.tenantFilter }` | `db.fee_types.find(req.tenantFilter)` |
| `/api/fees/types` | `POST` | `authenticateToken, enforceTenant, requireRoles` | Forced `schoolId: req.user.schoolId` | `db.fee_types.insertOne(...)` |
| `/api/fees/receipts` | `GET` | `authenticateToken, enforceTenant` | `{ ...req.tenantFilter }` + role filter | `db.fee_receipts.find(filter)` |
| `/api/fees/receipts/collect`| `POST` | `authenticateToken, enforceTenant, requireRoles` | `{ studentId, ...req.tenantFilter }` | `db.fee_receipts.insertOne(...)` |
| `/api/exams/papers` | `GET` | `authenticateToken, enforceTenant` | `{ ...req.tenantFilter }` + role filter | `db.exam_papers.find(filter)` |
| `/api/exams/papers` | `POST` | `authenticateToken, enforceTenant, requireRoles` | Forced `schoolId: req.user.schoolId` | `db.exam_papers.insertOne(...)` |
| `/api/exams/papers/:id/submit`| `POST`| `authenticateToken, enforceTenant` | `{ id, ...req.tenantFilter }` | `db.exam_submissions.insertOne(...)` |
| `/api/exams/submissions` | `GET` | `authenticateToken, enforceTenant` | `{ ...req.tenantFilter }` + role filter | `db.exam_submissions.find(filter)` |
| `/api/tenants` | `GET` | `authenticateToken` | SuperAdmin all / User `req.user.schoolId` | `db.tenants.findOne/find` |
| `/api/tenants/:schoolId` | `GET` | `authenticateToken, enforceTenant` | Validated matching `schoolId` | `db.tenants.findOne(...)` |
| `/api/tenants/:schoolId/branding`| `PUT` | `authenticateToken, enforceTenant, requireRoles` | Validated matching `targetTenantId` | `db.tenants.updateOne(...)` |
| `/api/organizations` | `GET` | `authenticateToken` | Scoped to caller's `orgId` | `db.organizations.find(filter)` |
| `/api/organizations/:id` | `GET` | `authenticateToken` | Scoped to caller's `orgId` | `db.organizations.findOne(...)` |
| `/api/organizations/:id/parent`| `PUT`| `authenticateToken, requireRoles, requirePermissions`| Mutex lock, cycle defense, ACID txn | `updateOrganizationParent(...)` |

---

### 3. Object-Level Multi-Tenant Authorization Details

#### 3.1 Parent Scope (Children-Only)
In `server/routes/students.js`:
```javascript
if (req.user.role === 'PARENT') {
  const allowedStudentIds = req.user.childrenIds || (req.user.studentId ? [req.user.studentId] : []);
  filter.$or = [
    { id: { $in: allowedStudentIds } },
    { parentEmail: req.user.email }
  ];
}
```
In `server/routes/fees.js`:
```javascript
if (req.user.role === 'PARENT') {
  const allowedStudentIds = req.user.childrenIds || (req.user.studentId ? [req.user.studentId] : []);
  filter.studentId = { $in: allowedStudentIds };
}
```

#### 3.2 Student Scope (Self-Only)
In `server/routes/students.js`:
```javascript
if (req.user.role === 'STUDENT') {
  filter.id = req.user.studentId || req.user.id;
}
```
Direct access to another student's record (`GET /api/students/:id`) explicitly checks:
```javascript
if (req.user.role === 'STUDENT' && (req.user.studentId || req.user.id) !== student.id) {
  return sendError(res, {
    status: 403,
    code: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
    message: 'FORBIDDEN: Students can only view their own record.',
    req
  });
}
```

---

### 4. Adversarial Attack Vectors Tested & Verified

| Attack Vector | Request Attempt | Defensive Result | Status |
| :--- | :--- | :--- | :--- |
| **URL Manipulation** | Principal A queries `GET /api/tenants/I2A-SCH-000002` | 403 `CROSS_TENANT_VIOLATION` | **PASS_VERIFIED** |
| **Query Manipulation**| Principal A queries `GET /api/students?schoolId=I2A-SCH-000002` | 403 `CROSS_TENANT_VIOLATION` | **PASS_VERIFIED** |
| **Body Manipulation** | Principal A submits `POST /api/students` with `schoolId: 'I2A-SCH-000002'` | 403 `CROSS_TENANT_VIOLATION` | **PASS_VERIFIED** |
| **Cross-Parent IDOR** | Parent Sanjay queries `GET /api/students/std-synth-unrelated-01` | 403 `FORBIDDEN` | **PASS_VERIFIED** |
| **Cross-Student IDOR**| Student Rahul queries `GET /api/students/std-synth-unrelated-01` | 403 `FORBIDDEN` | **PASS_VERIFIED** |
| **Fee Receipt Leakage**| Parent queries `GET /api/fees/receipts` | Scoped strictly to linked student | **PASS_VERIFIED** |
| **Foreign Org Access** | Org Director queries school outside their governed branches | 403 `CROSS_TENANT_VIOLATION` | **PASS_VERIFIED** |
