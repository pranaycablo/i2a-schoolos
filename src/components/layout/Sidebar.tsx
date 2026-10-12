import React from 'react';
import { useSchool } from '../../context/SchoolContext';
import {
  LayoutDashboard,
  Building2,
  Users,
  UserPlus,
  CreditCard,
  BookOpen,
  FileQuestion,
  GraduationCap,
  CalendarCheck,
  BadgePercent,
  Bus,
  Globe,
  ShieldAlert,
  Bot,
  Sparkles,
  Award,
  ShoppingBag
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { activeModule, setActiveModule, currentRole, admissions, examPapers, t } = useSchool();

  const pendingAdm = admissions.filter((a) => a.status === 'INTERVIEW_SCHEDULED' || a.status === 'SUBMITTED').length;
  const pendingExams = examPapers.filter((e) => e.status === 'AI_DRAFT' || e.status === 'TEACHER_REVIEW').length;

  const navItems = [
    { id: 'principal_dashboard', label: t('principal_dashboard'), icon: LayoutDashboard, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'], badge: null },
    { id: 'principal_ai_assistant', label: t('principal_ai_assistant'), icon: Bot, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'], isAI: true },
    { id: 'school_setup', label: t('school_setup'), icon: Building2, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'], badge: null },
    { id: 'student_management', label: t('student_management'), icon: Users, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'STAFF', 'SUPER_ADMIN'], badge: null },
    { id: 'admission_workflow', label: t('admission_workflow'), icon: UserPlus, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'STAFF', 'SUPER_ADMIN'], badge: pendingAdm },
    { id: 'fee_management', label: t('fee_management'), icon: CreditCard, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'STAFF', 'PARENT', 'SUPER_ADMIN'], badge: null },
    { id: 'digital_books_ai', label: t('digital_books_ai'), icon: BookOpen, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'SUPER_ADMIN'], badge: null },
    { id: 'homework_learning', label: t('homework_learning'), icon: BookOpen, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'], badge: null },
    { id: 'examination_ai', label: t('examination_ai'), icon: FileQuestion, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'], badge: pendingExams },
    { id: 'examination_result_engine', label: t('examination_result_engine'), icon: Award, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'], badge: null },
    { id: 'report_card_certs', label: t('report_card_certs'), icon: Award, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STAFF', 'PARENT', 'STUDENT', 'SUPER_ADMIN'], badge: null },
    { id: 'attendance_timetable', label: t('attendance_timetable'), icon: CalendarCheck, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STAFF', 'TRANSPORT', 'STUDENT', 'PARENT', 'SUPER_ADMIN'], badge: null },
    { id: 'timetable_engine', label: t('timetable_engine'), icon: CalendarCheck, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'], badge: null },
    { id: 'payroll_expenses', label: t('payroll_expenses'), icon: BadgePercent, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN'], badge: null },
    { id: 'staff_workforce', label: t('staff_workforce'), icon: Users, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'], badge: null },
    { id: 'library_transport', label: t('library_transport'), icon: Bus, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'STAFF', 'TRANSPORT', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'], badge: null },
    { id: 'school_marketplace', label: t('school_marketplace'), icon: ShoppingBag, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'STAFF', 'TRANSPORT', 'STUDENT', 'PARENT', 'SUPER_ADMIN'], badge: null },
    { id: 'subscription_billing', label: t('subscription_billing'), icon: CreditCard, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN'], badge: null },
    { id: 'website_builder', label: t('website_builder'), icon: Globe, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'], badge: null },
    { id: 'audit_trail', label: t('audit_trail'), icon: ShieldAlert, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'], badge: null }
  ];

  // Filter items according to current active role
  const visibleItems = navItems.filter((item) => item.roles.includes(currentRole));

  return (
    <aside className="w-64 bg-white/70 dark:bg-slate-900/70 backdrop-blur-md border-r border-slate-200 dark:border-slate-800 p-3 flex flex-col justify-between shrink-0 transition-colors hidden md:flex">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
          Navigation Modules
        </div>

        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : item.isAI ? 'text-purple-500' : 'text-slate-400 dark:text-slate-500'}`} />
                <span>{item.label}</span>
              </div>

              {item.isAI && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
              )}

              {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Zero Manual Workload Status Banner */}
      <div className="mt-4 p-3 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white border border-indigo-800/50 relative overflow-hidden shadow-lg">
        <div className="absolute -right-4 -bottom-4 h-20 w-20 rounded-full bg-indigo-500/20 blur-xl"></div>
        <div className="flex items-center gap-2 text-indigo-300 font-semibold text-[11px] mb-1">
          <Sparkles className="h-3.5 w-3.5 text-indigo-400" /> Auto-Pipeline Active
        </div>
        <p className="text-[10px] text-slate-300 leading-relaxed">
          Admission → Student Account → Fee Invoice → Exam Profile created with 0 manual entries.
        </p>
      </div>
    </aside>
  );
};
