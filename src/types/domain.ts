/**
 * i2A SchoolOS — Master Domain Model & Data Types
 * Document Reference: Master Prompt 03 — Domain Model & Organization Hierarchy
 * 
 * Defines standard domain entities, enumerations, relational links,
 * and multi-tenant scoping invariants across all educational tiers.
 */

// ============================================================================
// 1. INSTITUTIONAL & ORGANIZATION HIERARCHY ENUMS & TYPES
// ============================================================================

export type OrganizationType =
  | 'INDEPENDENT_SCHOOL'       // Single standalone school/institution
  | 'PRIVATE_TRUST'            // Educational trust owning multiple schools (e.g. DPS Society)
  | 'CORPORATE_GROUP'          // Corporate chain of schools / institutions
  | 'GOVT_DEPARTMENT'          // State/National ministry or department of education
  | 'COACHING_FEDERATION'      // Network of test-prep academies or tutoring centres
  | 'HIGHER_ED_SOCIETY';       // University or college group

export type InstitutionType =
  | 'K12_SCHOOL'
  | 'PLAY_SCHOOL'
  | 'SENIOR_SECONDARY_COLLEGE'
  | 'COACHING_CENTRE'
  | 'TUITION_ACADEMY'
  | 'VOCATIONAL_INSTITUTE'
  | 'ACTIVITY_CENTRE';

export type BoardAffiliation =
  | 'CBSE'
  | 'ICSE'
  | 'STATE_BOARD'
  | 'IB'
  | 'CAMBRIDGE'
  | 'UNIVERSITY'
  | 'AUTONOMOUS'
  | 'NONE';

export type AdministrativeUnitType =
  | 'ZONE'
  | 'STATE'
  | 'DISTRICT'
  | 'BLOCK'
  | 'CLUSTER';

export type EntityStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'SUSPENDED'
  | 'ARCHIVED';

export type AcademicLevel =
  | 'PRE_PRIMARY'              // Nursery, LKG, UKG
  | 'PRIMARY'                  // Grades 1 to 5
  | 'MIDDLE'                   // Grades 6 to 8
  | 'SECONDARY'                // Grades 9 to 10
  | 'SENIOR_SECONDARY'         // Grades 11 to 12
  | 'UNDERGRADUATE'            // Degree / Diploma
  | 'COACHING_BATCH';          // Test preparation / Competitive exam

// ============================================================================
// 2. DOMAIN ENTITIES: ORGANIZATION, TENANT & JURISDICTION
// ============================================================================

export interface Organization {
  id: string;                                  // Deterministic ID e.g. "org-dps-group" or UUID
  orgCode: string;                             // Unique uppercase code e.g. "DPS-SOC-001"
  legalName: string;                           // Registered legal name
  orgType: OrganizationType;
  parentOrgId?: string | null;                 // For nested federations / hierarchical trusts
  registrationNumber?: string;                 // Society / Trust / Entity Registration No.
  taxIdentifier?: string;                      // PAN / GSTIN / Tax ID
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  status: EntityStatus;
  createdAt: string;                           // ISO 8601
  updatedAt: string;                           // ISO 8601
  createdBy?: string;
  version?: number;
}

export interface AdministrativeUnit {
  id: string;                                  // e.g. "unit-dist-south-delhi"
  orgId: string;                               // Organization boundary
  unitType: AdministrativeUnitType;
  name: string;                                // e.g. "South Delhi District"
  code: string;                                // e.g. "DL-DIST-01"
  parentUnitId?: string | null;                // Hierarchical parent (State -> District -> Block)
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BranchCampus {
  id: string;                                  // Authoritative School ID e.g. "I2A-SCH-000001"
  orgId?: string | null;                       // Parent Organization (null for standalone)
  administrativeUnitId?: string | null;        // Optional link to district/block/cluster
  code: string;                                // Unique branch code e.g. "DPS-RKP"
  name: string;                                // Display name (NOT unique across tenants)
  institutionType: InstitutionType;
  boardAffiliation: BoardAffiliation;
  affiliationNumber?: string;                  // e.g. "CBSE-2130001"
  officialIdentifiers?: {
    udiseCode?: string;                        // 11-digit UDISE+ code
    panNumber?: string;
    gstin?: string;
  };
  address: {
    street: string;
    city: string;
    district?: string;
    state: string;
    postalCode: string;
    country: string;                           // ISO 2-letter e.g. "IN"
  };
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  version?: number;
}

// ============================================================================
// 3. ACADEMIC DOMAIN ENTITIES
// ============================================================================

export interface AcademicSessionEntity {
  id: string;                                  // e.g. "sess-sch001-2026-2027"
  schoolId: string;                            // Branch / School scope
  sessionName: string;                         // e.g. "2026-2027"
  startDate: string;                           // "2026-04-01"
  endDate: string;                             // "2027-03-31"
  isCurrent: boolean;                          // Exactly one session per school may be current
  status: 'UPCOMING' | 'ACTIVE' | 'CONCLUDED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface ProgramCourse {
  id: string;                                  // e.g. "prog-k12-sec"
  schoolId: string;
  name: string;                                // e.g. "Primary Education", "NEET Super-30"
  level: AcademicLevel;
  curriculumCode: string;                      // e.g. "CBSE-CORE", "NEET-MED"
  assessmentScheme: 'PERCENTAGE' | 'CGPA' | 'CCE' | 'NEP_HPC' | 'CREDIT_SYSTEM';
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ClassGrade {
  id: string;                                  // e.g. "cls-sch001-gr10"
  schoolId: string;
  programId: string;                           // FK -> ProgramCourse.id
  name: string;                                // e.g. "Class X", "Nursery", "IIT-Batch-1"
  numericOrder: number;                        // Nursery: -2, LKG: -1, UKG: 0, 1..12: 1..12
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SectionBatch {
  id: string;                                  // e.g. "sec-sch001-gr10-a"
  schoolId: string;
  classId: string;                             // FK -> ClassGrade.id
  name: string;                                // e.g. "Section A", "Morning Batch"
  capacity: number;                            // Max student limit
  currentEnrolled: number;                     // Current count
  roomNumber?: string;
  classTeacherId?: string;                     // FK -> User.id
  status: EntityStatus;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 4. STUDENT & ENROLLMENT PROGRESSION DOMAIN ENTITIES
// ============================================================================

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type StudentStatus =
  | 'ACTIVE'
  | 'PROVISIONAL'
  | 'GRADUATED'
  | 'TRANSFERRED'
  | 'WITHDRAWN'
  | 'SUSPENDED';

export type EnrollmentStatus =
  | 'ENROLLED'
  | 'PROMOTED'
  | 'RETAINED'
  | 'TRANSFERRED'
  | 'COMPLETED'
  | 'DROPPED';

export interface StudentEntity {
  id: string;                                  // Permanent student identity: "std-xxx"
  schoolId: string;                            // Home school / branch
  admissionNo: string;                         // Admission number within school
  firstName: string;
  lastName: string;
  dob: string;                                 // YYYY-MM-DD
  gender: Gender;
  bloodGroup?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
  };
  officialIdentifiers?: {
    aadhaarMasked?: string;                    // "XXXX-XXXX-1234"
    penNumber?: string;                        // Permanent Education Number
    apaarId?: string;
  };
  status: StudentStatus;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface StudentEnrollmentEntity {
  id: string;                                  // e.g. "enr-std101-2026"
  schoolId: string;                            // Tenant scope
  studentId: string;                           // FK -> StudentEntity.id
  academicSessionId: string;                   // FK -> AcademicSessionEntity.id
  classId: string;                             // FK -> ClassGrade.id
  sectionId: string;                           // FK -> SectionBatch.id
  rollNumber?: string;
  enrollmentDate: string;                      // YYYY-MM-DD
  status: EnrollmentStatus;
  attendancePercentage?: number;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
}

export type GuardianRelationshipType =
  | 'FATHER'
  | 'MOTHER'
  | 'LEGAL_GUARDIAN'
  | 'AUTHORIZED_SPONSOR'
  | 'SIBLING'
  | 'OTHER';

export interface StudentGuardianRelationshipEntity {
  id: string;                                  // e.g. "rel-std101-usr9"
  schoolId: string;                            // Tenant boundary
  studentId: string;                           // FK -> StudentEntity.id
  guardianUserId: string;                      // FK -> User.id
  relationshipType: GuardianRelationshipType;
  isPrimaryContact: boolean;
  canPickup: boolean;
  hasFinancialResponsibility: boolean;
  emergencyContactPriority?: number;           // 1 = first to call, 2 = second
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// 5. IDENTITY & ACCESS (USER, ROLE, MEMBERSHIP)
// ============================================================================

export type SystemUserRole =
  | 'SUPER_ADMIN'
  | 'ORG_DIRECTOR'
  | 'SCHOOL_OWNER'
  | 'PRINCIPAL'
  | 'ADMIN'
  | 'ACCOUNTANT'
  | 'TEACHER'
  | 'STAFF'
  | 'TRANSPORT'
  | 'PARENT'
  | 'STUDENT';

export interface UserAccountEntity {
  id: string;                                  // "usr-xxx"
  email: string;                               // Unique indexed
  phone?: string;
  name: string;
  role: SystemUserRole;
  schoolId: string;                            // Primary branch ("ALL" for SUPER_ADMIN)
  orgId?: string | null;                       // Organization if part of a group
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'LOCKED';
  studentId?: string;                          // For STUDENT users
  childrenIds?: string[];                      // For PARENT users
  assignedClasses?: string[];                  // For TEACHER users
  subjects?: string[];                         // For TEACHER users
  createdAt: string;
  updatedAt: string;
}

export interface UserBranchAssignmentEntity {
  id: string;
  userId: string;                              // FK -> UserAccountEntity.id
  schoolId: string;                            // FK -> BranchCampus.id
  role: SystemUserRole;
  isPrimaryBranch: boolean;
  effectiveFrom: string;
  effectiveTo?: string;
  status: EntityStatus;
  createdAt: string;
}

// ============================================================================
// 6. FUTURE MODULE BOUNDARIES & RELATIONSHIP DEFINITIONS
// ============================================================================

/**
 * Module Domain Boundaries & Scopes
 */
export interface ModuleBoundaryScope {
  moduleName: string;
  authoritativeEntity: string;
  tenantField: 'schoolId' | 'orgId';
  immutableKeys: string[];
  sensitiveDataClassification: 'HIGH_PII' | 'FINANCIAL' | 'OPERATIONAL_PUBLIC' | 'CONFIDENTIAL_INTERNAL';
  retentionPeriodMonths: number;
}

// ============================================================================
// 7. CONCURRENCY HARDENING & HIERARCHY LOCK TYPES
// ============================================================================

export interface HierarchyUpdateResult {
  success: boolean;
  childId: string;
  parentId: string | null;
  previousParentId: string | null;
  noOp?: boolean;
}

export interface HierarchyLockEntity {
  _id: string;                                 // Canonical sorted key e.g. "org-a::org-b"
  locked: boolean;
  owner: string;                               // Unique process nonce
  lockedAt: Date | string;
  expiresAt: Date | string;                    // Lease expiry
}

