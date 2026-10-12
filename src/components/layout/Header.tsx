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
  Bot
} from 'lucide-react';

export const Header: React.FC = () => {
  const {
    branding,
    activeTenant,
    returnToPublicSaas,
    currentRole,
    setCurrentRole,
    darkMode,
    setDarkMode,
    activeModule,
    setActiveModule,
    admissions,
    examPapers
  } = useSchool();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Pending approval counts for Safety/Liability Control
  const pendingAdmissions = admissions.filter((a) => a.status === 'INTERVIEW_SCHEDULED' || a.status === 'SUBMITTED').length;
  const pendingExamPapers = examPapers.filter((e) => e.status === 'AI_DRAFT' || e.status === 'TEACHER_REVIEW').length;
  const totalPendingNotifications = pendingAdmissions + pendingExamPapers;

  const isSubscriptionExpired = activeTenant?.subscriptionStatus === 'EXPIRED' || activeTenant?.subscriptionStatus === 'SUSPENDED';

  const roles: { role: UserRole; label: string; bg: string }[] = [
    { role: 'PRINCIPAL', label: 'School Principal', bg: 'bg-indigo-600' },
    { role: 'ADMIN', label: 'School Management', bg: 'bg-blue-600' },
    { role: 'TEACHER', label: 'Teacher Portal', bg: 'bg-amber-600' },
    { role: 'ACCOUNTANT', label: 'Accountant', bg: 'bg-emerald-600' },
    { role: 'STAFF', label: 'Office Staff / Clerk', bg: 'bg-teal-600' },
    { role: 'TRANSPORT', label: 'Transport / Driver', bg: 'bg-orange-600' },
    { role: 'PARENT', label: 'Parent Portal', bg: 'bg-cyan-600' },
    { role: 'STUDENT', label: 'Student Portal', bg: 'bg-purple-600' },
    { role: 'SUPER_ADMIN', label: 'i2A SaaS Master', bg: 'bg-slate-800' }
  ];

  const navItems = [
    { id: 'principal_dashboard', label: 'Dashboard Overview', icon: LayoutDashboard, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'STAFF', 'TRANSPORT', 'PARENT', 'STUDENT', 'SUPER_ADMIN'] },
    { id: 'school_setup', label: 'School Setup', icon: Building2, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'] },
    { id: 'student_management', label: 'Students', icon: Users, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'STAFF', 'SUPER_ADMIN'] },
    { id: 'admission_workflow', label: 'Admissions', icon: UserPlus, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'STAFF', 'SUPER_ADMIN'] },
    { id: 'fee_management', label: 'Fee & Payments', icon: CreditCard, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'STAFF', 'PARENT', 'SUPER_ADMIN'] },
    { id: 'digital_books_ai', label: 'Digital Books & Question Bank', icon: BookOpen, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'SUPER_ADMIN'] },
    { id: 'homework_learning', label: 'Homework & Learning', icon: BookOpen, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'] },
    { id: 'examination_ai', label: 'Exams & Test Papers', icon: FileQuestion, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'] },
    { id: 'examination_result_engine', label: 'Results & CGPA', icon: Award, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'] },
    { id: 'report_card_certs', label: 'Report Cards & Certs', icon: Award, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STAFF', 'PARENT', 'STUDENT', 'SUPER_ADMIN'] },
    { id: 'attendance_timetable', label: 'Attendance & Leaves', icon: CalendarCheck, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STAFF', 'TRANSPORT', 'STUDENT', 'PARENT', 'SUPER_ADMIN'] },
    { id: 'timetable_engine', label: 'Timetable & Scheduling', icon: CalendarCheck, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'] },
    { id: 'payroll_expenses', label: 'Payroll & Expenses', icon: BadgePercent, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN'] },
    { id: 'library_transport', label: 'Transport & Fleet', icon: Bus, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'STAFF', 'TRANSPORT', 'TEACHER', 'STUDENT', 'SUPER_ADMIN'] },
    { id: 'website_builder', label: 'Website CMS & Portal', icon: Globe, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'] },
    { id: 'audit_trail', label: 'Audit Trail', icon: ShieldAlert, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'] }
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
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base leading-tight tracking-tight">
                {branding.name}
              </h1>
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
                {activeTenant?.subscriptionStatus || 'ACTIVE'}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden lg:block">
              {branding.tagline} • Session {branding.academicSession}
            </p>
          </div>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search student, fee receipt, or exam paper..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* SaaS Central / Switch School button */}
          <button
            onClick={returnToPublicSaas}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Return to i2A SchoolOS SaaS Homepage / Switch School"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" /> SaaS Central
          </button>

          {/* Role Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <UserCheck className="h-4 w-4 text-indigo-500 ml-1.5 hidden lg:block" />
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 hidden lg:block">View As:</span>
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
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-4 z-50 animate-fade-in">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white">Controlled Approval Center</h3>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                    {totalPendingNotifications} Pending
                  </span>
                </div>

                <div className="py-2 space-y-2.5 max-h-64 overflow-y-auto">
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
