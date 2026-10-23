import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm shadow-indigo-500/20 disabled:bg-indigo-400 disabled:shadow-none',
  secondary:
    'bg-cyan-600 hover:bg-cyan-700 active:bg-cyan-800 text-white shadow-sm shadow-cyan-500/20 disabled:bg-cyan-400 disabled:shadow-none',
  outline:
    'border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 active:bg-slate-100 disabled:opacity-50',
  ghost:
    'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 active:bg-slate-200 disabled:opacity-50',
  danger:
    'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-sm shadow-rose-500/20 disabled:bg-rose-400 disabled:shadow-none',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1.5 text-xs rounded-lg gap-1.5 min-h-[32px]',
  md: 'px-3.5 py-2 text-sm rounded-xl gap-2 min-h-[40px]',
  lg: 'px-5 py-2.5 text-base rounded-xl gap-2.5 min-h-[48px]',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 focus-ring select-none cursor-pointer disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
      ) : (
        leftIcon && <span className="shrink-0" aria-hidden="true">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && (
        <span className="shrink-0" aria-hidden="true">{rightIcon}</span>
      )}
    </button>
  );
};

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  'aria-label': string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const iconSizeStyles: Record<ButtonSize, string> = {
  sm: 'p-1.5 rounded-lg min-h-[32px] min-w-[32px]',
  md: 'p-2 rounded-xl min-h-[40px] min-w-[40px]',
  lg: 'p-2.5 rounded-xl min-h-[48px] min-w-[48px]',
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  'aria-label': ariaLabel,
  variant = 'ghost',
  size = 'md',
  isLoading = false,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      aria-label={ariaLabel}
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center transition-all duration-150 focus-ring cursor-pointer disabled:cursor-not-allowed ${variantStyles[variant]} ${iconSizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        icon
      )}
    </button>
  );
};
