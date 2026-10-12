import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ExaminationResultService } from '../../services/ExaminationResultService';
import type { UserSession } from '../../services/TenantSecurityService';
import type {
  Examination,
  ExamScheduleSlot,
  QuestionBankEntry,
  ExamPaperMaster,
  StudentMarksRecord,
  StudentExamResultSummary
} from '../../types';
import {
  FileQuestion,
  Award,
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  Printer,
  Plus,
  Zap,
  Users,
  Building2,
  ShieldCheck,
  Search,
  Filter,
  FileText,
  AlertTriangle,
  History,
  TrendingUp
} from 'lucide-react';

const examService = new ExaminationResultService();

export const ExaminationResultModule: React.FC = () => {
  const { branding, currentRole, students, logAction } = useSchool();
  const [activeTab, setActiveTab] = useState<
    'exam_planning' | 'question_bank' | 'marks_entry' | 'result_calculation' | 'report_card' | 'parent_portal' | 'analytics'
  >('exam_planning');

  const schoolId = branding.id || 'sch-001';

  // Filter state
  const [selectedClass, setSelectedClass] = useState<string>('Class VIII');
  const [selectedExamId, setSelectedExamId] = useState<string>('ex-2026-term1');

  const session: UserSession = {
    id: currentRole === 'STUDENT' ? 'std-101' : 'usr-principal',
    email: 'admin@school.com',
    tenantId: schoolId,
    role: currentRole,
    status: 'ACTIVE',
    childrenIds: ['std-101']
  };

  // State Collections
  const [resultsList, setResultsList] = useState<StudentExamResultSummary[]>(() =>
    examService.getAllSchoolResults(schoolId, session)
  );

  // New Exam Form State
  const [newExamName, setNewExamName] = useState<string>('');
  const [newExamType, setNewExamType] = useState<Examination['examType']>('MID_TERM');
  const [newExamStartDate, setNewExamStartDate] = useState<string>('2026-11-01');

  // Marks Entry Form State
  const [entryStudentId, setEntryStudentId] = useState<string>('std-102');
  const [entryTheoryMarks, setEntryTheoryMarks] = useState<number>(45);
  const [entryPracticalMarks, setEntryPracticalMarks] = useState<number>(20);
  const [entryMaxMarks, setEntryMaxMarks] = useState<number>(100);

  // Audit Correction Form State
  const [auditRecordId, setAuditRecordId] = useState<string>('mrk-101');
  const [auditNewMarks, setAuditNewMarks] = useState<number>(95);
  const [auditReason, setAuditReason] = useState<string>('Re-totalling theory paper correction');

  // AI Blueprint Generator State
  const [blueprintTitle, setBlueprintTitle] = useState<string>('Class VIII Science Mid-Term Paper');
  const [blueprintTotalMarks, setBlueprintTotalMarks] = useState<number>(100);
  const [generatedPaper, setGeneratedPaper] = useState<ExamPaperMaster | null>(null);

  // Handle Create Exam
  const handleCreateExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExamName) {
      alert('Please enter examination name.');
      return;
    }

    const created = examService.createExamination(
      {
        schoolId,
        name: newExamName,
        code: `EX-${Date.now().toString().slice(-4)}`,
        academicSession: branding.academicSession || '2026-2027',
        examType: newExamType,
        classes: [selectedClass],
        startDate: newExamStartDate,
        endDate: '2026-11-10',
        passingPercentage: 33,
        createdBy: session.id
      },
      session
    );

    setNewExamName('');
    logAction('CREATE_EXAMINATION', 'EXAM_RESULT', `Created examination: ${created.name}`);
    alert(`Examination "${created.name}" created in DRAFT state!`);
  };

  // Handle Record Marks
  const handleRecordMarks = (e: React.FormEvent) => {
    e.preventDefault();
    const std = students.find(s => s.id === entryStudentId) || { id: 'std-102', name: 'Ananya Sharma', admissionNo: '1025' };

    try {
      const rec = examService.recordStudentMarks(
        {
          examinationId: selectedExamId,
          schoolId,
          studentId: std.id,
          studentName: std.name,
          admissionNo: std.admissionNo,
          className: selectedClass,
          sectionName: 'A',
          subjectName: 'Science',
          theoryMarksObtained: entryTheoryMarks,
          practicalMarksObtained: entryPracticalMarks,
          totalMarksObtained: entryTheoryMarks + entryPracticalMarks,
          maxMarks: entryMaxMarks,
          isAbsent: false,
          enteredBy: session.id
        },
        session
      );

      logAction('RECORD_STUDENT_MARKS', 'EXAM_RESULT', `Recorded marks for ${std.name}: ${rec.totalMarksObtained}/${rec.maxMarks}`);
      alert(`Marks recorded for ${std.name}: ${rec.totalMarksObtained}/${rec.maxMarks}`);
    } catch (err: any) {
      alert(`अंक दर्ज करने में समस्या: ${err.message}`);
    }
  };

  // Handle Marks Audit Update
  const handleUpdateMarksAudit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updated = examService.updateMarksWithAudit(auditRecordId, schoolId, auditNewMarks, auditReason, session);
      logAction('UPDATE_MARKS_AUDIT', 'EXAM_RESULT', `Updated marks for record ${auditRecordId} to ${updated.totalMarksObtained}. Reason: ${auditReason}`);
      alert(`अंक सफलतापूर्वक संशोधित किए गए! नया कुल अंक: ${updated.totalMarksObtained}`);
    } catch (err: any) {
      alert(`अंक संशोधन में त्रुटि: ${err.message}`);
    }
  };

  // Handle Calculate Result
  const handleCalculateResult = () => {
    try {
      const summary = examService.calculateStudentResult(selectedExamId, 'std-101', schoolId, session);
      setResultsList(examService.getAllSchoolResults(schoolId, session));
      logAction('CALCULATE_STUDENT_RESULT', 'EXAM_RESULT', `Calculated result for ${summary.studentName}: ${summary.percentage}% (Grade ${summary.grade})`);
      alert(`परीक्षा परिणाम सफलता पूर्वक तैयार! विद्यार्थी: ${summary.studentName} | प्रतिशत: ${summary.percentage}% | ग्रेड: ${summary.grade} | परिणाम: ${summary.overallResultStatus}`);
    } catch (err: any) {
      alert(`परिणाम तैयार करने में समस्या: ${err.message}`);
    }
  };

  // Handle AI Paper Blueprint Generator
  const handleGeneratePaper = () => {
    const paper = examService.generateBlueprintPaper(
      {
        schoolId,
        paperTitle: blueprintTitle,
        className: selectedClass,
        subjectName: 'Science',
        totalMarks: blueprintTotalMarks,
        durationMinutes: 90
      },
      session
    );

    setGeneratedPaper(paper);
    logAction('GENERATE_AI_EXAM_PAPER', 'EXAM_RESULT', `Generated AI blueprint paper: ${paper.paperTitle} (${paper.totalMarks} Marks)`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Examination, AI Question Bank & Result Management Engine
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Exam Scheduling, AI Blueprint Generator, Marks Entry Audit, Result Calculation & Branded Report Cards
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Marks Audit Trail Guard
          </span>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> AI Paper Blueprint Engine
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('exam_planning')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'exam_planning'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Calendar className="w-4 h-4" /> Exam Planning & Schedule
        </button>

        <button
          onClick={() => setActiveTab('question_bank')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'question_bank'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <FileQuestion className="w-4 h-4" /> Question Bank & AI Blueprint
        </button>

        <button
          onClick={() => setActiveTab('marks_entry')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'marks_entry'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" /> Marks Entry & Audit History
        </button>

        <button
          onClick={() => setActiveTab('result_calculation')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'result_calculation'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Zap className="w-4 h-4" /> Result Calculation Engine
        </button>

        <button
          onClick={() => setActiveTab('report_card')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'report_card'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Printer className="w-4 h-4" /> Branded Report Cards
        </button>

        <button
          onClick={() => setActiveTab('parent_portal')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'parent_portal'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Users className="w-4 h-4" /> Parent & Student Portal
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'analytics'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <TrendingUp className="w-4 h-4" /> Result Analytics & AI Insights
        </button>
      </div>

      {/* TAB 1: EXAM PLANNING */}
      {activeTab === 'exam_planning' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" /> Schedule Examination
            </h2>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Exam Name</label>
                <input
                  type="text"
                  placeholder="e.g. Annual Term 2 Examination"
                  value={newExamName}
                  onChange={e => setNewExamName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Exam Type</label>
                <select
                  value={newExamType}
                  onChange={e => setNewExamType(e.target.value as Examination['examType'])}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                >
                  <option value="UNIT_TEST">Unit Test</option>
                  <option value="MID_TERM">Mid-Term</option>
                  <option value="HALF_YEARLY">Half-Yearly</option>
                  <option value="PRE_BOARD">Pre-Board</option>
                  <option value="ANNUAL">Annual Examination</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input
                  type="date"
                  value={newExamStartDate}
                  onChange={e => setNewExamStartDate(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm"
              >
                Create Examination Schedule
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Configured School Examinations</h2>
            <div className="space-y-3">
              <div className="p-4 rounded-xl border bg-gray-50 dark:bg-gray-700/30 flex justify-between items-center">
                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white">Half-Yearly Examination 2026</div>
                  <div className="text-xs text-gray-500">Session: 2026-2027 | Classes: Class VIII, IX, X</div>
                  <div className="text-xs text-indigo-600 font-semibold mt-1">Passing Threshold: 33%</div>
                </div>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 font-bold text-xs rounded-full">
                  RESULTS_APPROVED
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUESTION BANK & AI BLUEPRINT */}
      {activeTab === 'question_bank' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Blueprint Exam Paper Generator</h2>
                <p className="text-xs text-gray-500">Generates balanced question papers with immutable question snapshots matching total marks.</p>
              </div>
            </div>

            <button
              onClick={handleGeneratePaper}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Generate Blueprint Paper
            </button>
          </div>

          {generatedPaper && (
            <div className="p-6 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-2xl space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-purple-900 dark:text-purple-200">{generatedPaper.paperTitle}</span>
                <span className="px-3 py-1 bg-purple-200 text-purple-800 font-bold text-xs rounded-full">
                  {generatedPaper.status}
                </span>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-300">
                Total Marks: <strong>{generatedPaper.totalMarks}</strong> | Duration: <strong>{generatedPaper.durationMinutes} Mins</strong>
              </div>

              <div className="space-y-2 pt-2">
                <div className="text-xs font-bold text-gray-700 dark:text-gray-300">Questions Included in Snapshot:</div>
                {generatedPaper.questionsSnapshot.map((q, idx) => (
                  <div key={q.id} className="p-3 bg-white dark:bg-gray-900 rounded-xl border text-xs flex justify-between items-center">
                    <span>Q{idx + 1}. {q.questionText}</span>
                    <span className="font-bold text-indigo-600">{q.marks} Marks</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MARKS ENTRY & AUDIT */}
      {activeTab === 'marks_entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Record Marks */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> Enter Student Marks
            </h2>

            <form onSubmit={handleRecordMarks} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Select Student</label>
                <select
                  value={entryStudentId}
                  onChange={e => setEntryStudentId(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                >
                  <option value="std-102">Ananya Sharma (1025)</option>
                  <option value="std-103">Rohit Verma (1026)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Theory Marks</label>
                  <input
                    type="number"
                    value={entryTheoryMarks}
                    onChange={e => setEntryTheoryMarks(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Practical Marks</label>
                  <input
                    type="number"
                    value={entryPracticalMarks}
                    onChange={e => setEntryPracticalMarks(Number(e.target.value))}
                    className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm"
              >
                Record Marks & Validate
              </button>
            </form>
          </div>

          {/* Audit Correction */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-600" /> Audit Marks Correction
            </h2>

            <form onSubmit={handleUpdateMarksAudit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">New Total Marks</label>
                <input
                  type="number"
                  value={auditNewMarks}
                  onChange={e => setAuditNewMarks(Number(e.target.value))}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mandatory Audit Reason</label>
                <textarea
                  rows={2}
                  value={auditReason}
                  onChange={e => setAuditReason(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm"
              >
                Update Marks with Audit Trail
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: RESULT CALCULATION ENGINE */}
      {activeTab === 'result_calculation' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Centralized Result Calculation Engine</h2>
                <p className="text-xs text-gray-500">Calculates total obtained marks, percentage, letter grades, and overall pass/fail status.</p>
              </div>
            </div>

            <button
              onClick={handleCalculateResult}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center gap-2"
            >
              <Zap className="w-4 h-4" /> Run Result Calculation
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Calculated Student Results</h3>
            {resultsList.map(res => (
              <div key={res.id} className="p-4 rounded-xl border bg-gray-50 dark:bg-gray-700/30 flex justify-between items-center">
                <div>
                  <div className="font-bold text-sm text-gray-900 dark:text-white">{res.studentName} ({res.admissionNo})</div>
                  <div className="text-xs text-gray-500">Exam: {res.examinationName} | Class: {res.className}-{res.sectionName}</div>
                  <div className="text-xs font-semibold text-indigo-600 mt-1">
                    Obtained: {res.totalObtainedMarks}/{res.totalMaxMarks} ({res.percentage}%) — Grade {res.grade}
                  </div>
                </div>
                <span className={`px-3 py-1 font-bold text-xs rounded-full ${
                  res.overallResultStatus === 'PASSED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {res.overallResultStatus}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: REPORT CARDS */}
      {activeTab === 'report_card' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{branding.name}</h2>
              <p className="text-xs text-gray-500">Official Digital Report Card — Session {branding.academicSession}</p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print / Export Report Card PDF
            </button>
          </div>

          <div className="border rounded-2xl p-6 bg-gray-50 dark:bg-gray-900 space-y-4 text-xs">
            <div className="flex justify-between items-center border-b pb-3">
              <div>
                <div className="font-bold text-sm">Student: Rahul Kumar (Roll No: 01)</div>
                <div>Admission No: 1024 | Class: Class VIII-A</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-emerald-600 text-sm">Status: PASSED</div>
                <div>Percentage: 88.4% (Grade A)</div>
              </div>
            </div>

            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-200 dark:bg-gray-800 font-bold">
                  <th className="p-2 border">Subject</th>
                  <th className="p-2 border">Theory</th>
                  <th className="p-2 border">Practical</th>
                  <th className="p-2 border">Total Marks</th>
                  <th className="p-2 border">Max Marks</th>
                  <th className="p-2 border">Grade</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border font-semibold">Science</td>
                  <td className="p-2 border">68</td>
                  <td className="p-2 border">24</td>
                  <td className="p-2 border font-bold">92</td>
                  <td className="p-2 border">100</td>
                  <td className="p-2 border font-bold text-indigo-600">A+</td>
                </tr>
                <tr>
                  <td className="p-2 border font-semibold">Mathematics</td>
                  <td className="p-2 border">85</td>
                  <td className="p-2 border">0</td>
                  <td className="p-2 border font-bold">85</td>
                  <td className="p-2 border">100</td>
                  <td className="p-2 border font-bold text-indigo-600">A</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: PARENT PORTAL */}
      {activeTab === 'parent_portal' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> Parent & Student Protected Result Portal
          </h2>
          <p className="text-xs text-gray-500">Only authorized linked children results are accessible here.</p>

          {resultsList.map(res => (
            <div key={res.id} className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/20 space-y-2">
              <div className="flex justify-between font-bold text-sm text-emerald-950 dark:text-emerald-200">
                <span>{res.studentName} — {res.examinationName}</span>
                <span>{res.percentage}% ({res.grade})</span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">Overall Result: <strong>{res.overallResultStatus}</strong></div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 7: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" /> Principal Examination Analytics & AI Performance Insights
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border">
              <div className="text-gray-500">School Average %</div>
              <div className="text-2xl font-extrabold text-indigo-600">85.4%</div>
            </div>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border">
              <div className="text-gray-500">Pass Percentage</div>
              <div className="text-2xl font-extrabold text-emerald-600">98.1%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
