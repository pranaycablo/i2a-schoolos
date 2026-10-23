import React from 'react';
import {
  LayoutDashboard,
  Bot,
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
  ShoppingBag,
  Globe,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Palette,
  Network,
  X
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { UserRole } from '../../types';

export interface ShellSidebarProps {
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: number | null;
  isAI?: boolean;
  isNew?: boolean;
  category: 'CORE' | 'ACADEMIC' | 'OPERATIONS' | 'FINANCE' | 'SYSTEM';
}

export const ShellSidebar: React.FC<ShellSidebarProps> = ({
  isMobileOpen,
  onCloseMobile,
  isCollapsed,
  onToggleCollapse,
}) => {
  const { activeModule, setActiveModule, currentRole, admissions, examPapers, t } = useSchool();

  const pendingAdm = admissions.filter(
    (a) => a.status === 'INTERVIEW_SCHEDULED' || a.status === 'SUBMITTED'
  ).length;
  const pendingExams = examPapers.filter(
    (e) => e.status === 'AI_DRAFT' || e.status === 'TEACHER_REVIEW'
  ).length;

  const navItems: NavItem[] = [
    // 1. CORE
    { id: 'principal_dashboard', label: t('principal_dashboard') || 'Leadership Dashboard', icon: LayoutDashboard, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'], category: 'CORE' },
    { id: 'parent_portal', label: 'Parent Portal', icon: Users, roles: ['PARENT'], category: 'CORE' },
    { id: 'student_portal', label: 'Student Portal', icon: Award, roles: ['STUDENT'], category: 'CORE' },
    { id: 'institutional_hierarchy', label: 'Hierarchy & Branches', icon: Network, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'], isNew: true, category: 'CORE' },
    { id: 'principal_ai_assistant', label: t('principal_ai_assistant') || 'AI Assistant', icon: Bot, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'], isAI: true, category: 'CORE' },
    { id: 'school_setup', label: t('school_setup') || 'School Setup', icon: Building2, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'], category: 'CORE' },
    { id: 'design_system', label: 'Design System', icon: Palette, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN', 'TEACHER'], isNew: true, category: 'CORE' },

    // 2. ACADEMIC
    { id: 'student_management', label: t('student_management') || 'Student SIS', icon: Users, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'STAFF', 'SUPER_ADMIN'], category: 'ACADEMIC' },
    { id: 'admission_workflow', label: t('admission_workflow') || 'Admissions', icon: UserPlus, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'STAFF', 'SUPER_ADMIN'], badge: pendingAdm, category: 'ACADEMIC' },
    { id: 'digital_books_ai', label: t('digital_books_ai') || 'Digital Library', icon: BookOpen, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'SUPER_ADMIN'], category: 'ACADEMIC' },
    { id: 'homework_learning', label: t('homework_learning') || 'Homework & LMS', icon: BookOpen, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'], category: 'ACADEMIC' },
    { id: 'examination_ai', label: t('examination_ai') || 'Examinations AI', icon: FileQuestion, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'], badge: pendingExams, category: 'ACADEMIC' },
    { id: 'examination_result_engine', label: t('examination_result_engine') || 'Result Engine', icon: Award, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'], category: 'ACADEMIC' },
    { id: 'report_card_certs', label: t('report_card_certs') || 'Report Cards', icon: Award, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STAFF', 'PARENT', 'STUDENT', 'SUPER_ADMIN'], category: 'ACADEMIC' },

    // 3. OPERATIONS
    { id: 'attendance_timetable', label: t('attendance_timetable') || 'Attendance & Leave', icon: CalendarCheck, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STAFF', 'TRANSPORT', 'STUDENT', 'PARENT', 'SUPER_ADMIN'], category: 'OPERATIONS' },
    { id: 'timetable_engine', label: t('timetable_engine') || 'Timetable Scheduler', icon: CalendarCheck, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'], category: 'OPERATIONS' },
    { id: 'library_transport', label: t('library_transport') || 'Fleet & Transport', icon: Bus, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'STAFF', 'TRANSPORT', 'TEACHER', 'STUDENT', 'PARENT', 'SUPER_ADMIN'], category: 'OPERATIONS' },

    // 4. FINANCE & COMMERCE
    { id: 'fee_management', label: t('fee_management') || 'Fee Management', icon: CreditCard, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'STAFF', 'SUPER_ADMIN'], category: 'FINANCE' },
    { id: 'payroll_expenses', label: t('payroll_expenses') || 'Payroll & Expenses', icon: BadgePercent, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN'], category: 'FINANCE' },
    { id: 'school_marketplace', label: t('school_marketplace') || 'Marketplace Store', icon: ShoppingBag, roles: ['PRINCIPAL', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'STAFF', 'TRANSPORT', 'STUDENT', 'PARENT', 'SUPER_ADMIN'], category: 'FINANCE' },
    { id: 'subscription_billing', label: t('subscription_billing') || 'SaaS Subscription', icon: CreditCard, roles: ['PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'SUPER_ADMIN'], category: 'FINANCE' },

    // 5. SYSTEM
    { id: 'staff_workforce', label: t('staff_workforce') || 'Staff Workforce', icon: Users, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'], category: 'SYSTEM' },
    { id: 'website_builder', label: t('website_builder') || 'Website Builder', icon: Globe, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'], category: 'SYSTEM' },
    { id: 'audit_trail', label: t('audit_trail') || 'Audit Trail', icon: ShieldAlert, roles: ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'], category: 'SYSTEM' }
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(currentRole));

  const categories: { key: NavItem['category']; label: string }[] = [
    { key: 'CORE', label: 'Overview' },
    { key: 'ACADEMIC', label: 'Academic & SIS' },
    { key: 'OPERATIONS', label: 'Operations & Fleet' },
    { key: 'FINANCE', label: 'Finance & Store' },
    { key: 'SYSTEM', label: 'Administration' },
  ];

  const renderNavContent = () => {
    return (
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {categories.map((cat) => {
          const items = visibleItems.filter((i) => i.category === cat.key);
          if (items.length === 0) return null;

          return (
            <div key={cat.key} className="space-y-1">
              {!isCollapsed && (
                <div className="px-3 py-1 text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase">
                  {cat.label}
                </div>
              )}
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeModule === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveModule(item.id);
                      onCloseMobile();
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center ${
                      isCollapsed ? 'justify-center px-2' : 'justify-between px-3'
                    } py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer focus-ring select-none ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/25 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon
                        className={`h-4 w-4 shrink-0 ${
                          isActive
                            ? 'text-white'
                            : item.isAI
                            ? 'text-purple-500'
                            : item.isNew
                            ? 'text-emerald-500'
                            : 'text-slate-400 dark:text-slate-500'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && (
                      <div className="flex items-center gap-1 shrink-0">
                        {item.isAI && (
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                          </span>
                        )}
                        {item.isNew && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                            NEW
                          </span>
                        )}
                        {item.badge !== null && item.badge !== undefined && item.badge > 0 && (
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col justify-between shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 transition-all duration-300 select-none ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {renderNavContent()}

        {/* Collapse Toggle Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          {!isCollapsed && (
            <span className="text-[11px] text-slate-400 font-medium">v1.2 Enterprise</span>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-ring cursor-pointer ml-auto"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Mobile Drawer (Slide-in) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-xs bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col z-10 animate-fade-in">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                i2A SchoolOS
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close menu"
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus-ring"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
};
