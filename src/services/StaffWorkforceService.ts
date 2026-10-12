import { TenantSecurityService, type UserSession, TenantSecurityException } from './TenantSecurityService';

export interface EmployeeProfile {
  id: string;
  tenantId: string;
  employeeId: string; // Configurable pattern e.g. EMP-2026-001
  fullName: string;
  email: string;
  phone: string;
  department: string;
  designation: string;
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'TEMPORARY';
  status: 'INVITED' | 'ACTIVE' | 'ON_LEAVE' | 'NOTICE_PERIOD' | 'RESIGNED' | 'TERMINATED' | 'INACTIVE';
  joiningDate: string;
  reportingManagerId?: string;
  linkedUserId?: string; // Optional user login link
  isTeacher: boolean;
}

export interface TeacherProfileExtension {
  id: string;
  staffId: string;
  tenantId: string;
  specializations: string[];
  qualifications: string[];
  assignedSubjects: string[];
}

export interface LeaveRequest {
  id: string;
  tenantId: string;
  staffId: string;
  staffName: string;
  leaveType: 'CASUAL' | 'SICK' | 'EARNED' | 'UNPAID';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  approverId?: string;
  approverComments?: string;
}

export class StaffWorkforceService {
  /**
   * Generates custom formatted Employee ID.
   * e.g. "EMP-2026-0001", "TCH-2026-0001"
   */
  public static generateEmployeeId(pattern: string, sequence: number, year: string = '2026'): string {
    const paddedSeq = String(sequence).padStart(4, '0');
    return pattern
      .replace('{YEAR}', year)
      .replace('{SEQ}', paddedSeq);
  }

  /**
   * Account Disablement Action: Disables user login without deleting historical employee HR data.
   */
  public static disableUserAccess(
    user: UserSession,
    tenantId: string,
    employee: EmployeeProfile
  ): EmployeeProfile {
    TenantSecurityService.validateTenantAccess(user, tenantId);

    return {
      ...employee,
      status: 'INACTIVE',
      linkedUserId: undefined
    };
  }

  /**
   * Reusable Approval Engine: Processes leave decisions with forensic audit tracking.
   */
  public static processLeaveApproval(
    approver: UserSession,
    tenantId: string,
    request: LeaveRequest,
    decision: 'APPROVED' | 'REJECTED',
    comments?: string
  ): LeaveRequest {
    TenantSecurityService.validateTenantAccess(approver, tenantId);

    // HR, Principal, or School Owner can approve
    if (!['SUPER_ADMIN', 'PRINCIPAL', 'HR', 'SCHOOL_OWNER'].includes(approver.role)) {
      throw new TenantSecurityException('DENIED: Unauthorized user attempted leave approval decision.', 403);
    }

    return {
      ...request,
      status: decision,
      approverId: approver.id,
      approverComments: comments || `Decision ${decision} by ${approver.email}`
    };
  }
}
