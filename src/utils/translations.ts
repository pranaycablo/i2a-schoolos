export type AppLanguage = 'en' | 'hi';

export const translations: Record<string, { en: string; hi: string }> = {
  // Modules & Navigation
  principal_dashboard: { en: 'Dashboard Overview', hi: 'डैशबोर्ड अवलोकन' },
  principal_ai_assistant: { en: 'AI Principal Assistant', hi: 'एआई प्रिंसिपल सहायक' },
  school_setup: { en: 'School Setup & Branding', hi: 'स्कूल सेटअप व ब्रांडिंग' },
  student_management: { en: 'Student Management (SIS)', hi: 'छात्र प्रबंधन (SIS)' },
  admission_workflow: { en: 'Online Admissions', hi: 'ऑनलाइन प्रवेश प्रक्रिया' },
  fee_management: { en: 'Fee & Payments', hi: 'फीस एवं भुगतान' },
  digital_books_ai: { en: 'Digital Books & Question Bank', hi: 'डिजिटल बुक्स व प्रश्न बैंक' },
  homework_learning: { en: 'Homework & Learning', hi: 'गृहकार्य एवं शिक्षण' },
  examination_ai: { en: 'Exams & AI Test Paper', hi: 'परीक्षा व टेस्ट पेपर्स' },
  examination_result_engine: { en: 'Results & CGPA Engine', hi: 'परीक्षा परिणाम व ग्रेडिंग' },
  report_card_certs: { en: 'Report Cards & Certificates', hi: 'प्रगति पत्र व प्रमाण पत्र' },
  attendance_timetable: { en: 'Attendance & Leaves', hi: 'उपस्थिति एवं अवकाश' },
  timetable_engine: { en: 'Timetable & Scheduling', hi: 'समय सारणी (टाइमटेबल)' },
  payroll_expenses: { en: 'Staff Payroll & Expenses', hi: 'वेतन व स्कूल खर्चे' },
  library_transport: { en: 'Transport & Fleet', hi: 'परिवहन (बस) व लाइब्रेरी' },
  school_marketplace: { en: 'School Store & Marketplace', hi: 'स्कूल स्टोर एवं यूनिफॉर्म' },
  subscription_billing: { en: 'Subscription & Billing', hi: 'सब्सक्रिप्शन एवं बिलिंग' },
  website_builder: { en: 'School Website CMS', hi: 'स्कूल वेबसाइट पोर्टल' },
  audit_trail: { en: 'Forensic Audit Trail', hi: 'सुरक्षा व ऑडिट ट्रेल' },

  // Role Labels
  PRINCIPAL: { en: 'School Principal', hi: 'स्कूल प्रिंसिपल' },
  ADMIN: { en: 'School Management', hi: 'स्कूल प्रबंधन' },
  TEACHER: { en: 'Teacher Portal', hi: 'शिक्षक पोर्टल' },
  ACCOUNTANT: { en: 'Head Accountant', hi: 'मुख्य लेखाकार' },
  STAFF: { en: 'Office Staff / Clerk', hi: 'कार्यालय कर्मचारी' },
  TRANSPORT: { en: 'Transport / Driver', hi: 'वाहन चालक / बस प्रभारी' },
  PARENT: { en: 'Parent Portal', hi: 'अभिभावक पोर्टल' },
  STUDENT: { en: 'Student Portal', hi: 'विद्यार्थी पोर्टल' },
  SUPER_ADMIN: { en: 'i2A SaaS Master', hi: 'सॉस मास्टर एडमिन' },

  // Actions and Common Headers
  school_store_btn: { en: 'School Store', hi: 'स्कूल स्टोर' },
  search_placeholder: { en: 'Search student, fee receipt, or exam paper...', hi: 'छात्र, फीस रसीद या परीक्षा खोजें...' },
  view_as: { en: 'View As:', hi: 'भूमिका:' },
  saas_central: { en: 'SaaS Central', hi: 'सॉस सेंट्रल' },
  notifications: { en: 'Controlled Approval Center', hi: 'अनुमोदन व सूचना केंद्र' },
  pending: { en: 'Pending', hi: 'लंबित' },
  quick_actions: { en: 'Quick Actions', hi: 'त्वरित कार्य' },
  welcome: { en: 'Welcome to i2A SchoolOS', hi: 'i2A स्कूलओएस में आपका स्वागत है' }
};

export function translate(key: string, lang: AppLanguage): string {
  if (translations[key] && translations[key][lang]) {
    return translations[key][lang];
  }
  return key;
}
