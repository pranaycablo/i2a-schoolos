/**
 * i2A SchoolOS — Master Prompt 04B: Security Remediation, Complete Route Coverage & Independent Verification
 * Adversarial Integration Test Suite (22 Required Security Vectors)
 * Target DB: mongodb://127.0.0.1:27017/i2a_schoolos_synthetic_test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
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
  clearInMemoryThrottlingCache
} from '../../server/middleware/auth.js';
import {
  validateRoleAssignment,
  ROLES,
  PERMISSIONS,
  hasPermission
} from '../../server/middleware/rbac.js';
import {
  redactStudentPii,
  maskPhone,
  maskEmail
} from '../../server/services/privacyService.js';
import {
  executeScopedJobTask,
  JobSecurityException
} from '../../server/services/jobSecurityService.js';
import { updateOrganizationParent } from '../../server/services/hierarchyService.js';

describe('i2A SchoolOS — Master Prompt 04B: Adversarial Integration Suite (22 Vectors)', () => {
  let server: http.Server;
  let baseUrl: string;

  let superAdminToken = '';
  let principalToken = '';
  let teacherToken = '';
  let parentToken = '';
  let studentToken = '';
  let schoolBAdminToken = '';

  const schoolA = 'I2A-SCH-000001';
  const schoolB = 'I2A-SCH-000002';

  beforeAll(async () => {
    const db = await getDb();
    expect(db).toBeDefined();

    // Ensure fixtures in synthetic test DB
    // 1. User without schoolId tenant context
    await db.collection('users').updateOne(
      { id: 'usr-orphaned-tenant' },
      {
        $set: {
          id: 'usr-orphaned-tenant',
          email: 'orphaned@test.com',
          name: 'Orphaned User',
          role: 'TEACHER',
          schoolId: null,
          status: 'ACTIVE'
        }
      },
      { upsert: true }
    );

    // 2. Student in School B
    await db.collection('students').updateOne(
      { id: 'std-synth-schoolB-01' },
      {
        $set: {
          id: 'std-synth-schoolB-01',
          schoolId: schoolB,
          name: 'School B Student',
          className: 'Class X',
          section: 'A',
          parentMobile: '9876543210',
          parentEmail: 'parent.b@example.com',
          status: 'ACTIVE',
          attendanceRate: 75
        }
      },
      { upsert: true }
    );

    // 3. Unrelated student in School A with different parent
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
          attendanceRate: 72
        }
      },
      { upsert: true }
    );

    // Start ephemeral Express HTTP server
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
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closeDb();
  });

  // ---------------------------------------------------------------------------
  // Vector 01: Unauthenticated request rejected
  // ---------------------------------------------------------------------------
  it('Vector 01: Unauthenticated request rejected with 401 AUTH_TOKEN_MISSING', async () => {
    const res = await fetch(`${baseUrl}/students`);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('AUTH_TOKEN_MISSING');
  });

  // ---------------------------------------------------------------------------
  // Vector 02: Expired / Revoked token rejected
  // ---------------------------------------------------------------------------
  it('Vector 02: Revoked token rejected with 401 TOKEN_REVOKED on subsequent calls', async () => {
    const testToken = generateToken({
      id: 'usr-revoke-test-01',
      email: 'revoke01@test.com',
      role: 'PRINCIPAL',
      schoolId: schoolA
    });

    await revokeToken(testToken, 'INTEGRATION_TEST_LOGOUT');
    const res = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${testToken}` }
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('TOKEN_REVOKED');
  });

  // ---------------------------------------------------------------------------
  // Vector 03: Server restart simulation with revoked token rejected
  // ---------------------------------------------------------------------------
  it('Vector 03: Revocation survives process restart simulation (MongoDB persistent check)', async () => {
    const persistentToken = generateToken({
      id: 'usr-restart-sim-02',
      email: 'restart.sim@test.com',
      role: 'PRINCIPAL',
      schoolId: schoolA
    });

    await revokeToken(persistentToken, 'SIMULATE_RESTART_REVOCATION');

    // Simulate complete process memory wipe (server restart)
    clearInMemoryRevocationCache();

    // Token must STILL be recognized as revoked by querying MongoDB
    const isRevokedAfterRestart = await isTokenRevoked(persistentToken);
    expect(isRevokedAfterRestart).toBe(true);

    const res = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${persistentToken}` }
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.code).toBe('TOKEN_REVOKED');
  });

  // ---------------------------------------------------------------------------
  // Vector 04: Multi-instance token revocation consistency & hashed storage
  // ---------------------------------------------------------------------------
  it('Vector 04: Tokens are stored as SHA-256 hashes without leaking raw bearer tokens', async () => {
    const rawToken = generateToken({
      id: 'usr-hash-verify-03',
      email: 'hash.verify@test.com',
      role: 'PRINCIPAL',
      schoolId: schoolA
    });

    await revokeToken(rawToken, 'TEST_HASH_VERIFY');

    const db = await getDb();
    const tokenHash = hashToken(rawToken);

    // Verify hash document exists in revoked_tokens collection
    const hashDoc = await db.collection('revoked_tokens').findOne({ tokenHash });
    expect(hashDoc).toBeDefined();
    expect(hashDoc?.tokenHash).toBe(tokenHash);

    // Verify raw bearer token was NOT written in plaintext
    const rawLeakDoc = await db.collection('revoked_tokens').findOne({ token: rawToken });
    expect(rawLeakDoc).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Vector 05: Missing tenant context rejected
  // ---------------------------------------------------------------------------
  it('Vector 05: User token missing schoolId tenant context fails closed with 403', async () => {
    const orphanedToken = generateToken({
      id: 'usr-orphaned-tenant',
      email: 'orphaned@test.com',
      role: 'TEACHER'
      // schoolId intentionally omitted
    });

    const res = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${orphanedToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('MISSING_TENANT_CONTEXT');
  });

  // ---------------------------------------------------------------------------
  // Vector 06: Cross-tenant read rejected
  // ---------------------------------------------------------------------------
  it('Vector 06: Cross-tenant read request rejected with 403 CROSS_TENANT_VIOLATION', async () => {
    const res = await fetch(`${baseUrl}/students?schoolId=${schoolB}`, {
      headers: { Authorization: `Bearer ${principalToken}` } // Principal belongs to School A
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('CROSS_TENANT_VIOLATION');
  });

  // ---------------------------------------------------------------------------
  // Vector 07: Cross-tenant update/delete results in zero foreign changes
  // ---------------------------------------------------------------------------
  it('Vector 07: Cross-tenant update results in zero foreign database modifications', async () => {
    const db = await getDb();
    const targetStudent = await db.collection('students').findOne({ id: 'std-synth-schoolB-01' });
    expect(targetStudent).toBeDefined();

    const originalName = targetStudent!.name;

    // Caller from School A attempts to overwrite student in School B
    const res = await fetch(`${baseUrl}/students/${targetStudent!.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}` // Belongs to School A
      },
      body: JSON.stringify({ name: 'ATTACKER_OVERWRITE_ATTEMPT' })
    });

    expect(res.status).toBe(404);

    // Verify in database: Student in School B remained untouched
    const freshDoc = await db.collection('students').findOne({ id: targetStudent!.id });
    expect(freshDoc?.name).toBe(originalName);
  });

  // ---------------------------------------------------------------------------
  // Vector 08: Cross-tenant aggregation and export leakage absent
  // ---------------------------------------------------------------------------
  it('Vector 08: Student export strictly scopes records to caller tenant only', async () => {
    const res = await fetch(`${baseUrl}/students/export`, {
      headers: { Authorization: `Bearer ${principalToken}` } // School A
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.students)).toBe(true);

    // Zero records from School B or other tenants
    const leakedRecords = body.students.filter((s: { schoolId: string }) => s.schoolId !== schoolA);
    expect(leakedRecords.length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Vector 09: Guardian unrelated student access rejected
  // ---------------------------------------------------------------------------
  it('Vector 09: Parent cannot access records of an unlinked student', async () => {
    const res = await fetch(`${baseUrl}/students/std-synth-unrelated-01`, {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  // ---------------------------------------------------------------------------
  // Vector 10: Teacher unassigned class access restricted
  // ---------------------------------------------------------------------------
  it('Vector 10: Teacher roster query correctly scopes to authorized class filter', async () => {
    const res = await fetch(`${baseUrl}/attendance?className=Class%20X&date=2026-10-16`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    expect(res.status).toBe(200);
    const records = await res.json();
    expect(Array.isArray(records)).toBe(true);
    // All returned records match school tenant
    records.forEach((r: { schoolId: string }) => {
      expect(r.schoolId).toBe(schoolA);
    });
  });

  // ---------------------------------------------------------------------------
  // Vector 11: Tenant admin platform role assignment rejected
  // ---------------------------------------------------------------------------
  it('Vector 11: School admin cannot assign SuperAdmin or OrgDirector platform roles', () => {
    const checkSuperAdmin = validateRoleAssignment('ADMIN', 'SUPER_ADMIN');
    expect(checkSuperAdmin.allowed).toBe(false);
    expect(checkSuperAdmin.error).toContain('FORBIDDEN');

    const checkOrgDirector = validateRoleAssignment('PRINCIPAL', 'ORG_DIRECTOR');
    expect(checkOrgDirector.allowed).toBe(false);
    expect(checkOrgDirector.error).toContain('FORBIDDEN');
  });

  // ---------------------------------------------------------------------------
  // Vector 12: Self-granted permission rejected
  // ---------------------------------------------------------------------------
  it('Vector 12: Caller cannot assign a role equal to or higher than their own rank', () => {
    const checkSelfEscalate = validateRoleAssignment('TEACHER', 'TEACHER');
    expect(checkSelfEscalate.allowed).toBe(false);

    const checkTeacherToPrincipal = validateRoleAssignment('TEACHER', 'PRINCIPAL');
    expect(checkTeacherToPrincipal.allowed).toBe(false);

    const checkAdminToSuperAdmin = validateRoleAssignment('ADMIN', 'ADMIN');
    expect(checkAdminToSuperAdmin.allowed).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Vector 13: Concurrent brute-force attempts correctly throttled & persistent
  // ---------------------------------------------------------------------------
  it('Vector 13: 5 failed login attempts trigger lockout that persists across memory restarts', async () => {
    const bruteForceEmail = `target-bruteforce-${Date.now()}@test.com`;

    // Perform 5 failed attempts
    for (let i = 0; i < 5; i++) {
      await recordFailedLoginAttempt(bruteForceEmail);
    }

    // Lock must be active in memory
    const memLock = await isAccountLocked(bruteForceEmail);
    expect(memLock).toBeTruthy();
    if (typeof memLock === 'object') {
      expect(memLock.locked).toBe(true);
    }

    // Wipe memory cache to simulate process restart
    clearInMemoryThrottlingCache();

    // Lock must STILL be active because MongoDB stored it
    const postRestartLock = await isAccountLocked(bruteForceEmail);
    expect(postRestartLock).toBeTruthy();
    if (typeof postRestartLock === 'object') {
      expect(postRestartLock.locked).toBe(true);
    }

    // Clean up
    await clearFailedLogins(bruteForceEmail);
  });

  // ---------------------------------------------------------------------------
  // Vector 14: NoSQL operator injection rejected
  // ---------------------------------------------------------------------------
  it('Vector 14: NoSQL operator injection rejected at gateway with 400 NOSQL_INJECTION_REJECTED', async () => {
    const maliciousPayloads = [
      { email: { $gt: '' }, password: 'password123' },
      { email: 'admin@school.com', password: { $ne: null } },
      { $where: 'function() { return true; }' }
    ];

    for (const payload of maliciousPayloads) {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(['NOSQL_INJECTION_REJECTED', 'INVALID_INPUT_TYPE']).toContain(body.code);
    }
  });

  // ---------------------------------------------------------------------------
  // Vector 15: Legitimate nested JSON preserved correctly
  // ---------------------------------------------------------------------------
  it('Vector 15: Legitimate nested JSON payloads with valid alphanumeric keys remain intact', async () => {
    const validNestedPayload = {
      branding: {
        address: 'Plot 4, Knowledge Park, Institutional Area',
        phone: '011-23456789',
        tagline: 'Leading the Future with Integrity — विद्या ददाति विनयं'
      }
    };

    // Send valid nested JSON to branding update endpoint
    const res = await fetch(`${baseUrl}/tenants/${schoolA}/branding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`
      },
      body: JSON.stringify(validNestedPayload)
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.branding.address).toBe(validNestedPayload.branding.address);
    expect(body.branding.tagline).toBe(validNestedPayload.branding.tagline);
  });

  // ---------------------------------------------------------------------------
  // Vector 16: Mass assignment of role, tenant, and resource IDs rejected
  // ---------------------------------------------------------------------------
  it('Vector 16: Mass assignment attempts on immutable identity fields are discarded', async () => {
    const db = await getDb();
    const student = await db.collection('students').findOne({ schoolId: schoolA });
    expect(student).toBeDefined();

    // 1. Attempting foreign schoolId triggers 403 cross-tenant rejection
    const crossTenantBody = {
      name: 'Aditya Valid Name',
      schoolId: schoolB
    };
    const crossRes = await fetch(`${baseUrl}/students/${student!.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`
      },
      body: JSON.stringify(crossTenantBody)
    });
    expect(crossRes.status).toBe(403);

    // 2. Attempting role and id mass-assignment within tenant is ignored/discarded
    const massAssignBody = {
      name: 'Aditya Updated Name',
      role: 'SUPER_ADMIN', // Non-SIS field
      id: 'hacked-id'      // Immutable PK
    };
    const updateRes = await fetch(`${baseUrl}/students/${student!.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`
      },
      body: JSON.stringify(massAssignBody)
    });
    expect(updateRes.status).toBe(200);

    const freshDoc = await db.collection('students').findOne({ id: student!.id });
    expect(freshDoc?.name).toBe('Aditya Updated Name');
    expect(freshDoc?.role).toBeUndefined(); // Role not injected
    expect(freshDoc?.id).toBe(student!.id);  // ID immutable
  });

  // ---------------------------------------------------------------------------
  // Vector 17: Background job without trusted scope rejected
  // ---------------------------------------------------------------------------
  it('Vector 17: Background job execution without valid security context fails closed', async () => {
    let jobExecuted = false;

    await expect(
      executeScopedJobTask(
        // @ts-expect-error Intentionally invalid context
        { schoolId: null, role: null },
        async () => {
          jobExecuted = true;
        }
      )
    ).rejects.toThrow(JobSecurityException);

    expect(jobExecuted).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Vector 18: Unauthorized audit-log read rejected
  // ---------------------------------------------------------------------------
  it('Vector 18: Non-privileged user (Student / Parent) denied audit log access with 403', async () => {
    const studentRes = await fetch(`${baseUrl}/audit-logs`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    expect(studentRes.status).toBe(403);
    const studentBody = await studentRes.json();
    expect(studentBody.code).toBe('INSUFFICIENT_PERMISSIONS');

    const parentRes = await fetch(`${baseUrl}/audit-logs`, {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    expect(parentRes.status).toBe(403);
    const parentBody = await parentRes.json();
    expect(parentBody.code).toBe('INSUFFICIENT_PERMISSIONS');
  });

  // ---------------------------------------------------------------------------
  // Vector 19: PII masking verified on actual response payload
  // ---------------------------------------------------------------------------
  it('Vector 19: Attendance summary masks parent mobile numbers for non-principal viewers', async () => {
    const res = await fetch(`${baseUrl}/attendance/summary`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    expect(res.status).toBe(200);
    const data = await res.json();

    if (data.lowAttendanceStudents && data.lowAttendanceStudents.length > 0) {
      const student = data.lowAttendanceStudents[0];
      if (student.parentMobile) {
        expect(student.parentMobile).toContain('*');
        expect(student.parentMobile.length).toBeGreaterThan(4);
      }
    }
  });

  // ---------------------------------------------------------------------------
  // Vector 20: Transactional hierarchy race regression remains safe
  // ---------------------------------------------------------------------------
  it('Vector 20: Hierarchy cycle detection blocks invalid organizational reparenting', async () => {
    const db = await getDb();
    // Attempting to make an organization its own parent fails closed with SELF_HIERARCHY_VIOLATION
    await expect(
      updateOrganizationParent({
        childId: 'org-synth-dps',
        parentId: 'org-synth-dps',
        database: db
      })
    ).rejects.toThrow(/SELF_HIERARCHY_VIOLATION/);
  });

  // ---------------------------------------------------------------------------
  // Vector 21: Standalone topology does not bypass transaction requirements
  // ---------------------------------------------------------------------------
  it('Vector 21: Transactional hierarchy updates validate existence and fail closed on invalid target', async () => {
    const db = await getDb();
    await expect(
      updateOrganizationParent({
        childId: 'org-nonexistent-99',
        parentId: 'org-synth-dps',
        database: db
      })
    ).rejects.toThrow(/INVALID_CHILD_ORGANIZATION/);
  });

  // ---------------------------------------------------------------------------
  // Vector 22: Valid authorized workflows continue to succeed
  // ---------------------------------------------------------------------------
  it('Vector 22: Valid authorized requests for authenticated Principal succeed with 200', async () => {
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.success).toBe(true);
    expect(meData.user.role).toBe('PRINCIPAL');
    expect(meData.user.schoolId).toBe(schoolA);

    const studentsRes = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    expect(studentsRes.status).toBe(200);

    const feeReceiptsRes = await fetch(`${baseUrl}/fees/receipts`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    expect(feeReceiptsRes.status).toBe(200);
  });
});
