import { getDb, closeDb } from '../server/db.js';

async function restore() {
  process.env.VITEST = 'true';
  process.env.TEST_DB_NAME = 'i2a_schoolos_synthetic_test';
  const db = await getDb();
  await db.collection('tenants').updateOne(
    { id: 'I2A-SCH-000002' },
    { $set: { orgId: null } }
  );
  await db.collection('tenants').updateOne(
    { id: 'I2A-SCH-000003' },
    { $set: { orgId: 'org-synth-dps' } }
  );
  console.log('✅ Restored I2A-SCH-000002 to orgId: null and I2A-SCH-000003 to orgId: org-synth-dps.');
  await closeDb();
}

restore().catch(console.error);
