import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  AlertCircle,
  FileText,
  UserCheck,
  Building,
  Mail,
  Phone,
  MapPin,
  ExternalLink,
  RefreshCw,
  XCircle,
  ArrowRight,
  CheckSquare,
  Square,
  AlertTriangle,
  History
} from 'lucide-react';
import {
  SchoolRegistrationApplication,
  ApplicationStatus,
  ApplicationVerificationChecklist
} from '../../types';
import { tenantsApi } from '../../services/apiClient';

interface ApplicationVerificationConsoleProps {
  onTenantApproved?: (tenant: unknown) => void;
}

export const ApplicationVerificationConsole: React.FC<ApplicationVerificationConsoleProps> = ({
  onTenantApproved
}) => {
  const [applications, setApplications] = useState<SchoolRegistrationApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedApp, setSelectedApp] = useState<SchoolRegistrationApplication | null>(null);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Modals for Actions
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [correctionNotes, setCorrectionNotes] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectionCode, setRejectionCode] = useState<string>('DOCS_INCOMPLETE');
  const [reviewNotes, setReviewNotes] = useState<string>('');

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: { status?: string; category?: string; search?: string } = {};
      if (statusFilter !== 'ALL') params.status = statusFilter;
      if (categoryFilter !== 'ALL') params.category = categoryFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await tenantsApi.applicationQueue(params);
      if (res.ok && res.data?.applications) {
        setApplications(res.data.applications as SchoolRegistrationApplication[]);
      } else {
        // Fallback to local storage if API returned non-ok or server unreachable
        const saved = localStorage.getItem('i2a_school_applications');
        if (saved) {
          const parsed = JSON.parse(saved) as SchoolRegistrationApplication[];
          setApplications(parsed);
        } else {
          setError(res.error || 'Failed to fetch application queue');
        }
      }
    } catch {
      const saved = localStorage.getItem('i2a_school_applications');
      if (saved) {
        setApplications(JSON.parse(saved));
      } else {
        setError('Network error fetching verification queue');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const showNotification = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  const handleSelectApp = async (app: SchoolRegistrationApplication) => {
    setSelectedApp(app);
    // Fetch detailed view if available
    try {
      const res = await tenantsApi.getApplication(app.id);
      if (res.ok && res.data?.application) {
        setSelectedApp(res.data.application as SchoolRegistrationApplication);
      }
    } catch {
      // Use local app
    }
  };

  const handleStartReview = async (appId: string) => {
    setActionLoading(true);
    try {
      const res = await tenantsApi.reviewApplication(appId, reviewNotes || 'Under Super Admin verification audit.');
      if (res.ok && res.data?.application) {
        showNotification('Application status set to UNDER_REVIEW.');
        setSelectedApp(res.data.application as SchoolRegistrationApplication);
        fetchApplications();
      } else {
        alert(res.error || 'Failed to update review status.');
      }
    } catch {
      alert('Error updating review status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChecklistToggle = async (key: keyof ApplicationVerificationChecklist) => {
    if (!selectedApp) return;
    const current = selectedApp.verificationChecklist || {
      identityVerified: false,
      documentAuthenticityVerified: false,
      affiliationVerified: false,
      addressVerified: false,
      feeCommercialVerified: false,
      antiFraudCheckPassed: false
    };

    const updatedChecklist = {
      ...current,
      [key]: !current[key]
    };

    setActionLoading(true);
    try {
      const res = await tenantsApi.updateChecklist(selectedApp.id, updatedChecklist);
      if (res.ok && res.data?.verificationChecklist) {
        setSelectedApp({
          ...selectedApp,
          verificationChecklist: res.data.verificationChecklist as ApplicationVerificationChecklist
        });
      }
    } catch {
      // offline fallback
      setSelectedApp({
        ...selectedApp,
        verificationChecklist: updatedChecklist
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestCorrection = async () => {
    if (!selectedApp) return;
    if (correctionNotes.trim().length < 5) {
      alert('Please specify clear correction notes (minimum 5 characters) for the applicant.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await tenantsApi.requestCorrection(selectedApp.id, correctionNotes);
      if (res.ok && res.data?.application) {
        showNotification('Correction requested. Applicant notified.');
        setShowCorrectionModal(false);
        setCorrectionNotes('');
        setSelectedApp(res.data.application as SchoolRegistrationApplication);
        fetchApplications();
      } else {
        alert(res.error || 'Failed to request correction.');
      }
    } catch {
      alert('Network error submitting correction request.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApp) return;
    if (rejectionReason.trim().length < 5) {
      alert('Please specify a valid rejection reason (minimum 5 characters).');
      return;
    }

    setActionLoading(true);
    try {
      const res = await tenantsApi.rejectApplication(selectedApp.id, rejectionReason, rejectionCode);
      if (res.ok && res.data?.application) {
        showNotification('Application has been rejected.');
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedApp(res.data.application as SchoolRegistrationApplication);
        fetchApplications();
      } else {
        alert(res.error || 'Failed to reject application.');
      }
    } catch {
      alert('Network error rejecting application.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApp) return;
    const confirmLaunch = window.confirm(
      `Confirm approval for institution "${selectedApp.schoolName}"?\nThis will create a new isolated tenant, provision an organization node, and issue an admin invitation token.`
    );
    if (!confirmLaunch) return;

    setActionLoading(true);
    try {
      const res = await tenantsApi.approveApplication(selectedApp.id, 'Super Admin verified all KYC & institutional criteria.');
      if (res.ok && res.data?.tenant) {
        showNotification(`Tenant provisioned successfully! Tenant ID: ${(res.data.tenant as any).id}`);
        if (onTenantApproved) onTenantApproved(res.data.tenant);
        setSelectedApp({
          ...selectedApp,
          status: 'APPROVED',
          tenantId: (res.data.tenant as any).id
        });
        fetchApplications();
      } else {
        alert(res.error || 'Failed to approve application.');
      }
    } catch {
      alert('Network error approving application.');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: ApplicationStatus) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">Approved & Provisioned</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-blue-100 text-blue-800 border border-blue-300">Under Review</span>;
      case 'NEEDS_CORRECTION':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300">Needs Correction</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-800 border border-rose-300">Rejected</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-200 text-slate-700 border border-slate-300">Cancelled</span>;
      case 'PENDING_VERIFICATION':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 border border-purple-300">Pending Verification</span>;
    }
  };

  return (
    <div className="space-y-6 text-xs">
      {/* Notifications */}
      {actionSuccessMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-semibold">{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500 text-rose-200 flex items-center gap-2 shadow-lg">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Header & Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-3xl shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                Institutional Verification & Onboarding Queue
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Review KYC documents, verify affiliation credentials, and provision tenant containers.
              </p>
            </div>
          </div>

          <button
            onClick={fetchApplications}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Queue</span>
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by institution name, admin email, or app no..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-medium"
            >
              <option value="ALL">All Application Statuses</option>
              <option value="PENDING_VERIFICATION">Pending Verification</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="NEEDS_CORRECTION">Needs Correction</option>
              <option value="APPROVED">Approved & Provisioned</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full p-2 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none font-medium"
            >
              <option value="ALL">All Categories</option>
              <option value="k12-schools">K-12 Schools</option>
              <option value="school-groups-trusts">School Groups & Trusts</option>
              <option value="colleges-higher-ed">Colleges & Higher Ed</option>
              <option value="coaching-institutes">Coaching & Test-Prep</option>
              <option value="tuition-centres">Tuition Centres</option>
              <option value="preschools">Preschools & Daycares</option>
              <option value="sports-arts-academies">Sports & Arts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Queue Table + Details Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Applications List (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between font-bold">
            <span className="text-slate-800 dark:text-slate-200">
              Applications ({applications.length})
            </span>
            <span className="text-[11px] text-slate-500">
              Click an item to view verification dossier
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto max-h-[600px]">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Loading applications...</div>
            ) : applications.length === 0 ? (
              <div className="p-12 text-center text-slate-400">No applications matching criteria.</div>
            ) : (
              applications.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                return (
                  <div
                    key={app.id}
                    onClick={() => handleSelectApp(app)}
                    className={`p-4 cursor-pointer transition-colors flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-l-4 border-indigo-500'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white truncate">
                          {app.schoolName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {app.applicationNo}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex flex-wrap gap-2">
                        <span>{app.city}, {app.state}</span>
                        <span>•</span>
                        <span>{app.board}</span>
                        <span>•</span>
                        <span>{app.adminName}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      {getStatusBadge(app.status)}
                      <span className="text-[10px] text-slate-400 font-mono">
                        {app.submittedDate?.split('T')[0] || 'Recent'}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Verification Dossier (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-5 flex flex-col space-y-5">
          {selectedApp ? (
            <>
              {/* Dossier Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-start justify-between">
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    {selectedApp.schoolName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[10px] text-indigo-500 font-bold">
                      {selectedApp.applicationNo}
                    </span>
                    {getStatusBadge(selectedApp.status)}
                  </div>
                </div>
                {selectedApp.tenantId && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">Tenant ID</span>
                    <span className="font-mono text-[10px] text-emerald-500 font-bold">{selectedApp.tenantId}</span>
                  </div>
                )}
              </div>

              {/* Institution Metadata */}
              <div className="space-y-2 text-[11px] bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedApp.category || 'k12-schools'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Board / Affiliation:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedApp.board} ({selectedApp.affiliationNumber || 'Pending'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Admin Contact:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedApp.adminName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Official Email:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedApp.adminEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{selectedApp.adminPhone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Campus Location:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedApp.city}, {selectedApp.state}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Plan Interest:</span>
                  <span className="font-bold text-indigo-500">{selectedApp.planInterest || 'PROFESSIONAL'}</span>
                </div>
              </div>

              {/* 6-Point Verification Checklist */}
              <div className="space-y-2">
                <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-indigo-500" />
                  Verification Checklist (KYC & Trust)
                </span>

                <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  {[
                    { key: 'identityVerified' as const, label: 'Identity & Authorizer Verification' },
                    { key: 'documentAuthenticityVerified' as const, label: 'Document Authenticity Verified' },
                    { key: 'affiliationVerified' as const, label: 'Board / University Affiliation Valid' },
                    { key: 'addressVerified' as const, label: 'Physical Campus Address Verified' },
                    { key: 'feeCommercialVerified' as const, label: 'Commercial & Plan Terms Validated' },
                    { key: 'antiFraudCheckPassed' as const, label: 'Zero Fraud / Duplicate Inquiries Pass' },
                  ].map((item) => {
                    const checked = !!selectedApp.verificationChecklist?.[item.key];
                    return (
                      <div
                        key={item.key}
                        onClick={() => handleChecklistToggle(item.key)}
                        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-700/50 cursor-pointer text-[11px]"
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500 shrink-0" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <span className={checked ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500'}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status History / Audit Trail */}
              {selectedApp.statusHistory && selectedApp.statusHistory.length > 0 && (
                <div className="space-y-2">
                  <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <History className="w-4 h-4 text-slate-400" />
                    Status History & Audit Trail
                  </span>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto text-[10px] bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                    {selectedApp.statusHistory.map((h, idx) => (
                      <div key={idx} className="flex justify-between items-center text-slate-500 border-b border-slate-200/40 dark:border-slate-700/40 pb-1">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-300">{h.toStatus}</span>
                          {h.reason && <span className="block text-[9px] text-slate-400 truncate max-w-[200px]">{h.reason}</span>}
                        </div>
                        <span className="font-mono text-[9px]">{h.timestamp?.split('T')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviewer Action Buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                {selectedApp.status === 'PENDING_VERIFICATION' && (
                  <button
                    onClick={() => handleStartReview(selectedApp.id)}
                    disabled={actionLoading}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition"
                  >
                    Start Review (Mark Under Review)
                  </button>
                )}

                {(selectedApp.status === 'PENDING_VERIFICATION' || selectedApp.status === 'UNDER_REVIEW') && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowCorrectionModal(true)}
                      disabled={actionLoading}
                      className="py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 font-bold text-xs transition"
                    >
                      Request Correction
                    </button>

                    <button
                      onClick={() => setShowRejectModal(true)}
                      disabled={actionLoading}
                      className="py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 font-bold text-xs transition"
                    >
                      Reject Application
                    </button>
                  </div>
                )}

                {(selectedApp.status === 'PENDING_VERIFICATION' || selectedApp.status === 'UNDER_REVIEW') && (
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Provision Isolated Tenant</span>
                  </button>
                )}

                {selectedApp.status === 'APPROVED' && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-center font-bold">
                    ✓ Tenant Container Active ({selectedApp.tenantId})
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 my-auto">
              Select an application from the queue to view documents and begin verification.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Request Correction */}
      {showCorrectionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Request Correction from Applicant
            </h4>
            <p className="text-slate-500 text-xs">
              Explain clearly what documents or details need correction. The applicant will be notified and can resubmit directly.
            </p>
            <textarea
              rows={4}
              value={correctionNotes}
              onChange={(e) => setCorrectionNotes(e.target.value)}
              placeholder="e.g. Affiliation letter document is expired or blurry. Please upload the latest CBSE affiliation renewal certificate."
              className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCorrectionModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleRequestCorrection}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold"
              >
                Send Correction Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject Application */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-500" />
              Reject Institution Application
            </h4>
            <p className="text-slate-500 text-xs">
              This action will mark the application as REJECTED. Please specify the formal compliance reason.
            </p>
            <select
              value={rejectionCode}
              onChange={(e) => setRejectionCode(e.target.value)}
              className="w-full p-2.5 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
            >
              <option value="DOCS_INCOMPLETE">Incomplete or Unverified Documents</option>
              <option value="UNAUTHORIZED_REPRESENTATIVE">Unauthorized Applicant / Not School Authority</option>
              <option value="DUPLICATE_OR_FRAUD">Duplicate Application or Fraudulent Domain Request</option>
              <option value="POLICY_VIOLATION">Commercial / Terms of Service Incompatibility</option>
            </select>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Detailed reason for rejection..."
              className="w-full p-3 rounded-xl text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
