import { describe, it, expect } from 'vitest';
import { AcademicMasterService, AcademicSession, SectionMaster } from '../services/AcademicMasterService';
import { UserSession } from '../services/TenantSecurityService';

describe('i2A SchoolOS Academic Master Data Engine Test Suite', () => {
  const principalUser: UserSession = {
    id: 'user-principal',
    email: 'principal@abc.edu.in',
    tenantId: 'sch-001',
    role: 'PRINCIPAL',
    status: 'ACTIVE'
  };

  const sessions: AcademicSession[] = [
    { id: 'ses-2025', tenantId: 'sch-001', name: '2025-2026', startDate: '2025-04-01', endDate: '2026-03-31', status: 'COMPLETED', isCurrent: false },
    { id: 'ses-2026', tenantId: 'sch-001', name: '2026-2027', startDate: '2026-04-01', endDate: '2027-03-31', status: 'ACTIVE', isCurrent: true }
  ];

  it('1. Single Active Session Rule: Activating session 2026 deactivates all other tenant sessions', () => {
    const updated = AcademicMasterService.activateSession(principalUser, 'sch-001', 'ses-2026', sessions);
    const activeSessions = updated.filter((s) => s.status === 'ACTIVE' && s.tenantId === 'sch-001');

    expect(activeSessions.length).toBe(1);
    expect(activeSessions[0].id).toBe('ses-2026');
  });

  it('2. Section Capacity Engine: Returns SECTION_FULL when current enrollment meets capacity', () => {
    const fullSection: SectionMaster = {
      id: 'sec-8b',
      tenantId: 'sch-001',
      classId: 'cls-8',
      className: 'Class VIII',
      sessionId: 'ses-2026',
      name: 'B',
      capacity: 40,
      currentEnrolled: 40,
      roomNumber: 'Room 205'
    };

    const result = AcademicMasterService.checkSectionCapacity(fullSection);
    expect(result.canEnroll).toBe(false);
    expect(result.statusMessage).toBe('SECTION_FULL');
  });

  it('3. Academic Readiness Checker: Correctly evaluates READY or NOT_READY status', () => {
    const readiness = AcademicMasterService.checkAcademicReadiness(
      'sch-001',
      sessions,
      [{ id: 'cls-8', tenantId: 'sch-001', sessionId: 'ses-2026', name: 'Class VIII', numericOrder: 8, academicLevel: 'MIDDLE' }],
      [{ id: 'sec-8a', tenantId: 'sch-001', classId: 'cls-8', className: 'Class VIII', sessionId: 'ses-2026', name: 'A', capacity: 40, currentEnrolled: 37, roomNumber: 'Room 204', classTeacherId: 'stf-1' }],
      [{ id: 'sub-sci', tenantId: 'sch-001', sessionId: 'ses-2026', classId: 'cls-8', className: 'Class VIII', name: 'Science', code: 'SCI-801', type: 'CORE', theoryMarks: 80, practicalMarks: 0, internalMarks: 20, totalMarks: 100, passingMarks: 33 }],
      [{ id: 'asg-1', tenantId: 'sch-001', sessionId: 'ses-2026', teacherId: 'stf-1', teacherName: 'Mrs. Sunita Mishra', classId: 'cls-8', className: 'Class VIII', sectionId: 'sec-8a', sectionName: 'A', subjectId: 'sub-sci', subjectName: 'Science' }]
    );

    expect(readiness.status).toBe('READY');
    expect(readiness.setupPercentage).toBe(100);
    expect(readiness.missingRequirements.length).toBe(0);
  });
});
