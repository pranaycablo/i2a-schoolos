import React from 'react';
import { ShieldCheck, Lock, FileText, CheckCircle2, UserCheck, AlertCircle } from 'lucide-react';
import { PublicRoute } from '../../../types';

interface PrivacyPolicyPageProps {
  onNavigate: (route: PublicRoute, slug?: string) => void;
  isHindi?: boolean;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate, isHindi = false }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-10 font-sans text-slate-300 text-xs sm:text-sm leading-relaxed">
      {/* Title Block */}
      <div className="space-y-3 border-b border-slate-800 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50 text-[11px] font-bold uppercase tracking-wider">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>DPDP Act 2023 Privacy Architecture Framework</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
          {isHindi ? 'गोपनीयता नीति (Privacy Policy)' : 'Institutional Privacy Policy'}
        </h1>
        <p className="text-xs text-slate-400">
          Last Updated & Published: January 1, 2026 • Effective for all Tenants, Schools, and Portal Users
        </p>
      </div>

      {/* Section 1: Introduction */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <span>1. Introduction & Statutory Context</span>
        </h2>
        <p>
          i2A Technologies Private Limited (“i2A”, “we”, “our”, or “us”) operates <strong>i2A SchoolOS</strong>, an autonomous multi-tenant enterprise software-as-a-service platform engineered for Indian K-12 schools, educational trusts, colleges, coaching academies, and preschools.
        </p>
        <p>
          This Privacy Policy articulates our rigorous commitments under the <strong>Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, the Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011, and relevant Indian education board statutory guidelines.
        </p>
      </section>

      {/* Section 2: Data Fiduciary vs Data Processor */}
      <section className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-indigo-400" />
          <span>2. Division of Statutory Roles: Fiduciary vs Processor</span>
        </h2>
        <p>
          Under the DPDP Act 2023, the subscriber educational institution (the “School” or “Tenant”) acts as the <strong>Data Fiduciary</strong> determining the purpose and means of collecting personal data of students, parents, and employees.
        </p>
        <p>
          i2A acts strictly as the <strong>Data Processor</strong>, processing institutional digital data solely upon the documented instructions of the authorized institution management. We do not sell, rent, monetize, or profile student data for third-party advertising.
        </p>
      </section>

      {/* Section 3: Data We Process */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">3. Categories of Personal Data Processed</h2>
        <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-300">
          <li><strong>Student Data:</strong> Legal Name, Date of Birth, Gender, Blood Group, Admission/Roll Number, Class and Section, Academic Evaluations & Exam Marks, Daily Attendance Punches, Emergency Contact Details.</li>
          <li><strong>Parent / Guardian Data:</strong> Full Name, Mobile Number, Email Address, Residential Address, Fee Invoices, Digital Payment Reference IDs.</li>
          <li><strong>Staff / Faculty Data:</strong> Full Name, Employee Code, Biometric Attendance Logs, Assigned Timetable Classes, Salary Slips, Leaves Taken.</li>
          <li><strong>Operational Telemetry:</strong> School Bus GPS Route Coordinates, Biometric Timestamp Pulses, IP Addresses used for portal login authentication.</li>
        </ul>
      </section>

      {/* Section 4: Children's Personal Data Protections */}
      <section className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-700/50 space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Lock className="w-4 h-4 text-indigo-400" />
          <span>4. Rigorous Protections for Children’s Personal Data (Section 9 DPDP Act)</span>
        </h2>
        <p>
          In full accordance with Section 9 of the DPDP Act, 2023:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
          <li>We require verified parental or lawful guardian consent prior to enrolling any minor student onto digital parent portals.</li>
          <li>We strictly prohibit any behavioral monitoring, tracking, or targeted marketing directed at children.</li>
          <li>We do not process any personal data that could cause detrimental effect on the well-being of a child.</li>
        </ul>
      </section>

      {/* Section 5: Technical Safeguards & Encryption */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">5. Technical Safeguards & Multi-Tenant Isolation</h2>
        <p>
          All institutional data is secured using enterprise-grade cryptographic controls:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
          <li><strong>Encryption at Rest:</strong> AES-256 encryption applied to all persistent database volumes and automated point-in-time backups.</li>
          <li><strong>Encryption in Transit:</strong> TLS 1.3 encryption across all public web traffic, mobile APIs, and IoT biometric connector streams.</li>
          <li><strong>Airtight Tenant Isolation:</strong> Every database query is verified with mandatory tenant scoping filters preventing cross-school data exposure.</li>
          <li><strong>Multi-Process Token Revocation:</strong> Immediate cryptographic invalidation of JWT tokens upon user logout, account suspension, or credential reset.</li>
        </ul>
      </section>

      {/* Section 6: Indian Data Residency */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white">6. 100% In-Country Data Residency</h2>
        <p>
          All primary databases, replica sets, media caches, and disaster recovery snapshots are hosted exclusively within certified Tier-4 data centers physically located within the Republic of India. No student or school data is exported or transferred outside sovereign Indian jurisdiction.
        </p>
      </section>

      {/* Section 7: Grievance Redressal Officer */}
      <section className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h2 className="text-base font-bold text-white">7. Statutory Grievance Redressal Officer</h2>
        <p>
          Pursuant to Section 13 of the DPDP Act, 2023, you may address any concerns, inquiries, or statutory data rights requests (Correction, Erasure, Grievance) to our designated Grievance Officer:
        </p>
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1 font-mono">
          <div><span className="text-slate-400">Designation:</span> Data Protection & Grievance Redressal Officer</div>
          <div><span className="text-slate-400">Company:</span> i2A Technologies Private Limited</div>
          <div><span className="text-slate-400">Address:</span> Technology Innovation Hub, Patna, Bihar — 800001, India</div>
          <div><span className="text-slate-400">Email:</span> grievance@i2a.in / privacy@i2a.in</div>
          <div><span className="text-slate-400">Response SLA:</span> Within 48 hours for statutory acknowledgment</div>
        </div>
      </section>
    </div>
  );
};
