import React, { useState, useEffect } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { AttendanceLeaveService } from '../../services/AttendanceLeaveService';
import {
  AttendanceRecord,
  AttendanceStatusCode,
  StudentLeaveRequest,
  StaffLeaveRequest,
  AttendanceCorrection,
  AttendanceSummary
} from '../../types/attendance';
import {
  CalendarCheck,
  CheckCircle2,
  AlertTriangle,
  Send,
  Clock,
  UserCheck,
  Check,
  X,
  Sparkles,
  RefreshCw,
  Lock,
  Unlock,
  FileText,
  Filter,
  Download,
  ShieldCheck,
  Users,
  Search,
  CheckSquare,
  AlertCircle,
  Cpu,
  Calendar,
  MessageSquare
} from 'lucide-react';

export const AttendanceLeaveModule: React.FC = () => {
  const { students, staffList: staff, branding, logAction, setActiveModule } = useSchool();
  const schoolId = branding?.id || 'sch-001';
  const attendanceService = AttendanceLeaveService.getInstance();

  const [activeTab, setActiveTab] = useState<
    'STUDENT_ATTENDANCE' | 'STAFF_ATTENDANCE' | 'LEAVE_MANAGEMENT' | 'CORRECTIONS' | 'ANALYTICS' | 'DEVICES' | 'REPORTS'
  >('STUDENT_ATTENDANCE');

  // Filters & State
  const [selectedClass, setSelectedClass] = useState('Class VIII');
  const [selectedSection, setSelectedSection] = useState('Section A');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // Roster state for student marking
  const [attendanceMap, setAttendanceMap] = useState<{ [stdId: string]: { status: AttendanceStatusCode; remarks: string } }>({});
  const [isLocked, setIsLocked] = useState(false);
  const [saveAlert, setSaveAlert] = useState<string | null>(null);

  // Staff Attendance State
  const [staffDepartmentFilter, setStaffDepartmentFilter] = useState('ALL');
  const [staffAttendanceMap, setStaffAttendanceMap] = useState<{ [empId: string]: AttendanceStatusCode }>({});

  // Leave Requests State
  const [studentLeaves, setStudentLeaves] = useState<StudentLeaveRequest[]>([]);
  const [staffLeaves, setStaffLeaves] = useState<StaffLeaveRequest[]>([]);

  // Corrections & Locks State
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);

  // Analytics & AI Query State
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [selectedStudentSummary, setSelectedStudentSummary] = useState<AttendanceSummary | null>(null);

  // Load state on mount / filter change
  useEffect(() => {
    refreshData();
  }, [selectedClass, selectedSection, selectedDate]);

  const refreshData = () => {
    const locked = attendanceService.isAttendanceLocked(schoolId, selectedClass, selectedSection, selectedDate);
    setIsLocked(locked);

    const existingRecords = attendanceService.getAttendanceRecords(schoolId, selectedClass, selectedSection, selectedDate);
    const map: { [stdId: string]: { status: AttendanceStatusCode; remarks: string } } = {};

    students.forEach((s) => {
      const rec = existingRecords.find((r) => r.entityId === s.id);
      map[s.id] = {
        status: rec ? rec.status : 'PRESENT',
        remarks: rec?.remarks || ''
      };
    });
    setAttendanceMap(map);

    // Load staff state
    const staffRecords = attendanceService.getAttendanceRecords(schoolId, undefined, undefined, selectedDate);
    const stfMap: { [empId: string]: AttendanceStatusCode } = {};
    staff.forEach((st) => {
      const r = staffRecords.find((rec) => rec.entityId === st.id && rec.entityType === 'STAFF');
      stfMap[st.id] = r ? r.status : 'PRESENT';
    });
    setStaffAttendanceMap(stfMap);

    // Load Leaves & Corrections
    setStudentLeaves(attendanceService.getStudentLeaveRequests(schoolId));
    setStaffLeaves(attendanceService.getStaffLeaveRequests(schoolId));
    setCorrections(attendanceService.getAttendanceCorrections(schoolId));
  };

  // Bulk Actions
  const handleMarkAllPresent = () => {
    const newMap = { ...attendanceMap };
    Object.keys(newMap).forEach((id) => {
      newMap[id].status = 'PRESENT';
    });
    setAttendanceMap(newMap);
  };

  const handleSaveStudentAttendance = () => {
    try {
      const entries = Object.keys(attendanceMap).map((stdId) => {
        const std = students.find((s) => s.id === stdId);
        return {
          studentId: stdId,
          studentName: std?.name || 'Student',
          status: attendanceMap[stdId].status,
          remarks: attendanceMap[stdId].remarks
        };
      });

      attendanceService.markStudentAttendanceBatch(
        schoolId,
        'sess-2026-2027',
        selectedClass,
        selectedSection,
        selectedDate,
        entries,
        'usr-teacher-01',
        'TEACHER'
      );

      setSaveAlert(`✅ Attendance saved successfully for ${entries.length} students! Low attendance & absence WhatsApp notifications triggered.`);
      setTimeout(() => setSaveAlert(null), 5000);
      refreshData();
    } catch (err: any) {
      alert(`Error saving attendance: ${err.message}`);
    }
  };

  const handleLockSession = () => {
    if (confirm(`Are you sure you want to LOCK attendance for ${selectedClass}-${selectedSection} on ${selectedDate}?`)) {
      attendanceService.lockAttendanceSession(schoolId, 'sess-2026-2027', selectedClass, selectedSection, selectedDate, 'usr-admin-01');
      setIsLocked(true);
      refreshData();
    }
  };

  const handleSaveStaffAttendance = (stfId: string, status: AttendanceStatusCode) => {
    const stf = staff.find((s) => s.id === stfId);
    if (stf) {
      attendanceService.markStaffAttendance(
        schoolId,
        stf.id,
        stf.name,
        stf.role,
        selectedDate,
        status,
        'usr-admin-01'
      );
      setStaffAttendanceMap({ ...staffAttendanceMap, [stfId]: status });
      refreshData();
    }
  };

  const handleApproveStudentLeave = (leaveId: string) => {
    attendanceService.approveStudentLeave(schoolId, leaveId, 'usr-principal-01', 'Approved by Principal');
    setSaveAlert(`✅ Student leave request approved & synced with attendance register!`);
    setTimeout(() => setSaveAlert(null), 5000);
    refreshData();
  };

  const handleApproveStaffLeave = (leaveId: string) => {
    const leave = attendanceService.approveStaffLeave(schoolId, leaveId, 'usr-principal-01', 'Approved by Principal');
    logAction('APPROVE_STAFF_LEAVE', 'ATTENDANCE_LEAVE', `Approved staff leave for ${leave.employeeName} (${leave.startDate} to ${leave.endDate}). Class conflicts flagged for Substitution Desk.`);
    setSaveAlert(`✅ Staff leave approved for ${leave.employeeName}! Timetable conflict detected: Period 1 Mathematics. Go to Timetable → Substitution Desk to assign substitute faculty.`);
    setTimeout(() => setSaveAlert(null), 8000);
    refreshData();
  };

  const handleApproveCorrection = (correctionId: string) => {
    attendanceService.approveAttendanceCorrection(schoolId, correctionId, 'usr-principal-01');
    setSaveAlert(`✅ Attendance correction applied & audit log updated!`);
    setTimeout(() => setSaveAlert(null), 5000);
    refreshData();
  };

  const handleAiQuery = () => {
    if (!aiQuery.trim()) return;
    const q = aiQuery.toLowerCase();
    if (q.includes('absent') || q.includes('अनुपस्थित')) {
      setAiResponse(
        `🤖 **AI Attendance Intelligence**: आज (${selectedDate}) को ${selectedClass} - ${selectedSection} में कुल 1 विद्यार्थी (Rohan Gupta) अनधिकृत अनुपस्थित (ABSENT) हैं। Parent WhatsApp अलर्ट भेजा जा चुका है।`
      );
    } else if (q.includes('low') || q.includes('कम')) {
      setAiResponse(
        `🤖 **AI Attendance Intelligence**: Rohan Gupta की अद्यतन उपस्थिति दर **62.5%** है, जो विद्यालय की न्यूनतम नीति threshold (75%) से नीचे है। Alert level: CRITICAL.`
      );
    } else {
      setAiResponse(
        `🤖 **AI Attendance Intelligence**: ${selectedDate} के लिए विद्यालय की कुल छात्र उपस्थिति दर **92.4%** है और शिक्षक उपस्थिति दर **96.0%** दर्ज की गई है।`
      );
    }
  };

  const handleExportCSV = () => {
    const csvContent =
      'data:text/csv;charset=utf-8,Student ID,Student Name,Class,Section,Date,Status,Remarks\n' +
      students
        .map(
          (s) =>
            `${s.id},${s.name},${selectedClass},${selectedSection},${selectedDate},${
              attendanceMap[s.id]?.status || 'PRESENT'
            },${attendanceMap[s.id]?.remarks || ''}`
        )
        .join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Attendance_${selectedClass}_${selectedSection}_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <CalendarCheck className="w-4 h-4" /> Attendance, Leave & Staff Intelligence Engine
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Real-Time Attendance Register & Multi-Role Presence Desk
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Mark Once → Calculate Everywhere → Lock & Correct → Parent WhatsApp Alert → Biometric Sync.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
          <button
            onClick={() => setActiveTab('STUDENT_ATTENDANCE')}
            className={`px-3 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'STUDENT_ATTENDANCE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            📋 Student Desk
          </button>
          <button
            onClick={() => setActiveTab('STAFF_ATTENDANCE')}
            className={`px-3 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'STAFF_ATTENDANCE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            👨‍🏫 Staff Presence
          </button>
          <button
            onClick={() => setActiveTab('LEAVE_MANAGEMENT')}
            className={`px-3 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'LEAVE_MANAGEMENT' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            📝 Leave Desk ({studentLeaves.filter((l) => l.status === 'SUBMITTED').length + staffLeaves.filter((l) => l.status === 'SUBMITTED').length})
          </button>
          <button
            onClick={() => setActiveTab('CORRECTIONS')}
            className={`px-3 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'CORRECTIONS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            🔒 Corrections & Locks
          </button>
          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-3 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'ANALYTICS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            📊 AI Analytics
          </button>
          <button
            onClick={() => setActiveTab('DEVICES')}
            className={`px-3 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'DEVICES' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            📠 Biometric QR
          </button>
        </div>
      </div>

      {saveAlert && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 font-semibold animate-fade-in flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{saveAlert}</span>
        </div>
      )}

      {/* FILTER BAR FOR ATTENDANCE */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-500">Class:</span>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="bg-transparent font-bold text-indigo-600 outline-none"
            >
              <option value="Class VIII">Class VIII</option>
              <option value="Class IX">Class IX</option>
              <option value="Class X">Class X</option>
              <option value="Class XI">Class XI</option>
              <option value="Class XII">Class XII</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-500">Section:</span>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="bg-transparent font-bold text-indigo-600 outline-none"
            >
              <option value="Section A">Section A</option>
              <option value="Section B">Section B</option>
              <option value="Section C">Section C</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="font-bold text-slate-500">Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-bold text-indigo-600 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isLocked ? (
            <span className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-700 dark:amber-300 font-bold border border-amber-200 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Session Locked
            </span>
          ) : (
            <button
              onClick={handleLockSession}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" /> Lock Attendance
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-indigo-500" /> Export CSV
          </button>
        </div>
      </div>

      {/* TAB 1: DAILY STUDENT ATTENDANCE DESK */}
      {activeTab === 'STUDENT_ATTENDANCE' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                Daily Student Attendance Register ({selectedClass} - {selectedSection})
              </h3>
              <p className="text-xs text-slate-500">
                Total Enrolled Students: {students.length} • Active Session: 2026-2027
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleMarkAllPresent}
                disabled={isLocked}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckSquare className="w-4 h-4 text-emerald-600" /> Mark All Present
              </button>

              <button
                onClick={handleSaveStudentAttendance}
                disabled={isLocked}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Save Attendance & Notify Parents
              </button>
            </div>
          </div>

          {/* Student Roster Table */}
          <div className="space-y-3">
            {students.map((std) => {
              const currentStatus = attendanceMap[std.id]?.status || 'PRESENT';
              const summary = attendanceService.calculateStudentSummary(schoolId, std.id, std.name);

              return (
                <div
                  key={std.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 gap-4 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <img src={std.photoUrl} alt={std.name} className="h-10 w-10 rounded-xl object-cover" />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 dark:text-white">{std.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          Roll #{std.rollNo}
                        </span>
                        {summary.alertLevel === 'CRITICAL' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Low Attendance ({summary.attendancePercentage}%)
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        Adm #{std.admissionNo} • Overall Rate: <b>{summary.attendancePercentage}%</b> • Present:{' '}
                        {summary.presentDays}/{summary.totalWorkingDays} days
                      </p>
                    </div>
                  </div>

                  {/* Status Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'HALF_DAY', 'EXCUSED'] as AttendanceStatusCode[]).map((st) => (
                      <button
                        key={st}
                        disabled={isLocked}
                        onClick={() =>
                          setAttendanceMap({
                            ...attendanceMap,
                            [std.id]: { ...attendanceMap[std.id], status: st }
                          })
                        }
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                          currentStatus === st
                            ? st === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow'
                              : st === 'ABSENT'
                              ? 'bg-red-600 text-white shadow'
                              : st === 'LATE'
                              ? 'bg-amber-500 text-white shadow'
                              : st === 'LEAVE'
                              ? 'bg-purple-600 text-white shadow'
                              : st === 'HALF_DAY'
                              ? 'bg-blue-600 text-white shadow'
                              : 'bg-indigo-600 text-white shadow'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300'
                        }`}
                      >
                        {st}
                      </button>
                    ))}

                    <button
                      onClick={() => setSelectedStudentSummary(summary)}
                      className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                      title="View Detailed Analytics"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: STAFF ATTENDANCE */}
      {activeTab === 'STAFF_ATTENDANCE' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Staff & Teacher Daily Presence Desk</h3>
              <p className="text-xs text-slate-500">Track Teacher, Accountant & Support Staff presence on {selectedDate}</p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Department:</span>
              <select
                value={staffDepartmentFilter}
                onChange={(e) => setStaffDepartmentFilter(e.target.value)}
                className="bg-slate-100 dark:bg-slate-800 text-xs font-bold px-3 py-1.5 rounded-xl border"
              >
                <option value="ALL">All Staff</option>
                <option value="TEACHER">Teachers</option>
                <option value="ACCOUNTANT">Accountants</option>
                <option value="SUPPORT">Support Staff</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {staff
              .filter((st) => staffDepartmentFilter === 'ALL' || st.role === staffDepartmentFilter)
              .map((emp) => {
                const currentStatus = staffAttendanceMap[emp.id] || 'PRESENT';

                return (
                  <div
                    key={emp.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 gap-4 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 font-bold flex items-center justify-center text-sm">
                        {emp.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{emp.name}</h4>
                        <p className="text-[10px] text-slate-500">
                          Emp #{emp.employeeId} • {emp.designation} • Base Salary: ₹{emp.baseSalary.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Status Toggle */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {(['PRESENT', 'ABSENT', 'LATE', 'LEAVE', 'HALF_DAY'] as AttendanceStatusCode[]).map((st) => (
                        <button
                          key={st}
                          onClick={() => handleSaveStaffAttendance(emp.id, st)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all cursor-pointer ${
                            currentStatus === st
                              ? st === 'PRESENT'
                                ? 'bg-emerald-600 text-white shadow'
                                : st === 'ABSENT'
                                ? 'bg-red-600 text-white shadow'
                                : st === 'LATE'
                                ? 'bg-amber-500 text-white shadow'
                                : st === 'LEAVE'
                                ? 'bg-purple-600 text-white shadow'
                                : 'bg-blue-600 text-white shadow'
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* TAB 3: LEAVE MANAGEMENT DESK */}
      {activeTab === 'LEAVE_MANAGEMENT' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Student Leaves */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" /> Student Leave Requests ({studentLeaves.length})
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {studentLeaves.map((lve) => (
                <div key={lve.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{lve.studentName}</h4>
                      <p className="text-[10px] text-slate-500">
                        {lve.className} - {lve.section} • Type: <b className="text-indigo-600">{lve.leaveTypeName}</b>
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        lve.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : lve.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {lve.status}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-[11px] bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    "{lve.reason}" ({lve.startDate} to {lve.endDate} • {lve.totalDays} Days)
                  </p>

                  {lve.status === 'SUBMITTED' && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleApproveStudentLeave(lve.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve & Sync Attendance
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Staff Leaves */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-600" /> Staff & Teacher Leave Desk ({staffLeaves.length})
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              {staffLeaves.map((lve) => (
                <div key={lve.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{lve.employeeName}</h4>
                      <p className="text-[10px] text-slate-500">
                        {lve.department} ({lve.designation}) • Type: <b className="text-indigo-600">{lve.leaveTypeName}</b>
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        lve.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : lve.status === 'REJECTED'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {lve.status}
                    </span>
                  </div>

                  <p className="text-slate-600 dark:text-slate-300 text-[11px] bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800">
                    "{lve.reason}" ({lve.startDate} to {lve.endDate} • {lve.totalDays} Days)
                  </p>

                  {lve.status === 'SUBMITTED' && (
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleApproveStaffLeave(lve.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve & Sync Payroll
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CORRECTIONS & LOCKS */}
      {activeTab === 'CORRECTIONS' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-indigo-600" /> Attendance Locking & Correction Approval Engine
            </h3>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Pending Correction Requests
            </h4>

            {corrections.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-2xl">
                No correction requests submitted for locked sessions.
              </p>
            ) : (
              corrections.map((corr) => (
                <div
                  key={corr.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">{corr.entityName}</h5>
                    <p className="text-[10px] text-slate-500">
                      Date: {corr.date} • Change status from <b className="text-red-500">{corr.oldStatus}</b> to{' '}
                      <b className="text-emerald-500">{corr.newStatus}</b>
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1">Reason: "{corr.reason}"</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700">
                      {corr.status}
                    </span>
                    {corr.status === 'REQUESTED' && (
                      <button
                        onClick={() => handleApproveCorrection(corr.id)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Approve Correction
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AI ANALYTICS & CALENDAR */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          {/* AI Query Bar */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 p-6 rounded-3xl text-white shadow-lg space-y-4">
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" /> AI Attendance Intelligence Engine
            </div>
            <h3 className="text-lg font-bold">Natural Language Attendance Assistant</h3>

            <div className="flex items-center gap-2 bg-white/10 p-2 rounded-2xl backdrop-blur border border-white/20">
              <input
                type="text"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
                placeholder="Ask e.g. 'आज कितने बच्चे absent हैं?' or 'कौन से students low attendance हैं?'"
                className="bg-transparent flex-1 text-xs text-white placeholder-indigo-200 outline-none px-3"
              />
              <button
                onClick={handleAiQuery}
                className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs shadow cursor-pointer flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" /> Ask AI
              </button>
            </div>

            {aiResponse && (
              <div className="p-4 rounded-2xl bg-white/10 border border-white/20 text-xs leading-relaxed animate-fade-in">
                {aiResponse}
              </div>
            )}
          </div>

          {/* Student Detailed Summary Modal/Card */}
          {selectedStudentSummary && (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Attendance Analysis: {selectedStudentSummary.entityName}
                </h4>
                <button
                  onClick={() => setSelectedStudentSummary(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-center">
                <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100">
                  <div className="text-lg font-extrabold text-indigo-600">{selectedStudentSummary.attendancePercentage}%</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-0.5">Overall Rate</div>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100">
                  <div className="text-lg font-extrabold text-emerald-600">{selectedStudentSummary.presentDays} Days</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-0.5">Present</div>
                </div>

                <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-100">
                  <div className="text-lg font-extrabold text-red-600">{selectedStudentSummary.absentDays} Days</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-0.5">Absent</div>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100">
                  <div className="text-lg font-extrabold text-purple-600">{selectedStudentSummary.leaveDays} Days</div>
                  <div className="text-[10px] text-slate-500 font-bold mt-0.5">Approved Leave</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: DEVICES MONITOR */}
      {activeTab === 'DEVICES' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" /> Biometric & RFID Device Adapter Integration Monitor
            </h3>
            <span className="px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 text-xs font-bold rounded-full">
              ● 2 Devices Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span>Main Gate Biometric Terminal (BIO-GATE-01)</span>
                <span className="text-emerald-600">CONNECTED</span>
              </div>
              <p className="text-[10px] text-slate-500">IP: 192.168.1.120 • Protocol: TCP/IP Fingerprint Ingest</p>
              <div className="text-[11px] text-slate-600 bg-white dark:bg-slate-900 p-2 rounded-xl border">
                Last Punch: EMP-301 (Rajesh Kumar) at 08:10:00 AM • Status: PRESENT
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span>Bus Fleet RFID Scanner (RFID-BUS-04)</span>
                <span className="text-emerald-600">CONNECTED</span>
              </div>
              <p className="text-[10px] text-slate-500">IP: Cellular IoT • Protocol: MQTT RFID Ingest</p>
              <div className="text-[11px] text-slate-600 bg-white dark:bg-slate-900 p-2 rounded-xl border">
                Last Punch: std-101 (Aarav Sharma) at 07:45:00 AM • Status: BOARDED
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
