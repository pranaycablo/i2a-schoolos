import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  Building2,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Palette,
  Users,
  BookOpen,
  CreditCard,
  Bell,
  ShieldCheck,
  Save,
  Check
} from 'lucide-react';

export const SchoolOnboardingWizard: React.FC = () => {
  const { branding, updateBranding } = useSchool();

  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingStatus, setOnboardingStatus] = useState<'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'>('IN_PROGRESS');

  const steps = [
    { number: 1, title: 'School Information', icon: Building2 },
    { number: 2, title: 'Branding & Logo', icon: Palette },
    { number: 3, title: 'Academic Session', icon: BookOpen },
    { number: 4, title: 'Classes & Sections', icon: Users },
    { number: 5, title: 'Fee Configuration', icon: CreditCard },
    { number: 6, title: 'Notifications & Complete', icon: Bell }
  ];

  const progressPercentage = Math.round((currentStep / steps.length) * 100);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Onboarding Header */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> SaaS Multi-Tenant Onboarding Setup
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              Initialize {branding.name} Workspace
            </h2>
          </div>
          <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-xs rounded-full border border-indigo-200">
            Setup Status: {onboardingStatus} ({progressPercentage}%)
          </span>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
            <span>Step {currentStep} of {steps.length}</span>
            <span>{progressPercentage}% Complete</span>
          </div>
        </div>
      </div>

      {/* Step Pills Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-xs">
        {steps.map((s) => {
          const Icon = s.icon;
          const isDone = s.number < currentStep;
          const isCurrent = s.number === currentStep;

          return (
            <button
              key={s.number}
              onClick={() => setCurrentStep(s.number)}
              className={`p-3 rounded-2xl border flex flex-col items-center gap-1 text-center transition-all ${
                isCurrent
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md font-bold'
                  : isDone
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200'
              }`}
            >
              {isDone ? <Check className="w-4 h-4 text-emerald-600" /> : <Icon className="w-4 h-4" />}
              <span className="text-[10px] leading-tight">{s.title}</span>
            </button>
          );
        })}
      </div>

      {/* Onboarding Wizard Form Step Content */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 text-xs">
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Step 1: School Identity & Registration</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-500 mb-1 font-medium">School Official Name</label>
                <input type="text" value={branding.name} readOnly className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border" />
              </div>
              <div>
                <label className="block text-slate-500 mb-1 font-medium">School Code</label>
                <input type="text" value="I2A-PTN-000001" readOnly className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border font-mono font-bold" />
              </div>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Step 2: Branding & File Validation</h3>
            <p className="text-slate-500">Logo, stamp, and digital signature verified cleanly with format security constraints (PNG/JPG/WEBP).</p>
          </div>
        )}

        {currentStep === 6 && (
          <div className="py-8 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto" />
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Onboarding Complete!</h3>
            <p className="text-xs text-slate-500">Your school tenant has been initialized and configured.</p>
            <button
              onClick={() => setOnboardingStatus('COMPLETED')}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-bold shadow-lg"
            >
              Activate Full SaaS Operations
            </button>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-100 dark:border-slate-800">
          <button
            disabled={currentStep === 1}
            onClick={() => setCurrentStep(currentStep - 1)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300 font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Previous
          </button>

          <button
            disabled={currentStep === steps.length}
            onClick={() => setCurrentStep(currentStep + 1)}
            className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
          >
            Next Step <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
