import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ExamPaper, OnlineExamSubmission } from '../../types';
import {
  FileQuestion,
  Clock,
  CheckCircle2,
  Sparkles,
  Award,
  BookOpen,
  UserCheck,
  BrainCircuit,
  Zap,
  Play,
  Check,
  FileCheck
} from 'lucide-react';

export const ExaminationModule: React.FC = () => {
  const { examPapers, examSubmissions, submitStudentExam, gradeSubjectiveAnswers, students } = useSchool();

  const [activeTab, setActiveTab] = useState<'CALENDAR' | 'ONLINE_EXAM_TEST' | 'TEACHER_GRADING'>('CALENDAR');

  // Interactive Exam State for Student Mode
  const [activePaper, setActivePaper] = useState<ExamPaper | null>(examPapers[0] || null);
  const [studentAnswers, setStudentAnswers] = useState<{ [qId: string]: string }>({});
  const [examSubmitted, setExamSubmitted] = useState(false);

  const currentPaper = activePaper || examPapers[0] || null;
  const currentStudent = students[0] || { id: 'std-101', name: 'Student', className: 'Class VIII', section: 'A' };

  // Teacher Grading Workspace State
  const [selectedSubmission, setSelectedSubmission] = useState<OnlineExamSubmission | null>(examSubmissions[0] || null);

  const academicSchedule = [
    { date: '10 April 2026', title: 'Weekly Assessment - Math & Science', type: 'WEEKLY', status: 'COMPLETED' },
    { date: '25 April 2026', title: 'Unit Test I', type: 'UNIT_TEST', status: 'COMPLETED' },
    { date: '15 May 2026', title: 'Monthly Assessment', type: 'MONTHLY', status: 'SCHEDULED' },
    { date: '10 July 2026', title: 'Half Yearly Examinations', type: 'TERM_EXAM', status: 'SCHEDULED' },
    { date: '10 March 2027', title: 'Annual CBSE Final Exam', type: 'ANNUAL', status: 'UPCOMING' }
  ];

  const handleStudentSubmitExam = () => {
    if (!currentPaper) return;
    const formattedAns = (currentPaper.questions || []).map((q) => ({
      questionId: q.id,
      studentAnswer: studentAnswers[q.id] || '',
      marksObtained: 0
    }));

    submitStudentExam({
      examPaperId: currentPaper.id,
      examTitle: currentPaper.paperTitle,
      studentId: currentStudent.id,
      studentName: currentStudent.name,
      className: currentStudent.className,
      section: currentStudent.section,
      totalMarks: currentPaper.totalMarks,
      answers: formattedAns
    });

    setExamSubmitted(true);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <FileQuestion className="w-4 h-4" /> Examination Automation Engine
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Preloaded Exam Schedule, Online Timer Exam & Auto Evaluation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pre-configured Academic Calendar → Online Timer Exam Portal → Auto Objective Grading + Subjective Teacher Marking.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('CALENDAR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CALENDAR' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Preloaded Calendar
          </button>
          <button
            onClick={() => setActiveTab('ONLINE_EXAM_TEST')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ONLINE_EXAM_TEST' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Online Exam Simulator
          </button>
          <button
            onClick={() => setActiveTab('TEACHER_GRADING')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'TEACHER_GRADING' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Teacher Evaluation ({examSubmissions.length})
          </button>
        </div>
      </div>

      {activeTab === 'CALENDAR' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" /> Pre-Configured Annual Examination Schedule
            </h3>
            <span className="text-xs text-slate-500 font-semibold">Academic Session 2026-2027</span>
          </div>

          <div className="relative border-l-2 border-indigo-200 dark:border-indigo-900 ml-4 space-y-6">
            {academicSchedule.map((item, idx) => (
              <div key={idx} className="relative pl-6">
                <div className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                  item.status === 'COMPLETED' ? 'bg-emerald-500' : 'bg-indigo-500'
                }`} />

                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">{item.date}</span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{item.title}</h4>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                    item.status === 'COMPLETED'
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                      : 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300'
                  }`}>
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'ONLINE_EXAM_TEST' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          {examSubmitted ? (
            <div className="py-12 text-center space-y-4 max-w-md mx-auto">
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Exam Submitted Successfully!</h3>
              <p className="text-xs text-slate-500">
                Objective questions were evaluated automatically. Subjective answers sent to Teacher Review.
              </p>
              <button
                onClick={() => { setExamSubmitted(false); setActiveTab('TEACHER_GRADING'); }}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow-md"
              >
                Go to Teacher Grading Desk
              </button>
            </div>
          ) : (
            !currentPaper ? (
              <div className="py-12 text-center text-slate-500">
                <p className="font-bold">No exam papers found for online simulator.</p>
                <p className="text-xs mt-1">Please approve or create an exam paper in the Digital Books & AI Question Bank module.</p>
              </div>
            ) : (
            <div className="space-y-6">
              {/* Exam Header */}
              <div className="flex items-center justify-between bg-indigo-900 text-white p-5 rounded-2xl">
                <div>
                  <h3 className="font-extrabold text-base">{currentPaper.paperTitle}</h3>
                  <p className="text-xs text-indigo-200">
                    Student: <b>{currentStudent.name}</b> • Class: <b>{currentPaper.className}</b>
                  </p>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm flex items-center gap-2 text-amber-300 font-mono text-sm font-bold">
                  <Clock className="w-4 h-4 animate-pulse" /> 44:50 Left
                </div>
              </div>

              {/* Question Paper Interactive Form */}
              <div className="space-y-6 text-xs">
                {(currentPaper.questions || []).map((q, idx) => (
                  <div key={q.id} className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex justify-between items-start font-bold text-sm text-slate-900 dark:text-white">
                      <span>Q{idx + 1}. {q.questionText}</span>
                      <span className="text-xs text-indigo-600 dark:text-indigo-400 shrink-0 ml-2">{q.marks} Marks</span>
                    </div>

                    {q.options ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, optIdx) => (
                          <label
                            key={optIdx}
                            className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                              studentAnswers[q.id] === opt
                                ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`q-${q.id}`}
                              checked={studentAnswers[q.id] === opt}
                              onChange={() => setStudentAnswers({ ...studentAnswers, [q.id]: opt })}
                              className="hidden"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        rows={3}
                        placeholder="Write your explanation here..."
                        value={studentAnswers[q.id] || ''}
                        onChange={(e) => setStudentAnswers({ ...studentAnswers, [q.id]: e.target.value })}
                        className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>

              <button
                onClick={handleStudentSubmitExam}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" /> Submit Exam & Auto-Evaluate
              </button>
            </div>
            )
          )}
        </div>
      )}

      {activeTab === 'TEACHER_GRADING' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Submissions List */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3">
              <UserCheck className="w-4 h-4 text-indigo-500" /> Student Exam Submissions
            </h3>

            <div className="space-y-3">
              {examSubmissions.map((sub) => (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubmission(sub)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedSubmission?.id === sub.id
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-700 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start text-xs">
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{sub.studentName}</h4>
                      <p className="text-[10px] text-slate-500">{sub.examTitle}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">{sub.score}/{sub.totalMarks}</span>
                      <p className="text-[10px] font-bold text-indigo-600">{sub.grade}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Subjective Evaluation Workspace */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
            {selectedSubmission ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">{selectedSubmission.studentName}</h3>
                    <p className="text-[10px] text-slate-500">{selectedSubmission.examTitle} • Submitted {selectedSubmission.submittedAt}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-extrabold text-indigo-600">{selectedSubmission.percentage}%</span>
                    <span className="block text-[10px] font-bold text-emerald-600">Grade: {selectedSubmission.grade}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedSubmission.answers.map((ans, idx) => (
                    <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">Q. Student Answer:</p>
                      <p className="text-slate-700 dark:text-slate-300 italic">"{ans.studentAnswer || 'No answer provided'}"</p>
                      <div className="flex justify-between items-center pt-2 text-[11px]">
                        <span className="text-emerald-600 font-bold">Earned: {ans.marksObtained} Marks</span>
                        {ans.teacherComment && <span className="text-slate-500">Note: {ans.teacherComment}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400">Select a submission to review subjective marks</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
