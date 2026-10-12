import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  LayoutDashboard,
  Bot,
  Sparkles,
  TrendingUp,
  Users,
  CreditCard,
  GraduationCap,
  Send,
  UserPlus,
  ShieldCheck,
  Building2,
  CalendarCheck,
  BookOpen,
  FileQuestion,
  Award,
  CheckCircle2,
  Clock,
  ArrowRight,
  User,
  Check,
  Download,
  AlertCircle
} from 'lucide-react';

export const PrincipalAIDashboardModule: React.FC = () => {
  const {
    branding,
    currentRole,
    students,
    feeReceipts,
    admissions,
    examPapers,
    expenses,
    setActiveModule
  } = useSchool();

  const [aiQuery, setAiQuery] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState<{ query: string; response: string }[]>([
    {
      query: 'इस महीने fee collection कितना है?',
      response: `${branding.name} में कुल ₹${feeReceipts.reduce((a, r) => a + r.paidAmount, 0).toLocaleString()} का collection दर्ज हुआ है। 100% raseedein automatically verified!`
    }
  ]);

  const totalStudents = students.length;
  const totalFeeCollected = feeReceipts.reduce((acc, r) => acc + r.paidAmount, 0);
  const pendingAdmissionsCount = admissions.filter((a) => a.status !== 'ENROLLED').length;
  const avgAttendance = (students.reduce((acc, s) => acc + s.attendanceRate, 0) / (totalStudents || 1)).toFixed(1);

  const sampleQueries = [
    'इस महीने fee collection कितना है?',
    'किस class की attendance सबसे कम है?',
    'Class VIII Science में कौन से chapters कमजोर हैं?',
    'कितनी fee pending है?'
  ];

  const handleAskAI = (queryText: string) => {
    if (!queryText.trim()) return;

    let res = '';
    if (queryText.includes('fee collection') || queryText.includes('कलेक्शन')) {
      res = `वर्तमान एकेडमिक सेशन में कुल Fee Collection ₹${totalFeeCollected.toLocaleString()} रहा है। सभी रसीदें PDF और WhatsApp के साथ भेजी जा चुकी हैं।`;
    } else if (queryText.includes('attendance') || queryText.includes('उपस्थिति')) {
      res = `स्कूल का औसत Attendance ${avgAttendance}% है। Class X Section B का अटेंडेंस 82.0% है, जो निर्धारित 85% थ्रेसहोल्ड से कम होने के कारण पेरेंट्स को ऑटो-अलर्ट भेजा गया है।`;
    } else if (queryText.includes('कमजोर') || queryText.includes('weak') || queryText.includes('Chapter')) {
      res = `AI Diagnostic Engine के अनुसार Class VIII Science Chapter 2 (Microorganisms) में स्टूडेंट्स का एवरेज स्कोर 65% रहा है। अतिरिक्त प्रैक्टिस टेस्ट रिकमेंड किया जाता है।`;
    } else {
      res = `i2A School Assistant: ${branding.name} का संपूर्ण डेटा एनालाइज्ड है। कुल ${totalStudents} सक्रिय विद्यार्थी नामांकित हैं और ${pendingAdmissionsCount} एडमिशन अप्रूवल पेंडिंग हैं।`;
    }

    setAiChatHistory((prev) => [...prev, { query: queryText, response: res }]);
    setAiQuery('');
  };

  // --- 1. TEACHER WORKSPACE DASHBOARD ---
  if (currentRole === 'TEACHER') {
    return (
      <div className="space-y-6 animate-fade-in pb-12 text-xs">
        <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
              Teacher Workspace Portal
            </span>
            <h2 className="text-2xl font-black mt-1">Welcome, Senior Faculty Member</h2>
            <p className="text-amber-100 text-xs mt-0.5">Assigned Classes: Class VIII-A, Class IX-B • Subject: Mathematics & Science</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveModule('attendance_timetable')}
              className="px-4 py-2.5 rounded-2xl bg-white text-orange-700 font-extrabold shadow-md hover:bg-slate-100 transition-colors"
            >
              Mark Attendance
            </button>
          </div>
        </div>

        {/* Teacher Quick Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveModule('attendance_timetable')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2 hover:border-amber-500 transition-all shadow-sm"
          >
            <CalendarCheck className="w-6 h-6 text-amber-500" />
            <div className="font-bold text-slate-900 dark:text-white">Attendance Entry</div>
            <div className="text-slate-400 text-[11px]">Class VIII-A Today</div>
          </button>
          <button
            onClick={() => setActiveModule('homework_learning')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2 hover:border-amber-500 transition-all shadow-sm"
          >
            <BookOpen className="w-6 h-6 text-indigo-500" />
            <div className="font-bold text-slate-900 dark:text-white">Post Homework</div>
            <div className="text-slate-400 text-[11px]">Digital Worksheets</div>
          </button>
          <button
            onClick={() => setActiveModule('examination_ai')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2 hover:border-amber-500 transition-all shadow-sm"
          >
            <Sparkles className="w-6 h-6 text-purple-500" />
            <div className="font-bold text-slate-900 dark:text-white">AI Question Generator</div>
            <div className="text-slate-400 text-[11px]">Auto Test Creator</div>
          </button>
          <button
            onClick={() => setActiveModule('examination_result_engine')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2 hover:border-amber-500 transition-all shadow-sm"
          >
            <Award className="w-6 h-6 text-emerald-500" />
            <div className="font-bold text-slate-900 dark:text-white">Enter Exam Marks</div>
            <div className="text-slate-400 text-[11px]">Grade Audit System</div>
          </button>
        </div>

        {/* Today's Schedule Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Today's Teaching Schedule (Mathematics & Science)
          </h3>

          <div className="space-y-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <span className="font-bold text-slate-900 dark:text-white">Period 1 (08:00 AM - 08:45 AM)</span>
                <p className="text-slate-500">Class VIII-A • Mathematics (Algebraic Expressions)</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                Completed
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-center justify-between">
              <div>
                <span className="font-bold text-amber-900 dark:text-amber-200">Period 3 (10:15 AM - 11:00 AM)</span>
                <p className="text-amber-700 dark:text-amber-300">Class IX-B • Physics (Laws of Motion)</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-amber-600 text-white font-bold text-[10px] animate-pulse">
                In Progress
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. ACCOUNTANT WORKSPACE DASHBOARD ---
  if (currentRole === 'ACCOUNTANT') {
    return (
      <div className="space-y-6 animate-fade-in pb-12 text-xs">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
              Accountant Finance Workspace
            </span>
            <h2 className="text-2xl font-black mt-1">School Accounts & Fee Ledger</h2>
            <p className="text-emerald-100 text-xs mt-0.5">Automated Receipts, UPI Reconciliation & Expense Tracking</p>
          </div>

          <button
            onClick={() => setActiveModule('fee_management')}
            className="px-4 py-2.5 rounded-2xl bg-white text-emerald-800 font-extrabold shadow-md hover:bg-slate-100 transition-colors"
          >
            Process Fee Payment
          </button>
        </div>

        {/* Finance KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Verified Collection</span>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{totalFeeCollected.toLocaleString()}</h3>
            <p className="text-slate-500 text-[10px]">100% Audited Digital Receipts</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Total Fee Receipts Issued</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{feeReceipts.length}</h3>
            <p className="text-indigo-600 text-[10px]">WhatsApp Receipts Enabled</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase">School Expenses Logged</span>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">₹{expenses.reduce((a, e) => a + e.amount, 0).toLocaleString()}</h3>
            <p className="text-slate-500 text-[10px]">Utility & Maintenance Costs</p>
          </div>
        </div>

        {/* Recent Receipts Table Preview */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" /> Recent Digital Fee Receipts
            </h3>
            <button
              onClick={() => setActiveModule('fee_management')}
              className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
            >
              View All Ledger &rarr;
            </button>
          </div>

          <div className="space-y-2">
            {feeReceipts.slice(0, 3).map((r) => (
              <div key={r.id} className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">{r.studentName} ({r.className})</span>
                  <p className="text-slate-500 text-[11px]">Receipt #{r.receiptNo} • Paid via {r.paymentMode}</p>
                </div>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹{r.paidAmount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- 3. STUDENT WORKSPACE DASHBOARD ---
  if (currentRole === 'STUDENT') {
    const studentObj = students[0] || { name: 'Rahul Kumar', className: 'Class VIII', section: 'A', rollNo: '01', attendanceRate: 94.5 };
    return (
      <div className="space-y-6 animate-fade-in pb-12 text-xs">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center font-bold text-xl text-white">
              {studentObj.name.charAt(0)}
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase">
                Student Portal
              </span>
              <h2 className="text-2xl font-black mt-0.5">{studentObj.name}</h2>
              <p className="text-purple-100 text-xs">{studentObj.className} Section {studentObj.section} • Roll No. {studentObj.rollNo}</p>
            </div>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 font-bold text-xs">
            Attendance: <span className="text-emerald-300 font-extrabold">{studentObj.attendanceRate}%</span>
          </div>
        </div>

        {/* Student Quick Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveModule('homework_learning')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2 hover:border-purple-500 transition-all shadow-sm"
          >
            <BookOpen className="w-6 h-6 text-purple-500" />
            <div className="font-bold text-slate-900 dark:text-white">My Homework</div>
            <div className="text-slate-400 text-[11px]">2 Pending Assignments</div>
          </button>
          <button
            onClick={() => setActiveModule('digital_books_ai')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2 hover:border-purple-500 transition-all shadow-sm"
          >
            <BookOpen className="w-6 h-6 text-indigo-500" />
            <div className="font-bold text-slate-900 dark:text-white">Digital NCERT Books</div>
            <div className="text-slate-400 text-[11px]">Read & AI Practice</div>
          </button>
          <button
            onClick={() => setActiveModule('examination_result_engine')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2 hover:border-purple-500 transition-all shadow-sm"
          >
            <Award className="w-6 h-6 text-emerald-500" />
            <div className="font-bold text-slate-900 dark:text-white">My Report Cards</div>
            <div className="text-slate-400 text-[11px]">View Grade Sheet</div>
          </button>
          <button
            onClick={() => setActiveModule('timetable_engine')}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-left space-y-2 hover:border-purple-500 transition-all shadow-sm"
          >
            <Clock className="w-6 h-6 text-amber-500" />
            <div className="font-bold text-slate-900 dark:text-white">Class Timetable</div>
            <div className="text-slate-400 text-[11px]">Today's Schedule</div>
          </button>
        </div>
      </div>
    );
  }

  // --- 4. PARENT PORTAL WORKSPACE DASHBOARD ---
  if (currentRole === 'PARENT') {
    const child = students[0] || { name: 'Rahul Kumar', className: 'Class VIII', section: 'A', attendanceRate: 94.5 };
    return (
      <div className="space-y-6 animate-fade-in pb-12 text-xs">
        <div className="bg-gradient-to-r from-cyan-700 to-blue-600 text-white p-6 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase">
              Parent Guardian Portal
            </span>
            <h2 className="text-2xl font-black mt-1">Child Progress & School Connect</h2>
            <p className="text-cyan-100 text-xs">Linked Child: <span className="font-bold text-white">{child.name} ({child.className})</span></p>
          </div>

          <div className="px-4 py-2 rounded-2xl bg-white/10 border border-white/20 font-bold text-xs">
            Child Attendance: <span className="text-emerald-300 font-extrabold">{child.attendanceRate}%</span>
          </div>
        </div>

        {/* Parent Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div
            onClick={() => setActiveModule('fee_management')}
            className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-cyan-500 transition-all"
          >
            <CreditCard className="w-6 h-6 text-cyan-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">Fee Invoices & Receipts</h3>
            <p className="text-slate-400 text-[11px]">Download official PDF fee receipts & check dues</p>
          </div>
          <div
            onClick={() => setActiveModule('examination_result_engine')}
            className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-cyan-500 transition-all"
          >
            <Award className="w-6 h-6 text-emerald-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">Report Cards & Marks</h3>
            <p className="text-slate-400 text-[11px]">View Term performance & teacher comments</p>
          </div>
          <div
            onClick={() => setActiveModule('homework_learning')}
            className="cursor-pointer bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2 hover:border-cyan-500 transition-all"
          >
            <BookOpen className="w-6 h-6 text-indigo-500" />
            <h3 className="font-bold text-slate-900 dark:text-white">Homework Submission Tracker</h3>
            <p className="text-slate-400 text-[11px]">Ensure daily homework assignments are submitted</p>
          </div>
        </div>
      </div>
    );
  }

  // --- 5. PRINCIPAL & SUPER ADMIN COMMAND CENTER ---
  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <LayoutDashboard className="w-4 h-4" /> Principal Command Center
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Real-Time School Operating KPIs & AI Assistant
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized decision dashboard: Financial collection, attendance alerts, exam pass rates & conversational AI inquiry.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> SaaS Cloud System Health: 100% Operational
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase">Total Fee Collection</span>
            <CreditCard className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">₹{totalFeeCollected.toLocaleString()}</h3>
          <p className="text-[10px] text-emerald-600 font-semibold">↑ Auto Reconciled via Gateways</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase">Active Students</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{totalStudents}</h3>
          <p className="text-[10px] text-indigo-600 font-semibold">{pendingAdmissionsCount} Admissions Awaiting Approval</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase">Avg School Attendance</span>
            <GraduationCap className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{avgAttendance}%</h3>
          <p className="text-[10px] text-amber-600 font-semibold">1 Alert Triggered (&lt;85%)</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-bold uppercase">AI Exam Papers Lock</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">{examPapers.length}</h3>
          <p className="text-[10px] text-emerald-600 font-semibold">100% Principal Verified</p>
        </div>
      </div>

      {/* AI Principal Assistant Section */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-6 rounded-3xl border border-indigo-800 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-purple-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">AI Principal Natural Language Assistant</h3>
              <p className="text-xs text-indigo-200">Ask any question in Hindi / English regarding fees, attendance, results or financial health.</p>
            </div>
          </div>
          <span className="text-[10px] bg-purple-900/80 text-purple-300 px-3 py-1 rounded-full font-extrabold border border-purple-700">
            Powered by i2A AI Core
          </span>
        </div>

        {/* Sample Hindi Prompts */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-slate-400 text-[11px] self-center font-medium">त्वरित प्रश्न (Quick Prompts):</span>
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleAskAI(q)}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-indigo-600 text-slate-200 hover:text-white text-[11px] font-medium transition-all border border-white/10"
            >
              "{q}"
            </button>
          ))}
        </div>

        {/* Chat History Messages */}
        <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
          {aiChatHistory.map((chat, idx) => (
            <div key={idx} className="space-y-2 text-xs animate-fade-in">
              <div className="flex justify-end">
                <div className="bg-indigo-600 text-white px-4 py-2.5 rounded-2xl max-w-md font-medium shadow">
                  {chat.query}
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-slate-800/90 text-slate-100 p-4 rounded-2xl max-w-lg border border-slate-700 space-y-1 shadow-md">
                  <div className="flex items-center gap-1.5 text-[10px] text-purple-400 font-bold uppercase">
                    <Sparkles className="w-3 h-3 text-amber-400" /> Authorized AI Data Response
                  </div>
                  <p className="leading-relaxed">{chat.response}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAskAI(aiQuery);
          }}
          className="flex gap-2 pt-2"
        >
          <input
            type="text"
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            placeholder="Ask Principal Assistant in Hindi e.g. इस महीने कितना fee आया..."
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-900/90 border border-slate-700 text-white text-xs focus:ring-2 focus:ring-purple-500 outline-none"
          />
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-lg shadow-purple-500/25 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" /> Ask AI
          </button>
        </form>
      </div>
    </div>
  );
};
