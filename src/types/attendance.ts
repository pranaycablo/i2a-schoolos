export type AttendanceStatusCode = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED' | 'LEAVE' | 'HALF_DAY';

export interface AttendanceStatusConfig {
  code: AttendanceStatusCode;
  displayName: string;
  description: string;
  countsTowardPresent: boolean;
  countsTowardAbsent: boolean;
  countsTowardWorkingDay: boolean;
  weight: number; // e.g. 1.0 for present, 0.5 for half day, 0 for absent
  requiresReason: boolean;
  requiresApproval: boolean;
  isActive: boolean;
}

export type AttendanceEntityType = 'STUDENT' | 'TEACHER' | 'STAFF' | 'DRIVER';

export type AttendanceSource = 'MANUAL' | 'BIOMETRIC' | 'RFID' | 'QR' | 'API';

export interface AttendanceRecord {
  id: string;
  schoolId: string;
  academicSessionId: string;
  entityType: AttendanceEntityType;
  entityId: string; // studentId or staffId
  entityName: string;
  className?: string;
  section?: string;
  department?: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatusCode;
  remarks?: string;
  markedBy: string;
  markedByRole: string;
  markedAt: string;
  isLocked: boolean;
  lockStatus: 'DRAFT' | 'SUBMITTED' | 'LOCKED';
  source: AttendanceSource;
  periodId?: string; // period-wise foundation
}

export interface AttendanceLock {
  id: string;
  schoolId: string;
  academicSessionId: string;
  className: string;
  section: string;
  date: string;
  isLocked: boolean;
  lockedBy: string;
  lockedAt: string;
}

export interface AttendanceCorrection {
  id: string;
  schoolId: string;
  attendanceRecordId: string;
  entityId: string;
  entityName: string;
  date: string;
  oldStatus: AttendanceStatusCode;
  newStatus: AttendanceStatusCode;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  reviewedAt?: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'APPLIED' | 'CANCELLED';
  attachmentUrl?: string;
}

export interface LeaveType {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  applicableTo: 'STUDENT' | 'STAFF' | 'BOTH';
  attendanceTreatment: 'COUNTS_AS_LEAVE' | 'COUNTS_AS_PRESENT' | 'UNPAID';
  requiresApproval: boolean;
  requiresAttachment: boolean;
  isActive: boolean;
}

export interface StudentLeaveRequest {
  id: string;
  schoolId: string;
  academicSessionId: string;
  studentId: string;
  studentName: string;
  className: string;
  section: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  leaveTypeId: string;
  leaveTypeName: string;
  reason: string;
  attachmentUrl?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  requestedBy: string;
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
}

export interface StaffLeaveRequest {
  id: string;
  schoolId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  totalDays: number;
  leaveTypeId: string;
  leaveTypeName: string;
  reason: string;
  attachmentUrl?: string;
  reportingManager: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  requestedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  remarks?: string;
}

export interface AttendancePolicy {
  schoolId: string;
  minAttendanceThreshold: number; // e.g. 75%
  warningThreshold: number; // e.g. 80%
  infoThreshold: number; // e.g. 85%
  lateCountAsPresent: boolean;
  halfDayWeight: number; // 0.5
  lateThresholdForHalfDay: boolean; // if late > cutoff, counts as half day
  approvedLeaveExcludedFromDenominator: boolean;
  autoLockTime: string; // e.g. "17:00"
}

export interface AttendanceSummary {
  schoolId: string;
  entityId: string;
  entityName: string;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  leaveDays: number;
  excusedDays: number;
  halfDays: number;
  attendancePercentage: number;
  alertLevel: 'NORMAL' | 'INFO' | 'WARNING' | 'CRITICAL';
  consecutiveAbsences: number;
}

export interface AttendanceEvent {
  eventId: string;
  eventType:
    | 'attendance.marked'
    | 'attendance.updated'
    | 'attendance.corrected'
    | 'attendance.locked'
    | 'attendance.unlocked'
    | 'attendance.low'
    | 'attendance.submission.pending'
    | 'student.leave.requested'
    | 'student.leave.approved'
    | 'student.leave.rejected'
    | 'staff.leave.requested'
    | 'staff.leave.approved'
    | 'staff.leave.rejected';
  schoolId: string;
  entityId: string;
  timestamp: string;
  correlationId: string;
  payload: Record<string, any>;
}

export interface DeviceAttendanceIngest {
  deviceId: string;
  schoolId: string;
  entityId: string;
  timestamp: string;
  source: AttendanceSource;
  rawPayload: string;
}
