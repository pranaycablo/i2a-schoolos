# i2A SchoolOS — Multi-Tenant & Branch Isolation Security Audit
**Document Reference:** `docs/audits/master-prompt-04/TENANT_AND_BRANCH_ISOLATION.md`  
**Phase:** Master Prompt 04 — Enterprise Security, Privacy, RBAC & Tenant Isolation  
**Date:** October 18, 2026  
**Status:** IMPLEMENTED & VERIFIED  

---

## 1. Domain Hierarchy & Scoping Principles

i2A SchoolOS enforces strict boundaries between organizational entities:

```
Platform (SaaS Root)
   │
   ├── Organization / Educational Trust (e.g., Delhi Public Educational Trust)
   │      │
   │      ├── Campus / Branch 1 (e.g., ABC Public School - Main Campus [I2A-SCH-000001])
   │      │      ├── Academic Sessions (e.g., 2026-2027)
   │      │      ├── Classes & Sections (e.g., Class VIII-A)
   │      │      └── Students, Staff, Guardians
   │      │
   │      └── Campus / Branch 2 (e.g., ABC Public School - North Campus [I2A-SCH-000003])
   │
   └── Independent School Tenant (e.g., St. Xavier Senior Secondary [I2A-SCH-000002])
```

### 1.1 Core Conceptual Distinctions
- **Tenant (`schoolId`):** The primary data isolation boundary. Every operational record (students, attendance, fees, timetable, staff, exams) belongs to exactly one `schoolId`.
- **Organization (`orgId`):** The legal or corporate trust authority governing one or more educational campuses. An organization director has visibility across branches under their trust, but never into competing trusts or independent schools.
- **Branch / Campus:** An operational physical location executing daily school workflows.

---

## 2. Zero-Bypass Server-Side Tenant Resolution

### 2.1 The Invariant Rule
> [!IMPORTANT]
> **Client-supplied tenant identifiers (`req.query.schoolId`, `req.body.schoolId`, `req.params.schoolId`) are NEVER accepted as proof of authorization.**
> Tenant identity is resolved exclusively from the cryptographically verified JWT session claims issued by the server.

### 2.2 Middleware Pipeline: `enforceTenant`
Source File: [`server/middleware/auth.js:160-245`](file:///D:/i2A_School%20ERP%20&%20Managment/server/middleware/auth.js#L160-L245)

```javascript
// Step 1: Active session verification
if (!req.user) return res.status(401).json({ code: 'UNAUTHORIZED' });

// Step 2: Super Admin Platform Scoping
if (req.user.role === 'SUPER_ADMIN') {
  const targetSchoolId = req.params.schoolId || req.query.schoolId || req.body?.schoolId;
  req.tenantFilter = targetSchoolId && targetSchoolId !== 'ALL' ? { schoolId: targetSchoolId } : {};
  return next();
}

// Step 3: Organization Director Branch Scoping
if (req.user.role === 'ORG_DIRECTOR' && req.user.orgId) {
  const requestedSchoolId = req.params.schoolId || req.query.schoolId || req.body?.schoolId;
  if (!requestedSchoolId) {
    req.tenantFilter = { orgId: req.user.orgId };
    return next();
  }
  const isAuthorized = await isSchoolUnderOrganization(req.user.orgId, requestedSchoolId, database);
  if (!isAuthorized) {
    return res.status(403).json({ code: 'CROSS_TENANT_VIOLATION' });
  }
  req.tenantFilter = { schoolId: requestedSchoolId };
  return next();
}

// Step 4: Institutional Tenant Enforcement
const requestedSchoolId = req.params.schoolId || req.query.schoolId || req.body?.schoolId;
if (requestedSchoolId && requestedSchoolId !== req.user.schoolId) {
  return res.status(403).json({
    error: `FORBIDDEN: Cross-tenant access violation. Your account belongs to [${req.user.schoolId}] and cannot access [${requestedSchoolId}].`,
    code: 'CROSS_TENANT_VIOLATION'
  });
}

// Step 5: Authoritative Query Scoping
req.tenantFilter = { schoolId: req.user.schoolId };
next();
```

---

## 3. Database Scoped Query & Mutation Invariants

1. **Read Scoping:** Every database read operation injects `...req.tenantFilter` directly into the MongoDB query selector:
   ```javascript
   const students = await database.collection('students').find(filter).toArray();
   ```
2. **Update Scoping:** Every mutation includes `...req.tenantFilter` in the filter condition:
   ```javascript
   await database.collection('students').updateOne(
     { id: req.params.id, ...req.tenantFilter },
     { $set: updates }
   );
   ```
   If a user passes an ID belonging to another school, `matchedCount === 0` and the request safely returns `404 RESOURCE_NOT_FOUND` without modifying foreign data.
3. **Delete Scoping:** Deletion queries similarly bind to `req.tenantFilter`, preventing cross-tenant document erasure.
4. **Mass Assignment Prevention:** Field stripping prevents attackers from changing a record's `schoolId` to another institution or escalating their `role`.

---

## 4. Verification Evidence

All tenant isolation guarantees are continuously verified by real backend integration tests:
- **Vector 3:** School A principal querying School B students $\rightarrow$ `HTTP 403 CROSS_TENANT_VIOLATION`.
- **Vector 4:** Teacher querying School B attendance $\rightarrow$ `HTTP 403 CROSS_TENANT_VIOLATION`.
- **Vector 5:** Accountant querying School B fee receipts $\rightarrow$ `HTTP 403 CROSS_TENANT_VIOLATION`.
- **Vector 10:** Organization Director querying ungoverned foreign school $\rightarrow$ `HTTP 403 CROSS_TENANT_VIOLATION`.
- **Vector 14:** BOLA IDOR query for foreign school student by ID $\rightarrow$ `HTTP 404 RESOURCE_NOT_FOUND`.
- **Vector 17:** Cross-tenant bulk update attempt $\rightarrow$ `0` documents modified across foreign tenants.
- **Vector 18:** Audit log queries for School B admin strictly return logs where `schoolId === 'I2A-SCH-000002'`.
