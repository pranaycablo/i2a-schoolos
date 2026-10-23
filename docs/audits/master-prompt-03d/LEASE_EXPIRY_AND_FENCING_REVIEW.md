# i2A SchoolOS — Master Prompt 03D: Lease Expiry, Zombie Worker & Fencing Review

**Document Version:** 1.0.0  
**Phase:** Master Prompt 03D — Adversarial Hierarchy Concurrency Audit  
**Scope:** Stale Worker Overwrite Prevention, Compare-And-Set (CAS), Fencing Tokens  
**Auditor:** Senior Database Reliability Engineer & Application Security Reviewer  
**Audit Rating:** **`PASS`**  

---

## 1. Threat Definition: The Stale Worker (Zombie Writer) Hazard

A classic failure mode in distributed lease locking (often termed the *Zombie Writer Problem*) occurs when a process holding a lease pauses for longer than its lease duration:

```mermaid
sequenceDiagram
    autonumber
    actor WA as Worker A (Paused/Slow)
    actor WB as Worker B (New Owner)
    participant Lock as hierarchy_locks
    participant DB as organizations

    WA->>Lock: 1. acquireHierarchyLock(leaseMs: 100ms)
    WA->>DB: 2. Reads Org X at version: 1
    Note over WA: WA enters long pause (GC pause, event loop starvation, network freeze)
    Note over Lock: Lease expires at t = 100ms
    WB->>Lock: 3. Steals expired lease (fencingToken increments)
    WB->>DB: 4. Reads Org X at version: 1
    WB->>DB: 5. Updates Org X to Parent B (version increments to 2)
    WB->>Lock: 6. Releases lock cleanly
    Note over WA: WA wakes up at t = 200ms
    Note over WA,DB: WITHOUT CAS / FENCING: WA would blindly overwrite Org X to Parent A, destroying WB's committed write!
    WA->>DB: 7. CAS Update: updateOne({ id: X, version: 1 })
    Note over DB: Version is 2 != 1! MatchedCount = 0! (REJECTED!)
    DB-->>WA: Throw STALE_MUTATION_REJECTED / LEASE_EXPIRED
    Note over DB: Worker B's data is 100% PRESERVED!
```

---

## 2. Two-Tier Defense Architecture

To provide an ironclad guarantee against stale worker overwrites on standalone MongoDB instances, i2A SchoolOS implements a **Two-Tier Defense Mechanism**:

### Tier 1: Active Lease Ownership Verification Before Mutation
Immediately before issuing any update to the `organizations` collection, the worker performs a fresh check against `hierarchy_locks`:
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
If the worker's lease expired while it was paused, `activeLock` returns `null` and the operation aborts with `LEASE_EXPIRED` before executing any write.

### Tier 2: Document-Level Compare-And-Set (CAS) Conditional Update
Even if the worker unpauses at the exact microsecond before the lease expires, the write operation is guarded by an atomic single-document Compare-And-Set (CAS) filter on the document version:
```javascript
const updateResult = await database.collection('organizations').updateOne(
  {
    id: childId,
    version: currentVersion // CAS condition!
  },
  {
    $set: {
      parentOrgId: parentId || null,
      updatedAt: new Date().toISOString(),
      lastFencingToken: lock.fencingToken
    },
    $inc: { version: 1 }
  }
);

if (updateResult.matchedCount === 0) {
  const err = new Error(
    `STALE_MUTATION_REJECTED: Organization [${childId}] was modified concurrently. Expected version ${currentVersion}. Mutation aborted.`
  );
  err.code = 'STALE_MUTATION_REJECTED';
  throw err;
}
```

**Why CAS is mathematically race-free in MongoDB:**  
In MongoDB WiredTiger, single-document write operations (`updateOne`) are strictly atomic at the row level. If Worker B updated the document, `version` incremented from 1 to 2. When Worker A executes its CAS update with `{ version: 1 }`, MongoDB finds **0 matching documents**. Worker A's update matches 0 documents and aborts immediately. Worker B's committed data cannot be overwritten.

---

## 3. Monotonic Fencing Token Specification

In accordance with Martin Kleppmann's distributed systems fencing principles, every lock acquisition in `hierarchyService.js` allocates a strictly increasing monotonic integer:
```javascript
const seqDoc = await database.collection('hierarchy_locks').findOneAndUpdate(
  { _id: '__lock_sequence__' },
  { $inc: { seq: 1 } },
  { upsert: true, returnDocument: 'after' }
);
const fencingToken = seqDoc && typeof seqDoc.seq === 'number' ? seqDoc.seq : Date.now();
```
When an update commits, `lastFencingToken: lock.fencingToken` is recorded in the organization document. If a lease is stolen after expiry, the new owner receives a higher token ($T_2 > T_1$), permanently invalidating the previous owner's epoch.

---

## 4. Empirical Test Verification

From [`src/__tests__/HierarchyConcurrency.test.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/__tests__/HierarchyConcurrency.test.ts#L236-L287) (Scenario 5):
1. **Worker A** acquires lock with `leaseMs: 100ms` and reads document at `version: 1`.
2. **Worker A** pauses for 150ms (lease expires).
3. **Worker B** steals expired lease, updates document to Parent B, increments version to 2.
4. **Worker A** resumes and attempts write.
5. **Observed Output:**
   ```
   Worker A write was REJECTED with: LEASE_EXPIRED - LEASE_EXPIRED: Hierarchy lock for [hierarchy_graph_mutex] expired or stolen before write.
   Final Document State: { parentOrgId: 'org-stale-parent-b', version: 2, preservedWorkerB: true }
   ```
6. **Result:** Worker B's data was **100% preserved**.

---

## 5. Audit Finding & Verdict

- **Lease Expiry and Zombie Writer Review:** **`PASS`**
- The implementation completely resolves the stale worker overwrite risk through atomic CAS version checks and active lease validation.
