import { describe, it, expect } from 'vitest';
import { StaffWorkforceService, EmployeeProfile, LeaveRequest } from '../services/StaffWorkforceService';
import { UserSession, TenantSecurityException } from '../services/TenantSecurityService';

describe('i2A SchoolOS Staff & HR Workforce Management Test Suite', () => {
  const hrUser: UserSession = {
    id: 'user-hr',
    email: 'hr@abc.edu.in',
    tenantId: 'sch-001',
    role: 'PRINCIPAL',
    status: 'ACTIVE'
  };

  const teacherUserSession: UserSession = {
    id: 'user-teacher-1',
    email: 'teacher@abc.edu.in',
    tenantId: 'sch-001',
    role: 'TEACHER',
    status: 'ACTIVE'
  };

  const activeEmployee: EmployeeProfile = {
    id: 'stf-1',
    tenantId: 'sch-001',
    employeeId: 'EMP-2026-0001',
    fullName: 'Mrs. Sunita Mishra',
    email: 'sunita.mishra@abc.edu.in',
    phone: '9833445566',
    department: 'Academic',
    designation: 'Senior Science Faculty',
    employmentType: 'FULL_TIME',
    status: 'ACTIVE',
    joiningDate: '2019-07-15',
    isTeacher: true,
    linkedUserId: 'usr-sunita'
  };

  const pendingLeave: LeaveRequest = {
    id: 'lev-1',
    tenantId: 'sch-001',
    staffId: 'stf-1',
    staffName: 'Mrs. Sunita Mishra',
    leaveType: 'CASUAL',
    startDate: '2026-10-12',
    endDate: '2026-10-13',
    reason: 'Family medical emergency',
    status: 'PENDING'
  };

  it('1. Employee ID Pattern Generator: Formats employee code per tenant configuration', () => {
    const pattern = 'EMP-{YEAR}-{SEQ}';
    const empId = StaffWorkforceService.generateEmployeeId(pattern, 1, '2026');
    expect(empId).toBe('EMP-2026-0001');
  });

  it('2. User Account Disablement: Disables login without destroying historical employee HR record', () => {
    const updated = StaffWorkforceService.disableUserAccess(hrUser, 'sch-001', activeEmployee);

    expect(updated.status).toBe('INACTIVE');
    expect(updated.linkedUserId).toBeUndefined();
    expect(updated.fullName).toBe('Mrs. Sunita Mishra'); // Historical HR data intact
  });

  it('3. Reusable Approval Engine: HR user approves leave request successfully', () => {
    const result = StaffWorkforceService.processLeaveApproval(hrUser, 'sch-001', pendingLeave, 'APPROVED');

    expect(result.status).toBe('APPROVED');
    expect(result.approverId).toBe('user-hr');
  });

  it('4. Approval Security Authorization: Teacher role attempting leave approval is DENIED', () => {
    expect(() => {
      StaffWorkforceService.processLeaveApproval(teacherUserSession, 'sch-001', pendingLeave, 'APPROVED');
    }).toThrowError('DENIED: Unauthorized user attempted leave approval decision.');
  });
});
