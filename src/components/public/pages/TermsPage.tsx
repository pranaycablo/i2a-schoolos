import React from 'react';
import { FileText, Shield, CheckCircle2, Clock, Scale } from 'lucide-react';
import { PublicRoute } from '../../../types';

interface TermsPageProps {
  onNavigate: (route: PublicRoute, slug?: string) => void;
  isHindi?: boolean;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate, isHindi = false }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10 font-sans text-slate-300 text-xs sm:text-sm leading-relaxed">
      {/* Title Header */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-700 text-[11px] font-bold uppercase tracking-wider">
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>Institutional SaaS Agreement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          {isHindi ? 'सेवा की शर्तें (Terms of Service)' : 'Terms of Service & Service Level Agreement'}
        </h1>
        <p className="text-xs text-slate-400">
          Effective as of January 1, 2026 • Governing all i2A SchoolOS subscriptions, modules, and APIs
        </p>
      </div>

      {/* 1. Acceptance of Terms */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">1. Acceptance & Scope of Agreement</h2>
        <p>
          By creating an institutional account, submitting a trial application, or accessing the <strong>i2A SchoolOS</strong> platform, the subscribing educational institution (“Subscriber”, “School”, or “You”) agrees to be legally bound by these Terms of Service between the Subscriber and <strong>i2A Technologies Private Limited</strong> (“i2A”).
        </p>
      </section>

      {/* 2. Service Level Agreement (SLA) */}
      <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>2. Service Level Agreement (99.9% Uptime Commitment)</span>
        </h2>
        <p>
          i2A commits to delivering a monthly service availability of at least <strong>99.9%</strong> across core portal APIs, excluding scheduled maintenance. Scheduled system upgrades are conducted during off-peak hours (Sundays between 02:00 AM and 04:00 AM IST) with 72-hour advance notice.
        </p>
      </section>

      {/* 3. Absolute Data Ownership */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-400" />
          <span>3. Institutional Data Ownership</span>
        </h2>
        <p>
          <strong>You retain 100% exclusive ownership of all student, parent, academic, and financial records</strong> uploaded or processed through i2A SchoolOS. i2A acquires no proprietary rights or license over institutional content other than the limited right to host and process such data solely for operating the platform on your behalf.
        </p>
        <p>
          Upon request or upon termination of your subscription, i2A provides complete, unencrypted exports of your student rosters, fee balances, and report card matrices in standard CSV and JSON formats within 7 business days.
        </p>
      </section>

      {/* 4. Acceptable Use & Account Security */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">4. Institutional Security Responsibilities</h2>
        <p>The Subscriber agrees to:</p>
        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
          <li>Ensure that principal, administrator, and teacher login credentials are not shared outside authorized personnel.</li>
          <li>Promptly deactivate staff accounts upon resignation, termination, or transfer.</li>
          <li>Maintain reasonable physical security around biometric attendance terminals and administrative PCs.</li>
          <li>Refrain from attempting reverse engineering, NoSQL operator injection, or unauthorized penetration testing.</li>
        </ul>
      </section>

      {/* 5. Fees & Cancellation */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">5. Transparent Billing, Upgrades & Termination</h2>
        <p>
          Subscriptions are billed according to your selected plan (Starter, Professional, or Enterprise) on an annual or monthly schedule. You may upgrade your plan tier or adjust student capacity brackets at any time with pro-rata invoicing.
        </p>
        <p>
          Either party may terminate this agreement with 30 days written notice. We provide a 30-day post-termination grace period during which your school data remains accessible in read-only export mode.
        </p>
      </section>

      {/* 6. Jurisdiction & Law */}
      <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Scale className="w-4 h-4 text-purple-400" />
          <span>6. Governing Law & Dispute Resolution</span>
        </h2>
        <p>
          This Agreement shall be governed by and construed in accordance with the laws of the Republic of India. Any legal dispute arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the competent courts in <strong>Patna, Bihar, India</strong>.
        </p>
      </section>
    </div>
  );
};
