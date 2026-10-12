import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { StaffWorkforceService, EmployeeProfile, LeaveRequest } from '../../services/StaffWorkforceService';
import {
  Users,
  BadgePercent,
  Plus,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Building2,
  Calendar,
  FileCheck,
  Lock,
  UserX,
  Sparkles,
  Phone,
  Mail
} from 'lucide-react';

export const StaffWorkforceModule: React.FC = () => {
  const { branding, currentRole } = useSchool();

  const [activeTab, setActiveTab] = useState<'STAFF_DIRECTORY' | 'DEPARTMENTS' | 'LEAVE_APPROVALS'>('STAFF_DIRECTORY');
  const [empPattern, setEmpPattern] = useState('EMP-{YEAR}-{SEQ}');

  const [employees, setEmployees] = useState<EmployeeProfile[]>([
    { id: 'stf-1', tenantId: 'sch-001', employeeId: 'EMP-2026-0001', fullName: 'Mrs. Sunita Mishra', email: 'sunita.mishra@abc.edu.in', phone: '9833445566', department: 'Academic', designation: 'Senior Science Faculty', employmentType: 'FULL_TIME', status: 'ACTIVE', joiningDate: '2019-07-15', isTeacher: true, linkedUserId: 'usr-sunita' },
    { id: 'stf-2', tenantId: 'sch-001', employeeId: 'EMP-2026-0002', fullName: 'Mr. Alok Nath', email: 'alok.nath@abc.edu.in', phone: '9844556677', department: 'Accounts', designation: 'Head Accountant', employmentType: 'FULL_TIME', status: 'ACTIVE', joiningDate: '2020-03-01', isTeacher: false, linkedUserId: 'usr-alok' }
  ]);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    { id: 'lev-1', tenantId: 'sch-001', staffId: 'stf-1', staffName: 'Mrs. Sunita Mishra', leaveType: 'CASUAL', startDate: '2026-10-12', endDate: '2026-10-13', reason: 'Family medical emergency', status: 'PENDING' }
  ]);

  const currentUserSession = {
    id: 'usr-admin',
    email: branding.email,
    tenantId: 'sch-001',
    role: currentRole,
    status: 'ACTIVE' as const
  };

  const handleDisableAccess = (staffId: string) => {
    const emp = employees.find((e) => e.id === staffId);
    if (!emp) return;
    const updated = StaffWorkforceService.disableUserAccess(currentUserSession, 'sch-001', emp);
    setEmployees(employees.map((e) => (e.id === staffId ? updated : e)));
  };

  const handleLeaveDecision = (requestId: string, decision: 'APPROVED' | 'REJECTED') => {
    const req = leaveRequests.find((r) => r.id === requestId);
    if (!req) return;
    const updated = StaffWorkforceService.processLeaveApproval(currentUserSession, 'sch-001', req, decision);
    setLeaveRequests(leaveRequests.map((r) => (r.id === requestId ? updated : r)));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" /> Workforce & HR Management
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Staff Directory, Department Hierarchy & Leave Approvals
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Architectural distinction between HR Employee Record and Login User Account with server-side document privacy.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('STAFF_DIRECTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'STAFF_DIRECTORY' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Staff Directory ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('DEPARTMENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'DEPARTMENTS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Departments
          </button>
          <button
            onClick={() => setActiveTab('LEAVE_APPROVALS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'LEAVE_APPROVALS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Leave Desk ({leaveRequests.filter((r) => r.status === 'PENDING').length})
          </button>
        </div>
      </div>

      {activeTab === 'STAFF_DIRECTORY' && (
        <div className="space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {employees.map((emp) => (
              <div key={emp.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b pb-3">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full">
                      {emp.employeeId}
                    </span>
                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">{emp.fullName}</h3>
                    <p className="text-[11px] text-slate-500">{emp.designation} • {emp.department}</p>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    emp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {emp.status}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                  <p><Phone className="w-3 h-3 inline mr-1 text-slate-400" /> Phone: <b>{emp.phone}</b></p>
                  <p><Mail className="w-3 h-3 inline mr-1 text-slate-400" /> Email: <b>{emp.email}</b></p>
                  <p>Joining Date: <b>{emp.joiningDate}</b> • Type: <b>{emp.employmentType}</b></p>
                </div>

                <div className="pt-3 border-t flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-semibold">
                    User Login: {emp.linkedUserId ? '✅ Linked' : '❌ No Login Account'}
                  </span>
                  {emp.linkedUserId && emp.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleDisableAccess(emp.id)}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] shadow"
                    >
                      Disable User Access
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'DEPARTMENTS' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-3">School Department Hierarchy</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Academic', 'Administration', 'Accounts', 'HR', 'Examination', 'Library', 'Transport', 'IT & Labs'].map((dept, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center font-bold text-slate-900 dark:text-white">
                {dept}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'LEAVE_APPROVALS' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-3">Staff Leave Requests & Approval Desk</h3>

          <div className="space-y-3">
            {leaveRequests.map((req) => (
              <div key={req.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{req.staffName}</h4>
                  <p className="text-[10px] text-slate-500">
                    Type: <b>{req.leaveType}</b> ({req.startDate} to {req.endDate}) • Reason: "{req.reason}"
                  </p>
                </div>

                {req.status === 'PENDING' ? (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleLeaveDecision(req.id, 'APPROVED')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleLeaveDecision(req.id, 'REJECTED')}
                      className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow"
                    >
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                    req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {req.status}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
