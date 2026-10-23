# Domain Model Blueprint & Universal Schema Architecture
**i2A SchoolOS — Global Multi-Tenant Education Management Platform**  
*Document Ref: i2A-STRAT-011 | Date: October 17, 2026 | Status: ARCHITECTURAL_BLUEPRINT*

---

## 1. Domain Modeling Philosophy

To eliminate the brittle legacy pattern of hardcoding grades ("Grade 1 to 12") or national curriculums, i2A SchoolOS defines a **Universal Hierarchical Education Model**. Whether an institution is a playschool in Pune, an ICSE high school in Kolkata, an IIT-JEE coaching academy in Kota, or a polytechnic college in Bengaluru, the identical core entities represent the academic and operational reality without code modifications.

---

## 2. Core Entities & Field Specifications

### 2.1 Institutional Core & Multi-Tenant Entities

#### `organizations` (Top-Level Group / Trust)
```typescript
interface Organization {
  id: string;                     // "org_uuid_..."
  orgCode: string;                // "ORG-DEL-001" (unique index)
  legalName: string;              // "Delhi Public School Society"
  orgType: 'PRIVATE_TRUST' | 'CORPORATE_GROUP' | 'GOVT_DEPARTMENT' | 'COACHING_FEDERATION';
  registrationNo: string;         // Society / Trust registration certificate no.
  primaryContact: {
    name: string;
    email: string;
    phone: string;
  };
  billingPlan: 'TIER_10' | 'TIER_20' | 'TIER_30' | 'TIER_40' | 'TIER_50' | 'CUSTOM_ENTERPRISE';
  status: 'ACTIVE' | 'SUSPENDED' | 'ARCHIVED';
  createdAt: string;              // ISO UTC
  updatedAt: string;
}
```

#### `schools` (Individual Campus / Branch / Institution)
```typescript
interface SchoolTenant {
  id: string;                     // "I2A-SCH-XXXXXX" (unique index)
  orgId?: string;                 // FK -> organizations.id (nullable if independent school)
  code: string;                   // "SCH-001" (unique index)
  name: string;                   // "ABC Public School" (never used as unique key)
  institutionType: 'K12_SCHOOL' | 'PLAY_SCHOOL' | 'COLLEGE' | 'COACHING_CENTRE' | 'TUITION_ACADEMY' | 'ACTIVITY_CENTRE';
  boardAffiliation: 'CBSE' | 'ICSE' | 'STATE_BOARD' | 'IB' | 'CAMBRIDGE' | 'UNIVERSITY' | 'AUTONOMOUS';
  affiliationNumber?: string;     // e.g. CBSE Affiliation No. "2130001"
  officialIdentifiers: {
    udiseCode?: string;           // 11-digit official government UDISE+ code
    panNumber?: string;
    gstin?: string;
  };
  address: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;              // ISO alpha-2 ("IN", "AE", "US")
  };
  branding: {
    logoUrl: string;
    primaryColor: string;         // Hex e.g. "#1e3a8a"
    secondaryColor: string;
    tagline: string;
    reportCardHeader: string;
    invoiceHeader: string;
    signatureStampUrl?: string;
  };
  paymentGatewayConfig: {
    provider: 'RAZORPAY' | 'PHONEPE' | 'PAYTM' | 'NONE';
    merchantId?: string;
    apiKeyId?: string;
    webhookSecret?: string;       // Encrypted at rest
    isEnabled: boolean;
  };
  subscription: {
    tier: 'TIER_10' | 'TIER_20' | 'TIER_30' | 'TIER_40' | 'TIER_50';
    status: 'TRIAL' | 'ACTIVE' | 'GRACE_PERIOD' | 'EXPIRED' | 'SUSPENDED';
    trialStartAt: number;         // UTC ms
    trialEndAt: number;
    billingInterval: 'MONTHLY' | 'ANNUAL_1YR' | 'ANNUAL_2YR' | 'ANNUAL_3YR' | 'ANNUAL_5YR';
    discountPercent: number;      // 0 to 40 (enforced)
  };
  status: 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}
```

---

### 2.2 Academic Core Entities

#### `academic_sessions` (Calendar Year / Term)
```typescript
interface AcademicSession {
  id: string;                     // "sess-2026-2027"
  schoolId: string;               // FK -> schools.id (indexed)
  sessionName: string;            // "2026-2027"
  startDate: string;              // "2026-04-01"
  endDate: string;                // "2027-03-31"
  isCurrent: boolean;             // Only one active current session per school
  status: 'UPCOMING' | 'ACTIVE' | 'CONCLUDED' | 'ARCHIVED';
}
```

#### `programs` (Curriculum Streams / Education Levels)
```typescript
interface Program {
  id: string;                     // "prog-k12-sec"
  schoolId: string;
  name: string;                   // "Primary Education", "Senior Secondary Science", "NEET Medical"
  level: 'PRE_PRIMARY' | 'PRIMARY' | 'MIDDLE' | 'SECONDARY' | 'SENIOR_SECONDARY' | 'UNDERGRADUATE' | 'COACHING';
  assessmentScheme: 'CCE' | 'PERCENTAGE' | 'CBSE_CGPA' | 'ICSE' | 'NEP_HPC' | 'CREDIT_SEMESTER';
}
```

#### `classes` (Specific Grades / Standards / Batches)
```typescript
interface SchoolClass {
  id: string;                     // "cls-010"
  schoolId: string;
  programId: string;              // FK -> programs.id
  name: string;                   // "Class X", "Batch A - Morning", "Nursery", "B.Tech Sem 1"
  numericalOrder: number;         // 1 to 12 (for sorting/progression)
  sections: string[];             // ["Section A", "Section B", "Section C"]
}
```

#### `subjects` & `teacher_assignments`
```typescript
interface Subject {
  id: string;
  schoolId: string;
  classId: string;
  name: string;                   // "Mathematics", "Physics", "English Literature"
  code: string;                   // "MATH-041"
  isElective: boolean;
  creditHoursPerWeek: number;
}

interface TeacherAssignment {
  id: string;
  schoolId: string;
  teacherId: string;              // FK -> users.id
  classId: string;
  sectionName: string;
  subjectId: string;
  academicSessionId: string;
  isClassTeacher: boolean;
}
```

---

### 2.3 User, Student, Parent & Staff Entities

#### `users` (Unified Single-Record Person Account)
```typescript
interface User {
  id: string;                     // "usr-uuid-..."
  schoolId: string;               // Primary affiliated school
  orgId?: string;
  email: string;                  // Unique indexed
  phone?: string;
  passwordHash: string;           // bcrypt 10 rounds
  name: string;
  role: 'SUPER_ADMIN' | 'ORG_DIRECTOR' | 'SCHOOL_OWNER' | 'PRINCIPAL' | 'TEACHER' | 'ACCOUNTANT' | 'STAFF' | 'TRANSPORT' | 'PARENT' | 'STUDENT';
  status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' | 'REVOKED';
  mfaEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}
```

#### `students` (Student Information System Record)
```typescript
interface Student {
  id: string;                     // "std-uuid-..."
  schoolId: string;               // Immutable tenant ID
  admissionNo: string;            // Unique per school: { schoolId: 1, admissionNo: 1 }
  rollNumber: string;
  firstName: string;
  lastName: string;
  dob: string;                    // YYYY-MM-DD
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  currentClass: string;           // "Class X"
  currentSection: string;         // "Section A"
  academicSessionId: string;
  status: 'ACTIVE' | 'PROVISIONAL' | 'TRANSFERRED' | 'WITHDRAWN' | 'SUSPENDED';
  admissionDate: string;
  officialIdentifiers: {
    aadhaarNumberMasked?: string; // Stored as "XXXX-XXXX-1234"
    penNumber?: string;           // Permanent Education Number (National)
    apaarId?: string;             // APAAR Education ID
  };
  address: {
    residentialAddress: string;
    city: string;
    state: string;
    pincode: string;
  };
  medicalRecord?: {
    allergies: string[];
    chronicConditions: string[];
    emergencyContactName: string;
    emergencyContactPhone: string;
  };
  documents: {
    documentType: 'BIRTH_CERTIFICATE' | 'TRANSFER_CERTIFICATE' | 'AADHAAR' | 'REPORT_CARD' | 'CASTE_CERT';
    documentUrl: string;
    verified: boolean;
    uploadedAt: string;
  }[];
}
```

#### `parent_student_links` (IDOR Prevention Boundary)
```typescript
interface ParentStudentLink {
  id: string;
  schoolId: string;
  parentId: string;               // FK -> users.id (role == 'PARENT')
  studentId: string;              // FK -> students.id
  relationship: 'FATHER' | 'MOTHER' | 'LEGAL_GUARDIAN' | 'AUTHORIZED_SPONSOR';
  isPrimaryContact: boolean;
  canPickup: boolean;
  hasFinancialResponsibility: boolean;
  verifiedAt: string;
}
```

---

### 2.4 Financial & Fee Entities (Paise-Precision Ledgers)

#### `fee_types` & `fee_receipts`
```typescript
interface FeeType {
  id: string;
  schoolId: string;
  name: string;                   // "Tuition Fee - Q1", "Annual Activity Charge"
  category: 'TUITION' | 'ANNUAL' | 'TRANSPORT' | 'LABORATORY' | 'EXAMINATION' | 'HOSTEL';
  amountInPaise: number;          // Strictly integer paise e.g. 150000 = ₹1,500.00
  applicableClasses: string[];    // ["Class IX", "Class X"]
  frequency: 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  dueDate: string;                // YYYY-MM-DD
  lateFinePerDayInPaise: number;
}

interface FeeReceipt {
  id: string;                     // "rec-2026-XXXX"
  schoolId: string;
  receiptNumber: string;          // "REC-2026-0001"
  studentId: string;
  studentName: string;
  studentAdmissionNo: string;
  className: string;
  feeItemIds: string[];
  totalAmountInPaise: number;
  discountInPaise: number;
  fineInPaise: number;
  netPaidInPaise: number;
  paymentMode: 'CASH' | 'CHEQUE' | 'UPI_ONLINE' | 'NEFT_RTGS' | 'POS_CARD';
  paymentStatus: 'PAID' | 'PENDING' | 'REVERSED' | 'REFUNDED';
  transactionReference?: string;  // UTR / Cheque No. / Gateway Payment ID
  collectedByUserId: string;
  collectedAt: string;
}
```

---

### 2.5 School Marketplace Entities

#### `marketplace_products` & `marketplace_orders`
```typescript
interface MarketplaceProduct {
  id: string;
  schoolId: string;
  sku: string;                    // "ABC-UNI-BS-01"
  name: string;                   // "Summer Uniform Set"
  category: 'UNIFORM' | 'SHOES' | 'BOOKS' | 'STATIONERY' | 'KIT_BUNDLE';
  priceInPaise: number;
  salePriceInPaise?: number;
  stockQuantity: number;
  isKitBundle: boolean;
  kitComponents?: {
    productId: string;
    productName: string;
    quantity: number;
  }[];
  isActive: boolean;
}

interface MarketplaceOrder {
  id: string;
  orderNo: string;                // "ORD-2026-0001"
  idempotencyKey?: string;        // Duplicate submission prevention
  schoolId: string;
  userId: string;                 // FK -> users.id (parent or student)
  items: {
    productId: string;
    productName: string;
    selectedSize?: string;
    quantity: number;
    unitPriceInPaise: number;
    totalPriceInPaise: number;
  }[];
  totalAmountInPaise: number;
  paymentMode: 'UPI_ONLINE' | 'PAY_AT_COUNTER';
  paymentStatus: 'PAID' | 'PENDING' | 'REFUNDED';
  orderStatus: 'CONFIRMED' | 'PACKED' | 'DELIVERED' | 'CANCELLED';
  collectionSlot?: string;
  createdAt: string;
}
```
