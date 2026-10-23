/**
 * i2A SchoolOS — Master Prompt 07: Public SaaS Website, Category CMS, Pricing & Advertising Foundation
 * Adversarial & Functional Test Suite
 * Target DB: mongodb://127.0.0.1:27017/i2a_schoolos_synthetic_test
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { app } from '../../server/index.js';
import { getDb, closeDb } from '../../server/db.js';
import { ensureCategoriesSeeded, SEED_CATEGORIES } from '../../server/routes/categories.js';

describe('i2A SchoolOS — Master Prompt 07: Public Website, Category CMS & Pricing Engine', () => {
  let server: http.Server;
  let baseUrl: string;

  let superAdminToken = '';
  let principalToken = '';
  let teacherToken = '';
  let parentToken = '';

  const testCategorySlug = 'synth-robotics-academy';
  let createdCategoryId = '';

  beforeAll(async () => {
    process.env.VITEST = 'true';
    process.env.TEST_DB_NAME = 'i2a_schoolos_synthetic_test';

    const db = await getDb();
    expect(db).toBeDefined();
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');

    // Clean up any residual test categories from previous test runs
    await db.collection('institution_categories').deleteMany({
      slug: { $in: [testCategorySlug, 'synth-draft-category', 'synth-tamper-cat'] }
    });

    // Ensure seed categories are present
    await ensureCategoriesSeeded();

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
  });

  afterAll(async () => {
    // Clean up test category if created
    try {
      const db = await getDb();
      if (testCategorySlug) {
        await db.collection('institution_categories').deleteMany({
          slug: { $in: [testCategorySlug, 'synth-draft-category', 'synth-tamper-cat'] }
        });
      }
    } catch {
      // Ignore
    }

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closeDb();
  });

  // ==========================================================================
  // PART 1: CATEGORY CMS — PUBLIC VISIBILITY & FILTER ISOLATION
  // ==========================================================================

  it('Vector 01: GET /api/categories returns published categories sorted by displayOrder', async () => {
    const res = await fetch(`${baseUrl}/categories`);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(Array.isArray(body.categories)).toBe(true);
    expect(body.categories.length).toBeGreaterThanOrEqual(7);

    // Verify all returned categories have status PUBLISHED
    for (const cat of body.categories) {
      expect(cat.status).toBe('PUBLISHED');
      expect(cat.slug).toBeDefined();
      expect(cat.name).toBeDefined();
    }

    // Verify sort order
    for (let i = 1; i < body.categories.length; i++) {
      expect(body.categories[i].displayOrder).toBeGreaterThanOrEqual(body.categories[i - 1].displayOrder);
    }
  });

  it('Vector 02: Public category list strictly excludes DRAFT and ARCHIVED categories', async () => {
    const db = await getDb();
    // Insert a draft category
    await db.collection('institution_categories').insertOne({
      id: 'cat-synth-draft-99',
      slug: 'synth-draft-category',
      name: 'Draft Hidden Academy',
      status: 'DRAFT',
      displayOrder: 99,
      createdAt: new Date().toISOString()
    });

    const res = await fetch(`${baseUrl}/categories`);
    const body = await res.json();
    const foundDraft = body.categories.find((c: any) => c.slug === 'synth-draft-category');
    expect(foundDraft).toBeUndefined();
  });

  it('Vector 03: GET /api/categories/:slug returns single published category by valid slug', async () => {
    const res = await fetch(`${baseUrl}/categories/k12-schools`);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.category).toBeDefined();
    expect(body.category.slug).toBe('k12-schools');
    expect(body.category.name).toBe('K-12 Schools');
    expect(body.category.workflowHighlights.length).toBeGreaterThan(0);
    expect(body.category.keyFeatures.length).toBeGreaterThan(0);
  });

  it('Vector 04: GET /api/categories/:slug returns 404 CATEGORY_NOT_FOUND for draft/archived/non-existent slugs', async () => {
    // Non-existent slug
    const res1 = await fetch(`${baseUrl}/categories/non-existent-secret-slug-999`);
    expect(res1.status).toBe(404);
    const body1 = await res1.json();
    expect(body1.code).toBe('CATEGORY_NOT_FOUND');

    // Draft slug
    const res2 = await fetch(`${baseUrl}/categories/synth-draft-category`);
    expect(res2.status).toBe(404);
    const body2 = await res2.json();
    expect(body2.code).toBe('CATEGORY_NOT_FOUND');
  });

  // ==========================================================================
  // PART 2: CATEGORY CMS — RBAC & AUTHORIZATION GATES
  // ==========================================================================

  it('Vector 05: Admin category endpoints reject unauthenticated requests with 401', async () => {
    const resGet = await fetch(`${baseUrl}/categories/admin/all`);
    expect(resGet.status).toBe(401);

    const resPost = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Robotics Academy', slug: testCategorySlug })
    });
    expect(resPost.status).toBe(401);
  });

  it('Vector 06: Non-super-admin roles (Teacher, Parent, Principal) receive 403 Forbidden on mutations', async () => {
    // Principal attempt
    const resPrinc = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`
      },
      body: JSON.stringify({ name: 'Robotics Academy', slug: testCategorySlug })
    });
    expect(resPrinc.status).toBe(403);

    // Teacher attempt
    const resTeacher = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({ name: 'Robotics Academy', slug: testCategorySlug })
    });
    expect(resTeacher.status).toBe(403);

    // Parent attempt
    const resParent = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${parentToken}`
      },
      body: JSON.stringify({ name: 'Robotics Academy', slug: testCategorySlug })
    });
    expect(resParent.status).toBe(403);
  });

  it('Vector 07: GET /api/categories/admin/all returns full inventory including DRAFTs for SUPER_ADMIN', async () => {
    const res = await fetch(`${baseUrl}/categories/admin/all`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    const draftFound = body.categories.find((c: any) => c.slug === 'synth-draft-category');
    expect(draftFound).toBeDefined();
    expect(draftFound.status).toBe('DRAFT');
  });

  // ==========================================================================
  // PART 3: CATEGORY CMS — INPUT VALIDATION, SLUG INTEGRITY & XSS SANITIZATION
  // ==========================================================================

  it('Vector 08: POST /api/categories rejects missing or empty name with HTTP 400', async () => {
    const res = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({ slug: 'valid-slug-name-missing' })
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Category name is required');
  });

  it('Vector 09: POST /api/categories rejects malformed slug formats with HTTP 400', async () => {
    const badSlugs = [
      'Invalid Slug With Spaces',
      'UPPERCASE_SLUG',
      'slug/with/slashes',
      'slug$with$operators',
      'a', // Too short (< 3 chars)
      '-leading-hyphen',
      'trailing-hyphen-'
    ];

    for (const badSlug of badSlugs) {
      const res = await fetch(`${baseUrl}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${superAdminToken}`
        },
        body: JSON.stringify({ name: 'Test Category', slug: badSlug })
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain('Invalid slug format');
    }
  });

  it('Vector 10: POST /api/categories rejects duplicate slugs with 409 SLUG_CONFLICT', async () => {
    // Attempt to register category with existing slug 'k12-schools'
    const res = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        name: 'Duplicate K-12 Academy',
        slug: 'k12-schools'
      })
    });
    expect(res.status).toBe(409);
    const body = await res.json();
    expect(body.code).toBe('SLUG_CONFLICT');
    expect(body.error).toContain('already exists');
  });

  it('Vector 11: POST /api/categories creates new category, strips XSS tags, and logs audit event', async () => {
    const maliciousPayload = {
      name: 'Robotics & STEM Labs <script>alert("xss")</script>',
      slug: testCategorySlug,
      subtitle: 'Hands-on Coding & AI <img src=x onerror=alert(1)>',
      tagline: 'Future skills for junior engineers',
      description: 'Comprehensive curriculum <b>with bold</b> and <script>malicious()</script>',
      status: 'PUBLISHED',
      displayOrder: 8,
      recommendedPlan: 'STARTER'
    };

    const res = await fetch(`${baseUrl}/categories`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify(maliciousPayload)
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.category).toBeDefined();

    createdCategoryId = body.category.id;

    // Verify XSS tags were stripped
    expect(body.category.name).not.toContain('<script>');
    expect(body.category.name).toContain('Robotics &amp; STEM Labs');
    expect(body.category.subtitle).not.toContain('<img');

    // Verify audit log
    const db = await getDb();
    const auditLog = await db.collection('audit_logs').findOne({
      action: 'CMS_CATEGORY_CREATED',
      'details': { $regex: testCategorySlug }
    });
    expect(auditLog).toBeDefined();
  });

  it('Vector 12: PUT /api/categories/:id updates fields and soft-deletes with DELETE /:id', async () => {
    expect(createdCategoryId).toBeDefined();

    // 1. Update tagline
    const updateRes = await fetch(`${baseUrl}/categories/${createdCategoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        tagline: 'Updated Robotics tagline for testing'
      })
    });
    expect(updateRes.status).toBe(200);
    const updateBody = await updateRes.json();
    expect(updateBody.category.tagline).toBe('Updated Robotics tagline for testing');

    // 2. Soft-delete / Archive
    const deleteRes = await fetch(`${baseUrl}/categories/${createdCategoryId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    expect(deleteRes.status).toBe(200);

    // 3. Confirm category is now ARCHIVED and hidden from public GET
    const publicRes = await fetch(`${baseUrl}/categories/${testCategorySlug}`);
    expect(publicRes.status).toBe(404);
  });

  // ==========================================================================
  // PART 4: PUBLIC PRICING & QUOTATION CALCULATOR API
  // ==========================================================================

  it('Vector 13: GET /api/pricing/plans returns 3 published tiers without secret leaks', async () => {
    const res = await fetch(`${baseUrl}/pricing/plans`);
    expect(res.status).toBe(200);
    const body = await res.json();

    expect(body.success).toBe(true);
    expect(body.currency).toBe('INR');
    expect(body.gstRatePercent).toBe(18);
    expect(body.plans.length).toBe(3);

    const planIds = body.plans.map((p: any) => p.id);
    expect(planIds).toContain('STARTER');
    expect(planIds).toContain('PROFESSIONAL');
    expect(planIds).toContain('ENTERPRISE');

    // Verify no secret leakage
    const stringified = JSON.stringify(body);
    expect(stringified).not.toContain('secret');
    expect(stringified).not.toContain('password');
    expect(stringified).not.toContain('mongodb');
  });

  it('Vector 14: POST /api/pricing/quote calculates exact mathematical breakdown with GST & volume cap', async () => {
    // 600 students, Professional Plan, Yearly billing
    const res = await fetch(`${baseUrl}/pricing/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'PROFESSIONAL',
        studentCount: 600,
        durationYears: 1,
        billingCycle: 'YEARLY'
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const q = body.quote;

    expect(q.planId).toBe('PROFESSIONAL');
    expect(q.students).toBe(600);
    expect(q.baseCostPerYear).toBe(40000); // Professional annual base
    expect(q.studentCostPerYear).toBe(600 * 100); // 60,000

    const subtotal = 40000 + 60000; // 100,000
    expect(q.annualSubtotal).toBe(subtotal);

    // 600 students is > 400 students bracket -> 5% volume discount
    expect(q.volumeDiscountPercent).toBe(5);
    expect(q.totalDiscountPercent).toBe(5);

    const discountAmount = (subtotal * 5) / 100; // 5,000
    expect(q.discountAmount).toBe(discountAmount);

    const netTaxable = subtotal - discountAmount; // 95,000
    expect(q.netTaxableAmount).toBe(netTaxable);

    const gst = Math.round(netTaxable * 0.18); // 17,100
    expect(q.gstAmount).toBe(gst);

    const grandTotal = netTaxable + gst; // 112,100
    expect(q.grandTotalWithGst).toBe(grandTotal);
  });

  it('Vector 15: POST /api/pricing/quote caps total discount strictly at 40% maximum', async () => {
    // 5000 students (>3000 -> 20%) + 5 years (-> 20%) = 40%
    const res = await fetch(`${baseUrl}/pricing/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'ENTERPRISE',
        studentCount: 5000,
        durationYears: 5,
        billingCycle: 'YEARLY'
      })
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.quote.totalDiscountPercent).toBeLessThanOrEqual(40);
  });

  // ==========================================================================
  // PART 5: PUBLIC REGISTRATION & TRIAL ENTRY WORKFLOW
  // ==========================================================================

  it('Vector 16: POST /api/tenants/applications rejects missing mandatory fields with 400', async () => {
    const res = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ schoolName: 'Incomplete Academy' })
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('name, administrator email, and mobile phone are required');
  });

  it('Vector 17: POST /api/tenants/applications rejects invalid email formats with 400', async () => {
    const res = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Valid Academy',
        adminName: 'Valid Lead',
        adminEmail: 'invalid-email-no-at-sign',
        adminPhone: '9876543210'
      })
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid email address format');
  });

  it('Vector 18: POST /api/tenants/applications rejects invalid phone numbers with 400', async () => {
    const res = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolName: 'Valid Academy',
        adminName: 'Valid Lead',
        adminEmail: 'valid@example.com',
        adminPhone: '123' // Too short (<10 digits)
      })
    });

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid phone number format');
  });

  it('Vector 19: Anti-Tamper: Client attempting to inject status: APPROVED or verified: true is strictly overridden', async () => {
    const tamperPayload = {
      schoolName: 'Tamper Test Academy <script>alert("hack")</script>',
      category: 'k12-schools',
      adminName: 'Malicious Applicant',
      adminEmail: `tamper.applicant.${Date.now()}@example.com`,
      adminPhone: '9876543210',
      status: 'APPROVED',       // Attacker attempt to bypass verification
      verified: true,           // Attacker attempt to self-verify
      role: 'SUPER_ADMIN',      // Attacker attempt to gain root
      id: 'I2A-SCH-FORGED-01'   // Attacker attempt to set tenant ID
    };

    const res = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tamperPayload)
    });

    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.application).toBeDefined();

    const appRecord = body.application;

    // Strict assertions: Status must be locked to PENDING_VERIFICATION
    expect(appRecord.status).toBe('PENDING_VERIFICATION');
    expect(appRecord.verified).toBe(false);
    expect(appRecord.role).toBeUndefined();
    expect(appRecord.id).not.toBe('I2A-SCH-FORGED-01');
    expect(appRecord.applicationNo).toMatch(/^REG-\d{4}-\d{6}$/);

    // Verify XSS tag was stripped from schoolName
    expect(appRecord.schoolName).not.toContain('<script>');
  });

  it('Vector 20: Audit event logged for public trial application', async () => {
    const db = await getDb();
    const auditLog = await db.collection('audit_logs').findOne(
      {
        action: 'SCHOOL_APPLICATION_SUBMITTED',
        'details': { $regex: 'Tamper Test Academy' }
      },
      { sort: { timestamp: -1 } }
    );

    expect(auditLog).toBeDefined();
    expect(auditLog.actorRole || auditLog.role).toBe('APPLICANT');
  });

  // ==========================================================================
  // PART 6: DATABASE ISOLATION & FAIL-CLOSED INTEGRITY
  // ==========================================================================

  it('Vector 21: Protected application database (i2a_schoolos) was untouched by all tests', async () => {
    const db = await getDb();
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');
    expect(db.databaseName).not.toBe('i2a_schoolos');
    expect(db.databaseName).not.toBe('i2a_schoolos_test');
  });

  it('Vector 22: Unauthenticated requests cannot read pending applications queue', async () => {
    const res = await fetch(`${baseUrl}/tenants/applications/queue`);
    expect(res.status).toBe(401);
  });

  // ==========================================================================
  // PART 7: RE-AUDIT ADVERSARIAL COVERAGE
  // ==========================================================================

  it('Vector 23: Seed Fallback Leak Protection: Archived category in DB returns 404 and never leaks via static seeds', async () => {
    const db = await getDb();
    const archivedSlug = 'archived-test-vertical';

    // Insert or update an archived category in DB
    await db.collection('institution_categories').updateOne(
      { slug: archivedSlug },
      {
        $set: {
          id: 'CAT-ARCHIVED-TEST',
          slug: archivedSlug,
          name: 'Archived Vertical Academy',
          status: 'ARCHIVED',
          updatedAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );

    // Fetch public slug
    const res = await fetch(`${baseUrl}/categories/${archivedSlug}`);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.code).toBe('CATEGORY_NOT_FOUND');

    // Clean up
    await db.collection('institution_categories').deleteOne({ slug: archivedSlug });
  });

  it('Vector 24: Duplicate Registration Throttling: Rapid resubmission with same email within 10 minutes returns HTTP 429', async () => {
    const throttleEmail = `throttle.applicant.${Date.now()}@example.com`;
    const payload = {
      schoolName: 'Throttle Defense Academy',
      category: 'k12-schools',
      adminName: 'Test Applicant',
      adminEmail: throttleEmail,
      adminPhone: '9876543210'
    };

    // First submission: should succeed with 201
    const res1 = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    expect(res1.status).toBe(201);
    const body1 = await res1.json();
    expect(body1.success).toBe(true);

    // Second immediate submission with same email: should return 429 throttled
    const res2 = await fetch(`${baseUrl}/tenants/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    expect(res2.status).toBe(429);
    const body2 = await res2.json();
    expect(body2.success).toBe(false);
    expect(body2.code).toBe('DUPLICATE_APPLICATION_THROTTLED');
    expect(body2.applicationNo).toBe(body1.application.applicationNo);
  });

  it('Vector 25: Financial Engine Boundaries: Strict validation rejects fractional, negative, missing, and excessive inputs', async () => {
    // 1. Fractional student count: 450.85 -> Must return 400 FRACTIONAL_STUDENT_COUNT
    const resFloat = await fetch(`${baseUrl}/pricing/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'PROFESSIONAL',
        studentCount: 450.85,
        durationYears: 1,
        billingCycle: 'YEARLY'
      })
    });
    expect(resFloat.status).toBe(400);
    const bodyFloat = await resFloat.json();
    expect(bodyFloat.success).toBe(false);
    expect(bodyFloat.code).toBe('FRACTIONAL_STUDENT_COUNT');

    // 2. Fractional duration: 1.5 -> Must return 400 FRACTIONAL_DURATION
    const resFloatDur = await fetch(`${baseUrl}/pricing/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'PROFESSIONAL',
        studentCount: 500,
        durationYears: 1.5,
        billingCycle: 'YEARLY'
      })
    });
    expect(resFloatDur.status).toBe(400);
    const bodyFloatDur = await resFloatDur.json();
    expect(bodyFloatDur.success).toBe(false);
    expect(bodyFloatDur.code).toBe('FRACTIONAL_DURATION');

    // 3. Negative student count: -250 -> Must return 400 STUDENT_COUNT_BELOW_MINIMUM
    const resNeg = await fetch(`${baseUrl}/pricing/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'STARTER',
        studentCount: -250,
        durationYears: 1,
        billingCycle: 'YEARLY'
      })
    });
    expect(resNeg.status).toBe(400);
    const bodyNeg = await resNeg.json();
    expect(bodyNeg.success).toBe(false);
    expect(bodyNeg.code).toBe('STUDENT_COUNT_BELOW_MINIMUM');

    // 4. Missing student count -> Must return 400 MISSING_STUDENT_COUNT
    const resMissing = await fetch(`${baseUrl}/pricing/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'STARTER',
        durationYears: 1
      })
    });
    expect(resMissing.status).toBe(400);
    const bodyMissing = await resMissing.json();
    expect(bodyMissing.code).toBe('MISSING_STUDENT_COUNT');

    // 5. Excessive student count: 35000 -> Must return 400 STUDENT_COUNT_EXCEEDS_MAXIMUM
    const resExcess = await fetch(`${baseUrl}/pricing/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'ENTERPRISE',
        studentCount: 35000,
        durationYears: 1
      })
    });
    expect(resExcess.status).toBe(400);
    const bodyExcess = await resExcess.json();
    expect(bodyExcess.code).toBe('STUDENT_COUNT_EXCEEDS_MAXIMUM');

    // 6. Consistent 'students' alias check and anti-tamper client override
    const resAlias = await fetch(`${baseUrl}/pricing/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'PROFESSIONAL',
        students: 600,
        durationYears: 2,
        grandTotalWithGst: 100, // Attacker forged price
        totalDiscountPercent: 99 // Attacker forged discount
      })
    });
    expect(resAlias.status).toBe(200);
    const bodyAlias = await resAlias.json();
    expect(bodyAlias.success).toBe(true);
    expect(bodyAlias.quote.students).toBe(600);
    expect(bodyAlias.quote.studentCount).toBe(600);
    expect(bodyAlias.quote.isProvisional).toBe(true);
    expect(bodyAlias.quote.disclaimer).toBeDefined();
    // Verify client forged price was strictly overridden with authoritative calculation
    expect(bodyAlias.quote.grandTotalWithGst).toBeGreaterThan(100);
    expect(bodyAlias.quote.totalDiscountPercent).toBeLessThanOrEqual(40);
  });

  it('Vector 26: Financial Engine Security: Duration boundaries and 40% maximum discount cap', async () => {
    // Duration out of bounds: 10 years -> Must return 400 DURATION_OUT_OF_BOUNDS
    const resOutDur = await fetch(`${baseUrl}/pricing/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'ENTERPRISE',
        studentCount: 5000,
        durationYears: 10,
        billingCycle: 'YEARLY'
      })
    });
    expect(resOutDur.status).toBe(400);
    const bodyOutDur = await resOutDur.json();
    expect(bodyOutDur.code).toBe('DURATION_OUT_OF_BOUNDS');

    // Valid max tier: 5 years + 5000 students -> 20% volume + 20% multi-year = 40% capped
    const resMaxDiscount = await fetch(`${baseUrl}/pricing/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        planId: 'ENTERPRISE',
        studentCount: 5000,
        durationYears: 5,
        billingCycle: 'YEARLY'
      })
    });
    expect(resMaxDiscount.status).toBe(200);
    const bodyMax = await resMaxDiscount.json();
    expect(bodyMax.success).toBe(true);
    expect(bodyMax.quote.totalDiscountPercent).toBe(40);
  });

  it('Vector 27: Registration High Concurrency Stress Test: 25 concurrent requests yield exactly 1 insert and 24 throttled', async () => {
    const db = await getDb();
    const rawEmail = `CONCURRENCY.APPLICANT.${Date.now()}@EXAMPLE.COM`;
    const normalizedEmail = rawEmail.toLowerCase().trim();

    // Prepare 25 concurrent requests with varying casing and whitespace
    const concurrentRequests = Array.from({ length: 25 }, (_, idx) => {
      const emailVariant = idx % 2 === 0 ? rawEmail : `  ${normalizedEmail}  `;
      return fetch(`${baseUrl}/tenants/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName: `Concurrency Stress Academy #${idx + 1}`,
          category: 'k12-schools',
          board: 'CBSE',
          adminName: `Applicant ${idx + 1}`,
          adminEmail: emailVariant,
          adminPhone: '9876543210',
          estimatedStudents: 500
        })
      });
    });

    const responses = await Promise.all(concurrentRequests);
    const statuses = responses.map(r => r.status);

    const successCount = statuses.filter(s => s === 201).length;
    const throttledCount = statuses.filter(s => s === 429).length;

    // Strict assertion: Exactly 1 request succeeds, exactly 24 are throttled
    expect(successCount).toBe(1);
    expect(throttledCount).toBe(24);

    // Verify database collection state: Exactly 1 record created in MongoDB
    const recordsInDb = await db.collection('school_applications').find({
      adminEmail: normalizedEmail,
      status: 'PENDING_VERIFICATION'
    }).toArray();

    expect(recordsInDb.length).toBe(1);
    expect(recordsInDb[0].adminEmail).toBe(normalizedEmail);
    expect(recordsInDb[0].status).toBe('PENDING_VERIFICATION');

    // Clean up test document
    await db.collection('school_applications').deleteMany({ adminEmail: normalizedEmail });
  });
});
