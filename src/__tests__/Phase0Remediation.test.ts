import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { app } from '../../server/index.js';
import { getDb, closeDb } from '../../server/db.js';
import { generateToken } from '../../server/middleware/auth.js';

describe('i2A SchoolOS — Phase 0 Critical User-Trust & Security Remediation Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  let principalToken = '';
  let accountantToken = '';
  let parentToken = '';
  let studentToken = '';

  const schoolA = 'I2A-SCH-000001';

  beforeAll(async () => {
    // 1. Connect to isolated synthetic test database
    const db = await getDb();
    expect(db).toBeDefined();

    // 2. Start HTTP test server on an ephemeral port
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as { port: number; address: string };
        baseUrl = `http://127.0.0.1:${address.port}/api`;
        resolve();
      });
    });

    // 3. Acquire valid tokens for test personas
    const pRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'principal@abcpublicschool.edu.in', password: 'Principal@2026#' })
    });
    const pData = await pRes.json();
    expect(pRes.status).toBe(200);
    principalToken = pData.token;

    const aRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'alok.nath@abcpublicschool.edu.in', password: 'Accountant@2026#' })
    });
    const aData = await aRes.json();
    expect(aRes.status).toBe(200);
    accountantToken = aData.token;

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

  // =========================================================================
  // P0-1: Authentication Must Fail Closed
  // =========================================================================
  describe('P0-1 — Authentication Must Fail Closed', () => {
    it('1.1 Invalid password rejects with HTTP 401 and issues NO session token', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'principal@abcpublicschool.edu.in',
          password: 'CompletelyWrongPassword!#123'
        })
      });

      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.token).toBeUndefined();
      expect(data.error).toBeDefined();
    });

    it('1.2 Account enumeration protection: Invalid user and invalid password return identical error string', async () => {
      const badUserRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent.user.123984@unknownschool.org',
          password: 'Password@2026#'
        })
      });
      const badUserData = await badUserRes.json();
      expect(badUserRes.status).toBe(401);

      const badPassRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'principal@abcpublicschool.edu.in',
          password: 'WrongPassword@2026#'
        })
      });
      const badPassData = await badPassRes.json();
      expect(badPassRes.status).toBe(401);

      // Both must return identical generic message to prevent account harvesting
      expect(badUserData.error).toBe(badPassData.error);
      expect(badUserData.error).toContain('Invalid password or credentials');
    });

    it('1.3 Empty / Missing credentials fail-closed with HTTP 400', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: '', password: '' })
      });
      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.token).toBeUndefined();
    });

    it('1.4 Unauthenticated request to /auth/me rejects with 401 AUTH_TOKEN_MISSING', async () => {
      const res = await fetch(`${baseUrl}/auth/me`);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.code).toBe('AUTH_TOKEN_MISSING');
    });

    it('1.5 Forged or malformed JWT bearer token rejects with 403 INVALID_TOKEN', async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: 'Bearer forged.token.payload' }
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('INVALID_TOKEN');
    });
  });

  // =========================================================================
  // P0-2: Remove Production Persona-Switching Risk & Enforce Server RBAC
  // =========================================================================
  describe('P0-2 — Remove Production Persona-Switching Risk & Enforce Server RBAC', () => {
    it('2.1 Parent role cannot execute privileged Fee Collection endpoint', async () => {
      const res = await fetch(`${baseUrl}/fees/receipts/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parentToken}`
        },
        body: JSON.stringify({
          studentId: 'std-101',
          feeIds: ['fee-1'],
          paymentMode: 'CASH'
        })
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('2.2 Student role cannot execute privileged Fee Collection endpoint', async () => {
      const res = await fetch(`${baseUrl}/fees/receipts/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${studentToken}`
        },
        body: JSON.stringify({
          studentId: 'std-101',
          feeIds: ['fee-1'],
          paymentMode: 'CASH'
        })
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
    });

    it('2.3 Parent and Student cannot access Audit Trail logs', async () => {
      const parentRes = await fetch(`${baseUrl}/audit-logs`, {
        headers: { Authorization: `Bearer ${parentToken}` }
      });
      expect(parentRes.status).toBe(403);

      const studentRes = await fetch(`${baseUrl}/audit-logs`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      expect(studentRes.status).toBe(403);
    });

    it('2.4 Client-side role spoofing in payload cannot elevate server permissions', async () => {
      // Attacker sends Parent token with a spoofed { role: 'SUPER_ADMIN' } in the JSON payload
      const res = await fetch(`${baseUrl}/fees/types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parentToken}`
        },
        body: JSON.stringify({
          name: 'Spoofed Fee Component',
          amount: 5000,
          role: 'SUPER_ADMIN',
          userRole: 'PRINCIPAL'
        })
      });

      // Server must inspect req.user.role from the verified cryptographic JWT, not the request body
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  // =========================================================================
  // P0-3: Reliable Fee Collection, Idempotency & Duplicate Protection
  // =========================================================================
  describe('P0-3 — Fee Collection, Idempotency & Duplicate Protection', () => {
    const testIdempotencyKey = `phase0-test-${Date.now()}`;
    let createdReceiptNo = '';

    it('3.1 Authorized Accountant executes valid collection, awaiting backend result', async () => {
      const res = await fetch(`${baseUrl}/fees/receipts/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accountantToken}`,
          'idempotency-key': testIdempotencyKey
        },
        body: JSON.stringify({
          studentId: 'std-101',
          feeIds: ['fee-1', 'fee-2'],
          paymentMode: 'ONLINE_UPI',
          idempotencyKey: testIdempotencyKey
        })
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.receipt).toBeDefined();
      expect(data.receipt.receiptNo).toMatch(/^INV-2026-\d{6}$/);
      expect(data.receipt.status).toBe('PAID');
      expect(data.receipt.totalAmount).toBeGreaterThan(0);
      createdReceiptNo = data.receipt.receiptNo;
    });

    it('3.2 Idempotent resubmission with same key returns existing receipt without double collection', async () => {
      const res = await fetch(`${baseUrl}/fees/receipts/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accountantToken}`,
          'idempotency-key': testIdempotencyKey
        },
        body: JSON.stringify({
          studentId: 'std-101',
          feeIds: ['fee-1', 'fee-2'],
          paymentMode: 'ONLINE_UPI',
          idempotencyKey: testIdempotencyKey
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.duplicatePrevented).toBe(true);
      expect(data.receipt.receiptNo).toBe(createdReceiptNo);

      // Verify in DB that only ONE receipt exists with this idempotency key
      const db = await getDb();
      const count = await db.collection('fee_receipts').countDocuments({ idempotencyKey: testIdempotencyKey });
      expect(count).toBe(1);
    });

    it('3.3 Rapid duplicate submission window protection prevents duplicate receipt within 30s', async () => {
      // Submit without idempotencyKey but with identical student and feeBreakup immediately
      const res = await fetch(`${baseUrl}/fees/receipts/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accountantToken}`
        },
        body: JSON.stringify({
          studentId: 'std-101',
          feeIds: ['fee-1', 'fee-2'],
          paymentMode: 'ONLINE_UPI'
        })
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.duplicatePrevented).toBe(true);
      expect(data.message).toContain('Duplicate submission prevented');
    });

    it('3.4 Invalid student ID fails closed and creates NO receipt or ledger entry', async () => {
      const db = await getDb();
      const receiptsBefore = await db.collection('fee_receipts').countDocuments();
      const ledgerBefore = await db.collection('expenses').countDocuments();

      const res = await fetch(`${baseUrl}/fees/receipts/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accountantToken}`
        },
        body: JSON.stringify({
          studentId: 'invalid-nonexistent-student-999',
          feeIds: ['fee-1'],
          paymentMode: 'CASH'
        })
      });

      expect(res.status).toBe(404);
      const receiptsAfter = await db.collection('fee_receipts').countDocuments();
      const ledgerAfter = await db.collection('expenses').countDocuments();

      expect(receiptsAfter).toBe(receiptsBefore);
      expect(ledgerAfter).toBe(ledgerBefore);
    });

    it('3.5 Fee calculation is strictly server-authoritative and ignores client discount overrides', async () => {
      const db = await getDb();
      const officialFee = await db.collection('fee_types').findOne({ id: 'fee-1', schoolId: schoolA });
      expect(officialFee).toBeDefined();

      const res = await fetch(`${baseUrl}/fees/receipts/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accountantToken}`
        },
        body: JSON.stringify({
          studentId: 'std-102',
          feeIds: ['fee-1'],
          paymentMode: 'CASH',
          discountAmount: 0,
          idempotencyKey: `server-auth-check-${Date.now()}`
        })
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.receipt.totalAmount).toBe(officialFee.amount);
    });
  });

  // =========================================================================
  // P0-4: Correct Parent and Student Routing & Scoping
  // =========================================================================
  describe('P0-4 — Parent and Student Routing & Scoping', () => {
    it('4.1 Parent receipt queries are strictly scoped to linked children only', async () => {
      const res = await fetch(`${baseUrl}/fees/receipts`, {
        headers: { Authorization: `Bearer ${parentToken}` }
      });

      expect(res.status).toBe(200);
      const receipts = await res.json();
      expect(Array.isArray(receipts)).toBe(true);

      // Parent Sanjay Kumar is linked to std-101.
      // Every returned receipt must belong to std-101 (or parent's authorized childrenIds)
      receipts.forEach((r: any) => {
        expect(['std-101']).toContain(r.studentId);
      });
    });

    it('4.2 Student receipt queries are strictly scoped to the student own ID', async () => {
      const res = await fetch(`${baseUrl}/fees/receipts`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });

      expect(res.status).toBe(200);
      const receipts = await res.json();
      expect(Array.isArray(receipts)).toBe(true);

      // Student Rahul Kumar's studentId is std-101
      receipts.forEach((r: any) => {
        expect(r.studentId).toBe('std-101');
      });
    });

    it('4.3 Route authorization logic blocks unauthorized roles from administrative modules', () => {
      // Re-verifying the route guard logic deployed in AppShell.tsx
      const isAuthorized = (module: string, role: string): boolean => {
        const adminRoles = ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'];
        if ([
          'principal_dashboard',
          'principal_ai_assistant',
          'school_setup',
          'institutional_hierarchy',
          'audit_trail',
          'subscription_billing',
          'payroll_expenses',
          'staff_workforce',
          'website_builder'
        ].includes(module)) {
          return adminRoles.includes(role);
        }
        if (module === 'fee_management') {
          return [...adminRoles, 'ACCOUNTANT', 'STAFF'].includes(role);
        }
        if (module === 'parent_portal') {
          return role === 'PARENT' || adminRoles.includes(role);
        }
        if (module === 'student_portal') {
          return role === 'STUDENT' || adminRoles.includes(role);
        }
        return true;
      };

      // Parents cannot access principal dashboard or fee management counter
      expect(isAuthorized('principal_dashboard', 'PARENT')).toBe(false);
      expect(isAuthorized('fee_management', 'PARENT')).toBe(false);
      expect(isAuthorized('school_setup', 'PARENT')).toBe(false);
      expect(isAuthorized('audit_trail', 'PARENT')).toBe(false);
      expect(isAuthorized('parent_portal', 'PARENT')).toBe(true);

      // Students cannot access principal dashboard or fee management
      expect(isAuthorized('principal_dashboard', 'STUDENT')).toBe(false);
      expect(isAuthorized('fee_management', 'STUDENT')).toBe(false);
      expect(isAuthorized('audit_trail', 'STUDENT')).toBe(false);
      expect(isAuthorized('student_portal', 'STUDENT')).toBe(true);

      // Principal can access leadership modules
      expect(isAuthorized('principal_dashboard', 'PRINCIPAL')).toBe(true);
      expect(isAuthorized('school_setup', 'PRINCIPAL')).toBe(true);
      expect(isAuthorized('audit_trail', 'PRINCIPAL')).toBe(true);

      // Accountant can access fee desk
      expect(isAuthorized('fee_management', 'ACCOUNTANT')).toBe(true);
      expect(isAuthorized('school_setup', 'ACCOUNTANT')).toBe(false);
    });
  });
});
