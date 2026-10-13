export type AppLanguage = 'en' | 'hi';

export const translations: Record<string, { en: string; hi: string }> = {
  // Modules & Navigation
  principal_dashboard: { en: 'Executive Dashboard', hi: 'मुख्य डैशबोर्ड' },
  principal_ai_assistant: { en: 'AI Principal Copilot', hi: 'एआई प्रिंसिपल सहायक' },
  school_setup: { en: 'School Setup & Profile', hi: 'स्कूल सेटअप व प्रोफ़ाइल' },
  student_management: { en: 'Student Information System', hi: 'विद्यार्थी सूचना प्रणाली' },
  admission_workflow: { en: 'Online Admissions', hi: 'ऑनलाइन प्रवेश प्रक्रिया' },
  fee_management: { en: 'Fee Collection & Dues', hi: 'फीस संग्रह एवं बकाया' },
  digital_books_ai: { en: 'Digital Library & Question Bank', hi: 'डिजिटल लाइब्रेरी व प्रश्न बैंक' },
  homework_learning: { en: 'Homework & LMS Learning', hi: 'गृहकार्य एवं शिक्षण' },
  examination_ai: { en: 'Examinations & Question Papers', hi: 'परीक्षा व प्रश्न पत्र' },
  examination_result_engine: { en: 'Results & Grade Engine', hi: 'परीक्षा परिणाम एवं ग्रेडिंग' },
  report_card_certs: { en: 'Report Cards & Certificates', hi: 'प्रगति पत्रक व प्रमाण पत्र' },
  attendance_timetable: { en: 'Attendance & Leaves', hi: 'दैनिक उपस्थिति एवं अवकाश' },
  timetable_engine: { en: 'Timetable & Scheduling', hi: 'समय सारणी एवं शेड्यूलिंग' },
  payroll_expenses: { en: 'Staff Payroll & Expenses', hi: 'कर्मचारी वेतन एवं खर्च' },
  staff_workforce: { en: 'Staff & Faculty Management', hi: 'स्टाफ एवं फैकल्टी प्रबंधन' },
  library_transport: { en: 'Transport Fleet & Library', hi: 'वाहन परिवहन एवं लाइब्रेरी' },
  school_marketplace: { en: 'School Store & Uniforms', hi: 'स्कूल स्टोर एवं यूनिफॉर्म' },
  subscription_billing: { en: 'Subscription & Billing', hi: 'सब्सक्रिप्शन एवं बिलिंग' },
  website_builder: { en: 'School Public Website CMS', hi: 'स्कूल वेबसाइट प्रबंधन' },
  audit_trail: { en: 'Forensic Audit Trail', hi: 'सुरक्षा एवं ऑडिट लॉग' },

  // Role Labels
  PRINCIPAL: { en: 'School Principal', hi: 'प्रधानाचार्य' },
  ADMIN: { en: 'School Management', hi: 'स्कूल प्रबंधन' },
  TEACHER: { en: 'Teacher Portal', hi: 'शिक्षक पोर्टल' },
  ACCOUNTANT: { en: 'Accounts Officer', hi: 'लेखा अधिकारी' },
  STAFF: { en: 'Office Clerk', hi: 'कार्यालय सहायक' },
  TRANSPORT: { en: 'Transport In-Charge', hi: 'परिवहन प्रभारी' },
  PARENT: { en: 'Parent Portal', hi: 'अभिभावक पोर्टल' },
  STUDENT: { en: 'Student Portal', hi: 'विद्यार्थी पोर्टल' },
  SUPER_ADMIN: { en: 'Platform Master Admin', hi: 'मास्टर व्यवस्थापक' },

  // Actions and Common Headers
  school_store_btn: { en: 'School Store', hi: 'स्कूल स्टोर' },
  search_placeholder: { en: 'Search student, receipt, or question paper...', hi: 'विद्यार्थी, रसीद या प्रश्न पत्र खोजें...' },
  view_as: { en: 'Switch Role:', hi: 'भूमिका बदलें:' },
  saas_central: { en: 'SaaS Platform Central', hi: 'सॉस प्लेटफॉर्म केंद्र' },
  notifications: { en: 'Notification & Approval Center', hi: 'सूचना एवं अनुमोदन केंद्र' },
  pending: { en: 'Pending', hi: 'लंबित' },
  quick_actions: { en: 'Quick Actions', hi: 'त्वरित कार्य' },
  welcome: { en: 'Welcome to i2A SchoolOS', hi: 'i2A स्कूलओएस में आपका स्वागत है' },
  switch_school: { en: 'Switch School', hi: 'स्कूल बदलें' },
  register_new_school: { en: '+ Add New School', hi: '+ नया स्कूल जोड़ें' },
  student_id_card: { en: 'Official Student Identity Card', hi: 'आधिकारिक विद्यार्थी पहचान पत्र' },
  parent_ward_portal: { en: 'Parent & Ward 360° Portal', hi: 'अभिभावक एवं विद्यार्थी पोर्टल' },
  renew_subscription: { en: 'Renew Subscription', hi: 'सब्सक्रिप्शन नवीनीकरण करें' },
  expired_banner: { en: 'Your school subscription has expired. Please renew to restore full access.', hi: 'आपके स्कूल का सब्सक्रिप्शन समाप्त हो गया है। सभी सुविधाएं जारी रखने हेतु कृपया नवीनीकरण करें।' },
  active_campus: { en: 'Active Campus', hi: 'सक्रिय कैंपस' },
  change_campus: { en: 'Change School Campus', hi: 'स्कूल कैंपस बदलें' },
  pay_dues: { en: 'Pay Fees', hi: 'फीस जमा करें' },
  track_bus: { en: 'Track Bus', hi: 'बस लाइव देखें' },
  view_marksheet: { en: 'Term Report Card', hi: 'सत्र प्रगति पत्रक' },
  attendance_status: { en: 'Attendance: 96% Present', hi: 'उपस्थिति: 96% उपस्थित' },
  ward_label: { en: 'Student:', hi: 'विद्यार्थी:' }
};

export function translate(key: string, lang: AppLanguage): string {
  if (translations[key] && translations[key][lang]) {
    return translations[key][lang];
  }
  return key;
}
