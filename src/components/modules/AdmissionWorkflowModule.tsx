import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  UserPlus,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Award,
  Sparkles,
  Send,
  Building2,
  XCircle
} from 'lucide-react';

export const AdmissionWorkflowModule: React.FC = () => {
  const { admissions, addAdmission, updateAdmissionStatus, approveAdmissionAndCreateStudent } = useSchool();

  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'PARENT_FORM'>('PIPELINE');

  // Parent Public Form State
  const [parentForm, setParentForm] = useState({
    studentName: '',
    applyingClass: 'Class VIII',
    parentName: '',
    phone: '',
    email: '',
    remarks: 'Seeking admission for Academic Year 2026-27'
  });
  const [submittedAppNo, setSubmittedAppNo] = useState<string | null>(null);

  const handleParentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAdmission({
      ...parentForm,
      documentsUploaded: true,
      status: 'SUBMITTED'
    });
    setSubmittedAppNo(`APP-2026-${Math.floor(100 + Math.random() * 900)}`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <UserPlus className="w-4 h-4" /> Online Admission Automation Engine
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Controlled Admission Approval Pipeline
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Parent Form → Document Verification → Entrance Test → Principal Sign-off → Auto-Generated Student Account.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('PIPELINE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PIPELINE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            School Pipeline Desk ({admissions.filter((a) => a.status !== 'ENROLLED').length})
          </button>
          <button
            onClick={() => setActiveTab('PARENT_FORM')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PARENT_FORM' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Public Admission Portal Simulator
          </button>
        </div>
      </div>

      {activeTab === 'PIPELINE' && (
        <div className="space-y-6">
          {/* Zero-Manual Pipeline Infographic */}
          <div className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-800/60 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-400" /> Controlled Liability & Approval Workflow Architecture
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-[11px]">
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                <span className="block font-bold text-xs">1. Parent Form</span>
                <span className="text-[10px] text-slate-300">Online Submission</span>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                <span className="block font-bold text-xs">2. Doc Verify</span>
                <span className="text-[10px] text-slate-300">Automated Audit</span>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                <span className="block font-bold text-xs">3. Test/Interview</span>
                <span className="text-[10px] text-slate-300">Score Recording</span>
              </div>
              <div className="bg-indigo-500/30 p-3 rounded-2xl backdrop-blur-sm border border-indigo-400/30 ring-2 ring-indigo-400">
                <span className="block font-bold text-xs text-amber-300">4. School Approval</span>
                <span className="text-[10px] text-indigo-200">Liability Shield</span>
              </div>
              <div className="bg-emerald-500/20 p-3 rounded-2xl backdrop-blur-sm border border-emerald-400/30 text-emerald-300">
                <span className="block font-bold text-xs">5. Zero-Manual</span>
                <span className="text-[10px]">Auto Account & Invoice</span>
              </div>
            </div>
          </div>

          {/* Admission Applications List */}
          <div className="space-y-4">
            {admissions.map((app) => (
              <div
                key={app.id}
                className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 transition-all hover:border-indigo-300"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200/60">
                      {app.applicationNo}
                    </span>
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">{app.studentName}</h3>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {app.applyingClass}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <p><span className="text-slate-400">Parent:</span> <b>{app.parentName}</b></p>
                    <p><span className="text-slate-400">Mobile:</span> <b>{app.phone}</b></p>
                    <p><span className="text-slate-400">Submitted Date:</span> <b>{app.submittedDate}</b></p>
                  </div>

                  {app.remarks && (
                    <p className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200/50 inline-block">
                      💬 Note: {app.remarks}
                    </p>
                  )}
                </div>

                {/* Action Buttons based on status */}
                <div className="flex items-center gap-3 shrink-0">
                  {app.status === 'SUBMITTED' && (
                    <button
                      onClick={() => updateAdmissionStatus(app.id, 'INTERVIEW_SCHEDULED', 85, 'Docs verified cleanly. Entrance interview scheduled score: 85/100')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-colors"
                    >
                      <FileCheck className="w-4 h-4" /> Verify Docs & Set Score (85)
                    </button>
                  )}

                  {app.status === 'INTERVIEW_SCHEDULED' && (
                    <button
                      onClick={() => approveAdmissionAndCreateStudent(app.id)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25 transition-all"
                    >
                      <ShieldCheck className="w-4 h-4" /> Principal Final Approval & Enroll
                    </button>
                  )}

                  {app.status === 'ENROLLED' && (
                    <span className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-300/60">
                      <CheckCircle2 className="w-4 h-4" /> Enrolled & Profile Created
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'PARENT_FORM' && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
          <div className="border-b pb-4 border-slate-100 dark:border-slate-800 text-center">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
              Public Online Admission Form
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Simulate parent submitting admission for ABC Public School.
            </p>
          </div>

          {submittedAppNo ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/50 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-center space-y-3">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h4 className="text-base font-bold text-emerald-900 dark:text-emerald-300">
                Application Submitted Successfully!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Your Application Registration Number is <b className="text-emerald-700 dark:text-emerald-400 font-mono text-sm">{submittedAppNo}</b>.
              </p>
              <button
                onClick={() => { setSubmittedAppNo(null); setActiveTab('PIPELINE'); }}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow"
              >
                Return to School Admin Desk
              </button>
            </div>
          ) : (
            <form onSubmit={handleParentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={parentForm.studentName}
                  onChange={(e) => setParentForm({ ...parentForm, studentName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none"
                  placeholder="e.g. Aarav Patel"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Applying Class</label>
                  <select
                    value={parentForm.applyingClass}
                    onChange={(e) => setParentForm({ ...parentForm, applyingClass: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="Class VI">Class VI</option>
                    <option value="Class VIII">Class VIII</option>
                    <option value="Class X">Class X</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Parent / Guardian Name</label>
                  <input
                    type="text"
                    required
                    value={parentForm.parentName}
                    onChange={(e) => setParentForm({ ...parentForm, parentName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    placeholder="e.g. Mahesh Patel"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Mobile / WhatsApp No.</label>
                  <input
                    type="text"
                    required
                    value={parentForm.phone}
                    onChange={(e) => setParentForm({ ...parentForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    placeholder="9811223344"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-medium">Email Address</label>
                  <input
                    type="email"
                    required
                    value={parentForm.email}
                    onChange={(e) => setParentForm({ ...parentForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                    placeholder="mahesh.patel@gmail.com"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                <FileCheck className="w-5 h-5 text-indigo-500 mx-auto mb-1" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">Birth Certificate & Marksheet Attached</p>
                <p className="text-[10px] text-slate-400">PDF / Document Verified (Simulated)</p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit Application to School
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
