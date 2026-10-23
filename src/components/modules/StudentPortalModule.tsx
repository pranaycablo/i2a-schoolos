import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  GraduationCap,
  CalendarCheck,
  BookOpen,
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  BookmarkCheck,
  Bell
} from 'lucide-react';

export const StudentPortalModule: React.FC = () => {
  const {
    students,
    currentUser,
    examPapers,
    branding,
    language
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'HOMEWORK' | 'EXAMS' | 'LIBRARY'>('SCHEDULE');

  // Match the logged-in student record
  const studentId = currentUser?.studentId || currentUser?.id;
  const currentStudent = students.find((s) => s.id === studentId || s.admissionNo === currentUser?.id) || students[0] || {
    id: 'std-101',
    name: currentUser?.name || 'Rahul Kumar',
    admissionNo: '1024',
    className: 'Class VIII',
    section: 'A',
    rollNo: 14,
    attendanceRate: 94.2
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
      {/* Student Welcome Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/30 border border-blue-400/30 text-blue-200 text-xs font-semibold mb-2">
              <GraduationCap className="w-3.5 h-3.5" /> Learner Hub & Digital Desk
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Hello, {currentStudent.name}!
            </h1>
            <p className="text-xs text-blue-200 mt-1">
              Class {currentStudent.className}-{currentStudent.section} • Roll #{currentStudent.rollNo} • Admission #{currentStudent.admissionNo}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/20 text-right">
            <span className="block text-[10px] text-blue-200 uppercase font-semibold">Attendance Record</span>
            <span className="text-xl font-extrabold text-white">{currentStudent.attendanceRate}%</span>
            <span className="block text-[10px] text-emerald-300">✓ On Track</span>
          </div>
        </div>
      </div>

      {/* Quick Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {(['SCHEDULE', 'HOMEWORK', 'EXAMS', 'LIBRARY'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab === 'SCHEDULE' && "Today's Schedule"}
            {tab === 'HOMEWORK' && 'My Homework (2 Pending)'}
            {tab === 'EXAMS' && 'Exams & Results'}
            {tab === 'LIBRARY' && 'Digital Library'}
          </button>
        ))}
      </div>

      {/* Tab 1: Today's Schedule */}
      {activeTab === 'SCHEDULE' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" /> Today's Class Timetable
            </h3>
            <div className="space-y-2 text-xs">
              {[
                { time: '08:30 - 09:15 AM', subject: 'Mathematics', room: 'Room 204', teacher: 'Mrs. Sunita Mishra', status: 'COMPLETED' },
                { time: '09:15 - 10:00 AM', subject: 'Science (Physics)', room: 'Lab 2', teacher: 'Mr. Arvind Joshi', status: 'IN_PROGRESS' },
                { time: '10:00 - 10:45 AM', subject: 'English Literature', room: 'Room 204', teacher: 'Ms. Priya Sharma', status: 'UPCOMING' },
                { time: '10:45 - 11:15 AM', subject: 'Recess / Lunch Break', room: 'Cafeteria', teacher: '—', status: 'BREAK' },
                { time: '11:15 - 12:00 PM', subject: 'Social Studies', room: 'Room 204', teacher: 'Mr. R. K. Gupta', status: 'UPCOMING' },
                { time: '12:00 - 12:45 PM', subject: 'Computer Science', room: 'IT Lab 1', teacher: 'Ms. Neha Verma', status: 'UPCOMING' }
              ].map((period, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-2xl border flex items-center justify-between ${
                    period.status === 'IN_PROGRESS'
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-700 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-slate-500">{period.time}</span>
                    <div>
                      <p className="text-slate-900 dark:text-white font-semibold">{period.subject}</p>
                      <p className="text-[10px] text-slate-400">{period.room} • {period.teacher}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      period.status === 'IN_PROGRESS'
                        ? 'bg-indigo-600 text-white'
                        : period.status === 'COMPLETED'
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {period.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" /> Student Notice Board
              </h3>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white">Inter-School Science Fair</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Submit working models to Science Department by Nov 2.</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white">CBSE Reading Month Challenge</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Earn digital badges in the school library.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Homework */}
      {activeTab === 'HOMEWORK' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-indigo-600" /> Homework & Assignments
          </h3>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">Due Tomorrow</span>
                <p className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">Mathematics: Linear Equations Exercises 3.1 & 3.2</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Submit online PDF or notebook in class.</p>
              </div>
              <button
                type="button"
                onClick={() => alert('Online upload modal will open.')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-sm"
              >
                Submit Assignment
              </button>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-600">Completed</span>
                <p className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">English Literature: Chapter 4 Character Analysis</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Evaluated: Grade A (9.5/10)</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-xs font-bold">
                ✓ Graded
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Exams & Results */}
      {activeTab === 'EXAMS' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-600" /> My Academic Performance
          </h3>
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">Term 1 Assessment Report</p>
                <p className="text-xs text-slate-500">Academic Session 2026-2027</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 font-extrabold text-xs">
                Aggregate: 88.4%
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 text-[10px]">Mathematics</p>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">92 / 100</p>
                <p className="text-[10px] text-emerald-600 font-semibold">Grade A1</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 text-[10px]">Science</p>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">89 / 100</p>
                <p className="text-[10px] text-emerald-600 font-semibold">Grade A2</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 text-[10px]">English</p>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">85 / 100</p>
                <p className="text-[10px] text-emerald-600 font-semibold">Grade A2</p>
              </div>
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <p className="text-slate-400 text-[10px]">Social Science</p>
                <p className="text-base font-extrabold text-slate-900 dark:text-white">88 / 100</p>
                <p className="text-[10px] text-emerald-600 font-semibold">Grade A2</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Digital Library */}
      {activeTab === 'LIBRARY' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BookmarkCheck className="w-4 h-4 text-indigo-600" /> Checked-out Books & Digital Titles
          </h3>
          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">Concepts of Physics — Part 1 (H.C. Verma)</p>
                <p className="text-slate-400 text-[10px] mt-0.5">Accession #LIB-PHY-104 • Due Date: Oct 28, 2026</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold text-[10px]">Active Loan</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">NCERT Exemplar Problems — Mathematics VIII</p>
                <p className="text-slate-400 text-[10px] mt-0.5">Accession #LIB-MTH-082 • Due Date: Nov 05, 2026</p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold text-[10px]">Active Loan</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
