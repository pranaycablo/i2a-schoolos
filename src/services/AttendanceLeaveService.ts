import type {
  AttendanceRecord,
  AttendanceStatusCode,
  AttendanceStatusConfig,
  AttendanceLock,
  AttendanceCorrection,
  StudentLeaveRequest,
  StaffLeaveRequest,
  LeaveType,
  AttendancePolicy,
  AttendanceSummary,
  AttendanceEvent,
  DeviceAttendanceIngest
} from '../types/attendance';
import type { AuditLog, UserRole } from '../types';
import { TenantSecurityService, type UserSession, TenantSecurityException } from './TenantSecurityService';

export class AttendanceLeaveService {
  private static instance: AttendanceLeaveService;

  private records: AttendanceRecord[] = [
    {
      id: 'att-101',
      schoolId: 'sch-001',
      academicSessionId: 'sess-2026-2027',
      entityType: 'STUDENT',
      entityId: 'std-101',
      entityName: 'Aarav Sharma',
      className: 'Class VIII',
      section: 'Section A',
      date: '2026-10-07',
      status: 'PRESENT',
      markedBy: 'usr-teacher-01',
      markedByRole: 'TEACHER',
      markedAt: '2026-10-07T08:30:00Z',
      isLocked: true,
      lockStatus: 'LOCKED',
      source: 'MANUAL'
    },
    {
      id: 'att-102',
      schoolId: 'sch-001',
      academicSessionId: 'sess-2026-2027',
      entityType: 'STUDENT',
      entityId: 'std-102',
      entityName: 'Ananya Verma',
      className: 'Class VIII',
      section: 'Section A',
      date: '2026-10-07',
      status: 'PRESENT',
      markedBy: 'usr-teacher-01',
      markedByRole: 'TEACHER',
      markedAt: '2026-10-07T08:30:00Z',
      isLocked: true,
      lockStatus: 'LOCKED',
      source: 'MANUAL'
    },
    {
      id: 'att-103',
      schoolId: 'sch-001',
      academicSessionId: 'sess-2026-2027',
      entityType: 'STUDENT',
      entityId: 'std-103',
      entityName: 'Rohan Gupta',
      className: 'Class VIII',
      section: 'Section A',
      date: '2026-10-07',
      status: 'ABSENT',
      remarks: 'Uninformed absence',
      markedBy: 'usr-teacher-01',
      markedByRole: 'TEACHER',
      markedAt: '2026-10-07T08:30:00Z',
      isLocked: true,
      lockStatus: 'LOCKED',
      source: 'MANUAL'
    }
  ];

  private locks: AttendanceLock[] = [
    {
      id: 'lock-101',
      schoolId: 'sch-001',
      academicSessionId: 'sess-2026-2027',
      className: 'Class VIII',
      section: 'Section A',
      date: '2026-10-07',
      isLocked: true,
      lockedBy: 'usr-admin-01',
      lockedAt: '2026-10-07T17:00:00Z'
    }
  ];

  private corrections: AttendanceCorrection[] = [];

  private studentLeaves: StudentLeaveRequest[] = [
    {
      id: 'slev-101',
      schoolId: 'sch-001',
      academicSessionId: 'sess-2026-2027',
      studentId: 'std-103',
      studentName: 'Rohan Gupta',
      className: 'Class VIII',
      section: 'Section A',
      startDate: '2026-10-08',
      endDate: '2026-10-09',
      totalDays: 2,
      leaveTypeId: 'lt-sick',
      leaveTypeName: 'Sick Leave',
      reason: 'Fever and viral infection doctor advised rest',
      status: 'SUBMITTED',
      requestedBy: 'parent-std-103',
      requestedAt: '2026-10-08T07:15:00Z'
    }
  ];

  private staffLeaves: StaffLeaveRequest[] = [
    {
      id: 'stflev-101',
      schoolId: 'sch-001',
      employeeId: 'EMP-101',
      employeeName: 'Rajesh Kumar',
      department: 'Mathematics',
      designation: 'Senior PGT Mathematics Teacher',
      startDate: '2026-10-10',
      endDate: '2026-10-12',
      totalDays: 3,
      leaveTypeId: 'lt-casual',
      leaveTypeName: 'Casual Leave',
      reason: 'Family event out of station',
      reportingManager: 'usr-principal-01',
      status: 'SUBMITTED',
      requestedAt: '2026-10-08T06:00:00Z'
    }
  ];

  private leaveTypes: LeaveType[] = [
    {
      id: 'lt-sick',
      schoolId: 'sch-001',
      name: 'Sick Leave',
      code: 'SL',
      applicableTo: 'BOTH',
      attendanceTreatment: 'COUNTS_AS_LEAVE',
      requiresApproval: true,
      requiresAttachment: true,
      isActive: true
    },
    {
      id: 'lt-casual',
      schoolId: 'sch-001',
      name: 'Casual Leave',
      code: 'CL',
      applicableTo: 'BOTH',
      attendanceTreatment: 'COUNTS_AS_LEAVE',
      requiresApproval: true,
      requiresAttachment: false,
      isActive: true
    },
    {
      id: 'lt-official',
      schoolId: 'sch-001',
      name: 'Official Duty / Sports',
      code: 'OD',
      applicableTo: 'BOTH',
      attendanceTreatment: 'COUNTS_AS_PRESENT',
      requiresApproval: true,
      requiresAttachment: false,
      isActive: true
    }
  ];

  private policies: Map<string, AttendancePolicy> = new Map([
    [
      'sch-001',
      {
        schoolId: 'sch-001',
        minAttendanceThreshold: 75,
        warningThreshold: 80,
        infoThreshold: 85,
        lateCountAsPresent: true,
        halfDayWeight: 0.5,
        lateThresholdForHalfDay: false,
        approvedLeaveExcludedFromDenominator: false,
        autoLockTime: '17:00'
      }
    ]
  ]);

  private auditLogs: AuditLog[] = [];
  private events: AttendanceEvent[] = [];

  private statusConfigs: AttendanceStatusConfig[] = [
    {
      code: 'PRESENT',
      displayName: 'Present',
      description: 'Student/Staff is physically or officially present',
      countsTowardPresent: true,
      countsTowardAbsent: false,
      countsTowardWorkingDay: true,
      weight: 1.0,
      requiresReason: false,
      requiresApproval: false,
      isActive: true
    },
    {
      code: 'ABSENT',
      displayName: 'Absent',
      description: 'Uninformed or unexcused absence',
      countsTowardPresent: false,
      countsTowardAbsent: true,
      countsTowardWorkingDay: true,
      weight: 0.0,
      requiresReason: false,
      requiresApproval: false,
      isActive: true
    },
    {
      code: 'LATE',
      displayName: 'Late',
      description: 'Arrived after specified morning cutoff time',
      countsTowardPresent: true,
      countsTowardAbsent: false,
      countsTowardWorkingDay: true,
      weight: 1.0,
      requiresReason: true,
      requiresApproval: false,
      isActive: true
    },
    {
      code: 'EXCUSED',
      displayName: 'Excused',
      description: 'Absence excused by school administration',
      countsTowardPresent: true,
      countsTowardAbsent: false,
      countsTowardWorkingDay: true,
      weight: 1.0,
      requiresReason: true,
      requiresApproval: true,
      isActive: true
    },
    {
      code: 'LEAVE',
      displayName: 'Approved Leave',
      description: 'Sanctioned leave by parent request or administrative approval',
      countsTowardPresent: false,
      countsTowardAbsent: false,
      countsTowardWorkingDay: true,
      weight: 0.0,
      requiresReason: true,
      requiresApproval: true,
      isActive: true
    },
    {
      code: 'HALF_DAY',
      displayName: 'Half Day',
      description: 'Attended partial day sessions',
      countsTowardPresent: false,
      countsTowardAbsent: false,
      countsTowardWorkingDay: true,
      weight: 0.5,
      requiresReason: true,
      requiresApproval: false,
      isActive: true
    }
  ];

  public static getInstance(): AttendanceLeaveService {
    if (!AttendanceLeaveService.instance) {
      AttendanceLeaveService.instance = new AttendanceLeaveService();
    }
    return AttendanceLeaveService.instance;
  }

  // --- ATTENDANCE STATUS & POLICY CONFIG ---
  public getStatusConfigs(): AttendanceStatusConfig[] {
    return this.statusConfigs;
  }

  public getPolicy(schoolId: string): AttendancePolicy {
    return (
      this.policies.get(schoolId) || {
        schoolId,
        minAttendanceThreshold: 75,
        warningThreshold: 80,
        infoThreshold: 85,
        lateCountAsPresent: true,
        halfDayWeight: 0.5,
        lateThresholdForHalfDay: false,
        approvedLeaveExcludedFromDenominator: false,
        autoLockTime: '17:00'
      }
    );
  }

  public updatePolicy(schoolId: string, updated: Partial<AttendancePolicy>, actor: string): AttendancePolicy {
    const existing = this.getPolicy(schoolId);
    const newPolicy = { ...existing, ...updated };
    this.policies.set(schoolId, newPolicy);

    this.logAudit({
      user: actor,
      role: 'PRINCIPAL',
      action: 'UPDATE_ATTENDANCE_POLICY',
      module: 'ATTENDANCE',
      details: `Updated attendance policy thresholds for school ${schoolId}: Min=${newPolicy.minAttendanceThreshold}%`
    });

    return newPolicy;
  }

  // --- ATTENDANCE LOCKING & DUPLICATE PROTECTION ---
  public isAttendanceLocked(schoolId: string, className: string, section: string, date: string): boolean {
    const lock = this.locks.find(
      (l) => l.schoolId === schoolId && l.className === className && l.section === section && l.date === date
    );
    return lock ? lock.isLocked : false;
  }

  public lockAttendanceSession(
    schoolId: string,
    academicSessionId: string,
    className: string,
    section: string,
    date: string,
    lockedBy: string
  ): AttendanceLock {
    const existing = this.locks.find(
      (l) => l.schoolId === schoolId && l.className === className && l.section === section && l.date === date
    );

    let lock: AttendanceLock;
    if (existing) {
      existing.isLocked = true;
      existing.lockedBy = lockedBy;
      existing.lockedAt = new Date().toISOString();
      lock = existing;
    } else {
      lock = {
        id: `lock-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        schoolId,
        academicSessionId,
        className,
        section,
        date,
        isLocked: true,
        lockedBy,
        lockedAt: new Date().toISOString()
      };
      this.locks.push(lock);
    }

    // Update existing records lock status
    this.records.forEach((r) => {
      if (r.schoolId === schoolId && r.className === className && r.section === section && r.date === date) {
        r.isLocked = true;
        r.lockStatus = 'LOCKED';
      }
    });

    this.logAudit({
      user: lockedBy,
      role: 'TEACHER',
      action: 'LOCK_ATTENDANCE_SESSION',
      module: 'ATTENDANCE',
      details: `Locked attendance for ${className}-${section} on date ${date}`
    });

    this.emitEvent({
      eventType: 'attendance.locked',
      schoolId,
      entityId: `${className}-${section}-${date}`,
      payload: { className, section, date, lockedBy }
    });

    return lock;
  }

  // --- DAILY STUDENT ATTENDANCE MARKING ---
  public markStudentAttendanceBatch(
    schoolId: string,
    academicSessionId: string,
    className: string,
    section: string,
    date: string,
    entries: { studentId: string; studentName: string; status: AttendanceStatusCode; remarks?: string }[],
    markedBy: string,
    markedByRole: string
  ): AttendanceRecord[] {
    // Check lock
    if (this.isAttendanceLocked(schoolId, className, section, date)) {
      throw new Error(`Attendance for ${className}-${section} on ${date} is LOCKED. Submit correction request to make changes.`);
    }

    const createdRecords: AttendanceRecord[] = [];

    entries.forEach((entry) => {
      // Prevent duplicate attendance for same school + student + date
      const existingIdx = this.records.findIndex(
        (r) => r.schoolId === schoolId && r.entityId === entry.studentId && r.date === date
      );

      if (existingIdx >= 0) {
        // Update existing draft/submitted record
        this.records[existingIdx] = {
          ...this.records[existingIdx],
          status: entry.status,
          remarks: entry.remarks,
          markedBy,
          markedByRole,
          markedAt: new Date().toISOString()
        };
        createdRecords.push(this.records[existingIdx]);
      } else {
        const newRecord: AttendanceRecord = {
          id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          schoolId,
          academicSessionId,
          entityType: 'STUDENT',
          entityId: entry.studentId,
          entityName: entry.studentName,
          className,
          section,
          date,
          status: entry.status,
          remarks: entry.remarks,
          markedBy,
          markedByRole,
          markedAt: new Date().toISOString(),
          isLocked: false,
          lockStatus: 'SUBMITTED',
          source: 'MANUAL'
        };
        this.records.push(newRecord);
        createdRecords.push(newRecord);
      }

      // Check low attendance trigger for student
      const summary = this.calculateStudentSummary(schoolId, entry.studentId);
      if (summary.alertLevel === 'CRITICAL' || summary.alertLevel === 'WARNING') {
        this.emitEvent({
          eventType: 'attendance.low',
          schoolId,
          entityId: entry.studentId,
          payload: {
            studentName: entry.studentName,
            className,
            section,
            attendancePercentage: summary.attendancePercentage,
            alertLevel: summary.alertLevel
          }
        });
      }
    });

    this.logAudit({
      user: markedBy,
      role: markedByRole as UserRole,
      action: 'MARK_STUDENT_ATTENDANCE_BATCH',
      module: 'ATTENDANCE',
      details: `Marked attendance for ${entries.length} students in ${className}-${section} on ${date}`
    });

    this.emitEvent({
      eventType: 'attendance.marked',
      schoolId,
      entityId: `${className}-${section}-${date}`,
      payload: { className, section, date, count: entries.length, markedBy }
    });

    return createdRecords;
  }

  // --- STAFF ATTENDANCE ---
  public markStaffAttendance(
    schoolId: string,
    employeeId: string,
    employeeName: string,
    department: string,
    date: string,
    status: AttendanceStatusCode,
    markedBy: string,
    remarks?: string
  ): AttendanceRecord {
    const existingIdx = this.records.findIndex(
      (r) => r.schoolId === schoolId && r.entityId === employeeId && r.date === date && r.entityType === 'STAFF'
    );

    let record: AttendanceRecord;
    if (existingIdx >= 0) {
      this.records[existingIdx] = {
        ...this.records[existingIdx],
        status,
        remarks,
        markedBy,
        markedAt: new Date().toISOString()
      };
      record = this.records[existingIdx];
    } else {
      record = {
        id: `att-stf-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        schoolId,
        academicSessionId: 'sess-2026-2027',
        entityType: 'STAFF',
        entityId: employeeId,
        entityName: employeeName,
        department,
        date,
        status,
        remarks,
        markedBy,
        markedByRole: 'ADMIN',
        markedAt: new Date().toISOString(),
        isLocked: false,
        lockStatus: 'SUBMITTED',
        source: 'MANUAL'
      };
      this.records.push(record);
    }

    this.logAudit({
      user: markedBy,
      role: 'PRINCIPAL',
      action: 'MARK_STAFF_ATTENDANCE',
      module: 'STAFF_ATTENDANCE',
      details: `Marked staff attendance for ${employeeName} (${department}) on ${date} as ${status}`
    });

    return record;
  }

  // --- ATTENDANCE CALCULATION ENGINE ---
  public calculateStudentSummary(
    schoolId: string,
    studentId: string,
    studentName: string = 'Student'
  ): AttendanceSummary {
    const studentRecords = this.records.filter(
      (r) => r.schoolId === schoolId && r.entityId === studentId && r.entityType === 'STUDENT'
    );

    const policy = this.getPolicy(schoolId);

    let presentDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    let leaveDays = 0;
    let excusedDays = 0;
    let halfDays = 0;

    studentRecords.forEach((r) => {
      switch (r.status) {
        case 'PRESENT':
          presentDays += 1;
          break;
        case 'ABSENT':
          absentDays += 1;
          break;
        case 'LATE':
          lateDays += 1;
          if (policy.lateCountAsPresent) {
            presentDays += 1;
          }
          break;
        case 'EXCUSED':
          excusedDays += 1;
          presentDays += 1;
          break;
        case 'LEAVE':
          leaveDays += 1;
          break;
        case 'HALF_DAY':
          halfDays += 1;
          break;
      }
    });

    let totalWorkingDays = studentRecords.length;
    if (totalWorkingDays === 0) {
      totalWorkingDays = 1; // avoid division by zero default
    }

    const weightedPresent =
      presentDays +
      (policy.lateCountAsPresent ? 0 : lateDays * 1.0) +
      halfDays * policy.halfDayWeight;

    let denominator = totalWorkingDays;
    if (policy.approvedLeaveExcludedFromDenominator) {
      denominator = Math.max(1, totalWorkingDays - leaveDays);
    }

    const attendancePercentage = Number(((weightedPresent / denominator) * 100).toFixed(1));

    let alertLevel: 'NORMAL' | 'INFO' | 'WARNING' | 'CRITICAL' = 'NORMAL';
    if (attendancePercentage < policy.minAttendanceThreshold) {
      alertLevel = 'CRITICAL';
    } else if (attendancePercentage < policy.warningThreshold) {
      alertLevel = 'WARNING';
    } else if (attendancePercentage < policy.infoThreshold) {
      alertLevel = 'INFO';
    }

    // Calculate consecutive absences leading up to latest date
    const sorted = [...studentRecords].sort((a, b) => b.date.localeCompare(a.date));
    let consecutiveAbsences = 0;
    for (const rec of sorted) {
      if (rec.status === 'ABSENT') {
        consecutiveAbsences += 1;
      } else {
        break;
      }
    }

    return {
      schoolId,
      entityId: studentId,
      entityName: studentRecords[0]?.entityName || studentName,
      totalWorkingDays,
      presentDays,
      absentDays,
      lateDays,
      leaveDays,
      excusedDays,
      halfDays,
      attendancePercentage,
      alertLevel,
      consecutiveAbsences
    };
  }

  // --- ATTENDANCE CORRECTION WORKFLOW ---
  public requestAttendanceCorrection(
    schoolId: string,
    attendanceRecordId: string,
    newStatus: AttendanceStatusCode,
    reason: string,
    requestedBy: string
  ): AttendanceCorrection {
    const record = this.records.find((r) => r.id === attendanceRecordId && r.schoolId === schoolId);
    if (!record) {
      throw new Error(`Attendance record ${attendanceRecordId} not found in school ${schoolId}`);
    }

    const correction: AttendanceCorrection = {
      id: `corr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      schoolId,
      attendanceRecordId,
      entityId: record.entityId,
      entityName: record.entityName,
      date: record.date,
      oldStatus: record.status,
      newStatus,
      reason,
      requestedBy,
      requestedAt: new Date().toISOString(),
      status: 'REQUESTED'
    };

    this.corrections.push(correction);

    this.logAudit({
      user: requestedBy,
      role: 'TEACHER',
      action: 'REQUEST_ATTENDANCE_CORRECTION',
      module: 'ATTENDANCE',
      details: `Requested correction for ${record.entityName} from ${record.status} to ${newStatus}. Reason: ${reason}`
    });

    return correction;
  }

  public approveAttendanceCorrection(
    schoolId: string,
    correctionId: string,
    approvedBy: string
  ): AttendanceCorrection {
    const correction = this.corrections.find((c) => c.id === correctionId && c.schoolId === schoolId);
    if (!correction) {
      throw new Error(`Correction request ${correctionId} not found.`);
    }

    if (correction.status !== 'REQUESTED') {
      throw new Error(`Correction ${correctionId} is already in state ${correction.status}.`);
    }

    const record = this.records.find((r) => r.id === correction.attendanceRecordId && r.schoolId === schoolId);
    if (!record) {
      throw new Error(`Original attendance record missing.`);
    }

    // Apply change
    record.status = correction.newStatus;
    record.remarks = `Corrected by ${approvedBy} (Original: ${correction.oldStatus})`;

    correction.status = 'APPROVED';
    correction.approvedBy = approvedBy;
    correction.reviewedAt = new Date().toISOString();

    this.logAudit({
      user: approvedBy,
      role: 'PRINCIPAL',
      action: 'APPROVE_ATTENDANCE_CORRECTION',
      module: 'ATTENDANCE',
      details: `Approved attendance correction for ${correction.entityName} on date ${correction.date}`
    });

    this.emitEvent({
      eventType: 'attendance.corrected',
      schoolId,
      entityId: correction.entityId,
      payload: { correctionId, oldStatus: correction.oldStatus, newStatus: correction.newStatus, approvedBy }
    });

    return correction;
  }

  // --- LEAVE MANAGEMENT WORKFLOW ---
  public submitStudentLeave(request: Omit<StudentLeaveRequest, 'id' | 'status' | 'requestedAt'>): StudentLeaveRequest {
    const leaveReq: StudentLeaveRequest = {
      ...request,
      id: `slev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      status: 'SUBMITTED',
      requestedAt: new Date().toISOString()
    };

    this.studentLeaves.push(leaveReq);

    this.logAudit({
      user: request.requestedBy,
      role: 'PARENT',
      action: 'SUBMIT_STUDENT_LEAVE',
      module: 'LEAVE',
      details: `Submitted leave request for ${request.studentName} from ${request.startDate} to ${request.endDate}`
    });

    this.emitEvent({
      eventType: 'student.leave.requested',
      schoolId: request.schoolId,
      entityId: request.studentId,
      payload: { leaveId: leaveReq.id, studentName: request.studentName, dates: `${request.startDate} to ${request.endDate}` }
    });

    return leaveReq;
  }

  public approveStudentLeave(schoolId: string, leaveId: string, approvedBy: string, remarks?: string): StudentLeaveRequest {
    const leave = this.studentLeaves.find((l) => l.id === leaveId && l.schoolId === schoolId);
    if (!leave) {
      throw new Error(`Student leave request ${leaveId} not found.`);
    }

    leave.status = 'APPROVED';
    leave.reviewedBy = approvedBy;
    leave.reviewedAt = new Date().toISOString();
    leave.remarks = remarks;

    // Automatically generate or update AttendanceRecords for each leave day to 'LEAVE'
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      const existingIdx = this.records.findIndex(
        (r) => r.schoolId === schoolId && r.entityId === leave.studentId && r.date === dateStr
      );

      if (existingIdx >= 0) {
        this.records[existingIdx].status = 'LEAVE';
        this.records[existingIdx].remarks = `Approved Leave (${leave.leaveTypeName})`;
      } else {
        this.records.push({
          id: `att-lve-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          schoolId,
          academicSessionId: leave.academicSessionId,
          entityType: 'STUDENT',
          entityId: leave.studentId,
          entityName: leave.studentName,
          className: leave.className,
          section: leave.section,
          date: dateStr,
          status: 'LEAVE',
          remarks: `Approved Leave (${leave.leaveTypeName})`,
          markedBy: approvedBy,
          markedByRole: 'PRINCIPAL',
          markedAt: new Date().toISOString(),
          isLocked: false,
          lockStatus: 'SUBMITTED',
          source: 'MANUAL'
        });
      }
    }

    this.logAudit({
      user: approvedBy,
      role: 'PRINCIPAL',
      action: 'APPROVE_STUDENT_LEAVE',
      module: 'LEAVE',
      details: `Approved student leave for ${leave.studentName} (${leave.startDate} to ${leave.endDate})`
    });

    this.emitEvent({
      eventType: 'student.leave.approved',
      schoolId,
      entityId: leave.studentId,
      payload: { leaveId, studentName: leave.studentName, approvedBy }
    });

    return leave;
  }

  public submitStaffLeave(request: Omit<StaffLeaveRequest, 'id' | 'status' | 'requestedAt'>): StaffLeaveRequest {
    const leaveReq: StaffLeaveRequest = {
      ...request,
      id: `stflev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      status: 'SUBMITTED',
      requestedAt: new Date().toISOString()
    };

    this.staffLeaves.push(leaveReq);

    this.logAudit({
      user: request.employeeName,
      role: 'TEACHER',
      action: 'SUBMIT_STAFF_LEAVE',
      module: 'STAFF_LEAVE',
      details: `Submitted staff leave request for ${request.employeeName} from ${request.startDate} to ${request.endDate}`
    });

    return leaveReq;
  }

  public approveStaffLeave(schoolId: string, leaveId: string, approvedBy: string, remarks?: string): StaffLeaveRequest {
    const leave = this.staffLeaves.find((l) => l.id === leaveId && l.schoolId === schoolId);
    if (!leave) {
      throw new Error(`Staff leave request ${leaveId} not found.`);
    }

    leave.status = 'APPROVED';
    leave.reviewedBy = approvedBy;
    leave.reviewedAt = new Date().toISOString();
    leave.remarks = remarks;

    // Automatically update staff attendance for dates to LEAVE
    const start = new Date(leave.startDate);
    const end = new Date(leave.endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];

      const existingIdx = this.records.findIndex(
        (r) => r.schoolId === schoolId && r.entityId === leave.employeeId && r.date === dateStr && r.entityType === 'STAFF'
      );

      if (existingIdx >= 0) {
        this.records[existingIdx].status = 'LEAVE';
        this.records[existingIdx].remarks = `Approved Staff Leave (${leave.leaveTypeName})`;
      } else {
        this.records.push({
          id: `att-stflve-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          schoolId,
          academicSessionId: 'sess-2026-2027',
          entityType: 'STAFF',
          entityId: leave.employeeId,
          entityName: leave.employeeName,
          department: leave.department,
          date: dateStr,
          status: 'LEAVE',
          remarks: `Approved Staff Leave (${leave.leaveTypeName})`,
          markedBy: approvedBy,
          markedByRole: 'PRINCIPAL',
          markedAt: new Date().toISOString(),
          isLocked: false,
          lockStatus: 'SUBMITTED',
          source: 'MANUAL'
        });
      }
    }

    this.logAudit({
      user: approvedBy,
      role: 'PRINCIPAL',
      action: 'APPROVE_STAFF_LEAVE',
      module: 'STAFF_LEAVE',
      details: `Approved staff leave for ${leave.employeeName} (${leave.startDate} to ${leave.endDate})`
    });

    return leave;
  }

  // --- BIOMETRIC / DEVICE ADAPTER INGEST ---
  public processDeviceAttendanceIngest(ingest: DeviceAttendanceIngest): AttendanceRecord {
    if (!ingest.schoolId || !ingest.entityId) {
      throw new Error('Invalid device payload: missing schoolId or entityId');
    }

    const dateStr = ingest.timestamp.split('T')[0];

    // Duplicate check for exact timestamp/device ingest
    const existing = this.records.find(
      (r) => r.schoolId === ingest.schoolId && r.entityId === ingest.entityId && r.date === dateStr
    );

    if (existing) {
      existing.status = 'PRESENT';
      existing.source = ingest.source;
      existing.remarks = `Device punch at ${ingest.timestamp} (${ingest.deviceId})`;
      return existing;
    }

    const record: AttendanceRecord = {
      id: `att-dev-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      schoolId: ingest.schoolId,
      academicSessionId: 'sess-2026-2027',
      entityType: 'STAFF',
      entityId: ingest.entityId,
      entityName: `Device User (${ingest.entityId})`,
      date: dateStr,
      status: 'PRESENT',
      markedBy: `DEVICE_${ingest.deviceId}`,
      markedByRole: 'SYSTEM',
      markedAt: ingest.timestamp,
      isLocked: false,
      lockStatus: 'SUBMITTED',
      source: ingest.source
    };

    this.records.push(record);

    this.logAudit({
      user: `DEVICE_${ingest.deviceId}`,
      role: 'SUPER_ADMIN',
      action: 'INGEST_DEVICE_ATTENDANCE',
      module: 'ATTENDANCE_DEVICE',
      details: `Ingested device punch from ${ingest.source} device ${ingest.deviceId} for ${ingest.entityId}`
    });

    return record;
  }

  // --- QUERIES & GETTERS ---
  public getAttendanceRecords(schoolId: string, className?: string, section?: string, date?: string): AttendanceRecord[] {
    return this.records.filter((r) => {
      if (r.schoolId !== schoolId) return false;
      if (className && r.className !== className) return false;
      if (section && r.section !== section) return false;
      if (date && r.date !== date) return false;
      return true;
    });
  }

  public getStudentLeaveRequests(schoolId: string, studentId?: string): StudentLeaveRequest[] {
    return this.studentLeaves.filter((l) => {
      if (l.schoolId !== schoolId) return false;
      if (studentId && l.studentId !== studentId) return false;
      return true;
    });
  }

  public getStaffLeaveRequests(schoolId: string, employeeId?: string): StaffLeaveRequest[] {
    return this.staffLeaves.filter((l) => {
      if (l.schoolId !== schoolId) return false;
      if (employeeId && l.employeeId !== employeeId) return false;
      return true;
    });
  }

  public getAttendanceCorrections(schoolId: string): AttendanceCorrection[] {
    return this.corrections.filter((c) => c.schoolId === schoolId);
  }

  public getAuditTrail(schoolId: string): AuditLog[] {
    return this.auditLogs;
  }

  // --- FOV-08: SESSION & ROLE GUARDED ATTENDANCE MONITORING ---
  public markStudentAttendanceSessionGuarded(
    schoolId: string,
    academicSessionId: string,
    className: string,
    section: string,
    date: string,
    entries: { studentId: string; studentName: string; status: AttendanceStatusCode; remarks?: string }[],
    session: UserSession
  ): AttendanceRecord[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    // Role check: Only Teachers assigned to this class, or School Admins/Principals can mark
    if (session.role === 'TEACHER') {
      if (session.assignedClass && session.assignedClass !== className) {
        throw new TenantSecurityException(
          `UNAUTHORIZED_CLASS: Teacher assigned to ${session.assignedClass} cannot mark attendance for ${className}.`,
          403
        );
      }
      if (session.assignedSection && session.assignedSection !== section) {
        throw new TenantSecurityException(
          `UNAUTHORIZED_SECTION: Teacher assigned to section ${session.assignedSection} cannot mark section ${section}.`,
          403
        );
      }
    } else if (!['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'].includes(session.role)) {
      throw new TenantSecurityException(
        `ROLE_DENIED: Role ${session.role} is not authorized to mark student attendance.`,
        403
      );
    }

    return this.markStudentAttendanceBatch(
      schoolId,
      academicSessionId,
      className,
      section,
      date,
      entries,
      session.email,
      session.role
    );
  }

  public getStudentAttendanceRecordsForParent(
    schoolId: string,
    studentId: string,
    session: UserSession
  ): AttendanceRecord[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    if (session.role === 'PARENT') {
      if (!session.childrenIds || !session.childrenIds.includes(studentId)) {
        throw new TenantSecurityException(
          `PARENT_ACCESS_DENIED: Parent can only view attendance for authorized children (${session.childrenIds?.join(', ')}). Attempted to access ${studentId}.`,
          403
        );
      }
    }

    return this.records.filter(
      (r) => r.schoolId === schoolId && r.entityId === studentId && r.entityType === 'STUDENT'
    );
  }

  public applyAdminAttendanceCorrection(
    schoolId: string,
    recordId: string,
    newStatus: AttendanceStatusCode,
    reason: string,
    session: UserSession
  ): AttendanceRecord {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    if (!['ADMIN', 'PRINCIPAL', 'SUPER_ADMIN'].includes(session.role)) {
      throw new TenantSecurityException('Only Principal or Admin can authorize attendance corrections.', 403);
    }

    const targetIdx = this.records.findIndex((r) => r.id === recordId && r.schoolId === schoolId);
    if (targetIdx === -1) {
      throw new Error(`ATTENDANCE_RECORD_NOT_FOUND: Record ${recordId} not found in school ${schoolId}`);
    }

    const oldStatus = this.records[targetIdx].status;
    this.records[targetIdx].status = newStatus;
    this.records[targetIdx].remarks = `Corrected by ${session.role}: ${reason}`;

    const correctionEntry: AttendanceCorrection = {
      id: `corr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      schoolId,
      attendanceRecordId: recordId,
      entityId: this.records[targetIdx].entityId,
      entityName: this.records[targetIdx].entityName,
      date: this.records[targetIdx].date,
      oldStatus,
      newStatus,
      reason,
      requestedBy: session.email,
      requestedAt: new Date().toISOString(),
      approvedBy: session.email,
      reviewedAt: new Date().toISOString(),
      status: 'APPROVED'
    };
    this.corrections.push(correctionEntry);

    this.logAudit({
      user: session.email,
      role: session.role,
      action: 'CORRECT_ATTENDANCE_RECORD',
      module: 'ATTENDANCE',
      details: `Corrected attendance for ${this.records[targetIdx].entityName} (${this.records[targetIdx].date}) from ${oldStatus} to ${newStatus}. Reason: ${reason}`
    });

    return this.records[targetIdx];
  }

  // --- PRIVATE HELPERS ---
  private logAudit(entry: Omit<AuditLog, 'id' | 'timestamp' | 'ipAddress'>) {
    const log: AuditLog = {
      ...entry,
      id: `audit-att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1'
    };
    this.auditLogs.push(log);
  }

  private emitEvent(evt: Omit<AttendanceEvent, 'eventId' | 'timestamp' | 'correlationId' | 'schemaVersion'>) {
    const event: AttendanceEvent = {
      ...evt,
      eventId: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      correlationId: `corr-${Date.now()}`
    };
    this.events.push(event);
  }
}
