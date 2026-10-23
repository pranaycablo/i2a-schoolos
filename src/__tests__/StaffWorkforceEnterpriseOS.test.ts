/**
 * i2A SchoolOS — Master Prompt 10: Staff Workforce Accounts & Permission Administration
 *
 * Enterprise Test Suite verifying:
 * 1. Database Safety Preflight (Strict zero-touch on production i2a_schoolos)
 * 2. Staff Onboarding & Atomic Employee ID Sequencing
 * 3. User Account Auto-Provisioning & Password Hash Safety
 * 4. Duplicate Email and Employee Code Rejection
 * 5. Strict Multi-Tenant Staff Directory & Profile Isolation
 * 6. Cross-Tenant Branch Assignment Boundary Validation
 * 7. Anti-Privilege Escalation & Role Boundary Guards
 * 8. Soft-Disablement & Token Revocation Preserving HR Historical Data
 * 9. Leave Application, Anti-Self-Approval, and Approval Workflow
 * 10. Re-Decision Conflict Guard (HTTP 409)
 * 11. Least-Privilege PII and Confidential Financial Data Masking
 * 12. Bulk Staff Import Validation Engine
 * 13. Concurrency Stress Test: 10 Simultaneous Staff Creations under Mutex
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { app } from '../../server/index.js';
import { getDb, closeDb } from '../../server/db.js';
import { generateToken } from '../../server/middleware/auth.js';

describe('i2A SchoolOS — Master Prompt 10: Staff Workforce Accounts & Permission Administration', () => {
  let server: http.Server;
  let baseUrl = '';

  // Auth Tokens
  let superAdminToken = '';
  let principalTokenA = '';
  let principalTokenB = '';
  let teacherTokenA = '';
  let teacherUserAId = '';

  const testTimestamp = Date.now();
  const schoolAId = `SCH-A-${testTimestamp}`;
  const schoolBId = `SCH-B-${testTimestamp}`;
  const branchA1Id = `BR-${schoolAId}-MAIN`;
  const branchB1Id = `BR-${schoolBId}-MAIN`;

  let createdStaffAId = '';
  let createdStaffBId = '';
  let createdLeaveId = '';

  async function apiRequest(path: string, options: { method?: string; token?: string; body?: any } = {}) {
    const url = `${baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    if (options.token) {
      headers['Authorization'] = `Bearer ${options.token}`;
    }
    const res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  }

  beforeAll(async () => {
    process.env.VITEST = 'true';
    process.env.TEST_DB_NAME = 'i2a_schoolos_synthetic_test';

    const db = await getDb();
    expect(db).toBeDefined();

    // ── SAFETY PREFLIGHT ────────────────────────────────────────────────────────
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');
    expect(db.databaseName).not.toBe('i2a_schoolos');
    expect(db.databaseName).not.toBe('i2a_schoolos_test');

    // Start ephemeral server
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number; address: string };
        baseUrl = `http://127.0.0.1:${addr.port}/api`;
        resolve();
      });
    });

    // 1. Seed Super Admin
    const sa = {
      id: `USER-SA-${testTimestamp}`,
      email: `sa-${testTimestamp}@i2aschoolos.com`,
      name: 'Super Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    };
    await db.collection('users').insertOne(sa);
    superAdminToken = generateToken(sa);

    // 2. Seed Tenants A & B
    await db.collection('tenants').insertMany([
      { id: schoolAId, name: 'Delhi Public School A', code: `DPS-A-${testTimestamp}`, status: 'ACTIVE' },
      { id: schoolBId, name: 'St. Xavier School B', code: `SXS-B-${testTimestamp}`, status: 'ACTIVE' }
    ]);

    // 3. Seed Branches for Tenants A & B
    await db.collection('branches').insertMany([
      { id: branchA1Id, schoolId: schoolAId, tenantId: schoolAId, branchName: 'Main Campus A', branchCode: 'BR-A1', status: 'ACTIVE' },
      { id: branchB1Id, schoolId: schoolBId, tenantId: schoolBId, branchName: 'Main Campus B', branchCode: 'BR-B1', status: 'ACTIVE' }
    ]);

    // 4. Seed Principals A & B
    const prinA = {
      id: `USER-PRIN-A-${testTimestamp}`,
      email: `principal-a-${testTimestamp}@dpsa.edu`,
      name: 'Principal A',
      role: 'PRINCIPAL',
      schoolId: schoolAId,
      tenantId: schoolAId,
      status: 'ACTIVE'
    };
    const prinB = {
      id: `USER-PRIN-B-${testTimestamp}`,
      email: `principal-b-${testTimestamp}@sxb.edu`,
      name: 'Principal B',
      role: 'PRINCIPAL',
      schoolId: schoolBId,
      tenantId: schoolBId,
      status: 'ACTIVE'
    };
    await db.collection('users').insertMany([prinA, prinB]);
    principalTokenA = generateToken(prinA);
    principalTokenB = generateToken(prinB);

    // 5. Seed Teacher for Tenant A
    teacherUserAId = `USER-TCH-A-${testTimestamp}`;
    const tchA = {
      id: teacherUserAId,
      email: `teacher-a-${testTimestamp}@dpsa.edu`,
      name: 'Mrs. Anita Roy',
      role: 'TEACHER',
      schoolId: schoolAId,
      tenantId: schoolAId,
      status: 'ACTIVE'
    };
    await db.collection('users').insertOne(tchA);
    teacherTokenA = generateToken(tchA);
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closeDb();
  });

  // ============================================================================
  // TEST SUITE
  // ============================================================================

  it('01. Safety Preflight: Connects strictly to synthetic test database', async () => {
    const db = await getDb();
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');
    expect(db.databaseName).not.toBe('i2a_schoolos');
    expect(db.databaseName).not.toBe('i2a_schoolos_test');
  });

  it('02. Staff Onboarding: Principal A creates staff member with auto employee ID', async () => {
    const res = await apiRequest('/staff', {
      method: 'POST',
      token: principalTokenA,
      body: {
        fullName: 'Dr. Ramesh Sharma',
        email: `ramesh-${testTimestamp}@dpsa.edu`,
        phone: '9811223344',
        department: 'Academic',
        designation: 'PGT Physics',
        employmentType: 'FULL_TIME',
        isTeacher: true,
        primaryBranchId: branchA1Id,
        specializations: ['Quantum Mechanics', 'Thermodynamics'],
        bankDetails: {
          bankName: 'State Bank of India',
          accountNumber: '112233445566',
          ifscCode: 'SBIN0001234',
          panNumber: 'ABCDE1234F',
          aadhaarNumber: '123456789012'
        }
      }
    });

    if (res.status !== 201) {
      console.log('❌ Test 02 failed with status:', res.status, JSON.stringify(res.data));
    }

    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    expect(res.data.data.fullName).toBe('Dr. Ramesh Sharma');
    expect(res.data.data.employeeId).toMatch(/^EMP-\d{4}-\d{4}$/);
    expect(res.data.data.schoolId).toBe(schoolAId);
    expect(res.data.data.primaryBranchId).toBe(branchA1Id);
    expect(res.data.data.linkedUserId).toBeDefined();

    createdStaffAId = res.data.data.id;
  });

  it('03. User Account Provisioning: Automatically creates user with bcrypt hashed password', async () => {
    const db = await getDb();
    const createdStaff = await db.collection('staff').findOne({ id: createdStaffAId });
    expect(createdStaff).toBeDefined();
    expect(createdStaff?.linkedUserId).toBeDefined();

    const createdUser = await db.collection('users').findOne({ id: createdStaff?.linkedUserId });
    expect(createdUser).toBeDefined();
    expect(createdUser?.email).toBe(`ramesh-${testTimestamp}@dpsa.edu`);
    expect(createdUser?.role).toBe('TEACHER');
    expect(createdUser?.status).toBe('ACTIVE');

    // Verify password is not plaintext
    expect(createdUser?.password).toBeDefined();
    expect(createdUser?.password).not.toBe('Staff@2026');
    expect(createdUser?.password.startsWith('$2')).toBe(true); // bcrypt signature
  });

  it('04. Duplicate Email Rejection: Blocks creating staff with existing email in same school (HTTP 409)', async () => {
    const res = await apiRequest('/staff', {
      method: 'POST',
      token: principalTokenA,
      body: {
        fullName: 'Duplicate Ramesh',
        email: `ramesh-${testTimestamp}@dpsa.edu`, // Duplicate email
        phone: '9811223399',
        department: 'Academic',
        designation: 'Faculty'
      }
    });

    expect(res.status).toBe(409);
    expect(res.data.code).toBe('DUPLICATE_EMAIL');
  });

  it('05. Duplicate Employee Code Rejection: Blocks duplicate custom employee ID (HTTP 409)', async () => {
    // 1. Create with custom ID
    const res1 = await apiRequest('/staff', {
      method: 'POST',
      token: principalTokenA,
      body: {
        fullName: 'Mr. Custom Code User',
        email: `custom-${testTimestamp}@dpsa.edu`,
        employeeId: `EMP-CUSTOM-${testTimestamp}`,
        phone: '9811223388',
        department: 'Accounts'
      }
    });
    expect(res1.status).toBe(201);

    // 2. Try creating duplicate
    const res2 = await apiRequest('/staff', {
      method: 'POST',
      token: principalTokenA,
      body: {
        fullName: 'Another User with Same Code',
        email: `custom2-${testTimestamp}@dpsa.edu`,
        employeeId: `EMP-CUSTOM-${testTimestamp}`, // Duplicate
        phone: '9811223377',
        department: 'Accounts'
      }
    });

    expect(res2.status).toBe(409);
    expect(res2.data.code).toBe('DUPLICATE_EMPLOYEE_CODE');
  });

  it('06. Tenant Isolation: Tenant B cannot list or view Tenant A staff members', async () => {
    // 1. Principal B creates staff in School B
    const resB = await apiRequest('/staff', {
      method: 'POST',
      token: principalTokenB,
      body: {
        fullName: 'Mr. Suresh Kumar B',
        email: `suresh-${testTimestamp}@sxb.edu`,
        phone: '9822334455',
        department: 'Administration',
        designation: 'Registrar',
        primaryBranchId: branchB1Id
      }
    });
    expect(resB.status).toBe(201);
    createdStaffBId = resB.data.data.id;

    // 2. Principal B lists staff -> Must only contain School B staff, 0 School A staff
    const listResB = await apiRequest('/staff', { token: principalTokenB });
    expect(listResB.status).toBe(200);
    expect(listResB.data.data.length).toBeGreaterThan(0);

    const schoolAItems = listResB.data.data.filter((s: any) => s.schoolId === schoolAId);
    expect(schoolAItems.length).toBe(0);

    const schoolBItems = listResB.data.data.filter((s: any) => s.schoolId === schoolBId);
    expect(schoolBItems.length).toBe(listResB.data.data.length);
  });

  it('07. Cross-Tenant IDOR Guard: Tenant B cannot access Tenant A staff profile directly (HTTP 404)', async () => {
    const res = await apiRequest(`/staff/${createdStaffAId}`, { token: principalTokenB });
    expect(res.status).toBe(404);
    expect(res.data.code).toBe('STAFF_NOT_FOUND');
  });

  it('08. Cross-Tenant Branch Boundary: Reject assigning foreign tenant branch (HTTP 404)', async () => {
    const res = await apiRequest(`/staff/${createdStaffAId}/branches`, {
      method: 'POST',
      token: principalTokenA,
      body: {
        primaryBranchId: branchB1Id // Belongs to Tenant B!
      }
    });

    expect(res.status).toBe(404);
    expect(res.data.code).toBe('INVALID_BRANCH_ASSIGNMENT');
  });

  it('09. RBAC Boundary: Regular Teacher cannot onboard new staff (HTTP 403)', async () => {
    const res = await apiRequest('/staff', {
      method: 'POST',
      token: teacherTokenA,
      body: {
        fullName: 'Unauthorized Addition',
        email: `unauth-${testTimestamp}@dpsa.edu`
      }
    });

    expect(res.status).toBe(403);
    expect(['FORBIDDEN', 'INSUFFICIENT_PERMISSIONS']).toContain(res.data.code);
  });

  it('10. Anti-Privilege Escalation: Regular Admin cannot assign SUPER_ADMIN role (HTTP 403)', async () => {
    const res = await apiRequest('/staff', {
      method: 'POST',
      token: principalTokenA,
      body: {
        fullName: 'Malicious Super Admin Candidate',
        email: `escalate-${testTimestamp}@dpsa.edu`,
        userRole: 'SUPER_ADMIN' // Forbidden for Principal/Admin
      }
    });

    expect(res.status).toBe(403);
    expect(res.data.code).toBe('PRIVILEGE_ESCALATION_BLOCKED');
  });

  it('11. Account Disablement: Disabling staff revokes user login while preserving HR history', async () => {
    // Disable staff
    const res = await apiRequest(`/staff/${createdStaffAId}/status`, {
      method: 'PATCH',
      token: principalTokenA,
      body: {
        status: 'INACTIVE',
        reason: 'Staff on extended sabbatical'
      }
    });

    expect(res.status).toBe(200);
    expect(res.data.data.status).toBe('INACTIVE');

    const db = await getDb();
    // Verify linked user account has status INACTIVE
    const staff = await db.collection('staff').findOne({ id: createdStaffAId });
    expect(staff?.status).toBe('INACTIVE');
    expect(staff?.fullName).toBe('Dr. Ramesh Sharma'); // HR record preserved

    const user = await db.collection('users').findOne({ id: staff?.linkedUserId });
    expect(user?.status).toBe('INACTIVE');
    expect(user?.disabledReason).toBe('Staff on extended sabbatical');

    // Re-activate staff for further tests
    await apiRequest(`/staff/${createdStaffAId}/status`, {
      method: 'PATCH',
      token: principalTokenA,
      body: { status: 'ACTIVE', reason: 'Reinstated' }
    });
  });

  it('12. Leave Application: Staff member applies for leave successfully', async () => {
    const res = await apiRequest('/staff/leaves', {
      method: 'POST',
      token: principalTokenA,
      body: {
        staffId: createdStaffAId,
        startDate: '2026-11-01',
        endDate: '2026-11-03',
        leaveType: 'CASUAL',
        reason: 'Attending National Science Conference'
      }
    });

    expect(res.status).toBe(201);
    expect(res.data.success).toBe(true);
    expect(res.data.data.status).toBe('PENDING');
    expect(res.data.data.totalDays).toBe(3);
    expect(res.data.data.staffName).toBe('Dr. Ramesh Sharma');

    createdLeaveId = res.data.data.id;
  });

  it('13. Anti-Self-Approval: Teacher cannot approve own leave request (HTTP 403)', async () => {
    // 1. Create dedicated staff profile for Anita Roy
    const db = await getDb();
    const anitaStaffId = `STF-ANITA-${testTimestamp}`;
    await db.collection('staff').insertOne({
      id: anitaStaffId,
      schoolId: schoolAId,
      employeeId: `EMP-ANITA-${testTimestamp}`,
      fullName: 'Mrs. Anita Roy',
      email: `teacher-a-${testTimestamp}@dpsa.edu`,
      linkedUserId: teacherUserAId,
      department: 'Academic',
      status: 'ACTIVE'
    });

    const leaveRes = await apiRequest('/staff/leaves', {
      method: 'POST',
      token: teacherTokenA,
      body: {
        staffId: anitaStaffId,
        startDate: '2026-11-10',
        endDate: '2026-11-11',
        leaveType: 'CASUAL',
        reason: 'Personal leave'
      }
    });
    expect(leaveRes.status).toBe(201);
    const anitaLeaveId = leaveRes.data.data.id;

    const res = await apiRequest(`/staff/leaves/${anitaLeaveId}/decision`, {
      method: 'PATCH',
      token: teacherTokenA,
      body: { decision: 'APPROVED', comments: 'Self approval attempt' }
    });

    expect(res.status).toBe(403);
    expect(['INSUFFICIENT_PERMISSIONS', 'SELF_APPROVAL_BLOCKED', 'FORBIDDEN']).toContain(res.data.code);
  });

  it('14. Leave Approval Workflow: Principal approves leave with comments', async () => {
    const res = await apiRequest(`/staff/leaves/${createdLeaveId}/decision`, {
      method: 'PATCH',
      token: principalTokenA,
      body: {
        decision: 'APPROVED',
        comments: 'Approved. Please arrange substitution for period 3.'
      }
    });

    expect(res.status).toBe(200);
    expect(res.data.data.status).toBe('APPROVED');
    expect(res.data.data.approverComments).toContain('Approved. Please arrange substitution');
    expect(res.data.data.decidedAt).toBeDefined();
  });

  it('15. Re-Decision Conflict Guard: Already decided leave cannot be modified (HTTP 409)', async () => {
    const res = await apiRequest(`/staff/leaves/${createdLeaveId}/decision`, {
      method: 'PATCH',
      token: principalTokenA,
      body: { decision: 'REJECTED', comments: 'Attempting override' }
    });

    expect(res.status).toBe(409);
    expect(res.data.code).toBe('LEAVE_ALREADY_DECIDED');
  });

  it('16. Least-Privilege PII Masking: Redacts bank details for regular teacher view', async () => {
    // Teacher A accesses staff profile
    const teacherView = await apiRequest(`/staff/${createdStaffAId}`, { token: teacherTokenA });
    expect(teacherView.status).toBe(200);
    // Bank account must be masked
    expect(teacherView.data.data.bankDetails?.accountNumber).toContain('••••••••');
    expect(teacherView.data.data.bankDetails?.panNumber).toBe('••••••••••');

    // Principal A accesses same staff profile -> Receives unmasked data
    const principalView = await apiRequest(`/staff/${createdStaffAId}`, { token: principalTokenA });
    expect(principalView.status).toBe(200);
    expect(principalView.data.data.bankDetails?.accountNumber).toBe('112233445566');
    expect(principalView.data.data.bankDetails?.panNumber).toBe('ABCDE1234F');
  });

  it('17. Bulk Import Validation Engine: Detects duplicate emails and code collisions', async () => {
    const testBatch = [
      { fullName: 'Valid Faculty 1', email: `valid1-${testTimestamp}@dpsa.edu`, department: 'Academic' },
      { fullName: 'Valid Faculty 2', email: `valid2-${testTimestamp}@dpsa.edu`, department: 'Academic' },
      { fullName: 'Duplicate Within Batch', email: `valid1-${testTimestamp}@dpsa.edu` }, // Duplicate in batch
      { fullName: 'Existing DB Email', email: `ramesh-${testTimestamp}@dpsa.edu` } // Collides with DB
    ];

    const res = await apiRequest('/staff/bulk-validate', {
      method: 'POST',
      token: principalTokenA,
      body: { rows: testBatch }
    });

    expect(res.status).toBe(200);
    expect(res.data.valid).toBe(false);
    expect(res.data.errorCount).toBe(2);
    expect(res.data.validCount).toBe(2);
    expect(res.data.errors.some((e: any) => e.message.includes('Duplicate email'))).toBe(true);
    expect(res.data.errors.some((e: any) => e.message.includes('already exists in school database'))).toBe(true);
  });

  it('18. Concurrency Stress Test: 10 simultaneous staff creations under mutex produce zero collisions', async () => {
    const startTime = Date.now();
    const creationPromises = Array.from({ length: 10 }).map((_, idx) =>
      apiRequest('/staff', {
        method: 'POST',
        token: principalTokenA,
        body: {
          fullName: `Concurrent Faculty ${idx}`,
          email: `concurrent-${idx}-${testTimestamp}@dpsa.edu`,
          department: 'Academic',
          designation: 'Assistant Faculty',
          isTeacher: true
        }
      })
    );

    const results = await Promise.all(creationPromises);
    const durationMs = Date.now() - startTime;

    expect(results.length).toBe(10);
    results.forEach((res) => {
      expect(res.status).toBe(201);
      expect(res.data.success).toBe(true);
    });

    // Check all employee IDs are unique
    const employeeIds = results.map((r) => r.data.data.employeeId);
    const uniqueIds = new Set(employeeIds);
    expect(uniqueIds.size).toBe(10);

    console.log(`✅ [Phase 10 Concurrency] 10 simultaneous staff members created in ${durationMs}ms with zero ID collisions.`);
  });
});
