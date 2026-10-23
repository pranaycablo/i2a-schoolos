# i2A SchoolOS — Master Prompt 03E: Graph Mutex Enforcement Audit

**Document Version:** 1.0.0  
**Phase:** Master Prompt 03E — Hierarchy Mutation Path & Fencing Enforcement Audit  
**Scope:** Mutex Atomicity, Write-Time Lease Verification, Fail-Closed Security, Owner Authorization  
**Auditor:** Principal Database Reliability Engineer & Application Security Architect  
**Audit Rating:** **`PASS`**  

---

## 1. Executive Summary

This document verifies the operational correctness, atomicity, fail-closed behavior, and ownership validation of the `hierarchy_graph_mutex` implemented in [`server/services/hierarchyService.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js).

All 7 required enforcement invariants specified in Section 3 of Master Prompt 03E were subjected to code inspection and empirical automated test verification.

---

## 2. Invariant-by-Invariant Audit & Verification

### Invariant 1: Single Authoritative Graph Mutex
- **Requirement:** All hierarchy mutations must adhere to a unified authoritative mutex key.
- **Verification:** Both `updateOrganizationParent` ([line 205](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js#L205)) and `createOrganization` ([line 368](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js#L368)) default to and enforce:
  ```javascript
  const effectiveLockKey = lockKey || 'hierarchy_graph_mutex';
  ```
- **Evidence:** Zero concurrent modifications can alter tree topology simultaneously.
- **Rating:** **`PASS`**

### Invariant 2: Atomic Mutex Acquisition
- **Requirement:** Mutex acquisition must be strictly atomic without race conditions.
- **Verification:** In `acquireHierarchyLock` ([lines 102-125](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js#L102-L125)):
  1. Atomic `insertOne` backed by WiredTiger primary key unique constraint on `_id`.
  2. If duplicate key error (11000) occurs, atomic `findOneAndUpdate` with `{ _id: lockKey, expiresAt: { $lt: now } }`.
- **Evidence:** Exactly one worker thread can insert or steal the lock document at any given instant.
- **Rating:** **`PASS`**

### Invariant 3: Write-Time Lease and Owner Enforcement
- **Requirement:** Lock ownership and lease expiration must be re-verified at the exact moment of write.
- **Verification:** Immediately before the CAS write ([lines 254-263](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js#L254-L263)):
  ```javascript
  const activeLock = await database.collection('hierarchy_locks').findOne({
    _id: effectiveLockKey,
    owner: lock.owner,
    expiresAt: { $gt: new Date() }
  });
  if (!activeLock) {
    const err = new Error(`LEASE_EXPIRED: Hierarchy lock for [${effectiveLockKey}] expired or stolen before write.`);
    err.code = 'LEASE_EXPIRED';
    throw err;
  }
  ```
- **Evidence:** If a worker's lease expires while it is waiting or paused, `activeLock` returns `null` and the write is blocked.
- **Rating:** **`PASS`**

### Invariant 4: Stale Worker Rejection on Lease Expiry
- **Requirement:** An unpaused worker whose lease has expired cannot write.
- **Verification:** Tested in [`HierarchyConcurrency.test.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/__tests__/HierarchyConcurrency.test.ts#L225) (Scenario 3): Worker A unpauses after lease expiry; Worker A's write throws `LEASE_EXPIRED` and fails CAS matching; Worker B's committed update is 100% preserved.
- **Rating:** **`PASS`**

### Invariant 5: Owner-Validated Lock Release
- **Requirement:** A lock can only be released by the specific worker that holds it.
- **Verification:** In `releaseHierarchyLock` ([lines 147-155](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js#L147-L155)):
  ```javascript
  const result = await database.collection('hierarchy_locks').deleteOne({
    _id: lockKey,
    owner: nonce
  });
  return result.deletedCount > 0;
  ```
  If called by another process with a different nonce, `deletedCount === 0` and returns `false`. The legitimate owner's lock remains held in MongoDB. Tested in [`HierarchyConcurrency.test.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/__tests__/HierarchyConcurrency.test.ts#L273) (Scenario 4).
- **Rating:** **`PASS`**

### Invariant 6: Correctness Independent of TTL Background Cleanup
- **Requirement:** The system must not rely on MongoDB's 60-second TTL index running instantly.
- **Verification:** In `acquireHierarchyLock`, expired locks are evaluated dynamically via timestamp comparison `{ expiresAt: { $lt: now } }`. Stale leases are stolen and reused within milliseconds, even if MongoDB's background TTL thread has not yet purged the document.
- **Rating:** **`PASS`**

### Invariant 7: Fail-Closed Behavior on Lock Failure
- **Requirement:** If the lock service is unavailable or lock acquisition times out, the operation must abort fail-closed without mutating the database.
- **Verification:** Tested in [`HierarchyConcurrency.test.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/__tests__/HierarchyConcurrency.test.ts#L301) (Scenario 5):
  1. Mutex was pre-locked with a valid lease.
  2. Caller attempted update with `maxRetries: 2`.
  3. Operation threw `HIERARCHY_LOCK_TIMEOUT`.
  4. Invariant assertion confirmed: `parentOrgId` remained `null` and `version` remained `1`. Zero writes occurred.
- **Rating:** **`PASS`**

---

## 3. Enforcement Audit Summary Matrix

| Invariant # | Invariant Description | Enforced at Code Level | Automated Test Proof | Audit Status |
| :---: | :--- | :--- | :--- | :---: |
| **1** | Unified Graph Mutex (`hierarchy_graph_mutex`) | `hierarchyService.js#L205, #L368` | Scenario 1, 2, 6, 7 | **`PASS`** |
| **2** | Atomic Lock Acquisition & Lease Theft | `hierarchyService.js#L102-L125` | Scenario 14 | **`PASS`** |
| **3** | Active Lease & Owner Verification Pre-Write | `hierarchyService.js#L254-L263` | Scenario 3 | **`PASS`** |
| **4** | Stale Worker Write Blocked on Expiry | `hierarchyService.js#L265, #L280` | Scenario 3 | **`PASS`** |
| **5** | Owner-Validated Release (`owner: nonce`) | `hierarchyService.js#L147-L155` | Scenario 4 | **`PASS`** |
| **6** | Dynamic Expiry vs TTL Index Independence | `hierarchyService.js#L112` | Scenario 14 | **`PASS`** |
| **7** | Fail-Closed on Lock Timeout (0 Writes) | `hierarchyService.js#L137, #L207` | Scenario 5 | **`PASS`** |

---

## 4. Audit Verdict

- **Graph Mutex Enforcement Review:** **`PASS`**
- All 7 concurrency invariants are strictly enforced by the codebase and verified through automated persistence tests.
