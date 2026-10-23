import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  containerClassName?: string;
}

export const Table: React.FC<TableProps> = ({ children, className = '', containerClassName = '', ...props }) => {
  return (
    <div className={`responsive-table-container rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm ${containerClassName}`}>
      <table className={`w-full text-left text-xs sm:text-sm border-collapse ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <thead
      className={`bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200/80 dark:border-slate-800 ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
};

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <tbody className={`divide-y divide-slate-100 dark:divide-slate-800/60 ${className}`} {...props}>
      {children}
    </tbody>
  );
};

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  interactive?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  interactive = false,
  className = '',
  ...props
}) => {
  const interactiveClass = interactive
    ? 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40 cursor-pointer transition-colors duration-150'
    : '';

  return (
    <tr className={`${interactiveClass} ${className}`} {...props}>
      {children}
    </tr>
  );
};

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <th className={`px-4 py-3 text-xs font-semibold tracking-wider ${className}`} {...props}>
      {children}
    </th>
  );
};

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <td className={`px-4 py-3 text-slate-700 dark:text-slate-300 ${className}`} {...props}>
      {children}
    </td>
  );
};

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  onPageSizeChange,
  pageSizeOptions = [10, 25, 50, 100],
  className = '',
}) => {
  const canPrev = currentPage > 1;
  const canNext = currentPage < totalPages;

  return (
    <div
      className={`p-3.5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 ${className}`}
    >
      <div className="flex items-center gap-2">
        {totalItems !== undefined && (
          <span>
            Total: <strong className="text-slate-800 dark:text-slate-200">{totalItems}</strong> items
          </span>
        )}
        {pageSize && onPageSizeChange && (
          <div className="flex items-center gap-1.5 ml-2">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Items per page"
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 focus-ring"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <span className="mr-2">
          Page <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> of{' '}
          <strong className="text-slate-800 dark:text-slate-200">{Math.max(1, totalPages)}</strong>
        </span>

        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(1)}
          aria-label="First page"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Previous page"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Next page"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(totalPages)}
          aria-label="Last page"
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed focus-ring"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
