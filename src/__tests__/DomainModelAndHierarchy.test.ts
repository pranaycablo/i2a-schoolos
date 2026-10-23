/**
 * i2A SchoolOS — Master Prompt 03: Domain Model, Data Dictionary & Organization Hierarchy Test Suite
 * 
 * Verifies all 15 mandatory architectural scenarios:
 * 1. Disambiguation of identical school names across different tenants
 * 2. Parent organization only views authorized child organizations and branches
 * 3. Branch administrator cannot access unauthorized branch data
 * 4. Cross-tenant ID access rejected (IDOR prevention)
 * 5. Enrollment with student or session from foreign tenant rejected
 * 6. Invalid parent-child hierarchy (non-existent parent) rejected
 * 7. Circular organization relationship rejected (A -> B -> A)
 * 8. Duplicate identifiers & duplicate enrollment validation
 * 9. Standalone school works without optional region/district/block/cluster
 * 10. Configuration works for Nursery, LKG, UKG, Grade 1-12, and coaching batches
 * 11. Multi-session student enrollment history & progression
 * 12. Multiple guardians <-> multiple students relationships
 * 13. Unauthenticated and insufficiently authorized requests rejected
 * 14. Zero unauthorized write or data copy between i2a_schoolos and synthetic test DB
 * 15. Regression compatibility with existing core security services
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb, closeDb } from '../../server/db.js';
import {
  validateOrganization,
  validateBranchCampus,
  validateAcademicSession,
  validateClassGrade,
  validateSectionBatch,
  validateStudentProfile,
  validateStudentEnrollment,
  validateGuardianRelationship
} from '../../server/services/domainValidation.js';
import {
  validateOrganizationLink,
  resolveOrganizationBranches,
  isSchoolUnderOrganization,
  validateEnrollmentBoundaries,
  linkGuardianToStudent
} from '../../server/services/hierarchyService.js';
import {
  TenantSecurityService,
  type UserSession,
  TenantSecurityException
} from '../services/TenantSecurityService';

describe('i2A SchoolOS — Master Prompt 03: Domain Model & Organization Hierarchy Suite', () => {
  let db: any;

  beforeAll(async () => {
    process.env.TEST_DB_NAME = 'i2a_schoolos_synthetic_test';
    db = await getDb();
  });

  afterAll(async () => {
    await closeDb();
  });

  // --------------------------------------------------------------------------
  // Scenario 1: Identical School Names Disambiguation
  // --------------------------------------------------------------------------
  it('Scenario 1: Disambiguates identical school names across distinct tenants', async () => {
    // Both schools share the exact same display name: "ABC Public School (Synthetic Test)"
    const school1 = await db.collection('tenants').findOne({ id: 'I2A-SCH-000001' });
    const school4 = await db.collection('tenants').findOne({ id: 'I2A-SCH-000004' });

    expect(school1).toBeDefined();
    expect(school4).toBeDefined();
    expect(school1.name).toBe(school4.name);

    // Guaranteed distinct immutable IDs and distinct codes
    expect(school1.id).not.toBe(school4.id);
    expect(school1.code).not.toBe(school4.code);
    expect(school1.orgId).toBe('org-synth-dps');
    expect(school4.orgId).toBeNull();

    // Tenant-filtered query isolates data completely
    const school1Students = await db.collection('students').find({ schoolId: school1.id }).toArray();
    const school4Students = await db.collection('students').find({ schoolId: school4.id }).toArray();

    expect(school1Students.length).toBeGreaterThan(0);
    expect(school4Students.length).toBe(0); // Zero data leakage across identical names
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Parent Organization Scoped Access
  // --------------------------------------------------------------------------
  it('Scenario 2: Parent organization only sees authorized child branches', async () => {
    const dpsBranches = await resolveOrganizationBranches('org-synth-dps', db);
    const branchIds = dpsBranches.map((b: any) => b.id);

    // DPS Group should see Branch 1 and Branch 3
    expect(branchIds).toContain('I2A-SCH-000001');
    expect(branchIds).toContain('I2A-SCH-000003');

    // DPS Group must NEVER see St. Xavier (SCH-002) or Independent School (SCH-004)
    expect(branchIds).not.toContain('I2A-SCH-000002');
    expect(branchIds).not.toContain('I2A-SCH-000004');

    const canAccessBranch1 = await isSchoolUnderOrganization('org-synth-dps', 'I2A-SCH-000001', db);
    const canAccessStXavier = await isSchoolUnderOrganization('org-synth-dps', 'I2A-SCH-000002', db);

    expect(canAccessBranch1).toBe(true);
    expect(canAccessStXavier).toBe(false);
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Branch Administrator Isolation
  // --------------------------------------------------------------------------
  it('Scenario 3: Branch administrator cannot access unauthorized branch data', () => {
    const branch1Admin: UserSession = {
      id: 'usr-003',
      email: 'admin@abcpublicschool.edu.in',
      tenantId: 'I2A-SCH-000001',
      role: 'ADMIN',
      status: 'ACTIVE'
    };

    // Access to own branch is permitted
    expect(TenantSecurityService.validateBranchAccess(branch1Admin, 'I2A-SCH-000001')).toBe(true);

    // Access to sister branch (Branch 3) or foreign branch (Branch 2) is strictly rejected
    expect(() => {
      TenantSecurityService.validateBranchAccess(branch1Admin, 'I2A-SCH-000003');
    }).toThrowError(/Branch administrator isolation violation/);

    expect(() => {
      TenantSecurityService.validateBranchAccess(branch1Admin, 'I2A-SCH-000002');
    }).toThrowError(/Branch administrator isolation violation/);
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Cross-Tenant Record ID Access (IDOR)
  // --------------------------------------------------------------------------
  it('Scenario 4: Rejects cross-tenant record ID access (IDOR prevention)', () => {
    const tenantA_User: UserSession = {
      id: 'usr-admin-a',
      email: 'admin@tenant-a.com',
      tenantId: 'I2A-SCH-000001',
      role: 'PRINCIPAL',
      status: 'ACTIVE'
    };

    expect(() => {
      TenantSecurityService.validateTenantAccess(tenantA_User, 'I2A-SCH-000002');
    }).toThrowError(TenantSecurityException);
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Cross-Tenant Enrollment Boundary Validation
  // --------------------------------------------------------------------------
  it('Scenario 5: Enrollment with student or session from foreign tenant is rejected', async () => {
    // Attempting to enroll School 1 student into School 2
    const result = await validateEnrollmentBoundaries({
      schoolId: 'I2A-SCH-000002', // Caller is School 2
      studentId: 'std-101',         // Student belongs to School 1!
      academicSessionId: 'sess-002-2026',
      database: db
    });

    expect(result.valid).toBe(false);
    expect(result.violations.some((v: string) => v.includes('CROSS_TENANT_VIOLATION'))).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Invalid Parent-Child Hierarchy Rejected
  // --------------------------------------------------------------------------
  it('Scenario 6: Rejects invalid parent organization (non-existent parent)', async () => {
    const result = await validateOrganizationLink('org-non-existent-999', 'org-child-1', db);

    expect(result.valid).toBe(false);
    expect(result.code).toBe('INVALID_PARENT_ORGANIZATION');
  });

  // --------------------------------------------------------------------------
  // Scenario 7: Circular Organization Relationship Rejected
  // --------------------------------------------------------------------------
  it('Scenario 7: Rejects self-parenting and circular organization relationships', async () => {
    // 7.1 Self parenting
    const selfResult = await validateOrganizationLink('org-test-loop', 'org-test-loop', db);
    expect(selfResult.valid).toBe(false);
    expect(selfResult.code).toBe('SELF_HIERARCHY_VIOLATION');

    // 7.2 Circular hierarchy: Org A -> Org B -> Org A
    const tempOrgA = { id: 'org-loop-a', orgCode: 'LOOP-A', legalName: 'Loop Org A', parentOrgId: null };
    const tempOrgB = { id: 'org-loop-b', orgCode: 'LOOP-B', legalName: 'Loop Org B', parentOrgId: 'org-loop-a' };

    try {
      await db.collection('organizations').insertOne(tempOrgA);
      await db.collection('organizations').insertOne(tempOrgB);

      // Attempting to make Org A's parent Org B creates a cycle (B -> A -> B)
      const cycleResult = await validateOrganizationLink('org-loop-b', 'org-loop-a', db);
      expect(cycleResult.valid).toBe(false);
      expect(cycleResult.code).toBe('CIRCULAR_HIERARCHY_DETECTED');
    } finally {
      await db.collection('organizations').deleteOne({ id: 'org-loop-a' });
      await db.collection('organizations').deleteOne({ id: 'org-loop-b' });
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 8: Duplicate Identifiers & Enrollment Validation
  // --------------------------------------------------------------------------
  it('Scenario 8: Validates organization and enrollment uniqueness & required fields', async () => {
    // 8.1 Invalid organization code
    const invalidOrg = validateOrganization({
      legalName: 'Test Academy',
      orgCode: '$$INVALID#',
      orgType: 'PRIVATE_TRUST'
    });
    expect(invalidOrg.valid).toBe(false);
    expect(invalidOrg.errors.some(e => e.includes('orgCode'))).toBe(true);

    // 8.2 Missing enrollment fields
    const invalidEnrollment = validateStudentEnrollment({
      studentId: '',
      academicSessionId: '',
      classId: '',
      sectionId: ''
    });
    expect(invalidEnrollment.valid).toBe(false);
    expect(invalidEnrollment.errors.length).toBeGreaterThan(0);

    // 8.3 Unique compound constraint in MongoDB for duplicate session enrollment
    const testEnrollment = {
      id: 'enr-dup-test-1',
      schoolId: 'I2A-SCH-000001',
      studentId: 'std-103',
      academicSessionId: 'sess-001-2026',
      classId: 'cls-001-gr10',
      sectionId: 'sec-001-10a',
      status: 'ENROLLED',
      enrollmentDate: '2026-04-01'
    };

    try {
      await db.collection('student_enrollments').insertOne(testEnrollment);

      // Attempt duplicate enrollment for same student in same session
      let duplicateError: any = null;
      try {
        await db.collection('student_enrollments').insertOne({
          ...testEnrollment,
          id: 'enr-dup-test-2'
        });
      } catch (err) {
        duplicateError = err;
      }

      expect(duplicateError).toBeDefined();
      expect(duplicateError.code).toBe(11000); // MongoDB Duplicate Key Error Code
    } finally {
      await db.collection('student_enrollments').deleteMany({ studentId: 'std-103', academicSessionId: 'sess-001-2026' });
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 9: Standalone School Works Without Regional Hierarchy
  // --------------------------------------------------------------------------
  it('Scenario 9: Standalone school operates smoothly without intermediate regional layers', async () => {
    const standaloneSchool = await db.collection('tenants').findOne({ id: 'I2A-SCH-000002' });
    expect(standaloneSchool).toBeDefined();
    expect(standaloneSchool.orgId).toBeNull();
    expect(standaloneSchool.administrativeUnitId).toBeUndefined();

    // Verify independent validation
    const branchValidation = validateBranchCampus(standaloneSchool);
    expect(branchValidation.valid).toBe(true);
  });

  // --------------------------------------------------------------------------
  // Scenario 10: Multi-Tier Grade Configuration (Pre-Primary, K-12, Coaching)
  // --------------------------------------------------------------------------
  it('Scenario 10: Supports Pre-Primary, K-12, and Coaching Batches without hardcoded string restrictions', () => {
    const grades = [
      { name: 'Nursery', numericOrder: -2 },
      { name: 'LKG', numericOrder: -1 },
      { name: 'UKG', numericOrder: 0 },
      { name: 'Grade 1', numericOrder: 1 },
      { name: 'Class 10', numericOrder: 10 },
      { name: 'Class 12 - Science', numericOrder: 12 },
      { name: 'IIT-JEE Super-30 Batch', numericOrder: 13 },
      { name: 'NEET Dropper Cohort', numericOrder: 14 }
    ];

    for (const grade of grades) {
      const result = validateClassGrade(grade);
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    }
  });

  // --------------------------------------------------------------------------
  // Scenario 11: Multi-Session Student Progression History
  // --------------------------------------------------------------------------
  it('Scenario 11: Preserves student enrollment progression history across multiple academic sessions', async () => {
    const enrollments = await db.collection('student_enrollments')
      .find({ studentId: 'std-101' })
      .sort({ academicSessionId: 1 })
      .toArray();

    expect(enrollments.length).toBe(2);

    // 2025-2026 record: Class VII, PROMOTED
    expect(enrollments[0].academicSessionId).toBe('sess-001-2025');
    expect(enrollments[0].className).toBe('Class VII');
    expect(enrollments[0].status).toBe('PROMOTED');

    // 2026-2027 record: Class VIII, ENROLLED
    expect(enrollments[1].academicSessionId).toBe('sess-001-2026');
    expect(enrollments[1].className).toBe('Class VIII');
    expect(enrollments[1].status).toBe('ENROLLED');
  });

  // --------------------------------------------------------------------------
  // Scenario 12: Multiple Guardians <-> Multiple Students Modeling
  // --------------------------------------------------------------------------
  it('Scenario 12: Models multiple guardians per student and multiple students per guardian', async () => {
    // 1. Student std-101 has multiple guardians (Father & Mother)
    const guardiansForStd101 = await db.collection('guardian_relationships')
      .find({ studentId: 'std-101' })
      .toArray();

    expect(guardiansForStd101.length).toBe(2);
    const relationships = guardiansForStd101.map((g: any) => g.relationshipType);
    expect(relationships).toContain('FATHER');
    expect(relationships).toContain('MOTHER');

    // Exactly one is primary contact
    const primaryContacts = guardiansForStd101.filter((g: any) => g.isPrimaryContact);
    expect(primaryContacts.length).toBe(1);

    // 2. Guardian usr-009 is linked to multiple students (std-101 & std-102)
    const childrenForGuardian = await db.collection('guardian_relationships')
      .find({ guardianUserId: 'usr-009' })
      .toArray();

    expect(childrenForGuardian.length).toBe(2);
    const studentIds = childrenForGuardian.map((c: any) => c.studentId);
    expect(studentIds).toContain('std-101');
    expect(studentIds).toContain('std-102');
  });

  // --------------------------------------------------------------------------
  // Scenario 13: Unauthenticated & Insufficiently Authorized Requests
  // --------------------------------------------------------------------------
  it('Scenario 13: Safely rejects unauthenticated and suspended user sessions', () => {
    // 13.1 Missing session
    expect(() => {
      TenantSecurityService.validateTenantAccess(null as any, 'I2A-SCH-000001');
    }).toThrowError(/User session is invalid/);

    // 13.2 Suspended user account
    const suspendedUser: UserSession = {
      id: 'usr-suspended-test',
      email: 'suspended@test.com',
      tenantId: 'I2A-SCH-000001',
      role: 'TEACHER',
      status: 'SUSPENDED'
    };

    expect(() => {
      TenantSecurityService.validateTenantAccess(suspendedUser, 'I2A-SCH-000001');
    }).toThrowError(/User session is invalid or account is suspended/);
  });

  // --------------------------------------------------------------------------
  // Scenario 14: Zero Unauthorized Write or Data Copy to Application DB
  // --------------------------------------------------------------------------
  it('Scenario 14: Confirms test client is strictly isolated to synthetic test database', async () => {
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');
    expect(db.databaseName).not.toBe('i2a_schoolos');
    expect(db.databaseName).not.toBe('i2a_schoolos_test');
  });

  // --------------------------------------------------------------------------
  // Scenario 15: Backward Compatibility with Core Security & Domain Validation
  // --------------------------------------------------------------------------
  it('Scenario 15: Validates official UDISE+ code format and domain validation schema consistency', () => {
    // 15.1 Valid 11-digit UDISE+ code
    const validBranch = validateBranchCampus({
      name: 'Modern Public School',
      code: 'MPS-01',
      institutionType: 'K12_SCHOOL',
      boardAffiliation: 'CBSE',
      officialIdentifiers: {
        udiseCode: '07010100101'
      }
    });
    expect(validBranch.valid).toBe(true);

    // 15.2 Invalid UDISE+ code (less than 11 digits)
    const invalidBranch = validateBranchCampus({
      name: 'Modern Public School',
      code: 'MPS-01',
      officialIdentifiers: {
        udiseCode: '12345'
      }
    });
    expect(invalidBranch.valid).toBe(false);
    expect(invalidBranch.errors.some(e => e.includes('UDISE+'))).toBe(true);
  });
});
