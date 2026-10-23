import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import crypto from 'crypto';
import { app } from '../../server/index.js';
import { getDb, closeDb } from '../../server/db.js';

describe('i2A SchoolOS — Phase A Master Backend API & Database Persistence Integration Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  let superAdminToken = '';
  let principalToken = '';
  let teacherToken = '';
  let parentToken = '';
  let studentToken = '';

  const schoolA = 'I2A-SCH-000001';
  const schoolB = 'I2A-SCH-000002';

  beforeAll(async () => {
    // 1. Verify MongoDB connection
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

    // 3. Authenticate seed users to obtain verified JWT tokens
    const superAdminRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@i2aschoolos.com', password: 'SuperAdmin@2026#' })
    });
    const saData = await superAdminRes.json();
    expect(superAdminRes.status).toBe(200);
    expect(saData.token).toBeDefined();
    superAdminToken = saData.token;

    const principalRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'principal@abcpublicschool.edu.in', password: 'Principal@2026#' })
    });
    const princData = await principalRes.json();
    expect(principalRes.status).toBe(200);
    expect(princData.token).toBeDefined();
    principalToken = princData.token;

    const teacherRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sunita.mishra@abcpublicschool.edu.in', password: 'Teacher@2026#' })
    });
    const teachData = await teacherRes.json();
    expect(teacherRes.status).toBe(200);
    teacherToken = teachData.token;

    const parentRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sanjay.kumar@gmail.com', password: 'Parent@2026#' })
    });
    const parentData = await parentRes.json();
    expect(parentRes.status).toBe(200);
    parentToken = parentData.token;

    const studentRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul.kumar@abcpublicschool.edu.in', password: 'Student@2026#' })
    });
    const studentData = await studentRes.json();
    expect(studentRes.status).toBe(200);
    studentToken = studentData.token;
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closeDb();
  });

  // -------------------------------------------------------------------------
  // 1. Health Check & Live Database Connectivity
  // -------------------------------------------------------------------------
  it('1.1 Health Check: Server reports ONLINE with live MongoDB connectivity', async () => {
    const res = await fetch(`${baseUrl}/health`);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.status).toBe('ONLINE');
    expect(data.database).toBe('CONNECTED');
    expect(typeof data.uptimeSeconds).toBe('number');
  });

  // -------------------------------------------------------------------------
  // 2. Authentication & Authorization (RBAC) Security
  // -------------------------------------------------------------------------
  it('2.1 Auth Login: Rejects invalid password with 401', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'principal@abcpublicschool.edu.in', password: 'WrongPassword123!' })
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain('Invalid password');
  });

  it('2.2 Auth Session: GET /api/auth/me returns authenticated user identity and tenant', async () => {
    const res = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.user.role).toBe('PRINCIPAL');
    expect(data.user.schoolId).toBe(schoolA);
    expect(data.tenant.id).toBe(schoolA);
  });

  it('2.3 Auth Session: Rejects request missing Bearer token with 401', async () => {
    const res = await fetch(`${baseUrl}/auth/me`);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.code).toBe('AUTH_TOKEN_MISSING');
  });

  // -------------------------------------------------------------------------
  // 3. Multi-Tenant Isolation
  // -------------------------------------------------------------------------
  it('3.1 Tenant Isolation: Rejects cross-tenant access violation with 403', async () => {
    // School A principal attempts to query School B data
    const res = await fetch(`${baseUrl}/students?schoolId=${schoolB}`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.code).toBe('CROSS_TENANT_VIOLATION');
    expect(data.error).toContain('cannot access');
  });

  it('3.2 Super Admin Tenant Bypass: Super Admin can query any tenant', async () => {
    const res = await fetch(`${baseUrl}/students?schoolId=${schoolA}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data)).toBe(true);
  });

  it('3.3 Role Isolation: Rejects unauthorized role on restricted endpoint with 403', async () => {
    // Student attempts to create a new student
    const res = await fetch(`${baseUrl}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({ name: 'Unauthorized Student', className: 'Class VIII' })
    });
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  // -------------------------------------------------------------------------
  // 4. Password Reset & OTP Workflow
  // -------------------------------------------------------------------------
  it('4.1 Password Reset: Complete OTP lifecycle with single-use reset token and bcrypt hashing', async () => {
    const testEmail = 'office@abcpublicschool.edu.in'; // Staff user

    // Step 1: Request OTP
    const reqRes = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    expect(reqRes.status).toBe(200);
    const reqData = await reqRes.json();
    expect(reqData.success).toBe(true);
    expect(reqData.debugOtp).toBeDefined(); // Provided in non-production
    const otp = reqData.debugOtp;

    // Step 2: Rate limit verification — immediate second request must be rejected with 429
    const spamRes = await fetch(`${baseUrl}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail })
    });
    expect(spamRes.status).toBe(429);

    // Step 3: Verify with invalid OTP -> decrements attempts
    const badVerify = await fetch(`${baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp: '000000' })
    });
    expect(badVerify.status).toBe(400);

    // Step 4: Verify with correct OTP -> returns single-use reset token
    const goodVerify = await fetch(`${baseUrl}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, otp })
    });
    expect(goodVerify.status).toBe(200);
    const verifyData = await goodVerify.json();
    expect(verifyData.resetToken).toBeDefined();
    const resetToken = verifyData.resetToken;

    // Step 5: Reset password
    const newPassword = 'StaffUpdated@2026#';
    const resetRes = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, resetToken, newPassword })
    });
    expect(resetRes.status).toBe(200);

    // Step 6: Verify login with new password
    const newLogin = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: newPassword })
    });
    expect(newLogin.status).toBe(200);

    // Step 7: Verify old resetToken cannot be reused (one-time token policy)
    const reuseRes = await fetch(`${baseUrl}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, resetToken, newPassword: 'AnotherPassword123!' })
    });
    expect(reuseRes.status).toBe(400);

    // Cleanup: Reset back to default password
    const db = await getDb();
    const { hashPassword } = await import('../../server/middleware/auth.js');
    const defaultHash = await hashPassword('Staff@2026#');
    await db.collection('users').updateOne({ email: testEmail }, { $set: { passwordHash: defaultHash } });
  });

  // -------------------------------------------------------------------------
  // -------------------------------------------------------------------------
  // 5. Database Persistence: Student SIS Lifecycle
  // -------------------------------------------------------------------------
  it('5.1 Student SIS: Persists new student to MongoDB and reads it back via API', async () => {
    const runTag = crypto.randomBytes(4).toString('hex');
    const studentPayload = {
      name: `Persistent Test Student ${runTag}`,
      className: 'Class VIII',
      section: 'A',
      gender: 'FEMALE',
      dob: '2012-09-15',
      fatherName: 'Test Father',
      parentEmail: `test.father.${runTag}@example.com`,
      parentMobile: '9876500001',
      address: 'Test Address Patna'
    };

    let createdId = '';
    const db = await getDb();

    try {
      // Create via API
      const createRes = await fetch(`${baseUrl}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalToken}`
        },
        body: JSON.stringify(studentPayload)
      });
      expect(createRes.status).toBe(201);
      const createdData = await createRes.json();
      expect(createdData.success).toBe(true);
      expect(createdData.student.id).toBeDefined();
      expect(createdData.student.schoolId).toBe(schoolA);
      createdId = createdData.student.id;

      // Read back via single GET
      const getRes = await fetch(`${baseUrl}/students/${createdId}`, {
        headers: { Authorization: `Bearer ${principalToken}` }
      });
      expect(getRes.status).toBe(200);
      const fetchedStudent = await getRes.json();
      expect(fetchedStudent.id).toBe(createdId);
      expect(fetchedStudent.name).toBe(studentPayload.name);

      // Verify directly in MongoDB database
      const dbDoc = await db.collection('students').findOne({ id: createdId });
      expect(dbDoc).toBeDefined();
      expect(dbDoc?.name).toBe(studentPayload.name);
    } finally {
      // Safe Teardown: Delete ONLY the exact student created by this test
      if (createdId) {
        await db.collection('students').deleteOne({ id: createdId });
      }
    }
  });

  // -------------------------------------------------------------------------
  // 6. Database Persistence: Attendance Marking & Lock Protection
  // -------------------------------------------------------------------------
  it('6.1 Attendance: Marks batch attendance, persists to MongoDB and rejects edits when locked', async () => {
    const runTag = crypto.randomBytes(4).toString('hex');
    const testDate = `2099-12-${crypto.randomInt(100000, 999999).toString()}`;
    const testClass = 'Class VIII';
    const testSection = 'A';
    const attId1 = `att_test_${runTag}_1`;
    const attId2 = `att_test_${runTag}_2`;
    const lockId = `lock-${schoolA}-${testDate}-${testClass}`;

    const db = await getDb();

    try {
      // Step 1: Mark attendance with explicit unique IDs
      const markRes = await fetch(`${baseUrl}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          date: testDate,
          className: testClass,
          section: testSection,
          entityType: 'STUDENT',
          attendanceList: [
            { id: attId1, entityId: 'std-101', entityName: 'Rahul Kumar', status: 'PRESENT' },
            { id: attId2, entityId: 'std-102', entityName: 'Ananya Sharma', status: 'ABSENT', remarks: 'Medical leave' }
          ]
        })
      });
      expect(markRes.status).toBe(200);

      // Step 2: Read back from API
      const listRes = await fetch(`${baseUrl}/attendance?date=${testDate}&className=${encodeURIComponent(testClass)}`, {
        headers: { Authorization: `Bearer ${principalToken}` }
      });
      expect(listRes.status).toBe(200);
      const records = await listRes.json();
      expect(records.length).toBeGreaterThanOrEqual(2);
      const std102 = records.find((r: any) => r.entityId === 'std-102');
      expect(std102.status).toBe('ABSENT');
      expect(std102.remarks).toBe('Medical leave');

      // Step 3: Lock attendance for this class and date
      const lockRes = await fetch(`${baseUrl}/attendance/lock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalToken}`
        },
        body: JSON.stringify({
          date: testDate,
          className: testClass,
          isLocked: true,
          reason: 'Daily attendance freeze'
        })
      });
      expect(lockRes.status).toBe(200);

      // Step 4: Attempting to mark attendance while locked must be rejected with 403
      const lockedMarkRes = await fetch(`${baseUrl}/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          date: testDate,
          className: testClass,
          section: testSection,
          attendanceList: [{ entityId: 'std-101', status: 'ABSENT' }]
        })
      });
      expect(lockedMarkRes.status).toBe(403);
      const lockedErr = await lockedMarkRes.json();
      expect(lockedErr.code).toBe('ATTENDANCE_LOCKED');
    } finally {
      // Safe Teardown: Delete ONLY the exact records created by this test run
      await db.collection('attendance_locks').deleteOne({ id: lockId });
      await db.collection('attendance').deleteOne({ id: attId1 });
      await db.collection('attendance').deleteOne({ id: attId2 });
    }
  });

  // -------------------------------------------------------------------------
  // 7. Database Persistence: Timetable Scheduling & Conflict Detection
  // -------------------------------------------------------------------------
  it('7.1 Timetable: Saves cell to MongoDB and rejects teacher double-booking with 409 Conflict', async () => {
    const cellId = `cell-${schoolA}-Class VIII-A-MONDAY-p1`;
    const db = await getDb();

    try {
      // Schedule teacher-1 for Class VIII-A on MONDAY Period 1
      const cell1 = {
        className: 'Class VIII',
        sectionName: 'A',
        day: 'MONDAY',
        periodId: 'p1',
        subjectName: 'Mathematics',
        teacherId: 'usr-005',
        teacherName: 'Mr. Vikram Singh'
      };

      const res1 = await fetch(`${baseUrl}/timetables/cells`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalToken}`
        },
        body: JSON.stringify(cell1)
      });
      expect(res1.status).toBe(200);

      // Attempt double-booking: Same teacher on MONDAY Period 1 for Class IX-B
      const conflictingCell = {
        className: 'Class IX',
        sectionName: 'B',
        day: 'MONDAY',
        periodId: 'p1',
        subjectName: 'Mathematics',
        teacherId: 'usr-005',
        teacherName: 'Mr. Vikram Singh'
      };

      const conflictRes = await fetch(`${baseUrl}/timetables/cells`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalToken}`
        },
        body: JSON.stringify(conflictingCell)
      });
      expect(conflictRes.status).toBe(409);
      const conflictData = await conflictRes.json();
      expect(conflictData.code).toBe('TEACHER_CONFLICT');
    } finally {
      // Safe Teardown: Clean up exact cell created during test
      await db.collection('timetables').deleteOne({ id: cellId });
    }
  });

  // -------------------------------------------------------------------------
  // 8. Financial Truth & Subscription Calculation
  // -------------------------------------------------------------------------
  it('8.1 Subscription Calculator: Absolute server financial source of truth with 40% discount cap', async () => {
    // Request calculation with 500 students, 3 years, and an excessive 60% promo discount request
    const calcRes = await fetch(`${baseUrl}/subscription/calculate-price`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'PROFESSIONAL',
        studentCount: 500,
        durationYears: 3,
        requestedDiscountPercent: 60
      })
    });

    expect(calcRes.status).toBe(200);
    const quote = await calcRes.json();
    expect(quote.planId).toBe('PROFESSIONAL');
    expect(quote.students).toBe(500);
    expect(quote.durationYears).toBe(3);
    // Even though 60% was requested, server strictly caps total discount at 40%
    expect(quote.discountPercent).toBeLessThanOrEqual(40);
    expect(quote.netPayable).toBe(quote.grossTotal - quote.discountAmount);
    expect(quote.grandTotalWithGst).toBe(Math.round(quote.netPayable * 1.18));
  });

  // -------------------------------------------------------------------------
  // 9. Payment Gateway Security & Webhook Idempotency
  // -------------------------------------------------------------------------
  it('9.1 Payment Gateway: Live mode without live credentials blocks initiation with BLOCKED_NO_CREDENTIALS', async () => {
    const liveReq = await fetch(`${baseUrl}/payments/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`
      },
      body: JSON.stringify({
        amountInPaise: 50000,
        environment: 'LIVE'
      })
    });

    // Zero-false-pass verification: Live mode without env secrets must block!
    expect(liveReq.status).toBe(400);
    const data = await liveReq.json();
    expect(data.status).toBe('BLOCKED_NO_CREDENTIALS');
  });

  it('9.2 Payment Webhook: Verifies cryptographic HMAC signature and enforces idempotency', async () => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'i2a_webhook_secret_sandbox_2026';
    const eventId = `evt_test_${Date.now()}`;
    const payload = {
      eventId,
      gatewayOrderId: 'order_rzp_mock_123',
      paymentId: 'pay_rzp_mock_999',
      tenantId: schoolA,
      amount: 125000,
      status: 'captured'
    };

    const payloadString = JSON.stringify(payload);
    const validSignature = crypto.createHmac('sha256', webhookSecret).update(payloadString).digest('hex');
    const db = await getDb();

    try {
      // Step 1: Dispatch webhook with valid signature
      const hookRes1 = await fetch(`${baseUrl}/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': validSignature
        },
        body: payloadString
      });
      expect(hookRes1.status).toBe(200);
      const hookData1 = await hookRes1.json();
      expect(hookData1.status).toBe('SUCCESS');

      // Step 2: Idempotency check — duplicate dispatch of same eventId must return IDEMPOTENT_SKIPPED
      const hookRes2 = await fetch(`${baseUrl}/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': validSignature
        },
        body: payloadString
      });
      expect(hookRes2.status).toBe(200);
      const hookData2 = await hookRes2.json();
      expect(hookData2.status).toBe('IDEMPOTENT_SKIPPED');

      // Step 3: Tampered signature rejection
      const badHook = await fetch(`${baseUrl}/payments/webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': 'tampered_invalid_signature_hex'
        },
        body: payloadString
      });
      expect(badHook.status).toBe(400);
      const badData = await badHook.json();
      expect(badData.error).toContain('HMAC signature verification failed');
    } finally {
      await db.collection('processed_webhooks').deleteOne({ eventId });
    }
  });

  // -------------------------------------------------------------------------
  // 10. NOTIFICATION DISPATCH AUDIT TRAIL
  // -------------------------------------------------------------------------
  it('10.1: Notification dispatch records delivery status and is auditable in MongoDB', async () => {
    let notifId = '';
    const db = await getDb();
    try {
      const dispatchRes = await fetch(`${baseUrl}/notifications/dispatch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalToken}`
        },
        body: JSON.stringify({
          recipientType: 'STUDENT',
          recipientName: 'Rahul Kumar',
          recipientEmail: 'rahul.kumar@abcpublicschool.edu.in',
          title: 'Weekly Academic Circular',
          message: 'Term examination timetable published.',
          channel: 'EMAIL'
        })
      });

      expect(dispatchRes.status).toBe(201);
      const notifData = await dispatchRes.json();
      expect(notifData.success).toBe(true);
      // In local dev without SMTP credentials, deliveryStatus is BLOCKED_NO_SMTP_PROVIDER (Zero False Pass)
      expect(notifData.notification.deliveryStatus).toBe('BLOCKED_NO_SMTP_PROVIDER');
      expect(notifData.providerNote).toBeDefined();
      notifId = notifData.notification.id;

      // Verify it was stored in MongoDB notifications collection
      const stored = await db.collection('notifications').findOne({ id: notifId });
      expect(stored).toBeDefined();
      expect(stored?.title).toBe('Weekly Academic Circular');
    } finally {
      if (notifId) {
        await db.collection('notifications').deleteOne({ id: notifId });
      }
    }
  });
});
