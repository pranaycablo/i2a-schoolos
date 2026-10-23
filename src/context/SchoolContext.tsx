import React, { createContext, useContext, useState, useEffect } from 'react';
import { translate, AppLanguage } from '../utils/translations';
import {
  authApi,
  tenantsApi,
  studentsApi,
  admissionsApi,
  feeApi,
  operationsApi,
  notificationsApi,
  auditLogsApi,
  healthApi,
  examApi,
  setAuthToken,
  getAuthToken,
  clearAuth
} from '../services/apiClient';
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
  AuditLog,
  SystemNotification,
  DispatchedEmailPayload
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

export interface SchoolTenantLocation {
  street?: string;
  locality?: string;
  city?: string;
  district?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  isGeocoded?: boolean;
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
  branchCount?: number;
  branches?: any[];
  location?: SchoolTenantLocation;
  branding?: any;
  category?: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId: string;
  studentId?: string;
  childrenIds?: string[];
  assignedClasses?: string[];
}

interface SchoolContextType {
  // View Mode & Multi-Tenant State
  viewMode: 'PUBLIC_SAAS' | 'SCHOOL_PORTAL' | 'PLATFORM_ADMIN' | 'LOGIN';
  setViewMode: (mode: 'PUBLIC_SAAS' | 'SCHOOL_PORTAL' | 'PLATFORM_ADMIN' | 'LOGIN') => void;
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
  onboardSchool: (params: {
    name: string;
    code?: string;
    board?: 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'IB';
    category?: string;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    planId: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
    billingCycle?: 'MONTHLY' | 'YEARLY';
    address?: SchoolTenantLocation;
    initialBranch?: {
      branchCode?: string;
      name?: string;
      capacity?: number;
    };
  }) => Promise<{ success: boolean; tenant?: SchoolTenant; error?: string }>;
  updateSchoolLocation: (schoolId: string, location: SchoolTenantLocation) => Promise<{ success: boolean; error?: string }>;
  loginToSchool: (schoolId: string, role?: UserRole, user?: AuthUser) => void;
  updateTenantSubscription: (schoolId: string, status: string, planId: string) => void;
  toggleSchoolSuspension: (schoolId: string) => void;
  returnToPublicSaas: () => void;

  // Theme & Role & Language
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string) => string;
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
  updateLeadStage: (id: string, stage: NonNullable<OnlineAdmissionApplication['leadStage']>, counselorNotes?: string) => void;
  triggerWhatsAppLeadMessage: (app: OnlineAdmissionApplication) => string;

  feeTypes: FeeType[];
  addFeeType: (fee: Omit<FeeType, 'id'>) => void;

  feeReceipts: FeeReceipt[];
  processFeePayment: (studentId: string, feeIds: string[], paymentMode: FeeReceipt['paymentMode'], idempotencyKey?: string) => Promise<{ success: boolean; receipt?: FeeReceipt; error?: string }>;

  currentUser: AuthUser | null;
  setCurrentUser: (u: AuthUser | null) => void;
  selectedChildId: string;
  setSelectedChildId: (id: string) => void;

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
    address?: string;
    city?: string;
    whatsappNumber?: string;
  }) => OnlineAdmissionApplication;

  // Helper actions
  resetSeedData: () => void;

  // Automated Credentials & Notification Engine
  notifications: SystemNotification[];
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  dispatchCredentialsNotification: (params: {
    recipientType: 'SCHOOL' | 'STAFF' | 'STUDENT' | 'PARENT';
    recipientName: string;
    recipientEmail: string;
    recipientPhone?: string;
    schoolName?: string;
    schoolId?: string;
    role: string;
    loginId: string;
    username: string;
    password?: string;
  }) => SystemNotification;

  // Backend Connection & Synchronization Engine
  isBackendConnected: boolean;
  isSyncing: boolean;
  backendError: string | null;
  syncWithBackend: () => Promise<void>;
  loginWithCredentials: (email: string, password: string) => Promise<boolean>;
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
  certificateTheme: 'OFFICIAL',
  promotionalVideoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
  promotionalVideoTitle: 'ABC Public School Campus Tour, Smart Labs & Achievements',
  promotionalVideoPoster: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=800&auto=format&fit=crop&q=80',
  galleryImages: [
    { url: 'https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600&auto=format&fit=crop&q=80', title: 'Main Campus & Sports Ground', category: 'CAMPUS' },
    { url: 'https://images.unsplash.com/photo-1562774053-701939374585?w=600&auto=format&fit=crop&q=80', title: 'Smart Interactive Classrooms', category: 'ACADEMICS' },
    { url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=600&auto=format&fit=crop&q=80', title: 'Robotics & STEM Science Lab', category: 'LABS' },
    { url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600&auto=format&fit=crop&q=80', title: 'Central Digital Library', category: 'LIBRARY' }
  ],
  admissionsOpenText: 'Admissions Open for Academic Session 2026-27 (Nursery to Class XII)',
  brochurePdfUrl: '/docs/ABC_Public_School_Prospectus_2026.pdf',
  whatsappAutoReplyTemplate: 'नमस्ते {{parentName}} जी, {{schoolName}} में प्रवेश संबंधी जानकारी प्राप्त करने के लिए धन्यवाद! 🎓 कक्षा: {{className}}। 📖 डिजिटल प्रॉस्पेक्टस व फॉर्म देखने के लिए क्लिक करें: {{prospectusUrl}} | 📲 आधिकारिक वेब-ऐप डाउनलोड करें: {{appUrl}}'
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
    whatsappNumber: '9811223344',
    email: 'mahesh.patel@gmail.com',
    address: 'Flat 402, Shanti Vihar, Baily Road',
    city: 'Patna',
    leadStage: 'NEW_LEAD',
    leadScore: 92,
    autoMessageSent: true,
    autoMessageTimestamp: '10:15 AM',
    status: 'SUBMITTED',
    submittedDate: '2026-10-06',
    documentsUploaded: true,
    remarks: 'Waiting for Document Verification'
  },
  {
    id: 'adm-003',
    applicationNo: 'APP-2026-091',
    studentName: 'Devansh Verma',
    applyingClass: 'Class X',
    parentName: 'Rakesh Verma',
    phone: '9876543211',
    whatsappNumber: '9876543211',
    email: 'rakesh.verma@parent.test',
    address: 'Sector 5, Mansarovar',
    city: 'Jaipur',
    leadStage: 'CAMPUS_VISIT',
    leadScore: 88,
    autoMessageSent: true,
    autoMessageTimestamp: 'Yesterday 04:30 PM',
    status: 'DOCS_VERIFIED',
    submittedDate: '2026-10-05',
    documentsUploaded: true,
    remarks: 'Campus tour scheduled for Saturday 11:00 AM'
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
    isOnboarded: true,
    branchCount: 2,
    location: {
      street: 'Bailey Road, Near Golf Course',
      locality: 'Shastri Nagar',
      city: 'Patna',
      district: 'Patna',
      state: 'Bihar',
      postalCode: '800001',
      country: 'IN',
      latitude: 25.5941,
      longitude: 85.1376,
      isGeocoded: true
    },
    branches: [
      {
        id: 'BR-I2A-SCH-000001-MAIN',
        branchCode: 'MAIN',
        name: 'ABC Public School (Main Campus)',
        displayName: 'Main Campus - Bailey Road',
        isMainBranch: true,
        status: 'ACTIVE',
        capacity: 1000,
        address: {
          street: 'Bailey Road, Near Golf Course',
          city: 'Patna',
          district: 'Patna',
          state: 'Bihar',
          postalCode: '800001',
          country: 'IN',
          latitude: 25.5941,
          longitude: 85.1376
        }
      },
      {
        id: 'BR-I2A-SCH-000001-KANKAR',
        branchCode: 'KANKAR',
        name: 'ABC Junior Wing (Kankarbagh)',
        displayName: 'Junior Wing - Kankarbagh Colony',
        isMainBranch: false,
        status: 'ACTIVE',
        capacity: 450,
        address: {
          street: 'Kankarbagh Main Road, Doctors Colony',
          city: 'Patna',
          district: 'Patna',
          state: 'Bihar',
          postalCode: '800020',
          country: 'IN',
          latitude: 25.5912,
          longitude: 85.1584
        }
      }
    ]
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
    isOnboarded: false,
    branchCount: 1,
    location: {
      street: 'Gandhi Maidan Road, West Gate',
      locality: 'Muradpur',
      city: 'Patna',
      district: 'Patna',
      state: 'Bihar',
      postalCode: '800004',
      country: 'IN',
      latitude: 25.6179,
      longitude: 85.1415,
      isGeocoded: true
    },
    branches: [
      {
        id: 'BR-I2A-SCH-000002-MAIN',
        branchCode: 'MAIN',
        name: 'St. Xavier Senior Secondary School (Main)',
        displayName: 'Gandhi Maidan Campus',
        isMainBranch: true,
        status: 'ACTIVE',
        capacity: 600,
        address: {
          street: 'Gandhi Maidan Road, West Gate',
          city: 'Patna',
          district: 'Patna',
          state: 'Bihar',
          postalCode: '800004',
          country: 'IN',
          latitude: 25.6179,
          longitude: 85.1415
        }
      }
    ]
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

const initialSystemNotifications: SystemNotification[] = [
  {
    id: 'notif-1',
    type: 'SCHOOL_CREDENTIALS',
    title: 'School Credentials Dispatched: ABC Public School',
    message: 'Login credentials and Mobile WebApp access link dispatched to info@abcpublicschool.edu.in for Principal Dr. Ramesh Chandra Sharma.',
    recipientEmail: 'info@abcpublicschool.edu.in',
    recipientName: 'Dr. Ramesh Chandra Sharma',
    recipientRole: 'PRINCIPAL',
    timestamp: 'Just now',
    read: false,
    emailPayload: {
      to: 'info@abcpublicschool.edu.in',
      recipientName: 'Dr. Ramesh Chandra Sharma',
      subject: 'Welcome to i2A SchoolOS — Your Campus Credentials & WebApp Access',
      schoolName: 'ABC Public School',
      schoolId: 'I2A-SCH-000001',
      role: 'PRINCIPAL',
      loginId: 'I2A-SCH-000001',
      username: 'info@abcpublicschool.edu.in',
      password: 'Admin@2026#Secure',
      loginUrl: 'https://pranaycablo.github.io/i2a-schoolos/',
      webAppDownloadUrl: 'https://pranaycablo.github.io/i2a-schoolos/',
      dispatchedAt: '2026-10-12 18:30 IST'
    }
  },
  {
    id: 'notif-2',
    type: 'STUDENT_CREDENTIALS',
    title: 'Student & Parent Credentials Dispatched: Rahul Kumar',
    message: 'Portal access ID & default password sent to sanjay.kumar@gmail.com for Class VIII-A with PWA download link.',
    recipientEmail: 'sanjay.kumar@gmail.com',
    recipientName: 'Rahul Kumar (Ward of Sanjay Kumar)',
    recipientRole: 'STUDENT',
    timestamp: '10 mins ago',
    read: false,
    emailPayload: {
      to: 'sanjay.kumar@gmail.com',
      recipientName: 'Rahul Kumar (Parent: Sanjay Kumar)',
      subject: 'i2A SchoolOS Student & Parent Portal Credentials & WebApp Download',
      schoolName: 'ABC Public School',
      schoolId: 'I2A-SCH-000001',
      role: 'STUDENT & PARENT',
      loginId: 'std-1024 / Adm #1024',
      username: '9876543210',
      password: 'Student@2026',
      loginUrl: 'https://pranaycablo.github.io/i2a-schoolos/',
      webAppDownloadUrl: 'https://pranaycablo.github.io/i2a-schoolos/',
      dispatchedAt: '2026-10-12 18:20 IST'
    }
  }
];

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export const SchoolProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // SaaS Multi-Tenant Platform State
  const [viewMode, setViewMode] = useState<'PUBLIC_SAAS' | 'SCHOOL_PORTAL' | 'PLATFORM_ADMIN' | 'LOGIN'>(() => {
    try {
      if (typeof window !== 'undefined') {
        const search = window.location.search || '';
        const path = window.location.pathname || '';
        if (
          search.includes('token=') ||
          search.includes('activateToken=') ||
          search.includes('invitationToken=') ||
          search.includes('resetOtp=') ||
          search.includes('view=LOGIN') ||
          path.includes('/activate') ||
          path.includes('/reset-password')
        ) {
          return 'LOGIN';
        }
        if (
          search.includes('view=SCHOOL_PORTAL') ||
          search.includes('view=school') ||
          search.includes('portal=school') ||
          search.includes('mode=school') ||
          window.location.hash.includes('school') ||
          window.location.hash.includes('portal')
        ) {
          return 'SCHOOL_PORTAL';
        }
        if (
          search.includes('view=PLATFORM_ADMIN') ||
          search.includes('view=superadmin') ||
          window.location.hash.includes('platform') ||
          window.location.hash.includes('superadmin')
        ) {
          return 'PLATFORM_ADMIN';
        }
      }
      const token = sessionStorage.getItem('i2a_auth_token');
      const userStr = sessionStorage.getItem('i2a_user');
      if (token && userStr) {
        const u = JSON.parse(userStr);
        if (u.role === 'SUPER_ADMIN') return 'PLATFORM_ADMIN';
        return 'SCHOOL_PORTAL';
      }
    } catch {}
    return 'PUBLIC_SAAS';
  });
  const [activeSchoolId, setActiveSchoolId] = useState<string>(() => {
    try {
      const userStr = sessionStorage.getItem('i2a_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.schoolId && u.schoolId !== 'ALL') return u.schoolId;
      }
    } catch {}
    return 'I2A-SCH-000001';
  });

  const [tenants, setTenants] = useState<SchoolTenant[]>(() => {
    const saved = localStorage.getItem('i2a_tenants');
    return saved ? JSON.parse(saved) : initialTenants;
  });

  const activeTenant = tenants.find((t) => t.id === activeSchoolId) || tenants[0];

  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    try {
      const userStr = sessionStorage.getItem('i2a_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role) return u.role;
      }
    } catch {}
    return 'PRINCIPAL';
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('i2a_dark') === 'true');
  const [activeModule, setActiveModule] = useState<string>(() => {
    try {
      const userStr = sessionStorage.getItem('i2a_user');
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.role === 'PARENT') return 'parent_portal';
        if (u.role === 'STUDENT') return 'student_portal';
        if (u.role === 'ACCOUNTANT') return 'fee_management';
        if (u.role === 'TEACHER') return 'attendance_timetable';
        if (u.role === 'TRANSPORT') return 'library_transport';
      }
    } catch {}
    return 'principal_dashboard';
  });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = sessionStorage.getItem('i2a_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [selectedChildId, setSelectedChildId] = useState<string>(() => {
    return sessionStorage.getItem('i2a_selected_child') || '';
  });

  useEffect(() => {
    if (currentUser?.role === 'PARENT') {
      const allowed = currentUser.childrenIds || (currentUser.studentId ? [currentUser.studentId] : []);
      if (allowed.length > 0 && (!selectedChildId || !allowed.includes(selectedChildId))) {
        setSelectedChildId(allowed[0]);
        sessionStorage.setItem('i2a_selected_child', allowed[0]);
      }
    }
  }, [currentUser, selectedChildId]);
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    return (localStorage.getItem('i2a_lang') as AppLanguage) || 'en';
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    localStorage.setItem('i2a_lang', lang);
  };

  const t = (key: string) => translate(key, language);

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

  const [digitalBooks, setDigitalBooks] = useState<DigitalBook[]>(initialBooks);
  const [questionBank, setQuestionBank] = useState<QuestionBankItem[]>(initialQuestions);
  const [examPapers, setExamPapers] = useState<ExamPaper[]>(initialExamPapers);
  const [examSubmissions, setExamSubmissions] = useState<OnlineExamSubmission[]>(initialSubmissions);
  const [staffList, setStaffList] = useState<Staff[]>(initialStaff);
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

  // Backend Connection & Synchronization States
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const ROLE_CREDENTIALS: Record<string, { email: string; pass: string }> = {
    SUPER_ADMIN: { email: 'superadmin@i2aschoolos.com', pass: 'SuperAdmin@2026#' },
    PRINCIPAL: { email: 'principal@abcpublicschool.edu.in', pass: 'Principal@2026#' },
    ADMIN: { email: 'admin@abcpublicschool.edu.in', pass: 'Admin@2026#' },
    TEACHER: { email: 'sunita.mishra@abcpublicschool.edu.in', pass: 'Teacher@2026#' },
    ACCOUNTANT: { email: 'alok.nath@abcpublicschool.edu.in', pass: 'Accountant@2026#' },
    STAFF: { email: 'office@abcpublicschool.edu.in', pass: 'Staff@2026#' },
    TRANSPORT: { email: 'driver.manoj@abcpublicschool.edu.in', pass: 'Transport@2026#' },
    PARENT: { email: 'sanjay.kumar@gmail.com', pass: 'Parent@2026#' },
    STUDENT: { email: 'rahul.kumar@abcpublicschool.edu.in', pass: 'Student@2026#' }
  };

  const syncWithBackend = async () => {
    setIsSyncing(true);
    try {
      const health = await healthApi.check();
      if (!health.ok) {
        setIsBackendConnected(false);
        setBackendError('Backend database offline');
        setIsSyncing(false);
        return;
      }
      setIsBackendConnected(true);
      setBackendError(null);

      // Fail closed: Do NOT auto-authenticate with mock/seed credentials
      let token = getAuthToken();
      if (!token) {
        // Unauthenticated session: fetch public tenant info only
        try {
          const tenantsRes = await tenantsApi.list();
          if (tenantsRes.ok && Array.isArray(tenantsRes.data) && tenantsRes.data.length > 0) {
            setTenants(tenantsRes.data as SchoolTenant[]);
            const curTenant = (tenantsRes.data as any[]).find((t) => t.id === activeSchoolId);
            if (curTenant?.branding) {
              setBranding(curTenant.branding);
            }
          }
        } catch {}
        setIsSyncing(false);
        return;
      }

      // Fetch tenants
      const tenantsRes = await tenantsApi.list();
      if (tenantsRes.ok && Array.isArray(tenantsRes.data) && tenantsRes.data.length > 0) {
        setTenants(tenantsRes.data as SchoolTenant[]);
        const curTenant = (tenantsRes.data as any[]).find((t) => t.id === activeSchoolId);
        if (curTenant?.branding) {
          setBranding(curTenant.branding);
        }
      }

      // Fetch students
      const studentsRes = await studentsApi.list(activeSchoolId);
      if (studentsRes.ok && Array.isArray(studentsRes.data)) {
        setStudents(studentsRes.data as Student[]);
      }

      // Fetch admissions
      const admissionsRes = await admissionsApi.list(activeSchoolId);
      if (admissionsRes.ok && Array.isArray(admissionsRes.data)) {
        setAdmissions(admissionsRes.data as OnlineAdmissionApplication[]);
      }

      // Fetch fee types & receipts
      const feeTypesRes = await feeApi.types.list(activeSchoolId);
      if (feeTypesRes.ok && Array.isArray(feeTypesRes.data)) {
        setFeeTypes(feeTypesRes.data as FeeType[]);
      }
      const receiptsRes = await feeApi.receipts.list(activeSchoolId);
      if (receiptsRes.ok && Array.isArray(receiptsRes.data)) {
        setFeeReceipts(receiptsRes.data as FeeReceipt[]);
      }

      // Fetch operations
      const staffRes = await operationsApi.staff.list(activeSchoolId);
      if (staffRes.ok && Array.isArray(staffRes.data)) {
        setStaffList(staffRes.data as Staff[]);
      }
      const payrollRes = await operationsApi.payroll.list(activeSchoolId);
      if (payrollRes.ok && Array.isArray(payrollRes.data)) {
        setPayrollRecords(payrollRes.data as PayrollRecord[]);
      }
      const expensesRes = await operationsApi.expenses.list(activeSchoolId);
      if (expensesRes.ok && Array.isArray(expensesRes.data)) {
        setExpenses(expensesRes.data as SchoolExpense[]);
      }
      const transportRes = await operationsApi.transport.list(activeSchoolId);
      if (transportRes.ok && Array.isArray(transportRes.data)) {
        setTransportRoutes(transportRes.data as TransportRouteItem[]);
      }

      // Fetch notifications & audit logs
      const notifsRes = await notificationsApi.list(activeSchoolId);
      if (notifsRes.ok && Array.isArray(notifsRes.data)) {
        setNotifications(notifsRes.data as SystemNotification[]);
      }
      const logsRes = await auditLogsApi.list(activeSchoolId);
      if (logsRes.ok && Array.isArray(logsRes.data)) {
        setAuditLogs(logsRes.data as AuditLog[]);
      }

      // Fetch exams & submissions
      const examsRes = await examApi.papers.list({ schoolId: activeSchoolId });
      if (examsRes.ok && Array.isArray(examsRes.data) && examsRes.data.length > 0) {
        setExamPapers(examsRes.data as ExamPaper[]);
      }
      const submissionsRes = await examApi.submissions({ schoolId: activeSchoolId });
      if (submissionsRes.ok && Array.isArray(submissionsRes.data) && submissionsRes.data.length > 0) {
        setExamSubmissions(submissionsRes.data as OnlineExamSubmission[]);
      }

      // Fetch digital library books
      const libraryRes = await operationsApi.library.list(activeSchoolId);
      if (libraryRes.ok && Array.isArray(libraryRes.data) && libraryRes.data.length > 0) {
        setDigitalBooks(libraryRes.data as DigitalBook[]);
      }
    } catch (err) {
      console.warn('Backend sync warning:', err);
      setIsBackendConnected(false);
      setBackendError(err instanceof Error ? err.message : 'Backend unreachable');
    } finally {
      setIsSyncing(false);
    }
  };

  const loginWithCredentials = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await authApi.login({ email, password });
      if (res.ok && res.data?.token) {
        setAuthToken(res.data.token);
        setCurrentRole(res.data.user.role as UserRole);
        if (res.data.user.schoolId && res.data.user.schoolId !== 'ALL') {
          setActiveSchoolId(res.data.user.schoolId);
        }
        setViewMode(res.data.user.role === 'SUPER_ADMIN' ? 'PLATFORM_ADMIN' : 'SCHOOL_PORTAL');
        await syncWithBackend();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    syncWithBackend();
  }, [activeSchoolId]);

  const [notifications, setNotifications] = useState<SystemNotification[]>(() => {
    const saved = localStorage.getItem('i2a_notifications');
    return saved ? JSON.parse(saved) : initialSystemNotifications;
  });

  useEffect(() => {
    localStorage.setItem('i2a_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    notificationsApi.markRead(id).catch((e) => console.warn('Notification read API error:', e));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    notificationsApi.clearRead().catch((e) => console.warn('Notification clear API error:', e));
  };

  const dispatchCredentialsNotification = (params: {
    recipientType: 'SCHOOL' | 'STAFF' | 'STUDENT' | 'PARENT';
    recipientName: string;
    recipientEmail: string;
    recipientPhone?: string;
    schoolName?: string;
    schoolId?: string;
    role: string;
    loginId: string;
    username: string;
    password?: string;
  }): SystemNotification => {
    // Privacy & Security: Never store cleartext passwords in notification payloads or client state
    const pwd = '•••••••••••• (Dispatched securely to recipient)';
    const schoolTitle = params.schoolName || branding.name;
    const schId = params.schoolId || activeTenant?.id || 'I2A-SCH-000001';

    const emailPayload: DispatchedEmailPayload = {
      to: params.recipientEmail,
      recipientName: params.recipientName,
      subject: `Official Login Credentials & WebApp Access — ${schoolTitle} (i2A SchoolOS)`,
      schoolName: schoolTitle,
      schoolId: schId,
      role: params.role,
      loginId: params.loginId,
      username: params.username,
      password: pwd,
      loginUrl: 'https://pranaycablo.github.io/i2a-schoolos/',
      webAppDownloadUrl: 'https://pranaycablo.github.io/i2a-schoolos/',
      dispatchedAt: new Date().toLocaleString('en-IN')
    };

    const newNotif: SystemNotification = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type: params.recipientType === 'SCHOOL' ? 'SCHOOL_CREDENTIALS' : params.recipientType === 'STAFF' ? 'STAFF_CREDENTIALS' : 'STUDENT_CREDENTIALS',
      title: params.recipientType === 'SCHOOL'
        ? `School Credentials Dispatched: ${schoolTitle}`
        : params.recipientType === 'STAFF'
        ? `Staff Credentials Dispatched: ${params.recipientName}`
        : `Student & Parent Credentials Dispatched: ${params.recipientName}`,
      message: `Login ID (${params.loginId}), password, and WebApp access link dispatched to ${params.recipientEmail}.`,
      recipientEmail: params.recipientEmail,
      recipientName: params.recipientName,
      recipientRole: params.role,
      timestamp: 'Just now',
      read: false,
      emailPayload
    };

    setNotifications((prev) => [newNotif, ...prev]);

    notificationsApi.dispatch({
      recipientType: params.recipientType,
      recipientName: params.recipientName,
      recipientEmail: params.recipientEmail,
      recipientPhone: params.recipientPhone,
      role: params.role,
      title: newNotif.title,
      message: newNotif.message,
      channel: 'EMAIL',
      schoolId: schId
    }).catch((e) => console.warn('Notification dispatch API error:', e));

    return newNotif;
  };

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
    setBranding((prev) => {
      const updated = { ...prev, ...newBranding };
      tenantsApi.updateBranding(activeSchoolId, updated).catch((e) => console.warn('Branding API sync error:', e));
      return updated;
    });
    logAction('UPDATE_BRANDING', 'SCHOOL_SETUP', 'Updated school identity & theme configurations');
  };

  const addStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `std-${Date.now()}`
    };
    setStudents((prev) => [...prev, newStudent]);
    logAction('ADD_STUDENT', 'STUDENT_MANAGEMENT', `Created digital profile for ${newStudent.name}`);

    // Persist to MongoDB API
    studentsApi.create({ ...newStudent, schoolId: activeSchoolId }).catch((e) => console.warn('Student API sync error:', e));

    // Auto-dispatch credentials & mobile webapp link to student & parent email
    if (newStudent.parentEmail) {
      dispatchCredentialsNotification({
        recipientType: 'STUDENT',
        recipientName: `${newStudent.name} (Parent: ${newStudent.fatherName || 'Parent'})`,
        recipientEmail: newStudent.parentEmail,
        recipientPhone: newStudent.parentMobile,
        schoolName: branding.name,
        schoolId: branding.id,
        role: 'STUDENT & PARENT',
        loginId: newStudent.admissionNo,
        username: newStudent.parentMobile || newStudent.admissionNo,
        password: 'Student@2026'
      });
    }
  };

  const updateStudent = (id: string, updated: Partial<Student>) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
    logAction('UPDATE_STUDENT', 'STUDENT_MANAGEMENT', `Updated student data for ID ${id}`);
    studentsApi.update(id, updated).catch((e) => console.warn('Student update API error:', e));
  };

  const addAdmission = (appData: Omit<OnlineAdmissionApplication, 'id' | 'applicationNo' | 'submittedDate'>) => {
    const appNo = `APP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newApp: OnlineAdmissionApplication = {
      ...appData,
      id: `adm-${Date.now()}`,
      applicationNo: appNo,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'SUBMITTED',
      leadStage: 'NEW_LEAD',
      leadScore: 90,
      autoMessageSent: true,
      autoMessageTimestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };
    setAdmissions((prev) => [newApp, ...prev]);
    logAction('ONLINE_ADMISSION_SUBMIT', 'ONLINE_ADMISSION', `Parent submitted application ${appNo} for ${newApp.studentName}`);
    admissionsApi.submitPublic({ ...newApp, schoolId: activeSchoolId }).catch((e) => console.warn('Admission API error:', e));
  };

  const updateAdmissionStatus = (id: string, status: OnlineAdmissionApplication['status'], score?: number, remarks?: string) => {
    setAdmissions((prev) =>
      prev.map((app) =>
        app.id === id ? { ...app, status, interviewScore: score ?? app.interviewScore, remarks: remarks ?? app.remarks } : app
      )
    );
    logAction('UPDATE_ADMISSION_STATUS', 'ONLINE_ADMISSION', `Application ${id} status updated to ${status}`);
    admissionsApi.updateStatus(id, { status, testScore: score, remarks }).catch((e) => console.warn('Admission status API error:', e));
  };

  const triggerWhatsAppLeadMessage = (app: OnlineAdmissionApplication): string => {
    const parentName = app.parentName || 'Parent';
    const studentName = app.studentName || 'Student';
    const className = app.applyingClass || 'Class';
    const schoolName = branding.name || 'ABC Public School';
    const phone = app.whatsappNumber || app.phone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const prospectusUrl = 'https://' + (branding.website || 'abcpublicschool.i2aschool.com') + '/prospectus';
    const appUrl = 'https://' + (branding.website || 'abcpublicschool.i2aschool.com') + '/#school';

    const message = 'नमस्ते ' + parentName + ' जी,\n' + schoolName + ' में ' + studentName + ' के प्रवेश संबंधी जानकारी प्राप्त करने के लिए धन्यवाद!\n\n🎓 कक्षा: ' + className + ' (सत्र 2026-27)\n📖 डिजिटल प्रॉस्पेक्टस देखें: ' + prospectusUrl + '\n📲 आधिकारिक स्कूल वेब-ऐप डाउनलोड करें: ' + appUrl + '\n\nहमारे प्रवेश परामर्शदाता शीघ्र आपसे संपर्क करेंगे।\n— प्रवेश विभाग, ' + schoolName;

    const encoded = encodeURIComponent(message);
    return 'https://wa.me/91' + cleanPhone.slice(-10) + '?text=' + encoded;
  };

  const updateLeadStage = (id: string, stage: NonNullable<OnlineAdmissionApplication['leadStage']>, counselorNotes?: string) => {
    setAdmissions((prev) =>
      prev.map((app) =>
        app.id === id
          ? {
              ...app,
              leadStage: stage,
              counselorNotes: counselorNotes !== undefined ? counselorNotes : app.counselorNotes,
              status: stage === 'ENROLLED' ? 'ENROLLED' : stage === 'CAMPUS_VISIT' ? 'DOCS_VERIFIED' : stage === 'INTERVIEW' ? 'INTERVIEW_SCHEDULED' : stage === 'ADMISSION_OFFERED' ? 'APPROVED' : app.status
            }
          : app
      )
    );
    logAction('UPDATE_LEAD_STAGE', 'ONLINE_ADMISSION', 'Lead ' + id + ' moved to stage ' + stage);
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

    // Auto-dispatch credentials & mobile webapp link to admitted student & parent email
    if (app.email) {
      dispatchCredentialsNotification({
        recipientType: 'STUDENT',
        recipientName: `${app.studentName} (Parent: ${app.parentName})`,
        recipientEmail: app.email,
        recipientPhone: app.phone,
        schoolName: branding.name,
        schoolId: branding.id,
        role: 'STUDENT & PARENT',
        loginId: newAdmissionNo,
        username: app.phone || newAdmissionNo,
        password: 'Student@2026'
      });
    }

    logAction(
      'ZERO_MANUAL_ADMISSION_AUTOMATION',
      'ONLINE_ADMISSION',
      `Approved application ${app.applicationNo}. Automatically generated Student Profile #${newAdmissionNo}, Parent Account, Class Allocation, and Fee Ledger.`
    );
    admissionsApi.approve(id).catch((e) => console.warn('Admission approve API error:', e));
  };

  const addFeeType = (fee: Omit<FeeType, 'id'>) => {
    const newFee: FeeType = { ...fee, id: `fee-${Date.now()}` };
    setFeeTypes((prev) => [...prev, newFee]);
    logAction('CREATE_FEE_TYPE', 'FEE_MANAGEMENT', `Created fee type ${fee.name} (₹${fee.amount})`);
    feeApi.types.create({ ...newFee, schoolId: activeSchoolId }).catch((e) => console.warn('Fee type API error:', e));
  };

  const processFeePayment = async (
    studentId: string,
    feeIds: string[],
    paymentMode: FeeReceipt['paymentMode'],
    idempotencyKey?: string
  ): Promise<{ success: boolean; receipt?: FeeReceipt; error?: string }> => {
    const std = students.find((s) => s.id === studentId) || students[0];
    const selectedFees = feeTypes.filter((f) => feeIds.includes(f.id));
    const total = selectedFees.reduce((acc, f) => acc + f.amount, 0);
    const key = idempotencyKey || `idem-${studentId}-${[...feeIds].sort().join('-')}-${Date.now()}`;

    try {
      const res = await feeApi.receipts.collect({
        studentId,
        feeIds,
        paymentMode,
        idempotencyKey: key,
        transactionRef: key
      });

      if (!res.ok || !res.data?.receipt) {
        return {
          success: false,
          error: (res.data as any)?.error || res.error || 'Server rejected fee collection transaction.'
        };
      }

      const serverReceipt = res.data.receipt as any;
      const formattedReceipt: FeeReceipt = {
        id: serverReceipt.id || `rcp-${Date.now()}`,
        receiptNo: serverReceipt.receiptNo,
        studentId: serverReceipt.studentId || std?.id || studentId,
        studentName: serverReceipt.studentName || std?.name || 'Student',
        admissionNo: serverReceipt.admissionNo || std?.admissionNo || '',
        className: serverReceipt.className || std?.className || '',
        section: serverReceipt.section || std?.section || '',
        feeBreakup: serverReceipt.feeBreakup && serverReceipt.feeBreakup.length > 0
          ? serverReceipt.feeBreakup.map((f: any) => ({ feeName: f.feeName || f.name, amount: f.amount }))
          : selectedFees.map((f) => ({ feeName: f.name, amount: f.amount })),
        totalAmount: serverReceipt.totalAmount || total,
        paidAmount: serverReceipt.paidAmount || total,
        balanceAmount: serverReceipt.balanceAmount || 0,
        paymentMode: serverReceipt.paymentMode || paymentMode,
        transactionId: serverReceipt.transactionRef || serverReceipt.id,
        paymentDate: serverReceipt.paymentDate || new Date().toLocaleString('en-IN'),
        status: serverReceipt.status === 'PAID' ? 'SUCCESS' : (serverReceipt.status || 'SUCCESS'),
        emailSent: true,
        whatsappSent: true
      };

      setFeeReceipts((prev) => {
        const exists = prev.some((r) => r.receiptNo === formattedReceipt.receiptNo || r.id === formattedReceipt.id);
        if (exists) return prev;
        return [formattedReceipt, ...prev];
      });

      logAction(
        'AUTOMATIC_FEE_COLLECTION',
        'FEE_MANAGEMENT',
        `Processed verified payment ${formattedReceipt.receiptNo} for ${formattedReceipt.studentName} (₹${formattedReceipt.paidAmount}). Verified by server.`
      );

      return {
        success: true,
        receipt: formattedReceipt
      };
    } catch (err: any) {
      console.error('Fee collection processing error:', err);
      return {
        success: false,
        error: err?.message || 'Network error: Failed to reach fee processing service.'
      };
    }
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
    examApi.papers.create({
      paperTitle: params.title,
      className: params.className,
      subject: params.subject,
      totalMarks: params.marks,
      durationMinutes: params.duration,
      questions: selectedQ,
      status: 'AI_DRAFT'
    }).catch((e) => console.warn('Exam Paper API error:', e));
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
    operationsApi.payroll.disburse(recordId).catch((e) => console.warn('Payroll API error:', e));
  };

  const addExpense = (expData: Omit<SchoolExpense, 'id'>) => {
    const newExp: SchoolExpense = { ...expData, id: `exp-${Date.now()}` };
    setExpenses((prev) => [newExp, ...prev]);
    logAction('RECORD_EXPENSE', 'EXPENSE_MANAGEMENT', `Recorded expense ₹${expData.amount} for ${expData.title}`);
    operationsApi.expenses.create({ ...newExp, schoolId: activeSchoolId }).catch((e) => console.warn('Expense API error:', e));
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
    authApi.registerSchool(params).catch((e) => console.warn('School registration API error:', e));

    // Auto-dispatch School Credentials & Mobile WebApp access link to School Principal/Admin email
    dispatchCredentialsNotification({
      recipientType: 'SCHOOL',
      recipientName: params.adminName,
      recipientEmail: params.adminEmail,
      recipientPhone: params.adminPhone,
      schoolName: params.name,
      schoolId: newSchoolId,
      role: 'PRINCIPAL',
      loginId: newSchoolId,
      username: params.adminEmail,
      password: 'Admin@2026#Launch'
    });

    return newTenant;
  };

  const onboardSchool = async (params: {
    name: string;
    code?: string;
    board?: 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'IB';
    category?: string;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    planId: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
    billingCycle?: 'MONTHLY' | 'YEARLY';
    address?: SchoolTenantLocation;
    initialBranch?: {
      branchCode?: string;
      name?: string;
      capacity?: number;
    };
  }): Promise<{ success: boolean; tenant?: SchoolTenant; error?: string }> => {
    try {
      const res = await tenantsApi.createTenant(params);
      if (res.ok && res.data?.tenant) {
        const createdTenant = res.data.tenant as SchoolTenant;
        setTenants((prev) => [createdTenant, ...prev.filter((t) => t.id !== createdTenant.id)]);
        logAction('ONBOARD_SCHOOL', 'PLATFORM_ADMIN', `Onboarded school "${createdTenant.name}" (${createdTenant.id}) with location.`);
        return { success: true, tenant: createdTenant };
      }

      // Offline / fallback creation
      const num = Math.floor(100000 + Math.random() * 900000);
      const newSchoolId = `I2A-SCH-${num}`;
      const plan = initialSubscriptionPlans.find((p) => p.id === params.planId) || initialSubscriptionPlans[1];
      const city = params.address?.city || 'Patna';
      const state = params.address?.state || 'Bihar';

      const fallbackTenant: SchoolTenant = {
        id: newSchoolId,
        name: params.name,
        code: params.code || (params.name.substring(0, 4).toUpperCase() + '-' + city.toUpperCase()),
        board: params.board || 'CBSE',
        category: params.category || 'k12-schools',
        city,
        adminName: params.adminName,
        adminEmail: params.adminEmail,
        adminPhone: params.adminPhone,
        planId: params.planId,
        planName: plan.name,
        billingCycle: params.billingCycle || 'YEARLY',
        subscriptionStatus: 'ACTIVE',
        registeredAt: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        studentLimit: plan.maxStudents,
        isOnboarded: true,
        branchCount: 1,
        location: params.address || {
          city,
          state,
          country: 'IN'
        },
        branches: [
          {
            id: `BR-${newSchoolId}-MAIN`,
            branchCode: params.initialBranch?.branchCode || 'MAIN',
            name: params.initialBranch?.name || `${params.name} (Main Campus)`,
            isMainBranch: true,
            status: 'ACTIVE',
            capacity: params.initialBranch?.capacity || 1000,
            address: params.address
          }
        ]
      };

      const updated = [fallbackTenant, ...tenants];
      setTenants(updated);
      localStorage.setItem('i2a_tenants', JSON.stringify(updated));
      return { success: true, tenant: fallbackTenant };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to onboard school' };
    }
  };

  const updateSchoolLocation = async (schoolId: string, location: SchoolTenantLocation): Promise<{ success: boolean; error?: string }> => {
    try {
      await tenantsApi.updateLocation(schoolId, location);
      setTenants((prev) =>
        prev.map((t) => (t.id === schoolId ? { ...t, location: { ...t.location, ...location } } : t))
      );
      if (activeSchoolId === schoolId) {
        setBranding((prev) => ({
          ...prev,
          address: `${location.street ? location.street + ', ' : ''}${location.city || ''}, ${location.state || ''}${location.postalCode ? ' - ' + location.postalCode : ''}`
        }));
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to update location' };
    }
  };

  const loginToSchool = (schoolId: string, role?: UserRole, user?: AuthUser) => {
    if (user) {
      setCurrentUser(user);
      sessionStorage.setItem('i2a_user', JSON.stringify(user));
      if (user.childrenIds && user.childrenIds.length > 0) {
        setSelectedChildId(user.childrenIds[0]);
      } else if (user.studentId) {
        setSelectedChildId(user.studentId);
      }
    }
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

    const nextRole = role || currentRole;
    if (role) {
      setCurrentRole(role);
      if (role === 'SUPER_ADMIN') {
        setViewMode('PLATFORM_ADMIN');
      } else {
        setViewMode('SCHOOL_PORTAL');
      }
    } else {
      setViewMode('SCHOOL_PORTAL');
    }

    // Direct role-based dashboard landing
    if (nextRole === 'PARENT') {
      setActiveModule('parent_portal');
    } else if (nextRole === 'STUDENT') {
      setActiveModule('student_portal');
    } else if (nextRole === 'ACCOUNTANT') {
      setActiveModule('fee_management');
    } else if (nextRole === 'TEACHER') {
      setActiveModule('attendance_timetable');
    } else if (nextRole === 'TRANSPORT') {
      setActiveModule('library_transport');
    } else if (!targetTenant?.isOnboarded && (nextRole === 'PRINCIPAL' || nextRole === 'ADMIN' || nextRole === 'SUPER_ADMIN')) {
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
      board: (app.board as 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'IB') || 'CBSE',
      city: app.city,
      adminName: app.adminName,
      adminEmail: app.adminEmail,
      adminPhone: app.adminPhone,
      planId: app.planId || 'PROFESSIONAL',
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

    // Auto-dispatch credentials & mobile webapp link to school admin/principal email
    dispatchCredentialsNotification({
      recipientType: 'SCHOOL',
      recipientName: app.adminName,
      recipientEmail: app.adminEmail,
      recipientPhone: app.adminPhone,
      schoolName: app.schoolName,
      schoolId: formattedId,
      role: 'PRINCIPAL',
      loginId: formattedId,
      username: app.adminEmail,
      password: `Admin@${new Date().getFullYear()}#Secure`
    });

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
    address?: string;
    city?: string;
    whatsappNumber?: string;
  }): OnlineAdmissionApplication => {
    const appNo = `APP-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newApp: OnlineAdmissionApplication = {
      ...appData,
      id: `adm-${Date.now()}`,
      applicationNo: appNo,
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'SUBMITTED',
      leadStage: 'NEW_LEAD',
      leadScore: 92,
      autoMessageSent: true,
      autoMessageTimestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
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
    clearAuth();
    setCurrentUser(null);
    setSelectedChildId('');
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
        onboardSchool,
        updateSchoolLocation,
        loginToSchool,
        updateTenantSubscription,
        toggleSchoolSuspension,
        returnToPublicSaas,
        currentRole,
        setCurrentRole,
        darkMode,
        setDarkMode,
        language,
        setLanguage,
        t,
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
        updateLeadStage,
        triggerWhatsAppLeadMessage,
        feeTypes,
        addFeeType,
        feeReceipts,
        processFeePayment,
        currentUser,
        setCurrentUser,
        selectedChildId,
        setSelectedChildId,
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
        resetSeedData,
        notifications,
        markNotificationAsRead,
        clearAllNotifications,
        dispatchCredentialsNotification,
        isBackendConnected,
        isSyncing,
        backendError,
        syncWithBackend,
        loginWithCredentials
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
