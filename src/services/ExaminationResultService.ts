import { TenantSecurityService, UserSession, TenantSecurityException } from './TenantSecurityService';
import {
  Examination,
  ExamScheduleSlot,
  QuestionBankEntry,
  ExamBlueprint,
  ExamPaperMaster,
  StudentMarksRecord,
  GradingBand,
  StudentExamResultSummary
} from '../types';

export class ExaminationResultService {
  private examinations: Map<string, Examination> = new Map();
  private scheduleSlots: Map<string, ExamScheduleSlot[]> = new Map(); // examId -> slots
  private questionBank: Map<string, QuestionBankEntry> = new Map();
  private blueprints: Map<string, ExamBlueprint> = new Map();
  private examPapers: Map<string, ExamPaperMaster> = new Map();
  private marksRecords: Map<string, StudentMarksRecord> = new Map();
  private results: Map<string, StudentExamResultSummary> = new Map();

  private defaultGradingBands: GradingBand[] = [
    { grade: 'A+', minPercentage: 90, maxPercentage: 100, gradePoint: 10, remarks: 'Outstanding Performance' },
    { grade: 'A', minPercentage: 80, maxPercentage: 89.99, gradePoint: 9, remarks: 'Excellent' },
    { grade: 'B+', minPercentage: 70, maxPercentage: 79.99, gradePoint: 8, remarks: 'Very Good' },
    { grade: 'B', minPercentage: 60, maxPercentage: 69.99, gradePoint: 7, remarks: 'Good' },
    { grade: 'C', minPercentage: 50, maxPercentage: 59.99, gradePoint: 6, remarks: 'Average' },
    { grade: 'D', minPercentage: 33, maxPercentage: 49.99, gradePoint: 5, remarks: 'Pass' },
    { grade: 'F', minPercentage: 0, maxPercentage: 32.99, gradePoint: 0, remarks: 'Needs Support' }
  ];

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const schoolId = 'sch-001';

    // Seed Examination
    const exam: Examination = {
      id: 'ex-2026-term1',
      schoolId,
      name: 'Half-Yearly Examination 2026',
      code: 'HY-2026',
      academicSession: '2026-2027',
      examType: 'HALF_YEARLY',
      classes: ['Class VIII', 'Class IX', 'Class X'],
      startDate: '2026-10-15',
      endDate: '2026-10-25',
      passingPercentage: 33,
      status: 'RESULTS_APPROVED',
      createdBy: 'usr-principal',
      approvedBy: 'Dr. Ramesh Chandra Sharma'
    };
    this.examinations.set(exam.id, exam);

    // Seed Question Entry
    const q1: QuestionBankEntry = {
      id: 'q-101',
      schoolId,
      className: 'Class VIII',
      subjectName: 'Science',
      chapterTitle: 'Crop Production & Management',
      questionType: 'MCQ',
      questionText: 'Which tool is traditionally used for turning and loosening the soil?',
      options: ['Plough', 'Sickle', 'Combine', 'Seed Drill'],
      correctAnswer: 'Plough',
      difficulty: 'EASY',
      marks: 1,
      version: 1
    };
    this.questionBank.set(q1.id, q1);

    // Seed Marks Record for Rahul Kumar
    const markRec: StudentMarksRecord = {
      id: 'mrk-101',
      examinationId: 'ex-2026-term1',
      schoolId,
      studentId: 'std-101',
      studentName: 'Rahul Kumar',
      admissionNo: '1024',
      className: 'Class VIII',
      sectionName: 'A',
      subjectName: 'Science',
      theoryMarksObtained: 68,
      practicalMarksObtained: 24,
      totalMarksObtained: 92,
      maxMarks: 100,
      isAbsent: false,
      status: 'APPROVED',
      enteredBy: 'stf-1',
      approvedBy: 'Dr. Ramesh Chandra Sharma'
    };
    this.marksRecords.set(markRec.id, markRec);

    // Seed Calculated Result Summary for Rahul
    const res: StudentExamResultSummary = {
      id: 'res-101',
      examinationId: 'ex-2026-term1',
      examinationName: 'Half-Yearly Examination 2026',
      schoolId,
      studentId: 'std-101',
      studentName: 'Rahul Kumar',
      admissionNo: '1024',
      className: 'Class VIII',
      sectionName: 'A',
      totalObtainedMarks: 442,
      totalMaxMarks: 500,
      percentage: 88.4,
      grade: 'A',
      overallResultStatus: 'PASSED',
      subjectWiseBreakup: [
        { subjectName: 'Science', theoryMarks: 68, practicalMarks: 24, totalMarks: 92, maxMarks: 100, grade: 'A+', status: 'PASS' },
        { subjectName: 'Mathematics', theoryMarks: 85, practicalMarks: 0, totalMarks: 85, maxMarks: 100, grade: 'A', status: 'PASS' },
        { subjectName: 'English', theoryMarks: 88, practicalMarks: 0, totalMarks: 88, maxMarks: 100, grade: 'A', status: 'PASS' },
        { subjectName: 'Social Studies', theoryMarks: 89, practicalMarks: 0, totalMarks: 89, maxMarks: 100, grade: 'A', status: 'PASS' },
        { subjectName: 'Hindi', theoryMarks: 88, practicalMarks: 0, totalMarks: 88, maxMarks: 100, grade: 'A', status: 'PASS' }
      ],
      status: 'PUBLISHED',
      approvedBy: 'Dr. Ramesh Chandra Sharma'
    };
    this.results.set(res.id, res);
  }

  // --- EXAMINATION MANAGEMENT & LIFECYCLE ---

  public createExamination(examData: Omit<Examination, 'id' | 'status'>, session: UserSession): Examination {
    TenantSecurityService.validateTenantAccess(session, examData.schoolId);

    if (!['SUPER_ADMIN', 'PRINCIPAL'].includes(session.role)) {
      throw new TenantSecurityException('Only Principal or Admin can create new examinations.', 403);
    }

    const newExam: Examination = {
      ...examData,
      id: `ex-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'DRAFT'
    };

    this.examinations.set(newExam.id, newExam);
    return newExam;
  }

  public updateExamStatus(examId: string, schoolId: string, status: Examination['status'], session: UserSession): Examination {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    const exam = this.examinations.get(examId);
    if (!exam || exam.schoolId !== schoolId) {
      throw new Error('Examination record not found.');
    }

    if (!['SUPER_ADMIN', 'PRINCIPAL'].includes(session.role)) {
      throw new TenantSecurityException('Unauthorized to update examination status.', 403);
    }

    exam.status = status;
    if (status === 'APPROVED' || status === 'RESULTS_APPROVED') {
      exam.approvedBy = session.id;
    }

    this.examinations.set(exam.id, exam);
    return exam;
  }

  public addScheduleSlot(slotData: Omit<ExamScheduleSlot, 'id'>, session: UserSession): ExamScheduleSlot {
    TenantSecurityService.validateTenantAccess(session, slotData.schoolId);

    const existingSlots = this.scheduleSlots.get(slotData.examinationId) || [];

    // Conflict Check 1: Overlapping Class Exam
    const classConflict = existingSlots.find(
      s => s.date === slotData.date && s.className === slotData.className && s.startTime === slotData.startTime
    );
    if (classConflict) {
      throw new Error(`Schedule Conflict: ${slotData.className} already has an exam scheduled on ${slotData.date} at ${slotData.startTime}.`);
    }

    // Conflict Check 2: Room Double Booking
    const roomConflict = existingSlots.find(
      s => s.date === slotData.date && s.roomName === slotData.roomName && s.startTime === slotData.startTime
    );
    if (roomConflict) {
      throw new Error(`Room Conflict: Room ${slotData.roomName} is already occupied on ${slotData.date} at ${slotData.startTime}.`);
    }

    const newSlot: ExamScheduleSlot = {
      ...slotData,
      id: `slot-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };

    existingSlots.push(newSlot);
    this.scheduleSlots.set(slotData.examinationId, existingSlots);
    return newSlot;
  }

  // --- QUESTION BANK & AI BLUEPRINT GENERATOR ---

  public addQuestionToBank(questionData: Omit<QuestionBankEntry, 'id' | 'version'>, session: UserSession): QuestionBankEntry {
    TenantSecurityService.validateTenantAccess(session, questionData.schoolId);

    const newEntry: QuestionBankEntry = {
      ...questionData,
      id: `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      version: 1
    };

    this.questionBank.set(newEntry.id, newEntry);
    return newEntry;
  }

  public generateBlueprintPaper(
    params: {
      schoolId: string;
      paperTitle: string;
      className: string;
      subjectName: string;
      totalMarks: number;
      durationMinutes: number;
    },
    session: UserSession
  ): ExamPaperMaster {
    TenantSecurityService.validateTenantAccess(session, params.schoolId);

    const availableQuestions = Array.from(this.questionBank.values()).filter(
      q => q.schoolId === params.schoolId && q.className === params.className && q.subjectName === params.subjectName
    );

    // Select questions matching target total marks
    let accumulatedMarks = 0;
    const questionsSnapshot: QuestionBankEntry[] = [];

    for (const q of availableQuestions) {
      if (accumulatedMarks + q.marks <= params.totalMarks) {
        questionsSnapshot.push({ ...q }); // Immutable snapshot
        accumulatedMarks += q.marks;
      }
    }

    const newPaper: ExamPaperMaster = {
      id: `expaper-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: params.schoolId,
      paperTitle: params.paperTitle,
      className: params.className,
      subjectName: params.subjectName,
      totalMarks: params.totalMarks,
      durationMinutes: params.durationMinutes,
      questionsSnapshot,
      status: 'AI_DRAFT',
      version: 1
    };

    this.examPapers.set(newPaper.id, newPaper);
    return newPaper;
  }

  // --- MARKS ENTRY, MODERATION & AUDIT ENGINE ---

  public recordStudentMarks(marksData: Omit<StudentMarksRecord, 'id' | 'status'>, session: UserSession): StudentMarksRecord {
    TenantSecurityService.validateTenantAccess(session, marksData.schoolId);

    if (marksData.theoryMarksObtained < 0 || marksData.practicalMarksObtained < 0) {
      throw new Error('Marks cannot be negative.');
    }

    if (marksData.totalMarksObtained > marksData.maxMarks) {
      throw new Error(`Total obtained marks (${marksData.totalMarksObtained}) cannot exceed maximum marks (${marksData.maxMarks}).`);
    }

    const newRec: StudentMarksRecord = {
      ...marksData,
      id: `mrk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      status: 'SUBMITTED',
      enteredBy: session.id
    };

    this.marksRecords.set(newRec.id, newRec);
    return newRec;
  }

  public updateMarksWithAudit(
    recordId: string,
    schoolId: string,
    newTotalMarks: number,
    reason: string,
    session: UserSession
  ): StudentMarksRecord {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    const rec = this.marksRecords.get(recordId);
    if (!rec || rec.schoolId !== schoolId) {
      throw new Error('Marks record not found.');
    }

    if (newTotalMarks > rec.maxMarks) {
      throw new Error(`Updated marks (${newTotalMarks}) cannot exceed maximum marks (${rec.maxMarks}).`);
    }

    const auditEntry = {
      timestamp: new Date().toLocaleString('en-IN'),
      oldMarks: rec.totalMarksObtained,
      newMarks: newTotalMarks,
      actor: session.id,
      reason
    };

    rec.auditHistory = [...(rec.auditHistory || []), auditEntry];
    rec.totalMarksObtained = newTotalMarks;
    rec.status = 'APPROVED';
    rec.approvedBy = session.id;

    this.marksRecords.set(rec.id, rec);
    return rec;
  }

  // --- RESULT CALCULATION ENGINE ---

  public calculateGrade(percentage: number): string {
    const band = this.defaultGradingBands.find(
      b => percentage >= b.minPercentage && percentage <= b.maxPercentage
    );
    return band ? band.grade : 'F';
  }

  public calculateStudentResult(
    examinationId: string,
    studentId: string,
    schoolId: string,
    session: UserSession
  ): StudentExamResultSummary {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    const exam = this.examinations.get(examinationId);
    if (!exam) throw new Error('Examination record not found.');

    const studentMarks = Array.from(this.marksRecords.values()).filter(
      m => m.examinationId === examinationId && m.studentId === studentId && m.schoolId === schoolId
    );

    if (studentMarks.length === 0) {
      throw new Error('No marks entries found for student in this examination.');
    }

    let totalObtained = 0;
    let totalMax = 0;
    let hasFailedSubject = false;

    const subjectWiseBreakup = studentMarks.map(m => {
      totalObtained += m.totalMarksObtained;
      totalMax += m.maxMarks;

      const subPercentage = m.maxMarks > 0 ? (m.totalMarksObtained / m.maxMarks) * 100 : 0;
      const subGrade = this.calculateGrade(subPercentage);
      const isPass = subPercentage >= exam.passingPercentage && !m.isAbsent;

      if (!isPass) hasFailedSubject = true;

      return {
        subjectName: m.subjectName,
        theoryMarks: m.theoryMarksObtained,
        practicalMarks: m.practicalMarksObtained,
        totalMarks: m.totalMarksObtained,
        maxMarks: m.maxMarks,
        grade: subGrade,
        status: (m.isAbsent ? 'ABSENT' : isPass ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL' | 'ABSENT'
      };
    });

    const percentage = totalMax > 0 ? Number(((totalObtained / totalMax) * 100).toFixed(1)) : 0;
    const overallGrade = this.calculateGrade(percentage);
    const overallResultStatus = hasFailedSubject ? 'FAILED' : 'PASSED';

    const resultSummary: StudentExamResultSummary = {
      id: `res-${examinationId}-${studentId}`,
      examinationId,
      examinationName: exam.name,
      schoolId,
      studentId,
      studentName: studentMarks[0].studentName,
      admissionNo: studentMarks[0].admissionNo,
      className: studentMarks[0].className,
      sectionName: studentMarks[0].sectionName,
      totalObtainedMarks: totalObtained,
      totalMaxMarks: totalMax,
      percentage,
      grade: overallGrade,
      overallResultStatus,
      subjectWiseBreakup,
      status: 'PUBLISHED',
      approvedBy: exam.approvedBy || session.id
    };

    this.results.set(resultSummary.id, resultSummary);
    return resultSummary;
  }

  public getPublishedResultForStudent(studentId: string, schoolId: string, session: UserSession): StudentExamResultSummary[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    if (session.role === 'STUDENT' && session.id !== studentId) {
      throw new TenantSecurityException('Students can only view their own examination results.', 403);
    }

    if (session.role === 'PARENT') {
      const childrenIds = session.childrenIds || [];
      if (!childrenIds.includes(studentId)) {
        throw new TenantSecurityException('Parents can only view examination results of linked children.', 403);
      }
    }

    return Array.from(this.results.values()).filter(
      r => r.schoolId === schoolId && r.studentId === studentId && r.status === 'PUBLISHED'
    );
  }

  public getAllSchoolResults(schoolId: string, session: UserSession): StudentExamResultSummary[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);
    return Array.from(this.results.values()).filter(r => r.schoolId === schoolId);
  }
}
