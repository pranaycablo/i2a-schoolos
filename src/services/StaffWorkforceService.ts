import { TenantSecurityService, type UserSession, TenantSecurityException } from './TenantSecurityService';
import { staffApi } from './apiClient';

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
  primaryBranchId?: string;
  allowedBranchIds?: string[];
  biometricId?: string;
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
  tenantId?: string;
  schoolId?: string;
  staffId: string;
  staffName: string;
  leaveType: 'CASUAL' | 'SICK' | 'EARNED' | 'MATERNITY' | 'PATERNITY' | 'UNPAID';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
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

  /**
   * Fetch staff roster from backend REST API
   */
  public static async fetchStaffRoster(params?: {
    branchId?: string;
    department?: string;
    designation?: string;
    status?: string;
    isTeacher?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ success: boolean; data: EmployeeProfile[] }> {
    try {
      const res = await staffApi.listStaff(params);
      if (res.ok && res.data?.data) {
        return { success: true, data: res.data.data };
      }
      return { success: false, data: [] };
    } catch {
      return { success: false, data: [] };
    }
  }

  /**
   * Create staff member via backend REST API
   */
  public static async createStaffMember(data: any): Promise<any> {
    return await staffApi.createStaff(data);
  }

  /**
   * Update staff status via backend REST API
   */
  public static async updateStaffStatusApi(staffId: string, status: string, reason?: string): Promise<any> {
    return await staffApi.updateStatus(staffId, status, reason);
  }

  /**
   * Fetch leave requests via backend REST API
   */
  public static async fetchLeavesApi(params?: { staffId?: string; status?: string; branchId?: string }): Promise<{ success: boolean; data: LeaveRequest[] }> {
    try {
      const res = await staffApi.listLeaves(params);
      if (res.ok && res.data?.data) {
        return { success: true, data: res.data.data };
      }
      return { success: false, data: [] };
    } catch {
      return { success: false, data: [] };
    }
  }

  /**
   * Process leave decision via backend REST API
   */
  public static async processLeaveDecisionApi(leaveId: string, decision: 'APPROVED' | 'REJECTED', comments?: string): Promise<any> {
    return await staffApi.processLeaveDecision(leaveId, decision, comments);
  }
}
