import React from 'react';
import { Compass, Home, ArrowLeft } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Button } from '../design-system/components/Button';

export interface NotFoundPageProps {
  onBack?: () => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ onBack }) => {
  const { setActiveModule } = useSchool();

  const handleHome = () => {
    setActiveModule('principal_dashboard');
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="p-4 rounded-3xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 mb-4 shadow-sm">
        <Compass className="h-12 w-12" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
        Error 404
      </span>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 max-w-md">
        Module or Page Not Found
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mt-2 mb-6">
        The requested screen does not exist or may have been migrated to a different module path in the current academic session.
      </p>
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="outline" size="md" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={onBack}>
            Previous Page
          </Button>
        )}
        <Button variant="primary" size="md" leftIcon={<Home className="h-4 w-4" />} onClick={handleHome}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
