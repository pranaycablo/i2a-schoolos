# i2A SchoolOS — Master Prompt 03D: Rollback Atomicity & Mutation Ownership Review

**Document Version:** 1.0.0  
**Phase:** Master Prompt 03D — Adversarial Hierarchy Concurrency Audit  
**Scope:** Version-Fenced Rollback, Overwrite Prevention, Post-Update Cycle Handling  
**Auditor:** Principal Software Architect & QA Lead  
**Audit Rating:** **`PASS`**  

---

## 1. Executive Summary

This adversarial review inspects the rollback mechanics executed when a hierarchy operation encounters a post-update cycle or unexpected mutation conflict.

In a naive rollback implementation:
```javascript
// NAIVE AND DANGEROUS: Blind Overwrite Rollback
await database.collection('organizations').updateOne(
  { id: childId },
  { $set: { parentOrgId: previousParentId } }
);
```
If Worker B legitimately modifies the organization between Worker A's write and Worker A's rollback, Worker A's blind query `{ id: childId }` wipes out Worker B's update and forces the document back to `previousParentId`.

In [`server/services/hierarchyService.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js#L236-L270), i2A SchoolOS implements **Version-Fenced Rollback**, mathematically ensuring that a worker can **only** revert its own mutation and will never overwrite a concurrent update made by another worker.

---

## 2. The Blind Rollback Hazard Explained

Consider this racing interleaving:
1. Organization $A$ starts at `version: 1` with `parentOrgId: null`.
2. Worker 1 writes $A \to B$, incrementing `version` to 2.
3. Due to an interleaving event, Worker 2 updates $A \to C$, incrementing `version` to 3.
4. Worker 1 detects a cycle and triggers rollback:
   - **Naive Rollback:** `{ id: 'A' } \implies` Sets $A$'s parent back to `null`! Worker 2's valid assignment of $A \to C$ is destroyed!
   - **Version-Fenced Rollback:** `{ id: 'A', version: 2, parentOrgId: 'B' } \implies` Matches **0 documents** (because version is 3 and parent is $C$)! Rollback aborts without touching Worker 2's data!

---

## 3. Version-Fenced Rollback Specification

The hardened rollback logic requires a compound atomic filter checking both the expected post-write version and the specific parent pointer:

```javascript
const rollbackResult = await database.collection('organizations').updateOne(
  {
    id: childId,
    version: currentVersion + 1, // Must match the exact version written by this worker
    parentOrgId: parentId        // Must still point to the edge written by this worker
  },
  {
    $set: {
      parentOrgId: previousParentId,
      updatedAt: new Date().toISOString()
    },
    $inc: { version: 1 }
  }
);

if (rollbackResult.matchedCount === 0) {
  console.warn(`[HierarchyService] Rollback conflict for [${childId}]: document was concurrently modified by another worker.`);
}
```

### Safety Properties:
1. **Mutation Ownership Guarantee:** A worker can only roll back a document if the document state is identical to what that specific worker produced.
2. **Non-Destructive Conflict Handling:** If `matchedCount === 0`, it indicates that another worker has already modified the document. The rollback aborts cleanly, preserving the newer state.

---

## 4. Empirical Test Verification

From [`src/__tests__/HierarchyConcurrency.test.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/__tests__/HierarchyConcurrency.test.ts#L326-L368) (Scenario 8):
1. **Org A** starts at `version: 1`, `parentOrgId: null`.
2. Worker 1 updates Org A to `parentOrgId: 'org-adv-b'`, version becomes 2.
3. Interleaving occurs: Worker 2 updates Org A to `parentOrgId: 'org-adv-c'`, version becomes 3.
4. Worker 1 attempts rollback expecting `{ version: 2, parentOrgId: 'org-adv-b' }`.
5. **Observed Output:**
   - Rollback filter matches **0 documents** (`matchedCount: 0`).
   - Final state of Org A: `parentOrgId: 'org-adv-c'`, `version: 3`.
   - Worker 2's update was **100% preserved**.

---

## 5. Audit Finding & Verdict

- **Rollback Atomicity Review:** **`PASS`**
- The version-fenced rollback filter guarantees that concurrent modifications are never corrupted or clobbered during rollback operations.
