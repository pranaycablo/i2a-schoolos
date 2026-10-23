import React, { useState } from 'react';
import {
  School,
  Building2,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  FileText,
  Clock,
  Search,
  RefreshCw,
  Edit3,
  HelpCircle
} from 'lucide-react';
import { PublicRoute } from '../../../types';
import { tenantsApi } from '../../../services/apiClient';

interface RegisterTrialPageProps {
  onNavigate: (route: PublicRoute, slug?: string) => void;
  onOpenLogin: () => void;
  isHindi?: boolean;
}

export const RegisterTrialPage: React.FC<RegisterTrialPageProps> = ({
  onNavigate,
  onOpenLogin,
  isHindi = false
}) => {
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'TRACK'>('REGISTER');

  // Registration Form State
  const [formData, setFormData] = useState({
    schoolName: '',
    category: 'k12-schools',
    board: 'CBSE',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
    city: '',
    state: 'Bihar',
    estimatedStudents: '350',
    planInterest: 'PROFESSIONAL' as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE',
    notes: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [applicationResult, setApplicationResult] = useState<{
    id: string;
    applicationNo: string;
    schoolName: string;
    category: string;
    status: string;
    trackingToken?: string;
  } | null>(null);

  // Status Tracking State
  const [trackAppNo, setTrackAppNo] = useState('');
  const [trackEmail, setTrackEmail] = useState('');
  const [trackToken, setTrackToken] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [trackedApplication, setTrackedApplication] = useState<any | null>(null);

  // Resubmission State (when status is NEEDS_CORRECTION)
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitSuccess, setResubmitSuccess] = useState(false);
  const [resubmitData, setResubmitData] = useState({
    schoolName: '',
    adminPhone: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.schoolName.trim() || !formData.adminName.trim() || !formData.adminEmail.trim() || !formData.adminPhone.trim()) {
      setError(isHindi ? 'कृपया सभी आवश्यक फ़ील्ड भरें।' : 'Please fill all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await tenantsApi.submitApplication({
        schoolName: formData.schoolName,
        category: formData.category,
        board: formData.board,
        adminName: formData.adminName,
        adminEmail: formData.adminEmail,
        adminPhone: formData.adminPhone,
        city: formData.city || 'Patna',
        state: formData.state || 'Bihar',
        estimatedStudents: Number(formData.estimatedStudents) || 300,
        planInterest: formData.planInterest,
        notes: formData.notes
      });

      if (res.ok && res.data?.application) {
        const app = res.data.application as any;
        const trackingToken = (res.data as any).trackingToken || app.trackingToken;
        setApplicationResult({
          id: app.id,
          applicationNo: app.applicationNo,
          schoolName: app.schoolName,
          category: app.category,
          status: app.status,
          trackingToken
        });
        if (trackingToken) {
          setTrackToken(trackingToken);
        }
        if (formData.adminEmail) {
          setTrackEmail(formData.adminEmail);
        }
      } else {
        setError(res.error || (isHindi ? 'आवेदन सबमिट नहीं हो सका। कृपया पुनः प्रयास करें।' : 'Failed to submit application. Please verify details.'));
      }
    } catch {
      setError(isHindi ? 'नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।' : 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTrackStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackAppNo.trim()) {
      setTrackError(isHindi ? 'कृपया आवेदन संख्या दर्ज करें।' : 'Please enter your application reference number.');
      return;
    }

    if (!trackToken.trim()) {
      setTrackError(isHindi ? 'कृपया अपना सुरक्षा ट्रैकिंग टोकन दर्ज करें।' : 'Please enter your cryptographic tracking token.');
      return;
    }

    setTrackingLoading(true);
    setTrackError('');
    setTrackedApplication(null);

    try {
      const res = await tenantsApi.getStatus(
        trackAppNo.trim(),
        trackEmail.trim() || undefined,
        trackToken.trim() || undefined
      );
      if (res.ok && res.data?.application) {
        const app = res.data.application as any;
        setTrackedApplication(app);
        setResubmitData({
          schoolName: app.schoolName || '',
          adminPhone: app.adminPhone || '',
          notes: ''
        });
      } else {
        setTrackError(res.error || (isHindi ? 'आवेदन प्राप्त नहीं हुआ। कृपया नंबर एवं ट्रैकिंग टोकन पुनः जांचें।' : 'Application not found or tracking token invalid.'));
      }
    } catch {
      setTrackError(isHindi ? 'नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।' : 'Network error checking status.');
    } finally {
      setTrackingLoading(false);
    }
  };


  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackedApplication) return;

    setResubmitting(true);
    setTrackError('');
    setResubmitSuccess(false);

    try {
      const res = await tenantsApi.resubmitApplication(trackedApplication.id, {
        schoolName: resubmitData.schoolName,
        adminPhone: resubmitData.adminPhone,
        notes: resubmitData.notes
      });

      if (res.ok && res.data?.application) {
        setResubmitSuccess(true);
        setTrackedApplication(res.data.application);
      } else {
        setTrackError(res.error || 'Failed to resubmit corrections.');
      }
    } catch {
      setTrackError('Network error resubmitting application.');
    } finally {
      setResubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8 font-sans">
      {/* Title & Introduction */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-indigo-400 font-bold uppercase tracking-wider text-xs">
          {isHindi ? '14-दिवसीय निःशुल्क ट्रायल व सत्यापन' : 'Zero-Risk Institutional Onboarding & Verification'}
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
          {isHindi ? 'अपने संस्थान हेतु निःशुल्क ट्रायल शुरू करें' : 'Start Your 14-Day Free Institutional Trial'}
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {isHindi
            ? 'कोई क्रेडिट कार्ड आवश्यक नहीं। आपका व्यक्तिगत टेनेंट और सैंपल डेटा सत्यापन के बाद तुरंत सक्रिय हो जाएगा।'
            : 'Experience full administrative, academic, and financial autonomy. Zero credit card required.'}
        </p>

        {/* Tab Switcher */}
        <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-2xl mx-auto mt-4 text-xs font-bold">
          <button
            onClick={() => setActiveTab('REGISTER')}
            className={`px-5 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'REGISTER'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isHindi ? 'नया संस्थान आवेदन' : 'Register New Institution'}
          </button>
          <button
            onClick={() => setActiveTab('TRACK')}
            className={`px-5 py-2 rounded-xl transition cursor-pointer ${
              activeTab === 'TRACK'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isHindi ? 'आवेदन स्थिति ट्रैक करें' : 'Track Application Status'}
          </button>
        </div>
      </div>

      {/* Mode 1: TRACK APPLICATION STATUS */}
      {activeTab === 'TRACK' && (
        <div className="p-7 sm:p-10 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-400" />
              {isHindi ? 'आवेदन स्थिति और सत्यापन रिपोर्ट जांचें' : 'Check Onboarding Status & Reviewer Feedback'}
            </h2>
            <p className="text-slate-400 text-xs mt-1">
              {isHindi
                ? 'अपने आवेदन का रेफरेंस नंबर (जैसे APP-2026-XXXX) और आधिकारिक ईमेल दर्ज करें।'
                : 'Enter your application reference number (e.g. APP-2026-XXXX) and registered official email.'}
            </p>
          </div>

          {trackError && (
            <div className="p-4 rounded-2xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{trackError}</span>
            </div>
          )}

          <form onSubmit={handleTrackStatus} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                {isHindi ? 'आवेदन संख्या *' : 'Application Number *'}
              </label>
              <input
                type="text"
                required
                value={trackAppNo}
                onChange={(e) => setTrackAppNo(e.target.value)}
                placeholder="e.g. APP-2026-8742"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                {isHindi ? 'सुरक्षा ट्रैकिंग टोकन *' : 'Cryptographic Tracking Token *'}
              </label>
              <input
                type="text"
                required
                value={trackToken}
                onChange={(e) => setTrackToken(e.target.value.trim())}
                placeholder="64-char tracking token"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-bold mb-1">
                {isHindi ? 'पंजीकृत ईमेल (वैकल्पिक)' : 'Registered Admin Email (Optional)'}
              </label>
              <input
                type="email"
                value={trackEmail}
                onChange={(e) => setTrackEmail(e.target.value.trim())}
                placeholder="principal@school.edu.in"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-xs"
              />
            </div>
            <div className="sm:col-span-3 pt-1">
              <button
                type="submit"
                disabled={trackingLoading}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{trackingLoading ? 'Checking...' : 'Track Application Status'}</span>
              </button>
            </div>
          </form>

          {/* Tracked Application Result Dossier */}
          {trackedApplication && (
            <div className="pt-4 border-t border-slate-800 space-y-5 animate-fade-in text-xs">
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/80 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-white">{trackedApplication.schoolName}</h3>
                    <span className="font-mono text-[11px] text-indigo-400 font-bold">{trackedApplication.applicationNo}</span>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                      trackedApplication.status === 'APPROVED'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500'
                        : trackedApplication.status === 'NEEDS_CORRECTION'
                        ? 'bg-amber-950 text-amber-300 border border-amber-500'
                        : trackedApplication.status === 'REJECTED'
                        ? 'bg-rose-950 text-rose-300 border border-rose-500'
                        : 'bg-indigo-950 text-indigo-300 border border-indigo-500'
                    }`}
                  >
                    Status: {trackedApplication.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Educational Category</span>
                    <span className="font-semibold">{trackedApplication.category || 'k12-schools'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Campus Location</span>
                    <span className="font-semibold">{trackedApplication.city}, {trackedApplication.state}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Registration Date</span>
                    <span className="font-semibold">{trackedApplication.submittedDate?.split('T')[0] || 'Recent'}</span>
                  </div>
                </div>

                {/* Portal Ready banner if approved */}
                {trackedApplication.status === 'APPROVED' && (
                  <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 flex items-center justify-between">
                    <span className="font-bold">✓ Institutional Portal Approved & Provisioned</span>
                    <button
                      onClick={onOpenLogin}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                    >
                      Login to Portal
                    </button>
                  </div>
                )}
              </div>

              {/* Reviewer Correction Notice & Resubmission Form */}
              {trackedApplication.status === 'NEEDS_CORRECTION' && (
                <div className="p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 space-y-4">
                  <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
                    <Edit3 className="w-5 h-5 shrink-0" />
                    <span>Reviewer Action Required: Document / Detail Correction</span>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/30 text-amber-200 text-xs">
                    <span className="font-bold block text-[11px] text-amber-400 mb-1">Feedback from Verification Officer:</span>
                    <p>{trackedApplication.correctionNotes || 'Please revise and resubmit the requested institutional documents or contact details.'}</p>
                  </div>

                  {resubmitSuccess ? (
                    <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-200 font-bold text-center">
                      ✓ Corrections resubmitted successfully! Your application has returned to PENDING_VERIFICATION for officer review.
                    </div>
                  ) : (
                    <form onSubmit={handleResubmit} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Updated Institution Name</label>
                          <input
                            type="text"
                            value={resubmitData.schoolName}
                            onChange={(e) => setResubmitData({ ...resubmitData, schoolName: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-slate-300 font-bold mb-1">Updated Contact Phone</label>
                          <input
                            type="tel"
                            value={resubmitData.adminPhone}
                            onChange={(e) => setResubmitData({ ...resubmitData, adminPhone: e.target.value })}
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-bold mb-1">Clarification / Correction Notes</label>
                        <textarea
                          rows={2}
                          value={resubmitData.notes}
                          onChange={(e) => setResubmitData({ ...resubmitData, notes: e.target.value })}
                          placeholder="Explain updates made for the reviewer..."
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={resubmitting}
                        className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 text-white font-bold text-xs transition"
                      >
                        {resubmitting ? 'Submitting Corrections...' : 'Submit Updated Application'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Mode 2: REGISTRATION FORM */}
      {activeTab === 'REGISTER' && (
        <>
          {applicationResult ? (
            /* Confirmation Screen */
            <div className="p-8 sm:p-10 rounded-3xl bg-slate-900/80 border border-indigo-500/30 text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-700/50">
                  Application Status: {applicationResult.status}
                </span>
                <h2 className="text-2xl font-black text-white mt-2">
                  {isHindi ? 'ट्रायल आवेदन सफलतापूर्वक पंजीकृत हुआ!' : 'Trial Application Submitted Successfully!'}
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
                  {isHindi
                    ? `संस्थान [${applicationResult.schoolName}] का आवेदन प्राप्त हुआ है। सुरक्षा व टेनेंट पृथक्करण सत्यापन के पश्चात आपका पोर्टल सक्रिय हो जाएगा।`
                    : `Your institution [${applicationResult.schoolName}] has been registered. Our security team reviews all onboarding requests to ensure strict tenant isolation before activating production access.`}
                </p>
              </div>

              {/* Reference Card */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 max-w-md mx-auto text-left text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">Application Number:</span>
                  <span className="text-indigo-400 font-bold">{applicationResult.applicationNo}</span>
                </div>
                {applicationResult.trackingToken && (
                  <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/40">
                    <span className="text-slate-400 text-[10px]">Secure Tracking Token (Save this):</span>
                    <span className="text-amber-300 font-mono text-[11px] break-all select-all font-semibold">
                      {applicationResult.trackingToken}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Application ID:</span>
                  <span className="text-slate-300">{applicationResult.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="text-slate-300">{applicationResult.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Expected Verification:</span>
                  <span className="text-emerald-400">Within 24 Hours</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setTrackAppNo(applicationResult.applicationNo);
                    if (applicationResult.trackingToken) {
                      setTrackToken(applicationResult.trackingToken);
                    }
                    setActiveTab('TRACK');
                  }}
                  className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                >
                  {isHindi ? 'आवेदन स्थिति ट्रैक करें' : 'Track Application Status'}
                </button>
                <button
                  onClick={() => onNavigate('home')}
                  className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-slate-700 transition cursor-pointer"
                >
                  {isHindi ? 'मुख्य पृष्ठ पर वापस जाएं' : 'Return to Home'}
                </button>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <div className="p-7 sm:p-10 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-6">
              {error && (
                <div className="p-4 rounded-2xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      {isHindi ? 'स्कूल / संस्थान का नाम *' : 'School / Institution Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.schoolName}
                      onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                      placeholder="e.g. St. Xavier International School"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      {isHindi ? 'संस्थान श्रेणी (Vertical) *' : 'Educational Category *'}
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="k12-schools">K-12 Schools (CBSE / ICSE / State)</option>
                      <option value="school-groups-trusts">School Groups & Trusts (Multi-Branch)</option>
                      <option value="colleges-higher-ed">Colleges & Higher Education</option>
                      <option value="coaching-institutes">Coaching & Test-Prep Institutes</option>
                      <option value="tuition-centres">Tuition Centres & Academies</option>
                      <option value="preschools">Preschools & Daycares</option>
                      <option value="sports-arts-academies">Sports & Arts Academies</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      {isHindi ? 'शिक्षा बोर्ड / संबद्धता' : 'Board / Affiliation'}
                    </label>
                    <select
                      value={formData.board}
                      onChange={(e) => setFormData({ ...formData, board: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="CBSE">CBSE (Central Board)</option>
                      <option value="ICSE">ICSE / CISCE</option>
                      <option value="STATE_BOARD">State Board (Bihar / UP / Maharashtra / etc.)</option>
                      <option value="IB">IB International Baccalaureate</option>
                      <option value="CAMBRIDGE">Cambridge IGCSE</option>
                      <option value="UNIVERSITY">State / Central University</option>
                      <option value="OTHER">Other / Autonomous</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      {isHindi ? 'अनुमानित कुल छात्र संख्या' : 'Estimated Student Strength'}
                    </label>
                    <input
                      type="number"
                      value={formData.estimatedStudents}
                      onChange={(e) => setFormData({ ...formData, estimatedStudents: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      {isHindi ? 'प्राधिकृत व्यक्ति का नाम *' : 'Administrator Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.adminName}
                      onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                      placeholder="e.g. Ramesh Chandra"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      {isHindi ? 'आधिकारिक ईमेल *' : 'Admin Official Email *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.adminEmail}
                      onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                      placeholder="principal@school.edu.in"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      {isHindi ? 'मोबाइल नंबर (10 अंक) *' : 'Mobile / WhatsApp Number *'}
                    </label>
                    <input
                      type="tel"
                      required
                      value={formData.adminPhone}
                      onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                      placeholder="9876543210"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      {isHindi ? 'कैंपस शहर' : 'Campus City'}
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="e.g. Patna"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      {isHindi ? 'राज्य' : 'State'}
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                      placeholder="e.g. Bihar"
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1.5">
                      {isHindi ? 'ट्रायल प्लान' : 'Selected Trial Plan'}
                    </label>
                    <select
                      value={formData.planInterest}
                      onChange={(e) => setFormData({ ...formData, planInterest: e.target.value as any })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="STARTER">Starter Tier (Up to 300)</option>
                      <option value="PROFESSIONAL">Professional Tier (Up to 1,500)</option>
                      <option value="ENTERPRISE">Enterprise Tier (1,500+)</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:bg-slate-800 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>{submitting ? (isHindi ? 'आवेदन प्रोसेस हो रहा है...' : 'Registering Application...') : (isHindi ? 'निःशुल्क 14-दिवसीय ट्रायल आवेदन जमा करें' : 'Submit 14-Day Free Trial Application')}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </>
      )}
    </div>
  );
};
