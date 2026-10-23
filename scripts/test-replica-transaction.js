import { MongoClient } from 'mongodb';

async function main() {
  const client = new MongoClient('mongodb://127.0.0.1:27018/?directConnection=true');
  await client.connect();
  const admin = client.db('admin');
  try {
    await admin.command({ replSetInitiate: {} });
  } catch (err) {}

  // Wait for primary
  for (let i = 0; i < 20; i++) {
    const status = await admin.command({ hello: 1 });
    if (status.isWritablePrimary) break;
    await new Promise(r => setTimeout(r, 500));
  }

  const db = client.db('i2a_schoolos_synthetic_test');
  
  // Clean up
  await db.collection('organizations').deleteMany({});
  await db.collection('hierarchy_locks').deleteMany({});

  // Insert test docs
  await db.collection('organizations').insertMany([
    { id: 'org-tx-child', version: 1, parentOrgId: null, lastFencingToken: 50 },
    { id: 'org-tx-parent-a', version: 1, parentOrgId: null, lastFencingToken: 50 },
    { id: 'org-tx-parent-b', version: 1, parentOrgId: null, lastFencingToken: 50 }
  ]);

  console.log('=== TEST: TRANSACTIONAL TOCTOU RACE WITH LOCK-TOUCH ===');

  // Step 1: Worker A acquires lock with token 100, lease 150ms
  const tokenA = 100;
  const ownerA = 'worker-A-nonce';
  const nowA = new Date();
  await db.collection('hierarchy_locks').insertOne({
    _id: 'hierarchy_graph_mutex',
    locked: true,
    owner: ownerA,
    fencingToken: tokenA,
    lockedAt: nowA,
    expiresAt: new Date(nowA.getTime() + 150)
  });

  // Worker A starts transaction
  const sessionA = client.startSession();
  sessionA.startTransaction();

  // Worker A touches the lock inside the transaction!
  const touchA = await db.collection('hierarchy_locks').findOneAndUpdate(
    {
      _id: 'hierarchy_graph_mutex',
      owner: ownerA,
      fencingToken: tokenA,
      expiresAt: { $gt: new Date() }
    },
    { $set: { lastVerifiedAt: new Date() } },
    { session: sessionA, returnDocument: 'after' }
  );
  console.log('1. Worker A in-transaction lock touch succeeded:', !!touchA);

  // Worker A executes update on child inside transaction
  await db.collection('organizations').updateOne(
    { id: 'org-tx-child', version: 1 },
    { $set: { parentOrgId: 'org-tx-parent-a', lastFencingToken: tokenA }, $inc: { version: 1 } },
    { session: sessionA }
  );
  console.log('2. Worker A updateOne executed inside transaction (uncommitted)');

  // Worker A PAUSES! Let lease expire!
  console.log('3. Pausing Worker A for 200ms so lease expires...');
  await new Promise(r => setTimeout(r, 200));

  // Worker A attempts to commit its transaction after lease expired!
  let commitAError = null;
  try {
    // Worker A re-checks lease right before commit inside the same session:
    const recheckA = await db.collection('hierarchy_locks').findOne(
      {
        _id: 'hierarchy_graph_mutex',
        owner: ownerA,
        fencingToken: tokenA,
        expiresAt: { $gt: new Date() }
      },
      { session: sessionA }
    );
    if (!recheckA) {
      throw new Error('LEASE_EXPIRED_BEFORE_COMMIT');
    }
    await sessionA.commitTransaction();
    console.log('Worker A committed transaction unexpectedly!');
  } catch (err) {
    commitAError = err;
    await sessionA.abortTransaction();
    console.log('4. Worker A transaction ABORTED as expected:', err.message);
  } finally {
    await sessionA.endSession();
  }

  // Now Worker B acquires expired lock and commits its transaction!
  const tokenB = 101;
  const ownerB = 'worker-B-nonce';
  const nowB = new Date();
  const stolenB = await db.collection('hierarchy_locks').findOneAndUpdate(
    { _id: 'hierarchy_graph_mutex', expiresAt: { $lt: new Date() } },
    { $set: { locked: true, owner: ownerB, fencingToken: tokenB, lockedAt: nowB, expiresAt: new Date(nowB.getTime() + 5000) } },
    { returnDocument: 'after' }
  );
  console.log('5. Worker B successfully acquired expired lock:', !!stolenB);

  const sessionB = client.startSession();
  sessionB.startTransaction();
  await db.collection('organizations').updateOne(
    { id: 'org-tx-child', version: 1 },
    { $set: { parentOrgId: 'org-tx-parent-b', lastFencingToken: tokenB }, $inc: { version: 1 } },
    { session: sessionB }
  );
  await sessionB.commitTransaction();
  await sessionB.endSession();
  console.log('6. Worker B committed its transaction!');

  // Verify final document state
  const finalDoc = await db.collection('organizations').findOne({ id: 'org-tx-child' });
  console.log('7. FINAL DOCUMENT STATE:', {
    id: finalDoc.id,
    parentOrgId: finalDoc.parentOrgId,
    version: finalDoc.version,
    lastFencingToken: finalDoc.lastFencingToken
  });

  console.log('\n=== TEST: TRANSACTIONAL TWO-NODE CYCLE RACE PREVENTION ===');

  // Insert two independent nodes A and B
  await db.collection('organizations').insertMany([
    { id: 'org-tx-cycle-a', version: 1, parentOrgId: null, lastFencingToken: 10 },
    { id: 'org-tx-cycle-b', version: 1, parentOrgId: null, lastFencingToken: 10 }
  ]);

  // Clean lock
  await db.collection('hierarchy_locks').deleteMany({ _id: 'hierarchy_graph_mutex' });

  // Worker 1 acquires lock token 200, lease 150ms
  const token1 = 200;
  const owner1 = 'worker-1-nonce';
  await db.collection('hierarchy_locks').insertOne({
    _id: 'hierarchy_graph_mutex',
    locked: true,
    owner: owner1,
    fencingToken: token1,
    lockedAt: new Date(),
    expiresAt: new Date(Date.now() + 150)
  });

  // Worker 1 starts transaction, touches lock, checks cycle (A -> B: clean)
  const session1 = client.startSession();
  session1.startTransaction();
  await db.collection('hierarchy_locks').findOneAndUpdate(
    { _id: 'hierarchy_graph_mutex', owner: owner1, fencingToken: token1, expiresAt: { $gt: new Date() } },
    { $set: { lastVerifiedAt: new Date() } },
    { session: session1 }
  );
  await db.collection('organizations').updateOne(
    { id: 'org-tx-cycle-a', version: 1 },
    { $set: { parentOrgId: 'org-tx-cycle-b', lastFencingToken: token1 }, $inc: { version: 1 } },
    { session: session1 }
  );

  // Worker 1 pauses; lease expires!
  console.log('Pausing Worker 1 for 200ms...');
  await new Promise(r => setTimeout(r, 200));

  // Worker 2 steals lock with token 201
  const token2 = 201;
  const owner2 = 'worker-2-nonce';
  await db.collection('hierarchy_locks').findOneAndUpdate(
    { _id: 'hierarchy_graph_mutex', expiresAt: { $lt: new Date() } },
    { $set: { locked: true, owner: owner2, fencingToken: token2, lockedAt: new Date(), expiresAt: new Date(Date.now() + 5000) } }
  );

  // Worker 2 starts transaction for B -> A
  const session2 = client.startSession();
  session2.startTransaction();
  await db.collection('hierarchy_locks').findOneAndUpdate(
    { _id: 'hierarchy_graph_mutex', owner: owner2, fencingToken: token2, expiresAt: { $gt: new Date() } },
    { $set: { lastVerifiedAt: new Date() } },
    { session: session2 }
  );
  await db.collection('organizations').updateOne(
    { id: 'org-tx-cycle-b', version: 1 },
    { $set: { parentOrgId: 'org-tx-cycle-a', lastFencingToken: token2 }, $inc: { version: 1 } },
    { session: session2 }
  );

  // Worker 1 attempts commit: lease recheck fails!
  let worker1Aborted = false;
  try {
    const recheck1 = await db.collection('hierarchy_locks').findOne(
      { _id: 'hierarchy_graph_mutex', owner: owner1, fencingToken: token1, expiresAt: { $gt: new Date() } },
      { session: session1 }
    );
    if (!recheck1) throw new Error('LEASE_EXPIRED_BEFORE_COMMIT');
    await session1.commitTransaction();
  } catch (err) {
    worker1Aborted = true;
    await session1.abortTransaction();
    console.log('Worker 1 transaction aborted:', err.message);
  } finally {
    await session1.endSession();
  }

  // Worker 2 commits cleanly
  await session2.commitTransaction();
  await session2.endSession();
  console.log('Worker 2 committed successfully!');

  // Check graph state
  const docCycleA = await db.collection('organizations').findOne({ id: 'org-tx-cycle-a' });
  const docCycleB = await db.collection('organizations').findOne({ id: 'org-tx-cycle-b' });
  console.log('Final Cycle Test Graph State:');
  console.log('Node A parent:', docCycleA.parentOrgId);
  console.log('Node B parent:', docCycleB.parentOrgId);

  const isCycle = docCycleA.parentOrgId === 'org-tx-cycle-b' && docCycleB.parentOrgId === 'org-tx-cycle-a';
  console.log('Cycle formed?', isCycle ? 'YES (VULNERABLE)' : 'NO (SECURE!)');

  await client.close();
}

main().catch(console.error);
