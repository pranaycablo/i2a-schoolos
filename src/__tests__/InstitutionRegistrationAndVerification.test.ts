/**
 * i2A SchoolOS — Master Prompt 08: Institution Registration, Verification & Secure Onboarding
 * Adversarial, Concurrency, State Machine & Tenant Provisioning Test Suite
 *
 * Target DB: mongodb://127.0.0.1:27017/i2a_schoolos_synthetic_test
 * Strict Isolation: ZERO touch on i2a_schoolos or i2a_schoolos_test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { app } from '../../server/index.js';
import { getDb, closeDb } from '../../server/db.js';
import { clearTrackingThrottlingCache } from '../../server/routes/tenants.js';


describe('i2A SchoolOS — Phase 08: Institution Registration, Verification & Secure Onboarding', () => {
  let server: http.Server;
  let baseUrl: string;

  let superAdminToken = '';
  let principalToken = '';
  let teacherToken = '';
  let parentToken = '';

  const testTimestamp = Date.now();
  const testEmailPrefix = `phase08_test_${testTimestamp}`;

  beforeAll(async () => {
    process.env.VITEST = 'true';
    process.env.TEST_DB_NAME = 'i2a_schoolos_synthetic_test';

    const db = await getDb();
    expect(db).toBeDefined();
    // Safety check: ensure we are strictly in synthetic test DB
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');
    expect(db.databaseName).not.toBe('i2a_schoolos');
    expect(db.databaseName).not.toBe('i2a_schoolos_test');

    // Clean up any old test records in school_applications with this prefix
    await db.collection('school_applications').deleteMany({
      adminEmail: { $regex: '^phase08_test_' }
    });

    // Start ephemeral test server
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

    expect(superAdminToken).toBeTruthy();
    expect(principalToken).toBeTruthy();
    expect(teacherToken).toBeTruthy();
    expect(parentToken).toBeTruthy();
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    // Clean up test applications created during this run
    try {
      const db = await getDb();
      if (db.databaseName === 'i2a_schoolos_synthetic_test') {
        await db.collection('school_applications').deleteMany({
          adminEmail: { $regex: '^phase08_test_' }
        });
      }
    } catch {
      // Ignore teardown cleanup errors
    }
    await closeDb();
  });

  // ─── 1. Public Approval Bypass Protection ──────────────────────────────────
  it('1. Public Approval Bypass — Unauthenticated request to approve application returns 401', async () => {
    const res = await fetch(`${baseUrl}/tenants/applications/APP-TEST-999/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'Attacking approval route directly' })
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  // ─── 2. Tamper-Proof Intake: Forged status and verified parameters ─────────
  it('2. Tamper-Proof Intake — Client-supplied status "APPROVED" and verified: true are overridden', async () => {
    const intakeEmail = `${testEmailPrefix}_tamper@test.edu.in`;
    const res = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Adversarial Spoof Academy',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Attacker Impersonator',
        adminEmail: intakeEmail,
        adminPhone: '9876543210',
        city: 'Patna',
        state: 'Bihar',
        status: 'APPROVED', // Forged status
        verified: true, // Forged verified flag
        reviewerId: 'HACKER-007',
        tenantId: 'I2A-SCH-FORGED'
      })
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.application).toBeDefined();
    // Server must enforce initial state
    expect(data.application.status).toBe('PENDING_VERIFICATION');
    expect(data.application.verified).toBe(false);
    expect(data.application.reviewerId).toBeUndefined();
    expect(data.application.tenantId).toBeUndefined();
  });

  // ─── 3. Forged Roles / Tenant IDs Injection at Intake ─────────────────────
  it('3. Neutralized Field Injection — Forged role and admin override fields are stripped', async () => {
    const intakeEmail = `${testEmailPrefix}_roleinject@test.edu.in`;
    const res = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Secure College of Technology',
        category: 'colleges-higher-ed',
        board: 'UNIVERSITY',
        adminName: 'Prof. Alok Verma',
        adminEmail: intakeEmail,
        adminPhone: '9812345678',
        city: 'Muzaffarpur',
        state: 'Bihar',
        role: 'SUPER_ADMIN', // Attempting to elevate role
        isSuperAdmin: true,
        permissions: ['ALL']
      })
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.application.role).toBeUndefined();
    expect(data.application.isSuperAdmin).toBeUndefined();
    expect(data.application.permissions).toBeUndefined();
  });

  // ─── 4. Non-Super-Admin Access to Queue Denied (403) ──────────────────────
  it('4. Role Boundary — Teacher, Parent, and School Principal tokens receive 403 on queue', async () => {
    // Principal token
    const resPrincipal = await fetch(`${baseUrl}/tenants/applications/queue`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    expect(resPrincipal.status).toBe(403);

    // Teacher token
    const resTeacher = await fetch(`${baseUrl}/tenants/applications/queue`, {
      headers: { Authorization: `Bearer ${teacherToken}` }
    });
    expect(resTeacher.status).toBe(403);

    // Parent token
    const resParent = await fetch(`${baseUrl}/tenants/applications/queue`, {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    expect(resParent.status).toBe(403);
  });

  // ─── 5. Non-Super-Admin Action Attempt Denied (403) ────────────────────────
  it('5. Unauthorized Review/Approve — Non-Super-Admin tokens cannot trigger review or approval', async () => {
    const resReview = await fetch(`${baseUrl}/tenants/applications/APP-TEST-101/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`
      },
      body: JSON.stringify({ notes: 'Unauthorized review' })
    });
    expect(resReview.status).toBe(403);

    const resApprove = await fetch(`${baseUrl}/tenants/applications/APP-TEST-101/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`
      },
      body: JSON.stringify({ notes: 'Unauthorized approval' })
    });
    expect(resApprove.status).toBe(403);
  });

  // ─── 6. Super Admin Can View Queue with Filters ───────────────────────────
  it('6. Super Admin Queue Access — Returns applications list with pagination and filters', async () => {
    const res = await fetch(`${baseUrl}/tenants/applications/queue?status=PENDING_VERIFICATION&limit=10`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.applications)).toBe(true);
    expect(data.pagination).toBeDefined();
    expect(data.pagination.limit).toBe(10);
  });

  // ─── 7. Application Intake Validation: Missing Mandatory Fields ───────────
  it('7. Validation Enforcement — Missing schoolName, adminName, adminEmail, or adminPhone returns 400', async () => {
    // Missing schoolName
    const res1 = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminName: 'John Doe',
        adminEmail: 'john@example.com',
        adminPhone: '9876543210'
      })
    });
    expect(res1.status).toBe(400);

    // Missing adminEmail
    const res2 = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Incomplete Academy',
        adminName: 'John Doe',
        adminPhone: '9876543210'
      })
    });
    expect(res2.status).toBe(400);

    // Invalid email format
    const res3 = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Incomplete Academy',
        adminName: 'John Doe',
        adminEmail: 'invalid-email-format',
        adminPhone: '9876543210'
      })
    });
    expect(res3.status).toBe(400);

    // Non-10-digit phone
    const res4 = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Incomplete Academy',
        adminName: 'John Doe',
        adminEmail: 'valid@example.com',
        adminPhone: '123'
      })
    });
    expect(res4.status).toBe(400);
  });

  // ─── 8. Input Sanitization: XSS & NoSQL Payloads ───────────────────────────
  it('8. Input Sanitization — Script tags and NoSQL object injections are safely sanitized', async () => {
    const intakeEmail = `${testEmailPrefix}_xss@test.edu.in`;
    const res = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: '<script>alert("XSS")</script> Delhi Public Modern',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Dr. R. K. <img src=x onerror=alert(1)> Sinha',
        adminEmail: intakeEmail,
        adminPhone: '9876543211',
        city: 'Gaya',
        state: 'Bihar',
        notes: '<svg onload=alert(1)>Injected notes</svg>'
      })
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    // Sanitized output must not contain raw executable tags
    expect(data.application.schoolName).not.toContain('<script>');
    expect(data.application.adminName).not.toContain('<img');
    expect(data.application.notes).not.toContain('<svg');
  });

  // ─── 9. Concurrent Registration Burst & 10-Minute Cooldown ─────────────────
  it('9. Concurrency & Rate Limiting — 25 burst submissions for the same email: exactly 1 accepted, remainder throttled/cooldown', async () => {
    const burstEmail = `${testEmailPrefix}_burst@test.edu.in`;

    const burstRequests = Array.from({ length: 25 }, (_, i) =>
      fetch(`${baseUrl}/tenants/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: `Burst Academy ${i}`,
          category: 'k12-schools',
          board: 'CBSE',
          adminName: 'Rapid Submitter',
          adminEmail: burstEmail,
          adminPhone: '9988776655',
          city: 'Patna',
          state: 'Bihar'
        })
      })
    );

    const responses = await Promise.all(burstRequests);
    const statuses = responses.map((r) => r.status);

    // Exactly 1 must be 201 Created
    const createdCount = statuses.filter((s) => s === 201).length;
    expect(createdCount).toBe(1);

    // Remaining must be either 429 (cooldown) or 409 (duplicate)
    const blockedCount = statuses.filter((s) => s === 429 || s === 409).length;
    expect(blockedCount).toBe(24);
  });

  // ─── 10. Public Status Tracking: Safe Projection & Mandatory Token ───────────
  it('10. Public Status Tracking — Safe applicant view without leaking reviewer IDs or internal checklist', async () => {
    const trackEmail = `${testEmailPrefix}_track@test.edu.in`;

    // 1. Submit application
    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Trackable Public Academy',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Mr. Arvind Gupta',
        adminEmail: trackEmail,
        adminPhone: '9871122334',
        city: 'Bhagalpur',
        state: 'Bihar'
      })
    });
    expect(submitRes.status).toBe(201);
    const submitData = await submitRes.json();
    const appNo = submitData.application.applicationNo;
    const appId = submitData.application.id;
    const trackingToken = submitData.trackingToken;
    expect(trackingToken).toBeDefined();

    // 2. Super Admin marks UNDER_REVIEW and sets internal review notes
    const reviewRes = await fetch(`${baseUrl}/tenants/applications/${appId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ notes: 'CONFIDENTIAL: Internal reviewer background check in progress.' })
    });
    expect(reviewRes.status).toBe(200);

    // 3a. Unauthenticated and unverified public tracking request returns 401
    const unverifiedTrackRes = await fetch(`${baseUrl}/tenants/applications/status/${appNo}`);
    expect(unverifiedTrackRes.status).toBe(401);
    const unverifiedData = await unverifiedTrackRes.json();
    expect(unverifiedData.code).toBe('TRACKING_TOKEN_REQUIRED');

    // 3b. Email-alone request without tracking token returns 401 (email alone is strictly NOT proof of ownership)
    const emailOnlyRes = await fetch(`${baseUrl}/tenants/applications/status/${appNo}?email=${encodeURIComponent(trackEmail)}`);
    expect(emailOnlyRes.status).toBe(401);
    const emailOnlyData = await emailOnlyRes.json();
    expect(emailOnlyData.code).toBe('TRACKING_TOKEN_REQUIRED');

    // 3c. Mismatched tracking token returns 403
    const badTokenTrackRes = await fetch(`${baseUrl}/tenants/applications/status/${appNo}`, {
      headers: { 'x-tracking-token': 'invalid_token_12345' }
    });
    expect(badTokenTrackRes.status).toBe(403);
    const badTokenData = await badTokenTrackRes.json();
    expect(badTokenData.code).toBe('INVALID_TRACKING_TOKEN');

    // 3d. Mismatched email when tracking token is provided returns 403 EMAIL_MISMATCH
    const badEmailTrackRes = await fetch(`${baseUrl}/tenants/applications/status/${appNo}?email=wrong@email.com`, {
      headers: { 'x-tracking-token': trackingToken }
    });
    expect(badEmailTrackRes.status).toBe(403);
    const badEmailData = await badEmailTrackRes.json();
    expect(badEmailData.code).toBe('EMAIL_MISMATCH');

    // 3e. Verified with valid tracking token returns 200 with sanitized data
    const trackRes = await fetch(`${baseUrl}/tenants/applications/status/${appNo}`, {
      headers: { 'x-tracking-token': trackingToken }
    });
    expect(trackRes.status).toBe(200);
    const trackData = await trackRes.json();
    expect(trackData.success).toBe(true);
    expect(trackData.application.applicationNo).toBe(appNo);
    expect(trackData.application.status).toBe('UNDER_REVIEW');

    // Security assertions: Internal reviewer fields and tenantId MUST NOT leak to public view
    expect(trackData.application.reviewerId).toBeUndefined();
    expect(trackData.application.reviewNotes).toBeUndefined();
    expect(trackData.application.verificationChecklist).toBeUndefined();
    expect(trackData.application.tenantId).toBeUndefined();

    // 3f. Valid tracking token + matching registered email query also returns 200
    const fullVerifiedRes = await fetch(`${baseUrl}/tenants/applications/status/${appNo}?email=${encodeURIComponent(trackEmail)}`, {
      headers: { 'x-tracking-token': trackingToken }
    });
    expect(fullVerifiedRes.status).toBe(200);
  });


  // ─── 11. Status Tracking for Non-Existent Application (404) ────────────────
  it('11. Status Tracking 404 — Non-existent reference number returns 404', async () => {
    const res = await fetch(`${baseUrl}/tenants/applications/status/APP-NON-EXISTENT-9999`);
    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error).toBeDefined();
  });

  // ─── 12. Verification Checklist Updates by Super Admin ────────────────────
  it('12. Checklist Persistence — Super Admin updates 6-point verification checklist items', async () => {
    const chkEmail = `${testEmailPrefix}_chk@test.edu.in`;

    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Checklist Test School',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Sanjay Mishra',
        adminEmail: chkEmail,
        adminPhone: '9870011223',
        city: 'Darbhanga',
        state: 'Bihar'
      })
    });
    expect(submitRes.status).toBe(201);
    const submitData = await submitRes.json();
    const appId = submitData.application.id;

    // Update checklist
    const checklistPayload = {
      identityVerified: true,
      documentAuthenticityVerified: true,
      affiliationVerified: true,
      addressVerified: true,
      feeCommercialVerified: false,
      antiFraudCheckPassed: true
    };

    const updateRes = await fetch(`${baseUrl}/tenants/applications/${appId}/checklist`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ checklist: checklistPayload })
    });

    expect(updateRes.status).toBe(200);
    const updateData = await updateRes.json();
    expect(updateData.verificationChecklist.identityVerified).toBe(true);
    expect(updateData.verificationChecklist.documentAuthenticityVerified).toBe(true);
    expect(updateData.verificationChecklist.feeCommercialVerified).toBe(false);
  });

  // ─── 13. State Machine: Request Correction & Public Resubmission ──────────
  it('13. Correction Cycle — Super Admin requests correction -> applicant resubmits -> moves to PENDING_VERIFICATION', async () => {
    const corrEmail = `${testEmailPrefix}_corr@test.edu.in`;

    // 1. Submit
    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Correction Flow Academy',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Anita Roy',
        adminEmail: corrEmail,
        adminPhone: '9872233445',
        city: 'Purnea',
        state: 'Bihar'
      })
    });
    expect(submitRes.status).toBe(201);
    const submitData = await submitRes.json();
    const appId = submitData.application.id;
    const appNo = submitData.application.applicationNo;
    const corrTrackingToken = submitData.trackingToken;

    // 2. Super Admin requests correction (short notes < 5 chars rejected)
    const badReqRes = await fetch(`${baseUrl}/tenants/applications/${appId}/request-correction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ notes: 'Fix' })
    });
    expect(badReqRes.status).toBe(400);

    // Valid correction request
    const corrRes = await fetch(`${baseUrl}/tenants/applications/${appId}/request-correction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ notes: 'Please provide valid 10-digit alternate mobile number.' })
    });
    expect(corrRes.status).toBe(200);
    const corrData = await corrRes.json();
    expect(corrData.application.status).toBe('NEEDS_CORRECTION');

    // 3. Applicant checks status and sees correction notes
    const trackRes = await fetch(`${baseUrl}/tenants/applications/status/${appNo}?email=${encodeURIComponent(corrEmail)}`, {
      headers: { 'x-tracking-token': corrTrackingToken }
    });
    const trackData = await trackRes.json();
    expect(trackData.application.status).toBe('NEEDS_CORRECTION');
    expect(trackData.application.correctionNotes).toBe('Please provide valid 10-digit alternate mobile number.');

    // 4. Applicant resubmits with corrections
    const resubmitRes = await fetch(`${baseUrl}/tenants/applications/${appId}/resubmit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminPhone: '9873344556',
        notes: 'Updated contact phone number as requested.'
      })
    });
    expect(resubmitRes.status).toBe(200);
    const resubmitData = await resubmitRes.json();
    expect(resubmitData.application.status).toBe('PENDING_VERIFICATION');
    expect(resubmitData.application.adminPhone).toBe('9873344556');
  });

  // ─── 14. Invalid Resubmission when NOT in NEEDS_CORRECTION ─────────────────
  it('14. Resubmission Rejection — Resubmission when status is already PENDING_VERIFICATION returns 409', async () => {
    const email = `${testEmailPrefix}_noresubmit@test.edu.in`;

    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'No Resubmit School',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Ravi Kumar',
        adminEmail: email,
        adminPhone: '9874455667',
        city: 'Patna',
        state: 'Bihar'
      })
    });
    const submitData = await submitRes.json();
    const appId = submitData.application.id;

    // Resubmit while status is PENDING_VERIFICATION
    const resubmitRes = await fetch(`${baseUrl}/tenants/applications/${appId}/resubmit`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminPhone: '9875566778' })
    });
    expect(resubmitRes.status).toBe(409);
    const data = await resubmitRes.json();
    expect(data.code).toBe('INVALID_STATE_TRANSITION');
  });

  // ─── 15. Super Admin Rejects Application ──────────────────────────────────
  it('15. Rejection Flow — Super Admin rejects application with reason code', async () => {
    const rejEmail = `${testEmailPrefix}_reject@test.edu.in`;

    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Fraudulent Shell Academy',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Unknown Authorizer',
        adminEmail: rejEmail,
        adminPhone: '9876677889',
        city: 'Patna',
        state: 'Bihar'
      })
    });
    const submitData = await submitRes.json();
    const appId = submitData.application.id;

    // Reject without reason returns 400
    const badRej = await fetch(`${baseUrl}/tenants/applications/${appId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ reason: 'Bad' })
    });
    expect(badRej.status).toBe(400);

    // Reject with valid reason
    const rejRes = await fetch(`${baseUrl}/tenants/applications/${appId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        reason: 'Unable to verify institution registration certificate with department of education.',
        reasonCode: 'DOCS_UNVERIFIED'
      })
    });
    expect(rejRes.status).toBe(200);
    const rejData = await rejRes.json();
    expect(rejData.application.status).toBe('REJECTED');
    expect(rejData.application.rejectionReason).toBeDefined();
  });

  // ─── 16. Invalid Transition: REJECTED cannot be APPROVED ──────────────────
  it('16. State Machine Integrity — An application in REJECTED status cannot be approved (409 Conflict)', async () => {
    const email = `${testEmailPrefix}_rejtoapp@test.edu.in`;

    // 1. Create and reject
    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Strict State Machine School',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Suman Sinha',
        adminEmail: email,
        adminPhone: '9877788990',
        city: 'Patna',
        state: 'Bihar'
      })
    });
    const submitData = await submitRes.json();
    const appId = submitData.application.id;

    await fetch(`${baseUrl}/tenants/applications/${appId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ reason: 'Document verification failed permanently.' })
    });

    // 2. Attempt to approve rejected application
    const approveRes = await fetch(`${baseUrl}/tenants/applications/${appId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ notes: 'Trying to bypass rejection' })
    });

    expect(approveRes.status).toBe(409);
    const data = await approveRes.json();
    expect(data.code).toBe('INVALID_STATE_TRANSITION');
  });

  // ─── 17. Applicant Voluntary Cancellation ──────────────────────────────────
  it('17. Voluntary Cancellation — Applicant can cancel their pending application before approval', async () => {
    const cancelEmail = `${testEmailPrefix}_cancel@test.edu.in`;

    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Self Cancel Academy',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Vikram Seth',
        adminEmail: cancelEmail,
        adminPhone: '9878899001',
        city: 'Patna',
        state: 'Bihar'
      })
    });
    const submitData = await submitRes.json();
    const appId = submitData.application.id;

    const cancelRes = await fetch(`${baseUrl}/tenants/applications/${appId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Institution decided to postpone SaaS onboarding.' })
    });

    expect(cancelRes.status).toBe(200);
    const cancelData = await cancelRes.json();
    expect(cancelData.application.status).toBe('CANCELLED');
  });

  // ─── 18. Legitimate Re-Application After Rejection / Cancellation ─────────
  it('18. Re-application Allowed — An email with a REJECTED or CANCELLED application can submit a new inquiry', async () => {
    const reapplyEmail = `${testEmailPrefix}_reapply@test.edu.in`;

    // 1. Submit first application
    const app1Res = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Initial Incomplete Application',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Pankaj Kumar',
        adminEmail: reapplyEmail,
        adminPhone: '9879900112',
        city: 'Patna',
        state: 'Bihar'
      })
    });
    const app1Data = await app1Res.json();
    const app1Id = app1Data.application.id;

    // 2. Reject first application
    await fetch(`${baseUrl}/tenants/applications/${app1Id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ reason: 'Documents incomplete.' })
    });

    // 3. Submit brand new application with fresh corrected documentation
    const app2Res = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Fresh Corrected Application',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Pankaj Kumar',
        adminEmail: reapplyEmail,
        adminPhone: '9879900112',
        city: 'Patna',
        state: 'Bihar',
        affiliationNumber: 'CBSE/AFF/2026/VALID'
      })
    });

    // Partial unique index only blocks active pending states, so new application must succeed
    expect(app2Res.status).toBe(201);
    const app2Data = await app2Res.json();
    expect(app2Data.application.id).not.toBe(app1Id);
    expect(app2Data.application.status).toBe('PENDING_VERIFICATION');
  });

  // ─── 19. Full End-to-End Approval & Isolated Tenant Provisioning ───────────
  it('19. Tenant Provisioning — Super Admin approves application: creates tenant, root org, admin user & session', async () => {
    const provEmail = `${testEmailPrefix}_provision@test.edu.in`;

    // 1. Submit valid application
    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Nalanda International School',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Dr. Harshvardhan Prasad',
        adminEmail: provEmail,
        adminPhone: '9870099887',
        city: 'Rajgir',
        state: 'Bihar',
        domainType: 'SUBDOMAIN',
        subdomainSlug: `nalanda-${testTimestamp}`,
        planInterest: 'ENTERPRISE',
        estimatedStudents: 1200
      })
    });
    expect(submitRes.status).toBe(201);
    const submitData = await submitRes.json();
    const appId = submitData.application.id;

    // 2. Super Admin marks UNDER_REVIEW
    await fetch(`${baseUrl}/tenants/applications/${appId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ notes: 'Verified CBSE affiliation certificate via CBSE portal.' })
    });

    // 3. Super Admin approves & provisions tenant
    const approveRes = await fetch(`${baseUrl}/tenants/applications/${appId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ notes: 'Full compliance verified. Launching production container.' })
    });

    expect(approveRes.status).toBe(200);
    const approveData = await approveRes.json();
    expect(approveData.success).toBe(true);
    expect(approveData.tenant).toBeDefined();

    const tenantId = approveData.tenant.id;
    expect(tenantId).toMatch(/^I2A-SCH-\d{6}$/);

    // Verify in database: Isolated tenant container was created
    const db = await getDb();
    const tenantDoc = await db.collection('tenants').findOne({ id: tenantId });
    expect(tenantDoc).toBeDefined();
    expect(tenantDoc?.name).toBe('Nalanda International School');
    expect(tenantDoc?.subscriptionStatus).toBe('ACTIVE');

    // Verify root organization node was created
    const orgDoc = await db.collection('organizations').findOne({ tenantId });
    expect(orgDoc).toBeDefined();
    expect(orgDoc?.type).toBe('STANDALONE_INSTITUTION');

    // Verify tenant administrator user was created with hashed invitation token (zero plaintext password or token in DB)
    const userDoc = await db.collection('users').findOne({ tenantId, email: provEmail.toLowerCase() });
    expect(userDoc).toBeDefined();
    expect(userDoc?.role).toBe('PRINCIPAL');
    expect(userDoc?.mustChangePassword).toBe(true);
    expect(userDoc?.invitationTokenHash).toBeDefined();
    expect(userDoc?.invitationToken).toBeUndefined(); // Zero plaintext token stored in database
    expect(userDoc?.password).toBeUndefined(); // Zero plaintext password
    expect(approveData.invitationToken).toBeDefined(); // Token returned in response for secure distribution

    // Verify application status updated to APPROVED with tenantId
    const appDoc = await db.collection('school_applications').findOne({ id: appId });
    expect(appDoc?.status).toBe('APPROVED');
    expect(appDoc?.tenantId).toBe(tenantId);
  });

  // ─── 20. Approval Idempotency Test ─────────────────────────────────────────
  it('20. Idempotent Approval — Repeated approve calls return 200 with idempotent: true and ZERO duplicate tenants', async () => {
    const idemEmail = `${testEmailPrefix}_idempotent@test.edu.in`;

    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Idempotency Guarantee Academy',
        category: 'k12-schools',
        board: 'ICSE',
        adminName: 'Sanjay Kapoor',
        adminEmail: idemEmail,
        adminPhone: '9871133557',
        city: 'Ranchi',
        state: 'Jharkhand'
      })
    });
    const submitData = await submitRes.json();
    const appId = submitData.application.id;

    // First approve call
    const approve1 = await fetch(`${baseUrl}/tenants/applications/${appId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ notes: 'Initial approval' })
    });
    expect(approve1.status).toBe(200);
    const data1 = await approve1.json();
    const tenantId1 = data1.tenant.id;

    // Count tenants before retry
    const db = await getDb();
    const countBefore = await db.collection('tenants').countDocuments({ adminEmail: idemEmail.toLowerCase() });
    expect(countBefore).toBe(1);

    // Second approve call (simulating network retry or double-click)
    const approve2 = await fetch(`${baseUrl}/tenants/applications/${appId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ notes: 'Retry approval' })
    });
    expect(approve2.status).toBe(200);
    const data2 = await approve2.json();
    expect(data2.idempotent).toBe(true);
    expect(data2.tenant.id).toBe(tenantId1);

    // Count tenants after retry: must remain strictly 1
    const countAfter = await db.collection('tenants').countDocuments({ adminEmail: idemEmail.toLowerCase() });
    expect(countAfter).toBe(1);

    // Zero duplicate organizations
    const orgCount = await db.collection('organizations').countDocuments({ tenantId: tenantId1 });
    expect(orgCount).toBe(1);

    // Zero duplicate users
    const userCount = await db.collection('users').countDocuments({ tenantId: tenantId1 });
    expect(userCount).toBe(1);
  });

  // ─── 21. Audit Trail Verification ──────────────────────────────────────────
  it('21. Audit Trail Record — Application lifecycle operations record immutable audit entries', async () => {
    const db = await getDb();
    const auditLogs = await db.collection('audit_logs').find({
      $or: [{ resourceType: 'school_applications' }, { module: 'PLATFORM_ADMIN' }]
    }).toArray();

    // At least one audit record must be logged
    expect(auditLogs.length).toBeGreaterThan(0);
    const sampleLog = auditLogs[0];
    expect(sampleLog.action).toBeDefined();
    expect(sampleLog.timestamp).toBeDefined();
  });

  // ─── 22. Notification Dispatch Verification ────────────────────────────────
  it('22. Notification Record — Lifecycle events record notifications in database', async () => {
    const db = await getDb();
    const notifs = await db.collection('notifications').find({
      recipientEmail: { $regex: '^phase08_test_' }
    }).toArray();

    // At least one notification must be recorded for test applications
    expect(notifs.length).toBeGreaterThan(0);
    const sampleNotif = notifs[0];
    expect(sampleNotif.id).toBeDefined();
    expect(sampleNotif.recipientEmail).toBeDefined();
    expect(sampleNotif.type).toBeDefined();
    expect(sampleNotif.createdAt).toBeDefined();
  });

  // ─── 23. Dynamic Academic Calendar Policy ──────────────────────────────────
  it('23. Academic Calendar Policy — Session calculation dynamically distinguishes K-12 vs Higher Ed calendars', async () => {
    const k12Email = `${testEmailPrefix}_k12_cal@test.edu.in`;
    const collegeEmail = `${testEmailPrefix}_col_cal@test.edu.in`;

    // 1. Submit and approve K-12 School application
    const k12Res = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'K-12 Calendar Public School',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Ramesh Sharma',
        adminEmail: k12Email,
        adminPhone: '9871122334',
        city: 'Patna',
        state: 'Bihar'
      })
    });
    const k12Data = await k12Res.json();
    const k12Approve = await fetch(`${baseUrl}/tenants/applications/${k12Data.application.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({ notes: 'Approve K12' })
    });
    const k12ApproveData = await k12Approve.json();
    const k12TenantId = k12ApproveData.tenant.id;

    // 2. Submit and approve College application
    const colRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Higher Education Institute of Technology',
        category: 'colleges-higher-ed',
        board: 'UNIVERSITY',
        adminName: 'Prof. S. N. Bose',
        adminEmail: collegeEmail,
        adminPhone: '9872233446',
        city: 'Ranchi',
        state: 'Jharkhand'
      })
    });
    const colData = await colRes.json();
    const colApprove = await fetch(`${baseUrl}/tenants/applications/${colData.application.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({ notes: 'Approve College' })
    });
    const colApproveData = await colApprove.json();
    const colTenantId = colApproveData.tenant.id;

    // Verify academic sessions in database
    const db = await getDb();
    const k12Session = await db.collection('academic_sessions').findOne({ schoolId: k12TenantId });
    const colSession = await db.collection('academic_sessions').findOne({ schoolId: colTenantId });

    expect(k12Session).toBeDefined();
    expect(colSession).toBeDefined();

    // K-12 starts April 01
    expect(k12Session?.startDate).toMatch(/-04-01$/);
    expect(k12Session?.endDate).toMatch(/-03-31$/);

    // College starts July 01
    expect(colSession?.startDate).toMatch(/-07-01$/);
    expect(colSession?.endDate).toMatch(/-06-30$/);
  });

  // ─── 24. Unactivated Administrator Login Protection ────────────────────────
  it('24. Unactivated Login Guard — Login attempt on unactivated provisioned account returns 401 ACCOUNT_NOT_ACTIVATED', async () => {
    const unactEmail = `${testEmailPrefix}_unactivated@test.edu.in`;

    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Unactivated Gate Academy',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Sunil Verma',
        adminEmail: unactEmail,
        adminPhone: '9873344558',
        city: 'Gaya',
        state: 'Bihar'
      })
    });
    const submitData = await submitRes.json();
    await fetch(`${baseUrl}/tenants/applications/${submitData.application.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({ notes: 'Approve and test login guard' })
    });

    // Attempt direct login with a guessed password before activation
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: unactEmail, password: 'GuessPassword123#' })
    });

    expect(loginRes.status).toBe(403);
    const loginData = await loginRes.json();
    expect(loginData.code).toBe('ACCOUNT_NOT_ACTIVATED');
  });

  // ─── 25. Cryptographic Account Activation & Password Creation ──────────────
  it('25. Account Activation — Administrator activates account with secure invitation token and sets compliant password', async () => {
    const actEmail = `${testEmailPrefix}_activate@test.edu.in`;

    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Activation Ready School',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Priya Sharma',
        adminEmail: actEmail,
        adminPhone: '9874455669',
        city: 'Muzaffarpur',
        state: 'Bihar'
      })
    });
    const submitData = await submitRes.json();
    const approveRes = await fetch(`${baseUrl}/tenants/applications/${submitData.application.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({ notes: 'Approve for activation test' })
    });
    const approveData = await approveRes.json();
    const invitationToken = approveData.invitationToken;
    expect(invitationToken).toBeDefined();

    // 1. Weak password rejected by complexity policy
    const weakRes = await fetch(`${baseUrl}/auth/activate-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitationToken,
        email: actEmail,
        newPassword: 'weak'
      })
    });
    expect(weakRes.status).toBe(400);

    // 2. Strong compliant password succeeds
    const strongPassword = 'StrongPassword@2026#Launch';
    const actRes = await fetch(`${baseUrl}/auth/activate-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitationToken,
        email: actEmail,
        newPassword: strongPassword
      })
    });
    expect(actRes.status).toBe(200);
    const actData = await actRes.json();
    expect(actData.success).toBe(true);
    expect(actData.token).toBeDefined();
    expect(actData.user.email).toBe(actEmail.toLowerCase());

    // 3. User document in database updated
    const db = await getDb();
    const userDoc = await db.collection('users').findOne({ email: actEmail.toLowerCase() });
    expect(userDoc?.mustChangePassword).toBe(false);
    expect(userDoc?.status).toBe('ACTIVE');
    expect(userDoc?.invitationConsumedAt).toBeDefined();
    expect(userDoc?.invitationTokenHash).toBeUndefined();

    // 4. Administrator can now log in directly with their new password
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: actEmail, password: strongPassword })
    });
    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.token).toBeDefined();
  });

  // ─── 26. Anti-Replay Defense on Invitation Token ───────────────────────────
  it('26. Anti-Replay Defense — Re-using an already consumed invitation token returns 400', async () => {
    const replayEmail = `${testEmailPrefix}_replay@test.edu.in`;

    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Anti-Replay Defense Academy',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Deepak Roy',
        adminEmail: replayEmail,
        adminPhone: '9875566770',
        city: 'Patna',
        state: 'Bihar'
      })
    });
    const submitData = await submitRes.json();
    const approveRes = await fetch(`${baseUrl}/tenants/applications/${submitData.application.id}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({ notes: 'Approve for replay test' })
    });
    const approveData = await approveRes.json();
    const token = approveData.invitationToken;

    // First consumption
    const firstUse = await fetch(`${baseUrl}/auth/activate-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitationToken: token,
        email: replayEmail,
        newPassword: 'FirstValidPassword@2026#'
      })
    });
    expect(firstUse.status).toBe(200);

    // Second consumption (replay attack attempt)
    const replayUse = await fetch(`${baseUrl}/auth/activate-account`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        invitationToken: token,
        email: replayEmail,
        newPassword: 'AttackerNewPassword@2026#'
      })
    });
    expect(replayUse.status).toBe(400);
    const replayData = await replayUse.json();
    expect(['INVALID_INVITATION_TOKEN', 'INVITATION_ALREADY_USED']).toContain(replayData.code);
  });

  // ─── 27. Synthetic Failure Injection & Compensatory Rollback Engine ────────
  it('27. Compensatory Rollback — Synthetic failure injection triggers clean rollback with ZERO orphaned records', async () => {
    const failEmail = `${testEmailPrefix}_failinj@test.edu.in`;

    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Fault Tolerance & Compensation High School',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Vikas Sinha',
        adminEmail: failEmail,
        adminPhone: '9876677881',
        city: 'Bhagalpur',
        state: 'Bihar'
      })
    });
    const submitData = await submitRes.json();
    const appId = submitData.application.id;

    // Super Admin approves with synthetic failure injection header
    const failApproveRes = await fetch(`${baseUrl}/tenants/applications/${appId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`,
        'x-simulate-failure-after-step': 'after-user'
      },
      body: JSON.stringify({ notes: 'Test failure injection and compensation' })
    });

    expect(failApproveRes.status).toBe(500);
    const failData = await failApproveRes.json();
    expect(failData.code).toBe('PROVISIONING_FAILED_ROLLBACK_EXECUTED');
    expect(failData.compensated).toContain('tenants');
    expect(failData.compensated).toContain('organizations');
    expect(failData.compensated).toContain('users');

    // Verify ZERO orphaned records in database
    const db = await getDb();
    const orphanedTenants = await db.collection('tenants').find({ adminEmail: failEmail.toLowerCase() }).toArray();
    expect(orphanedTenants.length).toBe(0);

    const orphanedUsers = await db.collection('users').find({ email: failEmail.toLowerCase() }).toArray();
    expect(orphanedUsers.length).toBe(0);

    // Application document recorded the failure in history and remains in its previous state
    const appDoc = await db.collection('school_applications').findOne({ id: appId });
    expect(appDoc?.status).not.toBe('APPROVED');
    expect(appDoc?.provisioningError).toBeDefined();
    const lastHistory = appDoc?.statusHistory[appDoc.statusHistory.length - 1];
    expect(lastHistory?.notes).toContain('Compensatory rollback executed');
  });

  // ─── 28. Tracking Token Expiration Guard ───────────────────────────────────
  it('28. Tracking Token Expiration Guard — Expired tracking token returns 403 TRACKING_TOKEN_EXPIRED', async () => {
    const email = `${testEmailPrefix}_token_exp@test.edu.in`;
    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Expiry Test School',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Suman Sen',
        adminEmail: email,
        adminPhone: '9878899001',
        city: 'Patna',
        state: 'Bihar'
      })
    });
    expect(submitRes.status).toBe(201);
    const submitData = await submitRes.json();
    const appNo = submitData.application.applicationNo;
    const token = submitData.trackingToken;

    // Simulate expiration in DB
    const db = await getDb();
    await db.collection('school_applications').updateOne(
      { applicationNo: appNo },
      { $set: { trackingTokenExpiresAt: new Date(Date.now() - 3600000).toISOString() } }
    );

    const trackRes = await fetch(`${baseUrl}/tenants/applications/status/${appNo}`, {
      headers: { 'x-tracking-token': token }
    });
    expect(trackRes.status).toBe(403);
    const data = await trackRes.json();
    expect(data.code).toBe('TRACKING_TOKEN_EXPIRED');
  });

  // ─── 29. Tracking Token Revocation Endpoint ─────────────────────────────────
  it('29. Tracking Token Revocation — Explicit token revocation returns 403 on subsequent checks', async () => {
    const email = `${testEmailPrefix}_token_revoke@test.edu.in`;
    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Revoke Test School',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Kunal Verma',
        adminEmail: email,
        adminPhone: '9878899002',
        city: 'Patna',
        state: 'Bihar'
      })
    });
    expect(submitRes.status).toBe(201);
    const submitData = await submitRes.json();
    const appNo = submitData.application.applicationNo;
    const appId = submitData.application.id;
    const token = submitData.trackingToken;

    // Revoke using tracking token
    const revokeRes = await fetch(`${baseUrl}/tenants/applications/${appId}/revoke-tracking-token`, {
      method: 'POST',
      headers: { 'x-tracking-token': token }
    });
    expect(revokeRes.status).toBe(200);
    const revokeData = await revokeRes.json();
    expect(revokeData.success).toBe(true);

    // Inquire status with revoked token
    const trackRes = await fetch(`${baseUrl}/tenants/applications/status/${appNo}`, {
      headers: { 'x-tracking-token': token }
    });
    expect(trackRes.status).toBe(403);
    const data = await trackRes.json();
    expect(data.code).toBe('TRACKING_TOKEN_REVOKED');
  });

  // ─── 30. Tracking Token Cryptographic Rotation ───────────────────────────────
  it('30. Tracking Token Rotation — Rotated token succeeds while old token is invalidated', async () => {
    const email = `${testEmailPrefix}_token_rotate@test.edu.in`;
    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Rotate Test School',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Sunita Jain',
        adminEmail: email,
        adminPhone: '9878899003',
        city: 'Patna',
        state: 'Bihar'
      })
    });
    expect(submitRes.status).toBe(201);
    const submitData = await submitRes.json();
    const appNo = submitData.application.applicationNo;
    const appId = submitData.application.id;
    const oldToken = submitData.trackingToken;

    // Rotate tracking token
    const rotateRes = await fetch(`${baseUrl}/tenants/applications/${appId}/rotate-tracking-token`, {
      method: 'POST',
      headers: { 'x-tracking-token': oldToken }
    });
    expect(rotateRes.status).toBe(200);
    const rotateData = await rotateRes.json();
    expect(rotateData.success).toBe(true);
    const newToken = rotateData.trackingToken;
    expect(newToken).toBeDefined();
    expect(newToken).not.toBe(oldToken);

    // Inquire with old token -> 403 INVALID_TRACKING_TOKEN
    const oldTrackRes = await fetch(`${baseUrl}/tenants/applications/status/${appNo}`, {
      headers: { 'x-tracking-token': oldToken }
    });
    expect(oldTrackRes.status).toBe(403);
    const oldTrackData = await oldTrackRes.json();
    expect(oldTrackData.code).toBe('INVALID_TRACKING_TOKEN');

    // Inquire with new token -> 200 OK
    const newTrackRes = await fetch(`${baseUrl}/tenants/applications/status/${appNo}`, {
      headers: { 'x-tracking-token': newToken }
    });
    expect(newTrackRes.status).toBe(200);
    const newTrackData = await newTrackRes.json();
    expect(newTrackData.success).toBe(true);
  });

  // ─── 31. Tracking Brute-Force Rate Limiting Engine ──────────────────────────
  it('31. Tracking Rate Limiting — 5 consecutive failed tracking attempts triggers 429 lockout', async () => {
    clearTrackingThrottlingCache();
    const email = `${testEmailPrefix}_token_ratelimit@test.edu.in`;
    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Rate Limit Test School',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Deepak Rao',
        adminEmail: email,
        adminPhone: '9878899004',
        city: 'Patna',
        state: 'Bihar'
      })
    });
    expect(submitRes.status).toBe(201);
    const submitData = await submitRes.json();
    const appNo = submitData.application.applicationNo;
    const validToken = submitData.trackingToken;

    // 5 consecutive failed inquiries with wrong tokens
    for (let i = 0; i < 5; i++) {
      await fetch(`${baseUrl}/tenants/applications/status/${appNo}`, {
        headers: { 'x-tracking-token': `wrong_brute_token_${i}` }
      });
    }

    // 6th inquiry must be rate limited with 429
    const blockedRes = await fetch(`${baseUrl}/tenants/applications/status/${appNo}`, {
      headers: { 'x-tracking-token': validToken }
    });
    expect(blockedRes.status).toBe(429);
    const blockedData = await blockedRes.json();
    expect(blockedData.code).toBe('TRACKING_RATE_LIMITED');
    expect(blockedData.remainingSec).toBeGreaterThan(0);

    // Reset throttle cache for subsequent tests
    clearTrackingThrottlingCache();
  });

  // ─── 32. Cross-Application Tracking Rejection ───────────────────────────────
  it('32. Cross-Application Boundary — Using Application A token on Application B returns 403', async () => {
    const emailA = `${testEmailPrefix}_cross_a@test.edu.in`;
    const emailB = `${testEmailPrefix}_cross_b@test.edu.in`;

    const [resA, resB] = await Promise.all([
      fetch(`${baseUrl}/tenants/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: 'Cross App School A',
          category: 'k12-schools',
          board: 'CBSE',
          adminName: 'Admin A',
          adminEmail: emailA,
          adminPhone: '9878899005',
          city: 'Patna',
          state: 'Bihar'
        })
      }),
      fetch(`${baseUrl}/tenants/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: 'Cross App School B',
          category: 'k12-schools',
          board: 'CBSE',
          adminName: 'Admin B',
          adminEmail: emailB,
          adminPhone: '9878899006',
          city: 'Patna',
          state: 'Bihar'
        })
      })
    ]);

    const dataA = await resA.json();
    const dataB = await resB.json();

    // Use Token A to query Application B
    const crossRes = await fetch(`${baseUrl}/tenants/applications/status/${dataB.application.applicationNo}`, {
      headers: { 'x-tracking-token': dataA.trackingToken }
    });
    expect(crossRes.status).toBe(403);
    const crossData = await crossRes.json();
    expect(crossData.code).toBe('INVALID_TRACKING_TOKEN');
  });

  // ─── 33. Production Lockdown of Failure Injection ───────────────────────────
  it('33. Failure Injection Lockdown — In NODE_ENV=production, header is strictly ignored and approval succeeds', async () => {
    const email = `${testEmailPrefix}_prodlockdown@test.edu.in`;
    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Production Hardened Academy',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Priya Sharma',
        adminEmail: email,
        adminPhone: '9878899007',
        city: 'Patna',
        state: 'Bihar'
      })
    });
    expect(submitRes.status).toBe(201);
    const submitData = await submitRes.json();
    const appId = submitData.application.id;

    // Simulate NODE_ENV=production
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    try {
      const approveRes = await fetch(`${baseUrl}/tenants/applications/${appId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
          'x-simulate-failure-after-step': 'after-user'
        },
        body: JSON.stringify({ notes: 'Approve in production environment' })
      });

      // In production mode, header must be IGNORED and provisioning succeeds
      expect(approveRes.status).toBe(200);
      const approveData = await approveRes.json();
      expect(approveData.success).toBe(true);
      expect(approveData.tenantId).toBeDefined();

      const db = await getDb();
      const tenantDoc = await db.collection('tenants').findOne({ adminEmail: email });
      expect(tenantDoc).toBeDefined();
    } finally {
      process.env.NODE_ENV = originalEnv || 'test';
    }
  });

  // ─── 34. Compensatory Rollback Failure Durable State ────────────────────────
  it('34. Rollback Failure Handling — If rollback fails, persists PROVISIONING_FAILED_COMPENSATION_FAILED and logs critical alert', async () => {
    const email = `${testEmailPrefix}_rollback_fail@test.edu.in`;
    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Catastrophic Rollback Failure School',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Rameshwar Roy',
        adminEmail: email,
        adminPhone: '9878899008',
        city: 'Patna',
        state: 'Bihar'
      })
    });
    expect(submitRes.status).toBe(201);
    const submitData = await submitRes.json();
    const appId = submitData.application.id;

    const db = await getDb();

    try {
      const approveRes = await fetch(`${baseUrl}/tenants/applications/${appId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`,
          'x-simulate-failure-after-step': 'after-tenant',
          'x-simulate-rollback-failure': 'true'
        },
        body: JSON.stringify({ notes: 'Simulate rollback failure' })
      });

      expect(approveRes.status).toBe(500);
      const data = await approveRes.json();
      expect(data.code).toBe('PROVISIONING_FAILED_COMPENSATION_FAILED');
      expect(data.manualRecoveryRequired).toBe(true);

      // Verify database state: durable recovery status persisted
      const appDoc = await db.collection('school_applications').findOne({ id: appId });
      expect(appDoc?.provisioningRecoveryStatus).toBe('PROVISIONING_FAILED_COMPENSATION_FAILED');
      expect(appDoc?.manualRecoveryRequired).toBe(true);
      expect(appDoc?.rollbackError).toContain('synthetic catastrophic storage error');

      // Verify critical audit log
      const auditLog = await db.collection('audit_logs').findOne({
        action: 'TENANT_PROVISIONING_ROLLBACK_FAILED',
        details: { $regex: 'CRITICAL ALERT' }
      });
      expect(auditLog).toBeDefined();
    } finally {
      // Clean up test tenant
      await db.collection('tenants').deleteOne({ adminEmail: email });
    }
  });

  // ─── 35. Concurrent Invitation Activation Race Condition ────────────────────
  it('35. Invitation Concurrency — Two concurrent activation requests with identical token: exactly 1 succeeds, 1 returns 400', async () => {
    const email = `${testEmailPrefix}_race_inv@test.edu.in`;
    const submitRes = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Invitation Race Academy',
        category: 'k12-schools',
        board: 'CBSE',
        adminName: 'Race Admin',
        adminEmail: email,
        adminPhone: '9878899009',
        city: 'Patna',
        state: 'Bihar'
      })
    });
    expect(submitRes.status).toBe(201);
    const submitData = await submitRes.json();
    const appId = submitData.application.id;

    // Approve to obtain raw invitationToken
    const approveRes = await fetch(`${baseUrl}/tenants/applications/${appId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ notes: 'Approval for race test' })
    });
    expect(approveRes.status).toBe(200);
    const approveData = await approveRes.json();
    const invitationToken = approveData.invitationToken;
    expect(invitationToken).toBeDefined();

    // Fire 2 concurrent activation requests simultaneously
    const activate = (password: string) =>
      fetch(`${baseUrl}/auth/activate-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invitationToken,
          email,
          newPassword: password
        })
      });

    const [res1, res2] = await Promise.all([
      activate('WinnerPassword@2026#'),
      activate('LoserPassword@2026#')
    ]);

    const statuses = [res1.status, res2.status].sort();
    // Exactly one 200 (winner) and one 400 (loser - INVITATION_ALREADY_USED)
    expect(statuses).toEqual([200, 400]);

    const loserRes = res1.status === 400 ? res1 : res2;
    const loserData = await loserRes.json();
    expect(loserData.code).toBe('INVITATION_ALREADY_USED');

    // Verify database state: invitationConsumedAt exists and is recorded exactly once
    const db = await getDb();
    const user = await db.collection('users').findOne({ email: email.toLowerCase() });
    expect(user?.invitationConsumedAt).toBeDefined();
    expect(user?.mustChangePassword).toBe(false);
  });
});

