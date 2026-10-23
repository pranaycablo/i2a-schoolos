import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import crypto from 'crypto';
import { app } from '../../server/index.js';
import { getDb, closeDb } from '../../server/db.js';

describe('i2A SchoolOS — Master Prompt 01B: Attendance Lock & Multi-Tenant Regression Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  let principalTokenSchoolA = '';
  let teacherTokenSchoolA = '';
  let superAdminToken = '';

  const schoolA = 'I2A-SCH-000001';
  const schoolB = 'I2A-SCH-000002';

  // Global test run tag for absolute fixture isolation
  const TEST_RUN_TAG = `reg_${Date.now().toString(36)}_${crypto.randomBytes(4).toString('hex')}`;
  const TEST_RUN_ID = TEST_RUN_TAG;

  // Track created fixtures for exact primary key cleanup
  const createdLockIds: string[] = [];
  const createdAttendanceIds: string[] = [];

  beforeAll(async () => {
    // 1. Verify DB connection
    const db = await getDb();
    expect(db).toBeDefined();

    // 2. Start HTTP server on dynamic port
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as { port: number; address: string };
        baseUrl = `http://127.0.0.1:${address.port}/api`;
        resolve();
      });
    });

    // 3. Authenticate required roles
    // School A Principal
    const princRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'principal@abcpublicschool.edu.in', password: 'Principal@2026#' })
    });
    const princData = await princRes.json();
    expect(princRes.status).toBe(200);
    principalTokenSchoolA = princData.token;

    // School A Teacher
    const teachRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sunita.mishra@abcpublicschool.edu.in', password: 'Teacher@2026#' })
    });
    const teachData = await teachRes.json();
    expect(teachRes.status).toBe(200);
    teacherTokenSchoolA = teachData.token;

    // Super Admin (Platform Authority)
    const saRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@i2aschoolos.com', password: 'SuperAdmin@2026#' })
    });
    const saData = await saRes.json();
    expect(saRes.status).toBe(200);
    superAdminToken = saData.token;
  });

  afterAll(async () => {
    // Exact primary key teardown: delete only records generated during this test run
    const db = await getDb();
    for (const lockId of createdLockIds) {
      await db.collection('attendance_locks').deleteOne({ id: lockId });
    }
    for (const attId of createdAttendanceIds) {
      await db.collection('attendance').deleteOne({ id: attId });
    }

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closeDb();
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 1: School-wide 'ALL' lock blocks class-level attendance marking
  // ---------------------------------------------------------------------------
  it('Scenario 1: School-wide ALL lock cannot be bypassed by submitting class-specific request', async () => {
    const testDate = `2099-10-${crypto.randomInt(100000, 999999)}`;
    const lockId = `lock-${schoolA}-${testDate}-ALL`;
    createdLockIds.push(lockId);

    // Step 1: Principal locks school-wide for this date
    const lockRes = await fetch(`${baseUrl}/attendance/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenSchoolA}`
      },
      body: JSON.stringify({
        date: testDate,
        className: 'ALL',
        isLocked: true,
        reason: 'Holiday Freeze'
      })
    });
    expect(lockRes.status).toBe(200);
    const lockData = await lockRes.json();
    expect(lockData.success).toBe(true);
    expect(lockData.lock?.id).toBe(lockId);

    // Step 2: Teacher attempts to mark attendance for a specific class (Class IX-A)
    const markRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherTokenSchoolA}`
      },
      body: JSON.stringify({
        date: testDate,
        className: 'Class IX',
        section: 'A',
        attendanceList: [{ entityId: 'std-101', status: 'PRESENT' }]
      })
    });

    expect(markRes.status).toBe(403);
    const markData = await markRes.json();
    expect(markData.code).toBe('ATTENDANCE_LOCKED');
    expect(markData.error).toContain('is locked');
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 2: Class-specific lock blocks marking for that specific class
  // ---------------------------------------------------------------------------
  it('Scenario 2: Class-specific lock blocks marking for the locked class', async () => {
    const testDate = `2099-10-${crypto.randomInt(100000, 999999)}`;
    const targetClass = 'Class X';
    const lockId = `lock-${schoolA}-${testDate}-${targetClass}`;
    createdLockIds.push(lockId);

    // Principal locks specifically Class X
    const lockRes = await fetch(`${baseUrl}/attendance/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenSchoolA}`
      },
      body: JSON.stringify({
        date: testDate,
        className: targetClass,
        isLocked: true,
        reason: 'Term Assessment Freeze'
      })
    });
    expect(lockRes.status).toBe(200);

    // Teacher attempts to mark Class X
    const markRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherTokenSchoolA}`
      },
      body: JSON.stringify({
        date: testDate,
        className: targetClass,
        section: 'B',
        attendanceList: [{ entityId: 'std-102', status: 'PRESENT' }]
      })
    });

    expect(markRes.status).toBe(403);
    const markData = await markRes.json();
    expect(markData.code).toBe('ATTENDANCE_LOCKED');
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 3: Class-specific lock does NOT block an unrelated class
  // ---------------------------------------------------------------------------
  it('Scenario 3: Class-specific lock does NOT block an unrelated class on the same date', async () => {
    const testDate = `2099-10-${crypto.randomInt(100000, 999999)}`;
    const lockedClass = 'Class VI';
    const activeClass = 'Class VII';
    const lockId = `lock-${schoolA}-${testDate}-${lockedClass}`;
    const attId = `att_${TEST_RUN_ID}_sc3`;
    createdLockIds.push(lockId);
    createdAttendanceIds.push(attId);

    // Step 1: Principal locks Class VI
    const lockRes = await fetch(`${baseUrl}/attendance/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenSchoolA}`
      },
      body: JSON.stringify({
        date: testDate,
        className: lockedClass,
        isLocked: true
      })
    });
    expect(lockRes.status).toBe(200);

    // Step 2: Teacher marks attendance for Class VII (unrelated class)
    const markRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherTokenSchoolA}`
      },
      body: JSON.stringify({
        date: testDate,
        className: activeClass,
        section: 'A',
        attendanceList: [{ id: attId, entityId: 'std-103', status: 'PRESENT' }]
      })
    });

    // Unrelated class must succeed with 200
    expect(markRes.status).toBe(200);
    const markData = await markRes.json();
    expect(markData.success).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 4: School A's lock does NOT affect School B (tenant isolation)
  // ---------------------------------------------------------------------------
  it('Scenario 4: School A lock does NOT affect School B attendance on the same date', async () => {
    const testDate = `2099-10-${crypto.randomInt(100000, 999999)}`;
    const lockId = `lock-${schoolA}-${testDate}-ALL`;
    const attId = `att_${TEST_RUN_ID}_sc4_schB`;
    createdLockIds.push(lockId);
    createdAttendanceIds.push(attId);

    // Step 1: School A principal locks School A campus-wide
    const lockRes = await fetch(`${baseUrl}/attendance/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenSchoolA}`
      },
      body: JSON.stringify({
        date: testDate,
        className: 'ALL',
        isLocked: true
      })
    });
    expect(lockRes.status).toBe(200);

    // Step 2: Mark attendance for School B using Super Admin authority
    const markSchoolBRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        schoolId: schoolB,
        date: testDate,
        className: 'Class VIII',
        section: 'A',
        attendanceList: [{ id: attId, entityId: 'std-201', status: 'PRESENT' }]
      })
    });

    // School B must NOT be blocked by School A's lock
    expect(markSchoolBRes.status).toBe(200);
    const data = await markSchoolBRes.json();
    expect(data.success).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 5: Unauthorized user cannot lock or unlock attendance
  // ---------------------------------------------------------------------------
  it('Scenario 5: Non-administrative role (Teacher) cannot lock attendance', async () => {
    const testDate = `2099-10-${crypto.randomInt(100000, 999999)}`;

    // Teacher tries to lock attendance
    const lockRes = await fetch(`${baseUrl}/attendance/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherTokenSchoolA}`
      },
      body: JSON.stringify({
        date: testDate,
        className: 'Class VIII',
        isLocked: true
      })
    });

    expect(lockRes.status).toBe(403);
    const data = await lockRes.json();
    expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 6: Authorized Principal can lock and unlock attendance (Unlock restoration)
  // ---------------------------------------------------------------------------
  it('Scenario 6: Principal can lock and subsequently unlock attendance, restoring mark capability', async () => {
    const testDate = `2099-10-${crypto.randomInt(100000, 999999)}`;
    const targetClass = 'Class XII';
    const lockId = `lock-${schoolA}-${testDate}-${targetClass}`;
    const attId = `att_${TEST_RUN_ID}_sc6`;
    createdLockIds.push(lockId);
    createdAttendanceIds.push(attId);

    // 1. Lock
    const lockRes = await fetch(`${baseUrl}/attendance/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenSchoolA}`
      },
      body: JSON.stringify({ date: testDate, className: targetClass, isLocked: true })
    });
    expect(lockRes.status).toBe(200);

    // 2. Marking is blocked
    const blockedRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherTokenSchoolA}`
      },
      body: JSON.stringify({
        date: testDate,
        className: targetClass,
        attendanceList: [{ entityId: 'std-101', status: 'PRESENT' }]
      })
    });
    expect(blockedRes.status).toBe(403);

    // 3. Unlock
    const unlockRes = await fetch(`${baseUrl}/attendance/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenSchoolA}`
      },
      body: JSON.stringify({ date: testDate, className: targetClass, isLocked: false })
    });
    expect(unlockRes.status).toBe(200);
    const unlockData = await unlockRes.json();
    expect(unlockData.lock?.isLocked).toBe(false);

    // 4. Marking now succeeds
    const successRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherTokenSchoolA}`
      },
      body: JSON.stringify({
        date: testDate,
        className: targetClass,
        attendanceList: [{ id: attId, entityId: 'std-101', status: 'PRESENT' }]
      })
    });
    expect(successRes.status).toBe(200);
    const successData = await successRes.json();
    expect(successData.success).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 7: Invalid requests are rejected & duplicate lock requests are idempotent
  // ---------------------------------------------------------------------------
  it('Scenario 7: Rejects request missing date and handles duplicate lock calls idempotently', async () => {
    // Missing date -> 400 Bad Request
    const badRes = await fetch(`${baseUrl}/attendance/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenSchoolA}`
      },
      body: JSON.stringify({ className: 'Class VIII', isLocked: true })
    });
    expect(badRes.status).toBe(400);
    const badData = await badRes.json();
    expect(badData.error).toContain('Date is required');

    // Duplicate lock calls -> Idempotent 200 OK
    const testDate = `2099-10-${crypto.randomInt(100000, 999999)}`;
    const lockId = `lock-${schoolA}-${testDate}-Class VIII`;
    createdLockIds.push(lockId);

    const call1 = await fetch(`${baseUrl}/attendance/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenSchoolA}`
      },
      body: JSON.stringify({ date: testDate, className: 'Class VIII', isLocked: true })
    });
    expect(call1.status).toBe(200);

    const call2 = await fetch(`${baseUrl}/attendance/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenSchoolA}`
      },
      body: JSON.stringify({ date: testDate, className: 'Class VIII', isLocked: true })
    });
    expect(call2.status).toBe(200);

    // Verify only 1 document exists in MongoDB for this exact lock key
    const db = await getDb();
    const count = await db.collection('attendance_locks').countDocuments({
      schoolId: schoolA,
      date: testDate,
      className: 'Class VIII'
    });
    expect(count).toBe(1);
  });
});
