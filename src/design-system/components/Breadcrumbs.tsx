import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ReactNode;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  homeAction?: () => void;
  className?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  items,
  homeAction,
  className = '',
}) => {
  return (
    <nav aria-label="Breadcrumb" className={`flex items-center text-xs text-slate-500 dark:text-slate-400 ${className}`}>
      <ol className="flex items-center gap-1.5 flex-wrap">
        {homeAction && (
          <li className="flex items-center">
            <button
              type="button"
              onClick={homeAction}
              aria-label="Home / Dashboard"
              className="p-1 rounded-md hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus-ring"
            >
              <Home className="h-3.5 w-3.5" />
            </button>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400 mx-1 shrink-0" aria-hidden="true" />
          </li>
        )}
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;

          return (
            <li key={idx} className="flex items-center">
              {item.onClick && !isLast ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors flex items-center gap-1 focus-ring rounded-md px-1"
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </button>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={`flex items-center gap-1 ${
                    isLast
                      ? 'font-semibold text-slate-900 dark:text-slate-100'
                      : 'hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {item.icon && <span className="shrink-0">{item.icon}</span>}
                  <span>{item.label}</span>
                </span>
              )}
              {!isLast && (
                <ChevronRight className="h-3.5 w-3.5 text-slate-400 mx-1 shrink-0" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
