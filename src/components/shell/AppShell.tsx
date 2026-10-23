import React, { useState } from 'react';
import { useSchool } from '../../context/SchoolContext';
import { ShellHeader } from './ShellHeader';
import { ShellSidebar } from './ShellSidebar';
import { ToastProvider } from '../../design-system/components/Toast';
import { ErrorBoundary } from '../../design-system/components/ErrorState';

// Modules
import { PrincipalAIDashboardModule } from '../modules/PrincipalAIDashboardModule';
import { SchoolSetupModule } from '../modules/SchoolSetupModule';
import { StudentManagementModule } from '../modules/StudentManagementModule';
import { AdmissionWorkflowModule } from '../modules/AdmissionWorkflowModule';
import { FeeManagementModule } from '../modules/FeeManagementModule';
import { DigitalBooksAIQuestionBankModule } from '../modules/DigitalBooksAIQuestionBankModule';
import { HomeworkDigitalLearningModule } from '../modules/HomeworkDigitalLearningModule';
import { ExaminationModule } from '../modules/ExaminationModule';
import { ExaminationResultModule } from '../modules/ExaminationResultModule';
import { ReportCardCertificateModule } from '../modules/ReportCardCertificateModule';
import { AttendanceLeaveModule } from '../modules/AttendanceLeaveModule';
import { TimetableModule } from '../modules/TimetableModule';
import { PayrollExpenseModule } from '../modules/PayrollExpenseModule';
import { StaffWorkforceModule } from '../modules/StaffWorkforceModule';
import { LibraryTransportInventoryModule } from '../modules/LibraryTransportInventoryModule';
import { SchoolMarketplaceModule } from '../modules/SchoolMarketplaceModule';
import { SubscriptionBillingModule } from '../modules/SubscriptionBillingModule';
import { WebsiteBuilderModule } from '../modules/WebsiteBuilderModule';
import { AuditTrailModule } from '../modules/AuditTrailModule';
import { InstitutionalHierarchyModule } from '../modules/InstitutionalHierarchyModule';
import { ParentPortalModule } from '../modules/ParentPortalModule';
import { StudentPortalModule } from '../modules/StudentPortalModule';
import { DesignSystemShowcase } from '../../pages/DesignSystemShowcase';
import { NotFoundPage } from '../../pages/NotFoundPage';
import { ShieldAlert } from 'lucide-react';
import { UserRole } from '../../types';

export const AppShell: React.FC = () => {
  const { activeModule, currentRole, setActiveModule } = useSchool();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Authoritative route guard based on authenticated role
  const isModuleAuthorized = (module: string, role: UserRole): boolean => {
    const adminRoles: UserRole[] = ['PRINCIPAL', 'ADMIN', 'SUPER_ADMIN'];

    // Principal / Admin leadership modules
    if ([
      'principal_dashboard',
      'principal_ai_assistant',
      'school_setup',
      'institutional_hierarchy',
      'audit_trail',
      'subscription_billing',
      'payroll_expenses',
      'staff_workforce',
      'website_builder'
    ].includes(module)) {
      return adminRoles.includes(role);
    }

    // Cashier / Financial Collection counter
    if (module === 'fee_management') {
      return [...adminRoles, 'ACCOUNTANT', 'STAFF'].includes(role);
    }

    // Dedicated family and student portals
    if (module === 'parent_portal') {
      return role === 'PARENT' || adminRoles.includes(role);
    }
    if (module === 'student_portal') {
      return role === 'STUDENT' || adminRoles.includes(role);
    }

    // Student SIS & Admissions
    if (module === 'student_management' || module === 'admission_workflow') {
      return [...adminRoles, 'TEACHER', 'ACCOUNTANT', 'STAFF'].includes(role);
    }

    return true;
  };

  const renderModuleContent = () => {
    // Enforce route guard
    if (!isModuleAuthorized(activeModule, currentRole)) {
      const fallbackModule =
        currentRole === 'PARENT'
          ? 'parent_portal'
          : currentRole === 'STUDENT'
          ? 'student_portal'
          : currentRole === 'ACCOUNTANT'
          ? 'fee_management'
          : currentRole === 'TEACHER'
          ? 'attendance_timetable'
          : currentRole === 'TRANSPORT'
          ? 'library_transport'
          : 'principal_dashboard';

      return (
        <div className="p-8 max-w-xl mx-auto my-12 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900 shadow-xl">
          <div className="inline-flex p-4 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 border border-rose-200 dark:border-rose-800">
            <ShieldAlert className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Access Denied / अनाधिकृत मॉड्यूल
          </h2>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Your account role (<span className="font-semibold text-rose-600">{currentRole}</span>) is not authorized to access the requested module: <span className="font-mono font-semibold">{activeModule}</span>.
          </p>
          <button
            type="button"
            onClick={() => setActiveModule(fallbackModule)}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md cursor-pointer transition-all"
          >
            Return to My Authorized Portal
          </button>
        </div>
      );
    }

    switch (activeModule) {
      case 'parent_portal':
        return <ParentPortalModule />;
      case 'student_portal':
        return <StudentPortalModule />;
      case 'principal_dashboard':
      case 'principal_ai_assistant':
        return <PrincipalAIDashboardModule />;
      case 'school_setup':
        return <SchoolSetupModule />;
      case 'institutional_hierarchy':
        return <InstitutionalHierarchyModule />;
      case 'design_system':
        return <DesignSystemShowcase />;
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
        return <NotFoundPage />;
    }
  };

  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        <ShellHeader
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
        />
        <div className="flex flex-1 overflow-hidden">
          <ShellSidebar
            isMobileOpen={isMobileSidebarOpen}
            onCloseMobile={() => setIsMobileSidebarOpen(false)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          />
          <main
            role="main"
            id="main-content"
            className="flex-1 overflow-y-auto w-full transition-all duration-200"
          >
            <ErrorBoundary fallbackTitle="Module Loading Exception">
              {renderModuleContent()}
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </ToastProvider>
  );
};
