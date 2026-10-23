import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDatabaseName, getDb, closeDb } from '../../server/db.js';

describe('i2A SchoolOS — Master Prompt 02: Database Safety Pre-Flight & Fail-Closed Gate', () => {
  const originalVitest = process.env.VITEST;
  const originalNodeEnv = process.env.NODE_ENV;
  const originalTestDbName = process.env.TEST_DB_NAME;
  const originalDbName = process.env.DB_NAME;

  beforeEach(() => {
    // Reset to clean test state
    process.env.VITEST = 'true';
    process.env.NODE_ENV = 'test';
    process.env.TEST_DB_NAME = 'i2a_schoolos_synthetic_test';
    process.env.DB_NAME = 'i2a_schoolos';
  });

  afterEach(async () => {
    process.env.VITEST = originalVitest;
    process.env.NODE_ENV = originalNodeEnv;
    process.env.TEST_DB_NAME = originalTestDbName;
    process.env.DB_NAME = originalDbName;
    await closeDb();
  });

  it('Safety Check 1: Fails closed when TEST_DB_NAME is missing in test environment', () => {
    delete process.env.TEST_DB_NAME;

    expect(() => getDatabaseName()).toThrowError(/DATABASE_SAFETY_VIOLATION.*TEST_DB_NAME is not configured/);
  });

  it('Safety Check 2: Fails closed when TEST_DB_NAME is identical to the application DB (i2a_schoolos)', () => {
    process.env.TEST_DB_NAME = 'i2a_schoolos';
    process.env.DB_NAME = 'i2a_schoolos';

    expect(() => getDatabaseName()).toThrowError(/DATABASE_SAFETY_VIOLATION.*cannot be identical to the primary application database/);
  });

  it('Safety Check 3: Resolves correctly to isolated test database when TEST_DB_NAME is configured', () => {
    process.env.TEST_DB_NAME = 'i2a_schoolos_synthetic_test';
    process.env.DB_NAME = 'i2a_schoolos';

    const dbName = getDatabaseName();
    expect(dbName).toBe('i2a_schoolos_synthetic_test');
  });

  it('Safety Check 4: Non-test environment returns application database', () => {
    delete process.env.VITEST;
    process.env.NODE_ENV = 'development';
    process.env.DB_NAME = 'i2a_schoolos';

    const dbName = getDatabaseName();
    expect(dbName).toBe('i2a_schoolos');
  });

  it('Safety Check 5: Live getDb() in test environment connects strictly to test database', async () => {
    process.env.TEST_DB_NAME = 'i2a_schoolos_synthetic_test';
    const db = await getDb();
    expect(db).toBeDefined();
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');
    expect(db.databaseName).not.toBe('i2a_schoolos');
  });

  it('Safety Check 6: Primary application database (i2a_schoolos) is protected and isolated from test execution', async () => {
    // Fail-closed verification: active test db is strictly isolated from production DB name
    const db = await getDb();
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');
    expect(db.databaseName).not.toBe('i2a_schoolos');

    // Explicitly test that attempting to target production database in test mode fails closed
    process.env.TEST_DB_NAME = 'i2a_schoolos';
    expect(() => getDatabaseName()).toThrowError(/DATABASE_SAFETY_VIOLATION.*cannot be identical to the primary application database/);
  });

  it('Safety Check 7: Synthetic test database fixtures contain dummy contact numbers and synthetic markers', async () => {
    process.env.TEST_DB_NAME = 'i2a_schoolos_synthetic_test';
    const db = await getDb();

    const tenant = await db.collection('tenants').findOne({ id: 'I2A-SCH-000001' });
    expect(tenant).toBeDefined();
    expect(tenant?.adminPhone).toContain('+91 99999');
    expect(tenant?.name).toContain('(Synthetic Test)');

    const student = await db.collection('students').findOne({ id: 'std-101' });
    expect(student).toBeDefined();
    expect(student?.parentMobile).toContain('+91 99999');
    expect(student?.name).toContain('(Synthetic Student)');
  });

  it('Safety Check 8: Fails closed when TEST_DB_NAME is set to quarantined database i2a_schoolos_test', () => {
    process.env.TEST_DB_NAME = 'i2a_schoolos_test';
    expect(() => getDatabaseName()).toThrowError(/DATABASE_SAFETY_VIOLATION.*quarantined/);
  });

  it('Safety Check 9: Fails closed when DB_NAME is set to quarantined database i2a_schoolos_test in non-test mode', () => {
    delete process.env.VITEST;
    process.env.NODE_ENV = 'development';
    process.env.DB_NAME = 'i2a_schoolos_test';
    expect(() => getDatabaseName()).toThrowError(/DATABASE_SAFETY_VIOLATION.*quarantined/);
  });
});
