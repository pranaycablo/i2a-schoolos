import React, { useEffect, useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { MailCheck, X, ExternalLink, CheckCheck, School, Users, GraduationCap } from 'lucide-react';
import type { SystemNotification, DispatchedEmailPayload } from '../../types';

// ─────────────────────────────────────────────────────────────
//  Full Email Preview Modal (HTML simulation of SMTP email)
// ─────────────────────────────────────────────────────────────
export const EmailPreviewModal: React.FC<{
  payload: DispatchedEmailPayload;
  onClose: () => void;
  language: 'en' | 'hi';
}> = ({ payload, onClose, language }) => {
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const isSchool = payload.role === 'PRINCIPAL' || payload.role?.includes('ADMIN');
  const isStaff = payload.role === 'TEACHER' || payload.role === 'STAFF' || payload.role === 'ACCOUNTANT';

  return (
    <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-700 via-purple-800 to-indigo-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20">
              <MailCheck className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 animate-pulse">
                  ✓ {language === 'hi' ? 'SMTP सर्वर से प्रेषित' : 'SMTP DISPATCHED'}
                </span>
                <span className="text-[10px] text-indigo-200">{payload.dispatchedAt}</span>
              </div>
              <h3 className="font-extrabold text-base text-white">
                {language === 'hi' ? 'आधिकारिक क्रेडेंशियल्स ईमेल' : 'Official Credentials & WebApp Access Email'}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Email Body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4 text-xs">

          {/* Envelope Meta */}
          <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b pb-2 border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 font-bold uppercase text-[10px]">From:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                noreply@i2aschoolos.in (i2A SchoolOS — Automated Dispatch)
              </span>
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                {payload.role} Access
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px]">To:</span>
              <span className="font-bold text-slate-900 dark:text-white">{payload.recipientName}</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400">&lt;{payload.to}&gt;</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px] mt-0.5">Subject:</span>
              <span className="font-extrabold text-slate-900 dark:text-white leading-snug">{payload.subject}</span>
            </div>
          </div>

          {/* Simulated HTML Email Body */}
          <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
            {/* Email Brand Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-700 p-5 text-center">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-2xl px-4 py-2 mb-3">
                <School className="w-5 h-5 text-amber-300" />
                <span className="font-black text-white text-sm tracking-wide">i2A SchoolOS</span>
              </div>
              <h2 className="text-lg font-black text-white leading-tight">
                {language === 'hi' ? '🎉 आपका खाता सफलतापूर्वक बन गया!' : '🎉 Your Account is Ready!'}
              </h2>
              <p className="text-indigo-200 text-xs mt-1">
                {payload.schoolName}
              </p>
            </div>

            {/* Email Content */}
            <div className="bg-white dark:bg-slate-800/40 p-5 space-y-4">

              {/* Salutation */}
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {language === 'hi'
                  ? `नमस्ते ${payload.recipientName},`
                  : `Dear ${payload.recipientName},`}
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {language === 'hi'
                  ? `आपका i2A SchoolOS पोर्टल अकाउंट सफलतापूर्वक बनाया जा चुका है। नीचे आपकी आधिकारिक लॉगिन जानकारी दी जा रही है।`
                  : `Your ${isSchool ? 'school' : isStaff ? 'staff' : 'student & parent'} portal account on i2A SchoolOS has been successfully created. Please find your official login credentials below.`}
              </p>

              {/* Credential Box */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 border-2 border-indigo-200 dark:border-indigo-700/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-indigo-200/60 dark:border-indigo-700/40">
                  {isSchool ? <School className="w-4 h-4 text-indigo-600" /> : isStaff ? <Users className="w-4 h-4 text-emerald-600" /> : <GraduationCap className="w-4 h-4 text-purple-600" />}
                  <span className="font-extrabold text-indigo-800 dark:text-indigo-300 text-[11px] uppercase tracking-wider">
                    {language === 'hi' ? '🔐 आपकी लॉगिन जानकारी' : '🔐 Your Login Credentials'}
                  </span>
                </div>

                {[
                  { label: language === 'hi' ? 'स्कूल / संस्था' : 'School / Institution', value: payload.schoolName, key: 'school' },
                  { label: language === 'hi' ? 'स्कूल ID' : 'School ID', value: payload.schoolId, key: 'schoolid' },
                  { label: language === 'hi' ? 'लॉगिन ID (Username)' : 'Login ID / Username', value: payload.username, key: 'username', mono: true },
                  { label: language === 'hi' ? 'पासवर्ड (Password)' : 'Password (Initial Setup)', value: '•••••••••••• (Sent securely to registered recipient)', key: 'password', mono: true, sensitive: true },
                  { label: language === 'hi' ? 'भूमिका' : 'Role / Access Level', value: payload.role, key: 'role' },
                ].map(({ label, value, key, mono, sensitive }) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400 font-medium min-w-28">{label}</span>
                    <div className="flex items-center gap-1.5 flex-1 justify-end">
                      <span className={`${mono ? 'font-mono' : 'font-bold'} text-slate-900 dark:text-white text-[11px] ${sensitive ? 'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-700/40 px-2 py-0.5 rounded-lg text-amber-700 dark:text-amber-300' : ''}`}>
                        {sensitive ? '•••••••••••• (Sent securely to recipient)' : value}
                      </span>
                      {!sensitive && (
                        <button
                          onClick={() => copy(value || '', key)}
                          className="p-1 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-slate-500 hover:text-indigo-600 transition-all"
                          title="Copy"
                        >
                          <CheckCheck className={`w-3 h-3 ${copied === key ? 'text-emerald-500' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Portal Access Links */}
              <div className="space-y-2">
                <p className="font-extrabold text-slate-800 dark:text-white text-[11px] uppercase tracking-wider">
                  {language === 'hi' ? '🔗 पोर्टल एक्सेस लिंक' : '🔗 Portal Access Links'}
                </p>

                <a
                  href={payload.loginUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all text-[11px] group"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="flex-1">
                    {language === 'hi' ? '🌐 वेब पोर्टल पर लॉगिन करें' : '🌐 Login to Web Portal'}
                    <span className="font-mono text-indigo-200 text-[10px] ml-2 group-hover:text-white">{payload.loginUrl}</span>
                  </span>
                </a>

                <a
                  href={payload.webAppDownloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-all text-[11px]"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="flex-1">
                    {language === 'hi' ? '📱 मोबाइल WebApp इंस्टॉल करें (PWA)' : '📱 Install Mobile WebApp (PWA — Works Offline)'}
                  </span>
                </a>
              </div>

              {/* Security Notice */}
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700/40 rounded-xl p-3 space-y-1">
                <p className="font-extrabold text-amber-800 dark:text-amber-300 text-[11px]">
                  ⚠️ {language === 'hi' ? 'सुरक्षा सूचना' : 'Security Notice'}
                </p>
                <p className="text-amber-700 dark:text-amber-400 leading-relaxed text-[10px]">
                  {language === 'hi'
                    ? 'पहली बार लॉगिन करने के बाद कृपया अपना पासवर्ड बदल लें। अपनी लॉगिन जानकारी किसी के साथ साझा न करें।'
                    : 'Please change your password immediately after first login. Do not share credentials with anyone. Contact your school admin if you face any issues.'}
                </p>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-3 text-center space-y-1">
                <p className="text-slate-500 dark:text-slate-400 text-[10px]">
                  {language === 'hi'
                    ? 'यह एक स्वचालित ईमेल है। i2A SchoolOS — भारत का #1 स्कूल प्रबंधन SaaS प्लेटफॉर्म।'
                    : "This is an automated email from i2A SchoolOS — India's Premier School Management SaaS Platform."}
                </p>
                <p className="text-slate-400 dark:text-slate-500 text-[10px]">
                  © {new Date().getFullYear()} i2A SchoolOS. All rights reserved. • support@i2aschoolos.in
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between gap-3 shrink-0">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <MailCheck className="w-3 h-3 text-emerald-500" />
            {language === 'hi' ? 'यह ईमेल SMTP द्वारा प्रेषित किया गया है।' : 'Email dispatched via SMTP gateway. Delivered to inbox.'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all"
          >
            {language === 'hi' ? 'बंद करें' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
//  Real-Time Toast Notification (Credential Dispatch Alert)
// ─────────────────────────────────────────────────────────────
interface ToastItem {
  id: string;
  notification: SystemNotification;
  visible: boolean;
}

export const GlobalNotificationToast: React.FC = () => {
  const { notifications, language, markNotificationAsRead } = useSchool();
  const [toastQueue, setToastQueue] = useState<ToastItem[]>([]);
  const [activeEmailModal, setActiveEmailModal] = useState<DispatchedEmailPayload | null>(null);
  const [seenIds] = useState<Set<string>>(new Set());

  // Watch for new unread notifications and queue them as toasts
  useEffect(() => {
    const newUnread = notifications.filter(
      (n) => !n.read && !seenIds.has(n.id)
    );

    if (newUnread.length === 0) return;

    // Only show toasts that haven't been seen in this session
    const freshNew = newUnread.filter((n) => {
      if (seenIds.has(n.id)) return false;
      seenIds.add(n.id);
      return true;
    });

    if (freshNew.length === 0) return;

    // Limit to latest 3 to avoid spam
    const latest = freshNew.slice(0, 3);

    setToastQueue((prev) => [
      ...prev,
      ...latest.map((n) => ({ id: n.id, notification: n, visible: true }))
    ]);

    // Auto-dismiss each toast after 7 seconds
    latest.forEach((n) => {
      setTimeout(() => {
        setToastQueue((prev) =>
          prev.map((t) => t.id === n.id ? { ...t, visible: false } : t)
        );
        // Remove from DOM after fade-out
        setTimeout(() => {
          setToastQueue((prev) => prev.filter((t) => t.id !== n.id));
        }, 400);
      }, 7000);
    });
  }, [notifications, seenIds]);

  const dismissToast = (id: string) => {
    setToastQueue((prev) =>
      prev.map((t) => t.id === id ? { ...t, visible: false } : t)
    );
    setTimeout(() => {
      setToastQueue((prev) => prev.filter((t) => t.id !== id));
    }, 400);
  };

  const typeIcon = (type: string) => {
    if (type === 'SCHOOL_CREDENTIALS') return '🏫';
    if (type === 'STAFF_CREDENTIALS') return '👩‍🏫';
    return '🎓';
  };

  const typeColor = (type: string) => {
    if (type === 'SCHOOL_CREDENTIALS') return 'from-amber-500 to-orange-600';
    if (type === 'STAFF_CREDENTIALS') return 'from-emerald-500 to-teal-600';
    return 'from-indigo-500 to-purple-600';
  };

  const typeBg = (type: string) => {
    if (type === 'SCHOOL_CREDENTIALS') return 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-700/50';
    if (type === 'STAFF_CREDENTIALS') return 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-700/50';
    return 'bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-700/50';
  };

  if (toastQueue.length === 0 && !activeEmailModal) return null;

  return (
    <>
      {/* Toast Stack - Bottom Right */}
      <div className="fixed bottom-5 right-5 z-[990] flex flex-col gap-3 items-end pointer-events-none">
        {toastQueue.map((toast) => (
          <div
            key={toast.id}
            className={`
              w-80 rounded-2xl border shadow-2xl p-4 pointer-events-auto
              transition-all duration-400
              ${typeBg(toast.notification.type)}
              ${toast.visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}
            `}
          >
            {/* Toast Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${typeColor(toast.notification.type)} text-white shrink-0 shadow-md`}>
                  <MailCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-black uppercase text-slate-500 dark:text-slate-400">
                      {typeIcon(toast.notification.type)}
                      {language === 'hi' ? ' क्रेडेंशियल्स प्रेषित' : ' Credentials Dispatched'}
                    </span>
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                    </span>
                  </div>
                  <p className="font-extrabold text-slate-900 dark:text-white text-xs leading-tight truncate mt-0.5">
                    {toast.notification.title}
                  </p>
                </div>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 shrink-0 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Toast Message */}
            <p className="text-[10px] text-slate-600 dark:text-slate-400 mt-2 leading-tight">
              {toast.notification.message}
            </p>

            {/* View Email CTA */}
            {toast.notification.emailPayload && (
              <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/40 flex items-center justify-between gap-2">
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <MailCheck className="w-3 h-3" />
                  {language === 'hi' ? 'ईमेल SMTP से भेजा गया' : 'Email sent via SMTP'}
                </span>
                <button
                  onClick={() => {
                    setActiveEmailModal(toast.notification.emailPayload!);
                    markNotificationAsRead(toast.id);
                    dismissToast(toast.id);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] flex items-center gap-1 shadow-md shadow-indigo-500/20 transition-all"
                >
                  <ExternalLink className="w-3 h-3" />
                  {language === 'hi' ? 'ईमेल देखें' : 'View Email'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Full Email Preview Modal */}
      {activeEmailModal && (
        <EmailPreviewModal
          payload={activeEmailModal}
          onClose={() => setActiveEmailModal(null)}
          language={language}
        />
      )}
    </>
  );
};
