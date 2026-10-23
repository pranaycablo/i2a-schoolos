import React, { useState } from 'react';
import { X, Bell, CheckCheck, Trash2, Mail, ShieldAlert, Award, Calendar, CheckCircle2 } from 'lucide-react';
import { useSchool } from '../../context/SchoolContext';
import { Badge } from '../../design-system/components/Badge';
import { Button } from '../../design-system/components/Button';
import type { DispatchedEmailPayload } from '../../types';
import { EmailPreviewModal } from '../layout/NotificationToast';

export interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationAsRead, clearAllNotifications, language, currentRole } = useSchool();
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'CREDENTIALS'>('ALL');
  const [activeEmailModal, setActiveEmailModal] = useState<DispatchedEmailPayload | null>(null);

  if (!isOpen) return null;

  const canViewCredentials = ['PRINCIPAL', 'SUPER_ADMIN', 'ADMIN'].includes(currentRole);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'UNREAD') return !n.read;
    if (filter === 'CREDENTIALS') return n.type.includes('CREDENTIALS');
    return true;
  });

  const getIcon = (type: string) => {
    if (type.includes('CREDENTIALS')) return <Mail className="h-4 w-4 text-indigo-500" />;
    if (type.includes('SECURITY')) return <ShieldAlert className="h-4 w-4 text-rose-500" />;
    if (type.includes('EXAM')) return <Award className="h-4 w-4 text-purple-500" />;
    if (type.includes('ATTENDANCE')) return <Calendar className="h-4 w-4 text-amber-500" />;
    return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
  };

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Notifications panel">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <div className="w-screen max-w-md bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col animate-fade-in">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                  <Bell className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                    Notifications
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {unreadCount} unread alert{unreadCount !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => notifications.forEach((n) => markNotificationAsRead(n.id))}
                    title="Mark all as read"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-ring"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllNotifications}
                    title="Clear all notifications"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-ring"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close notifications panel"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-ring ml-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1 text-xs">
              {(['ALL', 'UNREAD', 'CREDENTIALS'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                    filter === tab
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-semibold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab === 'ALL' ? 'All' : tab === 'UNREAD' ? `Unread (${unreadCount})` : 'Credentials'}
                </button>
              ))}
            </div>

            {/* Notification List */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
              {filteredNotifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center">
                  <Bell className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                  <p className="font-semibold text-slate-600 dark:text-slate-400">No notifications</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">You are all caught up!</p>
                </div>
              ) : (
                filteredNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl transition-colors ${
                      !n.read ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                            {n.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 shrink-0">{n.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                          {n.message}
                        </p>
                        {n.emailPayload && canViewCredentials && (
                          <button
                            type="button"
                            onClick={() => setActiveEmailModal(n.emailPayload || null)}
                            className="mt-2 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                          >
                            <Mail className="h-3 w-3" />
                            View Credentials Dispatch Record
                          </button>
                        )}
                        {!n.read && (
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              onClick={() => markNotificationAsRead(n.id)}
                              className="text-[10px] text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                              Mark as read
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {activeEmailModal && (
        <EmailPreviewModal
          payload={activeEmailModal}
          language={language}
          onClose={() => setActiveEmailModal(null)}
        />
      )}
    </>
  );
};
