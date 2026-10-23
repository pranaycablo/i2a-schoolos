/**
 * i2A SchoolOS — Master Prompt 06: Identity, Authentication, RBAC, Tenant Isolation & Final Security Verification
 * Adversarial Security Test Suite (24 Enterprise Vectors)
 * Target DB: mongodb://127.0.0.1:27017/i2a_schoolos_synthetic_test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import jwt from 'jsonwebtoken';
import { app } from '../../server/index.js';
import { getDb, closeDb } from '../../server/db.js';
import {
  generateToken,
  revokeToken,
  isTokenRevoked,
  hashToken,
  clearInMemoryRevocationCache,
  recordFailedLoginAttempt,
  isAccountLocked,
  clearFailedLogins,
  clearInMemoryThrottlingCache,
  getJwtSecret
} from '../../server/middleware/auth.js';
import {
  validateRoleAssignment,
  ROLES,
  PERMISSIONS,
  hasPermission
} from '../../server/middleware/rbac.js';
import {
  TenantSecurityService,
  TenantSecurityException
} from '../../src/services/TenantSecurityService.js';

describe('i2A SchoolOS — Master Prompt 06: Identity, Authentication, RBAC & Tenant Isolation Adversarial Matrix (24 Vectors)', () => {
  let server: http.Server;
  let baseUrl: string;

  let superAdminToken = '';
  let principalToken = '';
  let teacherToken = '';
  let parentToken = '';
  let studentToken = '';
  let schoolBAdminToken = '';
  let orgDirectorToken = '';

  const schoolA = 'I2A-SCH-000001';
  const schoolB = 'I2A-SCH-000002';
  const orgDps = 'org-synth-dps';
  const orgRyan = 'org-synth-ryan';

  beforeAll(async () => {
    process.env.VITEST = 'true';
    process.env.TEST_DB_NAME = 'i2a_schoolos_synthetic_test';

    const db = await getDb();
    expect(db).toBeDefined();
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');

    // 1. Setup Disabled User Fixture
    await db.collection('users').updateOne(
      { id: 'usr-synth-disabled-01' },
      {
        $set: {
          id: 'usr-synth-disabled-01',
          email: 'disabled.user@abcpublicschool.edu.in',
          name: 'Disabled User',
          role: 'TEACHER',
          schoolId: schoolA,
          status: 'DISABLED'
        }
      },
      { upsert: true }
    );

    // 2. Setup Suspended User Fixture
    await db.collection('users').updateOne(
      { id: 'usr-synth-suspended-01' },
      {
        $set: {
          id: 'usr-synth-suspended-01',
          email: 'suspended.user@abcpublicschool.edu.in',
          name: 'Suspended User',
          role: 'TEACHER',
          schoolId: schoolA,
          status: 'SUSPENDED'
        }
      },
      { upsert: true }
    );

    // 3. Setup Locked User Fixture
    await db.collection('users').updateOne(
      { id: 'usr-synth-locked-01' },
      {
        $set: {
          id: 'usr-synth-locked-01',
          email: 'locked.user@abcpublicschool.edu.in',
          name: 'Locked User',
          role: 'TEACHER',
          schoolId: schoolA,
          status: 'LOCKED'
        }
      },
      { upsert: true }
    );

    // 4. Setup Revoked Membership Fixture
    await db.collection('users').updateOne(
      { id: 'usr-synth-revoked-mem-01' },
      {
        $set: {
          id: 'usr-synth-revoked-mem-01',
          email: 'revoked.member@abcpublicschool.edu.in',
          name: 'Revoked Membership User',
          role: 'TEACHER',
          schoolId: schoolA,
          status: 'ACTIVE'
        }
      },
      { upsert: true }
    );
    await db.collection('memberships').updateOne(
      { userId: 'usr-synth-revoked-mem-01', schoolId: schoolA },
      {
        $set: {
          id: 'mem-revoked-01',
          userId: 'usr-synth-revoked-mem-01',
          schoolId: schoolA,
          role: 'TEACHER',
          status: 'REVOKED'
        }
      },
      { upsert: true }
    );

    // 5. Setup Student and Fee Fixtures in School A
    await db.collection('students').updateOne(
      { id: 'std-synth-unrelated-01' },
      {
        $set: {
          id: 'std-synth-unrelated-01',
          schoolId: schoolA,
          name: 'Unrelated Student In School A',
          className: 'Class IX',
          section: 'B',
          parentMobile: '9123456789',
          parentEmail: 'unrelated.guardian@example.com',
          status: 'ACTIVE',
          attendanceRate: 88
        }
      },
      { upsert: true }
    );

    await db.collection('fee_receipts').updateOne(
      { id: 'rcp-synth-unrelated-01' },
      {
        $set: {
          id: 'rcp-synth-unrelated-01',
          schoolId: schoolA,
          studentId: 'std-synth-unrelated-01',
          studentName: 'Unrelated Student In School A',
          receiptNo: 'INV-2026-999999',
          totalAmount: 15000,
          paidAmount: 15000,
          status: 'PAID'
        }
      },
      { upsert: true }
    );

    // 6. Setup Parent Sanjay with single linked child std-101
    await db.collection('users').updateOne(
      { email: 'sanjay.kumar@gmail.com' },
      {
        $set: {
          studentId: 'std-101',
          childrenIds: ['std-101']
        }
      }
    );

    // 7. Setup Student Rahul with id std-101
    await db.collection('users').updateOne(
      { email: 'rahul.kumar@abcpublicschool.edu.in' },
      {
        $set: {
          studentId: 'std-101'
        }
      }
    );

    // 8. Setup Dedicated Logout Test User Fixture (prevents token hash collision with other test scenarios)
    await db.collection('users').updateOne(
      { id: 'usr-synth-logout-test' },
      {
        $set: {
          id: 'usr-synth-logout-test',
          email: 'logout.test@abcpublicschool.edu.in',
          name: 'Logout Test User',
          role: 'ADMIN',
          schoolId: schoolA,
          status: 'ACTIVE'
        }
      },
      { upsert: true }
    );

    // 9. Setup Organizations & School affiliations
    const schoolForeign = 'I2A-SCH-FOREIGN-01';
    await db.collection('organizations').updateOne(
      { id: orgDps },
      {
        $set: {
          id: orgDps,
          name: 'Delhi Public Society (Synthetic)',
          governedSchools: [schoolA]
        }
      },
      { upsert: true }
    );
    await db.collection('organizations').updateOne(
      { id: orgRyan },
      {
        $set: {
          id: orgRyan,
          name: 'Ryan Group (Synthetic)',
          governedSchools: [schoolForeign]
        }
      },
      { upsert: true }
    );
    await db.collection('tenants').updateOne(
      { id: schoolA },
      { $set: { orgId: orgDps } }
    );
    await db.collection('tenants').updateOne(
      { id: schoolForeign },
      { $set: { id: schoolForeign, name: 'Foreign Org School', orgId: orgRyan, status: 'ACTIVE' } },
      { upsert: true }
    );

    // Start ephemeral server
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number; address: string };
        baseUrl = `http://127.0.0.1:${addr.port}/api`;
        resolve();
      });
    });

    const login = async (email: string, pass: string) => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      return data.token;
    };

    superAdminToken = await login('superadmin@i2aschoolos.com', 'SuperAdmin@2026#');
    principalToken = await login('principal@abcpublicschool.edu.in', 'Principal@2026#');
    teacherToken = await login('sunita.mishra@abcpublicschool.edu.in', 'Teacher@2026#');
    parentToken = await login('sanjay.kumar@gmail.com', 'Parent@2026#');
    studentToken = await login('rahul.kumar@abcpublicschool.edu.in', 'Student@2026#');
    schoolBAdminToken = await login('admin@stxaviers.edu.in', 'Admin@2026#');
    orgDirectorToken = generateToken({
      id: 'usr-011',
      email: 'director@dpsgroup.example.com',
      role: 'ORG_DIRECTOR',
      schoolId: schoolA
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closeDb();
  });

  // ==========================================================================
  // Scenario 01: Unauthenticated Request Rejection
  // ==========================================================================
  it('Scenario 01: Rejects requests missing Authorization header with 401 AUTH_TOKEN_MISSING', async () => {
    const res = await fetch(`${baseUrl}/students`);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('AUTH_TOKEN_MISSING');
    expect(body.error).toContain('Authentication token missing');
  });

  // ==========================================================================
  // Scenario 02: Malformed Bearer Token Rejection
  // ==========================================================================
  it('Scenario 02: Rejects malformed / forged JWT bearer tokens with 403 INVALID_TOKEN', async () => {
    const res = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: 'Bearer forged.invalid.token.signature' }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('INVALID_TOKEN');
  });

  // ==========================================================================
  // Scenario 03: Expired JWT Token Rejection
  // ==========================================================================
  it('Scenario 03: Rejects expired JWT tokens with 401 TOKEN_EXPIRED', async () => {
    const secret = getJwtSecret();
    const expiredToken = jwt.sign(
      { id: 'usr-002', email: 'principal@abcpublicschool.edu.in', role: 'PRINCIPAL', schoolId: schoolA },
      secret,
      { expiresIn: '-10s', issuer: 'i2a_schoolos', audience: 'i2a_schoolos_api' }
    );

    const res = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${expiredToken}` }
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('TOKEN_EXPIRED');
  });

  // ==========================================================================
  // Scenario 04: Revoked Token Blacklist Rejection Upon Logout
  // ==========================================================================
  it('Scenario 04: Revokes token on logout and rejects subsequent requests with 401 TOKEN_REVOKED', async () => {
    // Generate isolated ephemeral session token
    const logoutToken = generateToken({
      id: 'usr-synth-logout-test',
      email: 'logout.test@abcpublicschool.edu.in',
      role: 'ADMIN',
      schoolId: schoolA
    });

    // 1. Verify token works before logout
    const preCheck = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${logoutToken}` }
    });
    expect(preCheck.status).toBe(200);

    // 2. Perform logout
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${logoutToken}` }
    });
    expect(logoutRes.status).toBe(200);

    // 3. Subsequent request with revoked token must be rejected
    const postCheck = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${logoutToken}` }
    });
    expect(postCheck.status).toBe(401);
    const body = await postCheck.json();
    expect(body.code).toBe('TOKEN_REVOKED');
  });

  // ==========================================================================
  // Scenario 05: Revocation Persistence Survives Process Restart Simulation
  // ==========================================================================
  it('Scenario 05: Revocation persists in MongoDB and blocks revoked token even after in-memory cache wipe', async () => {
    const restartToken = generateToken({
      id: 'usr-synth-logout-test',
      email: 'logout.test@abcpublicschool.edu.in',
      role: 'ADMIN',
      schoolId: schoolA,
      scenarioNonce: 'nonce-restart-05'
    });

    await revokeToken(restartToken, 'PROCESS_RESTART_TEST');

    // Wipe in-memory blacklist to simulate cold server restart
    clearInMemoryRevocationCache();

    // Request must still be rejected via persistent MongoDB collection check
    const res = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${restartToken}` }
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('TOKEN_REVOKED');
  });

  // ==========================================================================
  // Scenario 06: Disabled User Account Rejection
  // ==========================================================================
  it('Scenario 06: Rejects authenticated token for user whose account status is DISABLED with 403 ACCOUNT_DISABLED', async () => {
    const disabledToken = generateToken({
      id: 'usr-synth-disabled-01',
      email: 'disabled.user@abcpublicschool.edu.in',
      role: 'TEACHER',
      schoolId: schoolA
    });

    const res = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${disabledToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('ACCOUNT_DISABLED');
    expect(body.error).toContain('disabled');
  });

  // ==========================================================================
  // Scenario 07: Suspended User Account Rejection
  // ==========================================================================
  it('Scenario 07: Rejects authenticated token for user whose account status is SUSPENDED with 403 ACCOUNT_SUSPENDED', async () => {
    const suspendedToken = generateToken({
      id: 'usr-synth-suspended-01',
      email: 'suspended.user@abcpublicschool.edu.in',
      role: 'TEACHER',
      schoolId: schoolA
    });

    const res = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${suspendedToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('ACCOUNT_SUSPENDED');
    expect(body.error).toContain('suspended');
  });

  // ==========================================================================
  // Scenario 08: Locked User Account Rejection
  // ==========================================================================
  it('Scenario 08: Rejects authenticated token for user whose account status is LOCKED with 403 ACCOUNT_SUSPENDED', async () => {
    const lockedToken = generateToken({
      id: 'usr-synth-locked-01',
      email: 'locked.user@abcpublicschool.edu.in',
      role: 'TEACHER',
      schoolId: schoolA
    });

    const res = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${lockedToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('ACCOUNT_SUSPENDED');
    expect(body.error).toContain('locked');
  });

  // ==========================================================================
  // Scenario 09: Revoked School Membership Rejection
  // ==========================================================================
  it('Scenario 09: Rejects token when user membership in target school is revoked with 403 MEMBERSHIP_REVOKED', async () => {
    const revokedMemToken = generateToken({
      id: 'usr-synth-revoked-mem-01',
      email: 'revoked.member@abcpublicschool.edu.in',
      role: 'TEACHER',
      schoolId: schoolA
    });

    const res = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${revokedMemToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('MEMBERSHIP_REVOKED');
    expect(body.error).toContain('membership in school [I2A-SCH-000001] is revoked');
  });

  // ==========================================================================
  // Scenario 10: Non-Existent User in Token Rejection
  // ==========================================================================
  it('Scenario 10: Rejects token referencing non-existent user with 401 USER_NOT_FOUND', async () => {
    const ghostToken = generateToken({
      id: 'usr-ghost-nonexistent-404',
      email: 'ghost@nowhere.com',
      role: 'PRINCIPAL',
      schoolId: schoolA
    });

    const res = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${ghostToken}` }
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('USER_NOT_FOUND');
  });

  // ==========================================================================
  // Scenario 11: Cross-Tenant URL Parameter Injection Blocked
  // ==========================================================================
  it('Scenario 11: Blocks cross-tenant access via URL parameter manipulation with 403 CROSS_TENANT_VIOLATION', async () => {
    // School A principal attempts to access School B tenant endpoint
    const res = await fetch(`${baseUrl}/tenants/${schoolB}`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('CROSS_TENANT_VIOLATION');
    expect(body.error).toContain('Cross-tenant access violation');
  });

  // ==========================================================================
  // Scenario 12: Cross-Tenant Query Parameter Injection Blocked
  // ==========================================================================
  it('Scenario 12: Blocks cross-tenant data exfiltration via ?schoolId= foreign query parameter', async () => {
    const res = await fetch(`${baseUrl}/students?schoolId=${schoolB}`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('CROSS_TENANT_VIOLATION');
  });

  // ==========================================================================
  // Scenario 13: Cross-Tenant Request Body Manipulation Blocked
  // ==========================================================================
  it('Scenario 13: Blocks cross-tenant creation attempt when client supplies foreign schoolId in body', async () => {
    const res = await fetch(`${baseUrl}/students`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${principalToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        schoolId: schoolB, // Attempted foreign tenant write
        name: 'Hacked Injected Student',
        className: 'Class X',
        section: 'A'
      })
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('CROSS_TENANT_VIOLATION');
  });

  // ==========================================================================
  // Scenario 14: Client-Side Role Tampering Defense
  // ==========================================================================
  it('Scenario 14: Ignores client-provided role in request payload and enforces server-verified session role', async () => {
    // Student attempts to pass role: 'SUPER_ADMIN' to an admin-only endpoint
    const res = await fetch(`${baseUrl}/students`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        role: 'SUPER_ADMIN',
        name: 'Privilege Escalation Student',
        className: 'Class XII',
        section: 'A'
      })
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  // ==========================================================================
  // Scenario 15: Cross-Parent Data Isolation (Object-Level Authorization)
  // ==========================================================================
  it('Scenario 15: Blocks Parent from accessing student record not belonging to their linked children with 403', async () => {
    // Parent Sanjay attempts to view details of unrelated student
    const res = await fetch(`${baseUrl}/students/std-synth-unrelated-01`, {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Parent cannot access unauthorized child profile');
  });

  // ==========================================================================
  // Scenario 16: Cross-Parent Fee Receipts Isolation
  // ==========================================================================
  it('Scenario 16: Scopes parent fee receipts strictly to linked children and excludes other families', async () => {
    const res = await fetch(`${baseUrl}/fees/receipts`, {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    expect(res.status).toBe(200);
    const receipts = await res.json();
    expect(Array.isArray(receipts)).toBe(true);

    // Assert zero receipts belong to unrelated students
    for (const r of receipts) {
      expect(r.studentId).toBe('std-101');
      expect(r.studentId).not.toBe('std-synth-unrelated-01');
    }
  });

  // ==========================================================================
  // Scenario 17: Cross-Student Data Isolation (Self Only)
  // ==========================================================================
  it('Scenario 17: Blocks Student from viewing other student profile records with 403 FORBIDDEN', async () => {
    // Student Rahul (std-101) attempts to inspect student std-synth-unrelated-01
    const res = await fetch(`${baseUrl}/students/std-synth-unrelated-01`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toContain('Students can only view their own record');
  });

  // ==========================================================================
  // Scenario 18: Student Blocked from Staff Administrative Operations
  // ==========================================================================
  it('Scenario 18: Rejects student attempting staff operations (marking attendance) with 403 INSUFFICIENT_PERMISSIONS', async () => {
    const res = await fetch(`${baseUrl}/attendance/mark`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${studentToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        date: '2026-10-18',
        className: 'Class X',
        section: 'A',
        attendanceList: [{ entityId: 'std-101', status: 'PRESENT' }]
      })
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  // ==========================================================================
  // Scenario 19: Teacher Class Assignment Boundary Enforcement
  // ==========================================================================
  it('Scenario 19: Enforces teacher class assignment boundaries in TenantSecurityService object authorization', () => {
    const teacherSession = {
      id: 'usr-004',
      email: 'sunita.mishra@abcpublicschool.edu.in',
      tenantId: schoolA,
      role: 'TEACHER' as const,
      status: 'ACTIVE' as const,
      assignedClass: 'Class X'
    };

    // Access to assigned class succeeds
    expect(
      TenantSecurityService.authorizeObjectAccess(teacherSession, 'CLASS_ROSTER', {
        tenantId: schoolA,
        className: 'Class X'
      })
    ).toBe(true);

    // Access to unassigned class fails
    expect(() =>
      TenantSecurityService.authorizeObjectAccess(teacherSession, 'CLASS_ROSTER', {
        tenantId: schoolA,
        className: 'Class XII'
      })
    ).toThrowError(/Teacher assigned to Class X attempted to access Class XII/);
  });

  // ==========================================================================
  // Scenario 20: Privilege Escalation in Role Assignment Rejected
  // ==========================================================================
  it('Scenario 20: Rejects privilege escalation: Principal cannot assign SUPER_ADMIN or ORG_DIRECTOR', () => {
    // Principal cannot assign Super Admin
    const check1 = validateRoleAssignment('PRINCIPAL', 'SUPER_ADMIN');
    expect(check1.allowed).toBe(false);
    expect(check1.error).toContain('FORBIDDEN');

    // Principal cannot assign Org Director
    const check2 = validateRoleAssignment('PRINCIPAL', 'ORG_DIRECTOR');
    expect(check2.allowed).toBe(false);
    expect(check2.error).toContain('FORBIDDEN');

    // Principal cannot assign equal role (Principal)
    const check3 = validateRoleAssignment('PRINCIPAL', 'PRINCIPAL');
    expect(check3.allowed).toBe(false);
    expect(check3.error).toContain('Privilege escalation rejected');

    // Principal can assign subordinate role (Teacher)
    const check4 = validateRoleAssignment('PRINCIPAL', 'TEACHER');
    expect(check4.allowed).toBe(true);
  });

  // ==========================================================================
  // Scenario 21: Brute-Force Login Lockout Throttling
  // ==========================================================================
  it('Scenario 21: Locks account identifier for 15 minutes after 5 consecutive failed login attempts', async () => {
    const testIdentifier = 'bruteforce.target@example.com';
    await clearFailedLogins(testIdentifier);
    clearInMemoryThrottlingCache();

    // 4 failed attempts: Not yet locked
    for (let i = 0; i < 4; i++) {
      await recordFailedLoginAttempt(testIdentifier);
    }
    const statusBefore = await isAccountLocked(testIdentifier);
    expect(statusBefore).toBe(false);

    // 5th failed attempt: Locks account
    await recordFailedLoginAttempt(testIdentifier);
    const statusAfter = await isAccountLocked(testIdentifier);
    expect(statusAfter).toBeDefined();
    if (typeof statusAfter === 'object') {
      expect(statusAfter.locked).toBe(true);
      expect(statusAfter.remainingSec).toBeGreaterThan(0);
    }

    // Attempting login via HTTP returns 403 ACCOUNT_LOCKED
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testIdentifier, password: 'WrongPassword123' })
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('ACCOUNT_LOCKED');

    // Cleanup
    await clearFailedLogins(testIdentifier);
  });

  // ==========================================================================
  // Scenario 22: Strict NoSQL Operator Injection Rejection
  // ==========================================================================
  it('Scenario 22: Strictly rejects NoSQL operator injection in request body with 400', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: { $gt: '' },
        password: 'Password123'
      })
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(['NOSQL_INJECTION_REJECTED', 'INVALID_INPUT_TYPE']).toContain(body.code);
  });

  // ==========================================================================
  // Scenario 23: Super Admin Authorized Cross-Tenant Delegation
  // ==========================================================================
  it('Scenario 23: Super Admin successfully navigates across school tenants without cross-tenant block', async () => {
    const res = await fetch(`${baseUrl}/tenants/${schoolB}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    expect(res.status).toBe(200);
    const tenantB = await res.json();
    expect(tenantB.id).toBe(schoolB);
  });

  // ==========================================================================
  // Scenario 24: Org Director Valid Hierarchy Access vs Foreign Org Rejection
  // ==========================================================================
  it('Scenario 24: Org Director accesses governed school successfully, but is blocked from foreign organization school with 403', async () => {
    // Org Director governs School A (under org-synth-dps) -> SUCCESS
    const governedRes = await fetch(`${baseUrl}/students?schoolId=${schoolA}`, {
      headers: { Authorization: `Bearer ${orgDirectorToken}` }
    });
    expect(governedRes.status).toBe(200);
    const students = await governedRes.json();
    expect(Array.isArray(students)).toBe(true);

    // Org Director attempts to access foreign school (under foreign org-synth-ryan) -> BLOCKED
    const foreignRes = await fetch(`${baseUrl}/students?schoolId=I2A-SCH-FOREIGN-01`, {
      headers: { Authorization: `Bearer ${orgDirectorToken}` }
    });
    expect(foreignRes.status).toBe(403);
    const body = await foreignRes.json();
    expect(body.code).toBe('CROSS_TENANT_VIOLATION');
    expect(body.error).toContain('Cross-tenant organization violation');
  });
});
