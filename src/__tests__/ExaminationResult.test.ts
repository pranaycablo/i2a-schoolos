import { describe, it, expect, beforeEach } from 'vitest';
import { ExaminationResultService } from '../services/ExaminationResultService';
import { type UserSession, TenantSecurityException } from '../services/TenantSecurityService';
import type { Examination, ExamScheduleSlot } from '../types';

describe('i2A SchoolOS — Master Prompt 10 — Examination & Result Management Verification', () => {
  let examService: ExaminationResultService;
  const schoolA = 'sch-001';
  const schoolB = 'sch-002';

  const principalSession: UserSession = {
    id: 'usr-principal',
    email: 'principal@school-a.com',
    tenantId: schoolA,
    role: 'PRINCIPAL',
    status: 'ACTIVE'
  };

  const student101Session: UserSession = {
    id: 'std-101',
    email: 'rahul@school-a.com',
    tenantId: schoolA,
    role: 'STUDENT',
    status: 'ACTIVE'
  };

  const student102Session: UserSession = {
    id: 'std-102',
    email: 'ananya@school-a.com',
    tenantId: schoolA,
    role: 'STUDENT',
    status: 'ACTIVE'
  };

  const parentSession: UserSession = {
    id: 'prt-501',
    email: 'sanjay@school-a.com',
    tenantId: schoolA,
    role: 'PARENT',
    status: 'ACTIVE',
    childrenIds: ['std-101']
  };

  const schoolBSession: UserSession = {
    id: 'usr-school-b',
    email: 'principal@school-b.com',
    tenantId: schoolB,
    role: 'PRINCIPAL',
    status: 'ACTIVE'
  };

  beforeEach(() => {
    examService = new ExaminationResultService();
  });

  it('1. Tenant Isolation: Rejects access to examination & results of another tenant', () => {
    expect(() => {
      examService.getPublishedResultForStudent('std-101', schoolA, schoolBSession);
    }).toThrow(TenantSecurityException);

    expect(() => {
      examService.getAllSchoolResults(schoolA, schoolBSession);
    }).toThrow(TenantSecurityException);
  });

  it('2. Schedule Conflict Engine: Detects overlapping exam schedule for class & room double booking', () => {
    const examData: Omit<Examination, 'id' | 'status'> = {
      schoolId: schoolA,
      name: 'Unit Test 1 2026',
      code: 'UT1-2026',
      academicSession: '2026-2027',
      examType: 'UNIT_TEST',
      classes: ['Class VIII'],
      startDate: '2026-11-01',
      endDate: '2026-11-05',
      passingPercentage: 33,
      createdBy: principalSession.id
    };

    const newExam = examService.createExamination(examData, principalSession);

    const slot1: Omit<ExamScheduleSlot, 'id'> = {
      examinationId: newExam.id,
      schoolId: schoolA,
      date: '2026-11-01',
      startTime: '09:00',
      endTime: '10:30',
      className: 'Class VIII',
      sectionName: 'A',
      subjectName: 'Mathematics',
      roomName: 'Room 101',
      invigilatorName: 'Mrs. Sunita Mishra',
      maxMarks: 50,
      durationMinutes: 90
    };

    examService.addScheduleSlot(slot1, principalSession);

    // Attempting overlapping exam for Class VIII-A
    expect(() => {
      examService.addScheduleSlot(
        {
          ...slot1,
          subjectName: 'Science'
        },
        principalSession
      );
    }).toThrow(/Schedule Conflict/);

    // Attempting Room Double Booking for different class
    expect(() => {
      examService.addScheduleSlot(
        {
          ...slot1,
          className: 'Class IX',
          subjectName: 'Science'
        },
        principalSession
      );
    }).toThrow(/Room Conflict/);
  });

  it('3. AI Question Blueprint Paper Generator: Selects questions matching target total marks', () => {
    examService.addQuestionToBank(
      {
        schoolId: schoolA,
        className: 'Class VIII',
        subjectName: 'Science',
        chapterTitle: 'Crop Production',
        questionType: 'SHORT',
        questionText: 'Explain drip irrigation.',
        correctAnswer: 'Micro-irrigation system saving water.',
        difficulty: 'MEDIUM',
        marks: 5
      },
      principalSession
    );

    const paper = examService.generateBlueprintPaper(
      {
        schoolId: schoolA,
        paperTitle: 'Science Unit Assessment',
        className: 'Class VIII',
        subjectName: 'Science',
        totalMarks: 10,
        durationMinutes: 45
      },
      principalSession
    );

    expect(paper.id).toBeDefined();
    expect(paper.status).toBe('AI_DRAFT');
    expect(paper.questionsSnapshot.length).toBeGreaterThan(0);
  });

  it('4. Marks Moderation Audit Trail: Rejects invalid marks and preserves audit history on correction', () => {
    // Max marks is 50
    expect(() => {
      examService.recordStudentMarks(
        {
          examinationId: 'ex-2026-term1',
          schoolId: schoolA,
          studentId: 'std-102',
          studentName: 'Ananya Sharma',
          admissionNo: '1025',
          className: 'Class VIII',
          sectionName: 'A',
          subjectName: 'Mathematics',
          theoryMarksObtained: 55,
          practicalMarksObtained: 0,
          totalMarksObtained: 55,
          maxMarks: 50,
          isAbsent: false,
          enteredBy: principalSession.id
        },
        principalSession
      );
    }).toThrow(/cannot exceed maximum marks/);

    const validRecord = examService.recordStudentMarks(
      {
        examinationId: 'ex-2026-term1',
        schoolId: schoolA,
        studentId: 'std-102',
        studentName: 'Ananya Sharma',
        admissionNo: '1025',
        className: 'Class VIII',
        sectionName: 'A',
        subjectName: 'Mathematics',
        theoryMarksObtained: 45,
        practicalMarksObtained: 0,
        totalMarksObtained: 45,
        maxMarks: 50,
        isAbsent: false,
        enteredBy: principalSession.id
      },
      principalSession
    );

    // Update marks with audit reason
    const updated = examService.updateMarksWithAudit(
      validRecord.id,
      schoolA,
      48,
      'Re-totalling correction after re-checking theory paper',
      principalSession
    );

    expect(updated.totalMarksObtained).toBe(48);
    expect(updated.auditHistory).toBeDefined();
    expect(updated.auditHistory?.length).toBe(1);
    expect(updated.auditHistory?.[0].oldMarks).toBe(45);
    expect(updated.auditHistory?.[0].newMarks).toBe(48);
    expect(updated.auditHistory?.[0].reason).toContain('Re-totalling correction');
  });

  it('5. Result Calculation Engine: Calculates totals, percentage, grade and pass status', () => {
    const summary = examService.calculateStudentResult(
      'ex-2026-term1',
      'std-101',
      schoolA,
      principalSession
    );

    expect(summary.totalObtainedMarks).toBe(92);
    expect(summary.percentage).toBe(92);
    expect(summary.grade).toBe('A+');
    expect(summary.overallResultStatus).toBe('PASSED');
  });

  it('6. Parent & Student Object Authorization: Student & Parent can only view authorized results', () => {
    const studentRes = examService.getPublishedResultForStudent('std-101', schoolA, student101Session);
    expect(studentRes.length).toBe(1);
    expect(studentRes[0].studentName).toBe('Rahul Kumar');

    // Student 102 attempting to view Student 101 result
    expect(() => {
      examService.getPublishedResultForStudent('std-101', schoolA, student102Session);
    }).toThrow(TenantSecurityException);

    // Parent viewing linked child (std-101)
    const parentRes = examService.getPublishedResultForStudent('std-101', schoolA, parentSession);
    expect(parentRes.length).toBe(1);
  });
});
