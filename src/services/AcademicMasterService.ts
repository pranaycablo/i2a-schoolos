import { TenantSecurityService, type UserSession } from './TenantSecurityService';

export interface AcademicSession {
  id: string;
  tenantId: string;
  name: string; // e.g. "2026-2027"
  startDate: string;
  endDate: string;
  status: 'DRAFT' | 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  isCurrent: boolean;
}

export interface ClassMaster {
  id: string;
  tenantId: string;
  sessionId: string;
  name: string; // e.g. "Class VIII"
  numericOrder: number;
  academicLevel: 'PRE_PRIMARY' | 'PRIMARY' | 'MIDDLE' | 'SECONDARY' | 'SENIOR_SECONDARY';
}

export interface SectionMaster {
  id: string;
  tenantId: string;
  classId: string;
  className: string;
  sessionId: string;
  name: string; // e.g. "A"
  capacity: number;
  currentEnrolled: number;
  roomNumber: string;
  classTeacherId?: string;
  classTeacherName?: string;
}

export interface SubjectMaster {
  id: string;
  tenantId: string;
  sessionId: string;
  classId: string;
  className: string;
  name: string;
  code: string;
  type: 'CORE' | 'ELECTIVE' | 'OPTIONAL' | 'LANGUAGE' | 'PRACTICAL';
  theoryMarks: number;
  practicalMarks: number;
  internalMarks: number;
  totalMarks: number;
  passingMarks: number;
}

export interface TeacherAssignment {
  id: string;
  tenantId: string;
  sessionId: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
}

export interface AcademicReadinessStatus {
  status: 'READY' | 'NOT_READY';
  setupPercentage: number;
  checks: {
    activeSession: boolean;
    classesConfigured: boolean;
    sectionsConfigured: boolean;
    subjectsConfigured: boolean;
    teacherAssignments: boolean;
    classTeachersAssigned: boolean;
  };
  missingRequirements: string[];
}

export class AcademicMasterService {
  /**
   * Enforces that only 1 Academic Session can be ACTIVE per tenant at a time.
   */
  public static activateSession(
    user: UserSession,
    tenantId: string,
    sessionId: string,
    sessions: AcademicSession[]
  ): AcademicSession[] {
    TenantSecurityService.validateTenantAccess(user, tenantId);

    return sessions.map((s) => {
      if (s.tenantId !== tenantId) return s;
      if (s.id === sessionId) {
        return { ...s, status: 'ACTIVE', isCurrent: true };
      } else {
        return { ...s, status: s.status === 'ACTIVE' ? 'COMPLETED' : s.status, isCurrent: false };
      }
    });
  }

  /**
   * Checks section capacity before enrolling a student.
   * Returns SECTION_FULL if capacity exceeded.
   */
  public static checkSectionCapacity(section: SectionMaster): { canEnroll: boolean; statusMessage: string } {
    if (section.currentEnrolled >= section.capacity) {
      return { canEnroll: false, statusMessage: 'SECTION_FULL' };
    }
    return { canEnroll: true, statusMessage: 'CAPACITY_AVAILABLE' };
  }

  /**
   * Academic Readiness Checker Engine
   * Validates if school master data is complete for core operations.
   */
  public static checkAcademicReadiness(
    tenantId: string,
    sessions: AcademicSession[],
    classes: ClassMaster[],
    sections: SectionMaster[],
    subjects: SubjectMaster[],
    assignments: TeacherAssignment[]
  ): AcademicReadinessStatus {
    const tenantSessions = sessions.filter((s) => s.tenantId === tenantId);
    const activeSession = tenantSessions.find((s) => s.status === 'ACTIVE');

    const tenantClasses = classes.filter((c) => c.tenantId === tenantId);
    const tenantSections = sections.filter((sec) => sec.tenantId === tenantId);
    const tenantSubjects = subjects.filter((sub) => sub.tenantId === tenantId);
    const tenantAssignments = assignments.filter((a) => a.tenantId === tenantId);

    const checks = {
      activeSession: !!activeSession,
      classesConfigured: tenantClasses.length > 0,
      sectionsConfigured: tenantSections.length > 0,
      subjectsConfigured: tenantSubjects.length > 0,
      teacherAssignments: tenantAssignments.length > 0,
      classTeachersAssigned: tenantSections.some((sec) => !!sec.classTeacherId)
    };

    const missingRequirements: string[] = [];
    if (!checks.activeSession) missingRequirements.push('Active Academic Session is missing');
    if (!checks.classesConfigured) missingRequirements.push('No Classes configured');
    if (!checks.sectionsConfigured) missingRequirements.push('No Sections configured');
    if (!checks.subjectsConfigured) missingRequirements.push('No Subjects configured');
    if (!checks.teacherAssignments) missingRequirements.push('No Teacher Subject Assignments');
    if (!checks.classTeachersAssigned) missingRequirements.push('Missing Class Teacher assignment');

    const passedCount = Object.values(checks).filter(Boolean).length;
    const setupPercentage = Math.round((passedCount / Object.keys(checks).length) * 100);

    return {
      status: missingRequirements.length === 0 ? 'READY' : 'NOT_READY',
      setupPercentage,
      checks,
      missingRequirements
    };
  }
}
