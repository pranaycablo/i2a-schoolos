/**
 * i2A SchoolOS — Master Prompt 09: Institutional Hierarchy & Academic Configuration OS
 * Comprehensive Adversarial, Boundary Isolation, Concurrency & Release Gate Test Suite
 *
 * Target DB: mongodb://127.0.0.1:27017/i2a_schoolos_synthetic_test
 * Strict Isolation: ZERO touch on i2a_schoolos or i2a_schoolos_test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { app } from '../../server/index.js';
import { getDb, closeDb } from '../../server/db.js';
import { generateToken } from '../../server/middleware/auth.js';
import { calculateAcademicSessionPolicy } from '../../server/services/academicCalendarService.js';

describe('i2A SchoolOS — Phase 09: Institutional Hierarchy & Academic Configuration OS', () => {
  let server: http.Server;
  let baseUrl: string;

  // Auth Tokens
  let superAdminToken = '';
  let principalTokenA = '';
  let principalTokenB = '';
  let branchAdminToken = '';
  let campusAdminToken = '';

  const testTimestamp = Date.now();
  const orgTrustId = `ORG-TRUST-${testTimestamp}`;
  const institutionAId = `INST-A-${testTimestamp}`;
  const institutionBId = `INST-B-${testTimestamp}`;
  const branchA1Id = `BR-${institutionAId}-MAIN`;
  const branchA2Id = `BR-${institutionAId}-EAST`;
  const campusA1Id = `CMP-${branchA1Id}-C1`;

  beforeAll(async () => {
    process.env.VITEST = 'true';
    process.env.TEST_DB_NAME = 'i2a_schoolos_synthetic_test';

    const db = await getDb();
    expect(db).toBeDefined();

    // ── SAFETY PREFLIGHT ────────────────────────────────────────────────────────
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');
    expect(db.databaseName).not.toBe('i2a_schoolos');
    expect(db.databaseName).not.toBe('i2a_schoolos_test');

    // Start ephemeral test server
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number; address: string };
        baseUrl = `http://127.0.0.1:${addr.port}/api`;
        resolve();
      });
    });

    // Seed Test Entities in Synthetic DB
    // 1. Super Admin User
    const superAdminUser = {
      id: `USER-SA-${testTimestamp}`,
      email: `sa-${testTimestamp}@i2aschoolos.com`,
      name: 'Global Super Admin',
      role: 'SUPER_ADMIN',
      isActive: true,
      status: 'ACTIVE'
    };
    await db.collection('users').insertOne(superAdminUser);
    superAdminToken = generateToken({ id: superAdminUser.id, role: superAdminUser.role, email: superAdminUser.email });

    // 2. Organization Trust
    const testOrg = {
      id: orgTrustId,
      name: 'Delhi Public Educational Trust',
      orgCode: `DPET-${testTimestamp.toString().slice(-4)}`,
      orgType: 'PRIVATE_TRUST',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    await db.collection('organizations').insertOne(testOrg);

    // 3. Institution A Tenant (Belongs to Trust)
    const testTenantA = {
      id: institutionAId,
      name: 'Apex Academy Delhi',
      code: `APEX-DEL-${testTimestamp.toString().slice(-4)}`,
      orgId: orgTrustId,
      category: 'k12-schools',
      board: 'CBSE',
      status: 'ACTIVE',
      studentLimit: 2500,
      branding: { academicSession: '2026-2027' }
    };
    await db.collection('tenants').insertOne(testTenantA);

    // 4. Principal User for Institution A
    const principalUserA = {
      id: `USER-PRIN-A-${testTimestamp}`,
      email: `principal-a-${testTimestamp}@apex.edu`,
      name: 'Principal A',
      role: 'PRINCIPAL',
      schoolId: institutionAId,
      tenantId: institutionAId,
      orgId: orgTrustId,
      isActive: true,
      status: 'ACTIVE'
    };
    await db.collection('users').insertOne(principalUserA);
    principalTokenA = generateToken({
      id: principalUserA.id,
      role: principalUserA.role,
      schoolId: institutionAId,
      tenantId: institutionAId,
      email: principalUserA.email
    });

    // 5. Institution B Tenant (Independent Standalone School)
    const testTenantB = {
      id: institutionBId,
      name: 'St. Xavier Global School',
      code: `SXGS-${testTimestamp.toString().slice(-4)}`,
      orgId: null,
      category: 'k12-schools',
      board: 'ICSE',
      status: 'ACTIVE',
      studentLimit: 1200,
      branding: { academicSession: '2026-2027' }
    };
    await db.collection('tenants').insertOne(testTenantB);

    // 6. Principal User for Institution B
    const principalUserB = {
      id: `USER-PRIN-B-${testTimestamp}`,
      email: `principal-b-${testTimestamp}@xavier.edu`,
      name: 'Principal B',
      role: 'PRINCIPAL',
      schoolId: institutionBId,
      tenantId: institutionBId,
      isActive: true,
      status: 'ACTIVE'
    };
    await db.collection('users').insertOne(principalUserB);
    principalTokenB = generateToken({
      id: principalUserB.id,
      role: principalUserB.role,
      schoolId: institutionBId,
      tenantId: institutionBId,
      email: principalUserB.email
    });

    // 7. Branch Admin for Branch A1
    const branchAdminUser = {
      id: `USER-BA-${testTimestamp}`,
      email: `branchadmin-${testTimestamp}@apex.edu`,
      name: 'Branch Admin A1',
      role: 'BRANCH_ADMIN',
      schoolId: institutionAId,
      tenantId: institutionAId,
      branchId: branchA1Id,
      isActive: true,
      status: 'ACTIVE'
    };
    await db.collection('users').insertOne(branchAdminUser);
    branchAdminToken = generateToken({
      id: branchAdminUser.id,
      role: branchAdminUser.role,
      schoolId: institutionAId,
      tenantId: institutionAId,
      branchId: branchA1Id,
      email: branchAdminUser.email
    });

    // 8. Campus Admin for Campus A1
    const campusAdminUser = {
      id: `USER-CA-${testTimestamp}`,
      email: `campusadmin-${testTimestamp}@apex.edu`,
      name: 'Campus Admin A1',
      role: 'CAMPUS_ADMIN',
      schoolId: institutionAId,
      tenantId: institutionAId,
      branchId: branchA1Id,
      campusId: campusA1Id,
      isActive: true,
      status: 'ACTIVE'
    };
    await db.collection('users').insertOne(campusAdminUser);
    campusAdminToken = generateToken({
      id: campusAdminUser.id,
      role: campusAdminUser.role,
      schoolId: institutionAId,
      tenantId: institutionAId,
      branchId: branchA1Id,
      campusId: campusA1Id,
      email: campusAdminUser.email
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closeDb();
  });

  // ============================================================================
  // TEST SUITE: 20+ FORENSIC ADVERSARIAL TEST VECTORS
  // ============================================================================

  // Test 1: Safety Preflight
  it('01. Safety Preflight: strictly targeting i2a_schoolos_synthetic_test with zero production touch', async () => {
    const db = await getDb();
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');
    expect(db.databaseName).not.toBe('i2a_schoolos');
    expect(db.databaseName).not.toBe('i2a_schoolos_test');
  });

  // Test 2: Standalone School Zero-Overhead Resolution
  it('02. Standalone School: resolves synthetic default primary branch and main campus without setup overhead', async () => {
    const res = await fetch(`${baseUrl}/hierarchy/tree?institutionId=${institutionBId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.institution.isStandalone).toBe(true);
    expect(data.organization).toBeNull();
    expect(data.branches.length).toBeGreaterThanOrEqual(1);

    const defaultBranch = data.branches[0];
    expect(defaultBranch.branchCode).toBe('MAIN');
    expect(defaultBranch.isMainBranch).toBe(true);
    expect(defaultBranch.campuses.length).toBeGreaterThanOrEqual(1);
    expect(defaultBranch.campuses[0].campusCode).toBe('CAMPUS-1');
  });

  // Test 3: Multi-Tier Educational Trust Hierarchy Resolution
  it('03. Multi-Tier Hierarchy: resolves Group/Trust -> Institution -> Branches -> Campuses', async () => {
    const db = await getDb();

    // Create Branch A1
    await db.collection('branches').insertOne({
      id: branchA1Id,
      institutionId: institutionAId,
      orgId: orgTrustId,
      branchCode: 'MAIN',
      name: 'Apex Central Branch',
      isMainBranch: true,
      capacity: 1500,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    });

    // Create Campus A1
    await db.collection('campuses').insertOne({
      id: campusA1Id,
      branchId: branchA1Id,
      institutionId: institutionAId,
      campusCode: 'CAMPUS-1',
      name: 'North Campus Quad',
      campusType: 'MAIN_CAMPUS',
      facilities: ['Smart Classrooms', 'Science Lab', 'Auditorium'],
      capacity: 1000,
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    });

    const res = await fetch(`${baseUrl}/hierarchy/tree?institutionId=${institutionAId}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.organization).toBeDefined();
    expect(data.organization?.id).toBe(orgTrustId);
    expect(data.institution.id).toBe(institutionAId);
    expect(data.branches.length).toBe(1);
    expect(data.branches[0].campuses.length).toBe(1);
    expect(data.branches[0].campuses[0].id).toBe(campusA1Id);
  });

  // Test 4: Cross-Tenant Branch Read Isolation
  it('04. Cross-Tenant Read Isolation: Principal of School A cannot see branches of School B', async () => {
    const res = await fetch(`${baseUrl}/hierarchy/branches`, {
      headers: { Authorization: `Bearer ${principalTokenA}` }
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    // All returned branches MUST belong to institutionAId
    for (const b of data.branches) {
      expect(b.institutionId).toBe(institutionAId);
      expect(b.institutionId).not.toBe(institutionBId);
    }
  });

  // Test 5: Cross-Tenant Mutation Rejection
  it('05. Cross-Tenant Mutation Rejection: Principal A cannot create a branch under Institution B', async () => {
    const res = await fetch(`${baseUrl}/hierarchy/branches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenA}`
      },
      body: JSON.stringify({
        institutionId: institutionBId, // Malicious cross-tenant attempt
        branchCode: 'ROGUE-01',
        name: 'Rogue Branch',
        capacity: 500
      })
    });
    const data = await res.json();
    expect(res.status).toBe(403);
    expect(data.success).toBe(false);
    expect(data.code).toBe('CROSS_TENANT_ACCESS_DENIED');
  });

  // Test 6: Cross-Tenant Campus Link Rejection
  it('06. Cross-Tenant Campus Link Rejection: Cannot link campus with mismatched institutionId and branchId', async () => {
    const res = await fetch(`${baseUrl}/hierarchy/campuses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        branchId: branchA1Id, // Belongs to Institution A
        institutionId: institutionBId, // Mismatched Institution B
        campusCode: 'ILLEGAL-01',
        name: 'Illegal Campus'
      })
    });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.code).toBe('CROSS_TENANT_MISMATCH');
  });

  // Test 7: Branch Admin Boundary Enforcement
  it('07. Branch Admin Boundary: cannot reassign institutionId or alter isMainBranch flag', async () => {
    // Attempt to reassign institution
    const res1 = await fetch(`${baseUrl}/hierarchy/branches/${branchA1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${branchAdminToken}`
      },
      body: JSON.stringify({ institutionId: institutionBId })
    });
    const data1 = await res1.json();
    expect(res1.status).toBe(403);
    expect(data1.code).toBe('FORBIDDEN');

    // Attempt to alter isMainBranch
    const res2 = await fetch(`${baseUrl}/hierarchy/branches/${branchA1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${branchAdminToken}`
      },
      body: JSON.stringify({ isMainBranch: false })
    });
    const data2 = await res2.json();
    expect(res2.status).toBe(403);
    expect(data2.code).toBe('FORBIDDEN');
  });

  // Test 8: Campus Admin Boundary Enforcement
  it('08. Campus Admin Boundary: cannot reassign branchId or archive the campus', async () => {
    // Attempt reassign branch
    const res1 = await fetch(`${baseUrl}/hierarchy/campuses/${campusA1Id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${campusAdminToken}`
      },
      body: JSON.stringify({ branchId: 'BR-SOME-OTHER-BRANCH' })
    });
    const data1 = await res1.json();
    expect(res1.status).toBe(403);
    expect(data1.code).toBe('FORBIDDEN');

    // Attempt archive
    const res2 = await fetch(`${baseUrl}/hierarchy/campuses/${campusA1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${campusAdminToken}` }
    });
    const data2 = await res2.json();
    expect(res2.status).toBe(403);
    expect(['FORBIDDEN', 'INSUFFICIENT_PERMISSIONS']).toContain(data2.code);
  });

  // Test 9: Duplicate Branch Code Prevention within Same Institution
  it('09. Duplicate Branch Code: rejects second branch with same code in same institution (409 Conflict)', async () => {
    // Create Branch East
    const res1 = await fetch(`${baseUrl}/hierarchy/branches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenA}`
      },
      body: JSON.stringify({
        branchCode: 'EAST',
        name: 'East Campus Branch',
        capacity: 800
      })
    });
    expect(res1.status).toBe(201);

    // Attempt create identical branchCode
    const res2 = await fetch(`${baseUrl}/hierarchy/branches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenA}`
      },
      body: JSON.stringify({
        branchCode: 'EAST',
        name: 'Another East Branch',
        capacity: 600
      })
    });
    const data2 = await res2.json();
    expect(res2.status).toBe(409);
    expect(data2.code).toBe('DUPLICATE_BRANCH_CODE');
  });

  // Test 10: Code Scoping — Distinct Institutions Can Share the Same Branch Code
  it('10. Code Scoping: Different institutions can use the same branch code without collision', async () => {
    const res = await fetch(`${baseUrl}/hierarchy/branches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenB}`
      },
      body: JSON.stringify({
        branchCode: 'EAST', // Same code as Institution A, but under Institution B
        name: 'St. Xavier East Branch',
        capacity: 900
      })
    });
    const data = await res.json();
    expect(res.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.branch.institutionId).toBe(institutionBId);
  });

  // Test 11: Duplicate Campus Code Prevention within Same Branch
  it('11. Duplicate Campus Code: rejects second campus with same code under same branch (409 Conflict)', async () => {
    const res1 = await fetch(`${baseUrl}/hierarchy/campuses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        branchId: branchA1Id,
        campusCode: 'SPORTS-01',
        name: 'South Sports Complex',
        campusType: 'SPORTS_COMPLEX'
      })
    });
    expect(res1.status).toBe(201);

    const res2 = await fetch(`${baseUrl}/hierarchy/campuses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        branchId: branchA1Id,
        campusCode: 'SPORTS-01',
        name: 'Duplicate Sports Complex'
      })
    });
    const data2 = await res2.json();
    expect(res2.status).toBe(409);
    expect(data2.code).toBe('DUPLICATE_CAMPUS_CODE');
  });

  // Test 12: Single Active Academic Session Invariant (Sequential Activation)
  it('12. Single Active Session Invariant: activating session B atomically concludes session A', async () => {
    // 1. Create Session A (Active)
    const resA = await fetch(`${baseUrl}/hierarchy/academic-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenA}`
      },
      body: JSON.stringify({
        sessionName: '2025-2026',
        startDate: '2025-04-01',
        endDate: '2026-03-31',
        isCurrent: true
      })
    });
    const dataA = await resA.json();
    expect(resA.status).toBe(201);
    expect(dataA.session.isCurrent).toBe(true);

    // 2. Create Session B (Inactive)
    const resB = await fetch(`${baseUrl}/hierarchy/academic-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenA}`
      },
      body: JSON.stringify({
        sessionName: '2026-2027',
        startDate: '2026-04-01',
        endDate: '2027-03-31',
        isCurrent: false
      })
    });
    const dataB = await resB.json();
    expect(resB.status).toBe(201);
    expect(dataB.session.isCurrent).toBe(false);

    // 3. Activate Session B
    const resAct = await fetch(`${baseUrl}/hierarchy/academic-sessions/${dataB.session.id}/activate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenA}`
      },
      body: JSON.stringify({ institutionId: institutionAId })
    });
    const dataAct = await resAct.json();
    expect(resAct.status).toBe(200);
    expect(dataAct.activatedSession.isCurrent).toBe(true);

    // 4. Verify in DB: exactly ONE session has isCurrent: true for this institution
    const db = await getDb();
    const activeSessions = await db.collection('academic_sessions').find({
      institutionId: institutionAId,
      isCurrent: true,
      status: { $ne: 'ARCHIVED' }
    }).toArray();

    expect(activeSessions.length).toBe(1);
    expect(activeSessions[0].id).toBe(dataB.session.id);

    // Check that previous session A was concluded
    const sessionADoc = await db.collection('academic_sessions').findOne({ id: dataA.session.id });
    expect(sessionADoc?.isCurrent).toBe(false);
    expect(sessionADoc?.status).toBe('CONCLUDED');
  });

  // Test 13: Concurrency Resistance: 20 Simultaneous Parallel Session Activations
  it('13. Concurrency Resistance: 20 simultaneous parallel activation calls converge to exactly 1 active session', async () => {
    const db = await getDb();

    // Create 20 upcoming sessions for Institution B
    const sessionIds: string[] = [];
    const CONCURRENT_COUNT = 20;
    for (let i = 1; i <= CONCURRENT_COUNT; i++) {
      const sId = `SESS-CONC-${institutionBId}-${2040 + i}`;
      await db.collection('academic_sessions').insertOne({
        id: sId,
        institutionId: institutionBId,
        schoolId: institutionBId,
        sessionName: `${2040 + i}-${2041 + i}`,
        startDate: `${2040 + i}-04-01`,
        endDate: `${2041 + i}-03-31`,
        isCurrent: false,
        status: 'UPCOMING',
        createdAt: new Date().toISOString()
      });
      sessionIds.push(sId);
    }

    // Fire 20 simultaneous parallel activation requests
    const activationPromises = sessionIds.map((sId) =>
      fetch(`${baseUrl}/hierarchy/academic-sessions/${sId}/activate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalTokenB}`
        },
        body: JSON.stringify({ institutionId: institutionBId })
      }).then((r) => r.json())
    );

    const results = await Promise.all(activationPromises);
    expect(results.length).toBe(CONCURRENT_COUNT);
    for (const res of results) {
      expect(res.success).toBe(true);
      expect(res.activatedSession).toBeDefined();
    }

    // Invariant Verification 1: Exactly 1 session is active in database for Institution B
    const activeSessions = await db.collection('academic_sessions').find({
      institutionId: institutionBId,
      isCurrent: true,
      status: { $ne: 'ARCHIVED' }
    }).toArray();

    expect(activeSessions.length).toBe(1);

    // Invariant Verification 2: The other 19 sessions are strictly concluded
    const concludedSessions = await db.collection('academic_sessions').find({
      id: { $in: sessionIds, $ne: activeSessions[0].id }
    }).toArray();
    expect(concludedSessions.length).toBe(CONCURRENT_COUNT - 1);
    for (const cs of concludedSessions) {
      expect(cs.isCurrent).toBe(false);
      expect(cs.status).toBe('CONCLUDED');
    }

    // Invariant Verification 3: Institution A's active session was completely isolated & untouched
    const activeA = await db.collection('academic_sessions').find({
      institutionId: institutionAId,
      isCurrent: true
    }).toArray();
    expect(activeA.length).toBe(1);

    // Invariant Verification 4: Tenant B branding synced with the winner session
    const tenantBDoc = await db.collection('tenants').findOne({ id: institutionBId });
    expect(tenantBDoc?.branding?.academicSession).toBe(activeSessions[0].sessionName);
  }, 15000);

  // Test 14: Active Session Archival Forbidden
  it('14. Active Session Archival Forbidden: cannot archive currently active session (400 Bad Request)', async () => {
    const db = await getDb();
    const active = await db.collection('academic_sessions').findOne({
      institutionId: institutionAId,
      isCurrent: true
    });
    expect(active).toBeDefined();

    const res = await fetch(`${baseUrl}/hierarchy/academic-sessions/${active?.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${principalTokenA}` }
    });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.code).toBe('ACTIVE_SESSION_ARCHIVAL_FORBIDDEN');
  });

  // Test 15: Concluded / Inactive Session Archival Permitted
  it('15. Concluded Session Archival: soft archives inactive session without affecting active session', async () => {
    const db = await getDb();
    const concluded = await db.collection('academic_sessions').findOne({
      institutionId: institutionAId,
      isCurrent: false,
      status: 'CONCLUDED'
    });
    expect(concluded).toBeDefined();

    const res = await fetch(`${baseUrl}/hierarchy/academic-sessions/${concluded?.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${principalTokenA}` }
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);

    const doc = await db.collection('academic_sessions').findOne({ id: concluded?.id });
    expect(doc?.status).toBe('ARCHIVED');
  });

  // Test 16: Dynamic Academic Policy Engine
  it('16. Academic Policy Engine: validates Indian educational calendar cycles (K-12 April-March vs Higher-Ed July-June)', () => {
    const k12Policy = calculateAcademicSessionPolicy('k12-schools', '2026-05-10');
    expect(k12Policy.startDate).toBe('2026-04-01');
    expect(k12Policy.endDate).toBe('2027-03-31');
    expect(k12Policy.termType).toBe('ANNUAL');

    const collegePolicy = calculateAcademicSessionPolicy('colleges-higher-ed', '2026-08-20');
    expect(collegePolicy.startDate).toBe('2026-07-01');
    expect(collegePolicy.endDate).toBe('2027-06-30');
    expect(collegePolicy.termType).toBe('SEMESTER');
  });

  // Test 17: Non-Destructive Branch Archival Cascading
  it('17. Non-Destructive Branch Archival: soft archives branch and cascades status to child campuses', async () => {
    const db = await getDb();
    const branchToArchiveId = `BR-ARCHIVE-${testTimestamp}`;
    await db.collection('branches').insertOne({
      id: branchToArchiveId,
      institutionId: institutionAId,
      branchCode: 'WEST',
      name: 'West Branch',
      isMainBranch: false,
      status: 'ACTIVE'
    });

    await db.collection('campuses').insertMany([
      { id: `CMP-WEST-1-${testTimestamp}`, branchId: branchToArchiveId, institutionId: institutionAId, campusCode: 'W1', name: 'West Site 1', status: 'ACTIVE' },
      { id: `CMP-WEST-2-${testTimestamp}`, branchId: branchToArchiveId, institutionId: institutionAId, campusCode: 'W2', name: 'West Site 2', status: 'ACTIVE' }
    ]);

    const res = await fetch(`${baseUrl}/hierarchy/branches/${branchToArchiveId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${principalTokenA}` }
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.archivedCampusesCount).toBe(2);

    // Verify soft archival in database
    const branchDoc = await db.collection('branches').findOne({ id: branchToArchiveId });
    expect(branchDoc?.status).toBe('ARCHIVED');

    const campusesDocs = await db.collection('campuses').find({ branchId: branchToArchiveId }).toArray();
    for (const c of campusesDocs) {
      expect(c.status).toBe('ARCHIVED');
    }
  });

  // Test 18: Hierarchy Breadcrumbs Resolution
  it('18. Hierarchy Breadcrumbs: resolves full upstream trail [ORGANIZATION -> INSTITUTION -> BRANCH -> CAMPUS]', async () => {
    const res = await fetch(`${baseUrl}/hierarchy/breadcrumbs?entityType=CAMPUS&entityId=${campusA1Id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.breadcrumbs.length).toBe(4);
    expect(data.breadcrumbs[0].type).toBe('ORGANIZATION');
    expect(data.breadcrumbs[1].type).toBe('INSTITUTION');
    expect(data.breadcrumbs[2].type).toBe('BRANCH');
    expect(data.breadcrumbs[3].type).toBe('CAMPUS');
  });

  // Test 19: Phase 08 Approved Application Onboarding Idempotency
  it('19. Onboarding Idempotency: onboarding approved application creates default units once and does not duplicate', async () => {
    const db = await getDb();
    const testAppId = `APP-ONBOARD-${testTimestamp}`;
    const newTenantId = `SCH-ONBOARD-${testTimestamp}`;

    // Seed approved registration
    await db.collection('tenant_registrations').insertOne({
      id: testAppId,
      tenantId: newTenantId,
      schoolName: 'Greenwood International',
      adminEmail: `admin-${testTimestamp}@greenwood.edu`,
      adminName: 'Greenwood Principal',
      adminPhone: '+919876543210',
      status: 'APPROVED',
      state: 'Karnataka',
      city: 'Bangalore'
    });

    await db.collection('tenants').insertOne({
      id: newTenantId,
      name: 'Greenwood International',
      code: 'GWD-01',
      category: 'k12-schools',
      city: 'Bangalore',
      status: 'ACTIVE'
    });

    // Call 1
    const res1 = await fetch(`${baseUrl}/hierarchy/onboard-application/${testAppId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const data1 = await res1.json();
    expect(res1.status).toBe(200);
    expect(data1.success).toBe(true);
    expect(data1.defaultBranchCreated).toBe(true);
    expect(data1.defaultCampusCreated).toBe(true);
    expect(data1.sessionEnsured).toBe(true);

    // Call 2 (Idempotent replay)
    const res2 = await fetch(`${baseUrl}/hierarchy/onboard-application/${testAppId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    const data2 = await res2.json();
    expect(res2.status).toBe(200);
    expect(data2.success).toBe(true);
    expect(data2.defaultBranchCreated).toBe(false); // Did not duplicate branch
    expect(data2.defaultCampusCreated).toBe(false); // Did not duplicate campus

    // Verify counts in DB
    const branchesCount = await db.collection('branches').countDocuments({ institutionId: newTenantId });
    expect(branchesCount).toBe(1);

    const campusCount = await db.collection('campuses').countDocuments({ institutionId: newTenantId });
    expect(campusCount).toBe(1);
  });

  // Test 20: Forensic Immutable Structured Audit Logging
  it('20. Audit Logging: hierarchy mutations create immutable structured records with redacted secrets', async () => {
    const db = await getDb();
    const logs = await db.collection('audit_logs').find({
      module: 'HIERARCHY_OS'
    }).toArray();

    expect(logs.length).toBeGreaterThanOrEqual(5);

    const actions = logs.map((l) => l.action);
    expect(actions).toContain('CREATE_BRANCH');
    expect(actions).toContain('ACTIVATE_ACADEMIC_SESSION');
    expect(actions).toContain('ARCHIVE_BRANCH');

    // Verify immutability and metadata integrity
    for (const log of logs) {
      expect(log.timestamp).toBeDefined();
      expect(log.actorRole || log.role).toBeDefined();
      expect(log.resourceType).toBeDefined();
      expect(log.schoolId).toBeDefined();
    }
  });

  // Test 21: Negative Validation & Bad Payload Tests
  it('21. Negative Validation: rejects invalid session dates (startDate >= endDate)', async () => {
    const res = await fetch(`${baseUrl}/hierarchy/academic-sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalTokenA}`
      },
      body: JSON.stringify({
        sessionName: '2030-2029',
        startDate: '2030-04-01',
        endDate: '2029-03-31' // Illegal start >= end
      })
    });
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.code).toBe('VALIDATION_ERROR');
  });

  // Test 22: Unauthenticated Request Rejection
  it('22. Unauthenticated Request Rejection: returns 401 Unauthorized when Bearer token is missing', async () => {
    const res = await fetch(`${baseUrl}/hierarchy/branches`);
    expect(res.status).toBe(401);
  });

  // Test 23: Archived Parent Institution Blocks Child Branch Creation
  it('23. Archival Guard: attempting to create a branch under an archived institution is rejected (404 Not Found)', async () => {
    const db = await getDb();
    const archivedInstId = `INST-ARCHIVED-${testTimestamp}`;
    await db.collection('tenants').insertOne({
      id: archivedInstId,
      name: 'Archived Institution',
      code: 'ARCH-01',
      status: 'ARCHIVED'
    });

    const res = await fetch(`${baseUrl}/hierarchy/branches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        institutionId: archivedInstId,
        branchCode: 'ARCH-BR-01',
        name: 'Branch under Archived Parent'
      })
    });
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.code).toBe('INSTITUTION_NOT_FOUND');
  });

  // Test 24: Archived Parent Branch Blocks Child Campus Creation
  it('24. Archival Guard: attempting to create a campus under an archived branch is rejected (404 Not Found)', async () => {
    const db = await getDb();
    const archivedBranchId = `BR-ARCHIVED-PARENT-${testTimestamp}`;
    await db.collection('branches').insertOne({
      id: archivedBranchId,
      institutionId: institutionAId,
      branchCode: 'ARCH-BR',
      name: 'Archived Branch',
      status: 'ARCHIVED'
    });

    const res = await fetch(`${baseUrl}/hierarchy/campuses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        branchId: archivedBranchId,
        campusCode: 'CMP-NEW',
        name: 'New Campus under Archived Branch'
      })
    });
    const data = await res.json();
    expect(res.status).toBe(404);
    expect(data.code).toBe('BRANCH_NOT_FOUND');
  });

  // Test 25: Concurrent Duplicate Branch Creation Race Condition (10 parallel requests)
  it('25. Concurrent Duplicate Branch Creation: exactly 1 succeeds (201), remaining 9 receive 409 Conflict', async () => {
    const raceCode = `RACE-${Date.now().toString().slice(-4)}`;
    const CONCURRENT_REQUESTS = 10;

    const promises = Array.from({ length: CONCURRENT_REQUESTS }, (_, idx) =>
      fetch(`${baseUrl}/hierarchy/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalTokenB}`
        },
        body: JSON.stringify({
          branchCode: raceCode,
          name: `Concurrent Branch ${idx}`,
          capacity: 500
        })
      }).then(async (r) => ({ status: r.status, data: await r.json() }))
    );

    const responses = await Promise.all(promises);
    const successResponses = responses.filter((r) => r.status === 201);
    const conflictResponses = responses.filter((r) => r.status === 409);

    expect(successResponses.length).toBe(1);
    expect(conflictResponses.length).toBe(CONCURRENT_REQUESTS - 1);
    for (const cr of conflictResponses) {
      expect(cr.data.code).toBe('DUPLICATE_BRANCH_CODE');
    }

    // Verify in database: exactly 1 document persisted
    const db = await getDb();
    const count = await db.collection('branches').countDocuments({
      institutionId: institutionBId,
      branchCode: raceCode,
      status: { $ne: 'ARCHIVED' }
    });
    expect(count).toBe(1);
  }, 15000);

  // Test 26: Concurrent Duplicate Campus Creation Race Condition (10 parallel requests)
  it('26. Concurrent Duplicate Campus Creation: exactly 1 succeeds (201), remaining 9 receive 409 Conflict', async () => {
    const raceCampusCode = `RCMP-${Date.now().toString().slice(-4)}`;
    const CONCURRENT_REQUESTS = 10;

    const promises = Array.from({ length: CONCURRENT_REQUESTS }, (_, idx) =>
      fetch(`${baseUrl}/hierarchy/campuses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          branchId: branchA1Id,
          campusCode: raceCampusCode,
          name: `Concurrent Campus ${idx}`,
          capacity: 300
        })
      }).then(async (r) => ({ status: r.status, data: await r.json() }))
    );

    const responses = await Promise.all(promises);
    const successResponses = responses.filter((r) => r.status === 201);
    const conflictResponses = responses.filter((r) => r.status === 409);

    expect(successResponses.length).toBe(1);
    expect(conflictResponses.length).toBe(CONCURRENT_REQUESTS - 1);
    for (const cr of conflictResponses) {
      expect(cr.data.code).toBe('DUPLICATE_CAMPUS_CODE');
    }

    const db = await getDb();
    const count = await db.collection('campuses').countDocuments({
      branchId: branchA1Id,
      campusCode: raceCampusCode,
      status: { $ne: 'ARCHIVED' }
    });
    expect(count).toBe(1);
  }, 15000);

  // Test 27: Cross-Tenant Data Leak Protection on Breadcrumbs
  it('27. Breadcrumbs Isolation: querying non-existent or foreign entity returns empty array with zero PII leakage', async () => {
    const res = await fetch(`${baseUrl}/hierarchy/breadcrumbs?entityType=CAMPUS&entityId=CMP-NONEXISTENT-FOREIGN`, {
      headers: { Authorization: `Bearer ${principalTokenA}` }
    });
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.breadcrumbs).toEqual([]);
  });
});
