# i2A SchoolOS — Master Prompt 03B: Hierarchy & Relationship Engine Forensic Review
**Document ID:** `DOC-MP03B-HIERARCHY-REL-003`  
**Phase:** Master Prompt 03B — Domain Model Forensic Verification & Regression Gate  
**Auditor:** Principal Software Architect, Algorithmic Integrity Auditor  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Executive Summary & Audit Scope

This document provides a forensic algorithmic and operational audit of the Organization Hierarchy Engine and Relational Link services implemented in:
- [`server/services/hierarchyService.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js)
- [`src/__tests__/DomainModelAndHierarchy.test.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/__tests__/DomainModelAndHierarchy.test.ts)

The evaluation covers cycle detection algorithms, tree recursion depth limits, concurrent update risks, foreign reference multi-tenant boundaries, and student-guardian relational consistency.

---

## 2. Organization Hierarchy Engine Forensic Analysis

### 2.1 Anti-Cycle Algorithm Review (`detectHierarchyCycle`, lines 17–38)
```javascript
export async function detectHierarchyCycle(childId, candidateParentId, database) {
  if (!childId || !candidateParentId) return false;
  if (childId === candidateParentId) return true;

  let currentId = candidateParentId;
  const visited = new Set([childId]);

  while (currentId) {
    if (visited.has(currentId)) {
      return true; // Cycle detected
    }
    visited.add(currentId);

    const parentDoc = await database.collection('organizations').findOne({ id: currentId });
    if (!parentDoc || !parentDoc.parentOrgId) {
      break;
    }
    currentId = parentDoc.parentOrgId;
  }

  return false;
}
```

#### Forensic Algorithmic Findings:
1. **Self-Parenting (`childId === candidateParentId`):** Intercepted on line 19 in $O(1)$ time without database roundtrips.
2. **Two-Node Cycles (`A -> B -> A`):** Candidate parent $B$ is checked; following $B$'s parent pointer retrieves $A$. Since $A$ is in the `visited` set (line 25), the cycle is immediately flagged and returns `true`.
3. **Indirect / Multi-Node Cycles (`A -> B -> C -> ... -> A`):** The `while (currentId)` loop traverses upward through parent pointers. Because every visited node is added to the hash set, any cyclic return to $A$ or any previously traversed node terminates the loop in $O(V)$ time and $O(V)$ space.
4. **Live Database Integration:** Unlike mock tests, `detectHierarchyCycle` executes real MongoDB queries (`database.collection('organizations').findOne({ id: currentId })`) against the database.
5. **Recursion & Resource Exhaustion Assessment:**
   - The loop runs sequentially without call-stack recursion, eliminating JavaScript stack overflow (`RangeError: Maximum call stack size exceeded`).
   - Educational trust hierarchies in the real world rarely exceed 6 levels (Trust -> Zone -> State -> District -> Block -> Cluster -> School).
   - **Open Decision / Limitation:** While stack depth is safe, in an extreme hypothetical dataset with thousands of nested organizations, linear sequential queries could cause latency. A maximum traversal depth guard (e.g. `MAX_DEPTH = 20`) is recommended for Phase B.
6. **Concurrency Race Condition Risk:**
   - If two administrators concurrently execute parent updates ($A \to B$ and $B \to A$ simultaneously), both might pass pre-update cycle checks before either write is committed.
   - **Mitigation Recommendation:** In production, atomic transaction sessions with document-level locking or optimistic concurrency versioning (`version`) should be applied when altering organizational parentage.

---

### 2.2 Parent Link Validation (`validateOrganizationLink`, lines 43–75)
- **Code Behavior:**
  - `!parentId`: Standalone school -> returns `{ valid: true }`.
  - `parentId === childId`: Returns `{ valid: false, code: 'SELF_HIERARCHY_VIOLATION' }`.
  - Non-existent parent: Returns `{ valid: false, code: 'INVALID_PARENT_ORGANIZATION' }`.
  - Cycle detected: Returns `{ valid: false, code: 'CIRCULAR_HIERARCHY_DETECTED' }`.
- **Audit Verification:** Tested in `DomainModelAndHierarchy.test.ts` (Scenario 6 and 7).
- **Status:** **`PASS`**

---

### 2.3 Recursive Branch Resolution (`resolveOrganizationBranches`, lines 80–104)
- **Code Behavior:**
  - Iteratively queries `organizations` using `{ parentOrgId: { $in: toCheck } }`.
  - Aggregates all descendant organization IDs (`allOrgIds`).
  - Fetches all campuses from `tenants` where `orgId: { $in: allOrgIds }`.
- **Audit Verification:** Tested in `DomainModelAndHierarchy.test.ts` (Scenario 2). DPS Group (`org-synth-dps`) resolves Branches 1 and 3, while St. Xavier and Independent School are strictly excluded.
- **Status:** **`PASS`**

---

## 3. Student, Enrollment & Guardian Relationships Forensic Review

### 3.1 Multi-Tenant Enrollment Boundary Validation (`validateEnrollmentBoundaries`, lines 127–173)
- **Code Behavior:**
  - Validates that `student.schoolId === schoolId`.
  - Validates that `session.schoolId === schoolId`.
  - Validates that `classDoc.schoolId === schoolId`.
  - Validates that `sectionDoc.schoolId === schoolId`.
  - If any foreign reference is detected, appends `CROSS_TENANT_VIOLATION: [Entity] belongs to school [X], not [Y]`.
- **Audit Verification:** Tested in `DomainModelAndHierarchy.test.ts` (Scenario 5).
- **Status:** **`PASS`**

---

### 3.2 Multi-Guardian to Multi-Student Link Management (`linkGuardianToStudent`, lines 179–230)
- **Code Behavior:**
  - Verifies student exists in caller's school.
  - Verifies guardian user account exists.
  - Deterministic ID generation: `rel-${studentId}-${guardianUserId}`.
  - **Primary Contact De-Duplication (lines 203–209):**
    ```javascript
    if (isPrimaryContact) {
      await database.collection('guardian_relationships').updateMany(
        { studentId, schoolId },
        { $set: { isPrimaryContact: false } }
      );
    }
    ```
    Guarantees that setting a new primary contact automatically demotes any previous primary contact for that student.
  - Upserts link record into `guardian_relationships` with idempotency.
- **Audit Verification:** Tested in `DomainModelAndHierarchy.test.ts` (Scenario 12).
- **Status:** **`PASS`**

---

## 4. Hierarchy & Relationship Verification Summary

| Verification Item | Implementation File & Line | Test Verification | Verdict |
| :--- | :--- | :--- | :---: |
| Self-Parenting Prevention | `hierarchyService.js` (lines 46–52) | `DomainModelAndHierarchy.test.ts` (Scenario 7.1) | **PASS** |
| Cycle Detection (`A -> B -> A`) | `hierarchyService.js` (lines 17–38, 64–72) | `DomainModelAndHierarchy.test.ts` (Scenario 7.2) | **PASS** |
| Missing Parent Rejection | `hierarchyService.js` (lines 54–61) | `DomainModelAndHierarchy.test.ts` (Scenario 6) | **PASS** |
| Standalone School Mode | `hierarchyService.js` (line 44) | `DomainModelAndHierarchy.test.ts` (Scenario 9) | **PASS** |
| Recursive Branch Resolution | `hierarchyService.js` (lines 80–104) | `DomainModelAndHierarchy.test.ts` (Scenario 2) | **PASS** |
| Cross-Tenant Foreign Key Check | `hierarchyService.js` (lines 127–173) | `DomainModelAndHierarchy.test.ts` (Scenario 5) | **PASS** |
| Multi-Guardian Priority Sync | `hierarchyService.js` (lines 203–209) | `DomainModelAndHierarchy.test.ts` (Scenario 12) | **PASS** |
| Concurrency Cycle Mitigation | Not yet atomic in transactions | Documented in Section 2.1 | **PARTIAL** |
