import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { HomeworkDigitalLearningService } from '../../services/HomeworkDigitalLearningService';
import type { UserSession } from '../../services/TenantSecurityService';
import type {
  Homework,
  StudentSubmission,
  LearningResourceMaterial,
  AiAcademicContentDraft,
  OcrIngestionJob
} from '../../types';
import {
  BookOpen,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  Sparkles,
  Bot,
  Layers,
  FileSpreadsheet,
  Award,
  FileSearch,
  Users,
  ShieldCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';

const homeworkService = new HomeworkDigitalLearningService();

export const HomeworkDigitalLearningModule: React.FC = () => {
  const { branding, currentRole, students, staffList, logAction } = useSchool();
  const [activeTab, setActiveTab] = useState<
    'homework_desk' | 'student_portal' | 'evaluation_desk' | 'digital_books' | 'ai_content_generator' | 'ocr_pipeline' | 'analytics_desk'
  >('homework_desk');

  const schoolId = branding.id || 'sch-001';

  // Filter state
  const [selectedClass, setSelectedClass] = useState<string>('Class VIII');
  const [selectedSection, setSelectedSection] = useState<string>('A');

  const session: UserSession = {
    id: currentRole === 'STUDENT' ? 'std-101' : currentRole === 'TEACHER' ? 'stf-1' : 'user-active',
    email: 'user@school.com',
    tenantId: schoolId,
    role: currentRole,
    status: 'ACTIVE',
    childrenIds: ['std-101']
  };

  // State Collections
  const [homeworkList, setHomeworkList] = useState<Homework[]>(() =>
    homeworkService.getHomeworkForClass(schoolId, selectedClass, selectedSection, session)
  );

  const [learningResources, setLearningResources] = useState<LearningResourceMaterial[]>(() =>
    homeworkService.getLearningResources(schoolId, selectedClass, session)
  );

  const [aiDrafts, setAiDrafts] = useState<AiAcademicContentDraft[]>(() =>
    homeworkService.getAiDrafts(schoolId, session)
  );

  const [ocrJobs, setOcrJobs] = useState<OcrIngestionJob[]>([]);

  // Create Homework Form State
  const [newHwTitle, setNewHwTitle] = useState<string>('');
  const [newHwDescription, setNewHwDescription] = useState<string>('');
  const [newHwDueDate, setNewHwDueDate] = useState<string>('2026-10-15');
  const [newHwMaxMarks, setNewHwMaxMarks] = useState<number>(20);
  const [newHwType, setNewHwType] = useState<Homework['homeworkType']>('WORKSHEET');

  // Student Submission Form State
  const [submittingHwId, setSubmittingHwId] = useState<string>('hw-101');
  const [submissionText, setSubmissionText] = useState<string>('');

  // Evaluation Form State
  const [evalSubId, setEvalSubId] = useState<string>('sub-201');
  const [evalMarks, setEvalMarks] = useState<number>(18);
  const [evalFeedback, setEvalFeedback] = useState<string>('Great presentation!');

  // AI Content Generator Form State
  const [aiTopic, setAiTopic] = useState<string>('Crop Production & Soil Preparation');
  const [aiContentType, setAiContentType] = useState<AiAcademicContentDraft['contentType']>('SUMMARY');

  // Sync homework on class change
  const refreshHomework = () => {
    setHomeworkList(homeworkService.getHomeworkForClass(schoolId, selectedClass, selectedSection, session));
  };

  // Handle Create Homework
  const handleCreateHomework = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHwTitle || !newHwDescription) {
      alert('Please fill in title and description.');
      return;
    }

    const created = homeworkService.createHomework(
      {
        schoolId,
        title: newHwTitle,
        description: newHwDescription,
        instructions: 'Follow standard formatting and submit before due date.',
        academicSession: branding.academicSession || '2026-2027',
        className: selectedClass,
        sectionName: selectedSection,
        subjectId: 'sub-sci',
        subjectName: 'Science',
        topicName: aiTopic,
        assignedDate: new Date().toISOString().split('T')[0],
        dueDate: newHwDueDate,
        dueTime: '17:00',
        maxMarks: newHwMaxMarks,
        homeworkType: newHwType,
        attachments: [{ name: 'Assignment_Doc.pdf', url: '/files/doc.pdf', fileType: 'pdf' }],
        allowLateSubmission: true,
        status: 'PUBLISHED',
        createdBy: session.id,
        createdByName: 'Faculty Member'
      },
      session
    );

    refreshHomework();
    setNewHwTitle('');
    setNewHwDescription('');
    logAction('CREATE_HOMEWORK', 'HOMEWORK', `Published homework: ${created.title} for ${selectedClass}-${selectedSection}`);
    alert(`Homework "${created.title}" successfully published to ${selectedClass}-${selectedSection}!`);
  };

  // Handle Student Submission
  const handleSubmitWork = (e: React.FormEvent) => {
    e.preventDefault();
    const activeStudent = students[0] || { id: 'std-101', name: 'Rahul Kumar', admissionNo: '1024' };

    const sub = homeworkService.submitHomework(
      {
        homeworkId: submittingHwId,
        studentId: activeStudent.id,
        studentName: activeStudent.name,
        admissionNo: activeStudent.admissionNo,
        className: selectedClass,
        sectionName: selectedSection,
        schoolId,
        textResponse: submissionText || 'Completed assignment solution.',
        attachments: [{ name: 'My_Handwritten_Solution.pdf', url: '/files/my_sol.pdf', sizeBytes: 1048576 }]
      },
      session
    );

    logAction('SUBMIT_HOMEWORK', 'HOMEWORK', `Student ${activeStudent.name} submitted response for homework ${submittingHwId}`);
    alert(`Submission received successfully! Status: ${sub.status}`);
  };

  // Handle Teacher Evaluation
  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const evaluated = homeworkService.evaluateSubmission(evalSubId, schoolId, evalMarks, evalFeedback, session);
      logAction('EVALUATE_SUBMISSION', 'HOMEWORK', `Graded submission ${evaluated.id} with ${evaluated.awardedMarks} marks`);
      alert(`Submission successfully evaluated! Awarded Marks: ${evaluated.awardedMarks}`);
    } catch (err: any) {
      alert(`Evaluation Error: ${err.message}`);
    }
  };

  // Handle AI Draft Generator
  const handleGenerateAiDraft = () => {
    const draft = homeworkService.generateAiContentDraft(
      {
        schoolId,
        className: selectedClass,
        subjectName: 'Science',
        topicName: aiTopic,
        contentType: aiContentType,
        teacherId: session.id
      },
      session
    );

    setAiDrafts(homeworkService.getAiDrafts(schoolId, session));
    logAction('GENERATE_AI_ACADEMIC_DRAFT', 'AI_ACADEMIC', `Generated AI draft for topic ${aiTopic} (${aiContentType})`);
  };

  // Handle Review & Approve AI Draft
  const handleApproveDraft = (draftId: string) => {
    homeworkService.reviewAndApproveAiDraft(draftId, schoolId, true, undefined, session);
    setAiDrafts(homeworkService.getAiDrafts(schoolId, session));
    logAction('APPROVE_AI_DRAFT', 'AI_ACADEMIC', `Teacher approved AI draft ${draftId} for student publishing`);
    alert('AI Draft Approved & Published for Students!');
  };

  // Handle OCR Trigger
  const handleRunOcr = () => {
    const job = homeworkService.triggerOcrIngestion(schoolId, 'Scanned_Textbook_Ch1.pdf', '/files/scanned.pdf', session);
    setOcrJobs(prev => [job, ...prev]);
    logAction('RUN_OCR_INGESTION', 'DIGITAL_LEARNING', `Processed OCR ingestion for ${job.fileName}`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Homework, Digital Learning & AI Academic Content Engine
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              End-to-End Homework Workflow, Submission Engine, Rubric Evaluation, Digital Books & AI Faculty Assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Security & Audit Protected
          </span>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 flex items-center gap-1">
            <Bot className="w-3.5 h-3.5" /> AI Review Gatekeeper
          </span>
        </div>
      </div>

      {/* Module Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        <button
          onClick={() => setActiveTab('homework_desk')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'homework_desk'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <FileText className="w-4 h-4" /> Homework Creation & Desk
        </button>

        <button
          onClick={() => setActiveTab('student_portal')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'student_portal'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Upload className="w-4 h-4" /> Student Submission Portal
        </button>

        <button
          onClick={() => setActiveTab('evaluation_desk')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'evaluation_desk'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Award className="w-4 h-4" /> Teacher Evaluation & Rubrics
        </button>

        <button
          onClick={() => setActiveTab('digital_books')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'digital_books'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Layers className="w-4 h-4" /> Digital Books & Resources
        </button>

        <button
          onClick={() => setActiveTab('ai_content_generator')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'ai_content_generator'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" /> AI Academic Generator
        </button>

        <button
          onClick={() => setActiveTab('ocr_pipeline')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'ocr_pipeline'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <FileSearch className="w-4 h-4" /> OCR Document Ingestion
        </button>

        <button
          onClick={() => setActiveTab('analytics_desk')}
          className={`px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all ${
            activeTab === 'analytics_desk'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" /> Principal Analytics
        </button>
      </div>

      {/* TAB 1: HOMEWORK CREATION & DESK */}
      {activeTab === 'homework_desk' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Creation Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-600" /> Assign New Homework
            </h2>

            <form onSubmit={handleCreateHomework} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Homework Title</label>
                <input
                  type="text"
                  placeholder="e.g. Science Ch-1 Crop Management"
                  value={newHwTitle}
                  onChange={e => setNewHwTitle(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description & Tasks</label>
                <textarea
                  rows={3}
                  placeholder="Detailed instructions for students..."
                  value={newHwDescription}
                  onChange={e => setNewHwDescription(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newHwDueDate}
                    onChange={e => setNewHwDueDate(e.target.value)}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Max Marks</label>
                  <input
                    type="number"
                    value={newHwMaxMarks}
                    onChange={e => setNewHwMaxMarks(Number(e.target.value))}
                    className="w-full p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm transition-all"
              >
                Publish Assignment to Class
              </button>
            </form>
          </div>

          {/* Active Homework Feed */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Active Class Homework Feed</h2>
              <span className="text-xs px-3 py-1 bg-indigo-100 text-indigo-700 font-bold rounded-full">
                {homeworkList.length} Homework Items
              </span>
            </div>

            <div className="space-y-3">
              {homeworkList.map(hw => (
                <div key={hw.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 space-y-2">
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">{hw.title}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 font-bold rounded-full">
                      {hw.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">{hw.description}</p>
                  <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-400 pt-2 border-t">
                    <div className="flex items-center gap-3">
                      <span>Subject: <strong>{hw.subjectName}</strong></span>
                      <span>Max Marks: <strong>{hw.maxMarks || 'N/A'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 text-indigo-600 font-semibold">
                      <Clock className="w-3.5 h-3.5" /> Due: {hw.dueDate} ({hw.dueTime})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STUDENT SUBMISSION PORTAL */}
      {activeTab === 'student_portal' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Student Homework Submission Portal</h2>
              <p className="text-xs text-gray-500">Submit handwritten work, PDF scans, or online text responses before deadline.</p>
            </div>
          </div>

          <form onSubmit={handleSubmitWork} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Select Homework</label>
              <select
                value={submittingHwId}
                onChange={e => setSubmittingHwId(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
              >
                {homeworkList.map(hw => (
                  <option key={hw.id} value={hw.id}>{hw.title} (Due: {hw.dueDate})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Text Response / Notes</label>
              <textarea
                rows={4}
                placeholder="Type your answer or submit file URL notes..."
                value={submissionText}
                onChange={e => setSubmissionText(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-sm"
            >
              Submit Homework Now
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: TEACHER EVALUATION & RUBRICS */}
      {activeTab === 'evaluation_desk' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <div className="flex items-center gap-3 border-b pb-4">
            <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Teacher Evaluation & Rubric Desk</h2>
              <p className="text-xs text-gray-500">Grade student submissions with max marks validation and written feedback.</p>
            </div>
          </div>

          <form onSubmit={handleEvaluate} className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Awarded Marks</label>
              <input
                type="number"
                value={evalMarks}
                onChange={e => setEvalMarks(Number(e.target.value))}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Teacher Feedback</label>
              <textarea
                rows={3}
                value={evalFeedback}
                onChange={e => setEvalFeedback(e.target.value)}
                className="w-full p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-sm"
            >
              Save Evaluation & Notify Student
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: DIGITAL BOOKS */}
      {activeTab === 'digital_books' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-600" /> Digital Books & Academic Resources Repository
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {learningResources.map(res => (
              <div key={res.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 space-y-2">
                <div className="font-bold text-sm text-gray-900 dark:text-white">{res.title}</div>
                <p className="text-xs text-gray-500">{res.description}</p>
                <div className="text-[11px] text-indigo-600 font-semibold">Subject: {res.subjectName} ({res.className})</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AI ACADEMIC GENERATOR */}
      {activeTab === 'ai_content_generator' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-amber-400 to-purple-600 text-white rounded-xl">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">AI Academic Content Draft Generator</h2>
                <p className="text-xs text-gray-500">Generates chapter summaries, practice questions, & revision notes with mandatory teacher approval.</p>
              </div>
            </div>
            <button
              onClick={handleGenerateAiDraft}
              className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Generate Draft
            </button>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Pending AI Drafts (Awaiting Teacher Approval)</h3>
            {aiDrafts.map(draft => (
              <div key={draft.id} className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/30 dark:bg-purple-950/20 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-purple-900 dark:text-purple-200">{draft.topicName} ({draft.contentType})</span>
                  <span className={`text-[10px] px-2.5 py-1 font-bold rounded-full ${
                    draft.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {draft.status}
                  </span>
                </div>
                <pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded-xl border overflow-x-auto whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-200">
                  {draft.generatedContent}
                </pre>
                {draft.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleApproveDraft(draft.id)}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Approve & Publish to Students
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: OCR PIPELINE */}
      {activeTab === 'ocr_pipeline' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-indigo-600" /> OCR Document Ingestion Pipeline
            </h2>
            <button
              onClick={handleRunOcr}
              className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm"
            >
              Upload & Extract Scanned Textbook
            </button>
          </div>

          <div className="space-y-3">
            {ocrJobs.map(j => (
              <div key={j.id} className="p-4 rounded-xl border bg-gray-50 dark:bg-gray-700/30 space-y-2 text-xs">
                <div className="flex justify-between font-bold text-sm">
                  <span>File: {j.fileName}</span>
                  <span className="text-emerald-600 font-bold">{j.status}</span>
                </div>
                <p className="text-gray-600 dark:text-gray-300">{j.extractedText}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 7: PRINCIPAL ANALYTICS */}
      {activeTab === 'analytics_desk' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-indigo-600" /> Principal Learning & Homework Aggregated Analytics
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 rounded-xl border border-indigo-200">
              <div className="text-gray-500 font-semibold">Active Homework Items</div>
              <div className="text-2xl font-extrabold text-indigo-600">{homeworkList.length}</div>
            </div>
            <div className="p-4 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200">
              <div className="text-gray-500 font-semibold">Submission Completion Rate</div>
              <div className="text-2xl font-extrabold text-emerald-600">94.2%</div>
            </div>
            <div className="p-4 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-200">
              <div className="text-gray-500 font-semibold">AI Drafts Approved</div>
              <div className="text-2xl font-extrabold text-purple-600">{aiDrafts.filter(d => d.status === 'APPROVED').length}</div>
            </div>
            <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-xl border border-amber-200">
              <div className="text-gray-500 font-semibold">Digital Books Available</div>
              <div className="text-2xl font-extrabold text-amber-600">{learningResources.length}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
