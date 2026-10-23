/**
 * i2A SchoolOS — Enterprise RBAC & Granular Permission Matrix Engine
 * Reference: Master Prompt 04 — Enterprise Security, Privacy, RBAC & Zero-Bypass
 * Document Ref: docs/strategy/ROLE_PERMISSION_MATRIX.md
 */

export const ROLES = {
  // Platform Level
  SUPER_ADMIN: 'SUPER_ADMIN',
  PLATFORM_OPS: 'PLATFORM_OPS',
  PLATFORM_SUPPORT: 'PLATFORM_SUPPORT',
  PLATFORM_AUDITOR: 'PLATFORM_AUDITOR',

  // Organization Level (Trust / Society / Chain)
  ORG_DIRECTOR: 'ORG_DIRECTOR',
  ORG_FINANCE: 'ORG_FINANCE',
  ORG_AUDITOR: 'ORG_AUDITOR',

  // Institution Level
  SCHOOL_OWNER: 'SCHOOL_OWNER',
  PRINCIPAL: 'PRINCIPAL',
  ADMIN: 'ADMIN', // Alias / General Admin
  VICE_PRINCIPAL: 'VICE_PRINCIPAL',
  ACADEMIC_COORD: 'ACADEMIC_COORD',
  ADMISSION_OFFICER: 'ADMISSION_OFFICER',
  ACCOUNTANT: 'ACCOUNTANT',
  HR_MANAGER: 'HR_MANAGER',
  TEACHER: 'TEACHER',
  CLASS_TEACHER: 'CLASS_TEACHER',
  LIBRARIAN: 'LIBRARIAN',
  TRANSPORT_MGR: 'TRANSPORT_MGR',
  TRANSPORT: 'TRANSPORT', // Legacy alias
  STAFF: 'STAFF',
  EXAM_CONTROLLER: 'EXAM_CONTROLLER',
  RECEPTIONIST: 'RECEPTIONIST',

  // Portals
  PARENT: 'PARENT',
  STUDENT: 'STUDENT',

  // Government Jurisdiction
  STATE_ADMIN: 'STATE_ADMIN',
  DISTRICT_OFFICER: 'DISTRICT_OFFICER',
  BLOCK_OFFICER: 'BLOCK_OFFICER',
  CLUSTER_COORD: 'CLUSTER_COORD',
  SCHOOL_HEAD: 'SCHOOL_HEAD'
};

/**
 * Role Hierarchy Ranking for Escalation Checks:
 * Higher rank cannot be assigned by a user with a lower rank.
 */
export const ROLE_HIERARCHY_RANK = {
  SUPER_ADMIN: 100,
  PLATFORM_OPS: 90,
  PLATFORM_SUPPORT: 85,
  PLATFORM_AUDITOR: 80,

  STATE_ADMIN: 75,
  DISTRICT_OFFICER: 70,
  BLOCK_OFFICER: 65,
  CLUSTER_COORD: 60,

  ORG_DIRECTOR: 70,
  ORG_FINANCE: 60,
  ORG_AUDITOR: 60,

  SCHOOL_OWNER: 55,
  PRINCIPAL: 50,
  ADMIN: 50,
  SCHOOL_HEAD: 50,
  VICE_PRINCIPAL: 45,
  ACADEMIC_COORD: 40,
  EXAM_CONTROLLER: 40,
  ACCOUNTANT: 35,
  HR_MANAGER: 35,
  ADMISSION_OFFICER: 30,
  CLASS_TEACHER: 25,
  TEACHER: 20,
  LIBRARIAN: 20,
  TRANSPORT_MGR: 20,
  TRANSPORT: 20,
  STAFF: 15,
  RECEPTIONIST: 15,

  PARENT: 5,
  STUDENT: 1
};

/**
 * Canonical Permissions Definition
 */
export const PERMISSIONS = {
  // Organizations & Branches
  ORGANIZATION_MANAGE: 'organization.manage',
  BRANCHES_MANAGE: 'branches.manage',
  BRANCHES_READ: 'branches.read',

  // School Setup
  SCHOOL_SETUP_VIEW: 'school_setup.view',
  SCHOOL_SETUP_EDIT: 'school_setup.edit',

  // Students & SIS
  STUDENTS_READ: 'students.read',
  STUDENTS_READ_BASIC: 'students.read_basic',
  STUDENTS_READ_PII: 'students.read_pii',
  STUDENTS_CREATE: 'students.create',
  STUDENTS_UPDATE: 'students.update',
  STUDENTS_DELETE: 'students.delete',
  STUDENTS_EXPORT: 'students.export',

  // Admissions
  ADMISSIONS_READ: 'admissions.read',
  ADMISSIONS_CREATE: 'admissions.create',
  ADMISSIONS_APPROVE: 'admissions.approve',

  // Attendance
  ATTENDANCE_READ: 'attendance.read',
  ATTENDANCE_MARK: 'attendance.mark',
  ATTENDANCE_LOCK: 'attendance.lock',

  // Timetable
  TIMETABLE_READ: 'timetable.read',
  TIMETABLE_MANAGE: 'timetable.manage',

  // Homework
  HOMEWORK_READ: 'homework.read',
  HOMEWORK_MANAGE: 'homework.manage',
  HOMEWORK_SUBMIT: 'homework.submit',
  HOMEWORK_GRADE: 'homework.grade',

  // Exams
  EXAMS_READ: 'exams.read',
  EXAMS_MANAGE: 'exams.manage',
  EXAMS_TAKE: 'exams.take',
  EXAMS_GRADE: 'exams.grade',
  EXAMS_LOCK: 'exams.lock',

  // Fees & Finance
  FEES_READ: 'fees.read',
  FEES_STRUCTURE_MANAGE: 'fees.structure_manage',
  FEES_COLLECT: 'fees.collect',
  FEES_PAY: 'fees.pay',

  // Staff & Payroll
  STAFF_READ: 'staff.read',
  STAFF_MANAGE: 'staff.manage',
  PAYROLL_MANAGE: 'payroll.manage',

  // Operations
  TRANSPORT_MANAGE: 'transport.manage',
  LIBRARY_MANAGE: 'library.manage',
  MARKETPLACE_MANAGE: 'marketplace.manage',
  MARKETPLACE_ORDER: 'marketplace.order',

  // Security, Audit & Admin
  AUDIT_READ: 'audit.read',
  ROLES_ASSIGN: 'roles.assign',
  PRIVACY_MANAGE: 'privacy.manage'
};

/**
 * Granular Permission Matrix Mapping
 * Maps each Permission to the array of roles authorized to exercise it.
 */
export const PERMISSION_ROLE_MAP = {
  [PERMISSIONS.ORGANIZATION_MANAGE]: [
    ROLES.SUPER_ADMIN,
    ROLES.ORG_DIRECTOR
  ],
  [PERMISSIONS.BRANCHES_MANAGE]: [
    ROLES.SUPER_ADMIN,
    ROLES.ORG_DIRECTOR
  ],
  [PERMISSIONS.BRANCHES_READ]: [
    ROLES.SUPER_ADMIN,
    ROLES.ORG_DIRECTOR,
    ROLES.ORG_FINANCE,
    ROLES.ORG_AUDITOR,
    ROLES.STATE_ADMIN,
    ROLES.DISTRICT_OFFICER,
    ROLES.PRINCIPAL,
    ROLES.ADMIN
  ],

  [PERMISSIONS.SCHOOL_SETUP_VIEW]: [
    ROLES.SUPER_ADMIN,
    ROLES.ORG_DIRECTOR,
    ROLES.SCHOOL_OWNER,
    ROLES.PRINCIPAL,
    ROLES.ADMIN
  ],
  [PERMISSIONS.SCHOOL_SETUP_EDIT]: [
    ROLES.SUPER_ADMIN,
    ROLES.SCHOOL_OWNER,
    ROLES.PRINCIPAL,
    ROLES.ADMIN
  ],

  [PERMISSIONS.STUDENTS_READ]: [
    ROLES.SUPER_ADMIN,
    ROLES.PLATFORM_OPS,
    ROLES.ORG_DIRECTOR,
    ROLES.SCHOOL_OWNER,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.VICE_PRINCIPAL,
    ROLES.ACADEMIC_COORD,
    ROLES.ADMISSION_OFFICER,
    ROLES.TEACHER,
    ROLES.CLASS_TEACHER,
    ROLES.EXAM_CONTROLLER
  ],
  [PERMISSIONS.STUDENTS_READ_BASIC]: [
    ROLES.ACCOUNTANT,
    ROLES.STAFF,
    ROLES.LIBRARIAN,
    ROLES.TRANSPORT_MGR,
    ROLES.TRANSPORT,
    ROLES.RECEPTIONIST
  ],
  [PERMISSIONS.STUDENTS_READ_PII]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.ADMISSION_OFFICER
  ],
  [PERMISSIONS.STUDENTS_CREATE]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.ADMISSION_OFFICER,
    ROLES.STAFF
  ],
  [PERMISSIONS.STUDENTS_UPDATE]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.STAFF,
    ROLES.TEACHER
  ],
  [PERMISSIONS.STUDENTS_DELETE]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL
  ],
  [PERMISSIONS.STUDENTS_EXPORT]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN
  ],

  [PERMISSIONS.ADMISSIONS_READ]: [
    ROLES.SUPER_ADMIN,
    ROLES.ORG_DIRECTOR,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.ADMISSION_OFFICER,
    ROLES.STAFF,
    ROLES.ACCOUNTANT
  ],
  [PERMISSIONS.ADMISSIONS_CREATE]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.ADMISSION_OFFICER,
    ROLES.STAFF
  ],
  [PERMISSIONS.ADMISSIONS_APPROVE]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN
  ],

  [PERMISSIONS.ATTENDANCE_READ]: [
    ROLES.SUPER_ADMIN,
    ROLES.ORG_DIRECTOR,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.VICE_PRINCIPAL,
    ROLES.ACADEMIC_COORD,
    ROLES.TEACHER,
    ROLES.CLASS_TEACHER,
    ROLES.PARENT,
    ROLES.STUDENT
  ],
  [PERMISSIONS.ATTENDANCE_MARK]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.CLASS_TEACHER,
    ROLES.STAFF
  ],
  [PERMISSIONS.ATTENDANCE_LOCK]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN
  ],

  [PERMISSIONS.TIMETABLE_READ]: [
    ROLES.SUPER_ADMIN,
    ROLES.ORG_DIRECTOR,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.CLASS_TEACHER,
    ROLES.PARENT,
    ROLES.STUDENT
  ],
  [PERMISSIONS.TIMETABLE_MANAGE]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.ACADEMIC_COORD
  ],

  [PERMISSIONS.HOMEWORK_READ]: [
    ROLES.SUPER_ADMIN,
    ROLES.ORG_DIRECTOR,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.CLASS_TEACHER,
    ROLES.PARENT,
    ROLES.STUDENT
  ],
  [PERMISSIONS.HOMEWORK_MANAGE]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.CLASS_TEACHER
  ],
  [PERMISSIONS.HOMEWORK_SUBMIT]: [
    ROLES.STUDENT
  ],
  [PERMISSIONS.HOMEWORK_GRADE]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.TEACHER,
    ROLES.CLASS_TEACHER
  ],

  [PERMISSIONS.EXAMS_READ]: [
    ROLES.SUPER_ADMIN,
    ROLES.ORG_DIRECTOR,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.EXAM_CONTROLLER,
    ROLES.TEACHER,
    ROLES.CLASS_TEACHER,
    ROLES.PARENT,
    ROLES.STUDENT
  ],
  [PERMISSIONS.EXAMS_MANAGE]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.EXAM_CONTROLLER,
    ROLES.TEACHER
  ],
  [PERMISSIONS.EXAMS_TAKE]: [
    ROLES.STUDENT
  ],
  [PERMISSIONS.EXAMS_GRADE]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.EXAM_CONTROLLER,
    ROLES.TEACHER,
    ROLES.CLASS_TEACHER
  ],
  [PERMISSIONS.EXAMS_LOCK]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.EXAM_CONTROLLER
  ],

  [PERMISSIONS.FEES_READ]: [
    ROLES.SUPER_ADMIN,
    ROLES.ORG_DIRECTOR,
    ROLES.ORG_FINANCE,
    ROLES.SCHOOL_OWNER,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.ACCOUNTANT,
    ROLES.PARENT,
    ROLES.STUDENT
  ],
  [PERMISSIONS.FEES_STRUCTURE_MANAGE]: [
    ROLES.SUPER_ADMIN,
    ROLES.SCHOOL_OWNER,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.ACCOUNTANT
  ],
  [PERMISSIONS.FEES_COLLECT]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.ACCOUNTANT,
    ROLES.STAFF
  ],
  [PERMISSIONS.FEES_PAY]: [
    ROLES.PARENT,
    ROLES.STUDENT
  ],

  [PERMISSIONS.STAFF_READ]: [
    ROLES.SUPER_ADMIN,
    ROLES.ORG_DIRECTOR,
    ROLES.SCHOOL_OWNER,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.HR_MANAGER,
    ROLES.ACCOUNTANT
  ],
  [PERMISSIONS.STAFF_MANAGE]: [
    ROLES.SUPER_ADMIN,
    ROLES.SCHOOL_OWNER,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.HR_MANAGER
  ],
  [PERMISSIONS.PAYROLL_MANAGE]: [
    ROLES.SUPER_ADMIN,
    ROLES.SCHOOL_OWNER,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.ACCOUNTANT,
    ROLES.HR_MANAGER
  ],

  [PERMISSIONS.TRANSPORT_MANAGE]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.TRANSPORT_MGR,
    ROLES.TRANSPORT
  ],
  [PERMISSIONS.LIBRARY_MANAGE]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.LIBRARIAN
  ],
  [PERMISSIONS.MARKETPLACE_MANAGE]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.STAFF
  ],
  [PERMISSIONS.MARKETPLACE_ORDER]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN,
    ROLES.PARENT,
    ROLES.STUDENT,
    ROLES.TEACHER,
    ROLES.STAFF
  ],

  [PERMISSIONS.AUDIT_READ]: [
    ROLES.SUPER_ADMIN,
    ROLES.PLATFORM_AUDITOR,
    ROLES.ORG_DIRECTOR,
    ROLES.ORG_AUDITOR,
    ROLES.SCHOOL_OWNER,
    ROLES.PRINCIPAL,
    ROLES.ADMIN
  ],
  [PERMISSIONS.ROLES_ASSIGN]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN
  ],
  [PERMISSIONS.PRIVACY_MANAGE]: [
    ROLES.SUPER_ADMIN,
    ROLES.PRINCIPAL,
    ROLES.ADMIN
  ]
};

/**
 * Checks whether a given role holds the specified permission
 */
export function hasPermission(role, permission) {
  if (!role || !permission) return false;
  // Super Admin has all permissions
  if (role === ROLES.SUPER_ADMIN) return true;

  const allowedRoles = PERMISSION_ROLE_MAP[permission];
  if (!allowedRoles) return false;
  return allowedRoles.includes(role);
}

/**
 * Validates role assignment to prevent privilege escalation.
 * Assigner cannot assign a role equal to or higher than their own rank,
 * except SUPER_ADMIN who can assign any role.
 */
export function validateRoleAssignment(assignerRole, targetRole) {
  if (!assignerRole || !targetRole) {
    return { allowed: false, error: 'Both assigner role and target role are required.' };
  }

  // Super Admin can assign any role
  if (assignerRole === ROLES.SUPER_ADMIN) {
    return { allowed: true };
  }

  const assignerRank = ROLE_HIERARCHY_RANK[assignerRole] || 0;
  const targetRank = ROLE_HIERARCHY_RANK[targetRole] || 0;

  // Non-SuperAdmin cannot create SuperAdmin, PlatformOps, or OrgDirector
  if (targetRank >= ROLE_HIERARCHY_RANK.ORG_DIRECTOR) {
    return {
      allowed: false,
      error: `FORBIDDEN: Role '${assignerRole}' is not authorized to grant administrative platform/org role '${targetRole}'.`
    };
  }

  // Cannot assign role equal to or higher than self
  if (targetRank >= assignerRank) {
    return {
      allowed: false,
      error: `FORBIDDEN: Privilege escalation rejected. Role '${assignerRole}' (rank ${assignerRank}) cannot assign '${targetRole}' (rank ${targetRank}).`
    };
  }

  return { allowed: true };
}
