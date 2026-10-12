import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { AcademicMasterService, AcademicSession, ClassMaster, SectionMaster, SubjectMaster, TeacherAssignment } from '../../services/AcademicMasterService';
import {
  BookOpen,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Plus,
  Calendar,
  Layers,
  Sparkles,
  Award,
  Check,
  X
} from 'lucide-react';

export const AcademicMasterDataModule: React.FC = () => {
  const { branding, currentRole } = useSchool();

  const [activeTab, setActiveTab] = useState<'SESSIONS' | 'CLASSES_SECTIONS' | 'SUBJECTS' | 'ASSIGNMENTS' | 'READINESS'>('CLASSES_SECTIONS');

  // Initial Seed Data for Academic Masters
  const [sessions, setSessions] = useState<AcademicSession[]>([
    { id: 'ses-2025', tenantId: 'sch-001', name: '2025-2026', startDate: '2025-04-01', endDate: '2026-03-31', status: 'COMPLETED', isCurrent: false },
    { id: 'ses-2026', tenantId: 'sch-001', name: '2026-2027', startDate: '2026-04-01', endDate: '2027-03-31', status: 'ACTIVE', isCurrent: true },
    { id: 'ses-2027', tenantId: 'sch-001', name: '2027-2028', startDate: '2027-04-01', endDate: '2028-03-31', status: 'UPCOMING', isCurrent: false }
  ]);

  const [classes] = useState<ClassMaster[]>([
    { id: 'cls-8', tenantId: 'sch-001', sessionId: 'ses-2026', name: 'Class VIII', numericOrder: 8, academicLevel: 'MIDDLE' },
    { id: 'cls-10', tenantId: 'sch-001', sessionId: 'ses-2026', name: 'Class X', numericOrder: 10, academicLevel: 'SECONDARY' }
  ]);

  const [sections] = useState<SectionMaster[]>([
    { id: 'sec-8a', tenantId: 'sch-001', classId: 'cls-8', className: 'Class VIII', sessionId: 'ses-2026', name: 'A', capacity: 40, currentEnrolled: 37, roomNumber: 'Room 204', classTeacherId: 'stf-1', classTeacherName: 'Mrs. Sunita Mishra' },
    { id: 'sec-8b', tenantId: 'sch-001', classId: 'cls-8', className: 'Class VIII', sessionId: 'ses-2026', name: 'B', capacity: 40, currentEnrolled: 40, roomNumber: 'Room 205', classTeacherId: 'stf-2', classTeacherName: 'Mr. Alok Nath' }
  ]);

  const [subjects] = useState<SubjectMaster[]>([
    { id: 'sub-sci', tenantId: 'sch-001', sessionId: 'ses-2026', classId: 'cls-8', className: 'Class VIII', name: 'Science', code: 'SCI-801', type: 'CORE', theoryMarks: 80, practicalMarks: 0, internalMarks: 20, totalMarks: 100, passingMarks: 33 },
    { id: 'sub-mat', tenantId: 'sch-001', sessionId: 'ses-2026', classId: 'cls-8', className: 'Class VIII', name: 'Mathematics', code: 'MAT-801', type: 'CORE', theoryMarks: 80, practicalMarks: 0, internalMarks: 20, totalMarks: 100, passingMarks: 33 }
  ]);

  const [assignments] = useState<TeacherAssignment[]>([
    { id: 'asg-1', tenantId: 'sch-001', sessionId: 'ses-2026', teacherId: 'stf-1', teacherName: 'Mrs. Sunita Mishra', classId: 'cls-8', className: 'Class VIII', sectionId: 'sec-8a', sectionName: 'A', subjectId: 'sub-sci', subjectName: 'Science' }
  ]);

  const currentUserSession = {
    id: 'user-principal',
    email: branding.email,
    tenantId: 'sch-001',
    role: currentRole,
    status: 'ACTIVE' as const
  };

  const readinessStatus = AcademicMasterService.checkAcademicReadiness(
    'sch-001',
    sessions,
    classes,
    sections,
    subjects,
    assignments
  );

  const handleActivateSession = (sessionId: string) => {
    const updated = AcademicMasterService.activateSession(currentUserSession, 'sch-001', sessionId, sessions);
    setSessions(updated);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" /> Academic Master Configuration
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Academic Sessions, Classes, Sections & Subjects Master
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Centralized academic hierarchy: Session → Campus → Class → Section → Stream → Subject → Teacher Assignment.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('SESSIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'SESSIONS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Sessions ({sessions.length})
          </button>
          <button
            onClick={() => setActiveTab('CLASSES_SECTIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CLASSES_SECTIONS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Classes & Sections
          </button>
          <button
            onClick={() => setActiveTab('SUBJECTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'SUBJECTS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Subjects ({subjects.length})
          </button>
          <button
            onClick={() => setActiveTab('READINESS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'READINESS' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Readiness Checker
          </button>
        </div>
      </div>

      {activeTab === 'SESSIONS' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-xs">
          <div className="flex justify-between items-center pb-2 border-b">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Academic Sessions Master</h3>
            <span className="text-[10px] text-slate-400 font-semibold">Rule: Exactly 1 Session Active at a time</span>
          </div>

          <div className="space-y-3">
            {sessions.map((ses) => (
              <div
                key={ses.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{ses.name}</h4>
                    {ses.isCurrent && (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700">
                        ACTIVE SESSION
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Duration: {ses.startDate} to {ses.endDate} • Status: {ses.status}
                  </p>
                </div>

                {!ses.isCurrent && ses.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleActivateSession(ses.id)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs shadow"
                  >
                    Activate Session
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'CLASSES_SECTIONS' && (
        <div className="space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {classes.map((cls) => {
              const classSections = sections.filter((sec) => sec.classId === cls.id);
              return (
                <div key={cls.id} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                  <div className="flex justify-between items-start border-b pb-3">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{cls.name}</h3>
                      <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full">
                        Level: {cls.academicLevel}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-400">Order #{cls.numericOrder}</span>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-700 dark:text-slate-300">Sections & Capacity Tracker</h4>
                    {classSections.map((sec) => {
                      const capCheck = AcademicMasterService.checkSectionCapacity(sec);
                      return (
                        <div key={sec.id} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-extrabold text-sm text-indigo-600">Section {sec.name}</span>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              capCheck.statusMessage === 'SECTION_FULL'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              Enrolled: {sec.currentEnrolled}/{sec.capacity} ({capCheck.statusMessage})
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500">
                            Room: <b>{sec.roomNumber}</b> • Class Teacher: <b>{sec.classTeacherName || 'Unassigned'}</b>
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'READINESS' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 text-xs">
          <div className="flex justify-between items-center border-b pb-4">
            <div>
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Academic Master Data Auditor
              </span>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">School Academic Readiness Status</h3>
            </div>
            <span className={`px-4 py-1.5 rounded-full font-extrabold text-xs ${
              readinessStatus.status === 'READY' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
            }`}>
              Status: {readinessStatus.status} ({readinessStatus.setupPercentage}%)
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(readinessStatus.checks).map(([key, val]) => (
              <div key={key} className={`p-4 rounded-2xl border flex items-center gap-3 ${
                val ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900' : 'bg-amber-50/60 border-amber-200 text-amber-900'
              }`}>
                {val ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
                <div>
                  <p className="font-bold capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-[10px] text-slate-500">{val ? 'Verified' : 'Action Required'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
