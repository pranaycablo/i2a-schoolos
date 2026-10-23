import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  Users,
  GraduationCap,
  CalendarCheck,
  CreditCard,
  BookOpen,
  Award,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  ChevronDown,
  Download,
  AlertTriangle
} from 'lucide-react';

export const ParentPortalModule: React.FC = () => {
  const {
    students,
    currentUser,
    selectedChildId,
    setSelectedChildId,
    feeReceipts,
    examPapers,
    branding,
    language
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FEES' | 'HOMEWORK' | 'RESULTS'>('OVERVIEW');

  // Determine authorized linked children
  const linkedChildIds: string[] = currentUser?.childrenIds || (currentUser?.studentId ? [currentUser.studentId] : []);
  
  // Find linked student records from school state
  const linkedStudents = students.filter((s) => linkedChildIds.includes(s.id));

  // Empty state if no children are linked
  if (linkedChildIds.length === 0 || linkedStudents.length === 0) {
    return (
      <div className="p-8 max-w-3xl mx-auto my-12 text-center space-y-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="inline-flex p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
          <AlertCircle className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            {language === 'hi' ? 'कोई लिंक किया गया छात्र प्रोफ़ाइल नहीं मिला' : 'No Linked Student Profile Found'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
            {language === 'hi'
              ? 'वर्तमान में इस अभिभावक खाते से कोई छात्र संबद्ध नहीं है। कृपया अपने वार्ड के प्रवेश क्रमांक के साथ विद्यालय प्रशासन से संपर्क करें।'
              : 'No student profiles are currently linked to this parent/guardian account. Please contact the school administrative desk with your child\'s admission number to link your profile.'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto space-y-2 text-left">
          <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Phone className="w-4 h-4 text-indigo-500" /> Administrative Support Desk
          </p>
          <p>School: <span className="font-semibold text-slate-900 dark:text-white">{branding.name}</span></p>
          <p>Phone: <span className="font-semibold">{branding.phone || '+91 11 4567 8900'}</span></p>
          <p>Email: <span className="font-semibold">{branding.email || 'support@schoolos.com'}</span></p>
        </div>
      </div>
    );
  }

  // Active student object (scoped to selected child)
  const activeStudent = linkedStudents.find((s) => s.id === selectedChildId) || linkedStudents[0];

  // Scoped fees for active child
  const childReceipts = feeReceipts.filter((r) => r.studentId === activeStudent.id || r.admissionNo === activeStudent.admissionNo);
  const totalPaid = childReceipts.reduce((sum, r) => sum + r.paidAmount, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-2">
              <GraduationCap className="w-3.5 h-3.5" /> Parent & Family Portal
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              Welcome, {currentUser?.name || 'Parent / Guardian'}
            </h1>
            <p className="text-xs text-indigo-200 mt-1">
              Institutional academic overview, attendance tracking, and digital fee desk for your ward(s).
            </p>
          </div>

          {/* Child Selector Dropdown */}
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/20 min-w-[260px]">
            <label className="block text-[11px] font-semibold text-indigo-200 mb-1">
              Select Ward / Child ({linkedStudents.length} Linked):
            </label>
            <div className="relative">
              <select
                value={activeStudent.id}
                onChange={(e) => setSelectedChildId(e.target.value)}
                className="w-full bg-slate-900/90 text-white text-xs font-bold py-2 px-3 rounded-xl border border-indigo-400/40 outline-none cursor-pointer appearance-none pr-8"
              >
                {linkedStudents.map((child) => (
                  <option key={child.id} value={child.id} className="bg-slate-900 text-white">
                    {child.name} — Adm #{child.admissionNo} ({child.className}-{child.section})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-indigo-300 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* Ward Profile & Quick Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Class & Roll</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              {activeStudent.className}-{activeStudent.section} (#{activeStudent.rollNo})
            </p>
            <p className="text-[10px] text-slate-500">Adm #{activeStudent.admissionNo}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <CalendarCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Attendance Rate</p>
            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {activeStudent.attendanceRate}%
            </p>
            <p className="text-[10px] text-slate-500">Status: Regular Attendance</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Total Fee Paid</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              ₹{totalPaid.toLocaleString()}
            </p>
            <p className="text-[10px] text-slate-500">{childReceipts.length} Verified Receipts</p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase">Academic Standing</p>
            <p className="text-base font-extrabold text-slate-900 dark:text-white">
              Grade A (88.4%)
            </p>
            <p className="text-[10px] text-slate-500">Term 1 Complete</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {(['OVERVIEW', 'FEES', 'HOMEWORK', 'RESULTS'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {tab === 'OVERVIEW' && 'Academic Overview'}
            {tab === 'FEES' && `Fee Ledger (${childReceipts.length})`}
            {tab === 'HOMEWORK' && 'Homework & Tasks'}
            {tab === 'RESULTS' && 'Report Cards & Exams'}
          </button>
        ))}
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-indigo-600" /> Attendance Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Present Days:</span>
                <span className="font-bold text-emerald-600">84 Days</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Excused Leaves:</span>
                <span className="font-bold text-amber-600">3 Days</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Unexcused Absences:</span>
                <span className="font-bold text-rose-600">1 Day</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-500 h-2.5 rounded-full" style={{ width: `${activeStudent.attendanceRate}%` }}></div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-indigo-600" /> School Notice Board
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white">Upcoming Parent-Teacher Meeting (PTM)</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Saturday, October 25, 2026 • 09:00 AM to 01:00 PM</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <p className="font-bold text-slate-900 dark:text-white">Annual Sports Meet Registrations Open</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Entries for athletics and team events close Friday.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Fees */}
      {activeTab === 'FEES' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Fee Receipts for {activeStudent.name} (Admission #{activeStudent.admissionNo})
            </h3>
            <span className="text-xs text-slate-500">100% Audited Digital Invoices</span>
          </div>

          {childReceipts.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No fee receipts found for this student.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5">Receipt #</th>
                    <th>Payment Date</th>
                    <th>Mode</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {childReceipts.map((rcp) => (
                    <tr key={rcp.id}>
                      <td className="py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{rcp.receiptNo}</td>
                      <td>{rcp.paymentDate}</td>
                      <td><span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-semibold">{rcp.paymentMode}</span></td>
                      <td className="font-extrabold text-slate-900 dark:text-white">₹{rcp.paidAmount.toLocaleString()}</td>
                      <td><span className="px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">PAID</span></td>
                      <td>
                        <button
                          type="button"
                          onClick={() => alert(`Printing official school receipt ${rcp.receiptNo} for ${activeStudent.name}`)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold text-[11px] hover:bg-indigo-100"
                        >
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Homework */}
      {activeTab === 'HOMEWORK' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Homework Assigned to {activeStudent.className}-{activeStudent.section}
          </h3>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-indigo-600">Mathematics</span>
                <p className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">Linear Equations — Exercises 3.1 & 3.2</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Due: Tomorrow by 08:30 AM</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-xs font-bold">Submitted</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-600">Science</span>
                <p className="font-bold text-xs text-slate-900 dark:text-white mt-0.5">Microorganisms Lab Observation Report</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Due: Friday by 04:00 PM</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 text-xs font-bold">Pending Submission</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Results */}
      {activeTab === 'RESULTS' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Verified Examination Results for {activeStudent.name}
          </h3>
          <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/40 dark:bg-indigo-950/20">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-extrabold text-sm text-slate-900 dark:text-white">Term 1 Summative Assessment 2026</p>
                <p className="text-xs text-slate-500">Board: {branding.board} Curriculum</p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-xs font-bold">88.4% — Distinction</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900">
                <p className="text-slate-400 text-[10px]">Mathematics</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">92 / 100</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900">
                <p className="text-slate-400 text-[10px]">Science</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">89 / 100</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900">
                <p className="text-slate-400 text-[10px]">English</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">85 / 100</p>
              </div>
              <div className="p-2 rounded-lg bg-white dark:bg-slate-900">
                <p className="text-slate-400 text-[10px]">Social Science</p>
                <p className="font-bold text-slate-800 dark:text-slate-200">88 / 100</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
