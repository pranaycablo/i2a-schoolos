import React, { useId } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  hint?: string;
  error?: string;
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  required = false,
  hint,
  error,
  id,
  children,
  className = '',
}) => {
  const generatedId = useId();
  const fieldId = id || generatedId;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : hint ? (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{hint}</p>
      ) : null}
    </div>
  );
};

export interface ValidationMessageProps {
  type?: 'error' | 'warning' | 'success' | 'info';
  message: string;
  className?: string;
}

export const ValidationMessage: React.FC<ValidationMessageProps> = ({
  type = 'error',
  message,
  className = '',
}) => {
  const config = {
    error: {
      icon: AlertCircle,
      containerClass: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300',
    },
    warning: {
      icon: AlertTriangle,
      containerClass: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-300',
    },
    success: {
      icon: CheckCircle2,
      containerClass: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-700 dark:text-emerald-300',
    },
    info: {
      icon: Info,
      containerClass: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300',
    },
  }[type];

  const Icon = config.icon;

  return (
    <div
      role={type === 'error' ? 'alert' : 'status'}
      className={`flex items-start gap-2 p-2.5 rounded-xl border text-xs font-medium ${config.containerClass} ${className}`}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5" />
      <span>{message}</span>
    </div>
  );
};
