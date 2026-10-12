import React from 'react';
import { SchoolProvider, useSchool } from './context/SchoolContext';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { PublicSaasLandingPage } from './components/public/PublicSaasLandingPage';
import { PlatformAdminModule } from './components/modules/PlatformAdminModule';

// Modules
import { SchoolSetupModule } from './components/modules/SchoolSetupModule';
import { StudentManagementModule } from './components/modules/StudentManagementModule';
import { AdmissionWorkflowModule } from './components/modules/AdmissionWorkflowModule';
import { FeeManagementModule } from './components/modules/FeeManagementModule';
import { DigitalBooksAIQuestionBankModule } from './components/modules/DigitalBooksAIQuestionBankModule';
import { HomeworkDigitalLearningModule } from './components/modules/HomeworkDigitalLearningModule';
import { ExaminationModule } from './components/modules/ExaminationModule';
import { ExaminationResultModule } from './components/modules/ExaminationResultModule';
import { ReportCardCertificateModule } from './components/modules/ReportCardCertificateModule';
import { AttendanceLeaveModule } from './components/modules/AttendanceLeaveModule';
import { TimetableModule } from './components/modules/TimetableModule';
import { PayrollExpenseModule } from './components/modules/PayrollExpenseModule';
import { LibraryTransportInventoryModule } from './components/modules/LibraryTransportInventoryModule';
import { WebsiteBuilderModule } from './components/modules/WebsiteBuilderModule';
import { PrincipalAIDashboardModule } from './components/modules/PrincipalAIDashboardModule';
import { AuditTrailModule } from './components/modules/AuditTrailModule';
import { SchoolMarketplaceModule } from './components/modules/SchoolMarketplaceModule';
import { SubscriptionBillingModule } from './components/modules/SubscriptionBillingModule';
import { StaffWorkforceModule } from './components/modules/StaffWorkforceModule';

const MainContent: React.FC = () => {
  const { activeModule } = useSchool();

  const renderModule = () => {
    switch (activeModule) {
      case 'principal_dashboard':
      case 'principal_ai_assistant':
        return <PrincipalAIDashboardModule />;
      case 'school_setup':
        return <SchoolSetupModule />;
      case 'student_management':
        return <StudentManagementModule />;
      case 'admission_workflow':
        return <AdmissionWorkflowModule />;
      case 'fee_management':
        return <FeeManagementModule />;
      case 'digital_books_ai':
        return <DigitalBooksAIQuestionBankModule />;
      case 'homework_learning':
        return <HomeworkDigitalLearningModule />;
      case 'examination_ai':
        return <ExaminationModule />;
      case 'examination_result_engine':
        return <ExaminationResultModule />;
      case 'report_card_certs':
        return <ReportCardCertificateModule />;
      case 'attendance_timetable':
        return <AttendanceLeaveModule />;
      case 'timetable_engine':
        return <TimetableModule />;
      case 'payroll_expenses':
        return <PayrollExpenseModule />;
      case 'staff_workforce':
        return <StaffWorkforceModule />;
      case 'library_transport':
        return <LibraryTransportInventoryModule />;
      case 'school_marketplace':
        return <SchoolMarketplaceModule />;
      case 'subscription_billing':
        return <SubscriptionBillingModule />;
      case 'website_builder':
        return <WebsiteBuilderModule />;
      case 'audit_trail':
        return <AuditTrailModule />;
      default:
        return <PrincipalAIDashboardModule />;
    }
  };

  return (
    <div className="flex-1 p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
      {renderModule()}
    </div>
  );
};

const AppRouter: React.FC = () => {
  const { viewMode } = useSchool();

  if (viewMode === 'PUBLIC_SAAS') {
    return <PublicSaasLandingPage />;
  }

  if (viewMode === 'PLATFORM_ADMIN') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        <PlatformAdminModule />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
    </div>
  );
};

export function App() {
  return (
    <SchoolProvider>
      <AppRouter />
    </SchoolProvider>
  );
}

export default App;
