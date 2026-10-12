import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  ShieldCheck,
  Building2,
  Users,
  CreditCard,
  Lock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Search,
  SlidersHorizontal,
  Activity,
  DollarSign,
  UserCheck,
  Globe,
  Settings,
  RefreshCw,
  Plus
} from 'lucide-react';
import { UserRole } from '../../types';

export const PlatformAdminModule: React.FC = () => {
  const {
    tenants,
    updateTenantSubscription,
    toggleSchoolSuspension,
    subscriptionPlans,
    loginToSchool,
    returnToPublicSaas,
    schoolApplications,
    approveSchoolApplication,
    rejectSchoolApplication
  } = useSchool();

  const [activeTab, setActiveTab] = useState<'REGISTERED_SCHOOLS' | 'VERIFICATION_QUEUE'>('REGISTERED_SCHOOLS');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [approvalSuccessMsg, setApprovalSuccessMsg] = useState<string | null>(null);

  // Statistics
  const totalSchools = tenants.length;
  const activeSchools = tenants.filter((t) => t.subscriptionStatus === 'ACTIVE' || t.subscriptionStatus === 'TRIAL').length;
  const suspendedSchools = tenants.filter((t) => t.subscriptionStatus === 'SUSPENDED').length;
  const pendingApplications = schoolApplications.filter((a) => a.status === 'PENDING_VERIFICATION' || a.status === 'DOCS_REVIEWED');
  const totalMRR = tenants.reduce((acc, t) => {
    const plan = subscriptionPlans.find((p) => p.id === t.planId);
    return acc + (plan ? plan.monthlyPrice : 0);
  }, 0);

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.adminEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'ALL' || t.subscriptionStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleApproveSchool = (appId: string) => {
    const newTenant = approveSchoolApplication(appId);
    setApprovalSuccessMsg(`✅ स्कूल "${newTenant.name}" (${newTenant.id}) सफलतापूर्वक वेरिफाई और अप्रूव हो गया! वेबसाइट और प्रिंसिपल पोर्टल एक्टिवेट कर दिया गया है।`);
    setTimeout(() => setApprovalSuccessMsg(null), 6000);
  };

  const handleRejectSchool = (appId: string) => {
    const reason = prompt('रिजेक्ट करने का कारण दर्ज करें (Enter reason for rejection):', 'दस्तावेज़ अस्पष्ट हैं (Incomplete or unclear affiliation docs)');
    if (reason) {
      rejectSchoolApplication(appId, reason);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 text-xs">
      {/* Platform Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight">i2A Platform Central Operator Console</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800 text-[10px] font-bold uppercase">
                  Super Admin
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-0.5">Global Multi-Tenant Control, School Accounts & Verification Governance</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={returnToPublicSaas}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-colors"
            >
              Exit to SaaS Homepage
            </button>
          </div>
        </div>

        {/* Global Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
            <div className="text-slate-400 font-medium">Registered Schools</div>
            <div className="text-2xl font-black text-white mt-1">{totalSchools}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
            <div className="text-indigo-400 font-medium">Pending Verifications</div>
            <div className="text-2xl font-black text-indigo-400 mt-1">{pendingApplications.length}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
            <div className="text-emerald-400 font-medium">Active Tenants</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">{activeSchools}</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-2xl">
            <div className="text-amber-400 font-medium">Platform MRR</div>
            <div className="text-2xl font-black text-amber-400 mt-1">₹{totalMRR.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {approvalSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-600/60 text-emerald-200 flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center gap-2 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{approvalSuccessMsg}</span>
          </div>
          <button
            onClick={() => setApprovalSuccessMsg(null)}
            className="text-emerald-400 hover:text-white font-bold ml-4 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 bg-slate-200 dark:bg-slate-800/70 p-1.5 rounded-2xl w-fit border border-slate-300 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('REGISTERED_SCHOOLS')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all ${
            activeTab === 'REGISTERED_SCHOOLS'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" /> Registered Schools Directory ({totalSchools})
        </button>
        <button
          onClick={() => setActiveTab('VERIFICATION_QUEUE')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all relative ${
            activeTab === 'VERIFICATION_QUEUE'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" /> Pending School Applications ({pendingApplications.length})
          {pendingApplications.length > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse inline-block" />
          )}
        </button>
      </div>

      {activeTab === 'VERIFICATION_QUEUE' ? (
        /* Pending Applications Verification Queue */
        <div className="space-y-4">
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 text-white flex justify-between items-center">
            <div>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> स्कूल वेरिफिकेशन और अप्रूवल पाइपलाइन (Pending Verifications)
              </h3>
              <p className="text-slate-400 text-xs mt-0.5">
                स्कूलों द्वारा सीधे किए गए आवेदनों की जांच करें, सरकारी दस्तावेज देखें, और 1-क्लिक में अप्रूव करके डोमेन एक्टिवेट करें।
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {schoolApplications.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500">
                कोई पेंडिंग आवेदन नहीं है (No pending applications).
              </div>
            ) : (
              schoolApplications.map((app) => (
                <div
                  key={app.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl shadow-md space-y-4 hover:border-indigo-500/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center font-extrabold text-base">
                        {app.schoolName.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-slate-900 dark:text-white">{app.schoolName}</h4>
                          <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                            {app.applicationNo}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs">
                          {app.city}, {app.state} • Board: <b className="text-indigo-600 dark:text-indigo-400">{app.board}</b> • Affiliation: {app.affiliationNumber || 'Pending Verification'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                        app.status === 'APPROVED'
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                          : app.status === 'REJECTED'
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300'
                      }`}
                    >
                      {app.status === 'PENDING_VERIFICATION' ? 'Awaiting Verification' : app.status}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                      <span className="text-slate-400 font-semibold block text-[10px]">डायरेक्टर / प्रिंसिपल संपर्क</span>
                      <p className="font-bold text-slate-900 dark:text-white mt-1">{app.adminName}</p>
                      <p className="text-slate-500">{app.adminEmail}</p>
                      <p className="text-slate-500">{app.adminPhone}</p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                      <span className="text-slate-400 font-semibold block text-[10px]">डोमेन का चुनाव (Domain Choice)</span>
                      <div className="mt-1 flex items-center gap-1.5 font-bold text-indigo-600 dark:text-indigo-400">
                        <Globe className="w-3.5 h-3.5" />
                        {app.domainType === 'CUSTOM_DOMAIN' ? (
                          <span>कस्टम डोमेन: <b className="font-mono text-white">{app.customDomain}</b></span>
                        ) : (
                          <span>सब-डोमेन: <b className="font-mono text-white">{app.subdomainSlug}.i2aschool.com</b></span>
                        )}
                      </div>
                      <span className="text-[10px] text-emerald-500 font-bold mt-1 block">SSL Auto-Provision Ready</span>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/60">
                      <span className="text-slate-400 font-semibold block text-[10px]">जमा किए गए दस्तावेज़ (KYC Docs)</span>
                      <div className="mt-1 space-y-1 text-[11px] text-slate-300">
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> {app.documentsSubmitted?.govtRegCert || 'Reg_Cert.pdf'}
                        </div>
                        <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> {app.documentsSubmitted?.affiliationDoc || 'Affiliation_Doc.pdf'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  {app.status === 'PENDING_VERIFICATION' && (
                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => handleRejectSchool(app.id)}
                        className="px-4 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900 font-bold transition-colors"
                      >
                        Reject Application
                      </button>

                      <button
                        onClick={() => handleApproveSchool(app.id)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold shadow-lg shadow-emerald-600/30 transition-all text-xs"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Verify & Approve School (1-Click Launch)
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Registered Schools Directory Tab */
        <>
          {/* Filter and Search Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search school by name, unique School ID (e.g. I2A-SCH-000001), or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <span className="text-slate-500 font-medium">Filter Status:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold rounded-xl p-2 focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="TRIAL">Trial</option>
                <option value="ACTIVE">Active</option>
                <option value="EXPIRED">Expired</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>

      {/* Schools Directory Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-500" /> Multi-Tenant Registered Schools Directory ({filteredTenants.length})
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">School ID & Name</th>
                <th className="p-4">Board & Location</th>
                <th className="p-4">Admin Contact</th>
                <th className="p-4">Plan & Status</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4 text-right">Operator Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredTenants.map((t) => {
                const isSuspended = t.subscriptionStatus === 'SUSPENDED';
                const isExpired = t.subscriptionStatus === 'EXPIRED';

                return (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 font-semibold">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold flex items-center justify-center">
                          {t.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-white">{t.name}</div>
                          <span className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                            {t.id}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-bold text-[10px]">
                        {t.board}
                      </span>
                      <div className="text-slate-500 text-[11px]">{t.city}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium text-slate-900 dark:text-white">{t.adminName}</div>
                      <div className="text-slate-500 text-[11px]">{t.adminEmail}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{t.planName}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            t.subscriptionStatus === 'ACTIVE'
                              ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300'
                              : t.subscriptionStatus === 'TRIAL'
                              ? 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-300'
                              : t.subscriptionStatus === 'SUSPENDED'
                              ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300'
                              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-300'
                          }`}
                        >
                          {t.subscriptionStatus}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-[11px]">{t.registeredAt}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Impersonate / Open Portal */}
                        <button
                          onClick={() => loginToSchool(t.id, 'PRINCIPAL')}
                          className="px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 font-bold text-[11px] border border-indigo-200 dark:border-indigo-800"
                        >
                          Open Portal
                        </button>

                        {/* Change Plan */}
                        <select
                          value={t.planId}
                          onChange={(e) => updateTenantSubscription(t.id, t.subscriptionStatus, e.target.value)}
                          className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border text-[11px] font-semibold"
                        >
                          <option value="STARTER">Starter Plan</option>
                          <option value="PROFESSIONAL">Pro Plan</option>
                          <option value="ENTERPRISE">Enterprise Plan</option>
                        </select>

                        {/* Suspend / Reactivate */}
                        <button
                          onClick={() => toggleSchoolSuspension(t.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-colors ${
                            isSuspended
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                              : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100'
                          }`}
                        >
                          {isSuspended ? 'Reactivate' : 'Suspend'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}
</div>
);
};
