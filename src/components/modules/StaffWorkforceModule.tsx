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
  RefreshCw,
  GraduationCap,
  Briefcase,
  Award,
  ShieldCheck,
  MessageSquare,
  Clock,
  Calendar,
  Check,
  X,
  AlertCircle,
  Sparkles
} from 'lucide-react';

export const StaffWorkforceModule: React.FC = () => {
  const { branding, currentRole, language, dispatchCredentialsNotification } = useSchool();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'TEACHERS' | 'MANAGEMENT' | 'ALL_STAFF' | 'LEAVE_APPROVALS'>('TEACHERS');
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [isLoading, setIsLoading] = useState(false);

  const [newStaffForm, setNewStaffForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: 'Academic',
    designation: 'Faculty Member',
    employmentType: 'FULL_TIME' as const,
    isTeacher: true,
    assignedClasses: 'Class VIII-A, Class X-B',
    assignedSubjects: 'Science & Physics',
    qualification: 'M.Sc., B.Ed',
    baseSalary: 45000
  });

  const [employees, setEmployees] = useState<EmployeeProfile[]>([
    // Teaching Faculty
    {
      id: 'stf-1',
      tenantId: 'sch-001',
      employeeId: 'FAC-2026-0101',
      fullName: 'Mrs. Sunita Mishra',
      email: 'sunita.mishra@abcpublicschool.edu.in',
      phone: '9833445566',
      department: 'Academic',
      designation: 'Senior Science Faculty & PGT',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      joiningDate: '2019-07-15',
      isTeacher: true,
      linkedUserId: 'usr-sunita'
    },
    {
      id: 'stf-2',
      tenantId: 'sch-001',
      employeeId: 'FAC-2026-0102',
      fullName: 'Mr. Vikram Singh',
      email: 'vikram.singh@abcpublicschool.edu.in',
      phone: '9811223344',
      department: 'Academic',
      designation: 'PGT Mathematics & HOD',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      joiningDate: '2018-04-10',
      isTeacher: true,
      linkedUserId: 'usr-vikram'
    },
    {
      id: 'stf-3',
      tenantId: 'sch-001',
      employeeId: 'FAC-2026-0103',
      fullName: 'Mrs. Anjali Roy',
      email: 'anjali.roy@abcpublicschool.edu.in',
      phone: '9822334455',
      department: 'Academic',
      designation: 'TGT English & Social Studies',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      joiningDate: '2021-06-01',
      isTeacher: true,
      linkedUserId: 'usr-anjali'
    },
    {
      id: 'stf-4',
      tenantId: 'sch-001',
      employeeId: 'FAC-2026-0104',
      fullName: 'Mr. Neeraj Gupta',
      email: 'neeraj.gupta@abcpublicschool.edu.in',
      phone: '9876543210',
      department: 'IT & Labs',
      designation: 'Computer Science & AI Robotics Faculty',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      joiningDate: '2022-01-15',
      isTeacher: true,
      linkedUserId: 'usr-neeraj'
    },
    // School Management & Administration
    {
      id: 'stf-5',
      tenantId: 'sch-001',
      employeeId: 'MGT-2026-0001',
      fullName: 'Dr. Ramesh Chandra Sharma',
      email: 'principal@abcpublicschool.edu.in',
      phone: '9876543218',
      department: 'Management',
      designation: 'Principal & Academic Director',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      joiningDate: '2015-04-01',
      isTeacher: false,
      linkedUserId: 'usr-principal'
    },
    {
      id: 'stf-6',
      tenantId: 'sch-001',
      employeeId: 'MGT-2026-0002',
      fullName: 'Mr. Alok Nath',
      email: 'alok.nath@abcpublicschool.edu.in',
      phone: '9844556677',
      department: 'Accounts',
      designation: 'Head Accountant & Bursar',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      joiningDate: '2020-03-01',
      isTeacher: false,
      linkedUserId: 'usr-alok'
    },
    {
      id: 'stf-7',
      tenantId: 'sch-001',
      employeeId: 'MGT-2026-0003',
      fullName: 'Mr. Rajesh Mohan',
      email: 'office@abcpublicschool.edu.in',
      phone: '9855667788',
      department: 'Administration',
      designation: 'Administrative Officer & Registrar',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      joiningDate: '2017-08-10',
      isTeacher: false,
      linkedUserId: 'usr-rajesh'
    },
    {
      id: 'stf-8',
      tenantId: 'sch-001',
      employeeId: 'MGT-2026-0004',
      fullName: 'Mr. Manoj Singh',
      email: 'driver.manoj@abcpublicschool.edu.in',
      phone: '9866778899',
      department: 'Transport',
      designation: 'Transport Manager & Fleet Incharge',
      employmentType: 'FULL_TIME',
      status: 'ACTIVE',
      joiningDate: '2019-11-20',
      isTeacher: false,
      linkedUserId: 'usr-manoj'
    }
  ]);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([
    {
      id: 'lev-1',
      tenantId: 'sch-001',
      staffId: 'stf-1',
      staffName: 'Mrs. Sunita Mishra',
      leaveType: 'CASUAL',
      startDate: '2026-10-24',
      endDate: '2026-10-25',
      reason: 'Family medical emergency',
      status: 'PENDING'
    }
  ]);

  const currentUserSession = {
    id: 'usr-admin',
    email: branding.email,
    tenantId: 'sch-001',
    role: currentRole,
    status: 'ACTIVE' as const
  };

  // Helper metadata maps
  const teacherExtraInfo: Record<string, { subjects: string; classes: string; salary: number; presentDays: number; totalDays: number }> = {
    'stf-1': { subjects: 'Physics & General Science', classes: 'Class VIII-A, Class X-B', salary: 45000, presentDays: 25, totalDays: 26 },
    'stf-2': { subjects: 'Advanced Mathematics', classes: 'Class IX-A, Class XI-A', salary: 48000, presentDays: 26, totalDays: 26 },
    'stf-3': { subjects: 'English Literature & History', classes: 'Class VI-A, Class VII-B', salary: 40000, presentDays: 24, totalDays: 26 },
    'stf-4': { subjects: 'Computer Coding & AI STEM', classes: 'Class VI to XII', salary: 52000, presentDays: 26, totalDays: 26 }
  };

  const managementExtraInfo: Record<string, { portfolio: string; roleCode: string; accessLevel: string; officeHours: string }> = {
    'stf-5': { portfolio: 'Academic Strategy, CBSE Governance & Staff Leadership', roleCode: 'PRINCIPAL', accessLevel: 'Full Executive Directorship', officeHours: '09:00 AM - 04:00 PM' },
    'stf-6': { portfolio: 'Fee Counter, Budget Reconciliation, Audit & Payroll', roleCode: 'ACCOUNTANT', accessLevel: 'Finance & Accounts Portal', officeHours: '08:30 AM - 03:30 PM' },
    'stf-7': { portfolio: 'Admissions Desk, Student SIS Verification & Records', roleCode: 'ADMIN', accessLevel: 'School Operations Portal', officeHours: '08:00 AM - 04:30 PM' },
    'stf-8': { portfolio: '12 GPS Tracked School Buses, Driver Roster & Safe Routes', roleCode: 'TRANSPORT', accessLevel: 'Fleet & GPS Control', officeHours: '06:30 AM - 05:00 PM' }
  };

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
      // Keep state if offline
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

    const email = newStaffForm.email || `${newStaffForm.fullName.toLowerCase().replace(/\s+/g, '.')}@abcpublicschool.edu.in`;
    const phone = newStaffForm.phone || '9876543210';
    const seq = String(employees.length + 1).padStart(4, '0');
    const employeeId = newStaffForm.isTeacher ? `FAC-2026-${seq}` : `MGT-2026-${seq}`;

    const newEmp: EmployeeProfile = {
      id: `stf-${Date.now()}`,
      tenantId: 'sch-001',
      employeeId,
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
      title: language === 'hi' ? 'स्टाफ जोड़ा गया' : 'Staff Onboarded',
      message: `${newEmp.fullName} (${newEmp.employeeId})`
    });

    // Automated dispatch of credentials notification
    dispatchCredentialsNotification({
      recipientType: 'STAFF',
      recipientName: newStaffForm.fullName,
      recipientEmail: email,
      recipientPhone: phone,
      schoolName: branding.name,
      schoolId: branding.id,
      role: newStaffForm.isTeacher ? 'TEACHER' : 'ADMIN',
      loginId: employeeId,
      username: email,
      password: 'Staff@2026'
    });

    setShowAddStaffModal(false);
    setNewStaffForm({
      fullName: '',
      email: '',
      phone: '',
      department: 'Academic',
      designation: 'Faculty Member',
      employmentType: 'FULL_TIME',
      isTeacher: true,
      assignedClasses: 'Class VIII-A, Class X-B',
      assignedSubjects: 'Science & Physics',
      qualification: 'M.Sc., B.Ed',
      baseSalary: 45000
    });
  };

  const handleLeaveDecision = async (requestId: string, decision: 'APPROVED' | 'REJECTED') => {
    const req = leaveRequests.find((r) => r.id === requestId);
    if (!req) return;

    try {
      await StaffWorkforceService.processLeaveDecisionApi(requestId, decision, `Processed by ${branding.email}`);
    } catch {}

    const updated = StaffWorkforceService.processLeaveApproval(currentUserSession, 'sch-001', req, decision);
    setLeaveRequests(leaveRequests.map((r) => (r.id === requestId ? updated : r)));
    addToast({
      type: decision === 'APPROVED' ? 'success' : 'error',
      title: decision === 'APPROVED' ? 'Leave Approved' : 'Leave Rejected',
      message: `${req.staffName} (${req.leaveType})`
    });
  };

  // Filter groups
  const teachersList = employees.filter((e) => e.isTeacher || e.department === 'Academic');
  const managementList = employees.filter((e) => !e.isTeacher && e.department !== 'Academic');

  const filteredList = employees.filter((emp) => {
    const matchesSearch =
      !searchQuery ||
      emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <Users className="w-4 h-4" /> Faculty & Management Workforce Hub
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Teacher Roster, Management Leadership & HR Desk
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            सभी शिक्षकों (विषय, आवंटित कक्षा, दैनिक हाजिरी, वेतन) एवं स्कूल मैनेजमेंट (प्रिंसिपल, एकाउंटेंट, एडमिन, ट्रांसपोर्ट) का संपूर्ण प्रबंधन।
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('TEACHERS')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'TEACHERS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            👨‍🏫 शिक्षक संकाय (Teachers - {teachersList.length})
          </button>
          <button
            onClick={() => setActiveTab('MANAGEMENT')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'MANAGEMENT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            🏛️ स्कूल मैनेजमेंट (Leadership - {managementList.length})
          </button>
          <button
            onClick={() => setActiveTab('ALL_STAFF')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'ALL_STAFF' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            📋 ऑल स्टाफ ({employees.length})
          </button>
          <button
            onClick={() => setActiveTab('LEAVE_APPROVALS')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'LEAVE_APPROVALS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            📝 अवकाश डेस्क ({leaveRequests.filter((r) => r.status === 'PENDING').length})
          </button>
        </div>
      </div>

      {/* Top 4 Workforce KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">कुल शिक्षक संकाय (Teachers)</p>
          <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400">{teachersList.length} Faculty Members</h3>
          <p className="text-[10px] text-slate-500">100% Qualified PGT/TGT</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">स्कूल मैनेजमेंट एवं प्रशासन</p>
          <h3 className="text-xl font-black text-slate-900 dark:text-white">{managementList.length} Officers</h3>
          <p className="text-[10px] text-indigo-500 font-semibold">Leadership & Operations</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">आज स्टाफ उपस्थिति (Attendance)</p>
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">96.8% On Duty</h3>
          <p className="text-[10px] text-slate-500">Biometric Verified</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-[10px] font-bold uppercase text-slate-400">मासिक पेरोल स्थिति (Payroll)</p>
          <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">₹8.45L Disbursed</h3>
          <p className="text-[10px] text-emerald-600 font-semibold">✓ 100% Disbursed (Oct 2026)</p>
        </div>
      </div>

      {/* Action and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="शिक्षक, अधिकारी, विषय या कोड से खोजें..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <button
          onClick={() => setShowAddStaffModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> नया शिक्षक / अधिकारी जोड़ें (Onboard Faculty)
        </button>
      </div>

      {/* TAB 1: TEACHING FACULTY VIEW */}
      {activeTab === 'TEACHERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {teachersList.map((teacher) => {
            const extra = teacherExtraInfo[teacher.id] || {
              subjects: 'Core Subject Faculty',
              classes: 'Class VIII & X',
              salary: 45000,
              presentDays: 25,
              totalDays: 26
            };

            return (
              <div
                key={teacher.id}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4 group"
              >
                {/* Header: Photo, Name, Code, Status */}
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black text-base border border-indigo-200 dark:border-indigo-800">
                      👩‍🏫
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                          {teacher.fullName}
                        </h3>
                        <span className="font-mono text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full">
                          {teacher.employeeId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{teacher.designation}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                    🟢 On Duty Today
                  </span>
                </div>

                {/* Assigned Classes & Subjects Box */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">अध्यापन विषय (Subjects):</span>
                    <b className="text-indigo-600 dark:text-indigo-400">{extra.subjects}</b>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">आवंटित कक्षाएं (Classes):</span>
                    <b className="text-slate-900 dark:text-white">{extra.classes}</b>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-semibold">मासिक उपस्थिति:</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {extra.presentDays} / {extra.totalDays} दिन ({( (extra.presentDays/extra.totalDays) * 100).toFixed(0)}%)
                    </span>
                  </div>
                </div>

                {/* Salary & Contact Strip */}
                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[10px] block">मासिक वेतन (Monthly Salary):</span>
                    <b className="font-mono text-emerald-600 text-sm">₹{extra.salary.toLocaleString()}</b>
                    <span className="text-[10px] text-slate-400 block">✓ Disbursed (Bank Transfer)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] block">संपर्क नंबर (Mobile):</span>
                    <b className="font-mono text-slate-900 dark:text-white text-xs">{teacher.phone}</b>
                    <span className="text-[10px] text-slate-400 block truncate">{teacher.email}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex justify-between items-center border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400">Joining: {teacher.joiningDate}</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/91${teacher.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 border border-emerald-200"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                    <a
                      href={`tel:${teacher.phone}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: SCHOOL MANAGEMENT & LEADERSHIP VIEW */}
      {activeTab === 'MANAGEMENT' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {managementList.map((mgt) => {
            const extra = managementExtraInfo[mgt.id] || {
              portfolio: 'Administrative & Academic Leadership',
              roleCode: 'ADMIN',
              accessLevel: 'Full Operations Control',
              officeHours: '09:00 AM - 04:30 PM'
            };

            return (
              <div
                key={mgt.id}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4 group"
              >
                {/* Header: Photo, Name, Code, Role */}
                <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-base border border-amber-200 dark:border-amber-800">
                      🏛️
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                          {mgt.fullName}
                        </h3>
                        <span className="font-mono text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2.5 py-0.5 rounded-full">
                          {mgt.employeeId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{mgt.designation}</p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 border border-indigo-200 dark:border-indigo-800 uppercase">
                    {extra.roleCode}
                  </span>
                </div>

                {/* Management Portfolio & Responsibilities */}
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold block text-[10px] uppercase">प्रमुख कार्यक्षेत्र (Key Portfolio):</span>
                    <b className="text-slate-900 dark:text-white mt-0.5 block">{extra.portfolio}</b>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-slate-400 font-semibold">एक्सेस लेवल:</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{extra.accessLevel}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-semibold">कार्यालय समय:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300">{extra.officeHours}</span>
                  </div>
                </div>

                {/* Official Contact & Direct Actions */}
                <div className="flex justify-between items-center text-xs pt-1">
                  <div>
                    <span className="text-slate-400 text-[10px] block">सीधा संपर्क:</span>
                    <b className="font-mono text-slate-900 dark:text-white">{mgt.phone}</b>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`https://wa.me/91${mgt.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold text-xs flex items-center gap-1 border border-emerald-200"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                    <a
                      href={`tel:${mgt.phone}`}
                      className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1"
                    >
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: ALL WORKFORCE COMBINED TABLE */}
      {activeTab === 'ALL_STAFF' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4">Staff Member</th>
                  <th className="p-4">Department & Role</th>
                  <th className="p-4">Designation</th>
                  <th className="p-4">Contact</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredList.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-950/40">
                    <td className="p-4">
                      <div>
                        <p className="font-extrabold text-slate-900 dark:text-white">{emp.fullName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">{emp.employeeId}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{emp.department}</span>
                      <span className="text-[10px] text-slate-400 block">{emp.isTeacher ? 'Teaching Faculty' : 'Management & Operations'}</span>
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300 font-medium">
                      {emp.designation}
                    </td>
                    <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                      {emp.phone}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 border border-emerald-200 dark:border-emerald-800">
                        {emp.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <a
                          href={`https://wa.me/91${emp.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`tel:${emp.phone}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: LEAVE APPROVALS DESK */}
      {activeTab === 'LEAVE_APPROVALS' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
            <h3 className="font-black text-base text-slate-900 dark:text-white">
              स्टाफ अवकाश अनुमोदन डेस्क (Staff Leave Applications)
            </h3>
            <p className="text-slate-500 text-xs">
              शिक्षकों व प्रबंधन कर्मचारियों द्वारा प्रस्तुत अवकाश आवेदन एवं 1-क्लिक अप्रूवल।
            </p>
          </div>

          <div className="space-y-3">
            {leaveRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">{req.staffName}</h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                      {req.leaveType} Leave
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    अवधि: <b className="font-mono text-slate-900 dark:text-white">{req.startDate}</b> से <b className="font-mono text-slate-900 dark:text-white">{req.endDate}</b>
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border mt-1">
                    "{req.reason}"
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {req.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleLeaveDecision(req.id, 'APPROVED')}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <Check className="w-3.5 h-3.5" /> स्वीकारें (Approve)
                      </button>
                      <button
                        onClick={() => handleLeaveDecision(req.id, 'REJECTED')}
                        className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-rose-600 hover:text-white text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors"
                      >
                        अस्वीकारें (Reject)
                      </button>
                    </>
                  ) : (
                    <span className="px-3 py-1.5 rounded-xl font-black text-xs bg-emerald-100 text-emerald-700">
                      ✓ {req.status}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Faculty / Staff Member Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddStaffSubmit}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 w-full max-w-lg rounded-3xl p-6 space-y-4 shadow-2xl text-xs max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center border-b pb-3">
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">नया शिक्षक / अधिकारी जोड़ें (Onboard Faculty)</h4>
              <button type="button" onClick={() => setShowAddStaffModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-slate-500 font-bold mb-1">पूरा नाम (Full Name) *</label>
              <input
                type="text"
                required
                placeholder="e.g. Dr. Rajesh Verma"
                value={newStaffForm.fullName}
                onChange={(e) => setNewStaffForm({ ...newStaffForm, fullName: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 font-bold mb-1">श्रेणी (Category) *</label>
                <select
                  value={newStaffForm.isTeacher ? 'TEACHER' : 'MANAGEMENT'}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, isTeacher: e.target.value === 'TEACHER', department: e.target.value === 'TEACHER' ? 'Academic' : 'Management' })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-bold"
                >
                  <option value="TEACHER">शिक्षक संकाय (Teacher)</option>
                  <option value="MANAGEMENT">स्कूल मैनेजमेंट (Leadership)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">विभाग (Department)</label>
                <select
                  value={newStaffForm.department}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, department: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="Academic">Academic (शिक्षण)</option>
                  <option value="Management">Management (प्रबंधन)</option>
                  <option value="Administration">Administration (प्रशासन)</option>
                  <option value="Accounts">Accounts (लेखा)</option>
                  <option value="Transport">Transport (वाहन)</option>
                  <option value="IT & Labs">IT & Robotics</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 font-bold mb-1">पदनाम (Designation) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior Maths Teacher / Bursar"
                  value={newStaffForm.designation}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, designation: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">मोबाइल नंबर *</label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={newStaffForm.phone}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-500 font-bold mb-1">मासिक वेतन (Monthly Salary ₹) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={newStaffForm.baseSalary}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, baseSalary: Number(e.target.value) || 0 })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-bold mb-1">योग्यता (Qualification)</label>
                <input
                  type="text"
                  placeholder="e.g. M.Sc. Physics, B.Ed"
                  value={newStaffForm.qualification}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, qualification: e.target.value })}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {newStaffForm.isTeacher && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 font-bold mb-1">आवंटित कक्षाएं</label>
                  <input
                    type="text"
                    placeholder="e.g. Class VIII-A, Class X"
                    value={newStaffForm.assignedClasses}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, assignedClasses: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-bold mb-1">विषय</label>
                  <input
                    type="text"
                    placeholder="e.g. Science, Physics"
                    value={newStaffForm.assignedSubjects}
                    onChange={(e) => setNewStaffForm({ ...newStaffForm, assignedSubjects: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-lg transition-all"
            >
              स्टाफ रोस्टर में जोड़ें (Save to Workforce Roster)
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
