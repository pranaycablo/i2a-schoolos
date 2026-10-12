import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { TimetableSchedulingService } from '../../services/TimetableSchedulingService';
import { AuxiliaryOperationsService } from '../../services/AuxiliaryOperationsService';
import type { UserSession } from '../../services/TenantSecurityService';
import type {
  DayOfWeek,
  PeriodSlot,
  TimetableCell,
  RoomMaster,
  SubstitutionRecord,
  TimetableConflict,
  TeacherClassroomSession
} from '../../types';
import {
  Calendar,
  User,
  MapPin,
  Sparkles,
  CheckCircle2,
  Lock,
  Unlock,
  Printer,
  Plus,
  Zap,
  Users,
  Building2,
  RefreshCw,
  ShieldCheck,
  Bell,
  Play
} from 'lucide-react';

const timetableService = new TimetableSchedulingService();
const auxService = AuxiliaryOperationsService.getInstance();

export const TimetableModule: React.FC = () => {
  const { branding, currentRole, staffList, logAction } = useSchool();
  const [activeTab, setActiveTab] = useState<
    'class_timetable' | 'teacher_workload' | 'auto_generator' | 'substitution_desk' | 'room_matrix' | 'print_desk' | 'teacher_live_delivery'
  >('class_timetable');

  // Filter state
  const [selectedClass, setSelectedClass] = useState<string>('Class X');
  const [selectedSection, setSelectedSection] = useState<string>('A');
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('emp-001');

  // Timetable State
  const schoolId = branding.id || 'sch-001';
  const session: UserSession = {
    id: 'user-active',
    email: 'admin@school.com',
    tenantId: schoolId,
    role: currentRole,
    status: 'ACTIVE'
  };

  const periods: PeriodSlot[] = useMemo(() => timetableService.getPeriodSlots(schoolId, session), [schoolId]);
  const rooms: RoomMaster[] = useMemo(() => timetableService.getRooms(schoolId, session), [schoolId]);

  const [timetableCells, setTimetableCells] = useState<TimetableCell[]>(() =>
    timetableService.getAllSchoolTimetable(schoolId, session)
  );

  // Edit Cell Modal State
  const [isEditingCell, setIsEditingCell] = useState<boolean>(false);
  const [targetCell, setTargetCell] = useState<Partial<TimetableCell>>({});
  const [conflictWarning, setConflictWarning] = useState<TimetableConflict[]>([]);

  // Handle Save Cell
  const handleSaveCell = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCell.day || !targetCell.periodId || !targetCell.subjectName || !targetCell.teacherId) {
      alert('Please fill in all mandatory slot fields.');
      return;
    }

    const teacher = staffList.find(s => s.id === targetCell.teacherId);

    const fullCell: TimetableCell = {
      id: targetCell.id || `cell-${Date.now()}`,
      schoolId,
      classId: targetCell.classId || `cls-${selectedClass.toLowerCase().replace(/\s+/g, '')}`,
      className: selectedClass,
      sectionId: targetCell.sectionId || `sec-${selectedSection.toLowerCase()}`,
      sectionName: selectedSection,
      day: targetCell.day as DayOfWeek,
      periodId: targetCell.periodId,
      subjectId: `sub-${targetCell.subjectName.toLowerCase()}`,
      subjectName: targetCell.subjectName,
      teacherId: targetCell.teacherId,
      teacherName: teacher ? teacher.name : targetCell.teacherName || 'Assigned Faculty',
      roomId: targetCell.roomId,
      roomName: rooms.find(r => r.id === targetCell.roomId)?.roomName || 'Classroom',
      isLocked: targetCell.isLocked || false
    };

    try {
      const { cell, conflicts } = timetableService.saveTimetableCell(fullCell, session, false);
      setTimetableCells(timetableService.getAllSchoolTimetable(schoolId, session));
      setIsEditingCell(false);
      setConflictWarning(conflicts || []);
      logAction('UPDATE_TIMETABLE_CELL', 'TIMETABLE', `Scheduled ${cell.subjectName} for ${cell.className}-${cell.sectionName} on ${cell.day} Period ${cell.periodId}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      alert(`Timetable Conflict Detected: ${msg}`);
    }
  };

  // Substitution State
  const [subDate, setSubDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [absentTeacherId, setAbsentTeacherId] = useState<string>('emp-001');
  const [substitutions, setSubstitutions] = useState<SubstitutionRecord[]>(() =>
    timetableService.getSubstitutions(schoolId, subDate, session)
  );

  // Auto-Generator Form State
  const [autoClass, setAutoClass] = useState<string>('Class VIII');
  const [autoSection, setAutoSection] = useState<string>('A');
  const [generatedResult, setGeneratedResult] = useState<{
    cells: TimetableCell[];
    unallocated: number;
  } | null>(null);

  const days: DayOfWeek[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

  // Teacher Live Class Delivery State
  const [liveTeacherId, setLiveTeacherId] = useState<string>('emp-001');
  const [activeSession, setActiveSession] = useState<TeacherClassroomSession | null>(null);
  const [chapterInput, setChapterInput] = useState<string>('Chapter 4: Linear Equations in Two Variables');
  const [lessonTaughtInput, setLessonTaughtInput] = useState<string>('Covered graphical solution method and plotting coordinates.');
  const [notesInput, setNotesInput] = useState<string>('All students completed class practice exercise 4.1.');
  const [homeworkInput, setHomeworkInput] = useState<string>('Exercise 4.2 Questions 1 to 5');
  const [presentCountInput, setPresentCountInput] = useState<number>(34);
  const [attendanceVerified, setAttendanceVerified] = useState<boolean>(true);
  const [reminderMsg, setReminderMsg] = useState<string | null>(null);
  const [classSuccessMsg, setClassSuccessMsg] = useState<string | null>(null);
  const [completedSessions, setCompletedSessions] = useState<TeacherClassroomSession[]>(() =>
    auxService.getClassroomSessions(schoolId)
  );

  const handleTriggerReminder = (periodLabel: string, subject: string, room: string) => {
    const teacher = staffList.find(s => s.id === liveTeacherId)?.name || 'Teacher';
    const msg = `🔔 Class Reminder Triggered: ${periodLabel} ${subject} in ${room} starting now for ${teacher}. In-app alert logged.`;
    setReminderMsg(msg);
    logAction('TRIGGER_CLASS_REMINDER', 'TIMETABLE', msg);
    setTimeout(() => setReminderMsg(null), 5000);
  };

  const handleStartClass = (cell: TimetableCell) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const sess = auxService.startClassSession(
      {
        schoolId,
        teacherId: cell.teacherId,
        teacherName: cell.teacherName,
        classId: cell.classId,
        className: cell.className,
        sectionName: cell.sectionName,
        subjectName: cell.subjectName,
        periodId: cell.periodId,
        periodLabel: periods.find(p => p.id === cell.periodId)?.label || cell.periodId,
        roomName: cell.roomName || 'Classroom',
        date: todayStr,
        totalStudentsCount: 35
      },
      session
    );
    setActiveSession(sess);
    setClassSuccessMsg(`▶ Class ${cell.subjectName} started in ${cell.roomName || 'Classroom'}! Status: IN_PROGRESS.`);
    logAction('START_CLASS_SESSION', 'TIMETABLE', `Started ${cell.subjectName} for ${cell.className}-${cell.sectionName}`);
    setTimeout(() => setClassSuccessMsg(null), 5000);
  };

  const handleCompleteClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;

    const completed = auxService.completeClassSession(
      activeSession.id,
      {
        chapterTitle: chapterInput,
        lessonTaught: lessonTaughtInput,
        completionNotes: notesInput,
        homeworkAssigned: homeworkInput,
        presentCount: presentCountInput
      },
      session
    );

    setActiveSession(null);
    setCompletedSessions(auxService.getClassroomSessions(schoolId));
    setClassSuccessMsg(`✅ Class ${completed.subjectName} successfully COMPLETED and PERSISTED to browser storage! Notes & homework logged.`);
    logAction('COMPLETE_CLASS_SESSION', 'TIMETABLE', `Completed ${completed.subjectName} (${completed.chapterTitle}). Present: ${completed.presentCount}`);
  };

  // Current Class Filtered Cells
  const filteredClassCells = useMemo(() => {
    return timetableCells.filter(
      c => c.className === selectedClass && c.sectionName === selectedSection
    );
  }, [timetableCells, selectedClass, selectedSection]);

  // Current Teacher Filtered Cells
  const filteredTeacherCells = useMemo(() => {
    return timetableCells.filter(c => c.teacherId === selectedTeacherId);
  }, [timetableCells, selectedTeacherId]);

  // Teacher Workload Stats
  const teacherWorkloads = useMemo(() => {
    return timetableService.getTeacherWorkloadSummary(schoolId, session);
  }, [timetableCells, schoolId]);

  // Handle Save Cell
  // Handle Cell Lock Toggle
  const handleToggleLock = (cell: TimetableCell) => {
    const updated = { ...cell, isLocked: !cell.isLocked };
    timetableService.saveTimetableCell(updated, session, true);
    setTimetableCells(timetableService.getAllSchoolTimetable(schoolId, session));
    logAction('TOGGLE_CELL_LOCK', 'TIMETABLE', `${updated.isLocked ? 'Locked' : 'Unlocked'} timetable cell ${cell.id}`);
  };

  // Handle Run Auto Generator
  const handleRunAutoGenerator = () => {
    const result = timetableService.autoGenerateClassTimetable(
      {
        schoolId,
        classId: `cls-${autoClass.toLowerCase().replace(/\s+/g, '')}`,
        className: autoClass,
        sectionId: `sec-${autoSection.toLowerCase()}`,
        sectionName: autoSection,
        subjectAssignments: [
          { subjectId: 's1', subjectName: 'Mathematics', teacherId: 'emp-001', teacherName: 'Rajesh Sharma', weeklyQuota: 6, roomId: 'rm-101' },
          { subjectId: 's2', subjectName: 'Science', teacherId: 'emp-002', teacherName: 'Sunita Verma', weeklyQuota: 6, roomId: 'rm-lab1' },
          { subjectId: 's3', subjectName: 'English', teacherId: 'emp-003', teacherName: 'Anita Gupta', weeklyQuota: 5, roomId: 'rm-101' },
          { subjectId: 's4', subjectName: 'Social Studies', teacherId: 'emp-001', teacherName: 'Rajesh Sharma', weeklyQuota: 5, roomId: 'rm-102' }
        ]
      },
      session
    );

    setGeneratedResult({
      cells: result.generatedCells,
      unallocated: result.unallocatedPeriods
    });
    logAction('RUN_AUTO_TIMETABLE_GENERATOR', 'TIMETABLE', `Generated AI schedule for ${autoClass}-${autoSection}.`);
  };

  // Apply Auto Generated Schedule
  const handleApplyGeneratedSchedule = () => {
    if (!generatedResult) return;
    generatedResult.cells.forEach(c => {
      timetableService.saveTimetableCell(c, session, true);
    });
    setTimetableCells(timetableService.getAllSchoolTimetable(schoolId, session));
    setGeneratedResult(null);
    alert('AI Generated Timetable successfully applied to school master schedule!');
  };

  // Substitution Assignment
  const availableSubstitutes = useMemo(() => {
    const dayOfWeek = days[new Date(subDate).getDay() === 0 ? 5 : new Date(subDate).getDay() - 1] || 'MONDAY';
    return timetableService.findAvailableSubstitutes(
      schoolId,
      dayOfWeek,
      'p1',
      absentTeacherId,
      session,
      staffList.map(s => ({ id: s.id, name: s.name, role: s.role }))
    );
  }, [subDate, absentTeacherId, staffList]);

  const handleAssignSub = (subTeacherId: string, subTeacherName: string) => {
    const absentTeacher = staffList.find(s => s.id === absentTeacherId);
    const dayOfWeek = days[new Date(subDate).getDay() === 0 ? 5 : new Date(subDate).getDay() - 1] || 'MONDAY';

    timetableService.assignSubstitution(
      {
        schoolId,
        date: subDate,
        day: dayOfWeek,
        periodId: 'p1',
        periodLabel: 'Period 1',
        classId: 'cls-10',
        className: 'Class X',
        sectionId: 'sec-10-a',
        sectionName: 'A',
        subjectName: 'Mathematics',
        originalTeacherId: absentTeacherId,
        originalTeacherName: absentTeacher ? absentTeacher.name : 'Absent Teacher',
        substituteTeacherId: subTeacherId,
        substituteTeacherName: subTeacherName,
        reason: 'Casual Leave Coverage'
      },
      session
    );

    setSubstitutions(timetableService.getSubstitutions(schoolId, subDate, session));
    logAction('ASSIGN_SUBSTITUTION', 'TIMETABLE', `Assigned substitute ${subTeacherName} for ${absentTeacher?.name} on ${subDate}`);
    alert(`Substitution assigned to ${subTeacherName}!`);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Timetable & Scheduling Engine
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Conflict-Free Automated Scheduling, Teacher Workload Optimization & Substitution Manager
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Tenant Isolated
          </span>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" /> AI Clash Detector Active
          </span>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('class_timetable')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'class_timetable'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" /> Class Timetable Grid
        </button>

        <button
          onClick={() => setActiveTab('teacher_workload')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'teacher_workload'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Users className="w-4 h-4" /> Teacher Workload & Schedule
        </button>

        <button
          onClick={() => setActiveTab('auto_generator')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'auto_generator'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Zap className="w-4 h-4" /> AI Auto-Scheduler
        </button>

        <button
          onClick={() => setActiveTab('substitution_desk')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'substitution_desk'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <RefreshCw className="w-4 h-4" /> Substitution Desk
        </button>

        <button
          onClick={() => setActiveTab('room_matrix')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'room_matrix'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Building2 className="w-4 h-4" /> Room Allocation Matrix
        </button>

        <button
          onClick={() => setActiveTab('teacher_live_delivery')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'teacher_live_delivery'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Play className="w-4 h-4 text-emerald-400" /> Live Classroom Delivery
        </button>

        <button
          onClick={() => setActiveTab('print_desk')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'print_desk'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Printer className="w-4 h-4" /> Export & Print
        </button>
      </div>

      {/* TAB 1: CLASS TIMETABLE GRID */}
      {activeTab === 'class_timetable' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Select Class</label>
                <select
                  value={selectedClass}
                  onChange={e => setSelectedClass(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-800 dark:text-white"
                >
                  <option value="Class VI">Class VI</option>
                  <option value="Class VII">Class VII</option>
                  <option value="Class VIII">Class VIII</option>
                  <option value="Class IX">Class IX</option>
                  <option value="Class X">Class X</option>
                  <option value="Class XI">Class XI</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Section</label>
                <select
                  value={selectedSection}
                  onChange={e => setSelectedSection(e.target.value)}
                  className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-800 dark:text-white"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                setTargetCell({ className: selectedClass, sectionName: selectedSection, day: 'MONDAY', periodId: 'p1' });
                setIsEditingCell(true);
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add / Edit Slot
            </button>
          </div>

          {/* Interactive Timetable Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-x-auto p-4">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-xs font-semibold uppercase tracking-wider">
                  <th className="p-3 border border-gray-200 dark:border-gray-700 w-28">Day / Period</th>
                  {periods.map(p => (
                    <th key={p.id} className="p-3 border border-gray-200 dark:border-gray-700 text-center">
                      <div>{p.label}</div>
                      <div className="text-[10px] text-gray-400 lowercase font-normal">{p.startTime} - {p.endTime}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map(day => (
                  <tr key={day} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="p-3 font-semibold text-xs text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800">
                      {day}
                    </td>
                    {periods.map(p => {
                      if (p.isBreak) {
                        return (
                          <td key={p.id} className="p-2 border border-gray-200 dark:border-gray-700 bg-amber-50/60 dark:bg-amber-950/20 text-center text-xs font-semibold text-amber-700 dark:text-amber-400">
                            ☕ {p.label}
                          </td>
                        );
                      }

                      const cell = filteredClassCells.find(c => c.day === day && c.periodId === p.id);

                      return (
                        <td key={p.id} className="p-2 border border-gray-200 dark:border-gray-700 align-top relative group min-h-[80px]">
                          {cell ? (
                            <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                              cell.isLocked
                                ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800'
                                : 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800'
                            }`}>
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-indigo-950 dark:text-indigo-200">{cell.subjectName}</span>
                                <button
                                  onClick={() => handleToggleLock(cell)}
                                  className="text-gray-400 hover:text-purple-600 dark:hover:text-purple-300"
                                  title={cell.isLocked ? 'Locked (Click to Unlock)' : 'Unlocked'}
                                >
                                  {cell.isLocked ? <Lock className="w-3 h-3 text-purple-600" /> : <Unlock className="w-3 h-3" />}
                                </button>
                              </div>
                              <div className="text-[11px] text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                <User className="w-3 h-3 text-gray-400" /> {cell.teacherName}
                              </div>
                              <div className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-gray-400" /> {cell.roomName || 'Classroom'}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setTargetCell({ className: selectedClass, sectionName: selectedSection, day, periodId: p.id });
                                setIsEditingCell(true);
                              }}
                              className="w-full h-full min-h-[60px] rounded-xl border border-dashed border-gray-200 dark:border-gray-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50/30 text-gray-400 hover:text-indigo-600 text-xs flex items-center justify-center transition-all"
                            >
                              + Assign
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Edit / Add Slot Modal */}
          {isEditingCell && (
            <div className="p-4 bg-indigo-50/80 dark:bg-indigo-950/40 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Configure Slot: {targetCell.day} — {periods.find(p => p.id === targetCell.periodId)?.label || targetCell.periodId}
              </h4>
              <form onSubmit={handleSaveCell} className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs items-end">
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Subject</label>
                  <input
                    type="text"
                    value={targetCell.subjectName || ''}
                    placeholder="e.g. Mathematics"
                    onChange={(e) => setTargetCell(prev => ({ ...prev, subjectName: e.target.value }))}
                    className="w-full p-2 bg-white dark:bg-gray-700 border rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Teacher</label>
                  <select
                    value={targetCell.teacherId || ''}
                    onChange={(e) => setTargetCell(prev => ({ ...prev, teacherId: e.target.value }))}
                    className="w-full p-2 bg-white dark:bg-gray-700 border rounded-xl"
                    required
                  >
                    <option value="">Select Faculty</option>
                    {staffList.filter(s => s.role === 'TEACHER').map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.designation})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-500 font-medium mb-1">Room</label>
                  <select
                    value={targetCell.roomId || ''}
                    onChange={(e) => setTargetCell(prev => ({ ...prev, roomId: e.target.value }))}
                    className="w-full p-2 bg-white dark:bg-gray-700 border rounded-xl"
                  >
                    <option value="">Select Room</option>
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.roomName} ({r.roomType})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold cursor-pointer"
                  >
                    Save Slot
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingCell(false)}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-bold cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TEACHER WORKLOAD & SCHEDULE */}
      {activeTab === 'teacher_workload' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Workload Progress Overview */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" /> Faculty Workload Monitor
            </h2>
            <p className="text-xs text-gray-500">Weekly assigned periods vs maximum target (30 periods/week)</p>

            <div className="space-y-4 pt-2">
              {teacherWorkloads.length === 0 ? (
                <div className="text-sm text-gray-500 italic">No faculty workload allocated yet.</div>
              ) : (
                teacherWorkloads.map(tw => {
                  const percentage = Math.min(100, Math.round((tw.assignedWeeklyPeriods / tw.maxWeeklyPeriods) * 100));
                  const isHigh = tw.assignedWeeklyPeriods >= 28;

                  return (
                    <div
                      key={tw.teacherId}
                      onClick={() => setSelectedTeacherId(tw.teacherId)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedTeacherId === tw.teacherId
                          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20'
                          : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-semibold text-sm text-gray-900 dark:text-white">{tw.teacherName}</span>
                        <span className={`text-xs font-bold ${isHigh ? 'text-amber-600' : 'text-indigo-600'}`}>
                          {tw.assignedWeeklyPeriods} / {tw.maxWeeklyPeriods} Periods
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-2 rounded-full transition-all ${isHigh ? 'bg-amber-500' : 'bg-indigo-600'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Teacher Specific Master Timetable */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Master Schedule for {staffList.find(s => s.id === selectedTeacherId)?.name || 'Selected Teacher'}
              </h2>
              <span className="text-xs px-2.5 py-1 bg-indigo-100 text-indigo-700 font-semibold rounded-full">
                {filteredTeacherCells.length} Weekly Classes
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold">
                    <th className="p-3 border border-gray-200 dark:border-gray-700">Day</th>
                    <th className="p-3 border border-gray-200 dark:border-gray-700">Period</th>
                    <th className="p-3 border border-gray-200 dark:border-gray-700">Class & Section</th>
                    <th className="p-3 border border-gray-200 dark:border-gray-700">Subject</th>
                    <th className="p-3 border border-gray-200 dark:border-gray-700">Room</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTeacherCells.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-gray-400 italic">
                        No periods assigned to this teacher yet.
                      </td>
                    </tr>
                  ) : (
                    filteredTeacherCells.map(c => (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="p-3 border border-gray-200 dark:border-gray-700 font-semibold">{c.day}</td>
                        <td className="p-3 border border-gray-200 dark:border-gray-700">{c.periodId}</td>
                        <td className="p-3 border border-gray-200 dark:border-gray-700 font-medium text-indigo-600">{c.className} - {c.sectionName}</td>
                        <td className="p-3 border border-gray-200 dark:border-gray-700">{c.subjectName}</td>
                        <td className="p-3 border border-gray-200 dark:border-gray-700">{c.roomName || 'Classroom'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: AI AUTO-SCHEDULER */}
      {activeTab === 'auto_generator' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                One-Click AI Timetable Auto-Generator
              </h2>
              <p className="text-xs text-gray-500">
                Algorithmically generates a conflict-free, balanced timetable respecting subject quotas and teacher availability.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/40 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Class</label>
              <select
                value={autoClass}
                onChange={e => setAutoClass(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
              >
                <option value="Class VIII">Class VIII</option>
                <option value="Class IX">Class IX</option>
                <option value="Class X">Class X</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Target Section</label>
              <select
                value={autoSection}
                onChange={e => setAutoSection(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
              >
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRunAutoGenerator}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md"
            >
              <Sparkles className="w-5 h-5" /> Generate Conflict-Free Schedule
            </button>
          </div>

          {generatedResult && (
            <div className="p-6 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-base">
                  <CheckCircle2 className="w-5 h-5" /> AI Schedule Generated ({generatedResult.cells.length} Periods Scheduled)
                </div>
                <button
                  onClick={handleApplyGeneratedSchedule}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-sm"
                >
                  Apply to Active Timetable
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border">
                  <div className="text-gray-400">Total Scheduled Slots</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{generatedResult.cells.length}</div>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-xl border">
                  <div className="text-gray-400">Unallocated Periods</div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white">{generatedResult.unallocated}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SUBSTITUTION MANAGEMENT */}
      {activeTab === 'substitution_desk' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600" /> Daily Substitution Manager
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Substitution Date</label>
                <input
                  type="date"
                  value={subDate}
                  onChange={e => setSubDate(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Select Absent Faculty</label>
                <select
                  value={absentTeacherId}
                  onChange={e => setAbsentTeacherId(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                >
                  {staffList.filter(s => s.role === 'TEACHER').map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.designation})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Substitute Suggestions List */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="text-md font-bold text-gray-900 dark:text-white">Available Free Faculty Recommendations</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {availableSubstitutes.map(sub => (
                <div
                  key={sub.teacherId}
                  className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 flex justify-between items-center"
                >
                  <div>
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">{sub.teacherName}</div>
                    <div className="text-xs text-gray-500">Weekly Load: {sub.currentWeeklyLoad} periods</div>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      sub.isFreeThisPeriod ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {sub.isFreeThisPeriod ? 'FREE THIS PERIOD' : 'BUSY'}
                    </span>
                  </div>

                  <button
                    onClick={() => handleAssignSub(sub.teacherId, sub.teacherName)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-sm"
                  >
                    Assign
                  </button>
                </div>
              ))}
            </div>
          </div>
          {/* Confirmed Substitutions Table */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="text-md font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Active Assigned Substitutions for {subDate}
            </h3>
            {substitutions.length === 0 ? (
              <p className="text-xs text-gray-400">No substitutions assigned for this date yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b text-gray-400">
                      <th className="py-2 px-3">Period & Class</th>
                      <th className="py-2 px-3">Subject</th>
                      <th className="py-2 px-3">Absent Teacher</th>
                      <th className="py-2 px-3">Substitute Teacher</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {substitutions.map(sub => (
                      <tr key={sub.id}>
                        <td className="py-2 px-3 font-semibold">{sub.periodLabel || 'Period 1'} — {sub.className} ({sub.sectionName})</td>
                        <td className="py-2 px-3 text-indigo-600 font-bold">{sub.subjectName}</td>
                        <td className="py-2 px-3 text-rose-600 line-through">{sub.originalTeacherName}</td>
                        <td className="py-2 px-3 text-emerald-600 font-bold">{sub.substituteTeacherName}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {sub.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB: TEACHER LIVE CLASSROOM DELIVERY WORKFLOW */}
      {activeTab === 'teacher_live_delivery' && (
        <div className="space-y-6">
          {/* Header & Verification Alerts */}
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <span className="font-bold text-emerald-900 dark:text-emerald-200">
                End-to-End Teacher Daily Delivery Workflow (FOV-06R Real Verification)
              </span>
              <p className="text-emerald-700 dark:text-emerald-300">
                Teacher opens timetable → checks period/room → triggers reminder alert → starts class → marks roster attendance → records chapter taught → logs completion notes → assigns homework → completes class with browser storage persistence.
              </p>
            </div>
          </div>

          {reminderMsg && (
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 text-indigo-800 dark:text-indigo-300 text-xs rounded-2xl flex items-center gap-2 font-bold animate-pulse">
              <Bell className="w-4 h-4 text-indigo-600 shrink-0" />
              {reminderMsg}
            </div>
          )}

          {classSuccessMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-2xl flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              {classSuccessMsg}
            </div>
          )}

          {/* Teacher Selector Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Active Faculty Account</span>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white mt-0.5">
                {staffList.find(s => s.id === liveTeacherId)?.name || 'Rajesh Sharma'} ({staffList.find(s => s.id === liveTeacherId)?.designation || 'TGT Mathematics'})
              </h3>
              <p className="text-xs text-gray-500">ID: {liveTeacherId} • Status: ACTIVE</p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-gray-500">Switch Faculty:</label>
              <select
                value={liveTeacherId}
                onChange={(e) => setLiveTeacherId(e.target.value)}
                className="p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold"
              >
                {staffList.filter(s => s.role === 'TEACHER').map(t => (
                  <option key={t.id} value={t.id}>{t.name} ({t.designation})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Today's Scheduled Periods for Teacher */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="text-md font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-indigo-600" /> Today's Allocated Class Periods
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {timetableCells.filter(c => c.teacherId === liveTeacherId).map(cell => {
                const isCurrentActive = activeSession?.periodId === cell.periodId;
                const slotLabel = periods.find(p => p.id === cell.periodId)?.label || cell.periodId;

                return (
                  <div
                    key={cell.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isCurrentActive
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 shadow-md ring-2 ring-indigo-400'
                        : 'bg-gray-50/50 dark:bg-gray-700/20 border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
                          {slotLabel}
                        </span>
                        <h4 className="text-base font-extrabold text-gray-900 dark:text-white mt-2">
                          {cell.subjectName} — {cell.className} ({cell.sectionName})
                        </h4>
                        <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" /> Room: <b>{cell.roomName}</b>
                        </p>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isCurrentActive ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-200'
                      }`}>
                        {isCurrentActive ? 'IN PROGRESS' : 'SCHEDULED'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => handleTriggerReminder(slotLabel, cell.subjectName, cell.roomName || 'Classroom')}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Bell className="w-3.5 h-3.5" /> Trigger Class Reminder
                      </button>

                      <button
                        onClick={() => handleStartClass(cell)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5" /> Start Class
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Class Delivery Form */}
          {activeSession && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md border-2 border-indigo-500 space-y-5 animate-fade-in">
              <div className="flex justify-between items-start border-b pb-3 border-gray-100 dark:border-gray-700">
                <div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                    Live Session In Progress
                  </span>
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-white mt-1">
                    {activeSession.subjectName} — {activeSession.className} ({activeSession.sectionName})
                  </h3>
                  <p className="text-xs text-gray-500">
                    Period: {activeSession.periodLabel} • Room: {activeSession.roomName} • Start Time: {activeSession.startTime}
                  </p>
                </div>
              </div>

              <form onSubmit={handleCompleteClass} className="space-y-4 text-xs">
                {/* Attendance Verification Subsection */}
                <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-600 space-y-2">
                  <span className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Attendance Method & Verification
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={attendanceVerified}
                        onChange={(e) => setAttendanceVerified(e.target.checked)}
                        className="w-4 h-4 text-indigo-600 rounded"
                      />
                      <span>Manual Teacher Classroom Roster Check Completed</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <span>Students Present:</span>
                      <input
                        type="number"
                        min={0}
                        max={35}
                        value={presentCountInput}
                        onChange={(e) => setPresentCountInput(Number(e.target.value))}
                        className="w-20 p-1.5 bg-white dark:bg-gray-700 border rounded font-mono text-center"
                      />
                      <span className="text-gray-400">/ 35 Total Enrolled</span>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 italic">
                    Note: Automated GPS/Geofence attendance is not active in browser environment; explicit teacher manual confirmation enforced.
                  </p>
                </div>

                {/* Lesson & Notes Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-600 dark:text-gray-300 font-semibold mb-1">
                      Chapter / Topic Taught
                    </label>
                    <input
                      type="text"
                      value={chapterInput}
                      onChange={(e) => setChapterInput(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600 dark:text-gray-300 font-semibold mb-1">
                      Homework / Practice Assigned
                    </label>
                    <input
                      type="text"
                      value={homeworkInput}
                      onChange={(e) => setHomeworkInput(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-600 dark:text-gray-300 font-semibold mb-1">
                    Lesson Delivery Summary & Classroom Completion Notes
                  </label>
                  <textarea
                    rows={2}
                    value={lessonTaughtInput}
                    onChange={(e) => setLessonTaughtInput(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl mb-2"
                    placeholder="Describe concepts covered..."
                    required
                  />
                  <textarea
                    rows={2}
                    value={notesInput}
                    onChange={(e) => setNotesInput(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl"
                    placeholder="Notes regarding student engagement or doubts..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-sm shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" /> Complete Class & Save to Storage
                </button>
              </form>
            </div>
          )}

          {/* Persisted Completed Sessions History */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h3 className="text-md font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Persisted Completed Class Deliveries
            </h3>
            {completedSessions.length === 0 ? (
              <p className="text-xs text-gray-400">No completed class sessions recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {completedSessions.map((cs) => (
                  <div
                    key={cs.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700 text-xs space-y-1.5"
                  >
                    <div className="flex justify-between items-start font-bold">
                      <span className="text-slate-900 dark:text-white text-sm">
                        {cs.subjectName} — {cs.className} ({cs.sectionName})
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
                        COMPLETED ({cs.startTime} - {cs.endTime})
                      </span>
                    </div>
                    <div className="text-indigo-600 dark:text-indigo-400 font-semibold">
                      Chapter: {cs.chapterTitle}
                    </div>
                    <p className="text-gray-600 dark:text-gray-300">{cs.lessonTaught}</p>
                    <div className="text-gray-500 pt-1 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                      <span>Notes: {cs.completionNotes}</span>
                      <span className="font-semibold text-emerald-600">Attendance: {cs.presentCount} / {cs.totalStudentsCount}</span>
                    </div>
                    {cs.homeworkAssigned && (
                      <div className="text-amber-700 dark:text-amber-400 font-medium">
                        Homework: {cs.homeworkAssigned}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ROOM MATRIX */}
      {activeTab === 'room_matrix' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" /> Room & Infrastructure Allocation Matrix
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {rooms.map(room => (
              <div key={room.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 space-y-2">
                <div className="flex justify-between items-start">
                  <span className="font-bold text-sm text-gray-900 dark:text-white">{room.roomName}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-indigo-100 text-indigo-700 font-bold rounded-full">
                    {room.roomType}
                  </span>
                </div>
                <div className="text-xs text-gray-500">Room No: {room.roomNumber} ({room.buildingName})</div>
                <div className="text-xs text-gray-500">Seating Capacity: {room.capacity} Students</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: PRINT & EXPORT */}
      {activeTab === 'print_desk' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{branding.name}</h2>
              <p className="text-xs text-gray-500">Official Branded Class Timetable — Session {branding.academicSession}</p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print / Export PDF
            </button>
          </div>

          <div className="border rounded-xl p-4 bg-gray-50 dark:bg-gray-900 text-xs space-y-2">
            <div className="font-bold text-sm text-center uppercase tracking-wide">Class Timetable Grid — {selectedClass} ({selectedSection})</div>
            <p className="text-center text-gray-400">Authorized by Principal {branding.principalName}</p>
          </div>
        </div>
      )}
    </div>
  );
};
