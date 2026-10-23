import React, { useState } from 'react';
import { Menu, Bell, School, ShieldCheck, Sparkles, Wifi, WifiOff } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { MultiTenantSelector } from './MultiTenantSelector';
import { ProfileSessionMenu } from './ProfileSessionMenu';
import { NotificationDrawer } from './NotificationDrawer';
import { SearchBar } from '../../design-system/components/SearchBar';
import { Tooltip } from '../../design-system/components/Tooltip';

export interface ShellHeaderProps {
  onToggleMobileSidebar: () => void;
}

export const ShellHeader: React.FC<ShellHeaderProps> = ({ onToggleMobileSidebar }) => {
  const { branding, notifications, isBackendConnected, isSyncing, setActiveModule } = useSchool();
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (q.includes('student') || q.includes('admission')) {
      setActiveModule('student_management');
    } else if (q.includes('fee') || q.includes('payment') || q.includes('receipt')) {
      setActiveModule('fee_management');
    } else if (q.includes('exam') || q.includes('test') || q.includes('marks')) {
      setActiveModule('examination_ai');
    } else if (q.includes('attend') || q.includes('leave')) {
      setActiveModule('attendance_timetable');
    } else if (q.includes('timetable') || q.includes('schedule')) {
      setActiveModule('timetable_engine');
    } else if (q.includes('setup') || q.includes('brand')) {
      setActiveModule('school_setup');
    } else {
      setActiveModule('principal_dashboard');
    }
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 transition-colors">
      {/* Left: Mobile Toggle + Logo + MultiTenantSelector */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
          className="md:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-ring"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt={branding.name}
              className="h-8 w-8 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
            />
          ) : (
            <div className="h-8 w-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs">
              <School className="h-4 w-4" />
            </div>
          )}
          <span className="hidden lg:inline-block font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight">
            i2A SchoolOS
          </span>
        </div>

        <div className="hidden sm:block ml-2 border-l border-slate-200 dark:border-slate-800 pl-3">
          <MultiTenantSelector />
        </div>
      </div>

      {/* Center: Search Bar */}
      <div className="flex-1 max-w-md hidden md:block">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSubmit={handleSearchSubmit}
          placeholder="Search modules, students, fee types... (Enter)"
        />
      </div>

      {/* Right: Backend status, Notifications, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Backend Connection Indicator */}
        <Tooltip
          content={
            isBackendConnected
              ? `Connected to Synthetic DB • ${isSyncing ? 'Syncing...' : 'Realtime Sync Active'}`
              : 'Backend Offline — Local Storage Fallback'
          }
        >
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
              isBackendConnected
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
            }`}
          >
            {isBackendConnected ? (
              <Wifi className={`h-3 w-3 ${isSyncing ? 'animate-pulse text-indigo-500' : ''}`} />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span>{isBackendConnected ? (isSyncing ? 'Syncing' : 'Connected') : 'Offline'}</span>
          </div>
        </Tooltip>

        {/* Notifications Bell */}
        <button
          type="button"
          onClick={() => setShowNotifications(true)}
          aria-label={`Notifications: ${unreadCount} unread`}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-ring cursor-pointer"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile & Session Menu */}
        <div className="border-l border-slate-200 dark:border-slate-800 pl-2 sm:pl-3">
          <ProfileSessionMenu />
        </div>
      </div>

      {/* Slide-Over Notification Drawer */}
      <NotificationDrawer
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </header>
  );
};
