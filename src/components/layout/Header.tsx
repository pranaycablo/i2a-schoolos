import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { UserRole } from '../../types';
import {
  Sun,
  Moon,
  ShieldCheck,
  Bell,
  Search,
  School,
  UserCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  Menu,
  X,
  LayoutDashboard,
  Building2,
  Users,
  UserPlus,
  CreditCard,
  BookOpen,
  FileQuestion,
  Award,
  CalendarCheck,
  BadgePercent,
  Bus,
  Globe,
  ShieldAlert,
  Bot,
  ShoppingBag,
  Languages,
  ChevronDown,
  PlusCircle,
  Check,
  Copy,
  ExternalLink,
  Download,
  MailCheck,
  CheckCheck
} from 'lucide-react';
import type { DispatchedEmailPayload } from '../../types';

export const Header: React.FC = () => {
  const {
    branding,
    activeTenant,
    tenants,
    loginToSchool,
    registerSchool,
    students,
    returnToPublicSaas,
    currentRole,
    setCurrentRole,
    darkMode,
    setDarkMode,
    activeModule,
    setActiveModule,
    admissions,
    examPapers,
    language,
    setLanguage,
    t,
    notifications,
    markNotificationAsRead,
    clearAllNotifications
  } = useSchool();

  const [showNotifications, setShowNotifications] = useState(false);
  const [activeEmailModal, setActiveEmailModal] = useState<DispatchedEmailPayload | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [showNewSchoolModal, setShowNewSchoolModal] = useState(false);
  const [newSchoolForm, setNewSchoolForm] = useState({
    name: '',
    board: 'CBSE' as 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'IB',
    city: 'Patna',
    adminName: '',
    adminPhone: '',
    adminEmail: '',
    planId: 'PROFESSIONAL' as 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE'
  });
  const [schoolCreationMsg, setSchoolCreationMsg] = useState('');

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2500);
  };

  // Pending approval counts and unread credential dispatches
  const pendingAdmissions = admissions.filter((a) => a.status === 'INTERVIEW_SCHEDULED' || a.status === 'SUBMITTED').length;
  const pendingExamPapers = examPapers.filter((e) => e.status === 'AI_DRAFT' || e.status === 'TEACHER_REVIEW').length;
  const unreadCredentialNotifications = notifications.filter((n) => !n.read).length;
  const totalPendingNotifications = pendingAdmissions + pendingExamPapers + unreadCredentialNotifications;

  const isSubscriptionExpired = activeTenant?.subscriptionStatus === 'EXPIRED' || activeTenant?.subscriptionStatus === 'SUSPENDED';

  const roles: { role: UserRole; label: string; bg: string }[] = [
    { role: 'PRINCIPAL', label: t('PRINCIPAL'), bg: 'bg-indigo-600' },
    { role: 'ADMIN', label: t('ADMIN'), bg: 'bg-blue-600' },
    { role: 'TEACHER', label: t('TEACHER'), bg: 'bg-amber-600' },
    { role: 'ACCOUNTANT', label: t('ACCOUNTANT'), bg: 'bg-emerald-600' },
    { role: 'STAFF', label: t('STAFF'), bg: 'bg-teal-600' },
    { role: 'TRANSPORT', label: t('TRANSPORT'), bg: 'bg-orange-600' },
    { role: 'PARENT', label: t('PARENT'), bg: 'bg-cyan-600' },
    { role: 'STUDENT', label: t('STUDENT'), bg: 'bg-purple-600' },
    { role: 'SUPER_ADMIN', label: t('SUPER_ADMIN'), bg: 'bg-slate-800' }
  ];

  const navItems = [
    { id: 'principal_dashboard', label: t('principal_dashboard'), icon: LayoutDashboard, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'STAFF', 'TRANSPORT', 'PARENT', 'STUDENT', 'SUPER_ADMIN'] },
    { id: 'school_setup', label: t('school_setup'), icon: Building2, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'] },
    { id: 'student_management', label: t('student_management'), icon: Users, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'STAFF', 'SUPER_ADMIN'] },
    { id: 'admission_workflow', label: t('admission_workflow'), icon: UserPlus, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'STAFF', 'SUPER_ADMIN'] },
    { id: 'fee_management', label: t('fee_management'), icon: CreditCard, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'STAFF', 'PARENT', 'SUPER_ADMIN'] },
    { id: 'digital_books_ai', label: t('digital_books_ai'), icon: BookOpen, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'SUPER_ADMIN'] },
    { id: 'homework_learning', label: t('homework_learning'), icon: BookOpen, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'] },
    { id: 'examination_ai', label: t('examination_ai'), icon: FileQuestion, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'] },
    { id: 'examination_result_engine', label: t('examination_result_engine'), icon: Award, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'] },
    { id: 'report_card_certs', label: t('report_card_certs'), icon: Award, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STAFF', 'PARENT', 'STUDENT', 'SUPER_ADMIN'] },
    { id: 'attendance_timetable', label: t('attendance_timetable'), icon: CalendarCheck, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STAFF', 'TRANSPORT', 'STUDENT', 'PARENT', 'SUPER_ADMIN'] },
    { id: 'timetable_engine', label: t('timetable_engine'), icon: CalendarCheck, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'] },
    { id: 'payroll_expenses', label: t('payroll_expenses'), icon: BadgePercent, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN'] },
    { id: 'staff_workforce', label: t('staff_workforce'), icon: Users, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'] },
    { id: 'library_transport', label: t('library_transport'), icon: Bus, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'STAFF', 'TRANSPORT', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'] },
    { id: 'school_marketplace', label: t('school_marketplace'), icon: ShoppingBag, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'STAFF', 'TRANSPORT', 'PARENT', 'STUDENT', 'SUPER_ADMIN'] },
    { id: 'website_builder', label: t('website_builder'), icon: Globe, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'] },
    { id: 'audit_trail', label: t('audit_trail'), icon: ShieldAlert, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'] }
  ];

  const visibleNavItems = navItems.filter((n) => n.roles.includes(currentRole));

  const handleRoleChange = (newRole: UserRole) => {
    setCurrentRole(newRole);
    if (newRole === 'STUDENT') {
      setActiveModule('digital_books_ai');
    } else if (newRole === 'PARENT') {
      setActiveModule('fee_management');
    } else if (newRole === 'TRANSPORT') {
      setActiveModule('library_transport');
    } else if (newRole === 'ACCOUNTANT') {
      setActiveModule('fee_management');
    } else if (newRole === 'TEACHER') {
      setActiveModule('attendance_timetable');
    } else if (newRole === 'STAFF') {
      setActiveModule('student_management');
    } else {
      setActiveModule('principal_dashboard');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">

      {/* Expired / Suspended Subscription Alert Banner */}
      {isSubscriptionExpired && (
        <div className="bg-rose-600 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2">
          <span>⚠️ आपका सब्सक्रिप्शन समाप्त हो गया है। नवीनीकरण करके सुविधाएँ फिर शुरू करें। (Subscription Expired - Please Renew)</span>
          <button
            onClick={returnToPublicSaas}
            className="px-2.5 py-0.5 rounded-md bg-white text-rose-700 font-extrabold hover:bg-slate-100 transition-colors text-[10px]"
          >
            Renew Now
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Trigger + Branding & Tagline */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            aria-label="Toggle Navigation Drawer"
          >
            {showMobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center text-white shrink-0">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="School Logo" className="h-full w-full object-cover rounded-[10px]" />
            ) : (
              <School className="h-6 w-6" />
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
              className="flex items-center gap-2 text-left group p-1.5 -ml-1.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
              title="Click to switch school campus or create a new school"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight tracking-tight group-hover:text-indigo-600 transition-colors">
                    {branding.name}
                  </h1>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform" />
                  <span className="font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 border border-slate-200 dark:border-slate-700 hidden sm:inline-block">
                    {activeTenant?.id || 'I2A-SCH-000001'}
                  </span>
                  <span
                    className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full hidden sm:inline-block ${
                      activeTenant?.subscriptionStatus === 'ACTIVE'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                    }`}
                  >
                    {activeTenant?.board || 'CBSE'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 hidden lg:block">
                  {branding.tagline} • Session {branding.academicSession}
                </p>
              </div>
            </button>

            {/* School Switcher Dropdown */}
            {showSchoolDropdown && (
              <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-3 z-50 animate-fade-in space-y-2">
                <div className="flex items-center justify-between px-2 pt-1 border-b pb-2 border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">
                    {language === 'hi' ? 'सक्रिय स्कूल चुनें (Switch Campus)' : 'Switch Active Campus'}
                  </span>
                  <button
                    onClick={() => {
                      setShowSchoolDropdown(false);
                      setShowNewSchoolModal(true);
                    }}
                    className="flex items-center gap-1 font-bold text-indigo-600 dark:text-indigo-400 hover:underline text-[11px]"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    {language === 'hi' ? '+ नया स्कूल' : '+ New School'}
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1">
                  {tenants.map((tenant) => {
                    const isCurrent = tenant.id === activeTenant?.id;
                    return (
                      <button
                        key={tenant.id}
                        onClick={() => {
                          loginToSchool(tenant.id, currentRole);
                          setShowSchoolDropdown(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-2xl transition-all flex items-center justify-between text-xs ${
                          isCurrent
                            ? 'bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 font-bold'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="truncate pr-2">
                          <p className="font-extrabold text-slate-900 dark:text-white truncate">{tenant.name}</p>
                          <p className="text-[10px] text-slate-500">{tenant.city} • {tenant.board} • {tenant.id}</p>
                        </div>
                        {isCurrent && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    setShowSchoolDropdown(false);
                    setShowNewSchoolModal(true);
                  }}
                  className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <PlusCircle className="w-4 h-4" />
                  {language === 'hi' ? 'नया स्कूल रजिस्टर करें' : 'Register Brand New School'}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Quick School Store Access Button */}
          <button
            onClick={() => setActiveModule('school_marketplace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm ${
              activeModule === 'school_marketplace'
                ? 'bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-400'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
            }`}
            title={language === 'hi' ? 'स्कूल स्टोर एवं यूनिफॉर्म' : 'School Store & Uniform Marketplace'}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline font-extrabold">{language === 'hi' ? 'स्कूल स्टोर' : 'School Store'}</span>
          </button>

          {/* Language Selector: English / हिन्दी */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'en'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="Switch to English"
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all ${
                language === 'hi'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
              title="हिन्दी में बदलें"
            >
              हिन्दी
            </button>
          </div>

          {/* SaaS Central / Switch School button */}
          <button
            onClick={returnToPublicSaas}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Return to i2A SchoolOS SaaS Homepage / Switch School"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> {t('saas_central')}
          </button>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <UserCheck className="h-4 w-4 text-indigo-500 ml-1.5 hidden lg:block" />
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden lg:block">{t('view_as')}</span>
            <select
              value={currentRole}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              className="bg-transparent text-xs font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer pr-1"
            >
              {roles.map((r) => (
                <option key={r.role} value={r.role} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          {/* Pending Approval Notifications Drawer Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Controlled Approvals & Alerts"
            >
              <Bell className="h-5 w-5" />
              {totalPendingNotifications > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                  {totalPendingNotifications}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-fade-in space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
                      {language === 'hi' ? 'सूचना एवं प्रेषण केंद्र (Dispatch Center)' : 'Controlled Dispatch & Alert Center'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                      {totalPendingNotifications} {language === 'hi' ? 'लंबित' : 'Pending'}
                    </span>
                    {notifications.length > 0 && (
                      <button
                        onClick={clearAllNotifications}
                        className="text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Clear all dispatches"
                      >
                        {language === 'hi' ? 'साफ़ करें' : 'Clear'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="py-1 space-y-2.5 max-h-80 overflow-y-auto">
                  {/* Automated Credential Dispatch Notifications */}
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={`p-3 rounded-2xl border text-xs transition-all ${
                        notif.read
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                          : 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 ring-1 ring-indigo-400/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                notif.type === 'SCHOOL_CREDENTIALS'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : notif.type === 'STAFF_CREDENTIALS'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                              }`}
                            >
                              {notif.type === 'SCHOOL_CREDENTIALS'
                                ? '🏫 स्कूल ID/PW'
                                : notif.type === 'STAFF_CREDENTIALS'
                                ? '👩‍🏫 स्टाफ ID/PW'
                                : '🎓 छात्र/अभिभावक ID/PW'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-semibold">{notif.timestamp}</span>
                          </div>
                          <p className="font-extrabold text-slate-900 dark:text-white text-xs leading-snug">
                            {notif.title}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-tight">
                            {notif.message}
                          </p>
                        </div>
                      </div>

                      {notif.emailPayload && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <MailCheck className="w-3 h-3" />
                            {language === 'hi' ? 'ईमेल प्रेषित' : 'Email Dispatched'}
                          </span>
                          <button
                            onClick={() => {
                              setActiveEmailModal(notif.emailPayload!);
                              markNotificationAsRead(notif.id);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] shadow-sm flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {language === 'hi' ? 'ईमेल व पासवर्ड देखें' : 'View Credentials'}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Pending Admissions */}
                  {pendingAdmissions > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40">
                      <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-medium text-xs">
                        <Clock className="h-3.5 w-3.5" /> Admission Approvals ({pendingAdmissions})
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        Parents waiting for Principal document sign-off & fee creation.
                      </p>
                    </div>
                  )}

                  {/* Pending Exam Papers */}
                  {pendingExamPapers > 0 && (
                    <div className="p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/40">
                      <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-300 font-medium text-xs">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> AI Question Paper Drafts ({pendingExamPapers})
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">
                        AI papers ready for Teacher review & Principal approval lock.
                      </p>
                    </div>
                  )}

                  {totalPendingNotifications === 0 && (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-1 opacity-80" />
                      All approval queues clear. Zero operational friction!
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-slate-600" />}
          </button>
        </div>
      </div>

      {/* Parent Ward Quick Access Ribbon */}
      {currentRole === 'PARENT' && (
        <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 border-t border-slate-200 dark:border-slate-800 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="font-extrabold text-slate-900 dark:text-white">
                {language === 'hi' ? 'विद्यार्थी (Ward):' : 'Student (Ward):'}
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {students[0]?.name || 'Rahul Kumar'} ({students[0]?.className || 'Class VIII'}-{students[0]?.section || 'A'})
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                {language === 'hi' ? 'उपस्थिति: 96% उपस्थित' : 'Attendance: 96% Present'}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setActiveModule('fee_management')}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 transition-all"
              >
                <CreditCard className="w-3.5 h-3.5" />
                {language === 'hi' ? 'फीस जमा करें (₹2,500)' : 'Pay Dues (₹2,500)'}
              </button>
              <button
                onClick={() => setActiveModule('library_transport')}
                className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Bus className="w-3.5 h-3.5" />
                {language === 'hi' ? 'बस लाइव ट्रैक' : 'Track Bus Route'}
              </button>
              <button
                onClick={() => setActiveModule('school_marketplace')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 transition-all"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                {language === 'hi' ? 'स्कूल स्टोर (ड्रेस/बुक्स)' : 'School Store'}
              </button>
              <button
                onClick={() => setActiveModule('report_card_certs')}
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1.5 transition-all"
              >
                <Award className="w-3.5 h-3.5" />
                {language === 'hi' ? 'प्रगति पत्र (Marksheet)' : 'Term Marksheet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Alert */}
      {schoolCreationMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2 text-center text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
          <span>{schoolCreationMsg}</span>
        </div>
      )}

      {/* New School Registration Modal */}
      {showNewSchoolModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 text-white shadow">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {language === 'hi' ? 'नया स्कूल रजिस्टर करें' : 'Register Brand New School'}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {language === 'hi' ? 'i2A SchoolOS में तुरंत नया स्कूल कैंपस शुरू करें' : 'Instant Multi-Tenant Campus Onboarding'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNewSchoolModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newSchoolForm.name.trim() || !newSchoolForm.adminName.trim()) return;
                const newTenant = registerSchool({
                  name: newSchoolForm.name,
                  adminName: newSchoolForm.adminName,
                  adminEmail: newSchoolForm.adminEmail || 'admin@' + newSchoolForm.name.toLowerCase().replace(/\s+/g, '') + '.edu.in',
                  adminPhone: newSchoolForm.adminPhone || '+91 9876543210',
                  city: newSchoolForm.city || 'Patna',
                  board: newSchoolForm.board,
                  planId: newSchoolForm.planId,
                  billingCycle: 'YEARLY'
                });
                loginToSchool(newTenant.id, 'PRINCIPAL');
                setShowNewSchoolModal(false);
                setSchoolCreationMsg(`🎉 नया स्कूल '${newTenant.name}' सफलतापूर्वक शुरू हुआ!`);
                setTimeout(() => setSchoolCreationMsg(''), 5000);
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  {language === 'hi' ? 'स्कूल का आधिकारिक नाम *' : 'School Official Name *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delhi Public International Academy"
                  value={newSchoolForm.name}
                  onChange={(e) => setNewSchoolForm({ ...newSchoolForm, name: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    {language === 'hi' ? 'बोर्ड संबद्धता *' : 'Board Affiliation *'}
                  </label>
                  <select
                    value={newSchoolForm.board}
                    onChange={(e) => setNewSchoolForm({ ...newSchoolForm, board: e.target.value as any })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold outline-none"
                  >
                    <option value="CBSE">CBSE (Central Board)</option>
                    <option value="ICSE">ICSE / CISCE</option>
                    <option value="STATE_BOARD">State Board</option>
                    <option value="IB">International Baccalaureate (IB)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    {language === 'hi' ? 'शहर / राज्य *' : 'City / State *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Patna, Bihar"
                    value={newSchoolForm.city}
                    onChange={(e) => setNewSchoolForm({ ...newSchoolForm, city: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    {language === 'hi' ? 'प्रधानाचार्य / डायरेक्टर का नाम *' : 'Principal / Director Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. A.K. Sharma"
                    value={newSchoolForm.adminName}
                    onChange={(e) => setNewSchoolForm({ ...newSchoolForm, adminName: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                    {language === 'hi' ? 'मोबाइल नंबर (WhatsApp) *' : 'Phone / WhatsApp *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 9876543210"
                    value={newSchoolForm.adminPhone}
                    onChange={(e) => setNewSchoolForm({ ...newSchoolForm, adminPhone: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 dark:text-slate-400 font-medium mb-1">
                  {language === 'hi' ? 'आधिकारिक ईमेल' : 'Official Email'}
                </label>
                <input
                  type="email"
                  placeholder="contact@dpia.edu.in"
                  value={newSchoolForm.adminEmail}
                  onChange={(e) => setNewSchoolForm({ ...newSchoolForm, adminEmail: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewSchoolModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold"
                >
                  {language === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {language === 'hi' ? 'नया स्कूल शुरू करें' : 'Launch New School'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Official Credentials Dispatch & WebApp Access Email Modal */}
      {activeEmailModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/75 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-0 overflow-hidden max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-purple-800 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300">
                  <MailCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                      ✓ SMTP DISPATCHED
                    </span>
                    <span className="text-[10px] font-bold text-indigo-200">
                      {activeEmailModal.dispatchedAt}
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white mt-0.5">
                    {language === 'hi' ? 'आधिकारिक प्रेषण: आईडी, पासवर्ड व वेबऐप लिंक' : 'Official Credentials & WebApp Access Email'}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setActiveEmailModal(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Email Body & Credentials */}
            <div className="p-6 space-y-5 overflow-y-auto text-xs flex-1">
              {/* Email Envelope Meta Details */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/60 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-bold uppercase text-[10px]">From:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-bold">
                      noreply@schoolos.in (i2A SchoolOS Automated Gateway)
                    </span>
                  </div>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                    {activeEmailModal.role} Access
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">To:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {activeEmailModal.recipientName}
                  </span>
                  <span className="font-mono text-indigo-600 dark:text-indigo-400">
                    &lt;{activeEmailModal.to}&gt;
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400 font-bold uppercase text-[10px]">Subject:</span>
                  <span className="font-extrabold text-slate-900 dark:text-white">
                    {activeEmailModal.subject}
                  </span>
                </div>
              </div>

              {/* Salutation & School Note */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 text-slate-700 dark:text-slate-300 space-y-1.5 leading-relaxed">
                <p className="font-bold text-slate-900 dark:text-white">
                  {language === 'hi'
                    ? `नमस्ते ${activeEmailModal.recipientName},`
                    : `Dear ${activeEmailModal.recipientName},`}
                </p>
                <p>
                  {language === 'hi'
                    ? `आपको ${activeEmailModal.schoolName} (ID: ${activeEmailModal.schoolId}) के i2A SchoolOS पोर्टल और मोबाइल वेबऐप का आधिकारिक लॉगिन व सुरक्षा पासवर्ड प्रेषित किया गया है।`
                    : `You have been registered for ${activeEmailModal.schoolName} (ID: ${activeEmailModal.schoolId}). Below are your official login credentials and direct WebApp download instructions.`}
                </p>
              </div>

              {/* Credentials Card (with 1-click copy) */}
              <div className="bg-slate-900 dark:bg-black rounded-2xl p-5 border border-slate-800 text-white shadow-xl space-y-3">
                <div className="flex items-center justify-between border-b pb-2.5 border-slate-800">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    {language === 'hi' ? 'गोपनीय लॉगिन विवरण (Login Credentials)' : 'Confidential Login Credentials'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Role: <strong className="text-white">{activeEmailModal.role}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* School ID */}
                  <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">School ID / कोड</div>
                      <div className="font-mono text-sm font-bold text-white mt-0.5">{activeEmailModal.schoolId}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(activeEmailModal.schoolId, 'schoolId')}
                      className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                      title="Copy School ID"
                    >
                      {copiedField === 'schoolId' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Login ID */}
                  <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Login ID / रोल कोड</div>
                      <div className="font-mono text-sm font-bold text-white mt-0.5">{activeEmailModal.loginId}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(activeEmailModal.loginId, 'loginId')}
                      className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                      title="Copy Login ID"
                    >
                      {copiedField === 'loginId' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Username / Email */}
                  <div className="bg-slate-800/80 rounded-xl p-3 border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Username / रजिस्टर्ड ईमेल</div>
                      <div className="font-mono text-xs font-bold text-indigo-300 mt-0.5 truncate max-w-[170px]">{activeEmailModal.username}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(activeEmailModal.username, 'username')}
                      className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                      title="Copy Username"
                    >
                      {copiedField === 'username' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password */}
                  <div className="bg-slate-800/80 rounded-xl p-3 border border-amber-500/30 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-amber-400 uppercase font-bold">Password / पासवर्ड</div>
                      <div className="font-mono text-sm font-extrabold text-amber-300 mt-0.5 tracking-wide">{activeEmailModal.password}</div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(activeEmailModal.password, 'password')}
                      className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300"
                      title="Copy Password"
                    >
                      {copiedField === 'password' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between">
                  <span>🔒 {language === 'hi' ? 'सुरक्षा हेतु पहले लॉगिन के बाद पासवर्ड बदल लें।' : 'For security, please change your password after initial login.'}</span>
                  <button
                    onClick={() => {
                      const allText = `School: ${activeEmailModal.schoolName}\nSchool ID: ${activeEmailModal.schoolId}\nLogin ID: ${activeEmailModal.loginId}\nUsername: ${activeEmailModal.username}\nPassword: ${activeEmailModal.password}\nWebApp URL: ${activeEmailModal.webAppDownloadUrl}`;
                      copyToClipboard(allText, 'all');
                    }}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    {copiedField === 'all' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {language === 'hi' ? 'सब कॉपी करें' : 'Copy All'}
                  </button>
                </div>
              </div>

              {/* WebApp Download & Installation Instructions */}
              <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-emerald-600 text-white">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 dark:text-white text-xs sm:text-sm">
                      {language === 'hi' ? '📱 i2A SchoolOS WebApp डाउनलोड व इंस्टाल गाइड' : '📱 i2A SchoolOS Mobile WebApp Install Guide'}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {language === 'hi' ? 'मोबाइल, टैबलेट या लैपटॉप पर बिना ऐप स्टोर जाए 1-क्लिक में चलाएं' : 'No App Store needed — 100% native PWA for Android, iOS & Desktop'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px]">
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">चरण 1: लिंक खोलें</div>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">अपने मोबाइल या कंप्यूटर के ब्राउज़र में WebApp लिंक पर क्लिक करें।</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">चरण 2: Add to Home</div>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">Chrome में <strong>Install App</strong> या Safari में Share ➔ <strong>Add to Home Screen</strong> दबाएं।</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-100 dark:border-emerald-900/50">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">चरण 3: लॉगिन करें</div>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">ऊपर दिए गए आधिकारिक Login ID और Password से तुरंत प्रवेश करें।</p>
                  </div>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-2">
                  <a
                    href={activeEmailModal.webAppDownloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {language === 'hi' ? '🚀 वेबऐप अभी खोलें (Launch WebApp)' : '🚀 Open Live WebApp'}
                  </a>
                  <button
                    onClick={() => {
                      copyToClipboard(activeEmailModal.webAppDownloadUrl, 'webappurl');
                    }}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-50 flex items-center gap-1.5"
                  >
                    {copiedField === 'webappurl' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {language === 'hi' ? 'वेबऐप लिंक कॉपी करें' : 'Copy WebApp URL'}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <CheckCheck className="w-4 h-4 text-emerald-500" />
                {language === 'hi' ? 'ईमेल सफल प्रेषित स्थिति दर्ज है' : 'Dispatched via i2A Notification Hub'}
              </span>
              <button
                onClick={() => setActiveEmailModal(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20"
              >
                {language === 'hi' ? 'स्वीकृत / बन्द करें' : 'Acknowledge & Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Mobile Navigation Drawer */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl p-4 space-y-2 max-h-[80vh] overflow-y-auto animate-fade-in shadow-2xl">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 pb-1">
            Mobile Navigation — Authorized Modules
          </div>
          <div className="grid grid-cols-1 gap-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeModule === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveModule(item.id);
                    setShowMobileMenu(false);
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md font-bold'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-indigo-500'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};
