import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'brand' | 'neutral' | 'white';
  label?: string;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'brand',
  label = 'Loading...',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  }[size];

  const variantClasses = {
    brand: 'text-indigo-600 dark:text-indigo-400',
    neutral: 'text-slate-400 dark:text-slate-500',
    white: 'text-white',
  }[variant];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`inline-flex items-center gap-2 ${className}`}
    >
      <Loader2 className={`animate-spin ${sizeClasses} ${variantClasses}`} />
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
};

export interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'text',
  width,
  height,
  className = '',
}) => {
  const variantClasses = {
    text: 'rounded-md h-3.5 my-1',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  }[variant];

  return (
    <div
      aria-hidden="true"
      style={{ width, height }}
      className={`animate-pulse bg-slate-200 dark:bg-slate-800 ${variantClasses} ${className}`}
    />
  );
};
