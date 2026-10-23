import React from 'react';
import { ShieldAlert, Home, Lock } from 'lucide-react';
import { useSchool } from '../context/SchoolContext';
import { Button } from '../design-system/components/Button';
import { Badge } from '../design-system/components/Badge';

export interface AccessDeniedPageProps {
  requiredPermission?: string;
  onBack?: () => void;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  requiredPermission = 'INSUFFICIENT_ROLE_PERMISSIONS',
  onBack,
}) => {
  const { currentRole, setActiveModule } = useSchool();

  const handleHome = () => {
    setActiveModule('principal_dashboard');
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 mb-4 shadow-sm">
        <ShieldAlert className="h-12 w-12" />
      </div>
      <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 mb-1">
        Access Denied (HTTP 403)
      </span>
      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 max-w-md">
        Restricted Institutional Resource
      </h1>
      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mt-2 mb-4">
        Your current session role does not have authorization to view or mutate this module according to the i2A SchoolOS Role Permission Matrix.
      </p>

      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-slate-400">Current Role:</span>
        <Badge variant="purple" size="sm">
          {currentRole}
        </Badge>
        <span className="text-xs text-slate-400 ml-2">Required:</span>
        <Badge variant="danger" size="sm">
          {requiredPermission}
        </Badge>
      </div>

      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="outline" size="md" onClick={onBack}>
            Go Back
          </Button>
        )}
        <Button variant="primary" size="md" leftIcon={<Home className="h-4 w-4" />} onClick={handleHome}>
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
};
