import React, { forwardRef, useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      helperText,
      error,
      options,
      placeholder,
      fullWidth = true,
      disabled,
      required,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const helperId = `${selectId}-helper`;
    const errorId = `${selectId}-error`;

    return (
      <div className={`${fullWidth ? 'w-full' : 'inline-block'}`}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
          >
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            required={required}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={`w-full text-sm rounded-xl border pl-3.5 pr-10 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-150 focus-ring appearance-none cursor-pointer disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:opacity-60 disabled:cursor-not-allowed ${
              error
                ? 'border-rose-400 dark:border-rose-500 focus:border-rose-500'
                : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-indigo-600'
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
            <ChevronDown className="h-4 w-4" />
          </div>
        </div>
        {error ? (
          <p id={errorId} role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';

export interface SearchableSelectProps {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  helperText,
  error,
  options,
  value,
  onChange,
  placeholder = 'Select option...',
  disabled = false,
  required = false,
  fullWidth = true,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((o) => o.value === value);

  const filteredOptions = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={containerRef} className={`relative ${fullWidth ? 'w-full' : 'inline-block'} ${className}`}>
      {label && (
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) {
            setIsOpen((prev) => !prev);
            setTimeout(() => inputRef.current?.focus(), 50);
          }
        }}
        className={`w-full text-left text-sm rounded-xl border pl-3.5 pr-10 py-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-150 focus-ring flex items-center justify-between cursor-pointer disabled:bg-slate-50 dark:disabled:bg-slate-800/50 disabled:opacity-60 disabled:cursor-not-allowed ${
          error
            ? 'border-rose-400 dark:border-rose-500'
            : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 focus:border-indigo-600'
        }`}
      >
        <span className={selectedOption ? 'font-medium' : 'text-slate-400 dark:text-slate-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden animate-fade-in">
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full text-xs bg-transparent text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <ul className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-2 text-xs text-slate-400 text-center">No options found</li>
            ) : (
              filteredOptions.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors ${
                      opt.value === value
                        ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {opt.value === value && <Check className="h-3.5 w-3.5" />}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}

      {error ? (
        <p role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};
