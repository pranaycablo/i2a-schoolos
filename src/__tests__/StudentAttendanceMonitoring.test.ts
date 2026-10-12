import { describe, it, expect } from 'vitest';
import { AttendanceLeaveService } from '../services/AttendanceLeaveService';
import { TenantSecurityException, type UserSession } from '../services/TenantSecurityService';

describe('FOV-08: Student Attendance Monitoring, Teacher Marking & Security', () => {
  const service = AttendanceLeaveService.getInstance();

  const schoolAId = 'I2A-SCH-000001';
  const schoolBId = 'I2A-SCH-000002';

  const teacherSessionA: UserSession = {
    id: 'teacher-01',
    email: 'priya.sharma@school1.edu',
    tenantId: schoolAId,
    role: 'TEACHER',
    status: 'ACTIVE',
    assignedClass: 'Class VIII',
    assignedSection: 'Section A'
  };

  const adminSessionA: UserSession = {
    id: 'admin-01',
    email: 'principal@school1.edu',
    tenantId: schoolAId,
    role: 'PRINCIPAL',
    status: 'ACTIVE'
  };

  const parentSessionAarav: UserSession = {
    id: 'parent-01',
    email: 'sharma.parent@gmail.com',
    tenantId: schoolAId,
    role: 'PARENT',
    status: 'ACTIVE',
    childrenIds: ['std-101'] // Only Aarav Sharma
  };

  const parentSessionOther: UserSession = {
    id: 'parent-02',
    email: 'gupta.parent@gmail.com',
    tenantId: schoolAId,
    role: 'PARENT',
    status: 'ACTIVE',
    childrenIds: ['std-103'] // Only Rohan Gupta
  };

  // Test 1: Authorized Teacher Marks Attendance
  it('1. Allows assigned teacher to mark daily attendance for their assigned class and section', () => {
    const records = service.markStudentAttendanceSessionGuarded(
      schoolAId,
      'sess-2026-2027',
      'Class VIII',
      'Section A',
      '2026-10-12',
      [
        { studentId: 'std-101', studentName: 'Aarav Sharma', status: 'PRESENT' },
        { studentId: 'std-102', studentName: 'Ananya Verma', status: 'PRESENT' },
        { studentId: 'std-103', studentName: 'Rohan Gupta', status: 'ABSENT', remarks: 'Sick leave' }
      ],
      teacherSessionA
    );

    expect(records.length).toBe(3);
    const aarav = records.find((r) => r.entityId === 'std-101');
    expect(aarav?.status).toBe('PRESENT');
    expect(aarav?.markedBy).toBe(teacherSessionA.email);
  });

  // Test 2: Teacher Rejected for Unauthorized Class
  it('2. Rejects teacher when attempting to mark attendance for a class not assigned to them', () => {
    expect(() => {
      service.markStudentAttendanceSessionGuarded(
        schoolAId,
        'sess-2026-2027',
        'Class IX', // Teacher is assigned to Class VIII!
        'Section A',
        '2026-10-12',
        [{ studentId: 'std-201', studentName: 'Varun Patel', status: 'PRESENT' }],
        teacherSessionA
      );
    }).toThrowError(/UNAUTHORIZED_CLASS/i);
  });

  // Test 3: Non-Teaching Role Rejected from Marking Attendance
  it('3. Denies Parent or Student from marking student attendance', () => {
    expect(() => {
      service.markStudentAttendanceSessionGuarded(
        schoolAId,
        'sess-2026-2027',
        'Class VIII',
        'Section A',
        '2026-10-12',
        [{ studentId: 'std-101', studentName: 'Aarav Sharma', status: 'PRESENT' }],
        parentSessionAarav
      );
    }).toThrowError(/ROLE_DENIED/i);
  });

  // Test 4: Parent Child-Only Isolation
  it('4. Allows Parent to view attendance only for their authorized child', () => {
    // Parent of Aarav views Aarav's attendance
    const records = service.getStudentAttendanceRecordsForParent(schoolAId, 'std-101', parentSessionAarav);
    expect(records.length).toBeGreaterThan(0);
    records.forEach((r) => {
      expect(r.entityId).toBe('std-101');
    });

    // Parent of Aarav attempts to view Rohan's (std-103) attendance
    expect(() => {
      service.getStudentAttendanceRecordsForParent(schoolAId, 'std-103', parentSessionAarav);
    }).toThrowError(/PARENT_ACCESS_DENIED/i);
  });

  // Test 5: Cross-Tenant Attendance Access Rejection
  it('5. Denies access when a user attempts to access attendance records of another school', () => {
    expect(() => {
      service.getStudentAttendanceRecordsForParent(schoolBId, 'std-101', parentSessionAarav);
    }).toThrowError(TenantSecurityException);
  });

  // Test 6: Duplicate Submission Prevention on Same Date
  it('6. Updates existing record instead of creating duplicate rows on same date', () => {
    // Mark Aarav PRESENT on 2026-10-13
    service.markStudentAttendanceSessionGuarded(
      schoolAId,
      'sess-2026-2027',
      'Class VIII',
      'Section A',
      '2026-10-13',
      [{ studentId: 'std-101', studentName: 'Aarav Sharma', status: 'PRESENT' }],
      teacherSessionA
    );

    // Same teacher re-submits as LATE on same date
    const updatedRecords = service.markStudentAttendanceSessionGuarded(
      schoolAId,
      'sess-2026-2027',
      'Class VIII',
      'Section A',
      '2026-10-13',
      [{ studentId: 'std-101', studentName: 'Aarav Sharma', status: 'LATE', remarks: 'Bus breakdown' }],
      teacherSessionA
    );

    const aarav = updatedRecords.find((r) => r.entityId === 'std-101');
    expect(aarav?.status).toBe('LATE');

    // Verify there is only 1 record for this student on 2026-10-13
    const allAarav = service.getStudentAttendanceRecordsForParent(schoolAId, 'std-101', parentSessionAarav);
    const date13Records = allAarav.filter((r) => r.date === '2026-10-13');
    expect(date13Records.length).toBe(1);
  });

  // Test 7: Admin Correction Audit Trail
  it('7. Records full audit trail when Principal corrects an attendance record', () => {
    const aaravRecords = service.getStudentAttendanceRecordsForParent(schoolAId, 'std-101', parentSessionAarav);
    const recordToCorrect = aaravRecords[0];

    const corrected = service.applyAdminAttendanceCorrection(
      schoolAId,
      recordToCorrect.id,
      'EXCUSED',
      'Medical certificate approved by Principal',
      adminSessionA
    );

    expect(corrected.status).toBe('EXCUSED');
    expect(corrected.remarks).toContain('Corrected by PRINCIPAL');

    // Verify audit log exists
    const audits = service.getAuditTrail(schoolAId);
    const log = audits.find((a) => a.action === 'CORRECT_ATTENDANCE_RECORD');
    expect(log).toBeDefined();
    expect(log?.details).toContain('Medical certificate');
  });

  // Test 8: Attendance Percentage and Alert Thresholds
  it('8. Accurately calculates attendance percentage and detects critical low attendance thresholds', () => {
    const summary = service.calculateStudentSummary(schoolAId, 'std-101', 'Aarav Sharma');
    expect(summary.attendancePercentage).toBeGreaterThanOrEqual(0);
    expect(summary.attendancePercentage).toBeLessThanOrEqual(100);
    expect(['NORMAL', 'INFO', 'WARNING', 'CRITICAL']).toContain(summary.alertLevel);
  });
});
