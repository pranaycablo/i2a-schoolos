# i2A SchoolOS — Master Prompt 03: Migration & Backward Compatibility Plan
**Document ID:** `DOC-MP03-MIGRATION-COMPAT-007`  
**Phase:** Master Prompt 03 — Domain Model, Data Dictionary & Organization Hierarchy  
**Architect:** Senior Database Architect, Release Gate Auditor, DevOps Reliability Lead  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Strict Protection of Application Database (`i2a_schoolos`)

### 1.1 Non-Destructive Golden Rule
In compliance with Rule 2 and Section 7 of Master Prompt 03:
- **Zero writes, zero updates, zero schema modifications, and zero index builds** were executed against the application database `i2a_schoolos`.
- Baseline invariants on `i2a_schoolos` (`users: 10`, `audit_logs: 207`) were continuously verified by `DatabaseSafetyPreflight.test.ts` (Safety Check 6) and `DomainModelAndHierarchy.test.ts` (Scenario 14).
- All domain hierarchy, organization trees, multi-session enrollments, and guardian relationship fixtures were tested exclusively within the isolated synthetic database `i2a_schoolos_synthetic_test`.

---

## 2. Backward Compatibility Strategy

### 2.1 Preserving Existing API Contracts
1. **Existing Tenant Routes (`GET /api/tenants`, `GET /api/tenants/:schoolId`):**
   - Retains collection name `tenants` for school branch records.
   - Preserves all legacy properties (`id`, `name`, `code`, `board`, `planId`, `branding`, `subscriptionStatus`).
   - Introduces optional `orgId` as an additive field. Independent schools maintain `orgId: null` or undefined, ensuring 100% backward compatibility for all existing frontend consumers.
2. **Existing Student Endpoints (`GET /api/students`, `POST /api/students`):**
   - Retains flat fields (`className`, `section`, `fatherName`, `parentMobile`, `parentEmail`) for existing UI forms, while paving the way for the relational `student_enrollments` and `guardian_relationships` domain entities.
   - Additive validation schemas in `domainValidation.js` run transparently without breaking legacy payload structures.
3. **Frontend Context (`SchoolContext.tsx`):**
   - Continues reading from `GET /api/tenants` and initializing the active school tenant without changes to component props or React hooks.
   - UI navigation components (e.g., `Header.tsx`) continue to receive `currentSchool.branding` without regression.

---

## 3. Production Rollout Migration Specification (Future Implementation)

When this domain model is approved for staging and production rollout, the following idempotent migration pipeline will be executed:

### Phase 1: Pre-Flight Dry-Run
- Run pre-flight audit script to identify any non-compliant records (e.g. invalid foreign keys, malformed emails, or duplicate compound keys).
- Dry-run script outputs report to `docs/audits/` without performing writes.

### Phase 2: Additive Schema Updates
- Step 2.1: Create `organizations` collection and insert organization records for verified multi-school trusts.
- Step 2.2: Add `orgId` to matching records in `tenants`. Leave standalone schools with `orgId: null`.
- Step 2.3: Populate initial `academic_sessions` records based on `branding.academicSession` (e.g., `"2026-2027"`).
- Step 2.4: Backfill `student_enrollments` linking existing students to the current active session.
- Step 2.5: Backfill `guardian_relationships` linking existing parent accounts to student records based on `childrenIds` and `parentEmail`.

### Phase 3: Idempotent Index Provisioning
- Execute index builds in background mode (`{ background: true }`) to ensure zero lock contention on active school operations.
- Sparse unique indexes applied for `orgCode`.

---

## 4. Rollback & Recovery Strategy

If an unexpected condition arises during a future migration:
1. **Additive Safety:** Because all changes in this phase are additive (new collections: `organizations`, `academic_sessions`, `student_enrollments`, `guardian_relationships`), legacy queries against `tenants` and `students` continue functioning normally.
2. **Instant Rollback:**
   - Drop the newly created collections (`organizations`, `academic_sessions`, `student_enrollments`, `guardian_relationships`).
   - Remove newly added indexes.
   - Remove `orgId` field from `tenants` via `$unset`.
3. **Zero Data Loss Guarantee:** No existing columns or records in `tenants`, `users`, or `students` are altered or deleted.
