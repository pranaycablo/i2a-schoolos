import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  ShieldCheck,
  LogOut,
  Sun,
  Moon,
  Languages,
  ChevronDown,
  Building,
  KeyRound,
  Check
} from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { UserRole } from '../../types';
import { Avatar } from '../../design-system/components/Avatar';
import { Badge } from '../../design-system/components/Badge';
import { clearAuth } from '../../services/apiClient';

export const ProfileSessionMenu: React.FC = () => {
  const {
    currentRole,
    setCurrentRole,
    branding,
    activeTenant,
    darkMode,
    setDarkMode,
    language,
    setLanguage,
    returnToPublicSaas,
    loginToSchool,
    setActiveModule,
    setViewMode
  } = useSchool();

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleLogout = () => {
    clearAuth();
    setIsOpen(false);
    returnToPublicSaas();
  };

  const handleRoleSwitch = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'SUPER_ADMIN') {
      setViewMode('PLATFORM_ADMIN');
    } else {
      setViewMode('SCHOOL_PORTAL');
      if (role === 'PARENT') {
        setActiveModule('parent_portal');
      } else if (role === 'STUDENT') {
        setActiveModule('student_portal');
      } else if (role === 'TRANSPORT') {
        setActiveModule('library_transport');
      } else if (role === 'ACCOUNTANT') {
        setActiveModule('fee_management');
      } else if (role === 'TEACHER') {
        setActiveModule('attendance_timetable');
      } else {
        setActiveModule('principal_dashboard');
      }
    }
    loginToSchool(activeTenant?.id || 'I2A-SCH-000001', role);
    setIsOpen(false);
  };

  const getRoleLabel = (role: UserRole) => {
    const map: Record<string, string> = {
      SUPER_ADMIN: 'Platform Admin',
      PRINCIPAL: 'Principal / Director',
      ADMIN: 'School Admin',
      TEACHER: 'Faculty / Teacher',
      ACCOUNTANT: 'Accountant',
      STAFF: 'Office Staff',
      TRANSPORT: 'Transport Fleet',
      PARENT: 'Parent / Guardian',
      STUDENT: 'Student'
    };
    return map[role] || role;
  };

  const userName = (currentRole === 'PRINCIPAL'
    ? (branding?.principalName || 'Principal')
    : currentRole === 'SUPER_ADMIN'
    ? 'Super Administrator'
    : `${getRoleLabel(currentRole)} User`) || 'User';

  const userEmail = currentRole === 'SUPER_ADMIN'
    ? 'superadmin@i2aschoolos.com'
    : branding.email || 'user@school.edu.in';

  const roleBadgeVariant = currentRole === 'SUPER_ADMIN'
    ? 'purple'
    : currentRole === 'PRINCIPAL'
    ? 'brand'
    : currentRole === 'ADMIN'
    ? 'cyan'
    : currentRole === 'TEACHER'
    ? 'success'
    : 'neutral';

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-ring cursor-pointer"
      >
        <Avatar name={userName} size="sm" status="online" />
        <span className="hidden md:inline-block text-xs font-semibold text-slate-800 dark:text-slate-200 max-w-[100px] truncate">
          {userName?.split(' ')[0] || 'User'}
        </span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-fade-in p-1.5 divide-y divide-slate-100 dark:divide-slate-800"
        >
          {/* User Profile Card */}
          <div className="p-3">
            <div className="flex items-start gap-3">
              <Avatar name={userName} size="md" status="online" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {userName}
                  </h4>
                  <Badge variant={roleBadgeVariant as any} size="sm">
                    {currentRole}
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{userEmail}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
                  <Building className="h-3 w-3 shrink-0" />
                  <span className="truncate">{activeTenant?.name || 'SchoolOS'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Preferences */}
          <div className="py-1.5 px-1 space-y-1">
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-500" />}
                <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
              </div>
              <span className="text-[10px] text-slate-400">{darkMode ? 'Dark' : 'Light'}</span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-indigo-500" />
                <span>Language / भाषा</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                {language === 'en' ? 'English' : 'हिंदी'}
              </span>
            </button>
          </div>

          {/* Role Switching for Demo & Administrative Testing — Dev Only */}
          {import.meta.env.DEV && (
            <div className="py-1.5 px-1 border-t border-slate-100 dark:border-slate-800">
              <span className="px-2.5 py-1 text-[10px] font-bold tracking-wider text-amber-500 dark:text-amber-400 uppercase block">
                Switch Persona (DEV ONLY)
              </span>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {(['PRINCIPAL', 'ADMIN', 'TEACHER', 'ACCOUNTANT', 'STUDENT', 'PARENT'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleSwitch(r)}
                    className={`px-2 py-1 rounded-md text-[11px] text-left flex items-center justify-between transition-colors ${
                      currentRole === r
                        ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{getRoleLabel(r).split(' ')[0]}</span>
                    {currentRole === r && <Check className="h-3 w-3" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Secure Logout */}
          <div className="p-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out & Revoke Session</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
