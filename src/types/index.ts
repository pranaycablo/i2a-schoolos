export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'PRINCIPAL'
  | 'ACCOUNTANT'
  | 'TEACHER'
  | 'STAFF'
  | 'TRANSPORT'
  | 'PARENT'
  | 'STUDENT';

export interface SchoolBranding {
  id: string;
  name: string;
  tagline: string;
  logoUrl: string;
  stampUrl: string;
  principalSignatureUrl: string;
  primaryColor: string;
  secondaryColor: string;
  address: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  website: string;
  domainType?: 'SUBDOMAIN' | 'CUSTOM_DOMAIN';
  customDomain?: string;
  subdomainSlug?: string;
  isDomainSslActive?: boolean;
  principalName: string;
  regNumber: string;
  board: 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'IB';
  medium: 'HINDI' | 'ENGLISH' | 'BILINGUAL';
  academicSession: string;
  invoiceHeader: string;
  invoiceFooter: string;
  reportCardTheme: 'CLASSIC_BLUE' | 'EMERALD_MODERN' | 'ROYAL_GOLD' | 'SLATE_MINIMAL';
  certificateTheme: 'OFFICIAL' | 'ELEGANT' | 'MODERN';
}

export type ApplicationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_VERIFICATION'
  | 'UNDER_REVIEW'
  | 'DOCS_REVIEWED'
  | 'NEEDS_CORRECTION'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'CANCELLED';

export interface ApplicationStatusHistoryItem {
  status?: ApplicationStatus;
  fromStatus?: string;
  toStatus?: string;
  timestamp?: string;
  changedAt?: string;
  changedBy?: string;
  actorRole?: string;
  reason?: string;
  notes?: string;
}

export interface ApplicationVerificationChecklist {
  docVerified?: boolean;
  contactVerified?: boolean;
  boardAffiliationVerified?: boolean;
  identityVerified?: boolean;
  documentAuthenticityVerified?: boolean;
  affiliationVerified?: boolean;
  addressVerified?: boolean;
  feeCommercialVerified?: boolean;
  antiFraudCheckPassed?: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
}

export interface ApplicationSubmittedDocument {
  type: string;
  fileName: string;
  fileSizeBytes: number;
  mimeType: string;
  storageKey: string;
  uploadedAt: string;
}

export interface SchoolRegistrationApplication {
  id: string;
  applicationNo: string;
  schoolName: string;
  category?: string;
  board?: 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'IB' | 'CAMBRIDGE' | 'UNIVERSITY' | 'OTHER' | string;
  city: string;
  state: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  domainType?: 'SUBDOMAIN' | 'CUSTOM_DOMAIN';
  subdomainSlug?: string;
  customDomain?: string;
  planId?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  planInterest?: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  estimatedStudents?: number;
  notes?: string;
  status: ApplicationStatus;
  submittedDate: string;
  affiliationNumber?: string;
  documentsSubmitted?: Record<string, string | ApplicationSubmittedDocument>;
  rejectionReason?: string;
  correctionNotes?: string;
  reviewNotes?: string;
  reviewerId?: string;
  reviewedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  tenantId?: string;
  verificationChecklist?: ApplicationVerificationChecklist;
  statusHistory?: ApplicationStatusHistoryItem[];
  verified?: boolean;
}

export interface TransportRouteItem {
  id: string;
  routeNumber: string;
  routeName: string;
  driverName: string;
  driverMobile: string;
  vehicleNumber: string;
  capacity: number;
  assignedStudentsCount: number;
  stops: { stopName: string; pickUpTime: string; dropTime: string; monthlyFee: number }[];
  liveStatus: 'IDLE' | 'ON_ROUTE_MORNING' | 'ON_ROUTE_AFTERNOON' | 'MAINTENANCE';
  currentLocation?: string;
}

export interface Student {
  id: string;
  admissionNo: string;
  rollNo: string;
  name: string;
  photoUrl: string;
  dob: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  className: string;
  section: string;
  house?: string;
  fatherName: string;
  motherName: string;
  guardianName?: string;
  parentMobile: string;
  parentWhatsApp: string;
  parentEmail: string;
  address: string;
  admissionDate: string;
  status: 'ACTIVE' | 'GRADUATED' | 'TRANSFER' | 'SUSPENDED';
  documents: {
    birthCertificate?: string;
    transferCertificate?: string;
    previousMarksheet?: string;
    idProof?: string;
  };
  assignedSubjects: string[];
  attendanceRate: number; // percentage
}

export interface OnlineAdmissionApplication {
  id: string;
  applicationNo: string;
  studentName: string;
  applyingClass: string;
  parentName: string;
  phone: string;
  email: string;
  status: 'SUBMITTED' | 'DOCS_VERIFIED' | 'INTERVIEW_SCHEDULED' | 'APPROVED' | 'REJECTED' | 'ENROLLED';
  submittedDate: string;
  documentsUploaded: boolean;
  interviewScore?: number;
  remarks?: string;
  approvedBy?: string;
}

export interface FeeType {
  id: string;
  name: string;
  code: string;
  amount: number;
  frequency: 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'HALF_YEARLY' | 'ANNUAL' | 'CUSTOM';
  category: 'TUITION' | 'ADMISSION' | 'TRANSPORT' | 'LIBRARY' | 'ACTIVITY' | 'LAB' | 'CUSTOM';
  isOptional: boolean;
  description?: string;
}

export interface FeeReceipt {
  id: string;
  receiptNo: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  section: string;
  feeBreakup: { feeName: string; amount: number }[];
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  paymentMode: 'UPI' | 'NET_BANKING' | 'CREDIT_CARD' | 'CASH' | 'CHEQUE';
  transactionId: string;
  paymentDate: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILED';
  receiptPdfUrl?: string;
  emailSent: boolean;
  whatsappSent: boolean;
}

export interface DigitalBook {
  id: string;
  title: string;
  className: string;
  subject: string;
  coverUrl: string;
  pdfUrl?: string;
  chaptersCount: number;
  chapters: BookChapter[];
}

export interface BookChapter {
  id: string;
  chapterNumber: number;
  title: string;
  summary: string;
  topics: string[];
  extractedConcepts: string[];
  candidateQuestionsCount: number;
}

export interface QuestionBankItem {
  id: string;
  className: string;
  subject: string;
  chapterId: string;
  chapterTitle: string;
  questionText: string;
  type: 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANKS' | 'SHORT' | 'LONG' | 'NUMERICAL';
  options?: string[];
  correctAnswer: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  marks: number;
}

export interface ExamPaper {
  id: string;
  paperTitle: string;
  className: string;
  subject: string;
  totalMarks: number;
  durationMinutes: number;
  questions: QuestionBankItem[];
  status: 'AI_DRAFT' | 'TEACHER_REVIEW' | 'APPROVED' | 'PUBLISHED';
  generatedDate: string;
  approvedBy?: string;
  autoScheduleDays?: string;
}

export interface OnlineExamSubmission {
  id: string;
  examPaperId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  className: string;
  section: string;
  submittedAt: string;
  score: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  status: 'SUBMITTED' | 'EVALUATED';
  answers: {
    questionId: string;
    studentAnswer: string;
    marksObtained: number;
    isCorrect?: boolean;
    teacherComment?: string;
  }[];
}

export interface Staff {
  id: string;
  employeeId: string;
  name: string;
  role: 'TEACHER' | 'ACCOUNTANT' | 'ADMIN' | 'LIBRARIAN' | 'TRANSPORT_DRIVER' | 'SUPPORT';
  designation: string;
  qualification: string;
  joiningDate: string;
  mobile: string;
  email: string;
  baseSalary: number;
  status: 'ACTIVE' | 'ON_LEAVE' | 'RESIGNED';
  assignedClasses?: string[];
  assignedSubjects?: string[];
}

export interface PayrollRecord {
  id: string;
  month: string; // e.g. "October 2026"
  staffId: string;
  staffName: string;
  baseSalary: number;
  presentDays: number;
  workingDays: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  status: 'DRAFT' | 'APPROVED' | 'DISBURSED';
  disbursedDate?: string;
}

export interface SchoolExpense {
  id: string;
  title: string;
  category: 'SALARY' | 'ELECTRICITY' | 'RENT' | 'MAINTENANCE' | 'STATIONERY' | 'EVENTS' | 'MARKETING' | 'OTHER';
  amount: number;
  date: string;
  paidTo: string;
  receiptNumber?: string;
  approvedBy: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: UserRole;
  action: string;
  module: string;
  details: string;
  ipAddress: string;
}

// --- MASTER PROMPT 08: Timetable & Scheduling Engine Interfaces ---

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export interface PeriodSlot {
  id: string;
  periodNumber: number;
  label: string; // e.g., "Period 1", "Lunch Break"
  startTime: string; // "08:00"
  endTime: string; // "08:45"
  isBreak: boolean;
}

export interface TimetableCell {
  id: string;
  schoolId: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  day: DayOfWeek;
  periodId: string;
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  roomId?: string;
  roomName?: string;
  isLocked?: boolean;
}

export interface RoomMaster {
  id: string;
  schoolId: string;
  roomName: string;
  roomNumber: string;
  buildingName?: string;
  roomType: 'CLASSROOM' | 'LAB' | 'COMPUTER_LAB' | 'SPORTS_GROUND' | 'LIBRARY' | 'AUDITORIUM';
  capacity: number;
}

export interface TeacherWorkload {
  teacherId: string;
  teacherName: string;
  maxWeeklyPeriods: number;
  assignedWeeklyPeriods: number;
  dailyLoad: Record<DayOfWeek, number>;
}

export interface SubstitutionRecord {
  id: string;
  schoolId: string;
  date: string; // YYYY-MM-DD
  day: DayOfWeek;
  periodId: string;
  periodLabel: string;
  classId: string;
  className: string;
  sectionId: string;
  sectionName: string;
  subjectName: string;
  originalTeacherId: string;
  originalTeacherName: string;
  substituteTeacherId: string;
  substituteTeacherName: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'COMPLETED';
}

export interface TimetableConflict {
  type: 'TEACHER_DOUBLE_BOOKING' | 'ROOM_DOUBLE_BOOKING' | 'CLASS_DOUBLE_BOOKING' | 'TEACHER_MAX_LOAD_EXCEEDED';
  message: string;
  day: DayOfWeek;
  periodId: string;
  affectedEntities: string[];
}

// --- MASTER PROMPT 09: Homework, Digital Learning & AI Academic Content Interfaces ---

export type HomeworkStatus = 'DRAFT' | 'UNDER_REVIEW' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

export type HomeworkType =
  | 'WRITTEN'
  | 'WORKSHEET'
  | 'READING'
  | 'PROJECT'
  | 'PRACTICAL'
  | 'QUIZ'
  | 'FILE_UPLOAD'
  | 'LINK_VIDEO'
  | 'OTHER';

export type SubmissionStatus =
  | 'NOT_SUBMITTED'
  | 'DRAFT'
  | 'SUBMITTED'
  | 'LATE_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'RETURNED'
  | 'RESUBMITTED'
  | 'GRADED';

export interface HomeworkAttachment {
  name: string;
  url: string;
  fileType: string;
}

export interface Homework {
  id: string;
  schoolId: string;
  title: string;
  description: string;
  instructions: string;
  academicSession: string;
  className: string;
  sectionName: string;
  subjectId: string;
  subjectName: string;
  topicName?: string;
  assignedDate: string;
  dueDate: string;
  dueTime: string;
  maxMarks?: number;
  homeworkType: HomeworkType;
  attachments: HomeworkAttachment[];
  allowLateSubmission: boolean;
  latePenaltyPercent?: number;
  status: HomeworkStatus;
  createdBy: string;
  createdByName: string;
  approvedBy?: string;
  targetStudentIds?: string[];
}

export interface StudentSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  sectionName: string;
  schoolId: string;
  submittedAt: string;
  attemptNumber: number;
  textResponse?: string;
  attachments: { name: string; url: string; sizeBytes?: number }[];
  status: SubmissionStatus;
  isLate: boolean;
  awardedMarks?: number;
  teacherFeedback?: string;
  rubricGrades?: { criteriaId: string; criteriaName: string; pointsAwarded: number }[];
  gradedAt?: string;
  gradedBy?: string;
}

export interface RubricCriterion {
  id: string;
  name: string;
  maxPoints: number;
  description: string;
  weight: number;
}

export interface AssignmentRubric {
  id: string;
  schoolId: string;
  title: string;
  criteria: RubricCriterion[];
  totalMaxPoints: number;
}

export interface LearningResourceMaterial {
  id: string;
  schoolId: string;
  title: string;
  description: string;
  className: string;
  sectionName?: string;
  subjectName: string;
  chapterTitle?: string;
  resourceType: 'PDF' | 'IMAGE' | 'WORKSHEET' | 'DOCUMENT' | 'PRESENTATION' | 'LINK' | 'VIDEO' | 'NOTES';
  fileUrl: string;
  isPublic: boolean;
  createdBy: string;
  createdByName: string;
  uploadedAt: string;
}

export interface OcrIngestionJob {
  id: string;
  schoolId: string;
  fileName: string;
  fileUrl: string;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'PARTIAL' | 'FAILED' | 'REQUIRES_REVIEW';
  extractedText?: string;
  extractedTopics?: string[];
  extractedQuestionsCount?: number;
  timestamp: string;
}

export interface AiAcademicContentDraft {
  id: string;
  schoolId: string;
  className: string;
  subjectName: string;
  topicName: string;
  contentType: 'SUMMARY' | 'REVISION_NOTES' | 'PRACTICE_QUESTIONS' | 'WORKSHEET' | 'QUIZ' | 'FLASHCARDS' | 'VOCABULARY';
  generatedContent: string;
  status: 'AI_DRAFT' | 'UNDER_TEACHER_REVIEW' | 'APPROVED' | 'REJECTED';
  createdByTeacherId: string;
  approvedByTeacherName?: string;
  generatedAt: string;
}

// --- MASTER PROMPT 10: Examination & Result Management Engine Interfaces ---

export type ExamType =
  | 'WEEKLY_TEST'
  | 'UNIT_TEST'
  | 'CLASS_TEST'
  | 'MONTHLY_TEST'
  | 'PERIODIC_ASSESSMENT'
  | 'MID_TERM'
  | 'HALF_YEARLY'
  | 'PRE_BOARD'
  | 'ANNUAL'
  | 'PRACTICAL'
  | 'ORAL'
  | 'CUSTOM';

export type ExamStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'READY_FOR_REVIEW'
  | 'APPROVED'
  | 'PUBLISHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'RESULTS_PROCESSING'
  | 'RESULTS_APPROVED'
  | 'RESULTS_PUBLISHED'
  | 'ARCHIVED';

export interface Examination {
  id: string;
  schoolId: string;
  name: string;
  code: string;
  academicSession: string;
  examType: ExamType;
  classes: string[];
  startDate: string;
  endDate: string;
  passingPercentage: number;
  status: ExamStatus;
  createdBy: string;
  approvedBy?: string;
}

export interface ExamScheduleSlot {
  id: string;
  examinationId: string;
  schoolId: string;
  date: string;
  startTime: string;
  endTime: string;
  className: string;
  sectionName: string;
  subjectName: string;
  roomName: string;
  invigilatorName: string;
  maxMarks: number;
  durationMinutes: number;
}

export interface QuestionBankEntry {
  id: string;
  schoolId: string;
  className: string;
  subjectName: string;
  chapterTitle?: string;
  topicName?: string;
  questionType: 'MCQ' | 'TRUE_FALSE' | 'FILL_BLANKS' | 'MATCH' | 'SHORT' | 'LONG' | 'NUMERICAL' | 'CASE_STUDY' | 'COMPETENCY';
  questionText: string;
  options?: string[];
  correctAnswer: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  marks: number;
  version: number;
}

export interface ExamBlueprint {
  id: string;
  schoolId: string;
  title: string;
  className: string;
  subjectName: string;
  totalMarks: number;
  durationMinutes: number;
  sections: { sectionTitle: string; questionType: string; count: number; marksEach: number }[];
}

export interface ExamPaperMaster {
  id: string;
  examinationId?: string;
  schoolId: string;
  paperTitle: string;
  className: string;
  subjectName: string;
  totalMarks: number;
  durationMinutes: number;
  questionsSnapshot: QuestionBankEntry[];
  status: 'AI_DRAFT' | 'TEACHER_REVIEW' | 'APPROVED' | 'PUBLISHED';
  approvedBy?: string;
  version: number;
}

export interface MarksAuditTrail {
  timestamp: string;
  oldMarks: number;
  newMarks: number;
  actor: string;
  reason: string;
}

export interface StudentMarksRecord {
  id: string;
  examinationId: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  sectionName: string;
  subjectName: string;
  theoryMarksObtained: number;
  practicalMarksObtained: number;
  totalMarksObtained: number;
  maxMarks: number;
  isAbsent: boolean;
  remarks?: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED';
  enteredBy: string;
  approvedBy?: string;
  auditHistory?: MarksAuditTrail[];
}

export interface GradingBand {
  grade: string;
  minPercentage: number;
  maxPercentage: number;
  gradePoint: number;
  remarks: string;
}

export interface StudentExamResultSummary {
  id: string;
  examinationId: string;
  examinationName: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  admissionNo: string;
  className: string;
  sectionName: string;
  totalObtainedMarks: number;
  totalMaxMarks: number;
  percentage: number;
  grade: string;
  overallResultStatus: 'PASSED' | 'FAILED' | 'NEEDS_SUPPORT' | 'WITHHELD';
  subjectWiseBreakup: {
    subjectName: string;
    theoryMarks: number;
    practicalMarks: number;
    totalMarks: number;
    maxMarks: number;
    grade: string;
    status: 'PASS' | 'FAIL' | 'ABSENT';
  }[];
  status: 'DRAFT' | 'CALCULATED' | 'APPROVED' | 'PUBLISHED';
  approvedBy?: string;
  reportCardPdfUrl?: string;
}

// --- FOV-06R: Real Workflow Engine Interfaces ---

export interface TeacherClassroomSession {
  id: string;
  schoolId: string;
  teacherId: string;
  teacherName: string;
  classId: string;
  className: string;
  sectionName: string;
  subjectName: string;
  periodId: string;
  periodLabel: string;
  roomName: string;
  date: string; // YYYY-MM-DD
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED';
  startTime?: string;
  endTime?: string;
  chapterTitle?: string;
  lessonTaught?: string;
  completionNotes?: string;
  homeworkAssigned?: string;
  attendanceMarked: boolean;
  presentCount: number;
  totalStudentsCount: number;
}

export interface BookCopy {
  id: string; // Accession ID / Barcode, e.g. LIB-901-C01
  bookCode: string;
  title: string;
  author: string;
  status: 'AVAILABLE' | 'ISSUED' | 'LOST' | 'MAINTENANCE';
  currentBorrowerId?: string;
  currentBorrowerName?: string;
  currentBorrowerType?: 'STUDENT' | 'STAFF';
  issuedDate?: string;
  dueDate?: string;
}

export interface LibraryBookMaster {
  id: string;
  code: string;
  title: string;
  author: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  copies: BookCopy[];
}

export interface LibraryTransactionRecord {
  id: string;
  schoolId: string;
  copyId: string;
  bookCode: string;
  bookTitle: string;
  memberId: string;
  memberName: string;
  memberType: 'STUDENT' | 'STAFF';
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'ACTIVE' | 'RETURNED' | 'OVERDUE';
  fineAmount: number;
  remarks?: string;
}

export interface StudentTransportAssignment {
  id: string;
  schoolId: string;
  studentId: string;
  studentName: string;
  className: string;
  section: string;
  parentPhone: string;
  routeId: string;
  routeNumber: string;
  stopName: string;
  pickupTime: string;
  dropTime: string;
  monthlyFee: number;
  status: 'ACTIVE' | 'SUSPENDED';
}

export interface TransportIncident {
  id: string;
  schoolId: string;
  routeId: string;
  routeNumber: string;
  vehicleNumber: string;
  driverName: string;
  incidentType: 'BREAKDOWN' | 'DELAY' | 'ACCIDENT' | 'WEATHER' | 'MAINTENANCE';
  description: string;
  reportedAt: string;
  resolved: boolean;
}

// --- FOV-07: School Store & Marketplace Engine Interfaces ---

export type MarketplaceProductCategory =
  | 'UNIFORM'
  | 'FOOTWEAR'
  | 'BOOKS'
  | 'STATIONERY'
  | 'TEACHER_DRESS'
  | 'ACCESSORIES'
  | 'KIT_BUNDLE';

export type MarketplaceTargetAudience = 'STUDENT' | 'TEACHER' | 'STAFF' | 'ALL';
export type MarketplaceSellerType = 'SCHOOL_DIRECT' | 'AUTHORIZED_VENDOR';

export interface MarketplaceSizeVariant {
  size: string;
  stockQuantity: number;
  sku?: string;
}

export interface KitBundleItemComponent {
  productId: string;
  productName: string;
  category: MarketplaceProductCategory;
  quantity: number;
  individualPriceInPaise: number;
}

export interface MarketplaceProduct {
  id: string;
  schoolId: string; // immutable tenant association
  sku: string;
  name: string;
  description: string;
  category: MarketplaceProductCategory;
  targetAudience: MarketplaceTargetAudience;
  applicableClasses: string[]; // e.g. ['Class VIII', 'Class IX'] or ['ALL']
  priceInPaise: number; // MRP / base price in paise (e.g. 125000 = ₹1,250)
  salePriceInPaise?: number; // Discounted/offer price in paise
  stockQuantity: number; // Overall aggregated stock
  sizeOptions?: string[]; // e.g. ['28', '30', '32', '34'] or ['6', '7', '8']
  sizeVariants?: MarketplaceSizeVariant[];
  colorOptions?: string[];
  isMandatory: boolean; // Mandatory for class admission/uniform
  isActive: boolean;
  sellerType: MarketplaceSellerType;
  badge?: string; // e.g. "CBSE Prescribed", "100% Cotton", "Annual Book Kit"
  imageUrl?: string;
  isKitBundle?: boolean;
  kitComponents?: KitBundleItemComponent[];
  createdAt: string;
  updatedAt: string;
}

export type MarketplaceOrderStatus =
  | 'PENDING_CONFIRMATION'
  | 'CONFIRMED'
  | 'PACKED'
  | 'READY_FOR_PICKUP'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'FAILED_PAYMENT'
  | 'REFUNDED';

export type MarketplacePaymentMode = 'SCHOOL_COUNTER' | 'UPI_ONLINE' | 'FEE_BILL_ADJUST';
export type MarketplacePaymentStatus = 'PAID' | 'PENDING' | 'FAILED' | 'REFUNDED';

export interface MarketplaceOrderItem {
  productId: string;
  productName: string;
  category: MarketplaceProductCategory;
  sku: string;
  selectedSize?: string;
  quantity: number;
  unitPriceInPaise: number; // snapshot at purchase time
  totalPriceInPaise: number; // snapshot
}

export interface MarketplaceOrder {
  id: string;
  orderNo: string; // e.g. "ORD-2026-0001"
  idempotencyKey?: string; // duplicate order prevention
  schoolId: string; // immutable tenant association
  userId: string;
  userName: string;
  userRole: UserRole;
  studentName?: string;
  studentAdmissionNo?: string;
  studentClass?: string;
  items: MarketplaceOrderItem[];
  totalAmountInPaise: number;
  paymentMode: MarketplacePaymentMode;
  paymentStatus: MarketplacePaymentStatus;
  orderStatus: MarketplaceOrderStatus;
  collectionSlot?: string;
  collectionDate?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// FOV-07A: School-wise Independent Payment Gateway Types
// ==========================================
export type PaymentGatewayProvider = 'RAZORPAY' | 'PHONEPE' | 'PAYTM';
export type GatewayEnvironment = 'TEST' | 'LIVE';
export type GatewayOnboardingStatus = 'NOT_CONFIGURED' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
export type GatewayConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
export type SettlementType = 'DIRECT_SCHOOL_MERCHANT' | 'PLATFORM_SPLIT';

export interface SchoolPaymentGatewayConfig {
  schoolId: string; // immutable tenant association
  provider: PaymentGatewayProvider;
  environment: GatewayEnvironment;
  merchantId: string; // Public Merchant ID e.g. "MID_ABC_9921"
  publicKeyId: string; // Public key e.g. "rzp_test_549a..." (NEVER secret keys!)
  webhookEndpointUrl: string; // Server webhook endpoint
  onboardingStatus: GatewayOnboardingStatus;
  connectionStatus: GatewayConnectionStatus;
  settlementType: SettlementType;
  schoolBankAccountMasked: string; // e.g. "SBI A/C ending in 4102"
  isLiveConfirmed: boolean; // Confirmation modal acknowledged
  updatedAt: string;
}

export interface PaymentInitiationRequest {
  orderId: string;
  orderNo: string;
  schoolId: string;
  amountInPaise: number;
  currency: 'INR';
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  provider: PaymentGatewayProvider;
}

export interface PaymentInitiationResult {
  success: boolean;
  gatewayOrderId?: string;
  paymentUrl?: string;
  sdkPayload?: Record<string, unknown>;
  clientSecretMock?: string;
  error?: string;
  status: 'INITIATED' | 'BLOCKED_NO_BACKEND' | 'FAILED';
  verificationCaveat: string;
}

export interface PaymentVerificationRequest {
  schoolId: string;
  orderId: string;
  gatewayPaymentId: string;
  gatewayOrderId: string;
  signatureMock?: string;
}

export interface PaymentVerificationResult {
  verified: boolean;
  status: 'SUCCESS' | 'FAILED' | 'PENDING' | 'BLOCKED_NO_BACKEND';
  amountInPaise: number;
  transactionRef: string;
  message: string;
}

export interface GatewayRefundRequest {
  schoolId: string;
  orderId: string;
  transactionRef: string;
  amountInPaise: number;
  reason: string;
}

export interface GatewayRefundResult {
  refundId: string;
  status: 'PROCESSED' | 'FAILED' | 'BLOCKED_NO_BACKEND';
  amountInPaise: number;
  message: string;
}

export interface PaymentReconciliationRecord {
  id: string;
  schoolId: string;
  orderNo: string;
  provider: PaymentGatewayProvider;
  amountInPaise: number;
  platformFeeInPaise: number;
  netSettledToSchoolInPaise: number;
  status: 'SETTLED' | 'PENDING' | 'REFUNDED';
  settlementDate: string;
  bankRef: string;
}

// ============================================================================
// FOV-08: Subscription, Free Trial, Dynamic Pricing & Attendance Types
// ============================================================================
export type ClassGroupPricingCategory =
  | 'NURSERY'
  | 'LKG_UKG'
  | 'CLASS_1_5'
  | 'CLASS_6_8'
  | 'CLASS_9_10'
  | 'CLASS_11_12';

export type CourseProgramCategory =
  | 'SCHOOL_ERP_CORE'
  | 'NEET_PREP'
  | 'NEET_PG_PREP'
  | 'ENTRANCE_EXAM_PREP';

export type SubscriptionTierStatus =
  | 'TRIAL_ACTIVE'
  | 'TRIAL_EXPIRED'
  | 'ACTIVE_PAID'
  | 'GRACE_PERIOD'
  | 'SUSPENDED';

export interface ClassPricingRule {
  classGroup: ClassGroupPricingCategory;
  label: string;
  pricePerStudentInPaise: number; // e.g. 4500 paise = ₹45/student/month
  minimumCommitment: number;
  effectiveFrom: string;
  version: number;
}

export interface CourseProgramPlan {
  id: string;
  program: CourseProgramCategory;
  name: string;
  description: string;
  pricePerStudentInPaise: number; // e.g. 15000 paise = ₹150/student/month for NEET
  billingCycle: 'MONTHLY' | 'ANNUAL';
  isActive: boolean;
  version: number;
}

export interface SchoolSubscriptionProfile {
  schoolId: string;
  schoolName: string;
  trialStartAt: string;
  trialEndAt: string;
  trialDaysRemaining: number;
  status: SubscriptionTierStatus;
  selectedPrograms: CourseProgramCategory[]; // e.g. Core ERP + NEET Prep
  enrolledCountsByClassGroup: Record<ClassGroupPricingCategory, number>;
  isTrialEligible: boolean; // Single trial enforcement
  activeInvoiceId?: string;
  lastReminderDaySent?: number;
  updatedAt: string;
}

export interface SubscriptionInvoiceLineItem {
  id: string;
  description: string;
  category: ClassGroupPricingCategory | CourseProgramCategory;
  studentCount: number;
  ratePerStudentInPaise: number;
  amountInPaise: number;
}

export interface SubscriptionInvoice {
  id: string;
  invoiceNo: string;
  schoolId: string;
  schoolName: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  lineItems: SubscriptionInvoiceLineItem[];
  subtotalInPaise: number;
  taxInPaise: number;
  discountInPaise: number;
  totalAmountInPaise: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  paidAt?: string;
  paymentRef?: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionTrialNotification {
  id: string;
  schoolId: string;
  dayNumber: number; // Day 1, 20, 21-29, 30
  title: string;
  message: string;
  actionUrl: string;
  status: 'SENT' | 'READ' | 'DISMISSED';
  deliveryChannel: 'IN_APP' | 'EMAIL_NOT_CONFIGURED' | 'SMS_NOT_CONFIGURED';
  createdAt: string;
}

export interface DispatchedEmailPayload {
  to: string;
  recipientName: string;
  subject: string;
  schoolName: string;
  schoolId: string;
  role: string;
  loginId: string;
  username: string;
  password: string;
  loginUrl: string;
  webAppDownloadUrl: string;
  dispatchedAt: string;
}

export interface SystemNotification {
  id: string;
  type: 'SCHOOL_CREDENTIALS' | 'STAFF_CREDENTIALS' | 'STUDENT_CREDENTIALS' | 'ADMISSION_APPROVAL' | 'EXAM_PAPER_REVIEW';
  title: string;
  message: string;
  recipientEmail: string;
  recipientName: string;
  recipientRole: string;
  timestamp: string;
  read: boolean;
  emailPayload?: DispatchedEmailPayload;
}

// Re-export Master Domain Model & Organization Hierarchy Types
export * from './domain';

export type PublicRoute =
  | 'home'
  | 'product'
  | 'features'
  | 'solutions'
  | 'pricing'
  | 'about'
  | 'contact'
  | 'faq'
  | 'privacy'
  | 'terms'
  | 'security'
  | 'register'
  | 'category-detail';

export interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  advertising: boolean;
  timestamp: string;
}

