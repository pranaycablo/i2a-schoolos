import React, { useState } from 'react';

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'offline' | 'busy' | 'away';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7 w-7 text-[11px]',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-14 w-14 text-base',
};

const statusDotSizes = {
  sm: 'h-2 w-2 right-0 bottom-0',
  md: 'h-2.5 w-2.5 right-0 bottom-0',
  lg: 'h-3 w-3 right-0.5 bottom-0.5',
  xl: 'h-3.5 w-3.5 right-0.5 bottom-0.5',
};

const statusColors = {
  online: 'bg-emerald-500',
  offline: 'bg-slate-400',
  busy: 'bg-rose-500',
  away: 'bg-amber-500',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  status,
  className = '',
}) => {
  const [imageError, setImageError] = useState(false);

  const getInitials = (n: string) => {
    const parts = n.trim().split(/\s+/);
    if (parts.length === 0 || !parts[0]) return 'U';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className={`relative inline-flex shrink-0 ${className}`}>
      <div
        className={`rounded-full flex items-center justify-center font-bold select-none overflow-hidden border border-slate-200/80 dark:border-slate-800 ${
          sizeClasses[size]
        } ${
          src && !imageError
            ? 'bg-transparent'
            : 'bg-gradient-to-tr from-indigo-600 to-indigo-400 text-white shadow-sm'
        }`}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={name}
            onError={() => setImageError(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          <span>{getInitials(name)}</span>
        )}
      </div>
      {status && (
        <span
          className={`absolute rounded-full border-2 border-white dark:border-slate-900 ${
            statusColors[status]
          } ${statusDotSizes[size]}`}
          aria-label={`Status: ${status}`}
        />
      )}
    </div>
  );
};
