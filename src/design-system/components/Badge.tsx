import React from 'react';

export type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'purple' | 'cyan';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  neutral:
    'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  brand:
    'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
  success:
    'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
  warning:
    'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
  danger:
    'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900',
  purple:
    'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900',
  cyan:
    'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900',
};

const dotColors: Record<BadgeVariant, string> = {
  neutral: 'bg-slate-400',
  brand: 'bg-indigo-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  purple: 'bg-purple-500',
  cyan: 'bg-cyan-500',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className = '',
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full border ${variantStyles[variant]} ${sizeClass} ${className}`}
      {...props}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away' | 'pending';
  label?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  className = '',
}) => {
  const config = {
    online: { dot: 'bg-emerald-500', ping: 'bg-emerald-400', defaultLabel: 'Online / Active' },
    offline: { dot: 'bg-slate-400', ping: null, defaultLabel: 'Offline' },
    busy: { dot: 'bg-rose-500', ping: 'bg-rose-400', defaultLabel: 'Busy / Locked' },
    away: { dot: 'bg-amber-500', ping: null, defaultLabel: 'Idle / Away' },
    pending: { dot: 'bg-indigo-500', ping: 'bg-indigo-400', defaultLabel: 'Processing' },
  }[status];

  return (
    <span className={`inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 ${className}`}>
      <span className="relative flex h-2 w-2">
        {config.ping && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.ping} opacity-75`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dot}`} />
      </span>
      {label ?? config.defaultLabel}
    </span>
  );
};
