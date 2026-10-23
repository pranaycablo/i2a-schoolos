# Master Prompt 03I — Concurrent Service Integration Tests
## Live Adversarial Integration Testing of Public Service Methods on Replica Set

**Audit Timestamp:** 2026-10-17T16:57:30+05:30  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  
**Test Suite:** [`src/__tests__/TransactionalHierarchyService.test.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/__tests__/TransactionalHierarchyService.test.ts)  
**Execution Environment:** Live Single-Node Replica Set `rs0` (Port 27018)  
**Classification:** Live Integration Test Evidence  

---

### 1. Executive Summary

In compliance with Section 5 of Master Prompt 03I, this document reports the execution results of the integration test suite calling the **public, exported methods** of [`server/services/hierarchyService.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js) against the live MongoDB replica set (`rs0`) on port 27018.

Zero in-memory mocks were used for database operations; all tests executed over live TCP sockets against MongoDB 8.3 WiredTiger with full transaction support.

---

### 2. Comprehensive Integration Scenario Results

Command executed:
```powershell
node ./node_modules/vitest/vitest.mjs run src/__tests__/TransactionalHierarchyService.test.ts
```

Output:
```
 RUN  v5.0.3 D:/i2A_School ERP & Managment

 ✓ src/__tests__/TransactionalHierarchyService.test.ts (11 tests) 2318ms
   ✓ i2A SchoolOS — Master Prompt 03I: Real Service Transactional Integration Suite (11)
     ✓ Scenario 1: Stale worker is rejected when lease expires before write 1550ms
     ✓ Scenario 2: Active worker cleanly steals expired lock and commits transaction 214ms
     ✓ Scenario 3: Serializes two-node cycle race; exactly 1 succeeds, 1 rejected, 0 cycles 108ms
     ✓ Scenario 4: Serializes three-node cycle race; exactly 2 succeed, 3rd rejected, zero cycles 207ms
     ✓ Scenario 5: Overlapping updates on the same node serialize cleanly without dirty writes 138ms
     ✓ Scenario 6: createOrganization validates parent and inserts atomically with transaction 62ms
     ✓ Scenario 7: Negative Test: Standalone MongoDB fails closed with ZERO unsafe writes 25ms
     ✓ Scenario 8: Negative Test: Non-owner cannot release lock, active lock preserved 20ms
     ✓ Scenario 9: Negative Test: Self-parenting immediately rejected in O(1) 9ms
     ✓ Scenario 10: Negative Test: INDEPENDENT_SCHOOL parent rejected with INVALID_PARENT_TYPE 11ms
     ✓ Scenario 11: Monotonic fencing token sequence strictly increases across invocations 40ms

 Test Files  1 passed (1)
      Tests  11 passed (11)
   Duration  2.82s
```

---

### 3. In-Depth Scenario Analysis

#### Scenario 1: Stale Worker Rejection after Lease Expiry
- **Mechanism:** Worker A acquires lock (150ms lease). Execution sleeps for 200ms. Lease expires. Worker B steals the lock with a new token.
- **Service Invocation:** Stale worker attempts `updateOrganizationParent`.
- **Observed Result:** Rejected immediately.
- **Database Inspection:** `organizations.findOne('org-tx-real-a')` confirms `parentOrgId: null`, `version: 1`. Zero uncommitted writes persisted.

#### Scenario 3: Two-Node Cycle Race ($A \to B$ vs $B \to A$)
- **Mechanism:** `Promise.allSettled` invokes simultaneous service mutations:
  - Worker 1: `updateOrganizationParent('A', 'B')`
  - Worker 2: `updateOrganizationParent('B', 'A')`
- **Observed Result:**
  - Fulfilled promises: **1**
  - Rejected promises: **1** (`CIRCULAR_HIERARCHY_DETECTED`)
- **Database Inspection:** Exactly one directional link created ($A \to B$ or $B \to A$).
- **Cycle Invariant Assertion:** `isCycle === false`. Zero cycles created.

#### Scenario 4: Three-Node Concurrent Cycle Race ($A \to B, B \to C, C \to A$)
- **Mechanism:** Three simultaneous service calls attempting to close a loop.
- **Observed Result:** Exactly 2 edges successfully committed; 3rd edge rejected with `CIRCULAR_HIERARCHY_DETECTED`.
- **Database Inspection:** Graph traversal confirms `A \rightsquigarrow B \rightsquigarrow C`, but no path back to `A`. Strict DAG property preserved.

#### Scenario 5: Overlapping Updates on Same Node ($A \to B$ vs $A \to C$)
- **Mechanism:** Two workers compete to set different parents on Node A.
- **Observed Result:** Serialized via CAS version and In-Transaction Lock-Touch. Exactly one valid parent persisted, and version bumped cleanly. Zero dirty writes.

---

### 4. Verification Verdict

- **Test Suite Pass Rate:** 100% (11/11 tests).
- **Service Integration:** Authoritative public methods verified directly.
- **Adversarial Resilience:** Confirmed on live WiredTiger replica set.
- **Verdict:** `PASS_REAL_SERVICE_TRANSACTION_VERIFIED`
