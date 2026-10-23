import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { app } from '../../server/index.js';
import { getDb, closeDb } from '../../server/db.js';
import { generateToken, revokeToken, getJwtSecret } from '../../server/middleware/auth.js';

describe('i2A SchoolOS — Phase 0 Independent Security & Integrity Verification Suite', () => {
  let server: http.Server;
  let baseUrl: string;

  // Real synthetic tokens
  let superAdminToken = '';
  let principalToken = '';
  let accountantToken = '';
  let teacherToken = '';
  let staffToken = '';
  let parentAToken = '';
  let parentBToken = '';
  let student1Token = '';
  let student2Token = '';
  let student3Token = '';

  const schoolA = 'I2A-SCH-000001';

  beforeAll(async () => {
    // 1. Mandatory Safety Preflight Check: Confirm connection to synthetic test DB
    const db = await getDb();
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');

    // 2. Start HTTP test server on ephemeral port
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as { port: number; address: string };
        baseUrl = `http://127.0.0.1:${address.port}/api`;
        resolve();
      });
    });

    // 3. Authenticate standard seed users
    const login = async (email: string, pass: string) => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      return data.token;
    };

    superAdminToken = await login('superadmin@i2aschoolos.com', 'SuperAdmin@2026#');
    principalToken = await login('principal@abcpublicschool.edu.in', 'Principal@2026#');
    accountantToken = await login('alok.nath@abcpublicschool.edu.in', 'Accountant@2026#');
    teacherToken = await login('sunita.mishra@abcpublicschool.edu.in', 'Teacher@2026#');
    staffToken = await login('office@abcpublicschool.edu.in', 'Staff@2026#');

    // 4. Provision dedicated synthetic users for multi-parent / multi-student isolation tests
    const parentAUser = {
      id: 'usr-parent-multi-a',
      name: 'Parent Alpha (Two Wards)',
      email: 'parent.alpha.synthetic@test.edu',
      role: 'PARENT',
      schoolId: schoolA,
      childrenIds: ['std-101', 'std-102'],
      status: 'ACTIVE'
    };
    await db.collection('users').updateOne({ id: parentAUser.id }, { $set: parentAUser }, { upsert: true });
    parentAToken = generateToken(parentAUser);

    const parentBUser = {
      id: 'usr-parent-single-b',
      name: 'Parent Beta (One Ward)',
      email: 'parent.beta.synthetic@test.edu',
      role: 'PARENT',
      schoolId: schoolA,
      childrenIds: ['std-103'],
      status: 'ACTIVE'
    };
    await db.collection('users').updateOne({ id: parentBUser.id }, { $set: parentBUser }, { upsert: true });
    parentBToken = generateToken(parentBUser);

    const student1User = {
      id: 'usr-student-1',
      name: 'Rahul Kumar',
      email: 'student1.synthetic@test.edu',
      role: 'STUDENT',
      schoolId: schoolA,
      studentId: 'std-101',
      status: 'ACTIVE'
    };
    await db.collection('users').updateOne({ id: student1User.id }, { $set: student1User }, { upsert: true });
    student1Token = generateToken(student1User);

    const student2User = {
      id: 'usr-student-2',
      name: 'Priya Sharma',
      email: 'student2.synthetic@test.edu',
      role: 'STUDENT',
      schoolId: schoolA,
      studentId: 'std-102',
      status: 'ACTIVE'
    };
    await db.collection('users').updateOne({ id: student2User.id }, { $set: student2User }, { upsert: true });
    student2Token = generateToken(student2User);

    const student3User = {
      id: 'usr-student-3',
      name: 'Aarav Patel',
      email: 'student3.synthetic@test.edu',
      role: 'STUDENT',
      schoolId: schoolA,
      studentId: 'std-103',
      status: 'ACTIVE'
    };
    await db.collection('users').updateOne({ id: student3User.id }, { $set: student3User }, { upsert: true });
    student3Token = generateToken(student3User);

    // Seed test receipts for isolation assertions
    await db.collection('fee_receipts').deleteMany({ schoolId: schoolA, receiptNo: { $regex: /^TEST-ISOLATION-/ } });
    await db.collection('fee_receipts').insertMany([
      {
        id: 'rcp-iso-101',
        schoolId: schoolA,
        receiptNo: 'TEST-ISOLATION-101',
        studentId: 'std-101',
        studentName: 'Rahul Kumar',
        totalAmount: 2500,
        paidAmount: 2500,
        paymentDate: '2026-10-21',
        status: 'PAID'
      },
      {
        id: 'rcp-iso-102',
        schoolId: schoolA,
        receiptNo: 'TEST-ISOLATION-102',
        studentId: 'std-102',
        studentName: 'Priya Sharma',
        totalAmount: 3200,
        paidAmount: 3200,
        paymentDate: '2026-10-21',
        status: 'PAID'
      },
      {
        id: 'rcp-iso-103',
        schoolId: schoolA,
        receiptNo: 'TEST-ISOLATION-103',
        studentId: 'std-103',
        studentName: 'Aarav Patel',
        totalAmount: 1800,
        paidAmount: 1800,
        paymentDate: '2026-10-21',
        status: 'PAID'
      }
    ]);
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closeDb();
  });

  // =========================================================================
  // 1. Authentication — Fail-Closed Verification
  // =========================================================================
  describe('1. Authentication — Fail-Closed Verification', () => {
    it('1.1 Wrong password fails closed with 401 and issues zero session token', async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'principal@abcpublicschool.edu.in', password: 'WrongPassword#999' })
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.token).toBeUndefined();
    });

    it('1.2 Account enumeration defense: Unknown user and wrong password return identical generic error', async () => {
      const resUnknown = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'unknown.ghost.user@domain.com', password: 'SomePassword#123' })
      });
      const dataUnknown = await resUnknown.json();
      expect(resUnknown.status).toBe(401);

      const resWrong = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'principal@abcpublicschool.edu.in', password: 'WrongPassword#123' })
      });
      const dataWrong = await resWrong.json();
      expect(resWrong.status).toBe(401);

      expect(dataUnknown.error).toBe(dataWrong.error);
      expect(dataUnknown.error).toContain('Invalid password or credentials');
    });

    it('1.3 Tampered JWT signature rejects with 403 INVALID_TOKEN', async () => {
      const tampered = principalToken.substring(0, principalToken.length - 8) + 'ABCDEFGH';
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${tampered}` }
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('INVALID_TOKEN');
    });

    it('1.4 Expired JWT token rejects with 401 TOKEN_EXPIRED', async () => {
      const secret = getJwtSecret();
      const expiredToken = jwt.sign(
        { id: 'usr-expired', email: 'exp@test.com', role: 'PRINCIPAL', schoolId: schoolA },
        secret,
        { expiresIn: '-10s', issuer: 'i2a_schoolos', audience: 'i2a_schoolos_api' }
      );

      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.code).toBe('TOKEN_EXPIRED');
    });

    it('1.5 Revoked JWT token (after logout) rejects with 401 TOKEN_REVOKED', async () => {
      // Create a fresh token and revoke it
      const tempUser = { id: 'usr-to-revoke', email: 'rev@test.com', role: 'TEACHER', schoolId: schoolA };
      const db = await getDb();
      await db.collection('users').updateOne({ id: tempUser.id }, { $set: { ...tempUser, status: 'ACTIVE' } }, { upsert: true });
      const activeToken = generateToken(tempUser);

      // Verify active token works first
      const beforeRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      expect(beforeRes.status).toBe(200);

      // Revoke the token
      await revokeToken(activeToken, 'LOGOUT_TEST');

      // Now it must fail closed
      const afterRes = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${activeToken}` }
      });
      expect(afterRes.status).toBe(401);
      const data = await afterRes.json();
      expect(data.code).toBe('TOKEN_REVOKED');
    });

    it('1.6 Deactivated account (DISABLED) rejects with 403 ACCOUNT_DISABLED', async () => {
      const disabledUser = { id: 'usr-deactivated', email: 'disabled@test.com', role: 'TEACHER', schoolId: schoolA, status: 'DISABLED' };
      const db = await getDb();
      await db.collection('users').updateOne({ id: disabledUser.id }, { $set: disabledUser }, { upsert: true });
      const token = generateToken(disabledUser);

      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.code).toBe('ACCOUNT_DISABLED');
    });

    it('1.7 Unauthenticated visitor cannot query protected student list', async () => {
      const res = await fetch(`${baseUrl}/students?schoolId=${schoolA}`);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.code).toBe('AUTH_TOKEN_MISSING');
    });
  });

  // =========================================================================
  // 2. Persona Switching, Route Inventory & Authorization
  // =========================================================================
  describe('2. Persona Switching & Authorization Matrix', () => {
    it('2.1 Production bundle artifact does NOT contain persona-switching UI or mock auth', () => {
      const distDir = path.resolve('dist/assets');
      expect(fs.existsSync(distDir)).toBe(true);

      const jsFiles = fs.readdirSync(distDir).filter((f) => f.endsWith('.js'));
      expect(jsFiles.length).toBeGreaterThan(0);

      for (const file of jsFiles) {
        const bundle = fs.readFileSync(path.join(distDir, file), 'utf8');
        expect(bundle).not.toContain('Switch Persona');
        expect(bundle).not.toContain('Quick-Fill Demo Persona');
        expect(bundle).not.toContain('jsxDEV');
      }
    });

    it('2.2 Full Route Inventory Authorization Matrix: Allow/Deny across roles', async () => {
      // Endpoint 1: POST /api/fees/receipts/collect
      const collectEndpoint = `${baseUrl}/fees/receipts/collect`;
      const testCollectBody = { studentId: 'std-101', feeIds: ['fee-1'], paymentMode: 'CASH' };

      // Denied roles (403)
      for (const [roleName, token] of [
        ['PARENT', parentAToken],
        ['STUDENT', student1Token],
        ['TEACHER', teacherToken]
      ] as const) {
        const res = await fetch(collectEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(testCollectBody)
        });
        expect(res.status, `Collect must be denied for ${roleName}`).toBe(403);
      }

      // Allowed roles (Principal, Accountant, Staff, Super Admin)
      for (const [roleName, token] of [
        ['ACCOUNTANT', accountantToken],
        ['PRINCIPAL', principalToken],
        ['STAFF', staffToken],
        ['SUPER_ADMIN', superAdminToken]
      ] as const) {
        const res = await fetch(collectEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            'idempotency-key': `matrix-auth-${roleName}-${Date.now()}`
          },
          body: JSON.stringify({ ...testCollectBody, idempotencyKey: `matrix-auth-${roleName}-${Date.now()}` })
        });
        expect([200, 201], `Collect must be permitted for ${roleName}`).toContain(res.status);
      }

      // Endpoint 2: GET /api/audit-logs
      const auditEndpoint = `${baseUrl}/audit-logs`;
      for (const [roleName, token] of [
        ['PARENT', parentAToken],
        ['STUDENT', student1Token],
        ['TEACHER', teacherToken],
        ['ACCOUNTANT', accountantToken],
        ['STAFF', staffToken]
      ] as const) {
        const res = await fetch(auditEndpoint, { headers: { Authorization: `Bearer ${token}` } });
        expect(res.status, `Audit logs must be denied for ${roleName}`).toBe(403);
      }

      for (const [roleName, token] of [
        ['PRINCIPAL', principalToken],
        ['SUPER_ADMIN', superAdminToken]
      ] as const) {
        const res = await fetch(auditEndpoint, { headers: { Authorization: `Bearer ${token}` } });
        expect(res.status, `Audit logs must be permitted for ${roleName}`).toBe(200);
      }
    });

    it('2.3 Body payload role spoofing (role: SUPER_ADMIN) is strictly rejected', async () => {
      const res = await fetch(`${baseUrl}/fees/types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parentAToken}`
        },
        body: JSON.stringify({
          name: 'Adversarial Fee',
          amount: 1000,
          role: 'SUPER_ADMIN',
          user: { role: 'SUPER_ADMIN' }
        })
      });
      expect(res.status).toBe(403);
    });
  });

  // =========================================================================
  // 3. Fee Collection — Financial Integrity & Concurrency
  // =========================================================================
  describe('3. Fee Collection — Financial Integrity & Concurrency', () => {
    it('3.1 Backend collection failure creates NO receipt and NO ledger entry', async () => {
      const db = await getDb();
      const receiptsBefore = await db.collection('fee_receipts').countDocuments();
      const ledgerBefore = await db.collection('expenses').countDocuments();

      const res = await fetch(`${baseUrl}/fees/receipts/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accountantToken}` },
        body: JSON.stringify({
          studentId: 'nonexistent-student-id-9999',
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

    it('3.2 Concurrent burst with same idempotency key converges to exactly 1 insertion and 0 duplicates', async () => {
      const concurrentKey = `concurrent-race-${Date.now()}`;
      const db = await getDb();
      const countBefore = await db.collection('fee_receipts').countDocuments({ idempotencyKey: concurrentKey });
      expect(countBefore).toBe(0);

      // Fire 5 concurrent requests simultaneously
      const promises = Array.from({ length: 5 }).map(() =>
        fetch(`${baseUrl}/fees/receipts/collect`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accountantToken}`,
            'idempotency-key': concurrentKey
          },
          body: JSON.stringify({
            studentId: 'std-103',
            feeIds: ['fee-2'],
            paymentMode: 'ONLINE_UPI',
            idempotencyKey: concurrentKey
          })
        })
      );

      const results = await Promise.all(promises);
      const statuses = results.map((r) => r.status);

      // All 5 must succeed (HTTP 200 or 201)
      statuses.forEach((s) => expect([200, 201]).toContain(s));

      // Exactly ONE request created the receipt (201); remaining 4 were idempotent returns (200)
      const count201 = statuses.filter((s) => s === 201).length;
      expect(count201).toBe(1);

      // Verify in MongoDB that exactly ONE receipt was inserted
      const countAfter = await db.collection('fee_receipts').countDocuments({ idempotencyKey: concurrentKey });
      expect(countAfter).toBe(1);

      // All returned receipts have identical receipt numbers
      const bodies = await Promise.all(results.map((r) => r.json()));
      const firstReceiptNo = bodies[0].receipt.receiptNo;
      bodies.forEach((b) => {
        expect(b.receipt.receiptNo).toBe(firstReceiptNo);
      });
    });

    it('3.3 Distinct payments with different idempotency keys succeed independently without collision', async () => {
      const key1 = `distinct-key-1-${Date.now()}`;
      const key2 = `distinct-key-2-${Date.now()}`;

      const res1 = await fetch(`${baseUrl}/fees/receipts/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accountantToken}`, 'idempotency-key': key1 },
        body: JSON.stringify({ studentId: 'std-101', feeIds: ['fee-1'], paymentMode: 'CASH', idempotencyKey: key1 })
      });
      expect([200, 201]).toContain(res1.status);
      const data1 = await res1.json();

      const res2 = await fetch(`${baseUrl}/fees/receipts/collect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accountantToken}`, 'idempotency-key': key2 },
        body: JSON.stringify({ studentId: 'std-102', feeIds: ['fee-2'], paymentMode: 'CASH', idempotencyKey: key2 })
      });
      expect([200, 201]).toContain(res2.status);
      const data2 = await res2.json();

      expect(data1.receipt.receiptNo).not.toBe(data2.receipt.receiptNo);
    });
  });

  // =========================================================================
  // 4. Parent/Student Multi-Party Data Isolation
  // =========================================================================
  describe('4. Parent/Student Multi-Party Data Isolation', () => {
    it('4.1 Parent Alpha (linked to std-101 & std-102) only receives receipts for their children', async () => {
      const res = await fetch(`${baseUrl}/fees/receipts`, {
        headers: { Authorization: `Bearer ${parentAToken}` }
      });
      expect(res.status).toBe(200);
      const receipts = await res.json();

      expect(receipts.length).toBeGreaterThan(0);
      receipts.forEach((r: any) => {
        expect(['std-101', 'std-102']).toContain(r.studentId);
        expect(r.studentId).not.toBe('std-103');
      });
    });

    it('4.2 Parent Beta (linked to std-103 only) only receives receipts for std-103', async () => {
      const res = await fetch(`${baseUrl}/fees/receipts`, {
        headers: { Authorization: `Bearer ${parentBToken}` }
      });
      expect(res.status).toBe(200);
      const receipts = await res.json();

      expect(receipts.length).toBeGreaterThan(0);
      receipts.forEach((r: any) => {
        expect(r.studentId).toBe('std-103');
        expect(r.studentId).not.toBe('std-101');
        expect(r.studentId).not.toBe('std-102');
      });
    });

    it('4.3 Adversarial Child Request: Parent Beta passing ?studentId=std-101 receives empty set', async () => {
      const res = await fetch(`${baseUrl}/fees/receipts?studentId=std-101`, {
        headers: { Authorization: `Bearer ${parentBToken}` }
      });
      expect(res.status).toBe(200);
      const receipts = await res.json();

      // Parent Beta is NOT authorized for std-101; server must return empty array
      expect(receipts).toEqual([]);
    });

    it('4.4 Student 1 only receives receipts for std-101 and cannot query other students', async () => {
      // Normal query
      const resNormal = await fetch(`${baseUrl}/fees/receipts`, {
        headers: { Authorization: `Bearer ${student1Token}` }
      });
      expect(resNormal.status).toBe(200);
      const normalReceipts = await resNormal.json();
      normalReceipts.forEach((r: any) => {
        expect(r.studentId).toBe('std-101');
      });

      // Adversarial attempt to query std-102
      const resAdversarial = await fetch(`${baseUrl}/fees/receipts?studentId=std-102`, {
        headers: { Authorization: `Bearer ${student1Token}` }
      });
      expect(resAdversarial.status).toBe(200);
      const adversarialReceipts = await resAdversarial.json();
      expect(adversarialReceipts).toEqual([]);
    });

    it('4.5 Parent with ZERO linked children receives empty array without error', async () => {
      const emptyParentUser = {
        id: 'usr-parent-empty',
        name: 'Parent Zero',
        email: 'parent.zero@test.edu',
        role: 'PARENT',
        schoolId: schoolA,
        childrenIds: [],
        status: 'ACTIVE'
      };
      const db = await getDb();
      await db.collection('users').updateOne({ id: emptyParentUser.id }, { $set: emptyParentUser }, { upsert: true });
      const emptyToken = generateToken(emptyParentUser);

      const res = await fetch(`${baseUrl}/fees/receipts`, {
        headers: { Authorization: `Bearer ${emptyToken}` }
      });
      expect(res.status).toBe(200);
      const receipts = await res.json();
      expect(receipts).toEqual([]);
    });
  });
});
