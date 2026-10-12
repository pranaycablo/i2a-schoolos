import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { SubscriptionBillingService } from '../../services/subscription/SubscriptionBillingService';
import type { UserSession } from '../../services/TenantSecurityService';
import type {
  ClassGroupPricingCategory,
  CourseProgramCategory,
  SchoolSubscriptionProfile,
  SubscriptionInvoice
} from '../../types';
import {
  CreditCard,
  ShieldCheck,
  Clock,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Bell,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  Receipt,
  GraduationCap,
  Layers,
  Award
} from 'lucide-react';

export const SubscriptionBillingModule: React.FC = () => {
  const { branding, currentRole, students, logAction } = useSchool();
  const schoolId = branding?.id || 'I2A-SCH-000001';
  const billingService = SubscriptionBillingService.getInstance();

  const session: UserSession = {
    id: currentRole === 'SUPER_ADMIN' ? 'super-admin-01' : 'user-active-principal',
    email: currentRole === 'SUPER_ADMIN' ? 'ops@i2aschoolos.com' : 'admin@school.com',
    tenantId: currentRole === 'SUPER_ADMIN' ? 'I2A-PLATFORM' : schoolId,
    role: currentRole,
    status: 'ACTIVE'
  };

  const isSuperAdmin = currentRole === 'SUPER_ADMIN';

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INVOICES' | 'NOTIFICATIONS' | 'PLATFORM_PRICING'>('OVERVIEW');

  // Load School Profile
  const [profile, setProfile] = useState<SchoolSubscriptionProfile>(() => {
    try {
      return billingService.getSubscriptionProfile(schoolId, session);
    } catch {
      return billingService.getSubscriptionProfile('I2A-SCH-000001', {
        id: 'fallback-admin',
        email: 'admin@school.com',
        tenantId: 'I2A-SCH-000001',
        role: 'ADMIN',
        status: 'ACTIVE'
      });
    }
  });

  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>(() => {
    try {
      return billingService.getInvoicesForSchool(schoolId, session);
    } catch {
      return [];
    }
  });

  const [notifications, setNotifications] = useState(() => {
    try {
      return billingService.getSchoolNotifications(schoolId, session);
    } catch {
      return [];
    }
  });

  const [selectedPrograms, setSelectedPrograms] = useState<CourseProgramCategory[]>(profile.selectedPrograms);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Helper: Format Paise to Rupees
  const formatRupees = (paise: number) => `₹${(paise / 100).toLocaleString('en-IN')}`;

  // Current enrolled breakdown
  const enrolledCounts = useMemo(() => {
    // If students exist in SchoolContext, we can group them or use profile counts
    return profile.enrolledCountsByClassGroup;
  }, [profile]);

  // Dynamic estimate calculation
  const estimate = useMemo(() => {
    return billingService.calculateSubscriptionEstimate(
      profile.schoolId,
      enrolledCounts,
      selectedPrograms,
      session
    );
  }, [billingService, profile.schoolId, enrolledCounts, selectedPrograms, session]);

  // Handlers
  const handleToggleProgram = (prog: CourseProgramCategory) => {
    if (prog === 'SCHOOL_ERP_CORE') return; // Cannot disable Core ERP
    setSelectedPrograms((prev) =>
      prev.includes(prog) ? prev.filter((p) => p !== prog) : [...prev, prog]
    );
  };

  const handleGenerateInvoice = () => {
    try {
      const inv = billingService.generateSubscriptionInvoice(profile.schoolId, session);
      setInvoices(billingService.getInvoicesForSchool(profile.schoolId, session));
      setActionSuccess(`Generated new invoice ${inv.invoiceNo} for ${formatRupees(inv.totalAmountInPaise)}.`);
      setTimeout(() => setActionSuccess(null), 4000);
      logAction('INVOICE_GENERATED', 'BILLING', `Generated subscription invoice ${inv.invoiceNo}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    }
  };

  const handlePayInvoice = (invoiceId: string) => {
    try {
      const ref = `UTR-PLATFORM-${Date.now().toString().slice(-6)}`;
      const updated = billingService.paySubscriptionInvoice(profile.schoolId, invoiceId, ref, session);
      setInvoices(billingService.getInvoicesForSchool(profile.schoolId, session));
      setProfile(billingService.getSubscriptionProfile(profile.schoolId, session));
      setActionSuccess(`Payment confirmed for invoice ${updated.invoiceNo} via i2A Platform Gateway.`);
      setTimeout(() => setActionSuccess(null), 4000);
      logAction('INVOICE_PAID', 'BILLING', `Paid subscription invoice ${updated.invoiceNo}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    }
  };

  const handleRunScheduler = () => {
    try {
      const res = billingService.runTrialReminderScheduler();
      setNotifications(billingService.getSchoolNotifications(profile.schoolId, session));
      setProfile(billingService.getSubscriptionProfile(profile.schoolId, session));
      setActionSuccess(`Executed background scheduler: Processed ${res.processedCount} schools, dispatched ${res.remindersSent} reminders.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setActionError(msg);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-16 text-xs">
      {/* Top Banner: Free Trial & Subscription Status Deck */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  i2A SchoolOS Subscription & Billing
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-mono text-[10px] font-bold">
                  {profile.schoolId}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  profile.status === 'TRIAL_ACTIVE'
                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                    : profile.status === 'ACTIVE_PAID'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                }`}>
                  {profile.status === 'TRIAL_ACTIVE'
                    ? `FREE TRIAL (${profile.trialDaysRemaining} DAYS LEFT)`
                    : profile.status}
                </span>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                Dynamic Class-wise Per-Student Pricing • 30-Day Free Trial • Day 20+ Reminders • NEET AI Add-ons
              </p>
            </div>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('OVERVIEW')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'OVERVIEW'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Overview & Plans
            </button>
            <button
              onClick={() => setActiveTab('INVOICES')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all relative ${
                activeTab === 'INVOICES'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab('NOTIFICATIONS')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 relative ${
                activeTab === 'NOTIFICATIONS'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Bell className="w-3 h-3" /> Reminders ({notifications.length})
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setActiveTab('PLATFORM_PRICING')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                  activeTab === 'PLATFORM_PRICING'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3 h-3" /> Platform Pricing
              </button>
            )}
          </div>
        </div>

        {/* Action alerts */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}
        {actionError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 rounded-2xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>{actionError}</span>
          </div>
        )}

        {/* 30-Day Trial Status & Data Retention Notice */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 space-y-1">
            <div className="flex items-center justify-between text-amber-900 dark:text-amber-300 font-bold">
              <span>30-Day Free Trial Window</span>
              <Clock className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-xl font-extrabold text-amber-950 dark:text-amber-200">
              {profile.trialDaysRemaining} Days Remaining
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Started: {new Date(profile.trialStartAt).toLocaleDateString()} • Ends: {new Date(profile.trialEndAt).toLocaleDateString()}
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 space-y-1">
            <div className="flex items-center justify-between text-indigo-900 dark:text-indigo-300 font-bold">
              <span>Dynamic Estimated Billing</span>
              <TrendingUp className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-xl font-extrabold text-indigo-950 dark:text-indigo-200">
              {formatRupees(estimate.totalAmountInPaise)} <span className="text-xs font-normal text-slate-500">/month</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Based on {Object.values(enrolledCounts).reduce((a, b) => a + b, 0)} enrolled students + 18% GST
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/60 space-y-1">
            <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-300 font-bold">
              <span>Data Retention Policy</span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
              100% Data Preservation Guaranteed
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-snug">
              Trial expiry enters a read-only grace period. No student records, attendance, or exam data are ever deleted.
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* TAB 1: OVERVIEW & DYNAMIC PRICING BREAKDOWN                           */}
      {/* ==================================================================== */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Class-Group Enrolled Breakdown Table */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  Class-wise Student Enrollment & Tier Rates
                </h3>
                <p className="text-[11px] text-slate-500">
                  Dynamic subscription rate per student configured by academic group
                </p>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
                Authoritative Count Engine
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-2.5">Academic Group</th>
                    <th className="py-2.5">Enrolled Count</th>
                    <th className="py-2.5">Rate / Student</th>
                    <th className="py-2.5">Monthly Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11px]">
                  {estimate.lineItems
                    .filter((l) => !['NEET_PREP', 'NEET_PG_PREP', 'ENTRANCE_EXAM_PREP'].includes(l.category))
                    .map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                        <td className="py-3 font-semibold text-slate-900 dark:text-white">
                          {item.description.split('(')[0].trim()}
                        </td>
                        <td className="py-3 font-bold text-indigo-600 dark:text-indigo-400">
                          {item.studentCount} Students
                        </td>
                        <td className="py-3 font-mono text-slate-600 dark:text-slate-400">
                          {formatRupees(item.ratePerStudentInPaise)}
                        </td>
                        <td className="py-3 font-bold text-slate-900 dark:text-white">
                          {formatRupees(item.amountInPaise)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Independent Entrance Exam & NEET Add-ons Section */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    Specialized Medical AI & Entrance Exam Add-ons
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Independent curriculum & test packages. <b>NOT</b> bundled into standard school ERP fee.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* NEET UG Prep Card */}
                <div
                  onClick={() => handleToggleProgram('NEET_PREP')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    selectedPrograms.includes('NEET_PREP')
                      ? 'bg-purple-50/60 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 ${
                    selectedPrograms.includes('NEET_PREP') ? 'bg-purple-600 text-white' : 'border border-slate-300'
                  }`}>
                    {selectedPrograms.includes('NEET_PREP') && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                      i2A Medical AI — NEET UG Prep
                    </div>
                    <div className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">
                      +₹150/candidate/month (Classes 11 & 12)
                    </div>
                    <p className="text-[10px] text-slate-500">
                      AI Question Bank, NCERT deep drill, and full-length NTA pattern tests.
                    </p>
                  </div>
                </div>

                {/* NEET PG Specialization Suite */}
                <div
                  onClick={() => handleToggleProgram('NEET_PG_PREP')}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
                    selectedPrograms.includes('NEET_PG_PREP')
                      ? 'bg-purple-50/60 dark:bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 ${
                    selectedPrograms.includes('NEET_PG_PREP') ? 'bg-purple-600 text-white' : 'border border-slate-300'
                  }`}>
                    {selectedPrograms.includes('NEET_PG_PREP') && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-xs text-slate-900 dark:text-white">
                      NEET PG Residency Entrance Suite
                    </div>
                    <div className="text-[10px] text-purple-700 dark:text-purple-300 font-bold">
                      +₹250/candidate/month (Clinical Batch)
                    </div>
                    <p className="text-[10px] text-slate-500">
                      High-yield clinical vignettes, image-based tests, and residency simulator.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Billing Summary & Invoice Action Deck */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-600" />
                Monthly Subscription Invoice Summary
              </h3>

              <div className="space-y-2.5 pt-2 text-xs">
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Class Group Base Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatRupees(
                      estimate.lineItems
                        .filter((l) => !['NEET_PREP', 'NEET_PG_PREP', 'ENTRANCE_EXAM_PREP'].includes(l.category))
                        .reduce((sum, l) => sum + l.amountInPaise, 0)
                    )}
                  </span>
                </div>

                {selectedPrograms.includes('NEET_PREP') && (
                  <div className="flex justify-between text-purple-600 dark:text-purple-400">
                    <span>NEET UG Add-on Fee:</span>
                    <span className="font-mono font-bold">
                      {formatRupees(estimate.lineItems.find((l) => l.category === 'NEET_PREP')?.amountInPaise || 0)}
                    </span>
                  </div>
                )}

                {selectedPrograms.includes('NEET_PG_PREP') && (
                  <div className="flex justify-between text-purple-600 dark:text-purple-400">
                    <span>NEET PG Suite Add-on:</span>
                    <span className="font-mono font-bold">
                      {formatRupees(estimate.lineItems.find((l) => l.category === 'NEET_PG_PREP')?.amountInPaise || 0)}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Subtotal:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatRupees(estimate.subtotalInPaise)}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>GST (18% Statutory):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {formatRupees(estimate.taxInPaise)}
                  </span>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex justify-between text-sm font-extrabold text-slate-900 dark:text-white">
                  <span>Total Amount Due:</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono text-base">
                    {formatRupees(estimate.totalAmountInPaise)}
                  </span>
                </div>
              </div>

              <div className="pt-3 space-y-2">
                <button
                  type="button"
                  onClick={handleGenerateInvoice}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4" /> Generate Official Invoice
                </button>

                <button
                  type="button"
                  onClick={handleRunScheduler}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-2xl transition-all text-[11px] flex items-center justify-center gap-1.5"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-500" /> Run Trial Notification Scheduler Check
                </button>
              </div>
            </div>

            {/* Architecture Separation Notice */}
            <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-indigo-950 dark:text-indigo-200">
                  Architectural Payment Separation
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  School Marketplace transactions process through the school&apos;s direct merchant accounts (Razorpay/PhonePe/Paytm). In contrast, i2A SchoolOS platform subscription billing settles strictly through i2A&apos;s official billing engine.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 2: INVOICES & PAYMENT LEDGER                                     */}
      {/* ==================================================================== */}
      {activeTab === 'INVOICES' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Official Subscription Invoices Ledger
              </h3>
              <p className="text-[11px] text-slate-500">
                Immutable invoice records with class-wise student rate snapshots
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="py-2.5">Invoice No</th>
                  <th className="py-2.5">Billing Period</th>
                  <th className="py-2.5">Subtotal</th>
                  <th className="py-2.5">GST 18%</th>
                  <th className="py-2.5">Total Amount</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[11px]">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                    <td className="py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                      {inv.invoiceNo}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-400">
                      {new Date(inv.billingPeriodStart).toLocaleDateString()} to {new Date(inv.billingPeriodEnd).toLocaleDateString()}
                    </td>
                    <td className="py-3 font-mono">{formatRupees(inv.subtotalInPaise)}</td>
                    <td className="py-3 font-mono">{formatRupees(inv.taxInPaise)}</td>
                    <td className="py-3 font-bold font-mono text-slate-900 dark:text-white">
                      {formatRupees(inv.totalAmountInPaise)}
                    </td>
                    <td className="py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.status === 'PAID'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {inv.status === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => handlePayInvoice(inv.id)}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                        >
                          Pay Subscription
                        </button>
                      ) : (
                        <span className="font-mono text-[10px] text-emerald-600 font-semibold">
                          {inv.paymentRef}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-slate-400">
                      No invoices generated yet for School {profile.schoolId}. Click &quot;Generate Official Invoice&quot; in the Overview tab.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 3: TRIAL NOTIFICATIONS & REMINDERS                               */}
      {/* ==================================================================== */}
      {activeTab === 'NOTIFICATIONS' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" />
                Trial Milestone & Day 20+ Payment Reminder Queue
              </h3>
              <p className="text-[11px] text-slate-500">
                Automated scheduler notifications dispatched on Day 1, Day 20, Days 21-29, and Day 30
              </p>
            </div>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
              Channel: In-App Delivery (SMS/WhatsApp: NOT_CONFIGURED)
            </span>
          </div>

          <div className="space-y-3">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-mono text-[10px] font-bold">
                      Day {notif.dayNumber}
                    </span>
                    <div className="font-bold text-xs text-slate-900 dark:text-white">{notif.title}</div>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">{notif.message}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 font-mono block">
                    {new Date(notif.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">
                    {notif.status}
                  </span>
                </div>
              </div>
            ))}
            {notifications.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                No trial notifications queued for this school.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* TAB 4: PLATFORM ADMIN PRICING EDITOR (SUPER_ADMIN ONLY)              */}
      {/* ==================================================================== */}
      {activeTab === 'PLATFORM_PRICING' && isSuperAdmin && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              i2A SchoolOS Global Dynamic Pricing Rules Engine
            </h3>
            <p className="text-[11px] text-slate-500">
              Platform Super Admin view: configure class group rates in integer paise. Versioned rules preserve historical invoices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            {billingService.getPricingRules(session).map((rule) => (
              <div
                key={rule.classGroup}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="font-bold text-xs text-slate-900 dark:text-white">{rule.label}</div>
                <div className="text-lg font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                  {formatRupees(rule.pricePerStudentInPaise)} <span className="text-xs font-normal text-slate-400">/mo</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  Min Commitment: {rule.minimumCommitment} students • Version: v{rule.version}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
