import { describe, it, expect, beforeEach } from 'vitest';
import { HomeworkDigitalLearningService } from '../services/HomeworkDigitalLearningService';
import { type UserSession, TenantSecurityException } from '../services/TenantSecurityService';
import type { Homework } from '../types';

describe('i2A SchoolOS — Master Prompt 09 — Homework, Assignments & Digital Learning Verification', () => {
  let service: HomeworkDigitalLearningService;
  const schoolA = 'sch-001';
  const schoolB = 'sch-002';

  const teacherSession: UserSession = {
    id: 'stf-1',
    email: 'sunita@school-a.com',
    tenantId: schoolA,
    role: 'TEACHER',
    status: 'ACTIVE',
    assignedClass: 'Class VIII'
  };

  const studentSession: UserSession = {
    id: 'std-101',
    email: 'rahul@school-a.com',
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
    email: 'teacher@school-b.com',
    tenantId: schoolB,
    role: 'TEACHER',
    status: 'ACTIVE'
  };

  beforeEach(() => {
    service = new HomeworkDigitalLearningService();
  });

  it('1. Tenant Isolation: Rejects cross-tenant access to homework & submissions', () => {
    expect(() => {
      service.getHomeworkForClass(schoolA, 'Class VIII', 'A', schoolBSession);
    }).toThrow(TenantSecurityException);

    expect(() => {
      service.getLearningResources(schoolA, 'Class VIII', schoolBSession);
    }).toThrow(TenantSecurityException);
  });

  it('2. Homework Lifecycle: Teacher creates draft homework and publishes it', () => {
    const hwData: Omit<Homework, 'id'> = {
      schoolId: schoolA,
      title: 'Maths Quadratic Equations Problem Set',
      description: 'Solve problems 1-15 from Chapter 4.',
      instructions: 'Show step by step derivations.',
      academicSession: '2026-2027',
      className: 'Class VIII',
      sectionName: 'A',
      subjectId: 'sub-math',
      subjectName: 'Mathematics',
      assignedDate: '2026-10-09',
      dueDate: '2026-10-15',
      dueTime: '18:00',
      maxMarks: 25,
      homeworkType: 'WRITTEN',
      attachments: [],
      allowLateSubmission: true,
      status: 'DRAFT',
      createdBy: teacherSession.id,
      createdByName: 'Mrs. Sunita Mishra'
    };

    const newHw = service.createHomework(hwData, teacherSession);
    expect(newHw.id).toBeDefined();
    expect(newHw.status).toBe('DRAFT');

    const published = service.publishHomework(newHw.id, schoolA, teacherSession);
    expect(published.status).toBe('PUBLISHED');
    expect(published.approvedBy).toBe(teacherSession.id);
  });

  it('3. Student Submission Engine: Accepts submission and correctly flags late status', () => {
    const student102Session: UserSession = {
      id: 'std-102',
      email: 'ananya@school-a.com',
      tenantId: schoolA,
      role: 'STUDENT',
      status: 'ACTIVE'
    };

    const sub = service.submitHomework(
      {
        homeworkId: 'hw-101',
        studentId: 'std-102',
        studentName: 'Ananya Sharma',
        admissionNo: '1025',
        className: 'Class VIII',
        sectionName: 'A',
        schoolId: schoolA,
        textResponse: 'Completed all answers.',
        attachments: [{ name: 'solution.pdf', url: '/files/sol.pdf', sizeBytes: 500000 }]
      },
      student102Session
    );

    expect(sub.id).toBeDefined();
    expect(sub.status).toBe('SUBMITTED');
    expect(sub.attemptNumber).toBe(1);
    expect(sub.isLate).toBe(false);
  });

  it('4. Teacher Evaluation & Marks Validation: Rejects marks exceeding maxMarks threshold', () => {
    // hw-101 maxMarks is 20
    expect(() => {
      service.evaluateSubmission('sub-201', schoolA, 25, 'Over-scored submission', teacherSession);
    }).toThrow(/cannot exceed maximum marks/);

    const validEval = service.evaluateSubmission('sub-201', schoolA, 19, 'Great work!', teacherSession);
    expect(validEval.awardedMarks).toBe(19);
    expect(validEval.status).toBe('GRADED');
    expect(validEval.teacherFeedback).toBe('Great work!');
  });

  it('5. Parent Portal Authorization: Parent can only access submissions of authorized linked children', () => {
    const parentSubs = service.getSubmissionsForHomework('hw-101', schoolA, parentSession);
    expect(parentSubs.length).toBe(1);
    expect(parentSubs[0].studentId).toBe('std-101');
  });

  it('6. OCR Ingestion Pipeline: Successfully extracts chapter topics and questions', () => {
    const ocrJob = service.triggerOcrIngestion(schoolA, 'NCERT_Chapter_1.pdf', '/files/ncert1.pdf', teacherSession);
    expect(ocrJob.status).toBe('COMPLETED');
    expect(ocrJob.extractedTopics).toContain('Soil Preparation');
    expect(ocrJob.extractedQuestionsCount).toBe(12);
  });

  it('7. AI Academic Content Generator: Draft stays in AI_DRAFT until reviewed & approved by teacher', () => {
    const aiDraft = service.generateAiContentDraft(
      {
        schoolId: schoolA,
        className: 'Class VIII',
        subjectName: 'Science',
        topicName: 'Microorganisms',
        contentType: 'SUMMARY',
        teacherId: teacherSession.id
      },
      teacherSession
    );

    expect(aiDraft.status).toBe('AI_DRAFT');
    expect(aiDraft.generatedContent).toContain('STATUS: AWAITING TEACHER MANDATORY REVIEW');

    const approved = service.reviewAndApproveAiDraft(
      aiDraft.id,
      schoolA,
      true,
      'Teacher verified content on Microorganisms.',
      teacherSession
    );

    expect(approved.status).toBe('APPROVED');
    expect(approved.generatedContent).toBe('Teacher verified content on Microorganisms.');
  });
});
