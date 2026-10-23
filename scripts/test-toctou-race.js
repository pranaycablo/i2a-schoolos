import { MongoClient } from 'mongodb';

async function main() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  const db = client.db('i2a_schoolos_synthetic_test');
  
  // Clean up test orgs
  await db.collection('organizations').deleteMany({ id: { $regex: '^org-toctou-' } });
  await db.collection('hierarchy_locks').deleteMany({ _id: 'hierarchy_graph_mutex' });

  // Create test orgs
  await db.collection('organizations').insertMany([
    { id: 'org-toctou-child', version: 1, parentOrgId: null, lastFencingToken: 50 },
    { id: 'org-toctou-parent-a', version: 1, parentOrgId: null, lastFencingToken: 50 },
    { id: 'org-toctou-parent-b', version: 1, parentOrgId: null, lastFencingToken: 50 }
  ]);

  console.log('========================================================');
  console.log('TEST A: LEASE CHECK TO WRITE TOCTOU RACE (Worker A writes first)');
  console.log('========================================================');
  
  // Step 1: Worker A acquires lock with fencing token 100
  const tokenA = 100;
  const ownerA = 'worker-A-nonce';
  const nowA = new Date();
  const expiresA = new Date(nowA.getTime() + 100); // short lease 100ms
  await db.collection('hierarchy_locks').insertOne({
    _id: 'hierarchy_graph_mutex',
    locked: true,
    owner: ownerA,
    fencingToken: tokenA,
    lockedAt: nowA,
    expiresAt: expiresA
  });
  console.log('1. Worker A acquired lock with token 100, lease 100ms');

  // Step 2: Worker A passes lease check
  const leaseCheckA = await db.collection('hierarchy_locks').findOne({
    _id: 'hierarchy_graph_mutex',
    owner: ownerA,
    expiresAt: { $gt: new Date() }
  });
  console.log('2. Worker A lease check passed:', !!leaseCheckA);

  // Step 3: Worker A pauses; lease expires
  console.log('3. Pausing Worker A; waiting 150ms for lease to expire...');
  await new Promise(r => setTimeout(r, 150));

  // Step 4: Worker B acquires lock with fencing token 101
  const tokenB = 101;
  const ownerB = 'worker-B-nonce';
  const nowB = new Date();
  const expiresB = new Date(nowB.getTime() + 5000);
  const stolen = await db.collection('hierarchy_locks').findOneAndUpdate(
    { _id: 'hierarchy_graph_mutex', expiresAt: { $lt: nowB } },
    { $set: { locked: true, owner: ownerB, fencingToken: tokenB, lockedAt: nowB, expiresAt: expiresB } },
    { returnDocument: 'after' }
  );
  console.log('4. Worker B stole expired lock:', !!stolen, 'Token B:', tokenB);

  // Step 5: Worker B is paused at barrier before writing!
  // Step 6: Worker A resumes and executes its updateOne!
  const childDocBeforeA = await db.collection('organizations').findOne({ id: 'org-toctou-child' });
  console.log('5. Child state before Worker A write:', {
    version: childDocBeforeA.version,
    lastFencingToken: childDocBeforeA.lastFencingToken,
    parentOrgId: childDocBeforeA.parentOrgId
  });

  const resultA = await db.collection('organizations').updateOne(
    {
      id: 'org-toctou-child',
      version: childDocBeforeA.version,
      $or: [
        { lastFencingToken: { $exists: false } },
        { lastFencingToken: { $lt: tokenA } }
      ]
    },
    {
      $set: {
        parentOrgId: 'org-toctou-parent-a',
        updatedAt: new Date().toISOString(),
        lastFencingToken: tokenA
      },
      $inc: { version: 1 }
    }
  );
  console.log('6. Worker A updateOne execution result:', {
    matchedCount: resultA.matchedCount,
    modifiedCount: resultA.modifiedCount,
    acknowledged: resultA.acknowledged
  });

  // Step 7: Worker B now executes its updateOne!
  // Note: Worker B had read version 1 earlier before its barrier!
  const resultB = await db.collection('organizations').updateOne(
    {
      id: 'org-toctou-child',
      version: 1, // Worker B read version 1 when it acquired lock
      $or: [
        { lastFencingToken: { $exists: false } },
        { lastFencingToken: { $lt: tokenB } }
      ]
    },
    {
      $set: {
        parentOrgId: 'org-toctou-parent-b',
        updatedAt: new Date().toISOString(),
        lastFencingToken: tokenB
      },
      $inc: { version: 1 }
    }
  );
  console.log('7. Worker B updateOne execution result:', {
    matchedCount: resultB.matchedCount,
    modifiedCount: resultB.modifiedCount,
    acknowledged: resultB.acknowledged
  });

  // Final document state
  const finalDocA = await db.collection('organizations').findOne({ id: 'org-toctou-child' });
  console.log('8. Final child document state after Test A:', {
    id: finalDocA.id,
    version: finalDocA.version,
    parentOrgId: finalDocA.parentOrgId,
    lastFencingToken: finalDocA.lastFencingToken
  });

  console.log('\n========================================================');
  console.log('TEST B: NEW WORKER WRITES FIRST, THEN STALE WORKER WRITES');
  console.log('========================================================');

  // Reset document
  await db.collection('organizations').updateOne(
    { id: 'org-toctou-child' },
    { $set: { version: 1, parentOrgId: null, lastFencingToken: 50 } }
  );

  // Worker A acquires lock with token 100, passes check, pauses
  // Worker A lease expires, Worker B acquires lock with token 101
  // Worker B writes FIRST!
  const resultB_TestB = await db.collection('organizations').updateOne(
    {
      id: 'org-toctou-child',
      version: 1,
      $or: [
        { lastFencingToken: { $exists: false } },
        { lastFencingToken: { $lt: tokenB } }
      ]
    },
    {
      $set: {
        parentOrgId: 'org-toctou-parent-b',
        updatedAt: new Date().toISOString(),
        lastFencingToken: tokenB
      },
      $inc: { version: 1 }
    }
  );
  console.log('Worker B (new worker) write result:', {
    matchedCount: resultB_TestB.matchedCount,
    modifiedCount: resultB_TestB.modifiedCount
  });

  // Now Worker A resumes and attempts to write with token 100 and expected version 1
  const resultA_TestB = await db.collection('organizations').updateOne(
    {
      id: 'org-toctou-child',
      version: 1, // Worker A expects version 1
      $or: [
        { lastFencingToken: { $exists: false } },
        { lastFencingToken: { $lt: tokenA } } // tokenA is 100, but doc has 101!
      ]
    },
    {
      $set: {
        parentOrgId: 'org-toctou-parent-a',
        updatedAt: new Date().toISOString(),
        lastFencingToken: tokenA
      },
      $inc: { version: 1 }
    }
  );
  console.log('Worker A (stale worker) write result:', {
    matchedCount: resultA_TestB.matchedCount,
    modifiedCount: resultA_TestB.modifiedCount
  });

  const finalDocB = await db.collection('organizations').findOne({ id: 'org-toctou-child' });
  console.log('Final child document state after Test B:', {
    id: finalDocB.id,
    version: finalDocB.version,
    parentOrgId: finalDocB.parentOrgId,
    lastFencingToken: finalDocB.lastFencingToken
  });

  console.log('\n========================================================');
  console.log('TEST C-RACE: TWO-NODE CYCLE FORMATION VIA TOCTOU RACE');
  console.log('========================================================');

  // Clear locks before Test C
  await db.collection('hierarchy_locks').deleteMany({ _id: 'hierarchy_graph_mutex' });

  // Insert two independent nodes A and B
  await db.collection('organizations').insertMany([
    { id: 'org-toctou-cycle-a', version: 1, parentOrgId: null, lastFencingToken: 10 },
    { id: 'org-toctou-cycle-b', version: 1, parentOrgId: null, lastFencingToken: 10 }
  ]);

  // Worker 1 wants to set A -> B
  // Acquires lock token 200, checks cycle (no cycle), passes lease check, PAUSES...
  const token1 = 200;
  const owner1 = 'worker-1-nonce';
  const now1 = new Date();
  await db.collection('hierarchy_locks').insertOne({
    _id: 'hierarchy_graph_mutex',
    locked: true,
    owner: owner1,
    fencingToken: token1,
    lockedAt: now1,
    expiresAt: new Date(now1.getTime() + 100) // expires in 100ms
  });

  // Wait 150ms for Worker 1 lease to expire
  await new Promise(r => setTimeout(r, 150));

  // Worker 2 wants to set B -> A
  // Worker 2 steals lock with token 201
  const token2 = 201;
  const owner2 = 'worker-2-nonce';
  const now2 = new Date();
  await db.collection('hierarchy_locks').findOneAndUpdate(
    { _id: 'hierarchy_graph_mutex', expiresAt: { $lt: now2 } },
    { $set: { locked: true, owner: owner2, fencingToken: token2, lockedAt: now2, expiresAt: new Date(now2.getTime() + 5000) } }
  );

  // Worker 2 checks cycle for B -> A: At this moment A.parentOrgId is STILL null!
  // Worker 2 determines: NO CYCLE! Safe to proceed!
  // Worker 2 pauses at barrier before writing...

  // Worker 1 resumes! Worker 1 executes its updateOne on Node A:
  const resA = await db.collection('organizations').updateOne(
    {
      id: 'org-toctou-cycle-a',
      version: 1,
      $or: [{ lastFencingToken: { $exists: false } }, { lastFencingToken: { $lt: token1 } }]
    },
    {
      $set: { parentOrgId: 'org-toctou-cycle-b', lastFencingToken: token1 },
      $inc: { version: 1 }
    }
  );
  console.log('Worker 1 (stale, token 200) write to Node A (A -> B): matchedCount =', resA.matchedCount);

  // Worker 2 resumes! Worker 2 executes its updateOne on Node B:
  const resB = await db.collection('organizations').updateOne(
    {
      id: 'org-toctou-cycle-b',
      version: 1,
      $or: [{ lastFencingToken: { $exists: false } }, { lastFencingToken: { $lt: token2 } }]
    },
    {
      $set: { parentOrgId: 'org-toctou-cycle-a', lastFencingToken: token2 },
      $inc: { version: 1 }
    }
  );
  console.log('Worker 2 (new, token 201) write to Node B (B -> A): matchedCount =', resB.matchedCount);

  const docCycleA = await db.collection('organizations').findOne({ id: 'org-toctou-cycle-a' });
  const docCycleB = await db.collection('organizations').findOne({ id: 'org-toctou-cycle-b' });
  console.log('Graph state: Node A parent =', docCycleA.parentOrgId, ', Node B parent =', docCycleB.parentOrgId);

  if (docCycleA.parentOrgId === 'org-toctou-cycle-b' && docCycleB.parentOrgId === 'org-toctou-cycle-a') {
    console.log('>>> VULNERABILITY CONFIRMED: CIRCULAR GRAPH A <-> B FORMED UNDER TOCTOU RACE! <<<');
  }

  // Clean up
  await db.collection('organizations').deleteMany({ id: { $regex: '^org-toctou-' } });
  await db.collection('hierarchy_locks').deleteMany({ _id: 'hierarchy_graph_mutex' });
  await client.close();
}

main().catch(console.error);
