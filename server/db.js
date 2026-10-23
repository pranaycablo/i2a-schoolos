import { MongoClient } from 'mongodb';

export function getMongoUri() {
  return process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
}

export function getDatabaseName() {
  const isTest = Boolean(process.env.VITEST || process.env.NODE_ENV === 'test');
  if (isTest) {
    const testDb = process.env.TEST_DB_NAME;
    if (!testDb) {
      throw new Error(
        '[DATABASE_SAFETY_VIOLATION] Test environment detected but TEST_DB_NAME is not configured. Silently falling back to the application database is prohibited to prevent data corruption.'
      );
    }
    const appDb = process.env.DB_NAME || 'i2a_schoolos';
    if (testDb === appDb) {
      throw new Error(
        `[DATABASE_SAFETY_VIOLATION] TEST_DB_NAME ('${testDb}') cannot be identical to the primary application database ('${appDb}'). A dedicated isolated test database is required.`
      );
    }
    if (testDb === 'i2a_schoolos_test') {
      throw new Error(
        "[DATABASE_SAFETY_VIOLATION] Target database 'i2a_schoolos_test' is strictly quarantined. Connection prohibited."
      );
    }
    return testDb;
  }
  const configuredDb = process.env.DB_NAME || 'i2a_schoolos';
  if (configuredDb === 'i2a_schoolos_test') {
    throw new Error(
      "[DATABASE_SAFETY_VIOLATION] Target database 'i2a_schoolos_test' is strictly quarantined. Connection prohibited."
    );
  }
  return configuredDb;
}

let client = null;
let db = null;

export async function getDb() {
  if (!db) {
    const activeDbName = getDatabaseName();
    const uri = getMongoUri();
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000
    });
    await client.connect();
    db = client.db(activeDbName);
    console.log(`🗄️ [MongoDB] Connected to database: "${activeDbName}" at ${uri}`);
    const isProdDatabase = activeDbName === 'i2a_schoolos';
    const isExplicitlyAuthorized = process.env.ALLOW_PROD_INDEX_INIT === 'true';

    if (!isProdDatabase || isExplicitlyAuthorized) {
      await initializeIndexes(db);
    } else {
      console.log('ℹ️ [MongoDB] Index initialization skipped on protected database i2a_schoolos. Prohibited without ALLOW_PROD_INDEX_INIT=true.');
    }
  }
  return db;
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

export async function checkDbHealth() {
  try {
    const database = await getDb();
    const stats = await database.command({ ping: 1 });
    return { ok: true, stats };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

export async function initializeIndexes(database) {
  try {
    // 1. Users collection
    await database.collection('users').createIndex({ email: 1 }, { unique: true, sparse: true });
    await database.collection('users').createIndex({ schoolId: 1, role: 1 });

    // 2. Tenants collection
    await database.collection('tenants').createIndex({ id: 1 }, { unique: true });
    await database.collection('tenants').createIndex({ code: 1 });

    // 3. Students collection
    await database.collection('students').createIndex({ id: 1 }, { unique: true });
    await database.collection('students').createIndex({ schoolId: 1, admissionNo: 1 });
    await database.collection('students').createIndex({ schoolId: 1, className: 1, section: 1 });

    // 4. Admissions collection
    await database.collection('admissions').createIndex({ id: 1 }, { unique: true });
    await database.collection('admissions').createIndex({ schoolId: 1, applicationNo: 1 });

    // 5. Attendance collection
    await database.collection('attendance').createIndex({ id: 1 }, { unique: true });
    await database.collection('attendance').createIndex({ schoolId: 1, date: 1, entityId: 1 });
    await database.collection('attendance').createIndex({ schoolId: 1, className: 1, section: 1, date: 1 });
    await database.collection('attendance_locks').createIndex({ id: 1 }, { unique: true, sparse: true });
    await database.collection('attendance_locks').createIndex({ schoolId: 1, date: 1, className: 1 }, { unique: true });

    // 6. Timetables collection
    await database.collection('timetables').createIndex({ id: 1 }, { unique: true });
    await database.collection('timetables').createIndex({ schoolId: 1, classId: 1, day: 1 });

    // 7. Homework & Submissions
    await database.collection('homework').createIndex({ id: 1 }, { unique: true });
    await database.collection('homework').createIndex({ schoolId: 1, className: 1 });
    await database.collection('homework_submissions').createIndex({ id: 1 }, { unique: true });
    await database.collection('homework_submissions').createIndex({ schoolId: 1, homeworkId: 1, studentId: 1 });

    // 8. Fees & Receipts
    await database.collection('fee_types').createIndex({ id: 1 }, { unique: true });
    await database.collection('fee_receipts').createIndex({ id: 1 }, { unique: true });
    await database.collection('fee_receipts').createIndex({ schoolId: 1, receiptNo: 1 });
    await database.collection('fee_receipts').createIndex(
      { schoolId: 1, idempotencyKey: 1 },
      { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } }
    );

    // 9. Marketplace
    await database.collection('marketplace_products').createIndex({ id: 1 }, { unique: true });
    await database.collection('marketplace_orders').createIndex({ id: 1 }, { unique: true });
    await database.collection('marketplace_orders').createIndex({ schoolId: 1, idempotencyKey: 1 });

    // 10. Notifications & Audit Logs
    await database.collection('notifications').createIndex({ id: 1 }, { unique: true });
    await database.collection('notifications').createIndex({ schoolId: 1, recipientEmail: 1 });
    await database.collection('audit_logs').createIndex({ id: 1 }, { unique: true });
    await database.collection('audit_logs').createIndex({ schoolId: 1, timestamp: -1 });

    // 11. Password Resets (with TTL index for auto-cleanup after 10 minutes)
    await database.collection('password_resets').createIndex({ createdAt: 1 }, { expireAfterSeconds: 600 });
    await database.collection('password_resets').createIndex({ email: 1 });

    // 12. Organization Hierarchy & Multi-Branch indexes
    await database.collection('organizations').createIndex({ id: 1 }, { unique: true });
    await database.collection('organizations').createIndex({ orgCode: 1 }, { unique: true, sparse: true });
    await database.collection('organizations').createIndex({ parentOrgId: 1 });
    await database.collection('tenants').createIndex({ orgId: 1 });
    await database.collection('hierarchy_locks').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 60 });

    // 13. Academic Masters & Progression indexes
    await database.collection('academic_sessions').createIndex({ id: 1 }, { unique: true });
    await database.collection('academic_sessions').createIndex({ schoolId: 1, sessionName: 1 }, { unique: true });
    await database.collection('classes').createIndex({ id: 1 }, { unique: true });
    await database.collection('classes').createIndex({ schoolId: 1, name: 1 });
    await database.collection('sections').createIndex({ id: 1 }, { unique: true });
    await database.collection('sections').createIndex({ schoolId: 1, classId: 1, name: 1 });

    // 14. Student Enrollments & Multi-Guardian Links
    await database.collection('student_enrollments').createIndex({ id: 1 }, { unique: true });
    await database.collection('student_enrollments').createIndex(
      { schoolId: 1, studentId: 1, academicSessionId: 1 },
      { unique: true }
    );
    await database.collection('guardian_relationships').createIndex({ id: 1 }, { unique: true });
    await database.collection('guardian_relationships').createIndex(
      { schoolId: 1, studentId: 1, guardianUserId: 1 },
      { unique: true }
    );
    await database.collection('guardian_relationships').createIndex({ guardianUserId: 1 });

    // 15. Institution Applications & Category CMS (Synthetic Test / Non-Prod only)
    await database.collection('institution_categories').createIndex({ slug: 1 }, { unique: true });
    await database.collection('school_applications').createIndex({ id: 1 }, { unique: true });
    await database.collection('school_applications').createIndex({ applicationNo: 1 }, { unique: true });
    // Deduplicate any leftover synthetic test artifacts before creating partial unique index
    const pendingDups = await database.collection('school_applications').aggregate([
      { $match: { status: 'PENDING_VERIFICATION', adminEmail: { $exists: true } } },
      { $group: { _id: '$adminEmail', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    for (const dup of pendingDups) {
      const idsToDelete = dup.ids.slice(0, -1);
      await database.collection('school_applications').deleteMany({ _id: { $in: idsToDelete } });
    }

    await database.collection('school_applications').createIndex(
      { adminEmail: 1 },
      {
        unique: true,
        partialFilterExpression: { status: 'PENDING_VERIFICATION' }
      }
    );

    // 16. Staff Workforce & Permission Administration indexes
    await database.collection('staff').createIndex({ id: 1 }, { unique: true });
    await database.collection('staff').createIndex({ schoolId: 1, employeeId: 1 }, { unique: true });
    await database.collection('staff').createIndex({ schoolId: 1, email: 1 }, { unique: true });
    await database.collection('staff').createIndex({ schoolId: 1, status: 1 });
    await database.collection('staff').createIndex({ schoolId: 1, department: 1 });
    await database.collection('staff').createIndex({ schoolId: 1, primaryBranchId: 1 });
    await database.collection('staff').createIndex({ schoolId: 1, biometricId: 1 }, { sparse: true });
    await database.collection('leave_requests').createIndex({ id: 1 }, { unique: true });
    await database.collection('leave_requests').createIndex({ schoolId: 1, staffId: 1 });
    await database.collection('leave_requests').createIndex({ schoolId: 1, status: 1 });

    console.log('✅ [MongoDB] Essential collection indexes verified.');
  } catch (err) {
    console.warn('⚠️ [MongoDB] Index initialization notice:', err.message);
  }
}
