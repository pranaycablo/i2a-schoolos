import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = 'i2a_schoolos';

// Comprehensive Seed Data
const tenants = [
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
    branding: {
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
    }
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
    branding: {
      id: 'sch-002',
      name: 'St. Xavier Senior Secondary School',
      tagline: 'Duty, Devotion & Discipline',
      logoUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=150&auto=format&fit=crop&q=80',
      stampUrl: 'https://api.iconify.design/emojione-v1:approved.svg',
      principalSignatureUrl: 'https://api.iconify.design/ci:edit-pencil.svg',
      primaryColor: '#2563EB',
      secondaryColor: '#38BDF8',
      address: 'Gandhi Maidan, Patna, Bihar - 800004',
      phone: '+91 612 9876543',
      email: 'admin@stxaviers.edu.in',
      whatsappNumber: '+91 9876543211',
      website: 'stxavierspatna.edu.in',
      principalName: 'Fr. Thomas Varghese',
      regNumber: 'BR-SCH-2015/1042',
      board: 'ICSE',
      medium: 'ENGLISH',
      academicSession: '2026-2027',
      invoiceHeader: 'ST. XAVIER SENIOR SECONDARY SCHOOL',
      invoiceFooter: 'Official Digital Fee Receipt - i2A SchoolOS',
      reportCardTheme: 'CLASSIC_BLUE',
      certificateTheme: 'ELEGANT'
    }
  }
];

const users = [
  { id: 'usr-001', name: 'i2A SaaS Master Admin', email: 'superadmin@i2aschoolos.com', role: 'SUPER_ADMIN', schoolId: 'ALL' },
  { id: 'usr-002', name: 'Dr. Ramesh Chandra Sharma', email: 'principal@abcpublicschool.edu.in', role: 'PRINCIPAL', schoolId: 'I2A-SCH-000001' },
  { id: 'usr-003', name: 'School Administration Team', email: 'admin@abcpublicschool.edu.in', role: 'ADMIN', schoolId: 'I2A-SCH-000001' },
  { id: 'usr-004', name: 'Mrs. Sunita Mishra', email: 'sunita.mishra@abcpublicschool.edu.in', role: 'TEACHER', schoolId: 'I2A-SCH-000001', assignedClasses: ['Class VIII', 'Class X'], subjects: ['Science', 'Physics'] },
  { id: 'usr-005', name: 'Mr. Vikram Singh', email: 'vikram.singh@abcpublicschool.edu.in', role: 'TEACHER', schoolId: 'I2A-SCH-000001', assignedClasses: ['Class VIII', 'Class IX'], subjects: ['Mathematics'] },
  { id: 'usr-006', name: 'Mr. Alok Nath', email: 'alok.nath@abcpublicschool.edu.in', role: 'ACCOUNTANT', schoolId: 'I2A-SCH-000001' },
  { id: 'usr-007', name: 'Mr. Rajesh Mohan', email: 'office@abcpublicschool.edu.in', role: 'STAFF', schoolId: 'I2A-SCH-000001' },
  { id: 'usr-008', name: 'Manoj Singh', email: 'driver.manoj@abcpublicschool.edu.in', role: 'TRANSPORT', schoolId: 'I2A-SCH-000001', route: 'TR-01' },
  { id: 'usr-009', name: 'Sanjay Kumar (Parent)', email: 'sanjay.kumar@gmail.com', role: 'PARENT', schoolId: 'I2A-SCH-000001', studentId: 'std-101' },
  { id: 'usr-010', name: 'Rahul Kumar (Student)', email: 'rahul.kumar@abcpublicschool.edu.in', role: 'STUDENT', schoolId: 'I2A-SCH-000001', studentId: 'std-101' }
];

const students = [
  {
    id: 'std-101',
    schoolId: 'I2A-SCH-000001',
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
    schoolId: 'I2A-SCH-000001',
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
    schoolId: 'I2A-SCH-000001',
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
  },
  {
    id: 'std-104',
    schoolId: 'I2A-SCH-000001',
    admissionNo: '1027',
    rollNo: '04',
    name: 'Sneha Kumari',
    photoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    dob: '2013-02-19',
    gender: 'FEMALE',
    className: 'Class VII',
    section: 'A',
    house: 'Tagore House',
    fatherName: 'Manoj Kumari',
    motherName: 'Renu Devi',
    parentMobile: '9876543213',
    parentWhatsApp: '9876543213',
    parentEmail: 'manoj.kumari@gmail.com',
    address: 'Bailey Road, Patna',
    admissionDate: '2023-04-01',
    status: 'ACTIVE',
    documents: { birthCertificate: 'Uploaded' },
    assignedSubjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Hindi'],
    attendanceRate: 96.0
  }
];

const admissions = [
  {
    id: 'adm-001',
    schoolId: 'I2A-SCH-000001',
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
    schoolId: 'I2A-SCH-000001',
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
  },
  {
    id: 'adm-003',
    schoolId: 'I2A-SCH-000001',
    applicationNo: 'APP-2026-091',
    studentName: 'Kabir Das',
    applyingClass: 'Class IX',
    parentName: 'Ratan Das',
    phone: '9833445566',
    email: 'ratan.das@gmail.com',
    status: 'APPROVED',
    submittedDate: '2026-10-02',
    documentsUploaded: true,
    interviewScore: 92,
    remarks: 'Approved by Principal for Class IX admission.'
  }
];

const feeTypes = [
  { id: 'fee-1', schoolId: 'I2A-SCH-000001', name: 'Tuition Fee', code: 'TUTION', amount: 2000, frequency: 'MONTHLY', category: 'TUITION', isOptional: false, description: 'Monthly Core Academic Fee' },
  { id: 'fee-2', schoolId: 'I2A-SCH-000001', name: 'Activity Fee', code: 'ACTIVITY', amount: 300, frequency: 'MONTHLY', category: 'ACTIVITY', isOptional: false, description: 'Sports, Clubs & Co-Curriculars' },
  { id: 'fee-3', schoolId: 'I2A-SCH-000001', name: 'Examination Fee', code: 'EXAM', amount: 500, frequency: 'QUARTERLY', category: 'LAB', isOptional: false, description: 'Term Question Papers & Assessment' },
  { id: 'fee-4', schoolId: 'I2A-SCH-000001', name: 'Educational Tour Fee', code: 'TOUR', amount: 2500, frequency: 'ONE_TIME', category: 'CUSTOM', isOptional: true, description: 'Historical Tour to Nalanda' },
  { id: 'fee-5', schoolId: 'I2A-SCH-000001', name: 'Transport Bus Fee', code: 'TRANS', amount: 1200, frequency: 'MONTHLY', category: 'TRANSPORT', isOptional: true, description: 'Route B: Kankarbagh - School' },
  { id: 'fee-6', schoolId: 'I2A-SCH-000001', name: 'Computer Lab & Robotics Fee', code: 'COMP_LAB', amount: 450, frequency: 'MONTHLY', category: 'LAB', isOptional: false, description: 'Coding & Robotics Lab Access' }
];

const feeReceipts = [
  {
    id: 'rcp-001',
    schoolId: 'I2A-SCH-000001',
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
  },
  {
    id: 'rcp-002',
    schoolId: 'I2A-SCH-000001',
    receiptNo: 'INV-2026-001246',
    studentId: 'std-102',
    studentName: 'Ananya Sharma',
    admissionNo: '1025',
    className: 'Class VIII',
    section: 'A',
    feeBreakup: [
      { feeName: 'Tuition Fee', amount: 2000 },
      { feeName: 'Activity Fee', amount: 300 },
      { feeName: 'Transport Bus Fee', amount: 1200 }
    ],
    totalAmount: 3500,
    paidAmount: 3500,
    balanceAmount: 0,
    paymentMode: 'NET_BANKING',
    transactionId: 'HDFC-88991204',
    paymentDate: '2026-10-08 02:15 PM',
    status: 'SUCCESS',
    emailSent: true,
    whatsappSent: true
  }
];

const staffList = [
  {
    id: 'stf-1',
    schoolId: 'I2A-SCH-000001',
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
    schoolId: 'I2A-SCH-000001',
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
  },
  {
    id: 'stf-3',
    schoolId: 'I2A-SCH-000001',
    employeeId: 'EMP-103',
    name: 'Mr. Vikram Singh',
    role: 'TEACHER',
    designation: 'Head of Mathematics',
    qualification: 'M.Sc. Mathematics, B.Ed',
    joiningDate: '2018-04-10',
    mobile: '9855667788',
    email: 'vikram.singh@abcpublicschool.edu.in',
    baseSalary: 48000,
    status: 'ACTIVE',
    assignedClasses: ['Class VIII', 'Class IX', 'Class X'],
    assignedSubjects: ['Mathematics']
  },
  {
    id: 'stf-4',
    schoolId: 'I2A-SCH-000001',
    employeeId: 'EMP-104',
    name: 'Manoj Singh',
    role: 'TRANSPORT',
    designation: 'Senior Bus Pilot',
    qualification: 'Heavy Transport License',
    joiningDate: '2021-08-01',
    mobile: '9811002233',
    email: 'driver.manoj@abcpublicschool.edu.in',
    baseSalary: 22000,
    status: 'ACTIVE'
  }
];

const payrollRecords = [
  {
    id: 'pay-001',
    schoolId: 'I2A-SCH-000001',
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
  },
  {
    id: 'pay-002',
    schoolId: 'I2A-SCH-000001',
    month: 'October 2026',
    staffId: 'stf-2',
    staffName: 'Mr. Alok Nath',
    baseSalary: 38000,
    presentDays: 26,
    workingDays: 26,
    bonus: 1000,
    deductions: 0,
    netSalary: 39000,
    status: 'DISBURSED',
    disbursedDate: '2026-10-01'
  }
];

const expenses = [
  {
    id: 'exp-1',
    schoolId: 'I2A-SCH-000001',
    title: 'Science Lab Equipment & Chemicals',
    category: 'EVENTS',
    amount: 14500,
    date: '2026-10-05',
    paidTo: 'Patna Scientific Supplies',
    approvedBy: 'Dr. Ramesh Chandra Sharma'
  },
  {
    id: 'exp-2',
    schoolId: 'I2A-SCH-000001',
    title: 'Electricity Bill September',
    category: 'ELECTRICITY',
    amount: 32400,
    date: '2026-10-03',
    paidTo: 'SBPDCL Patna',
    approvedBy: 'Mr. Alok Nath'
  },
  {
    id: 'exp-3',
    schoolId: 'I2A-SCH-000001',
    title: 'High-Speed Fiber Internet Lease',
    category: 'INTERNET',
    amount: 4500,
    date: '2026-10-02',
    paidTo: 'Jio Business Fiber',
    approvedBy: 'Dr. Ramesh Chandra Sharma'
  }
];

const transportRoutes = [
  {
    id: 'TR-01',
    schoolId: 'I2A-SCH-000001',
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
    schoolId: 'I2A-SCH-000001',
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

const digitalBooks = [
  {
    id: 'bk-1',
    schoolId: 'I2A-SCH-000001',
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
  },
  {
    id: 'bk-2',
    schoolId: 'I2A-SCH-000001',
    title: 'NCERT Mathematics Class VIII',
    className: 'Class VIII',
    subject: 'Mathematics',
    coverUrl: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=200&auto=format&fit=crop&q=80',
    chaptersCount: 14,
    chapters: [
      {
        id: 'ch-math-1',
        chapterNumber: 1,
        title: 'Rational Numbers',
        summary: 'Properties of rational numbers, representation on number line, and operations.',
        topics: ['Closure Property', 'Commutativity', 'Associativity', 'Additive Identity'],
        extractedConcepts: ['Rational Numbers', 'Reciprocal', 'Distributivity'],
        candidateQuestionsCount: 20
      }
    ]
  }
];

const questionBank = [
  {
    id: 'q-1',
    schoolId: 'I2A-SCH-000001',
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
    schoolId: 'I2A-SCH-000001',
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
    schoolId: 'I2A-SCH-000001',
    className: 'Class VIII',
    subject: 'Science',
    chapterId: 'ch-2',
    chapterTitle: 'Microorganisms: Friend & Foe',
    questionText: 'Process of conversion of sugar into alcohol by yeast is called ______.',
    type: 'FILL_BLANKS',
    correctAnswer: 'Fermentation',
    difficulty: 'EASY',
    marks: 1
  },
  {
    id: 'q-4',
    schoolId: 'I2A-SCH-000001',
    className: 'Class VIII',
    subject: 'Mathematics',
    chapterId: 'ch-math-1',
    chapterTitle: 'Rational Numbers',
    questionText: 'What is the additive inverse of -7/19?',
    type: 'MCQ',
    options: ['7/19', '-19/7', '19/7', '0'],
    correctAnswer: '7/19',
    difficulty: 'EASY',
    marks: 1
  }
];

const examPapers = [
  {
    id: 'ex-001',
    schoolId: 'I2A-SCH-000001',
    paperTitle: 'Class VIII Science Weekly Assessment',
    className: 'Class VIII',
    subject: 'Science',
    totalMarks: 30,
    durationMinutes: 45,
    questions: questionBank.slice(0, 3),
    status: 'APPROVED',
    generatedDate: '2026-10-07',
    approvedBy: 'Dr. Ramesh Chandra Sharma (Principal)',
    autoScheduleDays: 'Every Wednesday'
  }
];

const examSubmissions = [
  {
    id: 'sub-001',
    schoolId: 'I2A-SCH-000001',
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

const auditLogs = [
  {
    id: 'log-1',
    schoolId: 'I2A-SCH-000001',
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
    schoolId: 'I2A-SCH-000001',
    timestamp: '2026-10-07 10:45 AM',
    user: 'System Automated Workflow',
    role: 'ACCOUNTANT',
    action: 'FEE_RECEIPT_GENERATED',
    module: 'FEE_MANAGEMENT',
    details: 'Generated INV-2026-001245 for Student Rahul Kumar (₹2,500 via UPI)',
    ipAddress: '10.0.0.1'
  }
];

const schoolApplications = [
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

// Timetable schedules
const timetables = [
  {
    id: 'tt-cls8-a',
    schoolId: 'I2A-SCH-000001',
    className: 'Class VIII',
    section: 'A',
    academicYear: '2026-2027',
    schedule: [
      { day: 'Monday', period: 1, time: '08:00 - 08:45 AM', subject: 'Mathematics', teacher: 'Mr. Vikram Singh', room: 'Room 201' },
      { day: 'Monday', period: 2, time: '08:45 - 09:30 AM', subject: 'Science', teacher: 'Mrs. Sunita Mishra', room: 'Room 201' },
      { day: 'Monday', period: 3, time: '09:30 - 10:15 AM', subject: 'English', teacher: 'Ms. Priya Roy', room: 'Room 201' },
      { day: 'Monday', period: 4, time: '10:15 - 11:00 AM', subject: 'Social Studies', teacher: 'Mr. Amit Verma', room: 'Room 201' },
      { day: 'Monday', period: 5, time: '11:30 - 12:15 PM', subject: 'Hindi', teacher: 'Mrs. Rekha Gupta', room: 'Room 201' },
      { day: 'Monday', period: 6, time: '12:15 - 01:00 PM', subject: 'Computer & AI', teacher: 'Mr. Rohit Jha', room: 'Computer Lab' },
      { day: 'Tuesday', period: 1, time: '08:00 - 08:45 AM', subject: 'Science', teacher: 'Mrs. Sunita Mishra', room: 'Science Lab' },
      { day: 'Tuesday', period: 2, time: '08:45 - 09:30 AM', subject: 'Mathematics', teacher: 'Mr. Vikram Singh', room: 'Room 201' },
      { day: 'Tuesday', period: 3, time: '09:30 - 10:15 AM', subject: 'Hindi', teacher: 'Mrs. Rekha Gupta', room: 'Room 201' },
      { day: 'Tuesday', period: 4, time: '10:15 - 11:00 AM', subject: 'Social Studies', teacher: 'Mr. Amit Verma', room: 'Room 201' },
      { day: 'Tuesday', period: 5, time: '11:30 - 12:15 PM', subject: 'English', teacher: 'Ms. Priya Roy', room: 'Room 201' },
      { day: 'Tuesday', period: 6, time: '12:15 - 01:00 PM', subject: 'Physical Education / Sports', teacher: 'Coach R. K. Yadav', room: 'Playground' }
    ]
  }
];

// Seed Function
async function seedMongoDB() {
  const client = new MongoClient(MONGO_URI);

  try {
    console.log(`🚀 Connecting to MongoDB at ${MONGO_URI}...`);
    await client.connect();
    console.log('✅ Connected successfully!');

    const db = client.db(DB_NAME);

    // Collection seeding mapping
    const collectionsToSeed = [
      { name: 'tenants', data: tenants, key: 'id' },
      { name: 'users', data: users, key: 'id' },
      { name: 'students', data: students, key: 'id' },
      { name: 'admissions', data: admissions, key: 'id' },
      { name: 'fee_types', data: feeTypes, key: 'id' },
      { name: 'fee_receipts', data: feeReceipts, key: 'id' },
      { name: 'staff', data: staffList, key: 'id' },
      { name: 'payroll', data: payrollRecords, key: 'id' },
      { name: 'expenses', data: expenses, key: 'id' },
      { name: 'transport_routes', data: transportRoutes, key: 'id' },
      { name: 'digital_books', data: digitalBooks, key: 'id' },
      { name: 'question_bank', data: questionBank, key: 'id' },
      { name: 'exam_papers', data: examPapers, key: 'id' },
      { name: 'exam_submissions', data: examSubmissions, key: 'id' },
      { name: 'audit_logs', data: auditLogs, key: 'id' },
      { name: 'school_applications', data: schoolApplications, key: 'id' },
      { name: 'timetables', data: timetables, key: 'id' }
    ];

    for (const col of collectionsToSeed) {
      const collection = db.collection(col.name);
      await collection.deleteMany({}); // Fresh clean seed
      if (col.data && col.data.length > 0) {
        await collection.insertMany(col.data);
        console.log(`📦 Seeded [${col.name}] with ${col.data.length} records.`);
      }
      // Create primary index
      await collection.createIndex({ [col.key]: 1 }, { unique: true }).catch(() => {});
    }

    console.log('\n🎉 ALL COLLECTIONS IN DATABASE [i2a_schoolos] SUCCESSFULLY SEEDED!');

    // Export a comprehensive copy to Desktop for easy MongoDB Compass viewing / import
    const desktopPath = path.join('C:', 'Users', 'HP', 'Desktop', 'i2A_SchoolOS_MongoDB_Export.json');
    const fullExport = {
      database: DB_NAME,
      exportedAt: new Date().toISOString(),
      collections: {
        tenants,
        users,
        students,
        admissions,
        feeTypes,
        feeReceipts,
        staffList,
        payrollRecords,
        expenses,
        transportRoutes,
        digitalBooks,
        questionBank,
        examPapers,
        examSubmissions,
        auditLogs,
        schoolApplications,
        timetables
      }
    };

    fs.writeFileSync(desktopPath, JSON.stringify(fullExport, null, 2), 'utf-8');
    console.log(`📄 Desktop JSON Export created at: ${desktopPath}`);

  } catch (err) {
    console.error('❌ Error during MongoDB seeding:', err);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔒 MongoDB connection closed.');
  }
}

seedMongoDB();
