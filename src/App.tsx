import React from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { PublicSaasLandingPage } from './components/public/PublicSaasLandingPage';
import { PlatformAdminModule } from './components/modules/PlatformAdminModule';
import { GlobalNotificationToast } from './components/layout/NotificationToast';
import { AppShell } from './components/shell/AppShell';
import { LoginPage } from './pages/LoginPage';

const AppRouter: React.FC = () => {
  const { viewMode, setViewMode, currentRole } = useSchool();

  if (viewMode === 'PUBLIC_SAAS') {
    return <PublicSaasLandingPage />;
  }

  if (viewMode === 'LOGIN') {
    return (
      <LoginPage
        onCancel={() => setViewMode('PUBLIC_SAAS')}
        onSuccess={() => {
          if (currentRole === 'SUPER_ADMIN') {
            setViewMode('PLATFORM_ADMIN');
          } else {
            setViewMode('SCHOOL_PORTAL');
          }
        }}
      />
    );
  }

  if (viewMode === 'PLATFORM_ADMIN') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <PlatformAdminModule />
      </div>
    );
  }

  return <AppShell />;
};

export function App() {
  return (
    <SchoolProvider>
      <AppRouter />
      <GlobalNotificationToast />
    </SchoolProvider>
  );
}

export default App;
