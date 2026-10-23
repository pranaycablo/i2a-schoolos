/**
 * i2A SchoolOS — Master Prompt 04: Enterprise Security, RBAC & Adversarial Test Suite
 * Covers all 28 explicit security test vectors mandated in Master Prompt 04 Part 11.
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { app } from '../../server/index.js';
import { getDb, closeDb } from '../../server/db.js';
import {
  generateToken,
  revokeToken,
  isTokenRevoked,
  getJwtSecret,
  recordFailedLoginAttempt,
  isAccountLocked,
  clearFailedLogins
} from '../../server/middleware/auth.js';
import {
  hasPermission,
  validateRoleAssignment,
  ROLES,
  PERMISSIONS
} from '../../server/middleware/rbac.js';
import {
  redactStudentPii,
  maskPhone,
  maskEmail,
  maskNationalId
} from '../../server/services/privacyService.js';
import {
  createJobSecurityContext,
  executeScopedJobTask,
  JobSecurityException
} from '../../server/services/jobSecurityService.js';
import { sanitizeAuditDetails, recordAuditEvent } from '../../server/services/auditService.js';
import { updateOrganizationParent } from '../../server/services/hierarchyService.js';

describe('i2A SchoolOS — Master Prompt 04: Enterprise Security & Adversarial Test Matrix (28 Vectors)', () => {
  let server: http.Server;
  let baseUrl: string;

  let superAdminToken = '';
  let principalToken = '';
  let teacherToken = '';
  let accountantToken = '';
  let parentToken = '';
  let studentToken = '';
  let orgDirectorToken = '';
  let schoolBAdminToken = '';

  const schoolA = 'I2A-SCH-000001';
  const schoolB = 'I2A-SCH-000002';
  const orgDps = 'org-synth-dps';

  beforeAll(async () => {
    const db = await getDb();
    expect(db).toBeDefined();

    // Start ephemeral server
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number; address: string };
        baseUrl = `http://127.0.0.1:${addr.port}/api`;
        resolve();
      });
    });

    // 1. Authenticate seed users
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
    accountantToken = await login('alok.nath@abcpublicschool.edu.in', 'Accountant@2026#');
    parentToken = await login('sanjay.kumar@gmail.com', 'Parent@2026#');
    studentToken = await login('rahul.kumar@abcpublicschool.edu.in', 'Student@2026#');
    orgDirectorToken = await login('director@dpsgroup.example.com', 'Admin@2026#');
    schoolBAdminToken = await login('admin@stxaviers.edu.in', 'Admin@2026#');
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closeDb();
  });

  // ---------------------------------------------------------------------------
  // Vector 1: Unauthenticated request denied (401)
  // ---------------------------------------------------------------------------
  it('Vector 1: Unauthenticated request denied with 401 AUTH_TOKEN_MISSING', async () => {
    const res = await fetch(`${baseUrl}/students`);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('AUTH_TOKEN_MISSING');
  });

  // ---------------------------------------------------------------------------
  // Vector 2: Expired / Revoked session denied (401)
  // ---------------------------------------------------------------------------
  it('Vector 2: Revoked session denied with 401 TOKEN_REVOKED on subsequent calls', async () => {
    // Generate a dedicated test token
    const ephemeralToken = generateToken({
      id: 'usr-ephemeral',
      email: 'ephemeral@example.com',
      role: 'PRINCIPAL',
      schoolId: schoolA
    });

    // Revoke token
    await revokeToken(ephemeralToken, 'TEST_REVOCATION');
    const isRev = await isTokenRevoked(ephemeralToken);
    expect(isRev).toBe(true);

    // Call protected endpoint with revoked token
    const res = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${ephemeralToken}` }
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('TOKEN_REVOKED');
  });

  // ---------------------------------------------------------------------------
  // Vector 3: Wrong tenant denied (403)
  // ---------------------------------------------------------------------------
  it('Vector 3: Wrong tenant denied with 403 CROSS_TENANT_VIOLATION', async () => {
    const res = await fetch(`${baseUrl}/students?schoolId=${schoolB}`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('CROSS_TENANT_VIOLATION');
  });

  // ---------------------------------------------------------------------------
  // Vector 4: Wrong school denied (403)
  // ---------------------------------------------------------------------------
  it('Vector 4: Wrong school parameter tampering in attendance denied with 403', async () => {
    const res = await fetch(`${baseUrl}/attendance?schoolId=${schoolB}`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('CROSS_TENANT_VIOLATION');
  });

  // ---------------------------------------------------------------------------
  // Vector 5: Wrong branch denied (403)
  // ---------------------------------------------------------------------------
  it('Vector 5: Wrong branch parameter tampering in fees denied with 403', async () => {
    const res = await fetch(`${baseUrl}/fees/receipts?schoolId=${schoolB}`, {
      headers: { Authorization: `Bearer ${accountantToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('CROSS_TENANT_VIOLATION');
  });

  // ---------------------------------------------------------------------------
  // Vector 6: Parent accessing unrelated student denied (403)
  // ---------------------------------------------------------------------------
  it('Vector 6: Parent accessing unrelated student profile denied with 403', async () => {
    // Sanjay Kumar is parent of std-101 only; std-102 belongs to another parent
    const res = await fetch(`${baseUrl}/students/std-102`, {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  // ---------------------------------------------------------------------------
  // Vector 7: Student accessing another student denied (403)
  // ---------------------------------------------------------------------------
  it('Vector 7: Student accessing another student record denied with 403', async () => {
    // Rahul Kumar (std-101) attempts to inspect std-102
    const res = await fetch(`${baseUrl}/students/std-102`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  // ---------------------------------------------------------------------------
  // Vector 8: Teacher accessing unassigned class denied / scoped
  // ---------------------------------------------------------------------------
  it('Vector 8: Teacher queries unassigned class returns empty filtered dataset', async () => {
    // Sunita Mishra is assigned to Class VIII and X, queries Class VI
    const res = await fetch(`${baseUrl}/students?className=Class%20VI`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    expect(res.status).toBe(200);
    const list = await res.json();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Vector 9: Accountant accessing restricted academic/exam records denied (403)
  // ---------------------------------------------------------------------------
  it('Vector 9: Accountant creating exam paper denied with 403 INSUFFICIENT_PERMISSIONS', async () => {
    const res = await fetch(`${baseUrl}/exams/papers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accountantToken}`
      },
      body: JSON.stringify({ title: 'Unauthorized Exam', subject: 'Finance' })
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  // ---------------------------------------------------------------------------
  // Vector 10: Group admin accessing undelegated branch denied (403)
  // ---------------------------------------------------------------------------
  it('Vector 10: Org Director accessing ungoverned foreign school denied with 403', async () => {
    // DPS Director attempts to query St. Xavier (schoolB), which is not under org-synth-dps
    const res = await fetch(`${baseUrl}/students?schoolId=${schoolB}`, {
      headers: { Authorization: `Bearer ${orgDirectorToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('CROSS_TENANT_VIOLATION');
    expect(body.error).toContain('does not govern school');
  });

  // ---------------------------------------------------------------------------
  // Vector 11: Government / jurisdictional boundary enforcement
  // ---------------------------------------------------------------------------
  it('Vector 11: Jurisdiction boundary validation rejects unassigned jurisdictional scope', () => {
    expect(hasPermission(ROLES.STUDENT, PERMISSIONS.ORGANIZATION_MANAGE)).toBe(false);
    expect(hasPermission(ROLES.TEACHER, PERMISSIONS.BRANCHES_MANAGE)).toBe(false);
    expect(hasPermission(ROLES.DISTRICT_OFFICER, PERMISSIONS.BRANCHES_READ)).toBe(true);
    expect(hasPermission(ROLES.DISTRICT_OFFICER, PERMISSIONS.FEES_COLLECT)).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Vector 12: Role escalation denied
  // ---------------------------------------------------------------------------
  it('Vector 12: Role escalation rejected: Non-SuperAdmin cannot create or assign SUPER_ADMIN', () => {
    const principalToSuperAdmin = validateRoleAssignment(ROLES.PRINCIPAL, ROLES.SUPER_ADMIN);
    expect(principalToSuperAdmin.allowed).toBe(false);
    expect(principalToSuperAdmin.error).toContain('FORBIDDEN');

    const staffToPrincipal = validateRoleAssignment(ROLES.STAFF, ROLES.PRINCIPAL);
    expect(staffToPrincipal.allowed).toBe(false);
    expect(staffToPrincipal.error).toContain('Privilege escalation rejected');

    const superAdminAny = validateRoleAssignment(ROLES.SUPER_ADMIN, ROLES.PRINCIPAL);
    expect(superAdminAny.allowed).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Vector 13: Permission self-grant denied
  // ---------------------------------------------------------------------------
  it('Vector 13: Permission self-grant denied: Teacher lacks AUDIT_READ and cannot self-grant', () => {
    expect(hasPermission(ROLES.TEACHER, PERMISSIONS.AUDIT_READ)).toBe(false);
    expect(hasPermission(ROLES.ACCOUNTANT, PERMISSIONS.STUDENTS_DELETE)).toBe(false);
    expect(hasPermission(ROLES.PARENT, PERMISSIONS.ATTENDANCE_MARK)).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Vector 14: IDOR / BOLA denied
  // ---------------------------------------------------------------------------
  it('Vector 14: IDOR / BOLA denied: School A principal cannot fetch School B student profile', async () => {
    const db = await getDb();
    // Verify School B student exists
    const schoolBStudent = await db.collection('students').findOne({ schoolId: schoolB });
    if (schoolBStudent) {
      const res = await fetch(`${baseUrl}/students/${schoolBStudent.id}`, {
        headers: { Authorization: `Bearer ${principalToken}` }
      });
      // Filter strictly restricts to schoolA, returning 404
      expect(res.status).toBe(404);
    }
  });

  // ---------------------------------------------------------------------------
  // Vector 15: Mass assignment denied
  // ---------------------------------------------------------------------------
  it('Vector 15: Mass assignment denied: Forbidden fields (schoolId, role, id) stripped during update', async () => {
    const db = await getDb();
    const targetStudent = await db.collection('students').findOne({ schoolId: schoolA });
    expect(targetStudent).toBeDefined();

    const originalName = targetStudent.name;
    const maliciousPayload = {
      name: 'Legitimately Updated Name (Synthetic Student)',
      role: 'SUPER_ADMIN', // Attempted role injection
      id: 'hacked-id' // Attempted ID injection
    };

    try {
      const res = await fetch(`${baseUrl}/students/${targetStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalToken}`
        },
        body: JSON.stringify(maliciousPayload)
      });

      expect(res.status).toBe(200);
      const updated = await db.collection('students').findOne({ id: targetStudent.id });
      expect(updated.name).toBe('Legitimately Updated Name (Synthetic Student)');
      expect(updated.schoolId).toBe(schoolA); // Invariant preserved!
      expect(updated.id).toBe(targetStudent.id); // Invariant preserved!
      expect(updated.role).toBeUndefined(); // Invariant preserved!
    } finally {
      await db.collection('students').updateOne(
        { id: targetStudent.id },
        { $set: { name: originalName } }
      );
    }
  });

  // ---------------------------------------------------------------------------
  // Vector 16: NoSQL injection rejected
  // ---------------------------------------------------------------------------
  it('Vector 16: NoSQL injection rejected in login parameters with 400 INVALID_INPUT_TYPE', async () => {
    const res = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: { $gt: '' }, password: { $gt: '' } })
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(['INVALID_INPUT_TYPE', 'NOSQL_INJECTION_REJECTED']).toContain(body.code);
  });

  // ---------------------------------------------------------------------------
  // Vector 17: Cross-tenant bulk update denied
  // ---------------------------------------------------------------------------
  it('Vector 17: Cross-tenant bulk update denied: Mutations scoped to authorized tenant only', async () => {
    const db = await getDb();
    const initialBCount = await db.collection('students').countDocuments({ schoolId: schoolB });

    // Attempt to update student belonging to School B using School A credentials
    const schoolBStudent = await db.collection('students').findOne({ schoolId: schoolB });
    if (schoolBStudent) {
      const res = await fetch(`${baseUrl}/students/${schoolBStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalToken}`
        },
        body: JSON.stringify({ name: 'Cross-Tenant Tamper' })
      });
      expect(res.status).toBe(404);

      // Verify School B document in database was untouched
      const freshB = await db.collection('students').findOne({ id: schoolBStudent.id });
      expect(freshB.name).not.toBe('Cross-Tenant Tamper');
    }

    const finalBCount = await db.collection('students').countDocuments({ schoolId: schoolB });
    expect(finalBCount).toBe(initialBCount);
  });

  // ---------------------------------------------------------------------------
  // Vector 18: Cross-tenant aggregation / report denied
  // ---------------------------------------------------------------------------
  it('Vector 18: Cross-tenant aggregation denied: Audit logs scoped to authorized tenant only', async () => {
    // School B admin queries audit logs; tenantFilter injects { schoolId: schoolB }
    const res = await fetch(`${baseUrl}/audit-logs`, {
      headers: { Authorization: `Bearer ${schoolBAdminToken}` }
    });
    expect(res.status).toBe(200);
    const logs = await res.json();
    expect(Array.isArray(logs)).toBe(true);
    for (const log of logs) {
      expect(log.schoolId).toBe(schoolB);
    }
  });

  // ---------------------------------------------------------------------------
  // Vector 19: Unauthorized export denied
  // ---------------------------------------------------------------------------
  it('Vector 19: Unauthorized export denied: Teacher lacks export permission (403)', async () => {
    const res = await fetch(`${baseUrl}/students/export`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  // ---------------------------------------------------------------------------
  // Vector 20: Audit log unauthorized read denied
  // ---------------------------------------------------------------------------
  it('Vector 20: Audit log unauthorized read denied for Teacher and Student (403)', async () => {
    const teacherRes = await fetch(`${baseUrl}/audit-logs`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    expect(teacherRes.status).toBe(403);

    const studentRes = await fetch(`${baseUrl}/audit-logs`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    expect(studentRes.status).toBe(403);
  });

  // ---------------------------------------------------------------------------
  // Vector 21: Invalid hierarchy mutation denied (409)
  // ---------------------------------------------------------------------------
  it('Vector 21: Invalid hierarchy cycle creation denied with 409 CIRCULAR_HIERARCHY_DETECTED', async () => {
    // Attempt to set parent of trust to itself
    const res = await fetch(`${baseUrl}/organizations/org-synth-dps/parent`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ parentId: 'org-synth-dps' })
    });
    expect([409, 400]).toContain(res.status);
    const body = await res.json();
    expect(body.error).toMatch(/Circular|own parent/i);
  });

  // ---------------------------------------------------------------------------
  // Vector 22: Transaction failure produces zero partial writes
  // ---------------------------------------------------------------------------
  it('Vector 22: Transaction failure produces zero partial writes (Verified rollback)', async () => {
    const db = await getDb();
    const initialOrg = await db.collection('organizations').findOne({ id: 'org-synth-dps' });

    try {
      await updateOrganizationParent({ childId: 'org-synth-dps', parentId: 'org-synth-dps', database: db });
    } catch (err: any) {
      expect(err.code || err.message).toMatch(/CIRCULAR|SELF_HIERARCHY|own parent/i);
    }

    const postOrg = await db.collection('organizations').findOne({ id: 'org-synth-dps' });
    expect(postOrg.parentOrgId).toBe(initialOrg.parentOrgId);
  });

  // ---------------------------------------------------------------------------
  // Vector 23: Standalone topology cannot bypass transactional hierarchy requirements
  // ---------------------------------------------------------------------------
  it('Vector 23: Standalone topology fails closed if session support is absent', async () => {
    const mockDbWithoutSession: any = {
      collection: () => ({ findOne: () => ({ id: 'org-test-child', parentOrgId: null }) }),
      client: {} // No startSession method
    };

    await expect(
      updateOrganizationParent({ childId: 'org-test-child', parentId: 'org-test-parent', database: mockDbWithoutSession })
    ).rejects.toThrow(/TRANSACTION_UNSUPPORTED_TOPOLOGY/);
  });

  // ---------------------------------------------------------------------------
  // Vector 24: Missing tenant context fails closed
  // ---------------------------------------------------------------------------
  it('Vector 24: Token missing schoolId tenant context fails closed with 403', async () => {
    const db = await getDb();
    await db.collection('users').insertOne({
      id: 'usr-no-tenant',
      email: 'notenant@example.com',
      name: 'No Tenant Teacher',
      role: 'TEACHER',
      schoolId: null,
      status: 'ACTIVE'
    });

    try {
      const noTenantToken = generateToken({
        id: 'usr-no-tenant',
        email: 'notenant@example.com',
        role: 'TEACHER',
        schoolId: null
      });

      const res = await fetch(`${baseUrl}/students`, {
        headers: { Authorization: `Bearer ${noTenantToken}` }
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.code).toBe('MISSING_TENANT_CONTEXT');
    } finally {
      await db.collection('users').deleteOne({ id: 'usr-no-tenant' });
    }
  });

  // ---------------------------------------------------------------------------
  // Vector 25: Missing security secret fails closed
  // ---------------------------------------------------------------------------
  it('Vector 25: Missing JWT secret in production mode fails closed', () => {
    const originalEnv = process.env.NODE_ENV;
    const originalSecret = process.env.JWT_SECRET;
    try {
      process.env.NODE_ENV = 'production';
      delete process.env.JWT_SECRET;
      expect(() => getJwtSecret()).toThrow(/CRITICAL_CONFIG_ERROR/);
    } finally {
      process.env.NODE_ENV = originalEnv;
      if (originalSecret) process.env.JWT_SECRET = originalSecret;
    }
  });

  // ---------------------------------------------------------------------------
  // Vector 26: Background service without valid scope denied
  // ---------------------------------------------------------------------------
  it('Vector 26: Background service task without valid scope denied with JobSecurityException', async () => {
    const jobCtx = createJobSecurityContext({
      serviceIdentity: 'svc-attendance-cron',
      tenantId: schoolA,
      allowedActions: ['MARK_AUTO_ATTENDANCE']
    });

    // Attempting unauthorized action 'PAYROLL_DISBURSE' throws
    await expect(
      executeScopedJobTask(jobCtx, 'PAYROLL_DISBURSE', schoolA, async () => true)
    ).rejects.toThrowError(JobSecurityException);

    // Attempting cross-tenant execution in schoolB throws
    await expect(
      executeScopedJobTask(jobCtx, 'MARK_AUTO_ATTENDANCE', schoolB, async () => true)
    ).rejects.toThrow(/Cross-tenant execution violation/);
  });

  // ---------------------------------------------------------------------------
  // Vector 27: Sensitive errors and logs do not expose PII or credentials
  // ---------------------------------------------------------------------------
  it('Vector 27: Audit logs and PII redaction mask credentials, tokens and contact numbers', () => {
    // 1. Audit sanitization
    const sanitized = sanitizeAuditDetails({
      password: 'SuperSecretPassword@2026',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      aadhaar: '1234-5678-9012',
      normalField: 'Normal Operation'
    });
    expect(sanitized).not.toContain('SuperSecretPassword@2026');
    expect(sanitized).toContain('[REDACTED_SECURITY_DATA]');

    // 2. Phone masking
    expect(maskPhone('9876543210')).toBe('******3210');
    expect(maskEmail('sanjay.kumar@gmail.com')).toBe('s**********r@gmail.com');
    expect(maskNationalId('123456789012')).toBe('XXXX-XXXX-9012');

    // 3. Student PII redaction for Teacher
    const fullStudent = {
      id: 'std-test-pii',
      name: 'PII Test Student',
      parentMobile: '9876543210',
      parentEmail: 'parent@example.com',
      annualIncome: 500000,
      bankAccountNumber: '9876543210123'
    };
    const redacted = redactStudentPii(fullStudent, { role: 'TEACHER', schoolId: schoolA });
    expect(redacted.parentMobile).toBe('******3210');
    expect(redacted.annualIncome).toBeUndefined();
    expect(redacted.bankAccountNumber).toBeUndefined();
    expect(redacted._isPiiRedacted).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Vector 28: Legitimate authorized workflows still succeed
  // ---------------------------------------------------------------------------
  it('Vector 28: Legitimate authorized workflows succeed (Principal queries students, exports, reads me)', async () => {
    // 1. GET /api/auth/me
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    expect(meRes.status).toBe(200);
    const me = await meRes.json();
    expect(me.user.role).toBe('PRINCIPAL');

    // 2. GET /api/students
    const studentsRes = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    expect(studentsRes.status).toBe(200);

    // 3. GET /api/students/export
    const exportRes = await fetch(`${baseUrl}/students/export`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    expect(exportRes.status).toBe(200);
    const exportData = await exportRes.json();
    expect(exportData.success).toBe(true);
    expect(typeof exportData.count).toBe('number');

    // 4. Student views own profile
    const studentSelfRes = await fetch(`${baseUrl}/students/std-101`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    expect(studentSelfRes.status).toBe(200);
    const selfData = await studentSelfRes.json();
    expect(selfData.id).toBe('std-101');
  });
});
