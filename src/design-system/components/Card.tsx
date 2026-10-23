import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'subdued' | 'outline' | 'glass';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  interactive = false,
  className = '',
  ...props
}) => {
  const variantStyles = {
    default:
      'bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm shadow-slate-200/50 dark:shadow-none',
    subdued:
      'bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60',
    outline:
      'bg-transparent border border-slate-200 dark:border-slate-800',
    glass:
      'bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 shadow-sm',
  }[variant];

  const interactiveStyles = interactive
    ? 'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200 cursor-pointer'
    : '';

  return (
    <div
      className={`rounded-2xl overflow-hidden ${variantStyles} ${interactiveStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({
  title,
  subtitle,
  action,
  icon,
  className = '',
}) => {
  return (
    <div className={`p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-start justify-between gap-4 ${className}`}>
      <div className="flex items-start gap-3">
        {icon && (
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
};

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`p-4 sm:p-5 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`p-4 sm:p-5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export interface SectionContainerProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const SectionContainer: React.FC<SectionContainerProps> = ({
  title,
  description,
  action,
  children,
  className = '',
}) => {
  return (
    <section className={`space-y-4 ${className}`}>
      {(title || description || action) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60 dark:border-slate-800/60">
          <div>
            {title && (
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
                {title}
              </h2>
            )}
            {description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {description}
              </p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
};
