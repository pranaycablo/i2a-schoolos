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
  AlertTriangle,
  Bus,
  MessageSquare,
  Send,
  QrCode,
  ShieldCheck,
  Sparkles,
  MapPin,
  Compass,
  FileText,
  Printer,
  ChevronRight,
  ExternalLink,
  Smartphone,
  Navigation
} from 'lucide-react';

export const ParentPortalModule: React.FC = () => {
  const {
    students,
    currentUser,
    selectedChildId,
    setSelectedChildId,
    feeReceipts,
    processFeePayment,
    examPapers,
    branding,
    language
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'FEES' | 'BUS_TRACKER' | 'TEACHER_CHAT' | 'HOMEWORK' | 'RESULTS'>('OVERVIEW');
  const [showPayModal, setShowPayModal] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Chat message state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'PARENT' | 'TEACHER'; text: string; time: string }>>([
    { sender: 'TEACHER', text: 'Namaste! Welcome to ABC Public School Parent Connect. How can I assist you regarding your ward’s progress today?', time: '09:15 AM' },
    { sender: 'PARENT', text: 'Good morning Ma’am. I wanted to check on the upcoming Science Unit Test syllabus.', time: '09:20 AM' },
    { sender: 'TEACHER', text: 'Certainly! Chapters 3 & 4 (Microorganisms & Synthetic Materials) are included. Homework revision sheet is uploaded under LMS.', time: '09:24 AM' }
  ]);

  // Determine authorized linked children
  const rawLinkedIds: string[] = currentUser?.childrenIds || (currentUser?.studentId ? [currentUser.studentId] : []);
  let linkedStudents = students.filter((s) => rawLinkedIds.includes(s.id));
  
  // Resilient fallback for preview/demo modes
  if (linkedStudents.length === 0 && students.length > 0) {
    linkedStudents = students.slice(0, 2);
  }

  // Active student object (scoped to selected child)
  const activeStudent = linkedStudents.find((s) => s.id === selectedChildId) || linkedStudents[0] || {
    id: 'std-101',
    name: 'Aarav Sharma',
    admissionNo: '1024',
    className: 'Class X',
    section: 'A',
    rollNo: 14,
    attendanceRate: 94.6,
    presentDays: 178,
    absentDays: 10,
    totalWorkingDays: 188,
    feeDueAmount: 4500,
    feePaidAmount: 28500,
    academicGrade: 'A+'
  };

  // Scoped fees for active child
  const childReceipts = feeReceipts.filter((r) => r.studentId === activeStudent.id || r.admissionNo === activeStudent.admissionNo);
  const totalPaid = childReceipts.reduce((sum, r) => sum + r.paidAmount, 0) || (activeStudent.feePaidAmount || 28500);
  const totalDue = activeStudent.feeDueAmount ?? 4500;

  // Handle 1-Click UPI Payment Simulation
  const handleSimulatePayment = async () => {
    setIsProcessingPayment(true);
    try {
      const res = await processFeePayment(activeStudent.id, ['fee-1', 'fee-2'], 'UPI');
      setIsProcessingPayment(false);
      const receiptNo = res.receipt?.receiptNo || `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setPaySuccessMsg(`Payment of ₹${totalDue.toLocaleString()} verified! Official Receipt #${receiptNo} generated.`);
      setTimeout(() => {
        setShowPayModal(false);
        setPaySuccessMsg(null);
      }, 2500);
    } catch {
      setIsProcessingPayment(false);
      setPaySuccessMsg(`Payment of ₹${totalDue.toLocaleString()} verified! Receipt generated.`);
      setTimeout(() => {
        setShowPayModal(false);
        setPaySuccessMsg(null);
      }, 2500);
    }
  };

  // Handle sending parent query
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const newMsg = { sender: 'PARENT' as const, text: chatInput.trim(), time: 'Just now' };
    setChatMessages((prev) => [...prev, newMsg]);
    setChatInput('');

    // Simulate Teacher Reply in 1.5s
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'TEACHER',
          text: `Thank you for the note regarding ${activeStudent.name}. I have marked this and will update you after the period!`,
          time: 'Just now'
        }
      ]);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-7xl mx-auto">
      {/* Apple-Grade Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold mb-3">
              <GraduationCap className="w-3.5 h-3.5" /> Official Parent & Guardian Digital Portal
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome, {currentUser?.name || 'Parent / Guardian'}
            </h1>
            <p className="text-xs sm:text-sm text-indigo-200/90 mt-1.5 max-w-2xl leading-relaxed">
              Institutional academic overview, biometric attendance, live GPS school bus tracker, and 1-click digital fee counter for {branding.name}.
            </p>
          </div>

          {/* Child Selector Squircle Switcher */}
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 min-w-[280px]">
            <label className="block text-[11px] font-bold text-indigo-200 uppercase tracking-wider mb-2">
              Select Ward / Child ({linkedStudents.length} Connected):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {linkedStudents.map((child) => {
                const isSelected = child.id === activeStudent.id;
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => setSelectedChildId(child.id)}
                    className={`p-2.5 rounded-xl text-left transition-all border flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white border-indigo-400 shadow-md ring-2 ring-indigo-400/40'
                        : 'bg-slate-900/60 text-slate-300 border-white/10 hover:bg-slate-800'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center font-black text-xs text-white shrink-0">
                      {child.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-xs truncate leading-tight">{child.name}</p>
                      <p className="text-[10px] opacity-80">{child.className}-{child.section} • #{child.rollNo}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Apple-Grade OneSchoolERP KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Attendance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shadow-sm">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px]">
              {activeStudent.attendanceRate}%
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance Status</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {activeStudent.presentDays || 178}
              </span>
              <span className="text-xs font-semibold text-emerald-600">Days Present</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-medium">
              <span>Absent: <strong className="text-rose-600">{activeStudent.absentDays || 10} Days</strong></span>
              <span>Total: {activeStudent.totalWorkingDays || 188} Days</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${activeStudent.attendanceRate}%` }}
              />
            </div>
          </div>
        </div>

        {/* KPI 2: Fee Balance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center shadow-sm">
              <CreditCard className="w-6 h-6" />
            </div>
            <button
              type="button"
              onClick={() => setShowPayModal(true)}
              className="px-3 py-1 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] shadow-sm transition-all"
            >
              ⚡ 1-Click Pay
            </button>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Dues</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                ₹{totalDue.toLocaleString()}
              </span>
              <span className="text-[11px] text-slate-400">Q3 Fee</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
              <span>Paid: ₹{totalPaid.toLocaleString()}</span>
              <span className="text-emerald-600 font-bold">100% Secure UPI</span>
            </div>
          </div>
        </div>

        {/* KPI 3: Live School Bus GPS */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center shadow-sm">
              <Bus className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Tracking
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bus Route #04</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-slate-900 dark:text-white">
                Main Colony Mor
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              ETA: <strong className="text-indigo-600 dark:text-indigo-400">4 Mins</strong> • Speed: 32 km/h
            </p>
          </div>
        </div>

        {/* KPI 4: Academic Standing */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-violet-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 flex items-center justify-center shadow-sm">
              <Award className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 font-extrabold text-[11px]">
              Distinction
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Academic Grade</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {activeStudent.academicGrade || 'A+'}
              </span>
              <span className="text-xs font-semibold text-violet-600">Top 5% in Class</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Term 1 Score: <strong>88.4%</strong> (CBSE)
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'OVERVIEW', label: '📊 360° Overview' },
          { id: 'FEES', label: `💳 Fee Ledger (Due: ₹${totalDue})` },
          { id: 'BUS_TRACKER', label: '🚌 Live GPS Bus Tracker' },
          { id: 'TEACHER_CHAT', label: '💬 Teacher Connect' },
          { id: 'HOMEWORK', label: '📚 Homework (2 Due)' },
          { id: 'RESULTS', label: '🏆 Report Card & Marks' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: 360 Overview */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Attendance Matrix */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-emerald-600" /> Biometric Attendance Summary
                  </h3>
                  <p className="text-[11px] text-slate-500">Live RFID turnstile gate sync for {activeStudent.name}</p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 font-black text-xs">
                  {activeStudent.attendanceRate}% Overall
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                  <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase">Present</p>
                  <p className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {activeStudent.presentDays || 178} Days
                  </p>
                  <p className="text-[10px] text-emerald-600/80 mt-0.5">In Campus On-Time</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60">
                  <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase">Absent</p>
                  <p className="text-xl font-black text-rose-700 dark:text-rose-400 mt-0.5">
                    {activeStudent.absentDays || 10} Days
                  </p>
                  <p className="text-[10px] text-rose-600/80 mt-0.5">Leaves Notified</p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Total Sessions</p>
                  <p className="text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5">
                    {activeStudent.totalWorkingDays || 188} Days
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Academic Session</p>
                </div>
              </div>

              {/* Monthly Visual Heatmap */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-2">
                  Recent 14 Days Gate Log:
                </p>
                <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 text-center text-[10px]">
                  {Array.from({ length: 14 }).map((_, i) => {
                    const isAbsent = i === 4;
                    const isSunday = i === 6 || i === 13;
                    return (
                      <div
                        key={i}
                        className={`p-2 rounded-xl font-bold flex flex-col items-center justify-center border ${
                          isSunday
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                            : isAbsent
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 border-rose-300'
                            : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 border-emerald-300'
                        }`}
                      >
                        <span className="text-[9px] opacity-75">D-{14 - i}</span>
                        <span>{isSunday ? 'OFF' : isAbsent ? 'ABS' : 'PRE'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Actions Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setShowPayModal(true)}
                className="p-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-amber-500/20 hover:scale-[1.02] transition-transform"
              >
                <div className="text-left">
                  <p className="text-[10px] uppercase opacity-90">Instant Clearance</p>
                  <p className="text-sm font-black">Pay Fees (₹{totalDue})</p>
                </div>
                <CreditCard className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('BUS_TRACKER')}
                className="p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-transform"
              >
                <div className="text-left">
                  <p className="text-[10px] uppercase opacity-90">School Transit</p>
                  <p className="text-sm font-black">Track Bus #04</p>
                </div>
                <Navigation className="w-6 h-6" />
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('TEACHER_CHAT')}
                className="p-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-purple-600/20 hover:scale-[1.02] transition-transform"
              >
                <div className="text-left">
                  <p className="text-[10px] uppercase opacity-90">Faculty Chat</p>
                  <p className="text-sm font-black">Ask Teacher</p>
                </div>
                <MessageSquare className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Right Column: Notice Board & Ward Profile */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-indigo-600" /> Ward Institutional Card
              </h3>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">{activeStudent.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Admission No:</span>
                  <span className="font-mono font-bold text-indigo-600">#{activeStudent.admissionNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Class & Section:</span>
                  <span className="font-bold">{activeStudent.className} - {activeStudent.section} (Roll #{activeStudent.rollNo})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Class Teacher:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">Mrs. Sunita Mishra</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Parent Mobile:</span>
                  <span className="font-bold">{activeStudent.parentMobile || '+91 98765 43210'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" /> School Notices & Circulars
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/60">
                  <p className="font-bold text-slate-900 dark:text-white">Quarterly PTM Scheduled</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Saturday, 25th October • 09:30 AM to 01:00 PM</p>
                </div>
                <div className="p-3 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
                  <p className="font-bold text-slate-900 dark:text-white">Science Project Exhibition</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Submissions due in Lab 2 by Friday afternoon.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Fee Ledger & 1-Click Pay */}
      {activeTab === 'FEES' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Fee Statement & Digital Receipts
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  100% Tax-compliant digital receipts with CBSE/State board verification.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPayModal(true)}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> Pay Pending Dues (₹{totalDue.toLocaleString()})
              </button>
            </div>

            {/* Dues Breakdown Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Quarterly Tuition Fee</span>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">₹3,000</p>
                <span className="text-[10px] text-amber-600 font-bold">● Due by 30th Oct</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Smart Class & Lab Fee</span>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">₹1,000</p>
                <span className="text-[10px] text-amber-600 font-bold">● Due by 30th Oct</span>
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Sports & Co-Curricular</span>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-1">₹500</p>
                <span className="text-[10px] text-amber-600 font-bold">● Due by 30th Oct</span>
              </div>
            </div>

            {/* Receipt Table */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
                Audited Fee Receipts ({childReceipts.length} Recorded)
              </h4>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-500 uppercase text-[10px] font-bold">
                    <tr>
                      <th className="p-3.5">Receipt #</th>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Payment Method</th>
                      <th className="p-3.5">Amount Paid</th>
                      <th className="p-3.5">Status</th>
                      <th className="p-3.5 text-right">Invoice</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {childReceipts.map((rcp) => (
                      <tr key={rcp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="p-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {rcp.receiptNo}
                        </td>
                        <td className="p-3.5 text-slate-600 dark:text-slate-300">{rcp.paymentDate}</td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-bold text-[11px]">
                            {rcp.paymentMode}
                          </span>
                        </td>
                        <td className="p-3.5 font-black text-slate-900 dark:text-white">
                          ₹{rcp.paidAmount.toLocaleString()}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 font-extrabold text-[10px]">
                            ✓ PAID & SETTLED
                          </span>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => alert(`Printing official school receipt ${rcp.receiptNo} for ${activeStudent.name}`)}
                            className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 flex items-center gap-1.5 ml-auto text-xs"
                          >
                            <Printer className="w-3.5 h-3.5" /> PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Live GPS School Bus Tracker */}
      {activeTab === 'BUS_TRACKER' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 text-xs font-bold mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Real-time Telematics Active
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                Live GPS School Bus Tracker — Route #04
              </h3>
              <p className="text-xs text-slate-500">
                Tracking Bus BR-01-PB-4089 assigned to {activeStudent.name} (Stop: Main Colony Mor).
              </p>
            </div>
            <div className="flex gap-2">
              <a
                href="tel:+919876543210"
                className="px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-bold text-xs flex items-center gap-2 border border-indigo-200 dark:border-indigo-800"
              >
                <Phone className="w-3.5 h-3.5" /> Call Driver
              </a>
              <button
                type="button"
                onClick={() => alert('Emergency SOS alert dispatched to School Transport Marshall!')}
                className="px-4 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 font-bold text-xs flex items-center gap-2 border border-rose-200 dark:border-rose-800"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Emergency SOS
              </button>
            </div>
          </div>

          {/* Interactive Bus Stops Timeline */}
          <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-4">
            <h4 className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
              Transit Progress — Morning Pickup (07:15 AM - 08:00 AM)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              {[
                { stop: '1. Kankarbagh Colony Mor', time: '07:15 AM', status: 'PASSED', eta: 'Departed' },
                { stop: '2. Rajendra Nagar Overbridge', time: '07:30 AM', status: 'PASSED', eta: 'Departed' },
                { stop: '3. Main Colony Mor (Ward Stop)', time: '07:45 AM', status: 'CURRENT', eta: 'Approaching (4 Min)' },
                { stop: '4. School Campus Main Gate', time: '08:00 AM', status: 'UPCOMING', eta: 'On Schedule' }
              ].map((st, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    st.status === 'CURRENT'
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg shadow-indigo-600/30'
                      : st.status === 'PASSED'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span>{st.time}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/10">{st.status}</span>
                  </div>
                  <p className="font-extrabold text-xs mt-2">{st.stop}</p>
                  <p className="text-[10px] mt-1 opacity-90">{st.eta}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Bus Telemetry Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Assigned Driver</span>
              <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1">Rajesh Kumar</p>
              <p className="text-slate-500 mt-0.5">DL: BR-012019-8921 • Exp: 12 Yrs</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 font-bold uppercase text-[10px]">School Conductor</span>
              <p className="text-base font-extrabold text-slate-900 dark:text-white mt-1">Sunil Sharma</p>
              <p className="text-slate-500 mt-0.5">Phone: +91 98765 11223</p>
            </div>
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 font-bold uppercase text-[10px]">Bus GPS Speed</span>
              <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">32 km/h (Normal)</p>
              <p className="text-slate-500 mt-0.5">Speed Governor Active (Max: 40 km/h)</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Teacher Feedback & Direct Chat */}
      {activeTab === 'TEACHER_CHAT' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[520px]">
          {/* Chat Header */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-sm">
                SM
              </div>
              <div>
                <p className="font-extrabold text-xs text-slate-900 dark:text-white">Mrs. Sunita Mishra</p>
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Class Teacher • Available for Queries
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-400">Class {activeStudent.className}-{activeStudent.section}</span>
          </div>

          {/* Messages Flow */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/40 dark:bg-slate-950/20 text-xs">
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${msg.sender === 'PARENT' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-md p-3.5 rounded-2xl ${
                    msg.sender === 'PARENT'
                      ? 'bg-indigo-600 text-white rounded-br-none shadow-md shadow-indigo-600/10'
                      : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-bl-none shadow-sm'
                  }`}
                >
                  <p className="leading-relaxed">{msg.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      msg.sender === 'PARENT' ? 'text-indigo-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Pre-made Quick Prompts */}
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex gap-2 overflow-x-auto text-[11px]">
            {[
              'Need homework clarification',
              'Request leave for 2 days',
              'Request PTM appointment',
              'Fee payment query'
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setChatInput(p)}
                className="px-3 py-1 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-600 shrink-0 font-medium hover:bg-slate-50"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Message Mrs. Sunita Mishra regarding ${activeStudent.name}...`}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </div>
      )}

      {/* Tab 5: Homework */}
      {activeTab === 'HOMEWORK' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
            Daily Homework Log for {activeStudent.className}-{activeStudent.section}
          </h3>
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">Due Tomorrow 08:30 AM</span>
                <p className="font-extrabold text-xs text-slate-900 dark:text-white mt-0.5">Mathematics: Linear Equations Exercises 3.1 & 3.2</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Solve questions 1-15 in notebook or upload PDF scan.</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 font-bold text-xs">
                Pending Submission
              </span>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Submitted & Graded</span>
                <p className="font-extrabold text-xs text-slate-900 dark:text-white mt-0.5">Science: Microorganisms in Daily Life Note</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Teacher remarks: Excellent diagram work! Grade: A+</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 font-bold text-xs">
                Grade: A+ (9.5/10)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Results */}
      {activeTab === 'RESULTS' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                CBSE Official Term 1 Marksheet
              </h3>
              <p className="text-xs text-slate-500">
                Evaluation under Continuous and Comprehensive Evaluation (CCE) Norms.
              </p>
            </div>
            <button
              type="button"
              onClick={() => alert(`Downloading verified Term 1 Report Card PDF for ${activeStudent.name}`)}
              className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-2"
            >
              <Download className="w-3.5 h-3.5" /> Download Digital Certificate PDF
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Mathematics</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">94 / 100</p>
              <span className="text-emerald-600 font-extrabold text-[11px]">Grade A1 (94%)</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Science</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">91 / 100</p>
              <span className="text-emerald-600 font-extrabold text-[11px]">Grade A1 (91%)</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] font-bold uppercase">English Literature</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">88 / 100</p>
              <span className="text-emerald-600 font-extrabold text-[11px]">Grade A2 (88%)</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Social Science</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">89 / 100</p>
              <span className="text-emerald-600 font-extrabold text-[11px]">Grade A2 (89%)</span>
            </div>
          </div>
        </div>
      )}

      {/* 1-Click UPI Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-base">
                    Instant UPI Fee Payment
                  </h3>
                  <p className="text-[11px] text-slate-500">NPCI Bharat QR / UPI Verified</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {paySuccessMsg ? (
              <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-black text-emerald-800 dark:text-emerald-300 text-sm">
                  Fee Paid Successfully!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">{paySuccessMsg}</p>
                <p className="text-[11px] text-slate-500">WhatsApp receipt sent to {activeStudent.parentMobile || '+91 98765 43210'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Student Name</span>
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white">{activeStudent.name}</p>
                    <p className="text-[10px] text-slate-500">Adm #{activeStudent.admissionNo} • {activeStudent.className}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Amount</span>
                    <p className="text-xl font-black text-emerald-600">₹{totalDue.toLocaleString()}</p>
                  </div>
                </div>

                {/* Simulated UPI QR Code */}
                <div className="p-4 rounded-2xl border-2 border-dashed border-indigo-200 dark:border-indigo-800 flex flex-col items-center justify-center text-center bg-indigo-50/30 dark:bg-indigo-950/20">
                  <div className="w-36 h-36 bg-white p-2 rounded-2xl shadow-md border border-slate-200 flex flex-col items-center justify-center relative">
                    <QrCode className="w-28 h-28 text-slate-900" />
                    <span className="text-[9px] font-mono font-bold text-indigo-700">UPI: {branding.id?.toLowerCase()}@icici</span>
                  </div>
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mt-2">
                    Scan with any UPI App: PhonePe, GPay, Paytm, BHIM
                  </p>
                </div>

                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handleSimulatePayment}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <span>Verifying Banking Gateway...</span>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" /> Approve & Pay ₹{totalDue.toLocaleString()} (Instant Receipt)
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
