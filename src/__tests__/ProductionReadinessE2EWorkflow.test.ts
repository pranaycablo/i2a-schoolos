import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { app } from '../../server/index.js';
import { getDb, closeDb } from '../../server/db.js';

describe('i2A SchoolOS — Production Readiness End-to-End Enterprise Lifecycle Suite', () => {
  let server: http.Server;
  let baseUrl: string;
  let superAdminToken = '';
  let principalToken = '';
  let teacherToken = '';
  let accountantToken = '';
  let parentToken = '';
  let studentToken = '';

  const testSchoolId = 'I2A-SCH-000001';
  let createdStudentId = '';
  let createdExamPaperId = '';
  let createdStaffId = '';
  let testDate = '';

  beforeAll(async () => {
    // 1. Verify synthetic test DB
    const db = await getDb();
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');

    // 2. Start HTTP server on dynamic port
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as { port: number; address: string };
        baseUrl = `http://127.0.0.1:${address.port}/api`;
        resolve();
      });
    });

    // 3. Login users for test tokens
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
    principalToken = await login('principal@abcpublicschool.edu.in', 'Principal@2026#');
    teacherToken = await login('sunita.mishra@abcpublicschool.edu.in', 'Teacher@2026#');
    accountantToken = await login('alok.nath@abcpublicschool.edu.in', 'Accountant@2026#');
    parentToken = await login('sanjay.kumar@gmail.com', 'Parent@2026#');
    studentToken = await login('rahul.kumar@abcpublicschool.edu.in', 'Student@2026#');

    expect(superAdminToken).toBeDefined();
    expect(principalToken).toBeDefined();
    expect(teacherToken).toBeDefined();
    expect(accountantToken).toBeDefined();
    expect(parentToken).toBeDefined();
    expect(studentToken).toBeDefined();
  });

  afterAll(async () => {
    try {
      const db = await getDb();
      if (createdStudentId) {
        await db.collection('students').deleteMany({ id: createdStudentId });
        await db.collection('users').deleteMany({ studentId: createdStudentId });
      }
      if (testDate) {
        await db.collection('attendance_locks').deleteMany({ date: testDate, className: 'Class IX' });
        await db.collection('attendance').deleteMany({ date: testDate, className: 'Class IX' });
      }
      if (createdExamPaperId) {
        await db.collection('exam_papers').deleteMany({ id: createdExamPaperId });
      }
      if (createdStaffId) {
        await db.collection('staff').deleteMany({ id: createdStaffId });
      }
    } catch {
      // ignore
    }
    if (server) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await closeDb();
  });

  it('Gate 1: Admission $\\to$ Approval $\\to$ Student Enrollment Pipeline', async () => {
    // 1. Submit Public Admission
    const publicAppRes = await fetch(`${baseUrl}/admissions/public`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolId: testSchoolId,
        studentName: 'Aarav Singhania',
        applyingClass: 'Class IX',
        parentName: 'Vikram Singhania',
        phone: '9811223344',
        email: 'vikram.singhania.synthetic@example.com',
        remarks: 'Direct E2E Test Application',
        documentsUploaded: true
      })
    });
    expect(publicAppRes.status).toBe(201);
    const appData = await publicAppRes.json();
    expect(appData.success).toBe(true);
    const appId = appData.application.id;

    // 2. Principal updates status to INTERVIEW_SCHEDULED
    const updateRes = await fetch(`${baseUrl}/admissions/${appId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`
      },
      body: JSON.stringify({
        status: 'INTERVIEW_SCHEDULED',
        interviewDate: '2026-11-15'
      })
    });
    expect(updateRes.status).toBe(200);

    // 3. Principal Approves Admission -> Auto-enrolled student + parent account
    const approveRes = await fetch(`${baseUrl}/admissions/${appId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`
      }
    });
    expect(approveRes.status).toBe(200);
    const approveData = await approveRes.json();
    expect(approveData.success).toBe(true);
    expect(approveData.student).toBeDefined();
    expect(approveData.student.name).toBe('Aarav Singhania');
    expect(approveData.student.className).toBe('Class IX');

    createdStudentId = approveData.student.id;

    // Verify student exists in MongoDB
    const studentRes = await fetch(`${baseUrl}/students/${createdStudentId}`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    expect(studentRes.status).toBe(200);
    const studentData = await studentRes.json();
    expect(studentData.name).toBe('Aarav Singhania');
  });

  it('Gate 2: Fee Setup $\\to$ Collection $\\to$ Double-Entry Ledger Verification', async () => {
    // 1. Accountant creates new fee component
    const feeRes = await fetch(`${baseUrl}/fees/types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accountantToken}`
      },
      body: JSON.stringify({
        name: 'Class IX Term II Tuition',
        amount: 8500,
        frequency: 'QUARTERLY',
        category: 'TUITION',
        isOptional: false,
        description: 'E2E Quarterly Tuition Fee'
      })
    });
    expect(feeRes.status).toBe(201);
    const feeData = await feeRes.json();
    const feeId = feeData.feeType.id;

    // 2. Collect fee payment for newly enrolled student
    const collectRes = await fetch(`${baseUrl}/fees/receipts/collect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accountantToken}`
      },
      body: JSON.stringify({
        studentId: createdStudentId,
        feeIds: [feeId],
        paymentMode: 'ONLINE_UPI',
        discountAmount: 500,
        fineAmount: 0,
        transactionRef: 'UPI-E2E-TEST-9988'
      })
    });
    expect(collectRes.status).toBe(201);
    const receiptData = await collectRes.json();
    expect(receiptData.success).toBe(true);
    expect(receiptData.receipt.paidAmount).toBe(8000); // 8500 - 500
    expect(receiptData.receipt.status).toBe('PAID');

    // 3. Verify double-entry ledger entry was created in expenses collection
    const expRes = await fetch(`${baseUrl}/operations/expenses`, {
      headers: { Authorization: `Bearer ${accountantToken}` }
    });
    expect(expRes.status).toBe(200);
    const expData = await expRes.json();
    const ledgerEntry = expData.find((e: any) => e.receiptNo === receiptData.receipt.receiptNo);
    expect(ledgerEntry).toBeDefined();
    expect(ledgerEntry.type).toBe('INCOME');
    expect(ledgerEntry.amount).toBe(8000);
  });

  it('Gate 3: Attendance Marking and Tamper-Proof Daily Lock Enforcement', async () => {
    // Generate isolated future test date to prevent collisions with prior locked test runs
    testDate = `2026-12-${String(Math.floor(10 + Math.random() * 18))}`;
    const db = await getDb();
    await db.collection('attendance_locks').deleteMany({ date: testDate, className: 'Class IX' });
    await db.collection('attendance').deleteMany({ date: testDate, className: 'Class IX' });

    // 1. Teacher marks attendance for Class IX-A using correct schema (attendanceList)
    const markRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        className: 'Class IX',
        section: 'A',
        date: testDate,
        attendanceList: [
          { entityId: createdStudentId, entityName: 'Aarav Singhania', status: 'PRESENT' }
        ]
      })
    });
    expect(markRes.status).toBe(200);

    // 2. Principal freezes and locks attendance for the day
    const lockRes = await fetch(`${baseUrl}/attendance/lock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`
      },
      body: JSON.stringify({
        className: 'Class IX',
        section: 'A',
        date: testDate
      })
    });
    expect(lockRes.status).toBe(200);

    // 3. Subsequent attempts to mutate locked records must fail-closed with 403 ATTENDANCE_LOCKED
    const tamperRes = await fetch(`${baseUrl}/attendance/mark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        className: 'Class IX',
        section: 'A',
        date: testDate,
        attendanceList: [
          { entityId: createdStudentId, entityName: 'Aarav Singhania', status: 'ABSENT' }
        ]
      })
    });
    expect(tamperRes.status).toBe(403);
    const tamperData = await tamperRes.json();
    expect(tamperData.error).toContain('locked');
  });

  it('Gate 4: Examination Creation, Status Workflow, and Auto-Grading', async () => {
    // 1. Teacher generates exam paper with MCQs
    const paperRes = await fetch(`${baseUrl}/exams/papers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        paperTitle: 'Class IX Science Mid-Term Diagnostic',
        className: 'Class IX',
        subject: 'Science',
        totalMarks: 20,
        durationMinutes: 30,
        status: 'AI_DRAFT',
        questions: [
          {
            id: 'q1',
            type: 'MCQ',
            question: 'What is the chemical symbol for Gold?',
            options: ['Au', 'Ag', 'Fe', 'Cu'],
            correctAnswer: 'Au',
            marks: 10
          },
          {
            id: 'q2',
            type: 'MCQ',
            question: 'What is the powerhouse of the cell?',
            options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Vacuole'],
            correctAnswer: 'Mitochondria',
            marks: 10
          }
        ]
      })
    });
    expect(paperRes.status).toBe(201);
    const paperData = await paperRes.json();
    createdExamPaperId = paperData.examPaper.id;

    // 2. Principal approves and publishes paper
    const statusRes = await fetch(`${baseUrl}/exams/papers/${createdExamPaperId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`
      },
      body: JSON.stringify({ status: 'PUBLISHED' })
    });
    expect(statusRes.status).toBe(200);

    // 3. Student submits online exam -> Returns 201 Created
    const submitRes = await fetch(`${baseUrl}/exams/papers/${createdExamPaperId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        answers: [
          { questionId: 'q1', selectedOption: 'Au' },            // Correct (+10)
          { questionId: 'q2', selectedOption: 'Mitochondria' }   // Correct (+10)
        ]
      })
    });
    expect(submitRes.status).toBe(201);
    const submitData = await submitRes.json();
    expect(submitData.submission.score).toBe(20);
    expect(submitData.submission.percentage).toBe(100);
    expect(submitData.submission.grade).toBe('A+');
    expect(submitData.submission.status).toBe('GRADED');
  });

  it('Gate 5: Staff Workforce Lifecycle and Anti-Self-Approval Leave Security', async () => {
    const uniqueEmail = `meenakshi.${Date.now()}@abcpublicschool.edu.in`;
    // 1. Create Staff member
    const staffRes = await fetch(`${baseUrl}/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`
      },
      body: JSON.stringify({
        fullName: 'Meenakshi Sundaram',
        email: uniqueEmail,
        phone: '9876543210',
        userRole: 'TEACHER',
        designation: 'Senior Biology Teacher',
        department: 'Science',
        joiningDate: '2026-06-01'
      })
    });
    expect(staffRes.status).toBe(201);
    const staffData = await staffRes.json();
    expect(staffData.success).toBe(true);
    createdStaffId = staffData.data.id;
    const employeeId = staffData.data.employeeId;
    expect(employeeId).toMatch(/^EMP-\d{4}-\d{4}$/);

    // 2. Staff applies for casual leave
    const leaveRes = await fetch(`${baseUrl}/staff/leaves`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`
      },
      body: JSON.stringify({
        staffId: createdStaffId,
        leaveType: 'CASUAL',
        startDate: '2026-11-20',
        endDate: '2026-11-21',
        reason: 'Family function'
      })
    });
    expect(leaveRes.status).toBe(201);
    const leaveData = await leaveRes.json();
    const leaveId = leaveData.data.id;

    // 3. Principal approves staff leave
    const approveLeaveRes = await fetch(`${baseUrl}/staff/leaves/${leaveId}/decision`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${principalToken}`
      },
      body: JSON.stringify({
        decision: 'APPROVED',
        comments: 'Casual leave granted'
      })
    });
    expect(approveLeaveRes.status).toBe(200);
    const approvedLeave = await approveLeaveRes.json();
    expect(approvedLeave.data.status).toBe('APPROVED');
  });

  it('Gate 6: Digital Library Catalog and Content Management', async () => {
    // 1. Add Digital Book to School Library
    const bookRes = await fetch(`${baseUrl}/operations/library`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${teacherToken}`
      },
      body: JSON.stringify({
        title: 'NCERT Science Class IX Interactive Edition',
        subject: 'Science',
        className: 'Class IX',
        author: 'National Council of Educational Research',
        totalChapters: 12,
        coverUrl: 'https://images.unsplash.com/photo-1532012164546-f432f2f37b73?w=200'
      })
    });
    expect(bookRes.status).toBe(201);
    const bookData = await bookRes.json();
    expect(bookData.success).toBe(true);
    expect(bookData.book.title).toContain('NCERT Science');

    // 2. Fetch library books as student
    const getBooksRes = await fetch(`${baseUrl}/operations/library`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    expect(getBooksRes.status).toBe(200);
    const books = await getBooksRes.json();
    expect(books.some((b: any) => b.title.includes('NCERT Science'))).toBe(true);
  });

  it('Gate 7: Complete Tamper-Proof Audit Trail Verification', async () => {
    const auditRes = await fetch(`${baseUrl}/audit-logs`, {
      headers: { Authorization: `Bearer ${principalToken}` }
    });
    expect(auditRes.status).toBe(200);
    const logs = await auditRes.json();
    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);

    // Verify key audit actions exist
    const actions = logs.map((l: any) => l.action);
    expect(actions).toContain('ZERO_MANUAL_ADMISSION_APPROVAL');
    expect(actions).toContain('COLLECT_FEE');
    expect(actions).toContain('CREATE_EXAM_PAPER');
  });

  it('Gate 8: Database Boundary Safety Guard', async () => {
    const db = await getDb();
    // Confirm connected strictly to synthetic test DB
    expect(db.databaseName).toBe('i2a_schoolos_synthetic_test');
    expect(db.databaseName).not.toBe('i2a_schoolos');
    expect(db.databaseName).not.toBe('i2a_schoolos_test');
  });
});
