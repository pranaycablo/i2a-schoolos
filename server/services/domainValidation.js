/**
 * i2A SchoolOS — Centralized Domain Validation Engine
 * Document Reference: Master Prompt 03 — Domain Model & Organization Hierarchy
 * 
 * Provides deterministic, server-side validation rules for:
 * - Organizations & Hierarchical Units
 * - Branch / Campus Profiles & Official Identifiers (UDISE+)
 * - Academic Sessions, Programs, Classes & Sections
 * - Student Master Profiles & Multi-Session Enrollments
 * - Multi-Guardian Relationships
 * - Teacher & Staff Assignments
 */

export const VALID_ORG_TYPES = [
  'INDEPENDENT_SCHOOL',
  'PRIVATE_TRUST',
  'CORPORATE_GROUP',
  'GOVT_DEPARTMENT',
  'COACHING_FEDERATION',
  'HIGHER_ED_SOCIETY'
];

export const VALID_INSTITUTION_TYPES = [
  'K12_SCHOOL',
  'PLAY_SCHOOL',
  'SENIOR_SECONDARY_COLLEGE',
  'COACHING_CENTRE',
  'TUITION_ACADEMY',
  'VOCATIONAL_INSTITUTE',
  'ACTIVITY_CENTRE'
];

export const VALID_BOARDS = [
  'CBSE',
  'ICSE',
  'STATE_BOARD',
  'IB',
  'CAMBRIDGE',
  'UNIVERSITY',
  'AUTONOMOUS',
  'NONE'
];

export const VALID_ENROLLMENT_STATUSES = [
  'ENROLLED',
  'PROMOTED',
  'RETAINED',
  'TRANSFERRED',
  'COMPLETED',
  'DROPPED'
];

export const VALID_GUARDIAN_RELATIONSHIPS = [
  'FATHER',
  'MOTHER',
  'LEGAL_GUARDIAN',
  'AUTHORIZED_SPONSOR',
  'SIBLING',
  'OTHER'
];

export const VALID_GENDERS = ['MALE', 'FEMALE', 'OTHER'];

/**
 * Validates Organization structure
 */
export function validateOrganization(org) {
  const errors = [];
  if (!org) return { valid: false, errors: ['Organization object is required.'] };

  if (!org.legalName || typeof org.legalName !== 'string' || !org.legalName.trim()) {
    errors.push('Organization "legalName" is required.');
  }

  if (!org.orgCode || typeof org.orgCode !== 'string' || !/^[A-Z0-9_-]{3,20}$/i.test(org.orgCode.trim())) {
    errors.push('Organization "orgCode" must be an alphanumeric string of 3-20 characters.');
  }

  if (!org.orgType || !VALID_ORG_TYPES.includes(org.orgType)) {
    errors.push(`Invalid "orgType". Must be one of: ${VALID_ORG_TYPES.join(', ')}.`);
  }

  if (org.primaryContact) {
    if (org.primaryContact.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(org.primaryContact.email)) {
      errors.push('Organization primaryContact email format is invalid.');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates Branch / Campus profiles
 */
export function validateBranchCampus(branch) {
  const errors = [];
  if (!branch) return { valid: false, errors: ['Branch object is required.'] };

  if (!branch.name || typeof branch.name !== 'string' || !branch.name.trim()) {
    errors.push('Branch "name" is required.');
  }

  if (!branch.code || typeof branch.code !== 'string' || !branch.code.trim()) {
    errors.push('Branch "code" is required.');
  }

  if (branch.institutionType && !VALID_INSTITUTION_TYPES.includes(branch.institutionType)) {
    errors.push(`Invalid "institutionType". Must be one of: ${VALID_INSTITUTION_TYPES.join(', ')}.`);
  }

  if (branch.boardAffiliation && !VALID_BOARDS.includes(branch.boardAffiliation)) {
    errors.push(`Invalid "boardAffiliation". Must be one of: ${VALID_BOARDS.join(', ')}.`);
  }

  // Official Government Identifier Rule: 11-digit UDISE+ validation
  if (branch.officialIdentifiers?.udiseCode) {
    if (!/^[0-9]{11}$/.test(branch.officialIdentifiers.udiseCode)) {
      errors.push('Invalid UDISE+ code: Must be exactly 11 numeric digits.');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates Academic Session
 */
export function validateAcademicSession(session) {
  const errors = [];
  if (!session) return { valid: false, errors: ['Session object is required.'] };

  if (!session.sessionName || typeof session.sessionName !== 'string' || !session.sessionName.trim()) {
    errors.push('Field "sessionName" is required (e.g. "2026-2027").');
  }

  if (!session.startDate || isNaN(Date.parse(session.startDate))) {
    errors.push('Valid "startDate" (YYYY-MM-DD) is required.');
  }

  if (!session.endDate || isNaN(Date.parse(session.endDate))) {
    errors.push('Valid "endDate" (YYYY-MM-DD) is required.');
  }

  if (session.startDate && session.endDate && new Date(session.startDate) >= new Date(session.endDate)) {
    errors.push('Academic session "startDate" must be strictly earlier than "endDate".');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates Class / Grade
 */
export function validateClassGrade(classGrade) {
  const errors = [];
  if (!classGrade) return { valid: false, errors: ['ClassGrade object is required.'] };

  if (!classGrade.name || typeof classGrade.name !== 'string' || !classGrade.name.trim()) {
    errors.push('Class "name" is required (e.g. "Class X", "Nursery", "Batch A").');
  }

  if (typeof classGrade.numericOrder !== 'number' || isNaN(classGrade.numericOrder)) {
    errors.push('Field "numericOrder" must be a valid number for grade progression ordering.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates Section / Batch
 */
export function validateSectionBatch(section) {
  const errors = [];
  if (!section) return { valid: false, errors: ['Section object is required.'] };

  if (!section.name || typeof section.name !== 'string' || !section.name.trim()) {
    errors.push('Section "name" is required (e.g. "Section A", "Morning Cohort").');
  }

  if (typeof section.capacity !== 'number' || section.capacity <= 0) {
    errors.push('Section "capacity" must be a positive integer greater than zero.');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates Student Master Profile
 */
export function validateStudentProfile(student) {
  const errors = [];
  if (!student) return { valid: false, errors: ['Student object is required.'] };

  const name = student.name || `${student.firstName || ''} ${student.lastName || ''}`.trim();
  if (!name) {
    errors.push('Student name is required.');
  }

  if (student.dob) {
    const dobTime = Date.parse(student.dob);
    if (isNaN(dobTime)) {
      errors.push('Field "dob" must be a valid date format (YYYY-MM-DD).');
    } else if (new Date(student.dob) > new Date()) {
      errors.push('Student date of birth cannot be in the future.');
    }
  }

  if (student.gender && !VALID_GENDERS.includes(student.gender)) {
    errors.push(`Invalid "gender". Must be one of: ${VALID_GENDERS.join(', ')}.`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates Student Enrollment Record
 */
export function validateStudentEnrollment(enrollment) {
  const errors = [];
  if (!enrollment) return { valid: false, errors: ['Enrollment object is required.'] };

  if (!enrollment.studentId) errors.push('Field "studentId" is required.');
  if (!enrollment.academicSessionId) errors.push('Field "academicSessionId" is required.');
  if (!enrollment.classId && !enrollment.className) errors.push('Class identifier is required.');
  if (!enrollment.sectionId && !enrollment.section) errors.push('Section identifier is required.');

  if (enrollment.status && !VALID_ENROLLMENT_STATUSES.includes(enrollment.status)) {
    errors.push(`Invalid enrollment status. Must be one of: ${VALID_ENROLLMENT_STATUSES.join(', ')}.`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates Guardian Relationship
 */
export function validateGuardianRelationship(relationship) {
  const errors = [];
  if (!relationship) return { valid: false, errors: ['Relationship object is required.'] };

  if (!relationship.studentId) errors.push('Field "studentId" is required.');
  if (!relationship.guardianUserId && !relationship.guardianId && !relationship.parentId) {
    errors.push('Guardian identity is required.');
  }

  if (relationship.relationshipType && !VALID_GUARDIAN_RELATIONSHIPS.includes(relationship.relationshipType)) {
    errors.push(`Invalid relationshipType. Must be one of: ${VALID_GUARDIAN_RELATIONSHIPS.join(', ')}.`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
