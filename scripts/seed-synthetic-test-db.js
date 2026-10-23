/**
 * i2A SchoolOS — Dedicated Synthetic Test Database Seeder
 * 
 * Target: i2a_schoolos_synthetic_test
 * Purpose: Provision 100% synthetic, sanitized test fixtures for automated testing.
 * Zero real-world PII (dummy phone numbers, synthetic addresses, synthetic parents).
 * 
 * Safety Rule: Strictly aborts if targeted at the primary application database.
 */

import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const TARGET_DB = process.env.TEST_DB_NAME || 'i2a_schoolos_synthetic_test';

if (TARGET_DB === 'i2a_schoolos') {
  console.error('❌ [FATAL SECURITY ERROR] Synthetic test seeder is strictly forbidden from targeting application database "i2a_schoolos".');
  process.exit(1);
}

export async function seedSyntheticTestDatabase() {
  const client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
  });

  try {
    await client.connect();
    const db = client.db(TARGET_DB);
    console.log(`🗄️ [Synthetic Seeder] Initializing synthetic test database: "${TARGET_DB}"`);

    // 1. Password Hashes (Pre-hashed for fast seed)
    const salt = await bcrypt.genSalt(10);
    const superAdminHash = await bcrypt.hash('SuperAdmin@2026#', salt);
    const principalHash = await bcrypt.hash('Principal@2026#', salt);
    const adminHash = await bcrypt.hash('Admin@2026#', salt);
    const teacherHash = await bcrypt.hash('Teacher@2026#', salt);
    const accountantHash = await bcrypt.hash('Accountant@2026#', salt);
    const staffHash = await bcrypt.hash('Staff@2026#', salt);
    const transportHash = await bcrypt.hash('Transport@2026#', salt);
    const parentHash = await bcrypt.hash('Parent@2026#', salt);
    const studentHash = await bcrypt.hash('Student@2026#', salt);

    // 1.1 Synthetic Organizations
    const organizations = [
      {
        id: 'org-synth-dps',
        orgCode: 'DPS-SYNTH',
        legalName: 'Delhi Public Educational Trust (Synthetic)',
        orgType: 'PRIVATE_TRUST',
        parentOrgId: null,
        registrationNumber: 'SYNTH-REG-TRUST-001',
        primaryContact: {
          name: 'Dr. Vikramaditya (Synthetic Org Director)',
          email: 'director@dpsgroup.example.com',
          phone: '+91 99999 00099'
        },
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      {
        id: 'org-synth-ryan',
        orgCode: 'RYAN-SYNTH',
        legalName: 'Ryan International Group (Synthetic)',
        orgType: 'PRIVATE_TRUST',
        parentOrgId: null,
        primaryContact: {
          name: 'Mr. Augustine (Synthetic Trust Director)',
          email: 'director@ryangroup.example.com',
          phone: '+91 99999 00098'
        },
        status: 'ACTIVE',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      }
    ];

    // 2. Synthetic Tenants
    const tenants = [
      {
        id: 'I2A-SCH-000001',
        orgId: 'org-synth-dps',
        name: 'ABC Public School (Synthetic Test)',
        code: 'ABC-SYNTH',
        board: 'CBSE',
        city: 'Synthetic City',
        adminName: 'Dr. Ramesh Chandra Sharma (Synthetic Principal)',
        adminEmail: 'info@abcpublicschool.edu.in',
        adminPhone: '+91 99999 00001',
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
          name: 'ABC Public School (Synthetic Test)',
          tagline: 'Excellence in Synthetic Testing',
          logoUrl: 'https://images.unsplash.com/photo-1546410531-bb4caa6b424d?w=150',
          stampUrl: 'https://api.iconify.design/emojione-v1:approved.svg',
          principalSignatureUrl: 'https://api.iconify.design/ci:edit-pencil.svg',
          primaryColor: '#4F46E5',
          secondaryColor: '#06B6D4',
          address: '101 Synthetic Campus Road, Block A, Test City - 000001',
          phone: '+91 99999 00001',
          email: 'info@abcpublicschool.edu.in',
          whatsappNumber: '+91 99999 00001',
          website: 'abcpublicschool.test.yourschoolos.com',
          principalName: 'Dr. Ramesh Chandra Sharma (Synthetic Principal)',
          regNumber: 'SYNTH-SCH-2026/001',
          board: 'CBSE',
          medium: 'ENGLISH',
          academicSession: '2026-2027'
        }
      },
      {
        id: 'I2A-SCH-000002',
        orgId: null,
        name: 'St. Xavier Senior Secondary School (Synthetic Test)',
        code: 'STX-SYNTH',
        board: 'ICSE',
        city: 'Synthetic City',
        adminName: 'Fr. Thomas Varghese (Synthetic Admin)',
        adminEmail: 'admin@stxaviers.edu.in',
        adminPhone: '+91 99999 00002',
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
          name: 'St. Xavier Senior Secondary School (Synthetic Test)',
          tagline: 'Duty, Devotion & Synthetic Testing',
          primaryColor: '#2563EB',
          secondaryColor: '#38BDF8',
          address: '102 Synthetic Campus Road, Block B, Test City - 000001',
          phone: '+91 99999 00002',
          email: 'admin@stxaviers.edu.in',
          principalName: 'Fr. Thomas Varghese (Synthetic Admin)',
          board: 'ICSE',
          academicSession: '2026-2027'
        }
      },
      {
        id: 'I2A-SCH-000003',
        orgId: 'org-synth-dps',
        name: 'ABC Public School - Branch 2 (Synthetic Test)',
        code: 'ABC-BR2-SYNTH',
        board: 'CBSE',
        city: 'North Synthetic Campus',
        adminName: 'Mrs. Geeta Pant (Synthetic Branch Head)',
        adminEmail: 'branch2@abcpublicschool.edu.in',
        adminPhone: '+91 99999 00003',
        planId: 'PROFESSIONAL',
        planName: 'Professional Plan',
        billingCycle: 'YEARLY',
        subscriptionStatus: 'ACTIVE',
        registeredAt: '2026-01-10',
        expiresAt: '2027-01-10',
        studentLimit: 500,
        isOnboarded: true
      },
      {
        id: 'I2A-SCH-000004',
        orgId: null,
        name: 'ABC Public School (Synthetic Test)',
        code: 'ABC-INDEP-SYNTH',
        board: 'STATE_BOARD',
        city: 'Independent Valley',
        adminName: 'Mr. Arvind Rao (Synthetic Independent Admin)',
        adminEmail: 'admin@abcindependent.edu.in',
        adminPhone: '+91 99999 00004',
        planId: 'STARTER',
        planName: 'Starter Plan',
        billingCycle: 'YEARLY',
        subscriptionStatus: 'ACTIVE',
        registeredAt: '2026-02-15',
        expiresAt: '2027-02-15',
        studentLimit: 200,
        isOnboarded: true
      }
    ];

    // 3. Synthetic Users
    const users = [
      { id: 'usr-001', name: 'i2A Synthetic Master Admin', email: 'superadmin@i2aschoolos.com', role: 'SUPER_ADMIN', schoolId: 'ALL', passwordHash: superAdminHash, status: 'ACTIVE' },
      { id: 'usr-002', name: 'Dr. Ramesh Chandra Sharma (Synthetic Principal)', email: 'principal@abcpublicschool.edu.in', role: 'PRINCIPAL', schoolId: 'I2A-SCH-000001', orgId: 'org-synth-dps', passwordHash: principalHash, status: 'ACTIVE' },
      { id: 'usr-003', name: 'School Admin Team (Synthetic)', email: 'admin@abcpublicschool.edu.in', role: 'ADMIN', schoolId: 'I2A-SCH-000001', orgId: 'org-synth-dps', passwordHash: adminHash, status: 'ACTIVE' },
      { id: 'usr-004', name: 'Mrs. Sunita Mishra (Synthetic Teacher)', email: 'sunita.mishra@abcpublicschool.edu.in', role: 'TEACHER', schoolId: 'I2A-SCH-000001', assignedClasses: ['Class VIII', 'Class X'], subjects: ['Science', 'Physics'], passwordHash: teacherHash, status: 'ACTIVE' },
      { id: 'usr-005', name: 'Mr. Vikram Singh (Synthetic Teacher)', email: 'vikram.singh@abcpublicschool.edu.in', role: 'TEACHER', schoolId: 'I2A-SCH-000001', assignedClasses: ['Class VIII', 'Class IX'], subjects: ['Mathematics'], passwordHash: teacherHash, status: 'ACTIVE' },
      { id: 'usr-006', name: 'Mr. Alok Nath (Synthetic Accountant)', email: 'alok.nath@abcpublicschool.edu.in', role: 'ACCOUNTANT', schoolId: 'I2A-SCH-000001', passwordHash: accountantHash, status: 'ACTIVE' },
      { id: 'usr-007', name: 'Mr. Rajesh Mohan (Synthetic Staff)', email: 'office@abcpublicschool.edu.in', role: 'STAFF', schoolId: 'I2A-SCH-000001', passwordHash: staffHash, status: 'ACTIVE' },
      { id: 'usr-008', name: 'Manoj Singh (Synthetic Transport)', email: 'driver.manoj@abcpublicschool.edu.in', role: 'TRANSPORT', schoolId: 'I2A-SCH-000001', route: 'TR-01', passwordHash: transportHash, status: 'ACTIVE' },
      { id: 'usr-009', name: 'Sanjay Kumar (Synthetic Parent)', email: 'sanjay.kumar@gmail.com', role: 'PARENT', schoolId: 'I2A-SCH-000001', studentId: 'std-101', childrenIds: ['std-101'], passwordHash: parentHash, status: 'ACTIVE' },
      { id: 'usr-010', name: 'Rahul Kumar (Synthetic Student)', email: 'rahul.kumar@abcpublicschool.edu.in', role: 'STUDENT', schoolId: 'I2A-SCH-000001', studentId: 'std-101', passwordHash: studentHash, status: 'ACTIVE' },
      { id: 'usr-011', name: 'Dr. Vikramaditya (Synthetic Org Director)', email: 'director@dpsgroup.example.com', role: 'ORG_DIRECTOR', schoolId: 'I2A-SCH-000001', orgId: 'org-synth-dps', passwordHash: adminHash, status: 'ACTIVE' },
      { id: 'usr-012', name: 'Fr. Thomas Varghese (Synthetic Admin)', email: 'admin@stxaviers.edu.in', role: 'ADMIN', schoolId: 'I2A-SCH-000002', passwordHash: adminHash, status: 'ACTIVE' },
      { id: 'usr-013', name: 'Mr. Arvind Rao (Synthetic Independent Admin)', email: 'admin@abcindependent.edu.in', role: 'ADMIN', schoolId: 'I2A-SCH-000004', passwordHash: adminHash, status: 'ACTIVE' }
    ];

    // 4. Synthetic Students
    const students = [
      {
        id: 'std-101',
        schoolId: 'I2A-SCH-000001',
        admissionNo: '1024',
        rollNo: '01',
        name: 'Rahul Kumar (Synthetic Student)',
        dob: '2012-05-14',
        gender: 'MALE',
        className: 'Class VIII',
        section: 'A',
        fatherName: 'Synthetic Father 1',
        motherName: 'Synthetic Mother 1',
        parentMobile: '+91 99999 00010',
        parentWhatsApp: '+91 99999 00010',
        parentEmail: 'sanjay.kumar@gmail.com',
        address: '101 Synthetic Avenue, Block A, Test City',
        admissionDate: '2022-04-10',
        status: 'ACTIVE',
        attendanceRate: 94.5
      },
      {
        id: 'std-102',
        schoolId: 'I2A-SCH-000001',
        admissionNo: '1025',
        rollNo: '02',
        name: 'Ananya Sharma (Synthetic Student)',
        dob: '2012-08-20',
        gender: 'FEMALE',
        className: 'Class VIII',
        section: 'A',
        fatherName: 'Synthetic Father 2',
        motherName: 'Synthetic Mother 2',
        parentMobile: '+91 99999 00011',
        parentWhatsApp: '+91 99999 00011',
        parentEmail: 'parent.ananya@test.example.com',
        address: '102 Synthetic Avenue, Block B, Test City',
        admissionDate: '2022-04-12',
        status: 'ACTIVE',
        attendanceRate: 98.2
      },
      {
        id: 'std-103',
        schoolId: 'I2A-SCH-000001',
        admissionNo: '1026',
        rollNo: '03',
        name: 'Rohit Verma (Synthetic Student)',
        dob: '2010-11-05',
        gender: 'MALE',
        className: 'Class X',
        section: 'B',
        fatherName: 'Synthetic Father 3',
        motherName: 'Synthetic Mother 3',
        parentMobile: '+91 99999 00012',
        parentEmail: 'parent.rohit@test.example.com',
        address: '103 Synthetic Avenue, Block C, Test City',
        admissionDate: '2020-04-05',
        status: 'ACTIVE',
        attendanceRate: 82.0
      }
    ];

    // 5. Synthetic Fee Types
    const feeTypes = [
      { id: 'fee-1', schoolId: 'I2A-SCH-000001', name: 'Tuition Fee (Synthetic)', code: 'TUITION', amount: 2000, frequency: 'MONTHLY', category: 'TUITION', isOptional: false },
      { id: 'fee-2', schoolId: 'I2A-SCH-000001', name: 'Activity Fee (Synthetic)', code: 'ACTIVITY', amount: 300, frequency: 'MONTHLY', category: 'ACTIVITY', isOptional: false },
      { id: 'fee-3', schoolId: 'I2A-SCH-000001', name: 'Examination Fee (Synthetic)', code: 'EXAM', amount: 500, frequency: 'QUARTERLY', category: 'LAB', isOptional: false },
      { id: 'fee-4', schoolId: 'I2A-SCH-000001', name: 'Educational Tour Fee (Synthetic)', code: 'TOUR', amount: 2500, frequency: 'ONE_TIME', category: 'CUSTOM', isOptional: true },
      { id: 'fee-5', schoolId: 'I2A-SCH-000001', name: 'Transport Bus Fee (Synthetic)', code: 'TRANS', amount: 1200, frequency: 'MONTHLY', category: 'TRANSPORT', isOptional: true },
      { id: 'fee-6', schoolId: 'I2A-SCH-000001', name: 'Science Laboratory Fee (Synthetic)', code: 'LAB', amount: 750, frequency: 'QUARTERLY', category: 'LAB', isOptional: false }
    ];

    // 6. Synthetic Admissions
    const admissions = [
      { id: 'adm-001', schoolId: 'I2A-SCH-000001', applicationNo: 'APP-SYNTH-001', studentName: 'Aarav Patel (Synthetic)', applyingClass: 'Class VI', parentName: 'Synthetic Parent P1', phone: '+91 99999 00020', email: 'parent1@test.example.com', status: 'SUBMITTED', submittedDate: '2026-10-06', documentsUploaded: true },
      { id: 'adm-002', schoolId: 'I2A-SCH-000001', applicationNo: 'APP-SYNTH-002', studentName: 'Priya Singh (Synthetic)', applyingClass: 'Class VIII', parentName: 'Synthetic Parent P2', phone: '+91 99999 00021', email: 'parent2@test.example.com', status: 'INTERVIEW_SCHEDULED', submittedDate: '2026-10-04', documentsUploaded: true, interviewScore: 88 }
    ];

    // 7. Synthetic Timetable
    const timetables = [
      {
        id: 'tt-synth-001',
        schoolId: 'I2A-SCH-000001',
        className: 'Class VIII',
        section: 'A',
        academicYear: '2026-2027',
        schedule: {
          Monday: [
            { period: 1, subject: 'Mathematics', teacherName: 'Mr. Vikram Singh' },
            { period: 2, subject: 'Science', teacherName: 'Mrs. Sunita Mishra' }
          ]
        }
      }
    ];

    // 8. Synthetic Academic Sessions
    const academicSessions = [
      { id: 'sess-001-2025', schoolId: 'I2A-SCH-000001', sessionName: '2025-2026', startDate: '2025-04-01', endDate: '2026-03-31', status: 'COMPLETED', isCurrent: false },
      { id: 'sess-001-2026', schoolId: 'I2A-SCH-000001', sessionName: '2026-2027', startDate: '2026-04-01', endDate: '2027-03-31', status: 'ACTIVE', isCurrent: true },
      { id: 'sess-002-2026', schoolId: 'I2A-SCH-000002', sessionName: '2026-2027', startDate: '2026-04-01', endDate: '2027-03-31', status: 'ACTIVE', isCurrent: true }
    ];

    // 9. Synthetic Classes & Grades (supporting Pre-Primary, K-12, and Coaching Batches)
    const classes = [
      { id: 'cls-001-nursery', schoolId: 'I2A-SCH-000001', name: 'Nursery', numericOrder: -2, status: 'ACTIVE' },
      { id: 'cls-001-lkg', schoolId: 'I2A-SCH-000001', name: 'LKG', numericOrder: -1, status: 'ACTIVE' },
      { id: 'cls-001-ukg', schoolId: 'I2A-SCH-000001', name: 'UKG', numericOrder: 0, status: 'ACTIVE' },
      { id: 'cls-001-gr8', schoolId: 'I2A-SCH-000001', name: 'Class VIII', numericOrder: 8, status: 'ACTIVE' },
      { id: 'cls-001-gr10', schoolId: 'I2A-SCH-000001', name: 'Class X', numericOrder: 10, status: 'ACTIVE' },
      { id: 'cls-001-neet', schoolId: 'I2A-SCH-000001', name: 'NEET FastTrack Batch', numericOrder: 13, status: 'ACTIVE' }
    ];

    // 10. Synthetic Sections
    const sections = [
      { id: 'sec-001-8a', schoolId: 'I2A-SCH-000001', classId: 'cls-001-gr8', name: 'A', capacity: 40, currentEnrolled: 2, status: 'ACTIVE' },
      { id: 'sec-001-8b', schoolId: 'I2A-SCH-000001', classId: 'cls-001-gr8', name: 'B', capacity: 40, currentEnrolled: 0, status: 'ACTIVE' },
      { id: 'sec-001-10a', schoolId: 'I2A-SCH-000001', classId: 'cls-001-gr10', name: 'A', capacity: 35, currentEnrolled: 1, status: 'ACTIVE' }
    ];

    // 11. Synthetic Student Enrollments (Progression History)
    const studentEnrollments = [
      { id: 'enr-std101-2025', schoolId: 'I2A-SCH-000001', studentId: 'std-101', academicSessionId: 'sess-001-2025', classId: 'cls-001-gr7', className: 'Class VII', sectionId: 'sec-001-7a', section: 'A', status: 'PROMOTED', enrollmentDate: '2025-04-05' },
      { id: 'enr-std101-2026', schoolId: 'I2A-SCH-000001', studentId: 'std-101', academicSessionId: 'sess-001-2026', classId: 'cls-001-gr8', className: 'Class VIII', sectionId: 'sec-001-8a', section: 'A', status: 'ENROLLED', enrollmentDate: '2026-04-05' },
      { id: 'enr-std102-2026', schoolId: 'I2A-SCH-000001', studentId: 'std-102', academicSessionId: 'sess-001-2026', classId: 'cls-001-gr8', className: 'Class VIII', sectionId: 'sec-001-8a', section: 'A', status: 'ENROLLED', enrollmentDate: '2026-04-05' }
    ];

    // 12. Synthetic Guardian Relationships (Multi-Guardian <-> Multi-Student)
    const guardianRelationships = [
      { id: 'rel-std101-usr9', schoolId: 'I2A-SCH-000001', studentId: 'std-101', guardianUserId: 'usr-009', relationshipType: 'FATHER', isPrimaryContact: true, canPickup: true, hasFinancialResponsibility: true },
      { id: 'rel-std101-mother', schoolId: 'I2A-SCH-000001', studentId: 'std-101', guardianUserId: 'usr-mother-1', relationshipType: 'MOTHER', isPrimaryContact: false, canPickup: true, hasFinancialResponsibility: false },
      { id: 'rel-std102-usr9', schoolId: 'I2A-SCH-000001', studentId: 'std-102', guardianUserId: 'usr-009', relationshipType: 'LEGAL_GUARDIAN', isPrimaryContact: false, canPickup: true, hasFinancialResponsibility: true }
    ];

    // Clean write to TARGET_DB only
    const collectionsToSeed = [
      { name: 'organizations', data: organizations, key: 'id' },
      { name: 'tenants', data: tenants, key: 'id' },
      { name: 'users', data: users, key: 'id' },
      { name: 'students', data: students, key: 'id' },
      { name: 'fee_types', data: feeTypes, key: 'id' },
      { name: 'admissions', data: admissions, key: 'id' },
      { name: 'timetables', data: timetables, key: 'id' },
      { name: 'academic_sessions', data: academicSessions, key: 'id' },
      { name: 'classes', data: classes, key: 'id' },
      { name: 'sections', data: sections, key: 'id' },
      { name: 'student_enrollments', data: studentEnrollments, key: 'id' },
      { name: 'guardian_relationships', data: guardianRelationships, key: 'id' }
    ];

    for (const item of collectionsToSeed) {
      const col = db.collection(item.name);
      await col.deleteMany({});
      if (item.data.length > 0) {
        await col.insertMany(item.data);
      }
      await col.createIndex({ [item.key]: 1 }, { unique: true }).catch(() => {});
    }

    // Essential unique indexes for other collections in synthetic test DB
    await db.collection('attendance_locks').deleteMany({});
    await db.collection('attendance_locks').createIndex({ id: 1 }, { unique: true, sparse: true }).catch(() => {});
    await db.collection('attendance_locks').createIndex({ schoolId: 1, date: 1, className: 1 }, { unique: true }).catch(() => {});

    await db.collection('attendance').deleteMany({});
    await db.collection('fee_receipts').deleteMany({});
    await db.collection('notifications').deleteMany({});
    await db.collection('processed_webhooks').deleteMany({});
    await db.collection('processed_webhooks').createIndex({ eventId: 1 }, { unique: true }).catch(() => {});
    await db.collection('audit_logs').deleteMany({});

    console.log(`✅ [Synthetic Seeder] Successfully initialized "${TARGET_DB}" with 100% synthetic fixtures.`);
    return true;
  } finally {
    await client.close();
  }
}

// Allow direct CLI execution
const isDirectCli = process.argv[1] && (process.argv[1].endsWith('seed-synthetic-test-db.js') || process.argv[1].endsWith('seed-synthetic-test-db.js'));
if (isDirectCli) {
  seedSyntheticTestDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Error seeding synthetic test db:', err.message);
      process.exit(1);
    });
}
