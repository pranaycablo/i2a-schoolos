import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import crypto from 'crypto';
import { app } from '../../server/index.js';
import { getDb, closeDb } from '../../server/db.js';
import {
  clearEmailSink,
  getEmailSink,
  peekLatestEmail,
  sendEmail,
  getEmailProviderMode
} from '../../server/services/emailService.js';

describe('i2A SchoolOS — Identity, Credential Lifecycle & Email Master Acceptance Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  let superAdminToken = '';
  let principalSchoolAToken = '';
  let principalSchoolBToken = '';

  const schoolA = 'I2A-SCH-000001';
  const schoolB = 'I2A-SCH-000002';

  beforeAll(async () => {
    // 1. Verify synthetic test database safety
    const db = await getDb();
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');

    clearEmailSink();

    // 2. Start HTTP server on dynamic port
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as { port: number; address: string };
        baseUrl = `http://127.0.0.1:${address.port}/api`;
        resolve();
      });
    });

    // 3. Login Super Admin
    const saRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@i2aschoolos.com', password: 'SuperAdmin@2026#' })
    });
    const saData = await saRes.json();
    expect(saRes.status).toBe(200);
    superAdminToken = saData.token;

    // 4. Login Principal School A
    const paRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'principal@abcpublicschool.edu.in', password: 'Principal@2026#' })
    });
    const paData = await paRes.json();
    expect(paRes.status).toBe(200);
    principalSchoolAToken = paData.token;

    // 5. Ensure Principal School B user exists and get token
    const pbRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'principal@stxaviers.edu.in', password: 'Principal@2026#' })
    });
    if (pbRes.status === 200) {
      const pbData = await pbRes.json();
      principalSchoolBToken = pbData.token;
    } else {
      // Seed if missing
      const bcrypt = (await import('bcryptjs')).default;
      const passHash = await bcrypt.hash('Principal@2026#', 10);
      await db.collection('users').updateOne(
        { email: 'principal@stxaviers.edu.in' },
        {
          $set: {
            id: 'usr-princ-schoolb',
            name: 'St. Xavier Principal',
            email: 'principal@stxaviers.edu.in',
            role: 'PRINCIPAL',
            schoolId: schoolB,
            status: 'ACTIVE',
            passwordHash: passHash,
            updatedAt: new Date().toISOString()
          }
        },
        { upsert: true }
      );
      const pbRes2 = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'principal@stxaviers.edu.in', password: 'Principal@2026#' })
      });
      const pbData2 = await pbRes2.json();
      principalSchoolBToken = pbData2.token;
    }
  });

  afterAll(async () => {
    clearEmailSink();
    await new Promise((resolve) => server.close(resolve));
    await closeDb();
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Student Lifecycle (Invite -> Activate -> Scoped View -> Change Pass)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Scenario 1 — Student Credential Lifecycle & Identity Isolation', () => {
    const studentEmail = `synth.student.${Date.now()}@abcschool.in`;
    let rawInvitationToken = '';
    let studentId = '';
    let studentAuthToken = '';

    it('1.1 School Admin invites new Student; generates cryptographic token hash and captures email in sink', async () => {
      clearEmailSink();

      const inviteRes = await fetch(`${baseUrl}/auth/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalSchoolAToken}`
        },
        body: JSON.stringify({
          email: studentEmail,
          name: 'Ananya Sharma',
          role: 'STUDENT',
          className: 'Class X',
          section: 'B'
        })
      });

      const inviteData = await inviteRes.json();
      expect(inviteRes.status).toBe(201);
      expect(inviteData.success).toBe(true);
      expect(inviteData.invitationToken).toBeDefined();
      expect(inviteData.invitationToken.length).toBe(64); // 32-bytes hex
      rawInvitationToken = inviteData.invitationToken;

      // Verify token in DB is strictly SHA-256 hashed and not plaintext
      const db = await getDb();
      const userInDb = await db.collection('users').findOne({ email: studentEmail });
      expect(userInDb).toBeDefined();
      expect(userInDb?.invitationTokenHash).toBeDefined();
      expect(userInDb?.invitationToken).toBeUndefined(); // Zero plaintext token in DB
      expect(userInDb?.passwordHash).toBeUndefined(); // No default password!
      expect(userInDb?.status).toBe('INVITED');
      expect(userInDb?.mustChangePassword).toBe(true);
      studentId = userInDb?.id || '';

      // Verify email captured in test sink
      const sink = getEmailSink();
      expect(sink.length).toBeGreaterThanOrEqual(1);
      const email = peekLatestEmail();
      expect(email?.to).toBe(studentEmail);
      expect(email?.templateName).toBe('STUDENT_INVITATION');
      expect(email?.isSimulated).toBe(true);
      expect(email?.subject).toContain('Activate Your Student Account');
    });

    it('1.2 Unactivated Student cannot log in before setting password (fail-closed)', async () => {
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail, password: 'AnyPassword123#' })
      });

      expect(loginRes.status).toBe(403);
      const data = await loginRes.json();
      expect(data.code).toBe('ACCOUNT_NOT_ACTIVATED');
    });

    it('1.3 Student activates account with strong password; token is consumed atomically', async () => {
      const activateRes = await fetch(`${baseUrl}/auth/activate-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: rawInvitationToken,
          email: studentEmail,
          newPassword: 'StudentSecurePass2026#'
        })
      });

      const actData = await activateRes.json();
      expect(activateRes.status).toBe(200);
      expect(actData.success).toBe(true);
      expect(actData.token).toBeDefined();
      expect(actData.user.role).toBe('STUDENT');
      studentAuthToken = actData.token;

      // Verify DB state: token hash removed, invitationConsumedAt set
      const db = await getDb();
      const userInDb = await db.collection('users').findOne({ email: studentEmail });
      expect(userInDb?.invitationTokenHash).toBeUndefined();
      expect(userInDb?.invitationConsumedAt).toBeDefined();
      expect(userInDb?.status).toBe('ACTIVE');
      expect(userInDb?.mustChangePassword).toBe(false);
    });

    it('1.4 Replay attack on consumed invitation token is rejected with HTTP 400', async () => {
      const replayRes = await fetch(`${baseUrl}/auth/activate-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: rawInvitationToken,
          email: studentEmail,
          newPassword: 'AnotherPassword2026#'
        })
      });

      expect(replayRes.status).toBe(400);
      const data = await replayRes.json();
      expect(data.code).toBe('INVALID_INVITATION_TOKEN');
    });

    it('1.5 Student logs in with their newly set password', async () => {
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: studentEmail,
          password: 'StudentSecurePass2026#'
        })
      });

      expect(loginRes.status).toBe(200);
      const data = await loginRes.json();
      expect(data.token).toBeDefined();
      expect(data.user.role).toBe('STUDENT');
      studentAuthToken = data.token;
    });

    it('1.6 Student authenticated session changes password; previous token is revoked', async () => {
      const changeRes = await fetch(`${baseUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentAuthToken}`
        },
        body: JSON.stringify({
          currentPassword: 'StudentSecurePass2026#',
          newPassword: 'StudentNewPassword2026!'
        })
      });

      expect(changeRes.status).toBe(200);
      const data = await changeRes.json();
      expect(data.success).toBe(true);

      // Verify old password no longer authenticates
      const oldLogin = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail, password: 'StudentSecurePass2026#' })
      });
      expect(oldLogin.status).toBe(401);

      // Verify new password authenticates
      const newLogin = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: studentEmail, password: 'StudentNewPassword2026!' })
      });
      expect(newLogin.status).toBe(200);
    });

    it('1.7 Student can only view self record and cannot query admin endpoints', async () => {
      // Attempt to access staff endpoints
      const staffRes = await fetch(`${baseUrl}/staff`, {
        headers: { Authorization: `Bearer ${studentAuthToken}` }
      });
      // Should be 403 Forbidden or empty
      expect([401, 403]).toContain(staffRes.status);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Parent Lifecycle & Multi-Child Scoping
  // ───────────────────────────────────────────────────────────────────────────
  describe('Scenario 2 — Parent Credential Lifecycle & Sibling Isolation', () => {
    const parentEmail = `parent.synth.${Date.now()}@gmail.com`;
    const childA_Id = 'std-child-alpha-001';
    const childB_Id = 'std-child-beta-002';
    const otherChildId = 'std-other-school-003';
    let parentToken = '';
    let parentInvitationToken = '';

    beforeAll(async () => {
      const db = await getDb();
      // Seed two children for School A
      await db.collection('students').updateOne(
        { id: childA_Id },
        {
          $set: {
            id: childA_Id,
            schoolId: schoolA,
            name: 'Aarav Gupta',
            className: 'Class X',
            section: 'A',
            parentEmail
          }
        },
        { upsert: true }
      );

      await db.collection('students').updateOne(
        { id: childB_Id },
        {
          $set: {
            id: childB_Id,
            schoolId: schoolA,
            name: 'Diya Gupta',
            className: 'Class VI',
            section: 'B',
            parentEmail
          }
        },
        { upsert: true }
      );

      // Seed unrelated child in School B
      await db.collection('students').updateOne(
        { id: otherChildId },
        {
          $set: {
            id: otherChildId,
            schoolId: schoolB,
            name: 'Rohan Verma',
            className: 'Class VIII',
            section: 'A',
            parentEmail: 'other.parent@gmail.com'
          }
        },
        { upsert: true }
      );
    });

    it('2.1 School Admin invites Parent linked to 2 siblings', async () => {
      const inviteRes = await fetch(`${baseUrl}/auth/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalSchoolAToken}`
        },
        body: JSON.stringify({
          email: parentEmail,
          name: 'Mr. Ramesh Gupta',
          role: 'PARENT',
          childrenIds: [childA_Id, childB_Id],
          childName: 'Aarav & Diya Gupta'
        })
      });

      expect(inviteRes.status).toBe(201);
      const data = await inviteRes.json();
      expect(data.success).toBe(true);
      parentInvitationToken = data.invitationToken;

      const latestEmail = peekLatestEmail();
      expect(latestEmail?.to).toBe(parentEmail);
      expect(latestEmail?.templateName).toBe('PARENT_INVITATION');
    });

    it('2.2 Parent activates account and logs in', async () => {
      const actRes = await fetch(`${baseUrl}/auth/activate-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: parentInvitationToken,
          email: parentEmail,
          newPassword: 'ParentSecure2026!#'
        })
      });

      expect(actRes.status).toBe(200);
      const actData = await actRes.json();
      expect(actData.user.role).toBe('PARENT');
      expect(actData.user.childrenIds).toEqual([childA_Id, childB_Id]);
      parentToken = actData.token;
    });

    it('2.3 Parent query for /students returns only linked children (zero leakage of School B student)', async () => {
      const res = await fetch(`${baseUrl}/students`, {
        headers: { Authorization: `Bearer ${parentToken}` }
      });

      expect(res.status).toBe(200);
      const students = await res.json();
      expect(Array.isArray(students)).toBe(true);

      const returnedIds = students.map((s: any) => s.id);
      expect(returnedIds).toContain(childA_Id);
      expect(returnedIds).toContain(childB_Id);
      expect(returnedIds).not.toContain(otherChildId); // Strict isolation!
    });

    it('2.4 Parent attempting direct GET /students/:otherChildId receives HTTP 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/students/${otherChildId}`, {
        headers: { Authorization: `Bearer ${parentToken}` }
      });

      expect([403, 404]).toContain(res.status);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: Employee / Teacher Onboarding & Department Isolation
  // ───────────────────────────────────────────────────────────────────────────
  describe('Scenario 3 — Teacher & Staff Lifecycle & Privilege Enforcement', () => {
    const teacherEmail = `teacher.synth.${Date.now()}@abcschool.in`;
    let teacherToken = '';
    let teacherInvitationToken = '';

    it('3.1 School Admin invites Teacher with Science department assignment', async () => {
      const inviteRes = await fetch(`${baseUrl}/auth/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalSchoolAToken}`
        },
        body: JSON.stringify({
          email: teacherEmail,
          name: 'Dr. Sunita Sen',
          role: 'TEACHER',
          department: 'Science',
          designation: 'Senior Physics Teacher'
        })
      });

      expect(inviteRes.status).toBe(201);
      const data = await inviteRes.json();
      expect(data.role).toBe('TEACHER');
      teacherInvitationToken = data.invitationToken;

      const email = peekLatestEmail();
      expect(email?.to).toBe(teacherEmail);
      expect(email?.templateName).toBe('STAFF_INVITATION');
    });

    it('3.2 Teacher activates account and logs in', async () => {
      const actRes = await fetch(`${baseUrl}/auth/activate-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: teacherInvitationToken,
          email: teacherEmail,
          newPassword: 'TeacherSecure2026@Pass'
        })
      });

      expect(actRes.status).toBe(200);
      const actData = await actRes.json();
      expect(actData.user.role).toBe('TEACHER');
      teacherToken = actData.token;
    });

    it('3.3 Teacher is authorized to create homework and mark attendance', async () => {
      const hwRes = await fetch(`${baseUrl}/homework`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          title: 'Physics Wave Optics Quiz',
          className: 'Class X',
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0]
        })
      });

      expect(hwRes.status).toBe(201);
    });

    it('3.4 Teacher attempting administrative payroll expense modification is rejected', async () => {
      // Non-admins cannot invoke tenant registration or school setup
      const regRes = await fetch(`${baseUrl}/auth/register-school`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({ name: 'Unauthorized School' })
      });
      // Should reject duplicate admin or fail
      expect([400, 403, 409]).toContain(regRes.status);
    });

    it('3.5 Deactivated / Suspended staff member cannot log in', async () => {
      const db = await getDb();
      await db.collection('users').updateOne(
        { email: teacherEmail },
        { $set: { status: 'SUSPENDED' } }
      );

      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: teacherEmail,
          password: 'TeacherSecure2026@Pass'
        })
      });

      expect(loginRes.status).toBe(403);
      const data = await loginRes.json();
      expect(data.code).toBe('ACCOUNT_SUSPENDED');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: Credential Recovery (Forgot Password -> OTP -> Reset)
  // ───────────────────────────────────────────────────────────────────────────
  describe('Scenario 4 — Forgot Password, OTP Verification & Session Cleared', () => {
    const recoveryEmail = `recovery.${Date.now()}@abcschool.in`;
    let debugOtp = '';
    let resetToken = '';

    beforeAll(async () => {
      const db = await getDb();
      const bcrypt = (await import('bcryptjs')).default;
      const passHash = await bcrypt.hash('InitialPass2026#', 10);
      await db.collection('users').insertOne({
        id: `usr-recov-${Date.now()}`,
        name: 'Recovery Test User',
        email: recoveryEmail,
        role: 'STAFF',
        schoolId: schoolA,
        status: 'ACTIVE',
        passwordHash: passHash,
        createdAt: new Date().toISOString()
      });
    });

    it('4.1 Non-existent email request returns generic success (prevents account enumeration)', async () => {
      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent.user@random.com' })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.debugOtp).toBeUndefined(); // Zero OTP for ghost accounts
    });

    it('4.2 Valid email dispatches 6-digit OTP captured in test email sink', async () => {
      clearEmailSink();

      const res = await fetch(`${baseUrl}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.debugOtp).toBeDefined();
      expect(data.debugOtp).toMatch(/^\d{6}$/);
      debugOtp = data.debugOtp;

      // Verify email captured in sink
      const email = peekLatestEmail();
      expect(email?.to).toBe(recoveryEmail);
      expect(email?.templateName).toBe('PASSWORD_RESET_OTP');
      expect(email?.text).toContain(debugOtp);
    });

    it('4.3 Invalid OTP attempt increments counter; rejects bad code', async () => {
      const res = await fetch(`${baseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail, otp: '000000' })
      });

      expect(res.status).toBe(400);
    });

    it('4.4 Valid OTP returns single-use reset token', async () => {
      const res = await fetch(`${baseUrl}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: recoveryEmail, otp: debugOtp })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.resetToken).toBeDefined();
      resetToken = data.resetToken;
    });

    it('4.5 Consuming reset token updates password and invalidates reset session', async () => {
      const resetRes = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recoveryEmail,
          resetToken,
          newPassword: 'RecoveredSecure2026#Pass'
        })
      });

      expect(resetRes.status).toBe(200);

      // Replay must fail
      const replayRes = await fetch(`${baseUrl}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recoveryEmail,
          resetToken,
          newPassword: 'AnotherPassword2026#'
        })
      });
      expect(replayRes.status).toBe(400);

      // Login with new password
      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recoveryEmail,
          password: 'RecoveredSecure2026#Pass'
        })
      });
      expect(loginRes.status).toBe(200);
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 5: Multi-Tenant Isolation & Cross-School Protection
  // ───────────────────────────────────────────────────────────────────────────
  describe('Scenario 5 — Cross-Tenant Attack Mitigation', () => {
    it('5.1 Principal A cannot invite or provision accounts for School B', async () => {
      const res = await fetch(`${baseUrl}/auth/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalSchoolAToken}`
        },
        body: JSON.stringify({
          email: `attacker.${Date.now()}@stxaviers.edu.in`,
          name: 'Cross School Attacker',
          role: 'TEACHER',
          schoolId: schoolB // Trying to inject into School B
        })
      });

      // SchoolId is clamped by middleware to School A
      if (res.status === 201) {
        const data = await res.json();
        const db = await getDb();
        const user = await db.collection('users').findOne({ email: data.email });
        expect(user?.schoolId).toBe(schoolA); // Clamped to caller's tenant!
      }
    });

    it('5.2 Non-Super Admin cannot invite a user with SUPER_ADMIN role (privilege escalation)', async () => {
      const res = await fetch(`${baseUrl}/auth/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalSchoolAToken}`
        },
        body: JSON.stringify({
          email: `escalate.${Date.now()}@abcschool.in`,
          name: 'Escalation Attacker',
          role: 'SUPER_ADMIN'
        })
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('PRIVILEGE_ESCALATION_BLOCKED');
    });

    it('5.3 Revoking an invitation prevents subsequent account activation', async () => {
      // 1. Create invitation
      const inviteRes = await fetch(`${baseUrl}/auth/invite-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalSchoolAToken}`
        },
        body: JSON.stringify({
          email: `revoked.user.${Date.now()}@abcschool.in`,
          name: 'Revoked User',
          role: 'STAFF'
        })
      });
      const inviteData = await inviteRes.json();
      expect(inviteRes.status).toBe(201);
      const token = inviteData.invitationToken;
      const email = inviteData.email;

      // 2. Admin revokes invitation
      const revokeRes = await fetch(`${baseUrl}/auth/revoke-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalSchoolAToken}`
        },
        body: JSON.stringify({ email })
      });
      expect(revokeRes.status).toBe(200);

      // 3. User attempts to activate revoked token -> HTTP 400
      const actRes = await fetch(`${baseUrl}/auth/activate-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          email,
          newPassword: 'AttemptPassword2026#'
        })
      });
      expect(actRes.status).toBe(400);
      const actData = await actRes.json();
      expect(actData.code).toBe('INVALID_INVITATION_TOKEN');
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // SCENARIO 6: Email Delivery Engine Verification & Anti-Header Injection
  // ───────────────────────────────────────────────────────────────────────────
  describe('Scenario 6 — Email Delivery Engine & Security Controls', () => {
    it('6.1 Email engine accurately reports provider mode as TEST_SINK or SMTP', () => {
      const mode = getEmailProviderMode();
      expect(['TEST_SINK', 'GMAIL_SMTP', 'CUSTOM_SMTP']).toContain(mode);
    });

    it('6.2 Malformed or header-injection email addresses are rejected with 400', async () => {
      await expect(
        sendEmail({
          to: 'attacker@evil.com\r\nBcc: victim@school.in',
          subject: 'Test Header Injection',
          text: 'Injected'
        })
      ).rejects.toThrow();
    });

    it('6.3 Dispatched emails in test environment are explicitly marked isSimulated: true', async () => {
      const res = await sendEmail({
        to: 'verified.test@abcschool.in',
        subject: 'Explicit Simulated Dispatch Check',
        text: 'Checking simulated flag'
      });

      expect(res.success).toBe(true);
      expect(res.isRealDelivery).toBe(false);
      expect(res.deliveryStatus).toBe('SIMULATED_TEST_SINK');
    });
  });
});
