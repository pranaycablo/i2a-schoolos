import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  UserRole,
  SchoolBranding,
  SchoolRegistrationApplication,
  TransportRouteItem,
  Student,
  OnlineAdmissionApplication,
  FeeType,
  FeeReceipt,
  DigitalBook,
  QuestionBankItem,
  ExamPaper,
  OnlineExamSubmission,
  Staff,
  PayrollRecord,
  SchoolExpense,
  AuditLog
} from '../types';

export interface SubscriptionPlan {
  id: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  maxStudents: number;
  maxStaff: number;
  features: string[];
}

export interface SchoolTenant {
  id: string; // Immutable server-generated School ID, e.g., "I2A-SCH-000001"
  name: string;
  code: string;
  board: 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'IB';
  city: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  planId: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  planName: string;
  billingCycle: 'MONTHLY' | 'YEARLY';
  subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'EXPIRED' | 'SUSPENDED';
  registeredAt: string;
  expiresAt: string;
  studentLimit: number;
  isOnboarded: boolean;
}

interface SchoolContextType {
  // View Mode & Multi-Tenant State
  viewMode: 'PUBLIC_SAAS' | 'SCHOOL_PORTAL' | 'PLATFORM_ADMIN';
  setViewMode: (mode: 'PUBLIC_SAAS' | 'SCHOOL_PORTAL' | 'PLATFORM_ADMIN') => void;
  activeSchoolId: string;
  tenants: SchoolTenant[];
  activeTenant: SchoolTenant;
  subscriptionPlans: SubscriptionPlan[];
  registerSchool: (params: {
    name: string;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    city: string;
    board: 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'IB';
    planId: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
    billingCycle: 'MONTHLY' | 'YEARLY';
  }) => SchoolTenant;
  loginToSchool: (schoolId: string, role?: UserRole) => void;
  updateTenantSubscription: (schoolId: string, status: string, planId: string) => void;
  toggleSchoolSuspension: (schoolId: string) => void;
  returnToPublicSaas: () => void;

  // Theme & Role
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  activeModule: string;
  setActiveModule: (mod: string) => void;

  // School Branding
  branding: SchoolBranding;
  updateBranding: (newBranding: Partial<SchoolBranding>) => void;

  // Data Collections
  students: Student[];
  addStudent: (student: Omit<Student, 'id'>) => void;
  updateStudent: (id: string, updated: Partial<Student>) => void;

  admissions: OnlineAdmissionApplication[];
  addAdmission: (app: Omit<OnlineAdmissionApplication, 'id' | 'applicationNo' | 'submittedDate'>) => void;
  updateAdmissionStatus: (id: string, status: OnlineAdmissionApplication['status'], score?: number, remarks?: string) => void;
  approveAdmissionAndCreateStudent: (id: string) => void;

  feeTypes: FeeType[];
  addFeeType: (fee: Omit<FeeType, 'id'>) => void;

  feeReceipts: FeeReceipt[];
  processFeePayment: (studentId: string, feeIds: string[], paymentMode: FeeReceipt['paymentMode']) => FeeReceipt;

  digitalBooks: DigitalBook[];
  questionBank: QuestionBankItem[];
  addQuestionToBank: (q: Omit<QuestionBankItem, 'id'>) => void;

  examPapers: ExamPaper[];
  generateAIExamPaper: (params: { className: string; subject: string; title: string; marks: number; duration: number }) => ExamPaper;
  updateExamPaperStatus: (id: string, status: ExamPaper['status']) => void;

  examSubmissions: OnlineExamSubmission[];
  submitStudentExam: (submission: Omit<OnlineExamSubmission, 'id' | 'submittedAt' | 'score' | 'percentage' | 'grade' | 'status'>) => void;
  gradeSubjectiveAnswers: (submissionId: string, grades: { questionId: string; marks: number; comment?: string }[]) => void;

  staffList: Staff[];
  payrollRecords: PayrollRecord[];
  disbursePayroll: (recordId: string) => void;

  expenses: SchoolExpense[];
  addExpense: (exp: Omit<SchoolExpense, 'id'>) => void;

  auditLogs: AuditLog[];
  logAction: (action: string, module: string, details: string) => void;

  // School Direct Registration & Verification Queue
  schoolApplications: SchoolRegistrationApplication[];
  submitSchoolRegistrationApplication: (data: Omit<SchoolRegistrationApplication, 'id' | 'applicationNo' | 'submittedDate' | 'status'>) => SchoolRegistrationApplication;
  approveSchoolApplication: (appId: string) => SchoolTenant;
  rejectSchoolApplication: (appId: string, reason: string) => void;

  // Transport Routes & Fleet
  transportRoutes: TransportRouteItem[];
  addTransportRoute: (route: Omit<TransportRouteItem, 'id'>) => void;
  updateTransportStatus: (routeId: string, status: TransportRouteItem['liveStatus'], location?: string) => void;

  // Public School Website Direct Admission
  submitSchoolAdmission: (app: {
    studentName: string;
    applyingClass: string;
    parentName: string;
    phone: string;
    email: string;
    remarks?: string;
  }) => OnlineAdmissionApplication;

  // Helper actions
  resetSeedData: () => void;
}

// Initial Realistic Seed Data
const initialBranding: SchoolBranding = {
  id: 'sch-001',
  name: 'ABC Public School',
  tagline: 'Excellence in Education & Character Building',
  logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150&auto=format&fit=crop&q=80',
  stampUrl: 'https://api.iconify.design/emojione-v1:approved.svg',
  principalSignatureUrl: 'https://api.iconify.design/ci:edit-pencil.svg',
  primaryColor: '#4F46E5',
  secondaryColor: '#06B6D4',
  address: 'Baily Road, Near Golf Course, Patna, Bihar - 800001',
  phone: '+91 612 2345678',
  email: 'info@abcpublicschool.edu.in',
  whatsappNumber: '+91 9876543210',
  website: 'abcpublicschool.yourschoolos.com',
  principalName: 'Dr. Ramesh Chandra Sharma',
  regNumber: 'BR-SCH-2018/9842',
  board: 'CBSE',
  medium: 'ENGLISH',
  academicSession: '2026-2027',
  invoiceHeader: 'ABC PUBLIC SCHOOL — PATNA',
  invoiceFooter: 'This is a computer generated digital fee receipt authorized by i2A SchoolOS.',
  reportCardTheme: 'EMERALD_MODERN',
  certificateTheme: 'OFFICIAL'
};

const initialStudents: Student[] = [
  {
    id: 'std-101',
    admissionNo: '1024',
    rollNo: '01',
    name: 'Rahul Kumar',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    dob: '2012-05-14',
    gender: 'MALE',
    className: 'Class VIII',
    section: 'A',
    house: 'Tagore House',
    fatherName: 'Sanjay Kumar',
    motherName: 'Sunita Devi',
    parentMobile: '9876543210',
    parentWhatsApp: '9876543210',
    parentEmail: 'sanjay.kumar@gmail.com',
    address: 'Flat 302, Green Villa, Kankarbagh, Patna',
    admissionDate: '2022-04-10',
    status: 'ACTIVE',
    documents: { birthCertificate: 'Uploaded', transferCertificate: 'Uploaded' },
    assignedSubjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'],
    attendanceRate: 94.5
  },
  {
    id: 'std-102',
    admissionNo: '1025',
    rollNo: '02',
    name: 'Ananya Sharma',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
    dob: '2012-08-22',
    gender: 'FEMALE',
    className: 'Class VIII',
    section: 'A',
    house: 'Raman House',
    fatherName: 'Vikram Sharma',
    motherName: 'Meenakshi Sharma',
    parentMobile: '9876543211',
    parentWhatsApp: '9876543211',
    parentEmail: 'vikram.sharma@gmail.com',
    address: 'House 14, Boring Road, Patna',
    admissionDate: '2022-04-12',
    status: 'ACTIVE',
    documents: { birthCertificate: 'Uploaded' },
    assignedSubjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'],
    attendanceRate: 98.2
  },
  {
    id: 'std-103',
    admissionNo: '1026',
    rollNo: '03',
    name: 'Rohit Verma',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    dob: '2010-11-05',
    gender: 'MALE',
    className: 'Class X',
    section: 'B',
    house: 'Ashoka House',
    fatherName: 'Rajesh Verma',
    motherName: 'Kavita Verma',
    parentMobile: '9876543212',
    parentWhatsApp: '9876543212',
    parentEmail: 'rajesh.verma@outlook.com',
    address: 'Sector 4, Rajendra Nagar, Patna',
    admissionDate: '2020-04-05',
    status: 'ACTIVE',
    documents: { birthCertificate: 'Uploaded', transferCertificate: 'Uploaded' },
    assignedSubjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'],
    attendanceRate: 82.0
  }
];

const initialAdmissions: OnlineAdmissionApplication[] = [
  {
    id: 'adm-001',
    applicationNo: 'APP-2026-089',
    studentName: 'Aarav Patel',
    applyingClass: 'Class VI',
    parentName: 'Mahesh Patel',
    phone: '9811223344',
    email: 'mahesh.patel@gmail.com',
    status: 'SUBMITTED',
    submittedDate: '2026-10-06',
    documentsUploaded: true,
    remarks: 'Waiting for Document Verification'
  },
  {
    id: 'adm-002',
    applicationNo: 'APP-2026-090',
    studentName: 'Priya Singh',
    applyingClass: 'Class VIII',
    parentName: 'Amit Singh',
    phone: '9822334455',
    email: 'amit.singh@gmail.com',
    status: 'INTERVIEW_SCHEDULED',
    submittedDate: '2026-10-04',
    documentsUploaded: true,
    interviewScore: 88,
    remarks: 'Interview completed. Score: 88/100. Pending Principal Approval.'
  }
];

const initialFeeTypes: FeeType[] = [
  { id: 'fee-1', name: 'Tuition Fee', code: 'TUTION', amount: 2000, frequency: 'MONTHLY', category: 'TUITION', isOptional: false, description: 'Monthly Core Academic Fee' },
  { id: 'fee-2', name: 'Activity Fee', code: 'ACTIVITY', amount: 300, frequency: 'MONTHLY', category: 'ACTIVITY', isOptional: false, description: 'Sports, Clubs & Co-Curriculars' },
  { id: 'fee-3', name: 'Examination Fee', code: 'EXAM', amount: 500, frequency: 'QUARTERLY', category: 'LAB', isOptional: false, description: 'Term Question Papers & Assessment' },
  { id: 'fee-4', name: 'Educational Tour Fee', code: 'TOUR', amount: 2500, frequency: 'ONE_TIME', category: 'CUSTOM', isOptional: true, description: 'Historical Tour to Nalanda' },
  { id: 'fee-5', name: 'Transport Bus Fee', code: 'TRANS', amount: 1200, frequency: 'MONTHLY', category: 'TRANSPORT', isOptional: true, description: 'Route B: Kankarbagh - School' }
];

const initialReceipts: FeeReceipt[] = [
  {
    id: 'rcp-001',
    receiptNo: 'INV-2026-001245',
    studentId: 'std-101',
    studentName: 'Rahul Kumar',
    admissionNo: '1024',
    className: 'Class VIII',
    section: 'A',
    feeBreakup: [
      { feeName: 'Tuition Fee', amount: 2000 },
      { feeName: 'Activity Fee', amount: 300 },
      { feeName: 'Examination Fee', amount: 200 }
    ],
    totalAmount: 2500,
    paidAmount: 2500,
    balanceAmount: 0,
    paymentMode: 'UPI',
    transactionId: 'UPI-9842104821',
    paymentDate: '2026-10-07 10:45 AM',
    status: 'SUCCESS',
    emailSent: true,
    whatsappSent: true
  }
];

const initialBooks: DigitalBook[] = [
  {
    id: 'bk-1',
    title: 'NCERT Science Class VIII',
    className: 'Class VIII',
    subject: 'Science',
    coverUrl: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?w=200&auto=format&fit=crop&q=80',
    chaptersCount: 12,
    chapters: [
      {
        id: 'ch-1',
        chapterNumber: 1,
        title: 'Crop Production & Management',
        summary: 'Preparation of soil, sowing, adding manure, irrigation, protection from weeds, harvesting and storage.',
        topics: ['Soil Preparation', 'Irrigation Methods', 'Harvesting', 'Storage'],
        extractedConcepts: ['Kharif & Rabi Crops', 'Drip Irrigation', 'Silos', 'Humus'],
        candidateQuestionsCount: 15
      },
      {
        id: 'ch-2',
        chapterNumber: 2,
        title: 'Microorganisms: Friend & Foe',
        summary: 'Classification of microbes, beneficial bacteria, food preservation, and disease-causing pathogens.',
        topics: ['Bacteria & Fungi', 'Commercial Uses', 'Vaccines', 'Pathogens'],
        extractedConcepts: ['Pasteurization', 'Antibiotics', 'Nitrogen Cycle'],
        candidateQuestionsCount: 18
      }
    ]
  }
];

const initialQuestions: QuestionBankItem[] = [
  {
    id: 'q-1',
    className: 'Class VIII',
    subject: 'Science',
    chapterId: 'ch-1',
    chapterTitle: 'Crop Production & Management',
    questionText: 'Which of the following is a Kharif crop?',
    type: 'MCQ',
    options: ['Wheat', 'Paddy (Rice)', 'Mustard', 'Gram'],
    correctAnswer: 'Paddy (Rice)',
    difficulty: 'EASY',
    marks: 1
  },
  {
    id: 'q-2',
    className: 'Class VIII',
    subject: 'Science',
    chapterId: 'ch-1',
    chapterTitle: 'Crop Production & Management',
    questionText: 'Explain the difference between Manure and Fertilizer.',
    type: 'SHORT',
    correctAnswer: 'Manure is organic matter while fertilizer is chemical in nature enriched in specific nutrients.',
    difficulty: 'MEDIUM',
    marks: 3
  },
  {
    id: 'q-3',
    className: 'Class VIII',
    subject: 'Science',
    chapterId: 'ch-2',
    chapterTitle: 'Microorganisms: Friend & Foe',
    questionText: 'Process of conversion of sugar into alcohol by yeast is called ______.',
    type: 'FILL_BLANKS',
    correctAnswer: 'Fermentation',
    difficulty: 'EASY',
    marks: 1
  }
];

const initialExamPapers: ExamPaper[] = [
  {
    id: 'ex-001',
    paperTitle: 'Class VIII Science Weekly Assessment',
    className: 'Class VIII',
    subject: 'Science',
    totalMarks: 30,
    durationMinutes: 45,
    questions: initialQuestions,
    status: 'APPROVED',
    generatedDate: '2026-10-07',
    approvedBy: 'Dr. Ramesh Chandra Sharma (Principal)',
    autoScheduleDays: 'Every Wednesday'
  }
];

const initialSubmissions: OnlineExamSubmission[] = [
  {
    id: 'sub-001',
    examPaperId: 'ex-001',
    examTitle: 'Class VIII Science Weekly Assessment',
    studentId: 'std-101',
    studentName: 'Rahul Kumar',
    className: 'Class VIII',
    section: 'A',
    submittedAt: '2026-10-07 11:30 AM',
    score: 28,
    totalMarks: 30,
    percentage: 93.3,
    grade: 'A+',
    status: 'EVALUATED',
    answers: [
      { questionId: 'q-1', studentAnswer: 'Paddy (Rice)', marksObtained: 1, isCorrect: true },
      { questionId: 'q-2', studentAnswer: 'Manure comes from natural decomposed plants. Fertilizers are made in factories.', marksObtained: 3, isCorrect: true, teacherComment: 'Good concise explanation.' },
      { questionId: 'q-3', studentAnswer: 'Fermentation', marksObtained: 1, isCorrect: true }
    ]
  }
];

const initialStaff: Staff[] = [
  {
    id: 'stf-1',
    employeeId: 'EMP-101',
    name: 'Mrs. Sunita Mishra',
    role: 'TEACHER',
    designation: 'Senior Science Faculty',
    qualification: 'M.Sc. Physics, B.Ed',
    joiningDate: '2019-07-15',
    mobile: '9833445566',
    email: 'sunita.mishra@abcpublicschool.edu.in',
    baseSalary: 45000,
    status: 'ACTIVE',
    assignedClasses: ['Class VIII', 'Class X'],
    assignedSubjects: ['Science', 'Physics']
  },
  {
    id: 'stf-2',
    employeeId: 'EMP-102',
    name: 'Mr. Alok Nath',
    role: 'ACCOUNTANT',
    designation: 'Head Accountant',
    qualification: 'M.Com, Tally Certified',
    joiningDate: '2020-03-01',
    mobile: '9844556677',
    email: 'alok.nath@abcpublicschool.edu.in',
    baseSalary: 38000,
    status: 'ACTIVE'
  }
];

const initialPayroll: PayrollRecord[] = [
  {
    id: 'pay-001',
    month: 'October 2026',
    staffId: 'stf-1',
    staffName: 'Mrs. Sunita Mishra',
    baseSalary: 45000,
    presentDays: 26,
    workingDays: 26,
    bonus: 2000,
    deductions: 0,
    netSalary: 47000,
    status: 'DISBURSED',
    disbursedDate: '2026-10-01'
  }
];

const initialExpenses: SchoolExpense[] = [
  {
    id: 'exp-1',
    title: 'Science Lab Equipment & Chemicals',
    category: 'EVENTS',
    amount: 14500,
    date: '2026-10-05',
    paidTo: 'Patna Scientific Supplies',
    approvedBy: 'Dr. Ramesh Chandra Sharma'
  },
  {
    id: 'exp-2',
    title: 'Electricity Bill September',
    category: 'ELECTRICITY',
    amount: 32400,
    date: '2026-10-03',
    paidTo: 'SBPDCL Patna',
    approvedBy: 'Mr. Alok Nath'
  }
];

const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-10-08 10:15 AM',
    user: 'Dr. Ramesh Chandra Sharma',
    role: 'PRINCIPAL',
    action: 'APPROVED_EXAM_PAPER',
    module: 'EXAM_AI',
    details: 'Approved paper: Class VIII Science Weekly Assessment',
    ipAddress: '192.168.1.15'
  },
  {
    id: 'log-2',
    timestamp: '2026-10-07 10:45 AM',
    user: 'System Automated Workflow',
    role: 'ACCOUNTANT',
    action: 'FEE_RECEIPT_GENERATED',
    module: 'FEE_MANAGEMENT',
    details: 'Generated INV-2026-001245 for Student Rahul Kumar (₹2,500 via UPI)',
    ipAddress: '10.0.0.1'
  }
];

const initialSubscriptionPlans: SubscriptionPlan[] = [
  {
    id: 'STARTER',
    name: 'Starter Plan',
    monthlyPrice: 999,
    yearlyPrice: 9588,
    maxStudents: 250,
    maxStaff: 15,
    features: [
      'Up to 250 Students',
      'Core Admissions & SIS Module',
      'Digital Fee Receipts & Ledger',
      'Attendance & Leave Tracking',
      'Basic Report Cards PDF Export',
      'Email & System Notifications'
    ]
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional Plan',
    monthlyPrice: 2499,
    yearlyPrice: 23988,
    maxStudents: 1000,
    maxStaff: 50,
    features: [
      'Up to 1,000 Students',
      'AI Question Paper & Test Generator',
      'NCERT Digital Books Ingestion',
      'Automatic Timetable Conflict Solver',
      'Homework & Digital Learning Portal',
      'Parent & Student Mobile Dashboards',
      'WhatsApp Fee & Exam Alerts'
    ]
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise Plan',
    monthlyPrice: 4999,
    yearlyPrice: 47988,
    maxStudents: 999999,
    maxStaff: 500,
    features: [
      'Unlimited Students & Campuses',
      'Full Multi-Tenant Custom Branding',
      'Dedicated Cloud Server & Backup',
      'Custom Domain Mapping',
      'Advanced Security Audit Logs',
      '24/7 Priority Support & Onboarding'
    ]
  }
];

const initialTenants: SchoolTenant[] = [
  {
    id: 'I2A-SCH-000001',
    name: 'ABC Public School',
    code: 'ABC-PATNA',
    board: 'CBSE',
    city: 'Patna',
    adminName: 'Dr. Ramesh Chandra Sharma',
    adminEmail: 'info@abcpublicschool.edu.in',
    adminPhone: '+91 612 2345678',
    planId: 'PROFESSIONAL',
    planName: 'Professional Plan',
    billingCycle: 'YEARLY',
    subscriptionStatus: 'ACTIVE',
    registeredAt: '2026-01-10',
    expiresAt: '2027-01-10',
    studentLimit: 1000,
    isOnboarded: true
  },
  {
    id: 'I2A-SCH-000002',
    name: 'St. Xavier Senior Secondary School',
    code: 'STX-PATNA',
    board: 'ICSE',
    city: 'Patna',
    adminName: 'Fr. Thomas Varghese',
    adminEmail: 'admin@stxaviers.edu.in',
    adminPhone: '+91 612 9876543',
    planId: 'STARTER',
    planName: 'Starter Plan',
    billingCycle: 'MONTHLY',
    subscriptionStatus: 'TRIAL',
    registeredAt: '2026-10-01',
    expiresAt: '2026-10-31',
    studentLimit: 250,
    isOnboarded: false
  }
];

const initialSchoolApplications: SchoolRegistrationApplication[] = [
  {
    id: 'APP-SCH-101',
    applicationNo: 'REG-2026-9041',
    schoolName: 'Delhi Public International Academy',
    board: 'CBSE',
    city: 'Patna',
    state: 'Bihar',
    adminName: 'Er. Sunil K. Sharma',
    adminEmail: 'director@dpia.edu.in',
    adminPhone: '+91 9431023456',
    domainType: 'SUBDOMAIN',
    subdomainSlug: 'dpia-patna',
    planId: 'PROFESSIONAL',
    status: 'PENDING_VERIFICATION',
    submittedDate: '2026-10-10',
    affiliationNumber: 'CBSE/AFF/330912',
    documentsSubmitted: {
      govtRegCert: 'Society_Registration_Cert_2019.pdf',
      affiliationDoc: 'CBSE_Affiliation_Letter_2024.pdf',
      principalIdDoc: 'Director_Aadhaar_KYC.pdf'
    }
  },
  {
    id: 'APP-SCH-102',
    applicationNo: 'REG-2026-9042',
    schoolName: 'Mount Carmel Convent High School',
    board: 'ICSE',
    city: 'Ranchi',
    state: 'Jharkhand',
    adminName: "Sister Maria D'Souza",
    adminEmail: 'principal@mountcarmelranchi.org',
    adminPhone: '+91 9431088776',
    domainType: 'CUSTOM_DOMAIN',
    subdomainSlug: 'mountcarmel',
    customDomain: 'www.mountcarmelranchi.org',
    planId: 'ENTERPRISE',
    status: 'DOCS_REVIEWED',
    submittedDate: '2026-10-09',
    affiliationNumber: 'CISCE/JH/042',
    documentsSubmitted: {
      govtRegCert: 'Trust_Deed_Carmel_1998.pdf',
      affiliationDoc: 'CISCE_Permanent_Affiliation.pdf',
      principalIdDoc: 'Principal_Passport_KYC.pdf'
    }
  }
];

const initialTransportRoutes: TransportRouteItem[] = [
  {
    id: 'TR-01',
    routeNumber: 'Route 01 - East Patna Express',
    routeName: 'Kankarbagh to Bailey Road Campus',
    driverName: 'Manoj Singh',
    driverMobile: '+91 9811002233',
    vehicleNumber: 'BR-01-PA-4021',
    capacity: 40,
    assignedStudentsCount: 34,
    liveStatus: 'ON_ROUTE_MORNING',
    currentLocation: 'Near Rajendra Nagar Overbridge',
    stops: [
      { stopName: 'Kankarbagh Colony Mor', pickUpTime: '06:45 AM', dropTime: '02:30 PM', monthlyFee: 1200 },
      { stopName: 'Rajendra Nagar Terminal', pickUpTime: '07:05 AM', dropTime: '02:15 PM', monthlyFee: 1200 },
      { stopName: 'Exhibition Road Crossing', pickUpTime: '07:20 AM', dropTime: '02:00 PM', monthlyFee: 1400 },
      { stopName: 'School Main Gate', pickUpTime: '07:40 AM', dropTime: '01:40 PM', monthlyFee: 0 }
    ]
  },
  {
    id: 'TR-02',
    routeNumber: 'Route 02 - West Patna Cruiser',
    routeName: 'Danapur Cantt to Bailey Road Campus',
    driverName: 'Rakesh Verma',
    driverMobile: '+91 9811002244',
    vehicleNumber: 'BR-01-PA-9820',
    capacity: 42,
    assignedStudentsCount: 38,
    liveStatus: 'IDLE',
    currentLocation: 'School Bus Yard',
    stops: [
      { stopName: 'Saguna Mor Danapur', pickUpTime: '06:50 AM', dropTime: '02:25 PM', monthlyFee: 1500 },
      { stopName: 'RPS Mor Bailey Road', pickUpTime: '07:10 AM', dropTime: '02:10 PM', monthlyFee: 1300 },
      { stopName: 'Ashiana Nagar Mor', pickUpTime: '07:25 AM', dropTime: '01:55 PM', monthlyFee: 1100 },
      { stopName: 'School Main Gate', pickUpTime: '07:45 AM', dropTime: '01:35 PM', monthlyFee: 0 }
    ]
  }
];

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // SaaS Multi-Tenant Platform State
  const [viewMode, setViewMode] = useState<'PUBLIC_SAAS' | 'SCHOOL_PORTAL' | 'PLATFORM_ADMIN'>('PUBLIC_SAAS');
  const [activeSchoolId, setActiveSchoolId] = useState<string>('I2A-SCH-000001');

  const [tenants, setTenants] = useState<SchoolTenant[]>(() => {
    const saved = localStorage.getItem('i2a_tenants');
    return saved ? JSON.parse(saved) : initialTenants;
  });

  const activeTenant = tenants.find((t) => t.id === activeSchoolId) || tenants[0];

  const [currentRole, setCurrentRole] = useState<UserRole>('PRINCIPAL');
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('i2a_dark') === 'true');
  const [activeModule, setActiveModule] = useState<string>('principal_dashboard');

  const [branding, setBranding] = useState<SchoolBranding>(() => {
    const saved = localStorage.getItem('i2a_branding');
    return saved ? JSON.parse(saved) : initialBranding;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('i2a_students');
    return saved ? JSON.parse(saved) : initialStudents;
  });

  const [admissions, setAdmissions] = useState<OnlineAdmissionApplication[]>(() => {
    const saved = localStorage.getItem('i2a_admissions');
    return saved ? JSON.parse(saved) : initialAdmissions;
  });

  const [feeTypes, setFeeTypes] = useState<FeeType[]>(() => {
    const saved = localStorage.getItem('i2a_feetypes');
    return saved ? JSON.parse(saved) : initialFeeTypes;
  });

  const [feeReceipts, setFeeReceipts] = useState<FeeReceipt[]>(() => {
    const saved = localStorage.getItem('i2a_receipts');
    return saved ? JSON.parse(saved) : initialReceipts;
  });

  const [digitalBooks] = useState<DigitalBook[]>(initialBooks);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>(initialQuestions);
  const [examPapers, setExamPapers] = useState<ExamPaper[]>(initialExamPapers);
  const [examSubmissions, setExamSubmissions] = useState<OnlineExamSubmission[]>(initialSubmissions);
  const [staffList] = useState<Staff[]>(initialStaff);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(initialPayroll);
  const [expenses, setExpenses] = useState<SchoolExpense[]>(initialExpenses);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [schoolApplications, setSchoolApplications] = useState<SchoolRegistrationApplication[]>(() => {
    const saved = localStorage.getItem('i2a_school_applications');
    return saved ? JSON.parse(saved) : initialSchoolApplications;
  });
  const [transportRoutes, setTransportRoutes] = useState<TransportRouteItem[]>(() => {
    const saved = localStorage.getItem('i2a_transport_routes');
    return saved ? JSON.parse(saved) : initialTransportRoutes;
  });

  // Sync dark mode
  useEffect(() => {
    localStorage.setItem('i2a_dark', String(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Save branding
  useEffect(() => {
    localStorage.setItem('i2a_branding', JSON.stringify(branding));
  }, [branding]);

  // Save tenants
  useEffect(() => {
    localStorage.setItem('i2a_tenants', JSON.stringify(tenants));
  }, [tenants]);

  // Save students
  useEffect(() => {
    localStorage.setItem('i2a_students', JSON.stringify(students));
  }, [students]);

  // Save admissions
  useEffect(() => {
    localStorage.setItem('i2a_admissions', JSON.stringify(admissions));
  }, [admissions]);

  // Save receipts
  useEffect(() => {
    localStorage.setItem('i2a_receipts', JSON.stringify(feeReceipts));
  }, [feeReceipts]);

  // Save school applications
  useEffect(() => {
    localStorage.setItem('i2a_school_applications', JSON.stringify(schoolApplications));
  }, [schoolApplications]);

  // Save transport routes
  useEffect(() => {
    localStorage.setItem('i2a_transport_routes', JSON.stringify(transportRoutes));
  }, [transportRoutes]);

  const logAction = (action: string, module: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toLocaleString('en-IN'),
      user: currentRole === 'PRINCIPAL' ? branding.principalName : `User (${currentRole})`,
      role: currentRole,
      action,
      module,
      details,
      ipAddress: '192.168.1.100'
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const updateBranding = (newBranding: Partial<SchoolBranding>) => {
    setBranding((prev) => ({ ...prev, ...newBranding }));
    logAction('UPDATE_BRANDING', 'SCHOOL_SETUP', 'Updated school identity & theme configurations');
  };

  const addStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `std-${Date.now()}`
    };
    setStudents((prev) => [...prev, newStudent]);
    logAction('ADD_STUDENT', 'STUDENT_MANAGEMENT', `Created digital profile for ${newStudent.name}`);
  };

  const updateStudent = (id: string, updated: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    logAction('UPDATE_STUDENT', 'STUDENT_MANAGEMENT', `Updated student data for ID ${id}`);
  };

  const addAdmission = (appData: Omit<OnlineAdmissionApplication, 'id' | 'applicationNo' | 'submittedDate'>) => {
    const appNo = `APP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newApp: OnlineAdmissionApplication = {
      ...appData,
      id: `adm-${Date.now()}`,
      applicationNo: appNo,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'SUBMITTED'
    };
    setAdmissions((prev) => [newApp, ...prev]);
    logAction('ONLINE_ADMISSION_SUBMIT', 'ONLINE_ADMISSION', `Parent submitted application ${appNo} for ${newApp.studentName}`);
  };

  const updateAdmissionStatus = (id: string, status: OnlineAdmissionApplication['status'], score?: number, remarks?: string) => {
    setAdmissions((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status, interviewScore: score ?? app.interviewScore, remarks: remarks ?? app.remarks } : app
      )
    );
    logAction('UPDATE_ADMISSION_STATUS', 'ONLINE_ADMISSION', `Application ${id} status updated to ${status}`);
  };

  const approveAdmissionAndCreateStudent = (id: string) => {
    const app = admissions.find((a) => a.id === id);
    if (!app) return;

    // Zero-Manual Automation Pipeline: Create Student Profile instantly
    const newAdmissionNo = String(1000 + students.length + 1);
    const newStudent: Student = {
      id: `std-${Date.now()}`,
      admissionNo: newAdmissionNo,
      rollNo: String(students.filter((s) => s.className === app.applyingClass).length + 1),
      name: app.studentName,
      photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
      dob: '2013-03-15',
      gender: 'MALE',
      className: app.applyingClass,
      section: 'A',
      fatherName: app.parentName,
      motherName: 'Parent Guardian',
      parentMobile: app.phone,
      parentWhatsApp: app.phone,
      parentEmail: app.email,
      address: 'Registered Admission Address',
      admissionDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      documents: { birthCertificate: 'Uploaded' },
      assignedSubjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'],
      attendanceRate: 100
    };

    setStudents((prev) => [...prev, newStudent]);
    setAdmissions((prev) => prev.map((a) => (a.id === id ? { ...a, status: 'ENROLLED', approvedBy: branding.principalName } : a)));

    logAction(
      'ZERO_MANUAL_ADMISSION_AUTOMATION',
      'ONLINE_ADMISSION',
      `Approved application ${app.applicationNo}. Automatically generated Student Profile #${newAdmissionNo}, Parent Account, Class Allocation, and Fee Ledger.`
    );
  };

  const addFeeType = (fee: Omit<FeeType, 'id'>) => {
    const newFee: FeeType = { ...fee, id: `fee-${Date.now()}` };
    setFeeTypes((prev) => [...prev, newFee]);
    logAction('CREATE_FEE_TYPE', 'FEE_MANAGEMENT', `Created fee type ${fee.name} (₹${fee.amount})`);
  };

  const processFeePayment = (studentId: string, feeIds: string[], paymentMode: FeeReceipt['paymentMode']): FeeReceipt => {
    const std = students.find((s) => s.id === studentId) || students[0];
    const selectedFees = feeTypes.filter((f) => feeIds.includes(f.id));
    const total = selectedFees.reduce((acc, f) => acc + f.amount, 0);

    const rcpNo = `INV-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const newReceipt: FeeReceipt = {
      id: `rcp-${Date.now()}`,
      receiptNo: rcpNo,
      studentId: std.id,
      studentName: std.name,
      admissionNo: std.admissionNo,
      className: std.className,
      section: std.section,
      feeBreakup: selectedFees.map((f) => ({ feeName: f.name, amount: f.amount })),
      totalAmount: total,
      paidAmount: total,
      balanceAmount: 0,
      paymentMode,
      transactionId: `${paymentMode}-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
      paymentDate: new Date().toLocaleString('en-IN'),
      status: 'SUCCESS',
      emailSent: true,
      whatsappSent: true
    };

    setFeeReceipts((prev) => [newReceipt, ...prev]);

    logAction(
      'AUTOMATIC_FEE_COLLECTION',
      'FEE_MANAGEMENT',
      `Processed payment ${rcpNo} for ${std.name} (₹${total}). Auto-triggered PDF Receipt, WhatsApp alert, and Email invoice.`
    );

    return newReceipt;
  };

  const addQuestionToBank = (q: Omit<QuestionBankItem, 'id'>) => {
    const newQ: QuestionBankItem = { ...q, id: `q-${Date.now()}` };
    setQuestionBank((prev) => [...prev, newQ]);
    logAction('ADD_QUESTION', 'AI_QUESTION_BANK', `Added ${q.type} question to ${q.subject}`);
  };

  const generateAIExamPaper = (params: { className: string; subject: string; title: string; marks: number; duration: number }): ExamPaper => {
    const suitableQuestions = questionBank.filter((q) => q.className === params.className || q.subject === params.subject);
    const selectedQ = suitableQuestions.length > 0 ? suitableQuestions : initialQuestions;

    const newPaper: ExamPaper = {
      id: `ex-${Date.now()}`,
      paperTitle: params.title,
      className: params.className,
      subject: params.subject,
      totalMarks: params.marks,
      durationMinutes: params.duration,
      questions: selectedQ,
      status: 'AI_DRAFT',
      generatedDate: new Date().toISOString().split('T')[0]
    };

    setExamPapers((prev) => [newPaper, ...prev]);
    logAction(
      'ONE_CLICK_AI_PAPER_GENERATOR',
      'EXAM_AI',
      `AI Generated Question Paper: ${params.title} (${params.marks} Marks, ${params.duration} Mins). Workflow Status: AI_DRAFT (Awaiting Teacher Review).`
    );

    return newPaper;
  };

  const updateExamPaperStatus = (id: string, status: ExamPaper['status']) => {
    setExamPapers((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, status, approvedBy: status === 'APPROVED' ? branding.principalName : p.approvedBy } : p
      )
    );
    logAction('EXAM_APPROVAL_WORKFLOW', 'EXAM_AI', `Paper ID ${id} status updated to ${status}`);
  };

  const submitStudentExam = (submissionData: Omit<OnlineExamSubmission, 'id' | 'submittedAt' | 'score' | 'percentage' | 'grade' | 'status'>) => {
    // Auto-calculate objective answers
    let score = 0;
    let totalMarks = 0;

    const paper = examPapers.find((p) => p.id === submissionData.examPaperId);

    const gradedAnswers = submissionData.answers.map((ans) => {
      const q = paper?.questions.find((item) => item.id === ans.questionId);
      const qMarks = q?.marks || 1;
      totalMarks += qMarks;

      if (q?.type === 'MCQ' || q?.type === 'TRUE_FALSE' || q?.type === 'FILL_BLANKS') {
        const isRight = ans.studentAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
        const earned = isRight ? qMarks : 0;
        score += earned;
        return { ...ans, marksObtained: earned, isCorrect: isRight };
      }

      // Subjective auto-draft score
      score += 0;
      return { ...ans, marksObtained: 0 };
    });

    const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
    const grade = percentage >= 90 ? 'A+' : percentage >= 75 ? 'A' : percentage >= 60 ? 'B' : 'C';

    const newSub: OnlineExamSubmission = {
      ...submissionData,
      id: `sub-${Date.now()}`,
      submittedAt: new Date().toLocaleString('en-IN'),
      score,
      totalMarks: totalMarks || 30,
      percentage: Number(percentage.toFixed(1)),
      grade,
      status: 'EVALUATED',
      answers: gradedAnswers
    };

    setExamSubmissions((prev) => [newSub, ...prev]);
    logAction('ONLINE_EXAM_SUBMIT', 'ONLINE_EXAMINATION', `Student ${submissionData.studentName} submitted exam ${submissionData.examTitle}. Auto Objective Score: ${score}/${totalMarks}`);
  };

  const gradeSubjectiveAnswers = (submissionId: string, grades: { questionId: string; marks: number; comment?: string }[]) => {
    setExamSubmissions((prev) =>
      prev.map((sub) => {
        if (sub.id !== submissionId) return sub;

        let additionalScore = 0;
        const updatedAnswers = sub.answers.map((ans) => {
          const g = grades.find((item) => item.questionId === ans.questionId);
          if (g) {
            additionalScore += g.marks;
            return { ...ans, marksObtained: g.marks, teacherComment: g.comment };
          }
          return ans;
        });

        const newTotalScore = sub.score + additionalScore;
        const newPercentage = Number(((newTotalScore / sub.totalMarks) * 100).toFixed(1));
        const newGrade = newPercentage >= 90 ? 'A+' : newPercentage >= 75 ? 'A' : newPercentage >= 60 ? 'B' : 'C';

        return {
          ...sub,
          score: newTotalScore,
          percentage: newPercentage,
          grade: newGrade,
          status: 'EVALUATED',
          answers: updatedAnswers
        };
      })
    );
    logAction('TEACHER_SUBJECTIVE_GRADING', 'EXAM_EVALUATION', `Teacher updated subjective marks for submission ${submissionId}`);
  };

  const disbursePayroll = (recordId: string) => {
    setPayrollRecords((prev) =>
      prev.map((p) => (p.id === recordId ? { ...p, status: 'DISBURSED', disbursedDate: new Date().toISOString().split('T')[0] } : p))
    );
    logAction('DISBURSE_PAYROLL', 'STAFF_PAYROLL', `Payroll disbursed for record ${recordId}`);
  };

  const addExpense = (expData: Omit<SchoolExpense, 'id'>) => {
    const newExp: SchoolExpense = { ...expData, id: `exp-${Date.now()}` };
    setExpenses((prev) => [newExp, ...prev]);
    logAction('RECORD_EXPENSE', 'EXPENSE_MANAGEMENT', `Recorded expense ₹${expData.amount} for ${expData.title}`);
  };

  const registerSchool = (params: {
    name: string;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    city: string;
    board: 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'IB';
    planId: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
    billingCycle: 'MONTHLY' | 'YEARLY';
  }): SchoolTenant => {
    const num = Math.floor(100000 + Math.random() * 900000);
    const newSchoolId = `I2A-SCH-${num}`;
    const plan = initialSubscriptionPlans.find((p) => p.id === params.planId) || initialSubscriptionPlans[1];

    const newTenant: SchoolTenant = {
      id: newSchoolId,
      name: params.name,
      code: params.name.substring(0, 3).toUpperCase() + '-' + params.city.toUpperCase(),
      board: params.board,
      city: params.city,
      adminName: params.adminName,
      adminEmail: params.adminEmail,
      adminPhone: params.adminPhone,
      planId: params.planId,
      planName: plan.name,
      billingCycle: params.billingCycle,
      subscriptionStatus: 'TRIAL',
      registeredAt: new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      studentLimit: plan.maxStudents,
      isOnboarded: false
    };

    const updatedTenants = [newTenant, ...tenants];
    setTenants(updatedTenants);
    localStorage.setItem('i2a_tenants', JSON.stringify(updatedTenants));

    const newBranding: SchoolBranding = {
      id: newSchoolId,
      name: params.name,
      tagline: 'Excellence in Education',
      logoUrl: '',
      stampUrl: '',
      principalSignatureUrl: '',
      primaryColor: '#4F46E5',
      secondaryColor: '#06B6D4',
      address: `${params.city}, India`,
      phone: params.adminPhone,
      email: params.adminEmail,
      whatsappNumber: params.adminPhone,
      website: `${params.name.toLowerCase().replace(/\s+/g, '')}.schoolos.in`,
      principalName: params.adminName,
      regNumber: `REG-${newSchoolId}`,
      board: params.board,
      medium: 'ENGLISH',
      academicSession: '2026-2027',
      invoiceHeader: params.name.toUpperCase(),
      invoiceFooter: 'Digital Fee Receipt authorized by i2A SchoolOS.',
      reportCardTheme: 'EMERALD_MODERN',
      certificateTheme: 'OFFICIAL'
    };
    setBranding(newBranding);

    logAction('REGISTER_SCHOOL', 'PLATFORM', `New school registered: ${params.name} (School ID: ${newSchoolId})`);
    return newTenant;
  };

  const loginToSchool = (schoolId: string, role?: UserRole) => {
    setActiveSchoolId(schoolId);
    const targetTenant = tenants.find((t) => t.id === schoolId) || tenants[0];
    setBranding((prev) => ({
      ...prev,
      id: targetTenant.id,
      name: targetTenant.name,
      principalName: targetTenant.adminName,
      email: targetTenant.adminEmail,
      board: targetTenant.board
    }));

    if (role) {
      setCurrentRole(role);
      if (role === 'SUPER_ADMIN') {
        setViewMode('PLATFORM_ADMIN');
        return;
      }
    }
    setViewMode('SCHOOL_PORTAL');
    if (!targetTenant.isOnboarded) {
      setActiveModule('school_setup');
    } else {
      setActiveModule('principal_dashboard');
    }
  };

  const updateTenantSubscription = (schoolId: string, status: string, planId: string) => {
    const plan = initialSubscriptionPlans.find((p) => p.id === planId) || initialSubscriptionPlans[1];
    setTenants((prev) =>
      prev.map((t) =>
        t.id === schoolId
          ? {
              ...t,
              subscriptionStatus: status as any,
              planId: planId as any,
              planName: plan.name,
              studentLimit: plan.maxStudents
            }
          : t
      )
    );
    logAction('UPDATE_SUBSCRIPTION', 'PLATFORM', `Updated subscription for ${schoolId} -> Plan: ${plan.name}, Status: ${status}`);
  };

  const toggleSchoolSuspension = (schoolId: string) => {
    setTenants((prev) =>
      prev.map((t) => {
        if (t.id !== schoolId) return t;
        const newStatus = t.subscriptionStatus === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        return { ...t, subscriptionStatus: newStatus };
      })
    );
    logAction('TOGGLE_SUSPENSION', 'PLATFORM', `Toggled suspension state for school ${schoolId}`);
  };

  const submitSchoolRegistrationApplication = (
    data: Omit<SchoolRegistrationApplication, 'id' | 'applicationNo' | 'submittedDate' | 'status'>
  ): SchoolRegistrationApplication => {
    const appNo = `REG-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const newApp: SchoolRegistrationApplication = {
      ...data,
      id: `APP-SCH-${Date.now()}`,
      applicationNo: appNo,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'PENDING_VERIFICATION'
    };
    setSchoolApplications((prev) => [newApp, ...prev]);
    logAction(
      'SCHOOL_APPLICATION_SUBMITTED',
      'PLATFORM_ADMIN',
      `School ${data.schoolName} applied directly. Application No: ${appNo}. Domain Choice: ${data.domainType}`
    );
    return newApp;
  };

  const approveSchoolApplication = (appId: string): SchoolTenant => {
    const app = schoolApplications.find((a) => a.id === appId);
    if (!app) throw new Error('Application not found');

    const nextIdNum = tenants.length + 1;
    const formattedId = `I2A-SCH-${String(nextIdNum).padStart(6, '0')}`;
    const cleanCode = app.schoolName
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4);

    const plan = initialSubscriptionPlans.find((p) => p.id === app.planId) || initialSubscriptionPlans[1];
    const registeredDate = new Date().toISOString().split('T')[0];
    const expDate = new Date();
    expDate.setFullYear(expDate.getFullYear() + 1);

    const newTenant: SchoolTenant = {
      id: formattedId,
      name: app.schoolName,
      code: `${cleanCode}-${app.city.toUpperCase()}`,
      board: app.board,
      city: app.city,
      adminName: app.adminName,
      adminEmail: app.adminEmail,
      adminPhone: app.adminPhone,
      planId: app.planId,
      planName: plan.name,
      billingCycle: 'YEARLY',
      subscriptionStatus: 'ACTIVE',
      registeredAt: registeredDate,
      expiresAt: expDate.toISOString().split('T')[0],
      studentLimit: plan.maxStudents,
      isOnboarded: true
    };

    setTenants((prev) => [...prev, newTenant]);
    setSchoolApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: 'APPROVED' } : a))
    );

    const websiteUrl =
      app.domainType === 'CUSTOM_DOMAIN' && app.customDomain
        ? app.customDomain
        : `${app.subdomainSlug || 'school'}.i2aschool.com`;

    logAction(
      'SCHOOL_VERIFIED_AND_APPROVED',
      'PLATFORM_ADMIN',
      `Verified & Approved school ${app.schoolName} (${formattedId}). Live Website activated: ${websiteUrl} with SSL.`
    );

    return newTenant;
  };

  const rejectSchoolApplication = (appId: string, reason: string) => {
    setSchoolApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: 'REJECTED', rejectionReason: reason } : a))
    );
    logAction(
      'SCHOOL_APPLICATION_REJECTED',
      'PLATFORM_ADMIN',
      `Application ${appId} was rejected. Reason: ${reason}`
    );
  };

  const addTransportRoute = (route: Omit<TransportRouteItem, 'id'>) => {
    const newRoute: TransportRouteItem = {
      ...route,
      id: `TR-${Date.now()}`
    };
    setTransportRoutes((prev) => [...prev, newRoute]);
    logAction(
      'CREATE_TRANSPORT_ROUTE',
      'TRANSPORT',
      `Created transport route ${route.routeNumber} with ${route.stops.length} stops.`
    );
  };

  const updateTransportStatus = (
    routeId: string,
    status: TransportRouteItem['liveStatus'],
    location?: string
  ) => {
    setTransportRoutes((prev) =>
      prev.map((r) =>
        r.id === routeId
          ? { ...r, liveStatus: status, currentLocation: location ?? r.currentLocation }
          : r
      )
    );
    logAction(
      'UPDATE_TRANSPORT_STATUS',
      'TRANSPORT',
      `Route ${routeId} live status updated to ${status}`
    );
  };

  const submitSchoolAdmission = (appData: {
    studentName: string;
    applyingClass: string;
    parentName: string;
    phone: string;
    email: string;
    remarks?: string;
  }): OnlineAdmissionApplication => {
    const appNo = `APP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newApp: OnlineAdmissionApplication = {
      ...appData,
      id: `adm-${Date.now()}`,
      applicationNo: appNo,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'SUBMITTED',
      documentsUploaded: true
    };
    setAdmissions((prev) => [newApp, ...prev]);
    logAction(
      'PUBLIC_WEBSITE_ADMISSION_APPLICATION',
      'ONLINE_ADMISSION',
      `Candidate ${appData.studentName} applied via School Dedicated Website. Awaiting Principal Approval.`
    );
    return newApp;
  };

  const returnToPublicSaas = () => {
    setViewMode('PUBLIC_SAAS');
  };

  const resetSeedData = () => {
    localStorage.clear();
    setTenants(initialTenants);
    setBranding(initialBranding);
    setStudents(initialStudents);
    setAdmissions(initialAdmissions);
    setFeeTypes(initialFeeTypes);
    setFeeReceipts(initialReceipts);
    setExamPapers(initialExamPapers);
    setExamSubmissions(initialSubmissions);
    setExpenses(initialExpenses);
    setAuditLogs(initialAuditLogs);
    setSchoolApplications(initialSchoolApplications);
    setTransportRoutes(initialTransportRoutes);
    logAction('RESET_SYSTEM', 'CORE', 'System restored to initial clean production seed state.');
  };

  return (
    <SchoolContext.Provider
      value={{
        viewMode,
        setViewMode,
        activeSchoolId,
        tenants,
        activeTenant,
        subscriptionPlans: initialSubscriptionPlans,
        registerSchool,
        loginToSchool,
        updateTenantSubscription,
        toggleSchoolSuspension,
        returnToPublicSaas,
        currentRole,
        setCurrentRole,
        darkMode,
        setDarkMode,
        activeModule,
        setActiveModule,
        branding,
        updateBranding,
        students,
        addStudent,
        updateStudent,
        admissions,
        addAdmission,
        updateAdmissionStatus,
        approveAdmissionAndCreateStudent,
        feeTypes,
        addFeeType,
        feeReceipts,
        processFeePayment,
        digitalBooks,
        questionBank,
        addQuestionToBank,
        examPapers,
        generateAIExamPaper,
        updateExamPaperStatus,
        examSubmissions,
        submitStudentExam,
        gradeSubjectiveAnswers,
        staffList,
        payrollRecords,
        disbursePayroll,
        expenses,
        addExpense,
        auditLogs,
        logAction,
        schoolApplications,
        submitSchoolRegistrationApplication,
        approveSchoolApplication,
        rejectSchoolApplication,
        transportRoutes,
        addTransportRoute,
        updateTransportStatus,
        submitSchoolAdmission,
        resetSeedData
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
};

export const useSchool = () => {
  const ctx = useContext(SchoolContext);
  if (!ctx) throw new Error('useSchool must be used within SchoolProvider');
  return ctx;
};
