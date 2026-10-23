import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Breadcrumbs, BreadcrumbItem } from './Breadcrumbs';

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  badge?: React.ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  onBack?: () => void;
  homeAction?: () => void;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  badge,
  breadcrumbs,
  actions,
  onBack,
  homeAction,
  className = '',
}) => {
  return (
    <div className={`space-y-2.5 pb-4 mb-4 border-b border-slate-200/80 dark:border-slate-800 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} homeAction={homeAction} />
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Go back"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors focus-ring shrink-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {title}
              </h1>
              {badge && <div>{badge}</div>}
            </div>
            {subtitle && (
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
      </div>
    </div>
  );
};
