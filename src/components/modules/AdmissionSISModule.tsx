import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { StudentAdmissionService, AdmissionEnquiry, StudentMasterProfile, ParentProfile } from '../../services/StudentAdmissionService';
import {
  Users,
  UserPlus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Phone,
  Mail,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Filter,
  Layers,
  Award
} from 'lucide-react';

export const AdmissionSISModule: React.FC = () => {
  const { branding, currentRole } = useSchool();

  const [activeTab, setActiveTab] = useState<'ENQUIRIES' | 'PATTERN_CONFIG' | 'STUDENT_LIFECYCLE'>('ENQUIRIES');
  const [admissionPattern, setAdmissionPattern] = useState('ADM-{YEAR}-{SEQ}');

  const [enquiries] = useState<AdmissionEnquiry[]>([
    { id: 'enq-1', tenantId: 'sch-001', studentName: 'Vikas Sharma', parentName: 'Ramesh Sharma', phone: '9811223344', email: 'ramesh.sharma@gmail.com', desiredClass: 'Class VIII', academicSession: '2026-2027', source: 'WEBSITE', status: 'NEW', followUpDate: '2026-10-10' },
    { id: 'enq-2', tenantId: 'sch-001', studentName: 'Kriti Verma', parentName: 'Sanjay Verma', phone: '9822334455', email: 'sanjay.verma@gmail.com', desiredClass: 'Class X', academicSession: '2026-2027', source: 'WALK_IN', status: 'CONTACTED', followUpDate: '2026-10-09' }
  ]);

  const [studentsList, setStudentsList] = useState<StudentMasterProfile[]>([
    {
      id: 'std-101',
      tenantId: 'sch-001',
      admissionNo: 'ADM-2026-0001',
      rollNo: '01',
      fullName: 'Rahul Kumar',
      dob: '2012-05-14',
      gender: 'MALE',
      photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      email: 'sanjay.kumar@gmail.com',
      mobile: '9876543210',
      address: { line1: 'Flat 302, Green Villa', city: 'Patna', district: 'Patna', state: 'Bihar', pincode: '800001' },
      currentSession: '2026-2027',
      currentClass: 'Class VIII',
      currentSection: 'A',
      admissionDate: '2022-04-10',
      status: 'ACTIVE',
      parentId: 'prt-101',
      parentName: 'Sanjay Kumar',
      parentPhone: '9876543210'
    }
  ]);

  const previewGeneratedNo = StudentAdmissionService.generateAdmissionNumber(admissionPattern, studentsList.length + 1);

  const currentUserSession = {
    id: 'usr-admin',
    email: branding.email,
    tenantId: 'sch-001',
    role: currentRole,
    status: 'ACTIVE' as const
  };

  const handleSimulateAdmissionConfirm = () => {
    const targetSection = {
      id: 'sec-8a',
      tenantId: 'sch-001',
      classId: 'cls-8',
      className: 'Class VIII',
      sessionId: 'ses-2026',
      name: 'A',
      capacity: 40,
      currentEnrolled: 37,
      roomNumber: 'Room 204'
    };

    const result = StudentAdmissionService.confirmAdmissionAndEnroll(
      currentUserSession,
      'sch-001',
      { studentName: 'New Student Test', applyingClass: 'Class VIII', parentName: 'Test Parent', phone: '9899001122', email: 'testparent@gmail.com' },
      targetSection,
      studentsList,
      admissionPattern
    );

    setStudentsList([...studentsList, result.student]);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <UserPlus className="w-4 h-4" /> Student Lifecycle & Admission Funnel
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Admission Enquiries, Form Builder & SIS Lifecycle
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Single Entry Data Capture: Enquiry → Online Application → Transactional Admission Confirmation → Student/Parent Accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('ENQUIRIES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'ENQUIRIES' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Enquiries ({enquiries.length})
          </button>
          <button
            onClick={() => setActiveTab('PATTERN_CONFIG')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PATTERN_CONFIG' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Admission No Pattern
          </button>
          <button
            onClick={() => setActiveTab('STUDENT_LIFECYCLE')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'STUDENT_LIFECYCLE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Active Roster ({studentsList.length})
          </button>
        </div>
      </div>

      {activeTab === 'ENQUIRIES' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <div className="flex justify-between items-center border-b pb-3">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Admission Enquiries & Marketing Funnel</h3>
            <span className="text-[10px] text-slate-400 font-semibold">Sources: Website, Walk-in, Referral</span>
          </div>

          <div className="space-y-3">
            {enquiries.map((enq) => (
              <div key={enq.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-slate-900 dark:text-white">{enq.studentName}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                      {enq.desiredClass}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">Parent: {enq.parentName} • Mobile: {enq.phone} • Source: {enq.source}</p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Follow-up: {enq.followUpDate}
                  </span>
                  <button
                    onClick={handleSimulateAdmissionConfirm}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow transition-all"
                  >
                    Confirm Admission
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'PATTERN_CONFIG' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs max-w-xl">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-3">Admission Number Pattern Generator</h3>
          <div>
            <label className="block text-slate-500 mb-1 font-medium">Configure Number Pattern Format</label>
            <select
              value={admissionPattern}
              onChange={(e) => setAdmissionPattern(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-slate-900 dark:text-white font-mono font-bold"
            >
              <option value="ADM-{YEAR}-{SEQ}">ADM-{`{YEAR}`}-{`{SEQ}`} (e.g. ADM-2026-0002)</option>
              <option value="{YEAR}-{SEQ}">{`{YEAR}`}-{`{SEQ}`} (e.g. 2026-0002)</option>
              <option value="ABC/{YEAR}/{SEQ}">ABC/{`{YEAR}`}/{`{SEQ}`} (e.g. ABC/2026/0002)</option>
            </select>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-800 space-y-1">
            <span className="text-[10px] font-bold text-indigo-600 uppercase">Generated Admission Number Sample</span>
            <p className="text-xl font-black text-indigo-900 dark:text-indigo-200 font-mono">{previewGeneratedNo}</p>
          </div>
        </div>
      )}

      {activeTab === 'STUDENT_LIFECYCLE' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white border-b pb-3">Active Student Master Profiles</h3>

          <div className="space-y-3">
            {studentsList.map((std) => (
              <div key={std.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <img src={std.photoUrl} alt={std.fullName} className="h-10 w-10 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{std.fullName}</h4>
                    <p className="text-[10px] text-slate-500">
                      Admission No: <b className="text-indigo-600 font-mono">{std.admissionNo}</b> • Class: <b>{std.currentClass}-{std.currentSection}</b>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">
                    {std.status}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Parent: {std.parentName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
