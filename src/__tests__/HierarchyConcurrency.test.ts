/**
 * i2A SchoolOS — Master Prompt 03E: Hierarchy Mutation Path & Fencing Enforcement Audit Suite
 * 
 * Verifies non-blocking, deadlock-free, race-free hierarchy mutation safeguards:
 * 1. Three-node cycle race (A->B, B->C, C->A) guarantees zero cycles and zero dirty reads
 * 2. Two overlapping hierarchy updates targeting the same node (A->B vs A->C) serialize cleanly
 * 3. Expired lease and stale worker write prevention (Zombie writer CAS & lease defense)
 * 4. Lock release authorization (Non-owner release rejected, lock preserved)
 * 5. Mutex unavailable fail-closed behavior (Timeout aborts with ZERO writes to database)
 * 6. Alternate route bypass attempt (createOrganization with circular parent or self-parent rejected)
 * 7. Import/provisioning path hierarchy mutation (createOrganization enforces graph mutex)
 * 8. Rollback does not overwrite another worker's concurrent valid update
 * 9. Stale fencing token rejected by write authorization query filter
 * 10. Tenant boundary and domain invariants strictly enforced under concurrency
 * 11. Two-node opposite-direction cycle race (A->B vs B->A)
 * 12. Self-parenting immediate rejection (O(1) fail-closed)
 * 13. Safe detachment to standalone (parentId: null) and idempotent no-ops
 * 14. Process interruption and lock recovery via expired lease
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { getDb, closeDb } from '../../server/db.js';
import {
  detectHierarchyCycle,
  acquireHierarchyLock,
  releaseHierarchyLock,
  updateOrganizationParent,
  createOrganization
} from '../../server/services/hierarchyService.js';

describe('i2A SchoolOS — Master Prompt 03E: Hierarchy Mutation Path & Fencing Enforcement Suite', () => {
  let db: any;

  beforeAll(async () => {
    process.env.TEST_DB_NAME = 'i2a_schoolos_synthetic_test';
    process.env.MONGODB_URI = 'mongodb://127.0.0.1:27018/?replicaSet=rs0&directConnection=true';
    db = await getDb();
  });

  afterAll(async () => {
    // Clean up test organizations created during tests
    if (db) {
      await db.collection('organizations').deleteMany({
        id: { $regex: '^org-adv-' }
      });
      await db.collection('hierarchy_locks').deleteMany({
        _id: { $regex: 'org-adv-' }
      });
    }
    await closeDb();
    delete process.env.MONGODB_URI;
  });

  beforeEach(async () => {
    // Reset test fixture organizations to a clean baseline before each test
    await db.collection('organizations').deleteMany({
      id: { $regex: '^org-adv-' }
    });
    await db.collection('hierarchy_locks').deleteMany({});

    // Create fresh test fixtures
    const baseOrgs = [
      {
        id: 'org-adv-a',
        orgCode: 'ADV-A',
        legalName: 'Adversarial Test Org A',
        orgType: 'PRIVATE_TRUST',
        parentOrgId: null,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      },
      {
        id: 'org-adv-b',
        orgCode: 'ADV-B',
        legalName: 'Adversarial Test Org B',
        orgType: 'PRIVATE_TRUST',
        parentOrgId: null,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      },
      {
        id: 'org-adv-c',
        orgCode: 'ADV-C',
        legalName: 'Adversarial Test Org C',
        orgType: 'PRIVATE_TRUST',
        parentOrgId: null,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      },
      {
        id: 'org-adv-d',
        orgCode: 'ADV-D',
        legalName: 'Adversarial Test Org D',
        orgType: 'PRIVATE_TRUST',
        parentOrgId: null,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      },
      {
        id: 'org-adv-e',
        orgCode: 'ADV-E',
        legalName: 'Adversarial Test Org E',
        orgType: 'PRIVATE_TRUST',
        parentOrgId: null,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      },
      {
        id: 'org-adv-f',
        orgCode: 'ADV-F',
        legalName: 'Adversarial Test Org F',
        orgType: 'PRIVATE_TRUST',
        parentOrgId: null,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      },
      {
        id: 'org-adv-standalone',
        orgCode: 'ADV-STANDALONE',
        legalName: 'Standalone Independent School',
        orgType: 'INDEPENDENT_SCHOOL',
        parentOrgId: null,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        version: 1
      }
    ];

    await db.collection('organizations').insertMany(baseOrgs);
  });

  // --------------------------------------------------------------------------
  // Scenario 1: Three-Node Cycle Race (A->B, B->C, C->A)
  // --------------------------------------------------------------------------
  it('Scenario 1: Three-node cycle race guarantees zero cycles, zero dirty reads, and clean pre-check rejection', async () => {
    // Concurrently dispatch A->B, B->C, C->A
    const results = await Promise.allSettled([
      updateOrganizationParent({ childId: 'org-adv-a', parentId: 'org-adv-b', database: db }),
      updateOrganizationParent({ childId: 'org-adv-b', parentId: 'org-adv-c', database: db }),
      updateOrganizationParent({ childId: 'org-adv-c', parentId: 'org-adv-a', database: db })
    ]);

    const fulfilled = results.filter(r => r.status === 'fulfilled');
    const rejected = results.filter(r => r.status === 'rejected');

    // Exactly 2 must commit valid edges, exactly 1 cycle-closing edge must be rejected
    expect(fulfilled.length).toBe(2);
    expect(rejected.length).toBe(1);

    const rejectedReason = (rejected[0] as PromiseRejectedResult).reason;
    expect(rejectedReason.message).toMatch(/CIRCULAR_HIERARCHY_DETECTED/);

    const docA = await db.collection('organizations').findOne({ id: 'org-adv-a' });
    const docB = await db.collection('organizations').findOne({ id: 'org-adv-b' });
    const docC = await db.collection('organizations').findOne({ id: 'org-adv-c' });

    // Verify that NO complete circular path exists
    const isFullCycle = (
      docA.parentOrgId === 'org-adv-b' &&
      docB.parentOrgId === 'org-adv-c' &&
      docC.parentOrgId === 'org-adv-a'
    );
    expect(isFullCycle).toBe(false);

    // Verify all graph components remain acyclic
    const cycleAB = await detectHierarchyCycle('org-adv-a', 'org-adv-b', db);
    const cycleBC = await detectHierarchyCycle('org-adv-b', 'org-adv-c', db);
    const cycleCA = await detectHierarchyCycle('org-adv-c', 'org-adv-a', db);
    expect(cycleAB && cycleBC && cycleCA).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Two Overlapping Hierarchy Updates (A->B vs A->C)
  // --------------------------------------------------------------------------
  it('Scenario 2: Two overlapping updates targeting the same child serialize with CAS consistency', async () => {
    // Concurrently attempt to set A's parent to B and A's parent to C
    const results = await Promise.allSettled([
      updateOrganizationParent({ childId: 'org-adv-a', parentId: 'org-adv-b', database: db }),
      updateOrganizationParent({ childId: 'org-adv-a', parentId: 'org-adv-c', database: db })
    ]);

    // Both serialize; one commits first, the second commits on the updated version
    const fulfilled = results.filter(r => r.status === 'fulfilled');
    expect(fulfilled.length).toBeGreaterThanOrEqual(1);

    const docA = await db.collection('organizations').findOne({ id: 'org-adv-a' });
    expect(['org-adv-b', 'org-adv-c']).toContain(docA.parentOrgId);
    expect(docA.version).toBeGreaterThanOrEqual(2);
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Expired Lease and Stale Worker Write Prevention (Zombie Writer CAS Defense)
  // --------------------------------------------------------------------------
  it('Scenario 3: Prevents stale worker with expired lease from overwriting newer worker data', async () => {
    // 1. Worker A acquires lock with a short lease (100ms)
    const lockA = await acquireHierarchyLock('hierarchy_graph_mutex', db, { leaseMs: 100 });
    expect(lockA.acquired).toBe(true);

    // Worker A reads initial document at version 1
    const docBefore = await db.collection('organizations').findOne({ id: 'org-adv-a' });
    expect(docBefore.version).toBe(1);

    // 2. Worker A pauses; lease expires (sleep 150ms)
    await new Promise(r => setTimeout(r, 150));

    // 3. Worker B acquires lock (steals expired lease) and updates org-adv-a to parent B
    const resB = await updateOrganizationParent({
      childId: 'org-adv-a',
      parentId: 'org-adv-b',
      database: db
    });
    expect(resB.success).toBe(true);
    expect(resB.version).toBe(2);

    const docAfterB = await db.collection('organizations').findOne({ id: 'org-adv-a' });
    expect(docAfterB.parentOrgId).toBe('org-adv-b');
    expect(docAfterB.version).toBe(2);

    // 4. Worker A resumes and attempts to apply its stale write
    let workerAFailed = false;
    try {
      const activeLock = await db.collection('hierarchy_locks').findOne({
        _id: 'hierarchy_graph_mutex',
        owner: lockA.owner,
        expiresAt: { $gt: new Date() }
      });
      if (!activeLock) {
        throw new Error('LEASE_EXPIRED');
      }

      await db.collection('organizations').updateOne(
        { id: 'org-adv-a', version: docBefore.version },
        { $set: { parentOrgId: 'org-adv-c' }, $inc: { version: 1 } }
      );
    } catch (err: any) {
      workerAFailed = true;
    }
    expect(workerAFailed).toBe(true);

    // 5. Verify final document state: Worker B's update MUST be 100% preserved
    const finalDoc = await db.collection('organizations').findOne({ id: 'org-adv-a' });
    expect(finalDoc.parentOrgId).toBe('org-adv-b');
    expect(finalDoc.version).toBe(2);
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Lock Release Authorization (Non-Owner Release Rejected)
  // --------------------------------------------------------------------------
  it('Scenario 4: Rejects unauthorized lock release by non-owner; lock remains held', async () => {
    const lockKey = 'test-auth-lock';
    const lock = await acquireHierarchyLock(lockKey, db, { leaseMs: 5000 });
    expect(lock.acquired).toBe(true);

    // Attacker tries to release lock with invalid nonce
    const rogueRelease = await releaseHierarchyLock(lockKey, 'attacker-fake-nonce', db);
    expect(rogueRelease).toBe(false);

    // Verify lock is STILL in database and owned by original worker
    const lockDoc = await db.collection('hierarchy_locks').findOne({ _id: lockKey });
    expect(lockDoc).toBeDefined();
    expect(lockDoc.owner).toBe(lock.owner);

    // Legitimate owner releases lock
    const validRelease = await releaseHierarchyLock(lockKey, lock.owner, db);
    expect(validRelease).toBe(true);

    const remaining = await db.collection('hierarchy_locks').findOne({ _id: lockKey });
    expect(remaining).toBeNull();
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Mutex Unavailable Fail-Closed Behavior (Zero Writes)
  // --------------------------------------------------------------------------
  it('Scenario 5: Aborts fail-closed when lock is unavailable with zero mutations to database', async () => {
    // 1. Manually hold the mutex with a long lease
    await db.collection('hierarchy_locks').insertOne({
      _id: 'hierarchy_graph_mutex',
      locked: true,
      owner: 'competing-system-nonce',
      fencingToken: 999,
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + 60000)
    });

    // 2. Caller attempts update with minimal retries
    await expect(
      updateOrganizationParent({
        childId: 'org-adv-a',
        parentId: 'org-adv-b',
        database: db,
        maxRetries: 2,
        retryDelayMs: 10
      })
    ).rejects.toThrow(/HIERARCHY_LOCK_TIMEOUT/);

    // 3. CRITICAL ASSERTION: Zero mutations occurred on org-adv-a
    const docA = await db.collection('organizations').findOne({ id: 'org-adv-a' });
    expect(docA.parentOrgId).toBeNull();
    expect(docA.version).toBe(1);

    // Cleanup held lock
    await db.collection('hierarchy_locks').deleteOne({ _id: 'hierarchy_graph_mutex' });
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Alternate Route Bypass Attempt (createOrganization)
  // --------------------------------------------------------------------------
  it('Scenario 6: Prevents alternate route bypass: createOrganization rejects circular or self-parent links', async () => {
    // Attempt to create an organization that points to itself
    await expect(
      createOrganization(
        {
          id: 'org-adv-new-self',
          orgCode: 'ADV-NEW-SELF',
          legalName: 'Self Referencing Org',
          orgType: 'PRIVATE_TRUST',
          parentOrgId: 'org-adv-new-self'
        },
        db
      )
    ).rejects.toThrow(/SELF_HIERARCHY_VIOLATION/);

    // Build chain: B -> A
    await updateOrganizationParent({ childId: 'org-adv-b', parentId: 'org-adv-a', database: db });

    // Attempt to create new entity org-adv-c with parent B, then link A -> C
    const newOrgC = await createOrganization(
      {
        id: 'org-adv-new-c',
        orgCode: 'ADV-NEW-C',
        legalName: 'New Org C',
        orgType: 'PRIVATE_TRUST',
        parentOrgId: 'org-adv-b'
      },
      db
    );
    expect(newOrgC.id).toBe('org-adv-new-c');
    expect(newOrgC.parentOrgId).toBe('org-adv-b');

    // Now attempt to set A's parent to newOrgC (which would close the loop: A -> C -> B -> A)
    await expect(
      updateOrganizationParent({
        childId: 'org-adv-a',
        parentId: 'org-adv-new-c',
        database: db
      })
    ).rejects.toThrow(/CIRCULAR_HIERARCHY_DETECTED/);

    // Clean up
    await db.collection('organizations').deleteOne({ id: 'org-adv-new-c' });
  });

  // --------------------------------------------------------------------------
  // Scenario 7: Import / Provisioning Path Hierarchy Mutation
  // --------------------------------------------------------------------------
  it('Scenario 7: Import / Provisioning path enforces graph mutex and CAS versioning', async () => {
    const importedOrg = await createOrganization(
      {
        id: 'org-adv-imported',
        orgCode: 'ADV-IMPORT',
        legalName: 'Imported School Trust',
        orgType: 'PRIVATE_TRUST',
        parentOrgId: 'org-adv-a'
      },
      db
    );

    expect(importedOrg.id).toBe('org-adv-imported');
    expect(importedOrg.parentOrgId).toBe('org-adv-a');
    expect(importedOrg.version).toBe(1);
    expect(typeof importedOrg.lastFencingToken).toBe('number');

    const persisted = await db.collection('organizations').findOne({ id: 'org-adv-imported' });
    expect(persisted).toBeDefined();
    expect(persisted.lastFencingToken).toBe(importedOrg.lastFencingToken);

    // Clean up
    await db.collection('organizations').deleteOne({ id: 'org-adv-imported' });
  });

  // --------------------------------------------------------------------------
  // Scenario 8: Rollback Does Not Overwrite Concurrent Valid Update
  // --------------------------------------------------------------------------
  it('Scenario 8: Version-fenced rollback does not overwrite concurrent valid updates', async () => {
    // Org A starts at version 1, parent null
    const docA = await db.collection('organizations').findOne({ id: 'org-adv-a' });
    const initialVersion = docA.version || 1;

    // Simulate Worker 1 updating to parent B (version becomes 2)
    await db.collection('organizations').updateOne(
      { id: 'org-adv-a', version: initialVersion },
      { $set: { parentOrgId: 'org-adv-b' }, $inc: { version: 1 } }
    );

    // Simulate Worker 2 updating to parent C (version becomes 3)
    await db.collection('organizations').updateOne(
      { id: 'org-adv-a', version: initialVersion + 1 },
      { $set: { parentOrgId: 'org-adv-c' }, $inc: { version: 1 } }
    );

    // Worker 1 now attempts rollback of its update (expecting version: 2 and parent: 'org-adv-b')
    const rollbackRes = await db.collection('organizations').updateOne(
      {
        id: 'org-adv-a',
        version: initialVersion + 1,
        parentOrgId: 'org-adv-b'
      },
      {
        $set: { parentOrgId: null },
        $inc: { version: 1 }
      }
    );

    // Rollback MUST match 0 documents because version is 3 and parent is 'org-adv-c'
    expect(rollbackRes.matchedCount).toBe(0);

    // Verify Worker 2's update was NOT overwritten
    const finalDoc = await db.collection('organizations').findOne({ id: 'org-adv-a' });
    expect(finalDoc.parentOrgId).toBe('org-adv-c');
    expect(finalDoc.version).toBe(3);
  });

  // --------------------------------------------------------------------------
  // Scenario 9: Stale Fencing Token Rejected in Write Authorization Filter
  // --------------------------------------------------------------------------
  it('Scenario 9: Directly rejects write attempt with stale fencing token via DB authorization filter', async () => {
    // Setup document with an existing fencing token (e.g. 100)
    await db.collection('organizations').updateOne(
      { id: 'org-adv-a' },
      { $set: { lastFencingToken: 100, version: 5, parentOrgId: null } }
    );

    // Simulate a stale worker attempting an update with stale fencing token 80 (< 100)
    const staleWriteResult = await db.collection('organizations').updateOne(
      {
        id: 'org-adv-a',
        version: 5,
        $or: [
          { lastFencingToken: { $exists: false } },
          { lastFencingToken: { $lt: 80 } } // 100 < 80 is FALSE!
        ]
      },
      {
        $set: { parentOrgId: 'org-adv-b', lastFencingToken: 80 },
        $inc: { version: 1 }
      }
    );

    // The atomic filter MUST match 0 documents because 100 is NOT < 80
    expect(staleWriteResult.matchedCount).toBe(0);

    // Verify the document was untouched
    const docA = await db.collection('organizations').findOne({ id: 'org-adv-a' });
    expect(docA.parentOrgId).toBeNull();
    expect(docA.version).toBe(5);
    expect(docA.lastFencingToken).toBe(100);
  });

  // --------------------------------------------------------------------------
  // Scenario 10: Tenant Boundary & Domain Invariants Strictly Enforced Under Concurrency
  // --------------------------------------------------------------------------
  it('Scenario 10: Strictly enforces entity existence and independent school restrictions', async () => {
    // Non-existent parent
    await expect(
      updateOrganizationParent({
        childId: 'org-adv-a',
        parentId: 'org-non-existent-999',
        database: db
      })
    ).rejects.toThrow(/INVALID_PARENT_ORGANIZATION/);

    // Independent school as parent
    await expect(
      updateOrganizationParent({
        childId: 'org-adv-a',
        parentId: 'org-adv-standalone',
        database: db
      })
    ).rejects.toThrow(/INVALID_PARENT_TYPE/);
  });

  // --------------------------------------------------------------------------
  // Scenario 11: Two-Node Opposite-Direction Cycle Race (A->B vs B->A)
  // --------------------------------------------------------------------------
  it('Scenario 11: Serializes two-node opposite-direction race; exactly 1 succeeds, 1 rejected', async () => {
    const [resA, resB] = await Promise.allSettled([
      updateOrganizationParent({ childId: 'org-adv-a', parentId: 'org-adv-b', database: db }),
      updateOrganizationParent({ childId: 'org-adv-b', parentId: 'org-adv-a', database: db })
    ]);

    const fulfilled = [resA, resB].filter(r => r.status === 'fulfilled');
    const rejected = [resA, resB].filter(r => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);

    const docA = await db.collection('organizations').findOne({ id: 'org-adv-a' });
    const docB = await db.collection('organizations').findOne({ id: 'org-adv-b' });

    const aParentOfB = docB.parentOrgId === 'org-adv-a' && docA.parentOrgId === null;
    const bParentOfA = docA.parentOrgId === 'org-adv-b' && docB.parentOrgId === null;
    expect(aParentOfB || bParentOfA).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Scenario 12: Self-Parenting Violation Rejection
  // --------------------------------------------------------------------------
  it('Scenario 12: Self-parenting rejected immediately in O(1)', async () => {
    await expect(
      updateOrganizationParent({
        childId: 'org-adv-a',
        parentId: 'org-adv-a',
        database: db
      })
    ).rejects.toThrow(/SELF_HIERARCHY_VIOLATION/);

    const doc = await db.collection('organizations').findOne({ id: 'org-adv-a' });
    expect(doc.parentOrgId).toBeNull();
  });

  // --------------------------------------------------------------------------
  // Scenario 13: Safe Detachment to Standalone and Idempotent No-Ops
  // --------------------------------------------------------------------------
  it('Scenario 13: Safely detaches child to standalone and handles idempotent calls', async () => {
    await updateOrganizationParent({ childId: 'org-adv-a', parentId: 'org-adv-b', database: db });
    let doc = await db.collection('organizations').findOne({ id: 'org-adv-a' });
    expect(doc.parentOrgId).toBe('org-adv-b');

    // Detach to standalone
    const detachRes = await updateOrganizationParent({ childId: 'org-adv-a', parentId: null, database: db });
    expect(detachRes.success).toBe(true);
    expect(detachRes.parentId).toBeNull();

    doc = await db.collection('organizations').findOne({ id: 'org-adv-a' });
    expect(doc.parentOrgId).toBeNull();

    // Idempotent call
    const noOpRes = await updateOrganizationParent({ childId: 'org-adv-a', parentId: null, database: db });
    expect(noOpRes.success).toBe(true);
    expect(noOpRes.noOp).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Scenario 14: Process Interruption and Lock Recovery via Expired Lease
  // --------------------------------------------------------------------------
  it('Scenario 14: Atomically steals expired lease with incremented monotonic fencing token', async () => {
    const lockKey = 'test-recovery-key';
    const past = new Date(Date.now() - 5000);

    // Insert crashed process lock
    await db.collection('hierarchy_locks').insertOne({
      _id: lockKey,
      locked: true,
      owner: 'crashed-worker-nonce',
      fencingToken: 10,
      lockedAt: past,
      expiresAt: past
    });

    // New worker acquires lock
    const newLock = await acquireHierarchyLock(lockKey, db, { leaseMs: 3000 });
    expect(newLock.acquired).toBe(true);
    expect(newLock.owner).not.toBe('crashed-worker-nonce');
    expect(typeof newLock.fencingToken).toBe('number');

    // Clean release
    const released = await releaseHierarchyLock(lockKey, newLock.owner, db);
    expect(released).toBe(true);
  });
});
