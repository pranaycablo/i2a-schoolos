import { describe, it, expect, beforeEach } from 'vitest';
import { AttendanceLeaveService } from '../services/AttendanceLeaveService';

describe('Master Prompt 07 — Attendance, Leave, Staff Presence & Intelligence Engine Tests', () => {
  let attendanceService: AttendanceLeaveService;
  const schoolId = 'sch-001';
  const sessionId = 'sess-2026-2027';

  beforeEach(() => {
    attendanceService = AttendanceLeaveService.getInstance();
  });

  it('T-001: Correctly calculates attendance summary, percentage and half-day weights', () => {
    const studentId = 'std-test-1';

    // Mark 4 days: PRESENT, ABSENT, HALF_DAY, LATE
    attendanceService.markStudentAttendanceBatch(
      schoolId,
      sessionId,
      'Class IX',
      'A',
      '2026-10-01',
      [{ studentId, studentName: 'Test Student 1', status: 'PRESENT' }],
      'teacher-1',
      'TEACHER'
    );

    attendanceService.markStudentAttendanceBatch(
      schoolId,
      sessionId,
      'Class IX',
      'A',
      '2026-10-02',
      [{ studentId, studentName: 'Test Student 1', status: 'ABSENT' }],
      'teacher-1',
      'TEACHER'
    );

    attendanceService.markStudentAttendanceBatch(
      schoolId,
      sessionId,
      'Class IX',
      'A',
      '2026-10-03',
      [{ studentId, studentName: 'Test Student 1', status: 'HALF_DAY' }],
      'teacher-1',
      'TEACHER'
    );

    attendanceService.markStudentAttendanceBatch(
      schoolId,
      sessionId,
      'Class IX',
      'A',
      '2026-10-04',
      [{ studentId, studentName: 'Test Student 1', status: 'LATE' }],
      'teacher-1',
      'TEACHER'
    );

    const summary = attendanceService.calculateStudentSummary(schoolId, studentId, 'Test Student 1');

    expect(summary.totalWorkingDays).toBe(4);
    expect(summary.presentDays).toBe(2); // PRESENT + LATE (as policy defaults lateCountAsPresent = true)
    expect(summary.absentDays).toBe(1);
    expect(summary.halfDays).toBe(1);

    // Weighted Present = 2 (PRESENT+LATE) + 0.5 (HALF_DAY) = 2.5
    // Percentage = (2.5 / 4) * 100 = 62.5%
    expect(summary.attendancePercentage).toBe(62.5);
    expect(summary.alertLevel).toBe('CRITICAL'); // < 75%
  });

  it('T-002: Enforces Attendance Locking after cutoff and blocks casual edits', () => {
    const studentId = 'std-test-2';
    const className = 'Class X';
    const section = 'B';
    const date = '2026-10-05';

    // Mark attendance
    attendanceService.markStudentAttendanceBatch(
      schoolId,
      sessionId,
      className,
      section,
      date,
      [{ studentId, studentName: 'Test Student 2', status: 'PRESENT' }],
      'teacher-1',
      'TEACHER'
    );

    // Lock session
    attendanceService.lockAttendanceSession(schoolId, sessionId, className, section, date, 'admin-1');

    expect(attendanceService.isAttendanceLocked(schoolId, className, section, date)).toBe(true);

    // Attempt casual re-marking must throw error
    expect(() => {
      attendanceService.markStudentAttendanceBatch(
        schoolId,
        sessionId,
        className,
        section,
        date,
        [{ studentId, studentName: 'Test Student 2', status: 'ABSENT' }],
        'teacher-1',
        'TEACHER'
      );
    }).toThrow(/LOCKED/);
  });

  it('T-003: Allows Authorized Attendance Correction for locked sessions', () => {
    const studentId = 'std-test-3';
    const className = 'Class XI';
    const section = 'C';
    const date = '2026-10-06';

    const [record] = attendanceService.markStudentAttendanceBatch(
      schoolId,
      sessionId,
      className,
      section,
      date,
      [{ studentId, studentName: 'Test Student 3', status: 'ABSENT' }],
      'teacher-1',
      'TEACHER'
    );

    attendanceService.lockAttendanceSession(schoolId, sessionId, className, section, date, 'admin-1');

    // Request correction
    const correction = attendanceService.requestAttendanceCorrection(
      schoolId,
      record.id,
      'EXCUSED',
      'Medical certificate presented later in day',
      'teacher-1'
    );

    expect(correction.status).toBe('REQUESTED');

    // Approve correction
    const approved = attendanceService.approveAttendanceCorrection(schoolId, correction.id, 'principal-1');

    expect(approved.status).toBe('APPROVED');

    // Check updated record status
    const updatedRecords = attendanceService.getAttendanceRecords(schoolId, className, section, date);
    const updatedRecord = updatedRecords.find((r) => r.entityId === studentId);

    expect(updatedRecord?.status).toBe('EXCUSED');
  });

  it('T-004: Integrates Approved Student Leave directly into Attendance Records', () => {
    const studentId = 'std-test-leave-1';

    const leaveRequest = attendanceService.submitStudentLeave({
      schoolId,
      academicSessionId: sessionId,
      studentId,
      studentName: 'Leave Student',
      className: 'Class XII',
      section: 'A',
      startDate: '2026-10-15',
      endDate: '2026-10-16',
      totalDays: 2,
      leaveTypeId: 'lt-sick',
      leaveTypeName: 'Sick Leave',
      reason: 'Fever and rest',
      requestedBy: 'parent-1'
    });

    expect(leaveRequest.status).toBe('SUBMITTED');

    // Approve leave
    const approved = attendanceService.approveStudentLeave(schoolId, leaveRequest.id, 'principal-1', 'Approved by Principal');
    expect(approved.status).toBe('APPROVED');

    // Verify auto-generated attendance records for leave dates
    const recordsOct15 = attendanceService.getAttendanceRecords(schoolId, 'Class XII', 'A', '2026-10-15');
    const studentRecord = recordsOct15.find((r) => r.entityId === studentId);

    expect(studentRecord).toBeDefined();
    expect(studentRecord?.status).toBe('LEAVE');
  });

  it('T-005: Ingests Biometric Device Punches safely without duplicates', () => {
    const ingest = attendanceService.processDeviceAttendanceIngest({
      deviceId: 'BIO-GATE-01',
      schoolId,
      entityId: 'EMP-301',
      timestamp: '2026-10-08T08:10:00Z',
      source: 'BIOMETRIC',
      rawPayload: 'FINGERPRINT_MATCH_OK'
    });

    expect(ingest.status).toBe('PRESENT');
    expect(ingest.source).toBe('BIOMETRIC');

    // Ingest duplicate punch
    const duplicateIngest = attendanceService.processDeviceAttendanceIngest({
      deviceId: 'BIO-GATE-01',
      schoolId,
      entityId: 'EMP-301',
      timestamp: '2026-10-08T08:12:00Z',
      source: 'BIOMETRIC',
      rawPayload: 'FINGERPRINT_MATCH_OK'
    });

    expect(duplicateIngest.id).toBe(ingest.id); // Same record updated
  });

  it('T-006: Enforces Multi-Tenant Isolation for attendance records', () => {
    const schoolA = 'sch-001';
    const schoolB = 'sch-002';

    attendanceService.markStudentAttendanceBatch(
      schoolA,
      sessionId,
      'Class I',
      'A',
      '2026-10-08',
      [{ studentId: 'std-a', studentName: 'School A Student', status: 'PRESENT' }],
      'teacher-a',
      'TEACHER'
    );

    const schoolBRecords = attendanceService.getAttendanceRecords(schoolB, 'Class I', 'A', '2026-10-08');
    expect(schoolBRecords.length).toBe(0);
  });
});
