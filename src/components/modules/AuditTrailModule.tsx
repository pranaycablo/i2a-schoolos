import React from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ShieldAlert, ShieldCheck, Clock, UserCheck, Lock, FileCheck } from 'lucide-react';

export const AuditTrailModule: React.FC = () => {
  const { auditLogs } = useSchool();

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-4 h-4 text-emerald-500" /> Operational Security & Forensic Audit Engine
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
            Immutable Audit Trail & Controlled Liability Protection
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Complete forensic log recording WHO did WHAT, WHEN, FROM WHERE, and WHO APPROVED for ultimate SaaS liability protection.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 px-4 py-2 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Liability Shield Mode: ACTIVE
        </div>
      </div>

      {/* Controlled Approval Safeguard Status */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-bold text-sm text-indigo-400 uppercase tracking-wider flex items-center gap-2">
          <Lock className="w-4 h-4" /> 5-Layer Controlled Approval Matrix
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400">1. AI Question Papers</span>
            <p className="text-slate-300 text-[11px]">AI Draft → Teacher Review → Principal Approval Lock</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400">2. Student Admission</span>
            <p className="text-slate-300 text-[11px]">Parent Form → Doc Verification → Principal Sign-Off</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400">3. Fee Payment & Concessions</span>
            <p className="text-slate-300 text-[11px]">Gateway Verification → Auto Receipt → Double Entry Log</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400">4. Exam Results</span>
            <p className="text-slate-300 text-[11px]">Auto Objective Score → Subjective Teacher Evaluation</p>
          </div>
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400">5. Payroll Release</span>
            <p className="text-slate-300 text-[11px]">Working Days Calculation → HR/Principal Disburse</p>
          </div>
        </div>
      </div>

      {/* Forensic Audit Logs List */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center justify-between border-b pb-3">
          <span>Real-time Forensic Audit Trail ({auditLogs.length} Events)</span>
          <span className="text-xs text-slate-400 font-normal">Encrypted Log Storage</span>
        </h3>

        <div className="space-y-3">
          {auditLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-0.5 rounded-full text-[10px]">
                    {log.action}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{log.user} ({log.role})</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">{log.timestamp} • IP {log.ipAddress}</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px] pt-1">{log.details}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
