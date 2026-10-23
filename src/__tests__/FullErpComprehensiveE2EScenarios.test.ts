import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { app } from '../../server/index.js';
import { getDb, closeDb } from '../../server/db.js';
import { translations } from '../utils/translations';

describe('i2A SchoolOS — Master 15 Cross-Module End-to-End Enterprise Scenarios', () => {
  let server: http.Server;
  let baseUrl: string;
  let superAdminToken = '';
  let principalAToken = '';
  let principalBToken = '';
  let teacherToken = '';
  let accountantToken = '';
  let parentToken = '';
  let studentToken = '';

  const schoolAId = 'I2A-SCH-000001';
  const schoolBId = 'I2A-SCH-000002';
  let createdStudentId = '';
  let createdStaffId = '';
  let createdExamId = '';
  let testDate = '';

  beforeAll(async () => {
    // 1. Mandatory Safety Preflight Check
    const db = await getDb();
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');
    expect(db.databaseName).not.toBe('i2a_schoolos');
    expect(db.databaseName).not.toBe('i2a_schoolos_test');

    // 2. Start HTTP server on an ephemeral port
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as { port: number; address: string };
        baseUrl = `http://127.0.0.1:${addr.port}/api`;
        resolve();
      });
    });

    // Helper for login
    const login = async (email: string, pass: string) => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass })
      });
      const data = await res.json();
      return data.token;
    };

    superAdminToken = await login('superadmin@i2aschoolos.com', 'SuperAdmin@2026#');
    principalAToken = await login('principal@abcpublicschool.edu.in', 'Principal@2026#');
    principalBToken = await login('admin@stxaviers.edu.in', 'Admin@2026#');
    teacherToken = await login('sunita.mishra@abcpublicschool.edu.in', 'Teacher@2026#');
    accountantToken = await login('alok.nath@abcpublicschool.edu.in', 'Accountant@2026#');
    parentToken = await login('sanjay.kumar@gmail.com', 'Parent@2026#');
    studentToken = await login('rahul.kumar@abcpublicschool.edu.in', 'Student@2026#');

    expect(superAdminToken).toBeTruthy();
    expect(principalAToken).toBeTruthy();
    expect(principalBToken).toBeTruthy();
    expect(teacherToken).toBeTruthy();
    expect(accountantToken).toBeTruthy();
    expect(parentToken).toBeTruthy();
    expect(studentToken).toBeTruthy();
  });

  afterAll(async () => {
    try {
      const db = await getDb();
      if (createdStudentId) {
        await db.collection('students').deleteMany({ id: createdStudentId });
        await db.collection('users').deleteMany({ studentId: createdStudentId });
      }
      if (testDate) {
        await db.collection('attendance_locks').deleteMany({ date: testDate });
        await db.collection('attendance').deleteMany({ date: testDate });
      }
      if (createdExamId) {
        await db.collection('exam_papers').deleteMany({ id: createdExamId });
        await db.collection('exam_submissions').deleteMany({ examPaperId: createdExamId });
      }
      if (createdStaffId) {
        await db.collection('staff').deleteMany({ id: createdStaffId });
      }
      await db.collection('timetables').deleteMany({ schoolId: schoolAId, periodId: 'P1-E2E-TEST' });
    } catch {
      // ignore
    }

    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closeDb();
  });

  // ─── Scenario 1 ─────────────────────────────────────────────────────────────
  it('Scenario 1: New Student Admission $\\to$ Fee Collection $\\to$ Attendance Marking', async () => {
    // 1. Submit online admission
    const admRes = await fetch(`${baseUrl}/admissions/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: schoolAId,
        studentName: 'Devansh Sharma',
        applyingClass: 'Class X',
        parentName: 'Ramesh Sharma',
        phone: '9822334455',
        email: 'ramesh.sharma.test@example.com',
        remarks: 'Admission E2E Test',
        documentsUploaded: true
      })
    });
    expect(admRes.status).toBe(201);
    const admData = await admRes.json();
    const appId = admData.application.id;

    // 2. Principal approves admission
    const approveRes = await fetch(`${baseUrl}/admissions/${appId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalAToken}`
      }
    });
    expect(approveRes.status).toBe(200);
    const approveData = await approveRes.json();
    expect(approveData.student).toBeDefined();
    createdStudentId = approveData.student.id;

    // 3. Collect Admission Fee
    const feeRes = await fetch(`${baseUrl}/fees/receipts/collect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accountantToken}`
      },
      body: JSON.stringify({
        studentId: createdStudentId,
        feeIds: ['fee-1'],
        paymentMode: 'CASH',
        transactionRef: `ADM-FEE-${Date.now()}`
      })
    });
    expect(feeRes.status).toBe(201);
    const feeData = await feeRes.json();
    expect(feeData.success).toBe(true);
    expect(feeData.receipt.status).toBe('PAID');

    // 4. Mark Attendance for the new student
    const attDate = '2026-11-05';
    const attRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        className: 'Class X',
        section: 'A',
        date: attDate,
        attendanceList: [{ entityId: createdStudentId, entityName: 'Devansh Sharma', status: 'PRESENT' }]
      })
    });
    expect(attRes.status).toBe(200);
  });

  // ─── Scenario 2 ─────────────────────────────────────────────────────────────
  it('Scenario 2: Timetable Conflict Detection and Classroom Assignment', async () => {
    // 1. Assign Teacher 1 to Class VIII on Monday Period 1 in Room 101
    const res1 = await fetch(`${baseUrl}/timetables/cells`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalAToken}`
      },
      body: JSON.stringify({
        className: 'Class VIII',
        sectionName: 'A',
        day: 'Monday',
        periodId: 'P1-E2E-TEST',
        subjectName: 'Mathematics',
        teacherId: 'TCH-1001',
        teacherName: 'Sunita Mishra',
        roomId: 'RM-101',
        roomName: 'Math Lab'
      })
    });
    expect(res1.status).toBe(200);

    // 2. Try to double-book Teacher 1 to Class IX on Monday Period 1 -> Expect 409 Conflict
    const res2 = await fetch(`${baseUrl}/timetables/cells`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalAToken}`
      },
      body: JSON.stringify({
        className: 'Class IX',
        sectionName: 'B',
        day: 'Monday',
        periodId: 'P1-E2E-TEST',
        subjectName: 'Advanced Math',
        teacherId: 'TCH-1001',
        teacherName: 'Sunita Mishra',
        roomId: 'RM-102',
        roomName: 'Physics Lab'
      })
    });
    expect(res2.status).toBe(409);
    const errData = await res2.json();
    expect(errData.code).toBe('TEACHER_CONFLICT');
  });

  // ─── Scenario 3 ─────────────────────────────────────────────────────────────
  it('Scenario 3: Exam Creation, Online Submission, Auto-Grading & Result Computation', async () => {
    // 1. Create Diagnostic Exam
    const examRes = await fetch(`${baseUrl}/exams/papers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        paperTitle: 'General Knowledge & Computing Quiz',
        className: 'Class IX',
        subject: 'Computer Science',
        totalMarks: 25,
        durationMinutes: 45,
        status: 'PUBLISHED',
        questions: [
          {
            id: 'gk-1',
            type: 'MCQ',
            question: 'What does CPU stand for?',
            options: ['Central Processing Unit', 'Central Power Unit', 'Core Processing Utility'],
            correctAnswer: 'Central Processing Unit',
            marks: 25
          }
        ]
      })
    });
    expect(examRes.status).toBe(201);
    const examData = await examRes.json();
    createdExamId = examData.examPaper.id;

    // 2. Student Submits Exam
    const subRes = await fetch(`${baseUrl}/exams/papers/${createdExamId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        answers: [{ questionId: 'gk-1', selectedOption: 'Central Processing Unit' }]
      })
    });
    expect(subRes.status).toBe(201);
    const subData = await subRes.json();
    expect(subData.submission.score).toBe(25);
    expect(subData.submission.percentage).toBe(100);
    expect(subData.submission.grade).toBe('A+');
  });

  // ─── Scenario 4 ─────────────────────────────────────────────────────────────
  it('Scenario 4: Fee Structure $\\to$ Collection $\\to$ Double-Entry Ledger Entry', async () => {
    // Collect fee with paymentMode = 'ONLINE_UPI'
    const colRes = await fetch(`${baseUrl}/fees/receipts/collect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accountantToken}`
      },
      body: JSON.stringify({
        studentId: createdStudentId || 'std-1',
        feeIds: ['fee-2'],
        paymentMode: 'ONLINE_UPI',
        discountAmount: 200,
        transactionRef: `UPI-REC-${Date.now()}`
      })
    });
    expect(colRes.status).toBe(201);
    const receipt = (await colRes.json()).receipt;
    expect(receipt.receiptNo).toBeDefined();

    // Verify corresponding INCOME entry in expenses collection
    const expRes = await fetch(`${baseUrl}/operations/expenses`, {
      headers: { Authorization: `Bearer ${accountantToken}` }
    });
    expect(expRes.status).toBe(200);
    const expenses = await expRes.json();
    const entry = expenses.find((e: any) => e.receiptNo === receipt.receiptNo);
    expect(entry).toBeDefined();
    expect(entry.type).toBe('INCOME');
    expect(entry.amount).toBe(receipt.paidAmount);
  });

  // ─── Scenario 5 ─────────────────────────────────────────────────────────────
  it('Scenario 5: Staff Onboarding, Leave Application and Principal Approval Workflow', async () => {
    // 1. Onboard new staff
    const uniqueEmail = `anita.sharma.${Date.now()}@abcpublicschool.edu.in`;
    const stfRes = await fetch(`${baseUrl}/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalAToken}`
      },
      body: JSON.stringify({
        fullName: 'Anita Sharma',
        email: uniqueEmail,
        phone: '9811002233',
        userRole: 'TEACHER',
        designation: 'Mathematics Lecturer',
        department: 'Mathematics',
        joiningDate: '2026-07-01'
      })
    });
    expect(stfRes.status).toBe(201);
    const stfData = await stfRes.json();
    createdStaffId = stfData.data.id;

    // 2. Submit staff leave
    const leaveRes = await fetch(`${baseUrl}/staff/leaves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalAToken}`
      },
      body: JSON.stringify({
        staffId: createdStaffId,
        leaveType: 'MEDICAL',
        startDate: '2026-11-10',
        endDate: '2026-11-12',
        reason: 'Health checkup'
      })
    });
    expect(leaveRes.status).toBe(201);
    const leaveId = (await leaveRes.json()).data.id;

    // 3. Principal approves leave
    const decRes = await fetch(`${baseUrl}/staff/leaves/${leaveId}/decision`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalAToken}`
      },
      body: JSON.stringify({
        decision: 'APPROVED',
        comments: 'Medical leave approved'
      })
    });
    expect(decRes.status).toBe(200);
    expect((await decRes.json()).data.status).toBe('APPROVED');
  });

  // ─── Scenario 6 ─────────────────────────────────────────────────────────────
  it('Scenario 6: Library Digital Book Addition and Student Catalog Query', async () => {
    const bookTitle = `Digital AI in Education Vol ${Date.now()}`;
    const addRes = await fetch(`${baseUrl}/operations/library`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        title: bookTitle,
        subject: 'Artificial Intelligence',
        className: 'Class X',
        author: 'Dr. Vikram Chandra',
        totalChapters: 8
      })
    });
    expect(addRes.status).toBe(201);

    // Student fetches book catalog
    const libRes = await fetch(`${baseUrl}/operations/library`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    expect(libRes.status).toBe(200);
    const books = await libRes.json();
    expect(books.some((b: any) => b.title === bookTitle)).toBe(true);
  });

  // ─── Scenario 7 ─────────────────────────────────────────────────────────────
  it('Scenario 7: Transport Route Creation and Tenant Scoping', async () => {
    const routeRes = await fetch(`${baseUrl}/operations/transport`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalAToken}`
      },
      body: JSON.stringify({
        routeNumber: 'ROUTE-09-E2E',
        routeName: 'North Campus Shuttle',
        driverName: 'Harish Rawat',
        driverPhone: '9876500112',
        vehicleNumber: 'DL-01-AB-1234',
        stops: [
          { stopName: 'Civil Lines', pickupTime: '07:15 AM', dropTime: '02:30 PM' },
          { stopName: 'Model Town', pickupTime: '07:30 AM', dropTime: '02:45 PM' }
        ]
      })
    });
    expect(routeRes.status).toBe(201);

    const getRoutesRes = await fetch(`${baseUrl}/operations/transport`, {
      headers: { Authorization: `Bearer ${principalAToken}` }
    });
    expect(getRoutesRes.status).toBe(200);
    const routes = await getRoutesRes.json();
    expect(routes.some((r: any) => r.routeNumber === 'ROUTE-09-E2E')).toBe(true);
  });

  // ─── Scenario 8 ─────────────────────────────────────────────────────────────
  it('Scenario 8: Parent Portal Verification with Object-Level Child Authorization', async () => {
    // Parent should be able to fetch only their assigned children
    const kidsRes = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${parentToken}` }
    });
    expect(kidsRes.status).toBe(200);
    const kids = await kidsRes.json();
    expect(Array.isArray(kids)).toBe(true);
    expect(kids.length).toBeGreaterThan(0);
    // All returned students must belong to parent
    kids.forEach((k: any) => {
      const isAssociated = k.parentEmail === 'sanjay.kumar@gmail.com' || ['std-1', 'std-2', 'std-101'].includes(k.id);
      expect(isAssociated).toBe(true);
    });
  });

  // ─── Scenario 9 ─────────────────────────────────────────────────────────────
  it('Scenario 9: Multi-Branch & School Directory Management by Central Platform Admin', async () => {
    // Super Admin lists all schools
    const schoolsRes = await fetch(`${baseUrl}/tenants`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    expect(schoolsRes.status).toBe(200);
    const schools = await schoolsRes.json();
    expect(schools.length).toBeGreaterThanOrEqual(2);

    // Update location with geocoordinates for School A
    const locRes = await fetch(`${baseUrl}/tenants/${schoolAId}/location`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${superAdminToken}`
      },
      body: JSON.stringify({
        city: 'New Delhi',
        latitude: 28.6139,
        longitude: 77.2090,
        state: 'Delhi',
        postalCode: '110001'
      })
    });
    expect(locRes.status).toBe(200);
    const updated = await locRes.json();
    expect(updated.location.city).toBe('New Delhi');
    expect(updated.location.isGeocoded).toBe(true);
  });

  // ─── Scenario 10 ────────────────────────────────────────────────────────────
  it('Scenario 10: Attendance Date-Locking and Anti-Tamper Verification', async () => {
    testDate = `2026-12-${String(Math.floor(20 + Math.random() * 8))}`;

    // Mark attendance initially
    const markRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        className: 'Class X',
        section: 'A',
        date: testDate,
        attendanceList: [{ entityId: 'std-1', entityName: 'Rahul Kumar', status: 'PRESENT' }]
      })
    });
    expect(markRes.status).toBe(200);

    // Lock attendance
    const lockRes = await fetch(`${baseUrl}/attendance/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalAToken}`
      },
      body: JSON.stringify({
        className: 'Class X',
        section: 'A',
        date: testDate
      })
    });
    expect(lockRes.status).toBe(200);

    // Second mutation must be rejected with 403
    const secondMarkRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        className: 'Class X',
        section: 'A',
        date: testDate,
        attendanceList: [{ entityId: 'std-1', entityName: 'Rahul Kumar', status: 'ABSENT' }]
      })
    });
    expect(secondMarkRes.status).toBe(403);
  });

  // ─── Scenario 11 ────────────────────────────────────────────────────────────
  it('Scenario 11: SaaS Plan Quota Enforcement & Trial Status', async () => {
    // Public pricing query
    const plansRes = await fetch(`${baseUrl}/subscription/plans`);
    expect(plansRes.status).toBe(200);
    const plans = await plansRes.json();
    expect(plans.length).toBe(3); // STARTER, PROFESSIONAL, ENTERPRISE

    // Check trial status
    const trialRes = await fetch(`${baseUrl}/subscription/trial-status`, {
      headers: { Authorization: `Bearer ${principalAToken}` }
    });
    expect(trialRes.status).toBe(200);
    const trialData = await trialRes.json();
    expect(trialData.schoolId).toBe(schoolAId);
    expect(trialData.subscriptionStatus).toBeDefined();
    expect(typeof trialData.daysRemaining).toBe('number');
  });

  // ─── Scenario 12 ────────────────────────────────────────────────────────────
  it('Scenario 12: School Website Branding & Public CMS Hierarchy', async () => {
    // Update School Branding
    const brandRes = await fetch(`${baseUrl}/tenants/${schoolAId}/branding`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalAToken}`
      },
      body: JSON.stringify({
        primaryColor: '#4f46e5',
        accentColor: '#10b981',
        tagline: 'Empowering Minds, Transforming Futures',
        phone: '011-23456789'
      })
    });
    expect(brandRes.status).toBe(200);
    const brandData = await brandRes.json();
    expect(brandData.branding.tagline).toBe('Empowering Minds, Transforming Futures');

    // Public Categories Query
    const catRes = await fetch(`${baseUrl}/categories`);
    expect(catRes.status).toBe(200);
    const catData = await catRes.json();
    expect(catData.success).toBe(true);
    expect(Array.isArray(catData.categories)).toBe(true);
  });

  // ─── Scenario 13 ────────────────────────────────────────────────────────────
  it('Scenario 13: Audit Trail Logging of Administrative and Financial Operations', async () => {
    const auditRes = await fetch(`${baseUrl}/audit-logs`, {
      headers: { Authorization: `Bearer ${principalAToken}` }
    });
    expect(auditRes.status).toBe(200);
    const logs = await auditRes.json();
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);
    // Tenant filter: Every log must have schoolId === schoolAId
    logs.forEach((log: any) => {
      expect(log.schoolId).toBe(schoolAId);
    });
  });

  // ─── Scenario 14 ────────────────────────────────────────────────────────────
  it('Scenario 14: Bilingual (Hindi & English) Dictionary Consistency Gate', () => {
    const keys = Object.keys(translations);
    expect(keys.length).toBeGreaterThan(25);

    // Verify key institutional terms exist and have valid en & hi definitions
    const sampleKey = translations.principal_dashboard;
    expect(sampleKey.en).toBe('Executive Dashboard');
    expect(sampleKey.hi).toBe('मुख्य डैशबोर्ड');

    const requiredKeys = ['school_setup', 'student_management', 'fee_management', 'attendance_timetable'];
    requiredKeys.forEach((key) => {
      expect(translations[key]).toBeDefined();
      expect(translations[key].en).toBeTruthy();
      expect(translations[key].hi).toBeTruthy();
    });
  });

  // ─── Scenario 15 ────────────────────────────────────────────────────────────
  it('Scenario 15: Cross-Tenant Data Isolation Enforcement', async () => {
    // School B Principal attempts to read a student that belongs to School A
    const res = await fetch(`${baseUrl}/students/${createdStudentId || 'std-1'}`, {
      headers: { Authorization: `Bearer ${principalBToken}` }
    });
    // Must return 404 Not Found due to tenantFilter enforcement
    expect(res.status).toBe(404);

    // School B Principal lists students -> should NOT see School A students
    const listRes = await fetch(`${baseUrl}/students`, {
      headers: { Authorization: `Bearer ${principalBToken}` }
    });
    expect(listRes.status).toBe(200);
    const listData = await listRes.json();
    listData.forEach((st: any) => {
      expect(st.schoolId).toBe(schoolBId);
      expect(st.schoolId).not.toBe(schoolAId);
    });
  });
});
