import React, { useState, useRef, useEffect } from 'react';

export interface DropdownItemProps {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
  className?: string;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({
  label,
  icon,
  onClick,
  danger = false,
  disabled = false,
  className = '',
}) => {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onClick}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left rounded-lg transition-colors cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed ${
        danger
          ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
      } ${className}`}
    >
      {icon && <span className="h-4 w-4 shrink-0 text-slate-400">{icon}</span>}
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
};

export const DropdownDivider: React.FC = () => {
  return <div role="separator" className="my-1 border-t border-slate-100 dark:border-slate-800" />;
};

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export const DropdownMenu: React.FC<DropdownMenuProps> = ({
  trigger,
  children,
  align = 'left',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      <div onClick={() => setIsOpen((prev) => !prev)} className="cursor-pointer">
        {trigger}
      </div>

      {isOpen && (
        <div
          role="menu"
          onClick={() => setIsOpen(false)}
          className={`absolute z-50 mt-1.5 min-w-[12rem] p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xl overflow-hidden animate-fade-in ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${className}`}
        >
          {children}
        </div>
      )}
    </div>
  );
};
