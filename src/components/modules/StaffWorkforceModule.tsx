import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { StaffWorkforceService, EmployeeProfile, LeaveRequest } from '../../services/StaffWorkforceService';
import { useToast } from '../../design-system/components/Toast';
import {
  Users,
  Plus,
  CheckCircle2,
  XCircle,
  Phone,
  Mail,
  Search,
  RefreshCw
} from 'lucide-react';

export const StaffWorkforceModule: React.FC = () => {
  const { branding, currentRole, language, dispatchCredentialsNotification } = useSchool();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'STAFF_DIRECTORY' | 'DEPARTMENTS' | 'LEAVE_APPROVALS'>('STAFF_DIRECTORY');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const [newStaffForm, setNewStaffForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: 'Academic',
    designation: 'Senior Faculty',
    employmentType: 'FULL_TIME' as const,
    isTeacher: true
  });

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

  // Load staff and leaves from backend API
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, leavesRes] = await Promise.all([
        StaffWorkforceService.fetchStaffRoster({
          department: selectedDepartment !== 'ALL' ? selectedDepartment : undefined,
          search: searchQuery || undefined
        }),
        StaffWorkforceService.fetchLeavesApi()
      ]);

      if (staffRes.success && staffRes.data && staffRes.data.length > 0) {
        setEmployees(staffRes.data);
      }
      if (leavesRes.success && leavesRes.data && leavesRes.data.length > 0) {
        setLeaveRequests(leavesRes.data);
      }
    } catch {
      // Keep existing demo items if offline
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDepartment]);

  const handleAddStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.fullName.trim()) return;

    const email = newStaffForm.email || `${newStaffForm.fullName.toLowerCase().replace(/\s+/g, '.')}@${branding.name.toLowerCase().replace(/\s+/g, '')}.edu.in`;
    const phone = newStaffForm.phone || '+91 9876543210';

    try {
      // Try backend persistence
      const res = await StaffWorkforceService.createStaffMember({
        fullName: newStaffForm.fullName,
        email,
        phone,
        department: newStaffForm.department,
        designation: newStaffForm.designation,
        employmentType: newStaffForm.employmentType,
        isTeacher: newStaffForm.isTeacher,
        createLoginAccount: true
      });

      if (res?.ok && res?.data?.data) {
        const created = res.data.data;
        setEmployees([created, ...employees]);
        addToast({
          type: 'success',
          title: language === 'hi' ? 'स्टाफ जोड़ा गया' : 'Staff Onboarded',
          message: `${created.fullName} (${created.employeeId})`
        });
      } else {
        // Fallback local creation
        const seq = String(employees.length + 1).padStart(4, '0');
        const newEmp: EmployeeProfile = {
          id: `stf-${Date.now()}`,
          tenantId: 'sch-001',
          employeeId: `EMP-2026-${seq}`,
          fullName: newStaffForm.fullName,
          email,
          phone,
          department: newStaffForm.department,
          designation: newStaffForm.designation,
          employmentType: newStaffForm.employmentType,
          status: 'ACTIVE',
          joiningDate: new Date().toISOString().split('T')[0],
          isTeacher: newStaffForm.isTeacher,
          linkedUserId: `usr-${Date.now()}`
        };
        setEmployees([newEmp, ...employees]);
        addToast({
          type: 'success',
          title: language === 'hi' ? 'स्टाफ जोड़ा गया (Local)' : 'Staff Added Locally',
          message: newEmp.fullName
        });
      }
    } catch {
      // Fallback local creation on error
      const seq = String(employees.length + 1).padStart(4, '0');
      const newEmp: EmployeeProfile = {
        id: `stf-${Date.now()}`,
        tenantId: 'sch-001',
        employeeId: `EMP-2026-${seq}`,
        fullName: newStaffForm.fullName,
        email,
        phone,
        department: newStaffForm.department,
        designation: newStaffForm.designation,
        employmentType: newStaffForm.employmentType,
        status: 'ACTIVE',
        joiningDate: new Date().toISOString().split('T')[0],
        isTeacher: newStaffForm.isTeacher,
        linkedUserId: `usr-${Date.now()}`
      };
      setEmployees([newEmp, ...employees]);
      addToast({
        type: 'success',
        title: language === 'hi' ? 'स्टाफ जोड़ा गया' : 'Staff Added',
        message: newEmp.fullName
      });
    }

    // Automated dispatch of credentials notification
    dispatchCredentialsNotification({
      recipientType: 'STAFF',
      recipientName: newStaffForm.fullName,
      recipientEmail: email,
      recipientPhone: phone,
      schoolName: branding.name,
      schoolId: branding.id,
      role: 'STAFF',
      loginId: `EMP-2026-${String(employees.length + 1).padStart(4, '0')}`,
      username: email,
      password: 'Staff@2026'
    });

    setShowAddStaffModal(false);
    setNewStaffForm({
      fullName: '',
      email: '',
      phone: '',
      department: 'Academic',
      designation: 'Senior Faculty',
      employmentType: 'FULL_TIME',
      isTeacher: true
    });
  };

  const handleDisableAccess = async (staffId: string) => {
    const emp = employees.find((e) => e.id === staffId);
    if (!emp) return;

    try {
      await StaffWorkforceService.updateStaffStatusApi(staffId, 'INACTIVE', 'Access disabled from Staff Portal');
    } catch {
      // Ignore API error in offline mode
    }

    const updated = StaffWorkforceService.disableUserAccess(currentUserSession, 'sch-001', emp);
    setEmployees(employees.map((e) => (e.id === staffId ? updated : e)));
    addToast({
      type: 'warning',
      title: language === 'hi' ? 'एक्सेस अक्षम किया गया' : 'Login Access Disabled',
      message: `${emp.fullName} login revoked. HR data preserved.`
    });
  };

  const handleLeaveDecision = async (requestId: string, decision: 'APPROVED' | 'REJECTED') => {
    const req = leaveRequests.find((r) => r.id === requestId);
    if (!req) return;

    try {
      await StaffWorkforceService.processLeaveDecisionApi(requestId, decision, `Processed by ${branding.email}`);
    } catch {
      // Ignore API error in offline mode
    }

    const updated = StaffWorkforceService.processLeaveApproval(currentUserSession, 'sch-001', req, decision);
    setLeaveRequests(leaveRequests.map((r) => (r.id === requestId ? updated : r)));
    addToast({
      type: decision === 'APPROVED' ? 'success' : 'error',
      title: decision === 'APPROVED' ? 'Leave Approved' : 'Leave Rejected',
      message: `${req.staffName} (${req.leaveType})`
    });
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesDept = selectedDepartment === 'ALL' || emp.department === selectedDepartment;
    const matchesSearch = !searchQuery || (
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchesDept && matchesSearch;
  });

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                {language === 'hi' ? 'शिक्षक एवं प्रशासनिक स्टाफ सूची' : 'Faculty & Administrative Staff Roster'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {language === 'hi' ? 'सभी शिक्षकों व कर्मचारियों का आधिकारिक विवरण' : 'Official HR roster with auto employee ID sequencing'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                disabled={isLoading}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                title="Refresh from server"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
              <button
                onClick={() => setShowAddStaffModal(true)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 flex items-center gap-2 self-start sm:self-auto transition-all"
              >
                <Plus className="w-4 h-4" />
                {language === 'hi' ? '+ नया शिक्षक / स्टाफ जोड़ें' : '+ Add Faculty / Staff'}
              </button>
            </div>
          </div>

          {/* Search & Department Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff by name, email, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
              {['ALL', 'Academic', 'Administration', 'Accounts', 'Transport', 'IT & Labs'].map((dept) => (
                <button
                  key={dept}
                  onClick={() => setSelectedDepartment(dept)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    selectedDepartment === dept
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {dept === 'ALL' ? 'All Departments' : dept}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredEmployees.map((emp) => (
              <div key={emp.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                <div className="flex justify-between items-start border-b pb-3 border-slate-100 dark:border-slate-800">
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

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
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
          <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-3 border-slate-100 dark:border-slate-800">School Department Hierarchy</h3>
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
          <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-3 border-slate-100 dark:border-slate-800">Staff Leave Requests & Approval Desk</h3>

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

      {/* Add Staff / Faculty Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {language === 'hi' ? 'नया शिक्षक / फैकल्टी जोड़ें' : 'Add New Faculty & Staff'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'hi' ? 'आधिकारिक स्कूल प्रबंधन व फैकल्टी रिकॉर्ड' : 'Create HR profile with auto employee code'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddStaffModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStaffSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  {language === 'hi' ? 'पूरा नाम *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Priya Verma / Shri Anand Kumar"
                  value={newStaffForm.fullName}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, fullName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    {language === 'hi' ? 'पद (Designation) *' : 'Designation *'}
                  </label>
                  <select
                    value={newStaffForm.designation}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, designation: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="Vice Principal">Vice Principal</option>
                    <option value="PGT Mathematics">PGT Mathematics</option>
                    <option value="PGT Physics">PGT Physics</option>
                    <option value="PGT Chemistry">PGT Chemistry</option>
                    <option value="TGT Science">TGT Science</option>
                    <option value="TGT English">TGT English</option>
                    <option value="TGT Hindi">TGT Hindi</option>
                    <option value="TGT Social Science">TGT Social Science</option>
                    <option value="Head Accountant">Head Accountant</option>
                    <option value="Senior Faculty">Senior Faculty</option>
                    <option value="Physical Education Teacher">Physical Education (P.E.)</option>
                    <option value="Librarian">Librarian</option>
                    <option value="Transport Incharge">Transport Incharge</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    {language === 'hi' ? 'विभाग (Department) *' : 'Department *'}
                  </label>
                  <select
                    value={newStaffForm.department}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, department: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="Academic">Academic (शिक्षण)</option>
                    <option value="Administration">Administration (प्रशासन)</option>
                    <option value="Accounts">Accounts (लेखाकार)</option>
                    <option value="Transport">Transport (परिवहन)</option>
                    <option value="Examination">Examination (परीक्षा)</option>
                    <option value="IT & Labs">IT & Labs (कंप्यूटर)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    {language === 'hi' ? 'मोबाइल नंबर *' : 'Phone / Mobile *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9876543210"
                    value={newStaffForm.phone}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    {language === 'hi' ? 'आधिकारिक ईमेल' : 'Email Address'}
                  </label>
                  <input
                    type="email"
                    placeholder="priya.verma@school.edu.in"
                    value={newStaffForm.email}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newStaffForm.isTeacher}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, isTeacher: e.target.checked })}
                    className="rounded text-indigo-600 w-4 h-4"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {language === 'hi' ? 'क्या यह कक्षा शिक्षक / विषय फैकल्टी हैं? (Class/Subject Teacher)' : 'Teaching Faculty with Class Access'}
                  </span>
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStaffModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {language === 'hi' ? 'स्टाफ प्रोफाइल सुरक्षित करें' : 'Save Staff Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
