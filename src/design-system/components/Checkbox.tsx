import React, { forwardRef, useId } from 'react';
import { Check, Minus } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
  indeterminate?: boolean;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, description, indeterminate = false, checked, disabled, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;

    return (
      <label
        htmlFor={checkboxId}
        className={`inline-flex items-start gap-2.5 cursor-pointer select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            checked={checked}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <div className="h-4 w-4 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2 peer-checked:bg-indigo-600 peer-checked:border-indigo-600 dark:peer-checked:bg-indigo-500 dark:peer-checked:border-indigo-500 flex items-center justify-center">
            {indeterminate ? (
              <Minus className="h-3 w-3 text-white stroke-[3]" />
            ) : (
              <Check className="h-3 w-3 text-white stroke-[3] opacity-0 peer-checked:opacity-100 transition-opacity" />
            )}
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {label}
              </span>
            )}
            {description && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  description?: string;
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ label, description, checked, disabled, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const radioId = id || generatedId;

    return (
      <label
        htmlFor={radioId}
        className={`inline-flex items-start gap-2.5 cursor-pointer select-none ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${className}`}
      >
        <div className="relative flex items-center justify-center mt-0.5">
          <input
            ref={ref}
            type="radio"
            id={radioId}
            checked={checked}
            disabled={disabled}
            className="sr-only peer"
            {...props}
          />
          <div className="h-4 w-4 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 transition-colors duration-150 peer-focus-visible:ring-2 peer-focus-visible:ring-indigo-500 peer-focus-visible:ring-offset-2 peer-checked:border-indigo-600 dark:peer-checked:border-indigo-500 flex items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-500 scale-0 peer-checked:scale-100 transition-transform duration-150" />
          </div>
        </div>
        {(label || description) && (
          <div className="flex flex-col">
            {label && (
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                {label}
              </span>
            )}
            {description && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    );
  }
);

Radio.displayName = 'Radio';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className = '',
}) => {
  const generatedId = useId();
  const switchId = id || generatedId;

  return (
    <label
      htmlFor={switchId}
      className={`inline-flex items-center justify-between gap-3 cursor-pointer select-none ${
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
              {label}
            </span>
          )}
          {description && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              {description}
            </span>
          )}
        </div>
      )}
      <button
        type="button"
        role="switch"
        id={switchId}
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-ring ${
          checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
};
