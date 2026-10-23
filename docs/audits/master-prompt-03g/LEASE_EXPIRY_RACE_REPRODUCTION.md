# Master Prompt 03G — Lease Expiry TOCTOU Race Reproduction
## Adversarial Verification of Time-Of-Check to Time-Of-Use Window in Distributed Hierarchy Mutex

**Audit Timestamp:** 2026-10-17T15:41:30+05:30  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  
**Adversarial Mode:** Live Verification on Synthetic Test Database (`i2a_schoolos_synthetic_test`)  
**Verdict:** `FAIL_STALE_WRITE_RACE`  

---

### 1. Executive Summary & Objective

The objective of Master Prompt 03G is to stress-test the distributed mutex, lease validation, and fencing-token implementation in [`server/services/hierarchyService.js`](file:///D:/i2A_School%20ERP%20&%20Managment/server/services/hierarchyService.js) against an adversarial **Time-Of-Check To Time-Of-Use (TOCTOU)** race condition.

Specifically:
> **Core Hypothesis:** If Worker A passes the lease-validity check at lines 254–258, but pauses before writing (simulating an event loop delay, garbage collection freeze, or network stall), its lease can expire. If Worker B acquires the mutex with a newer fencing token, can Worker A still commit its stale write upon resuming if Worker B has not yet written to the target entity document?

**Finding:** **YES, THE STALE WRITE COMMITS.**  
The race was reproduced with 100% determinism on the live database engine. Furthermore, when two workers target complementary nodes ($A \to B$ and $B \to A$), this TOCTOU race allows **a circular graph ($A \leftrightarrow B$) to be created in the database** despite both the graph mutex and monotonic fencing tokens.

---

### 2. Test A — Controlled Barrier Reproduction (Worker A Writes First)

#### 2.1 Test Execution Sequence
1. Worker A acquires the graph mutex with `fencingToken: 100` and `leaseMs: 100ms`.
2. Worker A executes `findOne` on `hierarchy_locks` to verify lease validity. Check passes (`activeLock: true`).
3. Worker A is paused at a controlled barrier immediately before issuing `updateOne` to `organizations`.
4. While Worker A is paused, 150ms elapses. Worker A's lease expires (`expiresAt < now`).
5. Worker B detects the expired lease, steals the lock with `fencingToken: 101`, and sets a 5000ms lease.
6. Worker B is paused at a controlled barrier before updating the organization document.
7. Worker A resumes and executes its `updateOne` on `organizations` with `lastFencingToken: { $lt: 100 }`.
8. Worker B resumes and executes its `updateOne` on `organizations` with `lastFencingToken: { $lt: 101 }`.

#### 2.2 Live Database Operation Results

```
========================================================
TEST A: LEASE CHECK TO WRITE TOCTOU RACE (Worker A writes first)
========================================================
1. Worker A acquired lock with token 100, lease 100ms
2. Worker A lease check passed: true
3. Pausing Worker A; waiting 150ms for lease to expire...
4. Worker B stole expired lock: true Token B: 101
5. Child state before Worker A write: { version: 1, lastFencingToken: 50, parentOrgId: null }
6. Worker A updateOne execution result: { matchedCount: 1, modifiedCount: 1, acknowledged: true }
7. Worker B updateOne execution result: { matchedCount: 0, modifiedCount: 0, acknowledged: true }
8. Final child document state after Test A: {
  id: 'org-toctou-child',
  version: 2,
  parentOrgId: 'org-toctou-parent-a',
  lastFencingToken: 100
}
```

#### 2.3 Detailed Analysis of Test A
- **Worker A Result:** `matchedCount: 1`, `modifiedCount: 1`. Worker A's write was **ACCEPTED AND PERSISTED TO DISK**, despite its lease having expired and the lock having been stolen by Worker B.
- **Worker B Result:** `matchedCount: 0`, `modifiedCount: 0`. Worker B's write was **REJECTED**, because Worker A modified the document version from 1 to 2.
- **Conclusion:** The expired worker (Worker A) won the write, and the legitimate, active lock-holder (Worker B) was starved/rejected.

---

### 3. Test B — New Worker Writes First, Then Stale Worker Writes

#### 3.1 Test Execution Sequence
1. Worker A acquires lock with `fencingToken: 100`, passes lease check, and pauses.
2. Worker A's lease expires.
3. Worker B steals lock with `fencingToken: 101`.
4. Worker B writes FIRST to `organizations`, setting `lastFencingToken: 101` and `version: 2`.
5. Worker A resumes and attempts its write with `lastFencingToken: { $lt: 100 }` and `version: 1`.

#### 3.2 Live Database Operation Results

```
========================================================
TEST B: NEW WORKER WRITES FIRST, THEN STALE WORKER WRITES
========================================================
Worker B (new worker) write result: { matchedCount: 1, modifiedCount: 1 }
Worker A (stale worker) write result: { matchedCount: 0, modifiedCount: 0 }
Final child document state after Test B: {
  id: 'org-toctou-child',
  version: 2,
  parentOrgId: 'org-toctou-parent-b',
  lastFencingToken: 101
}
```

#### 3.3 Detailed Analysis of Test B
- In Test B, because Worker B committed to the target document before Worker A resumed, the document's `lastFencingToken` became 101 and its `version` became 2.
- Worker A was rejected (`matchedCount: 0`) due to both the version CAS mismatch and `{ lastFencingToken: { $lt: 100 } }` evaluating to false.
- **However, this protection is purely reactive: it ONLY works if the newer worker touches the exact same entity document BEFORE the stale worker resumes.**

---

### 4. Test C-Race — Critical Failure: Circular Graph Formation under TOCTOU

When two workers attempt complementary updates on two distinct nodes ($A \to B$ and $B \to A$), the TOCTOU gap allows both writes to succeed, completely subverting graph cycle prevention:

#### 4.1 Test Execution Sequence
1. Two independent organizations exist: Node A (`parent: null`) and Node B (`parent: null`).
2. Worker 1 wants to assign $A \to B$.
   - Worker 1 acquires mutex with `token: 200`.
   - Worker 1 runs `detectHierarchyCycle('A', 'B')`. (Node B has no parent $\implies$ No cycle!).
   - Worker 1 passes lease check.
   - Worker 1 pauses.
3. Worker 1's lease expires.
4. Worker 2 wants to assign $B \to A$.
   - Worker 2 steals mutex with `token: 201`.
   - Worker 2 runs `detectHierarchyCycle('B', 'A')`. (Node A's parent is STILL null $\implies$ No cycle!).
   - Worker 2 passes lease check and prepares to write.
5. Worker 1 resumes and writes $A.parentOrgId = B$ to Node A. (Node A was at version 1 $\implies$ `matchedCount: 1`).
6. Worker 2 writes $B.parentOrgId = A$ to Node B. (Node B was at version 1 $\implies$ `matchedCount: 1`).
7. Result: Both writes commit!

#### 4.2 Live Database Operation Results

```
========================================================
TEST C-RACE: TWO-NODE CYCLE FORMATION VIA TOCTOU RACE
========================================================
Worker 1 (stale, token 200) write to Node A (A -> B): matchedCount = 1
Worker 2 (new, token 201) write to Node B (B -> A): matchedCount = 1
Graph state: Node A parent = org-toctou-cycle-b , Node B parent = org-toctou-cycle-a
>>> VULNERABILITY CONFIRMED: CIRCULAR GRAPH A <-> B FORMED UNDER TOCTOU RACE! <<<
```

---

### 5. Reproducibility Script & Command Verification

The test is fully scripted and reproducible via:
```powershell
node scripts/test-toctou-race.js
```
- **Exit Code:** 0
- **Database Used:** `i2a_schoolos_synthetic_test`
- **Result:** Defect confirmed with zero side-effects on primary production database `i2a_schoolos`.
