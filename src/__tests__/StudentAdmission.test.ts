import { describe, it, expect } from 'vitest';
import { StudentAdmissionService, StudentMasterProfile } from '../services/StudentAdmissionService';
import { UserSession, TenantSecurityException } from '../services/TenantSecurityService';
import { SectionMaster } from '../services/AcademicMasterService';

describe('i2A SchoolOS Admission & SIS Lifecycle Verification Suite', () => {
  const principalUser: UserSession = {
    id: 'user-principal',
    email: 'principal@abc.edu.in',
    tenantId: 'sch-001',
    role: 'PRINCIPAL',
    status: 'ACTIVE'
  };

  const validSection: SectionMaster = {
    id: 'sec-8a',
    tenantId: 'sch-001',
    classId: 'cls-8',
    className: 'Class VIII',
    sessionId: 'ses-2026',
    name: 'A',
    capacity: 40,
    currentEnrolled: 35,
    roomNumber: 'Room 204'
  };

  const fullSection: SectionMaster = {
    ...validSection,
    capacity: 40,
    currentEnrolled: 40
  };

  const existingStudents: StudentMasterProfile[] = [
    {
      id: 'std-101',
      tenantId: 'sch-001',
      admissionNo: 'ADM-2026-0001',
      rollNo: '01',
      fullName: 'Rahul Kumar',
      dob: '2012-05-14',
      gender: 'MALE',
      photoUrl: '',
      email: 'existing@gmail.com',
      mobile: '9876543210',
      address: { line1: '', city: 'Patna', district: 'Patna', state: 'Bihar', pincode: '800001' },
      currentSession: '2026-2027',
      currentClass: 'Class VIII',
      currentSection: 'A',
      admissionDate: '2026-04-10',
      status: 'ACTIVE',
      parentId: 'prt-101',
      parentName: 'Sanjay Kumar',
      parentPhone: '9876543210'
    }
  ];

  it('1. Admission Number Generator: Correct custom pattern formatting', () => {
    const pattern1 = 'ADM-{YEAR}-{SEQ}';
    const pattern2 = 'ABC/{YEAR}/{SEQ}';

    const adm1 = StudentAdmissionService.generateAdmissionNumber(pattern1, 5, '2026');
    const adm2 = StudentAdmissionService.generateAdmissionNumber(pattern2, 12, '2026');

    expect(adm1).toBe('ADM-2026-0005');
    expect(adm2).toBe('ABC/2026/0012');
  });

  it('2. Transactional Admission Confirmation: Successfully creates student & parent profiles', () => {
    const appData = {
      studentName: 'Aarav Patel',
      applyingClass: 'Class VIII',
      parentName: 'Mahesh Patel',
      phone: '9811223344',
      email: 'mahesh.patel@gmail.com'
    };

    const result = StudentAdmissionService.confirmAdmissionAndEnroll(
      principalUser,
      'sch-001',
      appData,
      validSection,
      existingStudents,
      'ADM-{YEAR}-{SEQ}'
    );

    expect(result.student).not.toBeNull();
    expect(result.student.fullName).toBe('Aarav Patel');
    expect(result.student.admissionNo).toBe('ADM-2026-0002');
    expect(result.parent.name).toBe('Mahesh Patel');
    expect(result.parent.childrenIds).toContain(result.student.id);
  });

  it('3. Section Capacity Protection: Rejects admission if section is SECTION_FULL', () => {
    const appData = {
      studentName: 'Full Test Student',
      applyingClass: 'Class VIII',
      parentName: 'Full Parent',
      phone: '9899001122',
      email: 'full@gmail.com'
    };

    expect(() => {
      StudentAdmissionService.confirmAdmissionAndEnroll(
        principalUser,
        'sch-001',
        appData,
        fullSection,
        existingStudents
      );
    }).toThrowError('DENIED: Section Class VIII-A is SECTION_FULL.');
  });

  it('4. Duplicate Protection: Rejects admission with existing mobile number', () => {
    const duplicateData = {
      studentName: 'Duplicate Test',
      applyingClass: 'Class VIII',
      parentName: 'Duplicate Parent',
      phone: '9876543210', // Mobile exists in existingStudents
      email: 'newemail@gmail.com'
    };

    expect(() => {
      StudentAdmissionService.confirmAdmissionAndEnroll(
        principalUser,
        'sch-001',
        duplicateData,
        validSection,
        existingStudents
      );
    }).toThrowError(TenantSecurityException);
  });
});
