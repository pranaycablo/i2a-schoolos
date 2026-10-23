import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import crypto from 'crypto';
import { app } from '../../server/index.js';
import { getDb, closeDb } from '../../server/db.js';

describe('i2A SchoolOS — Master Prompt 02: API Contracts, Validation & Error Handling Suite', () => {
  let server: http.Server;
  let baseUrl: string;

  let schoolAPrincipalToken = '';
  let schoolATeacherToken = '';
  let schoolBPrincipalToken = '';

  const schoolA = 'I2A-SCH-000001';
  const schoolB = 'I2A-SCH-000002';

  const createdStudentIds: string[] = [];
  const createdFeeTypeIds: string[] = [];

  beforeAll(async () => {
    // 1. Verify DB connection to isolated test DB
    const db = await getDb();
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');

    // 2. Start HTTP server on dynamic port
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as { port: number; address: string };
        baseUrl = `http://127.0.0.1:${address.port}/api`;
        resolve();
      });
    });

    // 3. Authenticate test personas
    const pARes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'principal@abcpublicschool.edu.in', password: 'Principal@2026#' })
    });
    const pAData = await pARes.json();
    expect(pARes.status).toBe(200);
    schoolAPrincipalToken = pAData.token;

    const tARes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'sunita.mishra@abcpublicschool.edu.in', password: 'Teacher@2026#' })
    });
    const tAData = await tARes.json();
    expect(tARes.status).toBe(200);
    schoolATeacherToken = tAData.token;

    const saRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@i2aschoolos.com', password: 'SuperAdmin@2026#' })
    });
    const saData = await saRes.json();
    expect(saRes.status).toBe(200);
    schoolBPrincipalToken = saData.token;
  });

  afterAll(async () => {
    const db = await getDb();
    if (db) {
      for (const id of createdStudentIds) {
        await db.collection('students').deleteOne({ id });
      }
      for (const id of createdFeeTypeIds) {
        await db.collection('fee_types').deleteOne({ id });
      }
    }
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closeDb();
  });

  // ---------------------------------------------------------------------------
  // Contract Test 1: Unauthenticated request rejection
  // ---------------------------------------------------------------------------
  it('1. Rejects unauthenticated requests with 401 and AUTH_TOKEN_MISSING code', async () => {
    const res = await fetch(`${baseUrl}/students`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('AUTH_TOKEN_MISSING');
    expect(body.error).toContain('Authentication token missing');
    expect(body.requestId).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Contract Test 2: Invalid JWT token rejection
  // ---------------------------------------------------------------------------
  it('2. Rejects invalid JWT token with 403 and INVALID_TOKEN code', async () => {
    const res = await fetch(`${baseUrl}/students`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer invalid_signature_token_xyz'
      }
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('INVALID_TOKEN');
    expect(body.requestId).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Contract Test 3: Role Authorization (RBAC) rejection
  // ---------------------------------------------------------------------------
  it('3. Rejects unauthorized role action with 403 and INSUFFICIENT_PERMISSIONS', async () => {
    // Teacher attempts to access platform audit logs (restricted to Principal/Admin)
    const res = await fetch(`${baseUrl}/audit-logs`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${schoolATeacherToken}`
      }
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('INSUFFICIENT_PERMISSIONS');
    expect(body.error).toContain('is not authorized');
    expect(body.requestId).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Contract Test 4: Cross-Tenant URL tampering rejection
  // ---------------------------------------------------------------------------
  it('4. Rejects cross-tenant access violation with 403 and CROSS_TENANT_VIOLATION', async () => {
    // School A principal attempts to pass School B in query param
    const res = await fetch(`${baseUrl}/students?schoolId=${schoolB}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${schoolAPrincipalToken}`
      }
    });

    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('CROSS_TENANT_VIOLATION');
    expect(body.error).toContain('Cross-tenant access violation');
    expect(body.requestId).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Contract Test 5: Input Validation on Student Creation
  // ---------------------------------------------------------------------------
  it('5. Rejects student creation when required fields are missing with 400 VALIDATION_ERROR', async () => {
    const res = await fetch(`${baseUrl}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${schoolAPrincipalToken}`
      },
      body: JSON.stringify({
        // Missing name, className, section
        admissionDate: '2026-10-17'
      })
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.error).toContain('Validation failed');
    expect(body.details).toBeDefined();
    expect(Array.isArray(body.details)).toBe(true);
    expect(body.requestId).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Contract Test 6: Input Validation on Fee Type Creation
  // ---------------------------------------------------------------------------
  it('6. Rejects negative or invalid fee amount with 400 VALIDATION_ERROR', async () => {
    const res = await fetch(`${baseUrl}/fees/types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${schoolAPrincipalToken}`
      },
      body: JSON.stringify({
        name: 'Invalid Negative Fee',
        amount: -500
      })
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.error).toContain('amount must be a non-negative number');
    expect(body.requestId).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Contract Test 7: Direct Object Reference (IDOR) Protection across Schools
  // ---------------------------------------------------------------------------
  it('7. Returns 404 RESOURCE_NOT_FOUND when accessing another school student by ID', async () => {
    // First, School B creates a student
    const createBRes = await fetch(`${baseUrl}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${schoolBPrincipalToken}`
      },
      body: JSON.stringify({
        schoolId: schoolB,
        name: 'School B Student Fixture',
        className: 'Class IX',
        section: 'B'
      })
    });
    expect(createBRes.status).toBe(201);
    const bData = await createBRes.json();
    const studentBId = bData.student.id;
    createdStudentIds.push(studentBId);

    // Now, School A principal attempts to directly fetch Student B by ID
    const directFetchRes = await fetch(`${baseUrl}/students/${studentBId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${schoolAPrincipalToken}`
      }
    });

    // Must be rejected with 404 and RESOURCE_NOT_FOUND to avoid cross-tenant info leak
    expect(directFetchRes.status).toBe(404);
    const fetchBody = await directFetchRes.json();
    expect(fetchBody.success).toBe(false);
    expect(fetchBody.code).toBe('RESOURCE_NOT_FOUND');
    expect(fetchBody.requestId).toBeDefined();
  });

  // ---------------------------------------------------------------------------
  // Contract Test 8: 404 Route Not Found Contract
  // ---------------------------------------------------------------------------
  it('8. Returns standardized 404 for non-existent API routes', async () => {
    const res = await fetch(`${baseUrl}/non-existent-endpoint-xyz`, {
      method: 'GET'
    });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('ROUTE_NOT_FOUND');
    expect(body.error).toContain('API endpoint not found');
    expect(body.requestId).toBeDefined();
  });
});
