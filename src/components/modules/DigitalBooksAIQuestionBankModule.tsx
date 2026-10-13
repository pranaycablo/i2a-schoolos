import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { DigitalBook, QuestionBankItem, ExamPaper } from '../../types';
import {
  BookOpen,
  Sparkles,
  FileQuestion,
  Plus,
  CheckCircle2,
  BrainCircuit,
  Layers,
  Filter,
  Check,
  Edit,
  ShieldCheck,
  Zap,
  Book,
  X
} from 'lucide-react';

export const DigitalBooksAIQuestionBankModule: React.FC = () => {
  const {
    digitalBooks,
    questionBank,
    addQuestionToBank,
    generateAIExamPaper,
    updateExamPaperStatus,
    examPapers,
    language
  } = useSchool();

  const isHindi = language === 'hi';

  const [activeTab, setActiveTab] = useState<'BOOKS' | 'QUESTION_BANK' | 'AI_PAPER_GENERATOR'>('BOOKS');

  // Book Selection State
  const [selectedBook, setSelectedBook] = useState<DigitalBook>(digitalBooks[0]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>(digitalBooks[0]?.chapters[0]?.id || '');

  // AI One-Click Generator Form
  const [aiPaperForm, setAiPaperForm] = useState({
    className: 'Class VIII',
    subject: 'Science',
    title: 'Class VIII Science Weekly Assessment - Term II',
    marks: 30,
    duration: 45
  });

  const [generatedDraft, setGeneratedDraft] = useState<ExamPaper | null>(null);

  // New Question Form State
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    className: 'Class VIII',
    subject: 'Science',
    chapterId: 'ch-1',
    chapterTitle: 'Crop Production & Management',
    questionText: '',
    type: 'MCQ' as QuestionBankItem['type'],
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 'Option A',
    difficulty: 'MEDIUM' as QuestionBankItem['difficulty'],
    marks: 1
  });

  const currentBook = selectedBook || digitalBooks[0];
  const activeChapter = currentBook?.chapters?.find((c) => c.id === selectedChapterId) || currentBook?.chapters?.[0];

  const handleGeneratePaper = (e: React.FormEvent) => {
    e.preventDefault();
    const paper = generateAIExamPaper(aiPaperForm);
    setGeneratedDraft(paper);
  };

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    addQuestionToBank(newQuestion);
    setShowQuestionModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <BrainCircuit className="w-4 h-4" /> {isHindi ? 'एआई शैक्षणिक इंजन व पाठ्यक्रम लाइब्रेरी' : 'AI Academic Engine & Curriculum OCR'}
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            {isHindi ? 'डिजिटल बुक्स, एआई प्रश्न बैंक व टेस्ट पेपर निर्माता' : 'Digital Books, AI Question Bank & Paper Generator'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {isHindi
              ? 'एनसीईआरटी पुस्तकें → अध्यायवार अवधारणा निष्कर्षण → प्रश्न बैंक रिपॉजिटरी → 1-क्लिक एआई टेस्ट पेपर।'
              : 'Book Upload → Chapter Concept Extraction → Question Repository → One-Click AI Paper with Teacher Review & Principal Approval Lock.'}
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('BOOKS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'BOOKS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {isHindi ? 'डिजिटल बुक्स' : 'Digital Books & Reader'}
          </button>
          <button
            onClick={() => setActiveTab('QUESTION_BANK')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'QUESTION_BANK' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {isHindi ? `एआई प्रश्न बैंक (${questionBank.length})` : `AI Question Bank (${questionBank.length})`}
          </button>
          <button
            onClick={() => setActiveTab('AI_PAPER_GENERATOR')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'AI_PAPER_GENERATOR' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {isHindi ? '1-क्लिक एआई टेस्ट जनरेटर' : '1-Click AI Test Generator'}
          </button>
        </div>
      </div>

      {activeTab === 'BOOKS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Books Hierarchy Tree */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
              <Book className="w-4 h-4 text-indigo-500" /> Digital Curriculum Library
            </h3>

            <div className="space-y-3">
              {digitalBooks.map((book) => (
                <div
                  key={book.id}
                  onClick={() => { setSelectedBook(book); setSelectedChapterId(book.chapters[0]?.id || ''); }}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                    selectedBook?.id === book.id
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/50 border-indigo-400 dark:border-indigo-700 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <img src={book.coverUrl} alt={book.title} className="h-12 w-10 object-cover rounded-md shadow" />
                  <div className="flex-1 text-xs">
                    <h4 className="font-bold text-slate-900 dark:text-white">{book.title}</h4>
                    <p className="text-[10px] text-slate-500">{book.className} • {book.chaptersCount} Chapters</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Concept Reader Panel */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4 border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2.5 py-0.5 rounded-full uppercase">
                  AI OCR & Concept Reader Engine
                </span>
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">{currentBook?.title}</h3>
              </div>
            </div>

            {/* Chapters Pills */}
            <div className="flex gap-2 overflow-x-auto pb-1">
              {currentBook?.chapters?.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setSelectedChapterId(ch.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                    activeChapter?.id === ch.id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Ch {ch.chapterNumber}: {ch.title}
                </button>
              ))}
            </div>

            {/* AI Extracted Concepts */}
            {activeChapter && (
              <div className="space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                  <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Chapter Overview & Summary
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{activeChapter.summary}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-indigo-50/50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-200/50 dark:border-indigo-800/40 space-y-2">
                    <h5 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-500" /> Key Topics & Modules
                    </h5>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 text-[11px]">
                      {activeChapter.topics.map((t, idx) => <li key={idx}>{t}</li>)}
                    </ul>
                  </div>

                  <div className="bg-purple-50/50 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-200/50 dark:border-purple-800/40 space-y-2">
                    <h5 className="font-bold text-purple-900 dark:text-purple-300 flex items-center gap-1.5">
                      <BrainCircuit className="w-3.5 h-3.5 text-purple-500" /> AI Auto-Extracted Concepts
                    </h5>
                    <div className="flex flex-wrap gap-1.5">
                      {activeChapter.extractedConcepts.map((c, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'QUESTION_BANK' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Question Bank ({questionBank.length})</h3>
            <button
              onClick={() => setShowQuestionModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow"
            >
              <Plus className="w-4 h-4" /> Add Custom Question
            </button>
          </div>

          <div className="space-y-3">
            {questionBank.map((q) => (
              <div key={q.id} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                        {q.type}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">{q.subject} • {q.chapterTitle}</span>
                    </div>
                    <p className="font-bold text-sm text-slate-900 dark:text-white pt-1">{q.questionText}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-extrabold text-xs text-indigo-600 dark:text-indigo-400">{q.marks} Marks</span>
                    <p className="text-[10px] text-slate-400">{q.difficulty}</p>
                  </div>
                </div>

                {q.options && (
                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                    {q.options.map((opt, idx) => (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl border text-[11px] font-medium ${
                          opt === q.correctAnswer
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 text-emerald-800 dark:text-emerald-300 font-bold'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {opt === q.correctAnswer ? '✓ ' : ''}{opt}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'AI_PAPER_GENERATOR' && (
        <div className="space-y-6">
          {/* Promotional Image Banner */}
          <div className="relative rounded-3xl overflow-hidden border border-indigo-500/30 bg-gradient-to-r from-indigo-900 via-purple-950 to-slate-900 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-12 items-center">
              <div className="md:col-span-8 p-6 space-y-2">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {isHindi ? 'सीबीएसई व एनईपी 2020 क्षमता-आधारित मूल्यांकन' : 'CBSE Competency-Based Assessment Engine'}
                </span>
                <h3 className="text-xl font-black text-white">
                  {isHindi ? 'एआई प्रश्न पत्र एवं ब्लूप्रिंट निर्माता' : 'AI Question Paper & Blueprint Generator'}
                </h3>
                <p className="text-xs text-indigo-200/90 leading-relaxed max-w-xl">
                  {isHindi
                    ? 'एनसीईआरटी डिजिटल पुस्तकों से बहुविकल्पीय प्रश्न, लघु उत्तरीय एवं हॉट्स (HOTS) आधारित प्रश्न पत्र तैयार करें। ब्लूम्स टैक्सोनॉमी द्वारा संतुलित अंक योजना।'
                    : 'Generate Bloom\'s Taxonomy-aligned examination papers directly from NCERT curriculum books with automated marking schemes and question blueprints.'}
                </p>
              </div>
              <div className="md:col-span-4 p-4 flex justify-end">
                <img
                  src="./images/ai-exam-banner.png"
                  alt="AI Exam Generator"
                  className="h-32 w-auto object-cover rounded-2xl shadow-lg border border-indigo-400/20"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form */}
            <form onSubmit={handleGeneratePaper} className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 border-b pb-3 border-slate-100 dark:border-slate-800">
                <Zap className="w-4 h-4 text-amber-500" /> {isHindi ? '1-क्लिक एआई प्रश्न पत्र विन्यास' : 'One-Click AI Paper Configuration'}
              </h3>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">{isHindi ? 'प्रश्न पत्र शीर्षक' : 'Paper Title'}</label>
                <input
                  type="text"
                  required
                  value={aiPaperForm.title}
                  onChange={(e) => setAiPaperForm({ ...aiPaperForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none font-bold"
                />
              </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Class</label>
                <select
                  value={aiPaperForm.className}
                  onChange={(e) => setAiPaperForm({ ...aiPaperForm, className: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  <option value="Class VIII">Class VIII</option>
                  <option value="Class X">Class X</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Subject</label>
                <select
                  value={aiPaperForm.subject}
                  onChange={(e) => setAiPaperForm({ ...aiPaperForm, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                >
                  <option value="Science">Science</option>
                  <option value="Mathematics">Mathematics</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Total Marks</label>
                <input
                  type="number"
                  value={aiPaperForm.marks}
                  onChange={(e) => setAiPaperForm({ ...aiPaperForm, marks: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Duration (Minutes)</label>
                <input
                  type="number"
                  value={aiPaperForm.duration}
                  onChange={(e) => setAiPaperForm({ ...aiPaperForm, duration: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" /> Generate AI Question Paper Draft
            </button>
          </form>

          {/* Generated Draft Paper & Controlled Approval Lock */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <span>Paper Draft & Approval Workflow</span>
              {generatedDraft && (
                <span className={`px-3 py-0.5 rounded-full text-[10px] font-extrabold ${
                  generatedDraft.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                }`}>
                  Workflow Status: {generatedDraft.status}
                </span>
              )}
            </h3>

            {generatedDraft ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl space-y-1">
                  <h4 className="font-extrabold text-base text-indigo-600 dark:text-indigo-400">{generatedDraft.paperTitle}</h4>
                  <p className="text-slate-500">
                    {generatedDraft.className} • {generatedDraft.subject} • {generatedDraft.totalMarks} Marks • {generatedDraft.durationMinutes} Minutes
                  </p>
                </div>

                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {generatedDraft.questions.map((q, idx) => (
                    <div key={q.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">Q{idx + 1}. {q.questionText} ({q.marks}M)</p>
                      {q.options && <p className="text-[10px] text-slate-500">Options: {q.options.join(' | ')}</p>}
                    </div>
                  ))}
                </div>

                {/* Controlled Approval Buttons */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold">Teacher Review & Principal Lock</span>
                  <div className="flex gap-2">
                    {generatedDraft.status === 'AI_DRAFT' && (
                      <button
                        onClick={() => {
                          updateExamPaperStatus(generatedDraft.id, 'APPROVED');
                          setGeneratedDraft({ ...generatedDraft, status: 'APPROVED' });
                        }}
                        className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-md cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4" /> Principal Sign & Lock Paper
                      </button>
                    )}
                    {generatedDraft.status === 'APPROVED' && (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Published & Ready for Exam
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 space-y-2">
                <BrainCircuit className="w-12 h-12 text-indigo-400 mx-auto opacity-70" />
                <p className="text-xs">Click "Generate AI Question Paper Draft" to see instant paper balancing & approval pipeline.</p>
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* Add Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <form onSubmit={handleAddQuestion} className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Add Custom Question to Bank</h3>
              <button type="button" onClick={() => setShowQuestionModal(false)} className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Question Text</label>
              <textarea
                required
                rows={2}
                value={newQuestion.questionText}
                onChange={(e) => setNewQuestion({ ...newQuestion, questionText: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Question Type</label>
                <select
                  value={newQuestion.type}
                  onChange={(e) => setNewQuestion({ ...newQuestion, type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="MCQ">MCQ</option>
                  <option value="SHORT">Short Answer</option>
                  <option value="FILL_BLANKS">Fill in Blanks</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Marks</label>
                <input
                  type="number"
                  value={newQuestion.marks}
                  onChange={(e) => setNewQuestion({ ...newQuestion, marks: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button type="button" onClick={() => setShowQuestionModal(false)} className="px-4 py-2 rounded-xl font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-xl font-bold bg-indigo-600 text-white shadow">
                Save Question
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
