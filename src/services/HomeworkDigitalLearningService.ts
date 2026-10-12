import { TenantSecurityService, type UserSession, TenantSecurityException } from './TenantSecurityService';
import type {
  Homework,
  StudentSubmission,
  AssignmentRubric,
  LearningResourceMaterial,
  OcrIngestionJob,
  AiAcademicContentDraft,
  SubmissionStatus
} from '../types';

export class HomeworkDigitalLearningService {
  private homeworkList: Map<string, Homework> = new Map();
  private submissions: Map<string, StudentSubmission> = new Map();
  private rubrics: Map<string, AssignmentRubric> = new Map();
  private learningResources: Map<string, LearningResourceMaterial> = new Map();
  private ocrJobs: Map<string, OcrIngestionJob> = new Map();
  private aiDrafts: Map<string, AiAcademicContentDraft> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    const schoolId = 'sch-001';

    // Seed Homework
    const seedHw: Homework = {
      id: 'hw-101',
      schoolId,
      title: 'NCERT Science Ch-1 Crop Management Worksheet',
      description: 'Solve the 10 numerical and short conceptual questions on Kharif vs Rabi crops and soil preparation.',
      instructions: 'Upload a single PDF or clear image scan of your handwritten solutions. Ensure roll number is mentioned on cover page.',
      academicSession: '2026-2027',
      className: 'Class VIII',
      sectionName: 'A',
      subjectId: 'sub-sci',
      subjectName: 'Science',
      topicName: 'Crop Production & Management',
      assignedDate: '2026-10-07',
      dueDate: '2026-10-12',
      dueTime: '17:00',
      maxMarks: 20,
      homeworkType: 'WORKSHEET',
      attachments: [{ name: 'Ch1_Worksheet_Questions.pdf', url: '/files/hw1.pdf', fileType: 'pdf' }],
      allowLateSubmission: true,
      latePenaltyPercent: 10,
      status: 'PUBLISHED',
      createdBy: 'stf-1',
      createdByName: 'Mrs. Sunita Mishra'
    };
    this.homeworkList.set(seedHw.id, seedHw);

    // Seed Student Submission
    const seedSub: StudentSubmission = {
      id: 'sub-201',
      homeworkId: 'hw-101',
      studentId: 'std-101',
      studentName: 'Rahul Kumar',
      admissionNo: '1024',
      className: 'Class VIII',
      sectionName: 'A',
      schoolId,
      submittedAt: '2026-10-08 04:30 PM',
      attemptNumber: 1,
      textResponse: 'Attached handwritten solutions for all 10 questions on Kharif crops and irrigation.',
      attachments: [{ name: 'Rahul_Kumar_Crop_Worksheet.pdf', url: '/files/sub_rahul.pdf', sizeBytes: 1048576 }],
      status: 'GRADED',
      isLate: false,
      awardedMarks: 18,
      teacherFeedback: 'Excellent diagram of drip irrigation system! Clean presentation.',
      gradedAt: '2026-10-09 10:00 AM',
      gradedBy: 'Mrs. Sunita Mishra'
    };
    this.submissions.set(seedSub.id, seedSub);

    // Seed Digital Resource
    const seedRes: LearningResourceMaterial = {
      id: 'res-301',
      schoolId,
      title: 'CBSE Class VIII Science Revision Notes & Mindmap',
      description: 'Comprehensive 5-page revision summary covering soil preparation, sowing, manures, and silos.',
      className: 'Class VIII',
      sectionName: 'A',
      subjectName: 'Science',
      chapterTitle: 'Crop Production & Management',
      resourceType: 'PDF',
      fileUrl: '/files/science_ch1_mindmap.pdf',
      isPublic: true,
      createdBy: 'stf-1',
      createdByName: 'Mrs. Sunita Mishra',
      uploadedAt: '2026-10-05'
    };
    this.learningResources.set(seedRes.id, seedRes);
  }

  // --- HOMEWORK MANAGEMENT ENGINE ---

  public createHomework(hwData: Omit<Homework, 'id'>, session: UserSession): Homework {
    TenantSecurityService.validateTenantAccess(session, hwData.schoolId);

    if (!['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      throw new TenantSecurityException('Only Principal or Teachers can create homework.', 403);
    }

    if (session.role === 'TEACHER' && session.assignedClass && session.assignedClass !== hwData.className) {
      throw new TenantSecurityException(`Teacher assigned to ${session.assignedClass} cannot create homework for ${hwData.className}.`, 403);
    }

    const newHw: Homework = {
      ...hwData,
      id: `hw-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };

    this.homeworkList.set(newHw.id, newHw);
    return newHw;
  }

  public publishHomework(homeworkId: string, schoolId: string, session: UserSession): Homework {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    const hw = this.homeworkList.get(homeworkId);
    if (!hw || hw.schoolId !== schoolId) {
      throw new Error('Homework record not found for tenant.');
    }

    if (!['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      throw new TenantSecurityException('Unauthorized to publish homework.', 403);
    }

    hw.status = 'PUBLISHED';
    hw.approvedBy = session.id;
    this.homeworkList.set(hw.id, hw);
    return hw;
  }

  public getHomeworkForClass(schoolId: string, className: string, sectionName: string, session: UserSession): Homework[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);
    return Array.from(this.homeworkList.values()).filter(
      h => h.schoolId === schoolId && h.className === className && (h.sectionName === sectionName || !h.sectionName)
    );
  }

  // --- STUDENT SUBMISSION ENGINE ---

  public submitHomework(
    subData: {
      homeworkId: string;
      studentId: string;
      studentName: string;
      admissionNo: string;
      className: string;
      sectionName: string;
      schoolId: string;
      textResponse?: string;
      attachments: { name: string; url: string; sizeBytes?: number }[];
    },
    session: UserSession
  ): StudentSubmission {
    TenantSecurityService.validateTenantAccess(session, subData.schoolId);

    if (session.role === 'STUDENT' && session.id !== subData.studentId) {
      throw new TenantSecurityException('Students can only submit homework for their own account.', 403);
    }

    const hw = this.homeworkList.get(subData.homeworkId);
    if (!hw || hw.schoolId !== subData.schoolId) {
      throw new Error('Homework record not found.');
    }

    const nowIso = new Date().toISOString().split('T')[0];
    const isLate = nowIso > hw.dueDate;

    if (isLate && !hw.allowLateSubmission) {
      throw new Error('Late submissions are disabled for this homework assignment.');
    }

    const existingSub = Array.from(this.submissions.values()).find(
      s => s.homeworkId === subData.homeworkId && s.studentId === subData.studentId
    );

    const attemptNumber = existingSub ? existingSub.attemptNumber + 1 : 1;
    const status: SubmissionStatus = isLate ? 'LATE_SUBMITTED' : 'SUBMITTED';

    const newSub: StudentSubmission = {
      id: existingSub ? existingSub.id : `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      homeworkId: subData.homeworkId,
      studentId: subData.studentId,
      studentName: subData.studentName,
      admissionNo: subData.admissionNo,
      className: subData.className,
      sectionName: subData.sectionName,
      schoolId: subData.schoolId,
      submittedAt: new Date().toLocaleString('en-IN'),
      attemptNumber,
      textResponse: subData.textResponse,
      attachments: subData.attachments,
      status,
      isLate
    };

    this.submissions.set(newSub.id, newSub);
    return newSub;
  }

  public getSubmissionsForHomework(homeworkId: string, schoolId: string, session: UserSession): StudentSubmission[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    if (session.role === 'STUDENT') {
      return Array.from(this.submissions.values()).filter(
        s => s.homeworkId === homeworkId && s.studentId === session.id
      );
    }

    if (session.role === 'PARENT') {
      const childrenIds = session.childrenIds || [];
      return Array.from(this.submissions.values()).filter(
        s => s.homeworkId === homeworkId && childrenIds.includes(s.studentId)
      );
    }

    return Array.from(this.submissions.values()).filter(
      s => s.homeworkId === homeworkId && s.schoolId === schoolId
    );
  }

  // --- TEACHER EVALUATION ENGINE ---

  public evaluateSubmission(
    subId: string,
    schoolId: string,
    awardedMarks: number,
    feedback: string,
    session: UserSession
  ): StudentSubmission {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    if (!['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      throw new TenantSecurityException('Only Teachers or Admin can evaluate submissions.', 403);
    }

    const sub = this.submissions.get(subId);
    if (!sub || sub.schoolId !== schoolId) {
      throw new Error('Submission record not found.');
    }

    const hw = this.homeworkList.get(sub.homeworkId);
    if (hw && hw.maxMarks && awardedMarks > hw.maxMarks) {
      throw new Error(`Awarded marks (${awardedMarks}) cannot exceed maximum marks (${hw.maxMarks}).`);
    }

    sub.awardedMarks = awardedMarks;
    sub.teacherFeedback = feedback;
    sub.status = 'GRADED';
    sub.gradedAt = new Date().toLocaleString('en-IN');
    sub.gradedBy = session.id;

    this.submissions.set(sub.id, sub);
    return sub;
  }

  // --- RUBRIC MANAGEMENT ---

  public createRubric(rubricData: Omit<AssignmentRubric, 'id'>, session: UserSession): AssignmentRubric {
    TenantSecurityService.validateTenantAccess(session, rubricData.schoolId);

    const totalMaxPoints = rubricData.criteria.reduce((acc, c) => acc + c.maxPoints, 0);
    const newRubric: AssignmentRubric = {
      ...rubricData,
      id: `rub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      totalMaxPoints
    };

    this.rubrics.set(newRubric.id, newRubric);
    return newRubric;
  }

  public getRubrics(schoolId: string, session: UserSession): AssignmentRubric[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);
    return Array.from(this.rubrics.values()).filter(r => r.schoolId === schoolId);
  }

  // --- DIGITAL LEARNING MATERIALS ---

  public uploadLearningResource(resourceData: Omit<LearningResourceMaterial, 'id' | 'uploadedAt'>, session: UserSession): LearningResourceMaterial {
    TenantSecurityService.validateTenantAccess(session, resourceData.schoolId);

    const newRes: LearningResourceMaterial = {
      ...resourceData,
      id: `res-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      uploadedAt: new Date().toISOString().split('T')[0]
    };

    this.learningResources.set(newRes.id, newRes);
    return newRes;
  }

  public getLearningResources(schoolId: string, className: string, session: UserSession): LearningResourceMaterial[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);
    return Array.from(this.learningResources.values()).filter(
      r => r.schoolId === schoolId && (r.className === className || r.isPublic)
    );
  }

  // --- OCR & DOCUMENT INGESTION PIPELINE ---

  public triggerOcrIngestion(schoolId: string, fileName: string, fileUrl: string, session: UserSession): OcrIngestionJob {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    const job: OcrIngestionJob = {
      id: `ocr-${Date.now()}`,
      schoolId,
      fileName,
      fileUrl,
      status: 'COMPLETED',
      extractedText: `Extracted Chapter Content from ${fileName}:\nChapter 1: Crop Production & Management\n1. Soil Preparation & Ploughing\n2. Sowing seeds & drip irrigation\n3. Storage in silos and granaries.`,
      extractedTopics: ['Soil Preparation', 'Irrigation Systems', 'Harvesting & Storage'],
      extractedQuestionsCount: 12,
      timestamp: new Date().toLocaleString('en-IN')
    };

    this.ocrJobs.set(job.id, job);
    return job;
  }

  // --- AI ACADEMIC CONTENT GENERATOR ENGINE ---

  public generateAiContentDraft(
    params: {
      schoolId: string;
      className: string;
      subjectName: string;
      topicName: string;
      contentType: AiAcademicContentDraft['contentType'];
      teacherId: string;
    },
    session: UserSession
  ): AiAcademicContentDraft {
    TenantSecurityService.validateTenantAccess(session, params.schoolId);

    if (!['SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'].includes(session.role)) {
      throw new TenantSecurityException('Only faculty can generate AI content drafts.', 403);
    }

    const draftText = `[AI GENERATED DRAFT — ${params.contentType}]\nSubject: ${params.subjectName} | Class: ${params.className} | Topic: ${params.topicName}\n\n1. Key Concept Summary:\n- Main principle covering ${params.topicName}.\n- Formula & Key Definitions.\n\n2. Practice Questions:\nQ1. Define ${params.topicName} with real-world examples. [2 Marks]\nQ2. Differentiate between primary and secondary processes in ${params.topicName}. [3 Marks]\n\n[STATUS: AWAITING TEACHER MANDATORY REVIEW & APPROVAL BEFORE STUDENT PUBLICATION]`;

    const draft: AiAcademicContentDraft = {
      id: `aidraft-${Date.now()}`,
      schoolId: params.schoolId,
      className: params.className,
      subjectName: params.subjectName,
      topicName: params.topicName,
      contentType: params.contentType,
      generatedContent: draftText,
      status: 'AI_DRAFT',
      createdByTeacherId: params.teacherId,
      generatedAt: new Date().toLocaleString('en-IN')
    };

    this.aiDrafts.set(draft.id, draft);
    return draft;
  }

  public reviewAndApproveAiDraft(
    draftId: string,
    schoolId: string,
    approve: boolean,
    editedContent?: string,
    session?: UserSession
  ): AiAcademicContentDraft {
    if (session) {
      TenantSecurityService.validateTenantAccess(session, schoolId);
    }

    const draft = this.aiDrafts.get(draftId);
    if (!draft || draft.schoolId !== schoolId) {
      throw new Error('AI Content Draft not found.');
    }

    if (editedContent) {
      draft.generatedContent = editedContent;
    }

    draft.status = approve ? 'APPROVED' : 'REJECTED';
    draft.approvedByTeacherName = session ? session.id : 'Teacher Reviewer';
    this.aiDrafts.set(draft.id, draft);
    return draft;
  }

  public getAiDrafts(schoolId: string, session: UserSession): AiAcademicContentDraft[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);
    return Array.from(this.aiDrafts.values()).filter(d => d.schoolId === schoolId);
  }
}
