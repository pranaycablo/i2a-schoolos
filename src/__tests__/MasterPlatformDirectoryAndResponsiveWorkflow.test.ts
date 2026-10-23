import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { app } from '../../server/index.js';
import { getDb, closeDb } from '../../server/db.js';
import { generateToken } from '../../server/middleware/auth.js';

describe('i2A SchoolOS — Master Platform Directory, Multi-Branch & Location Engine Audit', () => {
  let server: http.Server;
  let baseUrl: string;

  let superAdminToken = '';
  let principalAToken = '';
  let principalBToken = '';
  let teacherToken = '';
  let parentToken = '';

  const testSchoolA_Id = `I2A-SCH-SYNTH-${Date.now().toString(36)}-A`;
  const testSchoolB_Id = `I2A-SCH-SYNTH-${Date.now().toString(36)}-B`;
  const testSchoolC_Id = `I2A-SCH-SYNTH-${Date.now().toString(36)}-C`;

  beforeAll(async () => {
    // Mandatory Safety Preflight Check: Confirm connection to synthetic test DB
    const db = await getDb();
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');

    // Start HTTP test server on ephemeral port
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as { port: number; address: string };
        baseUrl = `http://127.0.0.1:${address.port}/api`;
        resolve();
      });
    });

    // Upsert synthetic test users in users collection
    const testUsers = [
      {
        id: 'super-admin-master',
        name: 'Super Admin Operator',
        email: 'operator@i2a-schoolos.internal',
        role: 'SUPER_ADMIN',
        schoolId: 'ALL',
        status: 'ACTIVE'
      },
      {
        id: 'principal-synth-a',
        name: 'Principal Alpha',
        email: 'principal.a@synth.edu.in',
        role: 'PRINCIPAL',
        schoolId: testSchoolA_Id,
        status: 'ACTIVE'
      },
      {
        id: 'principal-synth-b',
        name: 'Principal Beta',
        email: 'principal.b@synth.edu.in',
        role: 'PRINCIPAL',
        schoolId: testSchoolB_Id,
        status: 'ACTIVE'
      },
      {
        id: 'teacher-synth-1',
        name: 'Teacher One',
        email: 'teacher@synth.edu.in',
        role: 'TEACHER',
        schoolId: testSchoolA_Id,
        status: 'ACTIVE'
      },
      {
        id: 'parent-synth-1',
        name: 'Parent Alpha',
        email: 'parent@synth.edu.in',
        role: 'PARENT',
        schoolId: testSchoolA_Id,
        childrenIds: ['std-synth-1'],
        status: 'ACTIVE'
      }
    ];

    for (const u of testUsers) {
      await db.collection('users').updateOne({ id: u.id }, { $set: u }, { upsert: true });
    }

    // Generate tokens for testing
    superAdminToken = generateToken({
      id: 'super-admin-master',
      name: 'Super Admin Operator',
      email: 'operator@i2a-schoolos.internal',
      role: 'SUPER_ADMIN',
      schoolId: 'ALL'
    });

    principalAToken = generateToken({
      id: 'principal-synth-a',
      name: 'Principal Alpha',
      email: 'principal.a@synth.edu.in',
      role: 'PRINCIPAL',
      schoolId: testSchoolA_Id
    });

    principalBToken = generateToken({
      id: 'principal-synth-b',
      name: 'Principal Beta',
      email: 'principal.b@synth.edu.in',
      role: 'PRINCIPAL',
      schoolId: testSchoolB_Id
    });

    teacherToken = generateToken({
      id: 'teacher-synth-1',
      name: 'Teacher One',
      email: 'teacher@synth.edu.in',
      role: 'TEACHER',
      schoolId: testSchoolA_Id
    });

    parentToken = generateToken({
      id: 'parent-synth-1',
      name: 'Parent Alpha',
      email: 'parent@synth.edu.in',
      role: 'PARENT',
      schoolId: testSchoolA_Id,
      childrenIds: ['std-synth-1']
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  });

  // --------------------------------------------------------------------------
  // WORKFLOW A: New School Direct Onboarding & Persistence
  // --------------------------------------------------------------------------
  describe('Workflow A — New School Direct Onboarding & Persistence', () => {
    let createdSchoolId = '';
    const timestamp = `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const uniqueSchoolName = `St. Jude World Academy ${timestamp}`;
    const uniqueAdminEmail = `amit.sharma.${timestamp}@stjudeworld.edu.in`;

    it('A.1: Valid submission creates tenant, org, initial branch and academic session in MongoDB', async () => {
      const res = await fetch(`${baseUrl}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          name: uniqueSchoolName,
          code: 'SJWA',
          board: 'CBSE',
          category: 'k12-schools',
          adminName: 'Amit Sharma',
          adminEmail: uniqueAdminEmail,
          adminPhone: '+91 9876543210',
          planId: 'PROFESSIONAL',
          billingCycle: 'YEARLY',
          address: {
            street: '14 Knowledge Park, Sector 62',
            locality: 'Electronic City',
            city: 'Noida',
            district: 'Gautam Buddha Nagar',
            state: 'Uttar Pradesh',
            postalCode: '201309',
            country: 'IN',
            latitude: 28.6289,
            longitude: 77.3756
          },
          initialBranch: {
            branchCode: 'MAIN',
            name: 'St. Jude World Academy (Main Campus)',
            capacity: 1500
          }
        })
      });

      if (res.status !== 201) {
        const errJson = await res.json();
        console.error('A.1 STATUS NOT 201:', res.status, errJson);
      }
      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.tenant).toBeDefined();
      expect(data.tenant.id).toMatch(/^I2A-SCH-\d{6}$/);
      expect(data.tenant.name).toBe(uniqueSchoolName);
      expect(data.tenant.location.city).toBe('Noida');
      expect(data.tenant.location.latitude).toBe(28.6289);
      expect(data.tenant.location.longitude).toBe(77.3756);
      expect(data.tenant.location.isGeocoded).toBe(true);
      expect(data.branch).toBeDefined();
      expect(data.branch.isMainBranch).toBe(true);
      expect(data.branch.branchCode).toBe('MAIN');

      createdSchoolId = data.tenant.id;

      // Verify MongoDB persistence
      const db = await getDb();
      const tenantInDb = await db.collection('tenants').findOne({ id: createdSchoolId });
      expect(tenantInDb).not.toBeNull();
      expect(tenantInDb?.name).toBe(uniqueSchoolName);

      const orgInDb = await db.collection('organizations').findOne({ id: createdSchoolId });
      expect(orgInDb).not.toBeNull();

      const branchInDb = await db.collection('branches').findOne({ institutionId: createdSchoolId, branchCode: 'MAIN' });
      expect(branchInDb).not.toBeNull();
      expect(branchInDb?.address.latitude).toBe(28.6289);
    });

    it('A.2: Duplicate school name is rejected with 409 Conflict', async () => {
      const res = await fetch(`${baseUrl}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          name: uniqueSchoolName,
          adminName: 'Another Person',
          adminEmail: 'another@stjudeworld.edu.in',
          adminPhone: '+91 9123456789',
          city: 'Noida',
          state: 'Uttar Pradesh'
        })
      });

      expect(res.status).toBe(409);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.code).toBe('DUPLICATE_SCHOOL_NAME');
    });

    it('A.3: Listing endpoint GET /api/tenants returns the newly created school with branch count', async () => {
      const res = await fetch(`${baseUrl}/tenants`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });

      expect(res.status).toBe(200);
      const list = await res.json();
      expect(Array.isArray(list)).toBe(true);
      const found = list.find((item: any) => item.id === createdSchoolId);
      expect(found).toBeDefined();
      expect(found.branchCount).toBe(1);
      expect(found.location.city).toBe('Noida');
    });
  });

  // --------------------------------------------------------------------------
  // WORKFLOW B: Multi-Branch & Campus Management
  // --------------------------------------------------------------------------
  describe('Workflow B — Multi-Branch School Management & Status Isolation', () => {
    let branch1Id = '';
    let branch2Id = '';
    let branch3Id = '';

    beforeAll(async () => {
      const db = await getDb();
      // Ensure test school A exists
      await db.collection('tenants').updateOne(
        { id: testSchoolA_Id },
        {
          $set: {
            id: testSchoolA_Id,
            name: 'Cambridge International Trust',
            board: 'CBSE',
            city: 'Patna',
            subscriptionStatus: 'ACTIVE',
            registeredAt: '2026-01-01',
            location: {
              street: 'Bailey Road',
              city: 'Patna',
              district: 'Patna',
              state: 'Bihar',
              postalCode: '800001',
              country: 'IN'
            }
          }
        },
        { upsert: true }
      );
    });

    it('B.1: Adds 3 distinct branches to School A with different locations', async () => {
      // Branch 1: Main Campus (Patna)
      const res1 = await fetch(`${baseUrl}/hierarchy/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          institutionId: testSchoolA_Id,
          branchCode: 'PATNA_MAIN',
          name: 'Cambridge Main Campus',
          isMainBranch: true,
          capacity: 2000,
          address: {
            street: 'Bailey Road',
            locality: 'Shastri Nagar',
            city: 'Patna',
            district: 'Patna',
            state: 'Bihar',
            postalCode: '800001',
            latitude: 25.5941,
            longitude: 85.1376
          }
        })
      });
      expect(res1.status).toBe(201);
      const d1 = await res1.json();
      branch1Id = d1.branch.id;
      expect(d1.branch.isMainBranch).toBe(true);

      // Branch 2: Danapur Campus
      const res2 = await fetch(`${baseUrl}/hierarchy/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          institutionId: testSchoolA_Id,
          branchCode: 'DANAPUR',
          name: 'Cambridge West Wing (Danapur)',
          isMainBranch: false,
          capacity: 800,
          address: {
            street: 'Station Road',
            locality: 'Danapur Cantonment',
            city: 'Danapur',
            district: 'Patna',
            state: 'Bihar',
            postalCode: '801503',
            latitude: 25.6300,
            longitude: 85.0400
          }
        })
      });
      expect(res2.status).toBe(201);
      const d2 = await res2.json();
      branch2Id = d2.branch.id;

      // Branch 3: Hajipur Campus
      const res3 = await fetch(`${baseUrl}/hierarchy/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          institutionId: testSchoolA_Id,
          branchCode: 'HAJIPUR',
          name: 'Cambridge North Wing (Hajipur)',
          isMainBranch: false,
          capacity: 600,
          address: {
            street: 'Industrial Area Phase 1',
            locality: 'Paswan Chowk',
            city: 'Hajipur',
            district: 'Vaishali',
            state: 'Bihar',
            postalCode: '844101',
            latitude: 25.6858,
            longitude: 85.2094
          }
        })
      });
      expect(res3.status).toBe(201);
      const d3 = await res3.json();
      branch3Id = d3.branch.id;

      // Verify School A has exactly 3 branches
      const listRes = await fetch(`${baseUrl}/hierarchy/branches?institutionId=${testSchoolA_Id}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      const listData = await listRes.json();
      expect(listData.branches.length).toBe(3);
    });

    it('B.2: Updating Danapur branch location mutates ONLY that branch and leaves other branches untouched', async () => {
      const updateRes = await fetch(`${baseUrl}/hierarchy/branches/${branch2Id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          name: 'Cambridge West Wing (Danapur Cantt Updated)',
          address: {
            street: 'Military Camp Gate 3',
            locality: 'Danapur Cantonment',
            city: 'Danapur',
            postalCode: '801504',
            latitude: 25.6350,
            longitude: 85.0450
          }
        })
      });

      expect(updateRes.status).toBe(200);
      const updatedData = await updateRes.json();
      expect(updatedData.branch.address.street).toBe('Military Camp Gate 3');
      expect(updatedData.branch.address.postalCode).toBe('801504');
      expect(updatedData.branch.address.latitude).toBe(25.6350);

      // Verify Branch 1 (Main Campus) location was NOT overwritten
      const b1Res = await fetch(`${baseUrl}/hierarchy/branches/${branch1Id}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      const b1Data = await b1Res.json();
      expect(b1Data.branch.address.street).toBe('Bailey Road');
      expect(b1Data.branch.address.postalCode).toBe('800001');

      // Verify Branch 3 (Hajipur) location was NOT overwritten
      const b3Res = await fetch(`${baseUrl}/hierarchy/branches/${branch3Id}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      const b3Data = await b3Res.json();
      expect(b3Data.branch.address.city).toBe('Hajipur');
    });

    it('B.3: Changing a branch status to INACTIVE does NOT alter the parent school status', async () => {
      const statusRes = await fetch(`${baseUrl}/hierarchy/branches/${branch3Id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          status: 'INACTIVE'
        })
      });

      expect(statusRes.status).toBe(200);
      const statusData = await statusRes.json();
      expect(statusData.branch.status).toBe('INACTIVE');

      // Verify parent school status remains ACTIVE
      const db = await getDb();
      const schoolDoc = await db.collection('tenants').findOne({ id: testSchoolA_Id });
      expect(schoolDoc?.subscriptionStatus).toBe('ACTIVE');
    });
  });

  // --------------------------------------------------------------------------
  // WORKFLOW C: Multi-School Isolation & Empty State Verification
  // --------------------------------------------------------------------------
  describe('Workflow C — Multi-School Isolation & Empty State Verification', () => {
    beforeAll(async () => {
      const db = await getDb();
      // Provision School B (St. Mary World Academy B) with 1 branch
      await db.collection('tenants').updateOne(
        { id: testSchoolB_Id },
        {
          $set: {
            id: testSchoolB_Id,
            name: 'St. Mary World Academy B',
            board: 'ICSE',
            city: 'Muzaffarpur',
            subscriptionStatus: 'ACTIVE',
            location: { city: 'Muzaffarpur', state: 'Bihar', postalCode: '842001' }
          }
        },
        { upsert: true }
      );

      await db.collection('branches').updateOne(
        { id: `BR-${testSchoolB_Id}-MAIN` },
        {
          $set: {
            id: `BR-${testSchoolB_Id}-MAIN`,
            institutionId: testSchoolB_Id,
            branchCode: 'MAIN',
            name: 'St. Mary Muzaffarpur Campus',
            isMainBranch: true,
            status: 'ACTIVE',
            address: { city: 'Muzaffarpur', state: 'Bihar', postalCode: '842001' }
          }
        },
        { upsert: true }
      );

      // Provision School C (St. Mary Primary) with ZERO branches
      await db.collection('tenants').updateOne(
        { id: testSchoolC_Id },
        {
          $set: {
            id: testSchoolC_Id,
            name: 'St. Mary Primary (Standalone)',
            board: 'STATE_BOARD',
            city: 'Gaya',
            subscriptionStatus: 'TRIAL',
            location: { city: 'Gaya', state: 'Bihar', postalCode: '823001' }
          }
        },
        { upsert: true }
      );
    });

    it('C.1: Querying branches for School A returns only School A branches (no School B branches)', async () => {
      const res = await fetch(`${baseUrl}/hierarchy/branches?institutionId=${testSchoolA_Id}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      const data = await res.json();
      expect(data.branches.length).toBe(3);
      for (const b of data.branches) {
        expect(b.institutionId).toBe(testSchoolA_Id);
        expect(b.institutionId).not.toBe(testSchoolB_Id);
      }
    });

    it('C.2: Querying branches for School B returns exactly 1 branch', async () => {
      const res = await fetch(`${baseUrl}/hierarchy/branches?institutionId=${testSchoolB_Id}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      const data = await res.json();
      expect(data.branches.length).toBe(1);
      expect(data.branches[0].institutionId).toBe(testSchoolB_Id);
      expect(data.branches[0].name).toBe('St. Mary Muzaffarpur Campus');
    });

    it('C.3: Querying branches for School C returns an empty array (proper empty state)', async () => {
      const res = await fetch(`${baseUrl}/hierarchy/branches?institutionId=${testSchoolC_Id}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      const data = await res.json();
      expect(data.branches.length).toBe(0);
      expect(Array.isArray(data.branches)).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // WORKFLOW D: Location & Coordinate Range Boundary Validation
  // --------------------------------------------------------------------------
  describe('Workflow D — Location & Coordinate Boundary Validation', () => {
    it('D.1: Rejects latitude > 90 with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          name: `Invalid Lat School ${Date.now()}`,
          adminName: 'Test Admin',
          adminEmail: 'test@invalidlat.edu.in',
          adminPhone: '+91 9999999999',
          city: 'Patna',
          state: 'Bihar',
          address: {
            latitude: 95.5,
            longitude: 85.0
          }
        })
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Latitude must be between -90 and +90');
    });

    it('D.2: Rejects latitude < -90 with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          name: `Invalid Neg Lat School ${Date.now()}`,
          adminName: 'Test Admin',
          adminEmail: 'test@invalidneglat.edu.in',
          adminPhone: '+91 9999999999',
          city: 'Patna',
          state: 'Bihar',
          address: {
            latitude: -92.4,
            longitude: 85.0
          }
        })
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Latitude must be between -90 and +90');
    });

    it('D.3: Rejects longitude > 180 with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          name: `Invalid Lng School ${Date.now()}`,
          adminName: 'Test Admin',
          adminEmail: 'test@invalidlng.edu.in',
          adminPhone: '+91 9999999999',
          city: 'Patna',
          state: 'Bihar',
          address: {
            latitude: 25.5,
            longitude: 185.0
          }
        })
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Longitude must be between -180 and +180');
    });

    it('D.4: Rejects longitude < -180 with 400 Bad Request', async () => {
      const res = await fetch(`${baseUrl}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          name: `Invalid Neg Lng School ${Date.now()}`,
          adminName: 'Test Admin',
          adminEmail: 'test@invalidneglng.edu.in',
          adminPhone: '+91 9999999999',
          city: 'Patna',
          state: 'Bihar',
          address: {
            latitude: 25.5,
            longitude: -182.5
          }
        })
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('Longitude must be between -180 and +180');
    });

    it('D.5: Valid coordinates are accepted, stored, and verified via PUT /api/tenants/:schoolId/location', async () => {
      const res = await fetch(`${baseUrl}/tenants/${testSchoolA_Id}/location`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({
          street: 'Patliputra Industrial Area, Road 14',
          locality: 'Patliputra Colony',
          city: 'Patna',
          district: 'Patna',
          state: 'Bihar',
          postalCode: '800013',
          latitude: 25.6200,
          longitude: 85.1100
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.location.isGeocoded).toBe(true);
      expect(data.location.latitude).toBe(25.6200);
      expect(data.location.longitude).toBe(85.1100);

      // Verify DB persistence
      const db = await getDb();
      const updatedTenant = await db.collection('tenants').findOne({ id: testSchoolA_Id });
      expect(updatedTenant?.location.postalCode).toBe('800013');
      expect(updatedTenant?.location.latitude).toBe(25.6200);
    });
  });

  // --------------------------------------------------------------------------
  // WORKFLOW E: Authorization & Role Scoping
  // --------------------------------------------------------------------------
  describe('Workflow E — Authorization & Role Scoping', () => {
    it('E.1: Unauthenticated request to POST /api/tenants is rejected with 401', async () => {
      const res = await fetch(`${baseUrl}/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unauthorized School' })
      });
      expect(res.status).toBe(401);
    });

    it('E.2: Teacher role attempting to create a school is rejected with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${teacherToken}`
        },
        body: JSON.stringify({
          name: 'Teacher Created School',
          adminName: 'Teacher',
          adminEmail: 'teacher@test.com',
          adminPhone: '9999999999',
          city: 'Patna',
          state: 'Bihar'
        })
      });
      expect(res.status).toBe(403);
    });

    it('E.3: Parent role attempting to create a school is rejected with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/tenants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parentToken}`
        },
        body: JSON.stringify({
          name: 'Parent Created School',
          adminName: 'Parent',
          adminEmail: 'parent@test.com',
          adminPhone: '9999999999',
          city: 'Patna',
          state: 'Bihar'
        })
      });
      expect(res.status).toBe(403);
    });

    it('E.4: Principal of School A attempting to create a branch for School B is rejected with 403 Forbidden', async () => {
      const res = await fetch(`${baseUrl}/hierarchy/branches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${principalAToken}`
        },
        body: JSON.stringify({
          institutionId: testSchoolB_Id, // Cross-tenant target!
          branchCode: 'ROGUE_BRANCH',
          name: 'Rogue Cross-Tenant Branch',
          address: { city: 'Muzaffarpur' }
        })
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('CROSS_TENANT_ACCESS_DENIED');
    });

    it('E.5: Principal of School A can legitimately query branches belonging only to School A', async () => {
      const res = await fetch(`${baseUrl}/hierarchy/branches`, {
        headers: { Authorization: `Bearer ${principalAToken}` }
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      for (const b of data.branches) {
        expect(b.institutionId).toBe(testSchoolA_Id);
      }
    });
  });
});
