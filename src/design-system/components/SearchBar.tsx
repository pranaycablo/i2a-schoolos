import React, { useRef } from 'react';
import { Search, X } from 'lucide-react';

export interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmit?: () => void;
  shortcutHint?: string;
  className?: string;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search modules, students, records...',
  onClear,
  onSubmit,
  shortcutHint = '⌘K',
  className = '',
  autoFocus = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClear = () => {
    onChange('');
    onClear?.();
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit?.();
    } else if (e.key === 'Escape' && value) {
      handleClear();
    }
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
        <Search className="h-4 w-4" aria-hidden="true" />
      </div>
      <input
        ref={inputRef}
        type="search"
        autoFocus={autoFocus}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Search"
        className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 pl-9 pr-16 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus-ring focus:bg-white dark:focus:bg-slate-900 focus:border-indigo-600"
      />
      <div className="absolute right-2.5 flex items-center gap-1.5">
        {value ? (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors focus-ring"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : shortcutHint ? (
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-xs">
            {shortcutHint}
          </kbd>
        ) : null}
      </div>
    </div>
  );
};
