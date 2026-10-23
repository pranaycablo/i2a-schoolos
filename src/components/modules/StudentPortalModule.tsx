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
  Bell,
  Sparkles,
  Play,
  Send,
  HelpCircle,
  Download,
  BookMarked,
  Check,
  ChevronRight,
  Printer,
  Timer,
  Zap
} from 'lucide-react';

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export const StudentPortalModule: React.FC = () => {
  const { students, currentUser, examPapers, branding, language } = useSchool();

  const [activeTab, setActiveTab] = useState<'SCHEDULE' | 'HOMEWORK' | 'ONLINE_TEST' | 'DIGITAL_BOOKS' | 'RESULTS'>('SCHEDULE');

  // Match the logged-in student record
  const studentId = currentUser?.studentId || currentUser?.id;
  const currentStudent = students.find((s) => s.id === studentId || s.admissionNo === currentUser?.id) || students[0] || {
    id: 'std-101',
    name: currentUser?.name || 'Aarav Sharma',
    admissionNo: '1024',
    className: 'Class X',
    section: 'A',
    rollNo: 14,
    attendanceRate: 94.6,
    presentDays: 178,
    absentDays: 10,
    academicGrade: 'A+'
  };

  // --- ONLINE TEST STATE ---
  const [isTakingTest, setIsTakingTest] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [testSubmitted, setTestSubmitted] = useState(false);
  const [testScore, setTestScore] = useState<number | null>(null);

  const sampleQuestions: QuizQuestion[] = [
    {
      id: 1,
      question: 'What is the powerhouse of the cell?',
      options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'],
      correctIndex: 1
    },
    {
      id: 2,
      question: 'Which gas is released during photosynthesis?',
      options: ['Carbon Dioxide', 'Nitrogen', 'Oxygen', 'Hydrogen'],
      correctIndex: 2
    },
    {
      id: 3,
      question: 'What is the chemical formula of common salt?',
      options: ['NaCl', 'H2O', 'CO2', 'CaCO3'],
      correctIndex: 0
    }
  ];

  const handleSelectAnswer = (qIdx: number, optionIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [qIdx]: optionIdx }));
  };

  const handleSubmitTest = () => {
    let score = 0;
    sampleQuestions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        score += 1;
      }
    });
    setTestScore(score);
    setTestSubmitted(true);
  };

  const handleResetTest = () => {
    setIsTakingTest(false);
    setCurrentQuestionIdx(0);
    setSelectedAnswers({});
    setTestSubmitted(false);
    setTestScore(null);
  };

  // --- AI DOUBT SOLVER STATE ---
  const [doubtQuestion, setDoubtQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isSolvingDoubt, setIsSolvingDoubt] = useState(false);

  const handleSolveDoubt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!doubtQuestion.trim()) return;

    setIsSolvingDoubt(true);
    setAiAnswer(null);

    setTimeout(() => {
      setIsSolvingDoubt(false);
      const q = doubtQuestion.toLowerCase();
      if (q.includes('photosynthesis')) {
        setAiAnswer(
          '🌱 Photosynthesis is the biological process by which green plants convert light energy (sunlight) into chemical energy (glucose) using water (H2O) and carbon dioxide (CO2), releasing oxygen (O2) as a byproduct:\n\nFormula: 6CO2 + 6H2O + Light → C6H12O6 + 6O2'
        );
      } else if (q.includes('pythagoras') || q.includes('triangle')) {
        setAiAnswer(
          '📐 The Pythagorean Theorem states that in any right-angled triangle, the square of the hypotenuse (the side opposite the right angle) is equal to the sum of the squares of the other two sides:\n\nFormula: a² + b² = c²'
        );
      } else {
        setAiAnswer(
          `💡 Regarding "${doubtQuestion}": In CBSE Class X syllabus, this concept is explained in Chapter 4. Key Takeaways:\n1. Core principle is governed by conservation of energy.\n2. In examinations, always remember to draw the neat labeled diagram to secure full 5 marks!\n3. Practice NCERT Exemplar Question #4.`
        );
      }
    }, 900);
  };

  // --- HOMEWORK SUBMIT MODAL STATE ---
  const [submittingHwTitle, setSubmittingHwTitle] = useState<string | null>(null);
  const [hwNotes, setHwNotes] = useState('');
  const [hwSuccessMsg, setHwSuccessMsg] = useState<string | null>(null);

  const handleCompleteHomework = () => {
    setHwSuccessMsg(`Assignment "${submittingHwTitle}" submitted successfully to Subject Teacher!`);
    setTimeout(() => {
      setSubmittingHwTitle(null);
      setHwNotes('');
      setHwSuccessMsg(null);
    }, 1800);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 max-w-7xl mx-auto">
      {/* Student Welcome Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden border border-indigo-900/40">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 shadow-lg shrink-0">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-black text-2xl text-white">
                {currentStudent.name.charAt(0)}
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-[11px] font-bold mb-1">
                <GraduationCap className="w-3.5 h-3.5" /> Learner Hub & Digital Workspace
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Namaste, {currentStudent.name}!
              </h1>
              <p className="text-xs text-indigo-200/90 mt-1">
                {currentStudent.className}-{currentStudent.section} • Roll #{currentStudent.rollNo} • Admission #{currentStudent.admissionNo} • {branding.name}
              </p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 text-right shrink-0">
            <span className="block text-[10px] text-indigo-200 uppercase font-bold tracking-wider">Attendance Rate</span>
            <span className="text-2xl font-black text-white">{currentStudent.attendanceRate}%</span>
            <span className="block text-[10px] text-emerald-300 font-bold mt-0.5">
              ✓ {currentStudent.presentDays || 178} Days Present
            </span>
          </div>
        </div>
      </div>

      {/* 4 Apple-grade OneSchoolERP KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Current Session */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-extrabold text-[11px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Now
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Current Period</p>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1">Science (Physics)</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Lab 2 • Mr. Arvind Joshi (Ends 10:00 AM)</p>
          </div>
        </div>

        {/* KPI 2: Homework Status */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800 flex items-center justify-center">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-extrabold text-[11px]">
              2 Pending
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Homework LMS</p>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1">Linear Equations</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Due tomorrow by 08:30 AM</p>
          </div>
        </div>

        {/* KPI 3: Online Test */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-rose-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 flex items-center justify-center">
              <Zap className="w-6 h-6" />
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('ONLINE_TEST');
                setIsTakingTest(true);
              }}
              className="px-3 py-1 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-[11px] shadow-sm transition-all flex items-center gap-1"
            >
              <Play className="w-3 h-3 fill-current" /> Start Quiz
            </button>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chapter Assessment</p>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1">Science Mock Test</p>
            <p className="text-[11px] text-slate-500 mt-0.5">3 MCQs • Instant Scoring</p>
          </div>
        </div>

        {/* KPI 4: Digital Books & E-Library */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center">
              <BookMarked className="w-6 h-6" />
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px]">
              3 E-Books
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">NCERT Library</p>
            <p className="text-lg font-black text-slate-900 dark:text-white mt-1">Class X Syllabus</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Math, Science, Social Studies</p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'SCHEDULE', label: "🕒 Today's Timetable" },
          { id: 'HOMEWORK', label: '📝 Homework (2 Pending)' },
          { id: 'ONLINE_TEST', label: '🎯 Online Tests & Quizzes' },
          { id: 'DIGITAL_BOOKS', label: '📖 NCERT Books & AI Doubt Solver' },
          { id: 'RESULTS', label: '🏆 Marks & Report Card' }
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

      {/* Tab 1: Today's Schedule */}
      {activeTab === 'SCHEDULE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" /> Class Timetable — Tuesday
                </h3>
                <p className="text-[11px] text-slate-500">6 Periods scheduled today</p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 font-black text-xs">
                Room 204
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {[
                { time: '08:30 - 09:15 AM', subject: 'Mathematics', room: 'Room 204', teacher: 'Mrs. Sunita Mishra', status: 'COMPLETED' },
                { time: '09:15 - 10:00 AM', subject: 'Science (Physics)', room: 'Lab 2', teacher: 'Mr. Arvind Joshi', status: 'IN_PROGRESS' },
                { time: '10:00 - 10:45 AM', subject: 'English Literature', room: 'Room 204', teacher: 'Ms. Priya Sharma', status: 'UPCOMING' },
                { time: '10:45 - 11:15 AM', subject: 'Recess & Healthy Snacks Break', room: 'Dining Hall', teacher: '—', status: 'BREAK' },
                { time: '11:15 - 12:00 PM', subject: 'Social Studies (History)', room: 'Room 204', teacher: 'Mr. R. K. Gupta', status: 'UPCOMING' },
                { time: '12:00 - 12:45 PM', subject: 'Computer Science (Coding Lab)', room: 'IT Lab 1', teacher: 'Ms. Neha Verma', status: 'UPCOMING' }
              ].map((period, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all ${
                    period.status === 'IN_PROGRESS'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-600 shadow-sm ring-1 ring-indigo-400'
                      : period.status === 'BREAK'
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300'
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] font-bold text-slate-500">{period.time}</span>
                    <div>
                      <p className="text-slate-900 dark:text-white font-extrabold text-xs">{period.subject}</p>
                      <p className="text-[10px] text-slate-400">{period.room} • {period.teacher}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      period.status === 'IN_PROGRESS'
                        ? 'bg-indigo-600 text-white'
                        : period.status === 'COMPLETED'
                        ? 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        : period.status === 'BREAK'
                        ? 'bg-amber-200 dark:bg-amber-900/80 text-amber-800 dark:text-amber-200'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}
                  >
                    {period.status === 'IN_PROGRESS' ? '● CURRENT' : period.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Today's Focus & Tips */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" /> Daily Learning Tip
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                "Practice drawing ray diagrams for concave and convex mirrors before tomorrow's Physics class test!"
              </p>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-[11px]">
                <span className="text-slate-400">Teacher: Mr. Arvind Joshi</span>
                <span className="font-bold text-indigo-600">Physics Dept</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3 text-xs">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-600" /> Student Announcements
              </h3>
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800">
                <p className="font-bold text-slate-900 dark:text-white">Inter-School Science Olympiad</p>
                <p className="text-slate-500 text-[11px] mt-0.5">Registrations close Friday at Library Desk.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Homework LMS */}
      {activeTab === 'HOMEWORK' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Homework & Learning Tasks
              </h3>
              <p className="text-xs text-slate-500">Track and submit online assignments directly to your subject teachers.</p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-extrabold text-xs">
              2 Pending Submissions
            </span>
          </div>

          <div className="space-y-3">
            {/* Homework 1 */}
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">Due Tomorrow 08:30 AM</span>
                <p className="font-extrabold text-xs text-slate-900 dark:text-white mt-0.5">Mathematics: Linear Equations Exercises 3.1 & 3.2</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Solve questions 1-15 in notebook or upload PDF solution.</p>
              </div>
              <button
                type="button"
                onClick={() => setSubmittingHwTitle('Mathematics: Linear Equations Exercises 3.1 & 3.2')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 shrink-0"
              >
                Submit Homework
              </button>
            </div>

            {/* Homework 2 */}
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-700 dark:text-amber-400">Due Friday 04:00 PM</span>
                <p className="font-extrabold text-xs text-slate-900 dark:text-white mt-0.5">Social Studies: Map Work on Indian Mineral Resources</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Locate Iron Ore and Coal belts on outline map of India.</p>
              </div>
              <button
                type="button"
                onClick={() => setSubmittingHwTitle('Social Studies: Map Work on Indian Mineral Resources')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 shrink-0"
              >
                Submit Homework
              </button>
            </div>

            {/* Homework 3 - Graded */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">Completed & Graded</span>
                <p className="font-extrabold text-xs text-slate-900 dark:text-white mt-0.5">Science: Microorganisms Observation Report</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Feedback from Mr. Joshi: "Outstanding research and clear diagrams!"</p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-extrabold text-xs">
                Score: 9.5 / 10 (A+)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Online Test & Assessment */}
      {activeTab === 'ONLINE_TEST' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {!isTakingTest ? (
            <div className="text-center max-w-xl mx-auto py-8 space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-800">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                CBSE Class X Science Chapter Assessment
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                3 Multiple Choice Questions • 15 Minutes Duration • Negative Marking: None • Instant Automated Evaluation.
              </p>
              <button
                type="button"
                onClick={() => setIsTakingTest(true)}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-indigo-600/25 inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" /> Launch Online Test Now
              </button>
            </div>
          ) : testSubmitted ? (
            <div className="p-8 rounded-3xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                Test Completed!
              </h4>
              <p className="text-sm font-extrabold text-emerald-600">
                Your Score: {testScore} / {sampleQuestions.length} ({Math.round(((testScore || 0) / sampleQuestions.length) * 100)}%)
              </p>
              <p className="text-xs text-slate-500">
                Great performance! Your score has been submitted to the academic ledger and your teacher dashboard.
              </p>
              <button
                type="button"
                onClick={handleResetTest}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs"
              >
                Back to Tests Dashboard
              </button>
            </div>
          ) : (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <span className="font-extrabold text-xs text-indigo-600">
                  Question {currentQuestionIdx + 1} of {sampleQuestions.length}
                </span>
                <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5" /> 14:32 mins remaining
                </span>
              </div>

              <div className="space-y-4">
                <p className="text-base font-extrabold text-slate-900 dark:text-white">
                  {sampleQuestions[currentQuestionIdx].question}
                </p>

                <div className="space-y-2">
                  {sampleQuestions[currentQuestionIdx].options.map((opt, oIdx) => {
                    const isSelected = selectedAnswers[currentQuestionIdx] === oIdx;
                    return (
                      <button
                        key={oIdx}
                        type="button"
                        onClick={() => handleSelectAnswer(currentQuestionIdx, oIdx)}
                        className={`w-full p-4 rounded-2xl text-left text-xs font-bold transition-all border flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{opt}</span>
                        {isSelected && <Check className="w-4 h-4 text-white" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={currentQuestionIdx === 0}
                  onClick={() => setCurrentQuestionIdx((p) => p - 1)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs disabled:opacity-40"
                >
                  Previous
                </button>

                {currentQuestionIdx < sampleQuestions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentQuestionIdx((p) => p + 1)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
                  >
                    Next Question
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitTest}
                    className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/25"
                  >
                    Submit Test & Get Score
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Digital NCERT Textbooks & AI Doubt Solver */}
      {activeTab === 'DIGITAL_BOOKS' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* E-Books List */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <BookMarked className="w-4 h-4 text-indigo-600" /> NCERT Class X Digital Textbooks
            </h3>
            <div className="space-y-3">
              {[
                { title: 'Mathematics — Class X (NCERT)', chapters: 15, size: '24 MB' },
                { title: 'Science — Class X (NCERT)', chapters: 16, size: '32 MB' },
                { title: 'First Flight — English Reader', chapters: 11, size: '18 MB' },
                { title: 'India and Contemporary World — History', chapters: 8, size: '21 MB' }
              ].map((bk, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                >
                  <div>
                    <p className="font-extrabold text-slate-900 dark:text-white">{bk.title}</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">{bk.chapters} Chapters • PDF Document ({bk.size})</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => alert(`Opening digital NCERT chapter viewer for "${bk.title}"`)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Read
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AI Doubt Solver Box */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  24/7 AI Syllabus Doubt Solver
                </h3>
                <p className="text-[10px] text-slate-500">Instant explanations tailored to your CBSE Class syllabus</p>
              </div>
            </div>

            <form onSubmit={handleSolveDoubt} className="space-y-3">
              <textarea
                value={doubtQuestion}
                onChange={(e) => setDoubtQuestion(e.target.value)}
                placeholder="Ask any question, e.g. 'What is photosynthesis?' or 'Explain Pythagoras theorem'..."
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 min-h-[90px]"
              />

              <div className="flex justify-between items-center">
                <span className="text-[10px] text-slate-400">Powered by i2A Adaptive AI</span>
                <button
                  type="submit"
                  disabled={isSolvingDoubt}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" /> {isSolvingDoubt ? 'Solving...' : 'Solve Doubt'}
                </button>
              </div>
            </form>

            {aiAnswer && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 text-xs text-slate-800 dark:text-slate-200 space-y-2 whitespace-pre-line animate-fade-in">
                <div className="flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                  <CheckCircle2 className="w-4 h-4" /> AI Verified Solution:
                </div>
                <p className="leading-relaxed">{aiAnswer}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Results */}
      {activeTab === 'RESULTS' && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Academic Progress & Marksheet
              </h3>
              <p className="text-xs text-slate-500">Term 1 Official Grade Card</p>
            </div>
            <button
              type="button"
              onClick={() => alert(`Printing verified student grade card for ${currentStudent.name}`)}
              className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" /> Print Marksheet PDF
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Mathematics</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">94 / 100</p>
              <span className="text-emerald-600 font-extrabold text-[11px]">Grade A1</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Science</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">91 / 100</p>
              <span className="text-emerald-600 font-extrabold text-[11px]">Grade A1</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] font-bold uppercase">English</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">88 / 100</p>
              <span className="text-emerald-600 font-extrabold text-[11px]">Grade A2</span>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Social Science</span>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">89 / 100</p>
              <span className="text-emerald-600 font-extrabold text-[11px]">Grade A2</span>
            </div>
          </div>
        </div>
      )}

      {/* Homework Submit Modal */}
      {submittingHwTitle && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Submit Homework</h4>
              <button
                type="button"
                onClick={() => setSubmittingHwTitle(null)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold"
              >
                ✕
              </button>
            </div>

            {hwSuccessMsg ? (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">{hwSuccessMsg}</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <p className="font-bold text-slate-900 dark:text-white">{submittingHwTitle}</p>
                <textarea
                  value={hwNotes}
                  onChange={(e) => setHwNotes(e.target.value)}
                  placeholder="Type notes or solution steps here..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-3 text-xs text-slate-900 dark:text-white outline-none min-h-[80px]"
                />
                <div className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 text-center text-slate-500 text-[11px]">
                  Click or drag scan PDF / image here (Max: 15 MB)
                </div>
                <button
                  type="button"
                  onClick={handleCompleteHomework}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md"
                >
                  Submit to Subject Teacher
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
