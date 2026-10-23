# Master Prompt 03G — Remediation Design & Trade-Offs
## Architectural Options for Atomic Write Authorization & Lease Expiry Safety

**Audit Timestamp:** 2026-10-17T15:42:00+05:30  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  
**Classification:** Remediation Architectural Proposal (Awaiting User Directive)  

---

### 1. Executive Summary

Having confirmed the TOCTOU race condition in `LEASE_EXPIRY_RACE_REPRODUCTION.md`, this document presents a formal architectural evaluation of the remediation designs, their correctness arguments, topology constraints, and operational trade-offs.

As mandated by Rule 6 of Master Prompt 03G, **no production code changes or infrastructure modifications will be executed until the user explicitly reviews and authorizes the chosen remediation path.**

---

### 2. Deployment Topology Verification

Before evaluating transactional designs, a direct runtime probe was executed against the active MongoDB instance:

```javascript
const isMaster = await client.db('admin').command({ isMaster: 1 });
// Output: { ismaster: true, setName: undefined, maxWireVersion: 28 }
```

When a multi-document transaction was attempted on this deployment:
```
MongoServerError: This MongoDB deployment does not support retryable writes.
Please add retryWrites=false to your connection string.
```
And with `retryWrites=false`:
```
MongoServerError: Transaction numbers are only allowed on a replica set member or mongos.
```

**Key Invariant:** The current MongoDB environment is running as a **STANDALONE** instance. In standalone mode, MongoDB's WiredTiger engine **disallows multi-document transactions**.

---

### 3. Comprehensive Evaluation of Architectural Options

---

#### OPTION 1: MongoDB Single-Node Replica Set (`rs0`) + ACID Multi-Document Transactions
*(The Industry-Standard Database Pattern)*

##### Architectural Design:
1. Reconfigure the local/server MongoDB daemon to run as a single-node replica set (`mongod --replSet rs0 --bind_ip 127.0.0.1`).
2. Execute one-time initialization: `rs.initiate()`.
3. Wrap lock verification, cycle verification, and entity mutation in a single ACID transaction:

```javascript
const session = client.startSession();
try {
  await session.withTransaction(async () => {
    // 1. Atomically verify active lock and fencing token in transaction snapshot
    const activeLock = await database.collection('hierarchy_locks').findOne({
      _id: effectiveLockKey,
      owner: lock.owner,
      fencingToken: lock.fencingToken,
      expiresAt: { $gt: new Date() }
    }, { session });

    if (!activeLock) {
      throw new Error('LEASE_EXPIRED');
    }

    // 2. Perform fresh cycle check within transactional snapshot
    const isCycle = await detectHierarchyCycle(childId, parentId, database, { session });
    if (isCycle) throw new Error('CIRCULAR_HIERARCHY_DETECTED');

    // 3. Atomically update target organization
    const updateResult = await database.collection('organizations').updateOne(
      { id: childId, version: currentVersion },
      {
        $set: { parentOrgId: parentId, lastFencingToken: lock.fencingToken, updatedAt: new Date().toISOString() },
        $inc: { version: 1 }
      },
      { session }
    );

    if (updateResult.matchedCount === 0) {
      throw new Error('STALE_MUTATION_REJECTED');
    }
  });
} finally {
  await session.endSession();
}
```

##### Correctness Argument:
Under WiredTiger snapshot isolation, if Worker B modifies `hierarchy_locks` (stealing the lock with token 101) while Worker 1 is paused, Worker 1's transaction will either:
- Read the updated lock document and fail at step 1 (`!activeLock`), or
- Fail during commit with a `WriteConflictError` because the snapshot is stale.
- In both cases, **zero uncommitted writes touch `organizations`**, eliminating both Test A and Test C-Race!

##### Trade-offs & Operational Impact:
- **Pros:** 100% mathematically bulletproof, standardized, clean code, eliminates all TOCTOU windows across all collections.
- **Cons:** Requires changing MongoDB startup parameters (`--replSet rs0`) or `mongod.cfg`. Cannot be done purely from application code without modifying daemon configuration or requiring a replica set in production.

---

#### OPTION 2: Collocated Adjacency & Fencing in a Central Graph Collection
*(Application-Level Single-Document Atomic CAS)*

##### Architectural Design:
Maintain an authoritative, single-document graph registry in collection `hierarchy_graph`:
```json
{
  "_id": "GLOBAL_HIERARCHY_GRAPH",
  "version": 42,
  "lastFencingToken": 101,
  "lock": {
    "owner": "worker-B-nonce",
    "expiresAt": "2026-10-17T15:45:00.000Z",
    "fencingToken": 101
  },
  "edges": {
    "org-child-1": "org-parent-a",
    "org-child-2": "org-parent-b"
  }
}
```

##### Correctness Argument:
When a worker mutates any hierarchy edge:
```javascript
const res = await database.collection('hierarchy_graph').updateOne(
  {
    _id: "GLOBAL_HIERARCHY_GRAPH",
    version: currentVersion,
    "lock.owner": lock.owner,
    "lock.fencingToken": lock.fencingToken,
    "lock.expiresAt": { $gt: new Date() }
  },
  {
    $set: {
      [`edges.${childId}`]: parentId,
      lastFencingToken: lock.fencingToken
    },
    $inc: { version: 1 }
  }
);
```
Because the lock ownership, expiration, token, and edge pointers are **inside the exact same document**, MongoDB's WiredTiger row-lock evaluates the entire filter atomically! If the lease expired or was stolen, `matchedCount` is 0.

##### Trade-offs:
- **Pros:** Runs on standalone MongoDB without replica sets.
- **Cons:** Denormalizes the graph structure; changes domain model API; large organizations with tens of thousands of schools may approach MongoDB's 16MB document limit.

---

#### OPTION 3: Two-Phase Commit with Post-Write Lock Re-affirmation & Synchronous Rollback
*(Optimistic Execution with Strict Post-Write Affirmation)*

##### Architectural Design:
Immediately following the `updateOne` to `organizations`, the worker executes a mandatory lock re-verification:
```javascript
// Step 7: Apply update
await database.collection('organizations').updateOne(...);

// Step 7b: Post-write affirmation (Did our lock survive during the write?)
const affirmed = await database.collection('hierarchy_locks').findOne({
  _id: effectiveLockKey,
  owner: lock.owner,
  fencingToken: lock.fencingToken,
  expiresAt: { $gt: new Date() }
});

if (!affirmed) {
  // Lock was lost or stolen while writing! Immediate forced rollback!
  await database.collection('organizations').updateOne(
    { id: childId, version: currentVersion + 1, lastFencingToken: lock.fencingToken },
    { $set: { parentOrgId: previousParentId }, $inc: { version: 1 } }
  );
  throw new Error('STALE_WRITE_POST_CHECK_FAILED');
}
```

##### Trade-offs:
- **Pros:** Runs on standalone MongoDB.
- **Cons:** Window of vulnerability still exists between write and post-check where a concurrent reader or worker can observe a dirty or cyclic graph state before rollback completes. It narrows the window significantly (from milliseconds to microseconds), but does **not** provide formal ACID linearizability.

---

### 4. Recommendation & Next Steps

1. **Recommended Direction:** **Option 1 (Single-Node Replica Set + ACID Transactions)** is the gold-standard, production-grade architecture for modern MongoDB applications handling multi-entity business workflows (attendance locks, financial ledgers, and hierarchy cycles).
2. **Current Action:** Halt execution at this gate. Present findings and trade-offs to the system owner for a formal architectural decision.
