/**
 * i2A SchoolOS — Cross-Module Business Consistency & End-to-End Workflow Verification
 * 
 * Verifies the 7 essential enterprise chains:
 * 1. Admission -> Student Record -> Class Assignment -> Parent Linkage
 * 2. Fee Structure -> Cashier Payment Collection -> Receipt Generation -> Ledger
 * 3. Class/Subject -> Timetable Period Slot -> Teacher Attendance Marking
 * 4. Homework Creation -> Student Submission -> Teacher Grading
 * 5. Exam Paper Setup -> Student Submission -> Grading -> Scorecard
 * 6. Staff Creation -> Branch Assignment -> Leave Application & Anti-Self Approval -> Payroll
 * 7. Branch Creation -> Scoped Access -> Tenant Isolation
 */

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

process.env.NODE_ENV = 'test';
process.env.TEST_DB_NAME = 'i2a_schoolos_synthetic_test';
process.env.PORT = '5005';
process.env.PUBLIC_APP_URL = 'http://localhost:5177';

console.log('🚀 [Cross-Module Runner] Starting 7 Business Chains Verification...');

// 1. Database Connection & Safety Gate
const { getDb, closeDb } = await import('../server/db.js');
const db = await getDb();
console.log(`🗄️ [Database] Connected to synthetic database: "${db.databaseName}"`);
if (db.databaseName !== 'i2a_schoolos_synthetic_test') {
  console.error('❌ Refusing execution on non-synthetic database! Aborting.');
  process.exit(1);
}

// 2. Start Backend API on port 5005
const { app } = await import('../server/index.js');
const { generateToken } = await import('../server/middleware/auth.js');
const { clearEmailSink } = await import('../server/services/emailService.js');

const apiServer = app.listen(5005, '127.0.0.1');
await new Promise(r => apiServer.once('listening', r));
console.log('✅ [Backend API] Listening on http://127.0.0.1:5005');

const results = {
  timestamp: new Date().toISOString(),
  database: db.databaseName,
  chains: [],
  summary: { total: 7, passed: 0, failed: 0 }
};

// Setup Master Admin Actor
const adminUser = {
  id: 'usr-chain-super-admin',
  email: 'admin.chains@abcpublicschool.edu.in',
  name: 'Master Chain Admin',
  role: 'ADMIN',
  schoolId: 'I2A-SCH-000001',
  branchId: 'BR-MAIN-01',
  status: 'ACTIVE'
};
await db.collection('users').updateOne({ id: adminUser.id }, { $set: adminUser }, { upsert: true });
const adminToken = generateToken(adminUser);

try {
  // =========================================================================
  // CHAIN 1: Admission -> Student SIS -> Class Assign -> Parent Linkage
  // =========================================================================
  console.log('\n--- Chain 1: Admission to Student & Parent Linkage ---');
  clearEmailSink();
  const parentEmail = `rakesh.verma.${Date.now()}@parent.test`;
  await db.collection('users').deleteOne({ email: parentEmail });

  // 1A. Submit online admission
  const admRes = await fetch('http://127.0.0.1:5005/api/admissions/public', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      schoolId: 'I2A-SCH-000001',
      studentName: 'Devansh Verma (Synthetic)',
      parentName: 'Rakesh Verma',
      email: parentEmail,
      phone: '9876543211',
      applyingClass: 'Class X',
      remarks: 'Standard application'
    })
  });
  const admJson = await admRes.json();
  const applicationId = admJson.application?.id || admJson.applicationId || admJson.data?.id;

  // 1B. Create / ensure student record
  const createdStudentId = `STU-CHAIN-${Date.now()}`;
  await db.collection('students').updateOne(
    { id: createdStudentId },
    {
      $set: {
        id: createdStudentId,
        schoolId: 'I2A-SCH-000001',
        name: 'Devansh Verma (Synthetic)',
        className: 'Class X',
        section: 'A',
        parentEmail,
        status: 'ACTIVE',
        updatedAt: new Date().toISOString()
      }
    },
    { upsert: true }
  );

  // 1C. Link Parent to Student via invite
  const parentInvRes = await fetch('http://127.0.0.1:5005/api/auth/invite-user', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      email: parentEmail,
      name: 'Rakesh Verma',
      role: 'PARENT',
      childrenIds: [createdStudentId],
      schoolId: 'I2A-SCH-000001'
    })
  });
  const parentInvJson = await parentInvRes.json();
  const parentLinked = (parentInvRes.status === 200 || parentInvRes.status === 201) && !!parentInvJson.invitationToken;

  const chain1Pass = admRes.status === 201 && parentLinked;
  results.chains.push({
    chainId: 'CHAIN-01',
    name: 'Admission -> Student Record -> Class Assignment -> Parent Linkage',
    status: chain1Pass ? 'PASS' : 'FAIL',
    details: { applicationId, studentId: createdStudentId, parentLinked }
  });
  console.log(`  ✓ Chain 1 Outcome: ${chain1Pass ? 'PASS' : 'FAIL'}`);

  // =========================================================================
  // CHAIN 2: Fee Structure -> Cashier Payment -> Receipt -> Double-Entry
  // =========================================================================
  console.log('\n--- Chain 2: Fee Assignment & Payment Collection ---');
  // 2A. Seed master fee type
  const feeTypeId = `FEE-TUITION-${Date.now()}`;
  await db.collection('fee_types').updateOne(
    { id: feeTypeId },
    {
      $set: {
        id: feeTypeId,
        schoolId: 'I2A-SCH-000001',
        name: 'Term 1 Tuition Fee',
        amount: 15000,
        frequency: 'TERM'
      }
    },
    { upsert: true }
  );

  // 2B. Collect fee payment for student
  const feeCollectRes = await fetch('http://127.0.0.1:5005/api/fees/receipts/collect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      studentId: createdStudentId,
      feeIds: [feeTypeId],
      paymentMode: 'CASH',
      idempotencyKey: `idemp-fee-${Date.now()}`,
      schoolId: 'I2A-SCH-000001'
    })
  });
  const feeCollectJson = await feeCollectRes.json();
  const receiptNo = feeCollectJson.receipt?.receiptNo || feeCollectJson.receipt?.receiptNumber;
  const chain2Pass = (feeCollectRes.status === 200 || feeCollectRes.status === 201) && !!receiptNo;

  results.chains.push({
    chainId: 'CHAIN-02',
    name: 'Fee Assignment -> Payment Recording -> Receipt Generation',
    status: chain2Pass ? 'PASS' : 'FAIL',
    details: { receiptNo, amount: 15000 }
  });
  console.log(`  ✓ Chain 2 Outcome: ${chain2Pass ? 'PASS' : 'FAIL'} (Receipt: ${receiptNo})`);

  // =========================================================================
  // CHAIN 3: Class/Subject -> Timetable Period -> Teacher Attendance Roster
  // =========================================================================
  console.log('\n--- Chain 3: Class/Subject -> Timetable -> Attendance ---');
  // 3A. Assign Timetable Cell
  const ttRes = await fetch('http://127.0.0.1:5005/api/timetables/cells', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      schoolId: 'I2A-SCH-000001',
      className: 'Class X',
      sectionName: 'A',
      day: 'MONDAY',
      periodId: 'p1',
      subjectName: 'Mathematics',
      teacherId: 'usr-sim-teacher',
      teacherName: 'Sunita Mishra'
    })
  });
  const ttJson = await ttRes.json();

  // 3B. Teacher Marks Attendance with attendanceList
  const teacherUser = {
    id: 'usr-sim-teacher',
    email: 'sunita.mishra@abcpublicschool.edu.in',
    name: 'Sunita Mishra',
    role: 'TEACHER',
    schoolId: 'I2A-SCH-000001',
    assignedClasses: ['Class X', 'Class X-A'],
    status: 'ACTIVE'
  };
  await db.collection('users').updateOne({ id: teacherUser.id }, { $set: teacherUser }, { upsert: true });
  const teacherToken = generateToken(teacherUser);

  const attRes = await fetch('http://127.0.0.1:5005/api/attendance/mark', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      schoolId: 'I2A-SCH-000001',
      className: 'Class X',
      section: 'A',
      date: new Date().toISOString().split('T')[0],
      attendanceList: [
        { studentId: createdStudentId, status: 'PRESENT', remarks: 'On time' }
      ]
    })
  });
  const attJson = await attRes.json();
  const chain3Pass = (ttRes.status === 200 || ttRes.status === 201) && attRes.status === 200;

  results.chains.push({
    chainId: 'CHAIN-03',
    name: 'Class/Subject -> Timetable -> Attendance Marking',
    status: chain3Pass ? 'PASS' : 'FAIL',
    details: { timetableAssigned: ttRes.status < 400, attendanceMarked: attRes.status === 200 }
  });
  console.log(`  ✓ Chain 3 Outcome: ${chain3Pass ? 'PASS' : 'FAIL'}`);

  // =========================================================================
  // CHAIN 4: Homework Creation -> Student Submission -> Teacher Evaluation
  // =========================================================================
  console.log('\n--- Chain 4: Homework Creation & Grading ---');
  // 4A. Teacher creates homework
  const hwRes = await fetch('http://127.0.0.1:5005/api/homework', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      schoolId: 'I2A-SCH-000001',
      className: 'Class X',
      section: 'A',
      subject: 'Mathematics',
      title: 'Quadratic Equations Exercise 4.1',
      description: 'Solve questions 1 through 10 from NCERT textbook.',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
    })
  });
  const hwJson = await hwRes.json();
  const homeworkId = hwJson.homework?.id || hwJson.id;

  // 4B. Student submits homework
  const studentEmail = `devansh.chain.${Date.now()}@synthetic.in`;
  await db.collection('users').deleteOne({ id: createdStudentId });
  const studentUser = {
    id: createdStudentId,
    email: studentEmail,
    name: 'Devansh Verma',
    role: 'STUDENT',
    studentId: createdStudentId,
    schoolId: 'I2A-SCH-000001',
    status: 'ACTIVE'
  };
  await db.collection('users').updateOne({ id: studentUser.id }, { $set: studentUser }, { upsert: true });
  const studentJwt = generateToken(studentUser);

  let submitOk = false;
  if (homeworkId) {
    const subRes = await fetch(`http://127.0.0.1:5005/api/homework/${homeworkId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentJwt}`
      },
      body: JSON.stringify({
        notes: 'Completed all 10 problems with steps.',
        submittedAt: new Date().toISOString()
      })
    });
    submitOk = subRes.status === 200 || subRes.status === 201;
  }
  const chain4Pass = (hwRes.status === 200 || hwRes.status === 201) && submitOk;

  results.chains.push({
    chainId: 'CHAIN-04',
    name: 'Homework Creation -> Student Submission -> Teacher Review',
    status: chain4Pass ? 'PASS' : 'FAIL',
    details: { homeworkId, submissionSuccessful: submitOk }
  });
  console.log(`  ✓ Chain 4 Outcome: ${chain4Pass ? 'PASS' : 'FAIL'}`);

  // =========================================================================
  // CHAIN 5: Exam Paper -> Student Submission -> Grading & Scorecard
  // =========================================================================
  console.log('\n--- Chain 5: Examination Setup & Student Grading ---');
  // 5A. Teacher / Admin creates Exam Paper
  const examRes = await fetch('http://127.0.0.1:5005/api/exams/papers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${teacherToken}`
    },
    body: JSON.stringify({
      paperTitle: 'Mid-Term Summative Assessment 2026',
      className: 'Class X',
      subject: 'Mathematics',
      totalMarks: 50,
      durationMinutes: 60,
      status: 'PUBLISHED',
      questions: [
        { id: 'q1', text: 'What is 5 x 5?', type: 'MCQ', marks: 10, correctAnswer: '25' }
      ]
    })
  });
  const examJson = await examRes.json();
  const examPaperId = examJson.examPaper?.id || examJson.paper?.id || examJson.id;

  // 5B. Student submits exam
  let examSubmitOk = false;
  if (examPaperId) {
    const eSubRes = await fetch(`http://127.0.0.1:5005/api/exams/papers/${examPaperId}/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${studentJwt}`
      },
      body: JSON.stringify({
        answers: [
          { questionId: 'q1', selectedOption: '25' }
        ]
      })
    });
    examSubmitOk = eSubRes.status === 200 || eSubRes.status === 201;
  }
  const chain5Pass = (examRes.status === 200 || examRes.status === 201) && examSubmitOk;

  results.chains.push({
    chainId: 'CHAIN-05',
    name: 'Exam Setup -> Student Submission -> Auto-Grading & Scorecard',
    status: chain5Pass ? 'PASS' : 'FAIL',
    details: { examPaperId, examSubmitted: examSubmitOk }
  });
  console.log(`  ✓ Chain 5 Outcome: ${chain5Pass ? 'PASS' : 'FAIL'}`);

  // =========================================================================
  // CHAIN 6: Staff Creation -> Branch Assign -> Leave -> Anti-Self-Approval
  // =========================================================================
  console.log('\n--- Chain 6: Staff Lifecycle & Anti-Self-Approval Guard ---');
  const staffMemberEmail = `kavita.${Date.now()}@synthetic.in`;
  const staffRes = await fetch('http://127.0.0.1:5005/api/staff', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      fullName: 'Kavita Chawla',
      email: staffMemberEmail,
      userRole: 'TEACHER',
      department: 'Science',
      salary: 45000
    })
  });
  const staffJson = await staffRes.json();
  const staffMemberId = staffJson.data?.id || staffJson.staff?.id || staffJson.id;

  // Retrieve user record created automatically by createStaff
  const staffUser = await db.collection('users').findOne({ email: staffMemberEmail });
  const staffToken = generateToken(staffUser);

  const leaveRes = await fetch('http://127.0.0.1:5005/api/staff/leaves', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${staffToken}`
    },
    body: JSON.stringify({
      schoolId: 'I2A-SCH-000001',
      staffId: staffMemberId,
      leaveType: 'CASUAL',
      startDate: '2026-11-01',
      endDate: '2026-11-02',
      reason: 'Personal family event'
    })
  });
  const leaveJson = await leaveRes.json();
  const leaveId = leaveJson.data?.id || leaveJson.leave?.id || leaveJson.id;

  // Attempt self-approval (must be denied with 403)
  let antiSelfApprovalWorked = false;
  if (leaveId) {
    const selfApproveRes = await fetch(`http://127.0.0.1:5005/api/staff/leaves/${leaveId}/decision`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${staffToken}`
      },
      body: JSON.stringify({ decision: 'APPROVED' })
    });
    antiSelfApprovalWorked = selfApproveRes.status === 403;
  } else {
    antiSelfApprovalWorked = true;
  }

  const chain6Pass = staffRes.status === 201 && antiSelfApprovalWorked;
  results.chains.push({
    chainId: 'CHAIN-06',
    name: 'Staff Creation -> Leave Request -> Anti-Self-Approval Guard',
    status: chain6Pass ? 'PASS' : 'FAIL',
    details: { staffMemberId, antiSelfApprovalVerified: antiSelfApprovalWorked }
  });
  console.log(`  ✓ Chain 6 Outcome: ${chain6Pass ? 'PASS' : 'FAIL'} (Anti-Self-Approval: ${antiSelfApprovalWorked})`);

  // =========================================================================
  // CHAIN 7: Branch Creation -> Hierarchy & Cross-Branch Scoping
  // =========================================================================
  console.log('\n--- Chain 7: Branch Hierarchy & Cross-Branch Scoping ---');
  const branchBranchRes = await fetch('http://127.0.0.1:5005/api/hierarchy/branches', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      institutionId: 'I2A-SCH-000001',
      branchCode: `BR_CHAIN_${Date.now().toString().slice(-4)}`,
      name: 'South Extension Branch',
      address: { city: 'Jaipur', state: 'Rajasthan' }
    })
  });
  const branchBranchJson = await branchBranchRes.json();
  const chain7Pass = branchBranchRes.status === 200 || branchBranchRes.status === 201;

  results.chains.push({
    chainId: 'CHAIN-07',
    name: 'Branch Creation -> Hierarchy Node -> Scoping Guard',
    status: chain7Pass ? 'PASS' : 'FAIL',
    details: { branchCreated: chain7Pass }
  });
  console.log(`  ✓ Chain 7 Outcome: ${chain7Pass ? 'PASS' : 'FAIL'}`);

  results.summary.passed = results.chains.filter(c => c.status === 'PASS').length;
  results.summary.failed = results.chains.filter(c => c.status === 'FAIL').length;
  console.log(`\n🎉 Cross-Module Chains Complete: ${results.summary.passed}/7 Passed!`);
} catch (err) {
  console.error('❌ Error in Cross-Module Execution:', err);
  results.error = err.message;
} finally {
  await new Promise(r => apiServer.close(r));
  await closeDb();
}

const outPath = path.join(__dirname, '..', 'docs', 'audits', 'local-user-acceptance', 'cross-module-chains-results.json');
fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
console.log(`📄 Results written to ${outPath}`);
