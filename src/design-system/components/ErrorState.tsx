import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Home } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onHome?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred while loading this view. Please try again.',
  onRetry,
  onHome,
  className = '',
}) => {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-rose-200 dark:border-rose-950/80 bg-rose-50/40 dark:bg-rose-950/20 ${className}`}
    >
      <div className="p-3.5 rounded-2xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 mb-3.5">
        <AlertOctagon className="h-8 w-8" />
      </div>
      <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 max-w-sm">
        {title}
      </h3>
      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mt-1 mb-5">
        {message}
      </p>
      <div className="flex items-center gap-2.5">
        {onHome && (
          <Button variant="outline" size="sm" leftIcon={<Home className="h-3.5 w-3.5" />} onClick={onHome}>
            Back to Dashboard
          </Button>
        )}
        {onRetry && (
          <Button variant="primary" size="sm" leftIcon={<RotateCcw className="h-3.5 w-3.5" />} onClick={onRetry}>
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
};

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackTitle?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled UI exception in ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6">
          <ErrorState
            title={this.props.fallbackTitle || 'A module error occurred'}
            message={this.state.error?.message || 'The application encountered an unexpected error.'}
            onRetry={this.handleReset}
          />
        </div>
      );
    }
    return this.props.children;
  }
}
