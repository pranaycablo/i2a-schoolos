import express from 'express';
import { getDb } from '../db.js';
import {
  authenticateToken,
  enforceTenant,
  requireRoles,
  logAuditEvent
} from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/exams/papers
 * Scoped by School Tenant
 */
router.get('/papers', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const { className, subject } = req.query;
    const database = await getDb();
    const filter = { ...req.tenantFilter };

    if (className) filter.className = className;
    if (subject) filter.subject = subject;

    if (req.user.role === 'STUDENT' || req.user.role === 'PARENT') {
      filter.status = 'PUBLISHED';
    }

    const papers = await database.collection('exam_papers').find(filter).sort({ generatedDate: -1 }).toArray();
    res.json(papers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/exams/papers
 * Create / Save Exam Paper
 */
router.post('/papers', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const { paperTitle, className, subject, totalMarks, durationMinutes, questions, status } = req.body;
    const database = await getDb();

    const newPaper = {
      id: `ex-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: req.user.schoolId,
      paperTitle,
      className,
      subject,
      totalMarks: Number(totalMarks) || 50,
      durationMinutes: Number(durationMinutes) || 60,
      questions: questions || [],
      status: status || 'AI_DRAFT',
      generatedDate: new Date().toISOString().split('T')[0],
      createdBy: req.user.id,
      createdAt: new Date().toISOString()
    };

    await database.collection('exam_papers').insertOne(newPaper);

    await logAuditEvent({
      schoolId: req.user.schoolId,
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'CREATE_EXAM_PAPER',
      module: 'EXAMINATION_AI',
      details: `Created exam paper "${paperTitle}" for ${className} (${totalMarks} Marks, Status: ${newPaper.status})`,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, examPaper: newPaper });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/exams/papers/:id/status
 * Principal / Teacher publish approval
 */
router.put('/papers/:id/status', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const { status } = req.body;
    const database = await getDb();

    const result = await database.collection('exam_papers').updateOne(
      { id: req.params.id, ...req.tenantFilter },
      { $set: { status, approvedBy: req.user.name, updatedAt: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Exam paper not found in authorized school.' });
    }

    res.json({ success: true, message: `Exam paper status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/exams/papers/:id/submit
 * Student online exam submission with instant objective auto-grading
 */
router.post('/papers/:id/submit', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const { answers = [] } = req.body;
    const database = await getDb();

    const paper = await database.collection('exam_papers').findOne({ id: req.params.id, ...req.tenantFilter });
    if (!paper) return res.status(404).json({ error: 'Exam paper not found.' });

    const studentId = req.user.studentId || req.user.id;
    const studentName = req.user.name;

    // Evaluate Objective MCQs automatically
    let autoScore = 0;
    const evaluatedAnswers = answers.map(ans => {
      const q = (paper.questions || []).find(question => question.id === ans.questionId);
      if (q && q.type === 'MCQ') {
        const isCorrect = q.correctAnswer === ans.selectedOption;
        const awarded = isCorrect ? (q.marks || 1) : 0;
        autoScore += awarded;
        return { ...ans, isCorrect, marksAwarded: awarded, isEvaluated: true };
      }
      return { ...ans, isEvaluated: false };
    });

    const hasSubjective = evaluatedAnswers.some(a => !a.isEvaluated);
    const submissionStatus = hasSubjective ? 'EVALUATION_PENDING' : 'GRADED';
    const percentage = Number(((autoScore / (paper.totalMarks || 1)) * 100).toFixed(1));

    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 40) grade = 'D';

    const submissionDoc = {
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      paperId: paper.id,
      paperTitle: paper.paperTitle,
      schoolId: paper.schoolId,
      studentId,
      studentName,
      className: paper.className,
      subject: paper.subject,
      answers: evaluatedAnswers,
      score: autoScore,
      totalMarks: paper.totalMarks,
      percentage,
      grade,
      status: submissionStatus,
      submittedAt: new Date().toISOString()
    };

    await database.collection('exam_submissions').insertOne(submissionDoc);

    res.status(201).json({ success: true, submission: submissionDoc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/exams/submissions
 * Submissions and results listing
 */
router.get('/submissions', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const filter = { ...req.tenantFilter };

    if (req.user.role === 'STUDENT') {
      filter.studentId = req.user.studentId || req.user.id;
    } else if (req.user.role === 'PARENT') {
      const allowed = req.user.childrenIds || (req.user.studentId ? [req.user.studentId] : []);
      filter.studentId = { $in: allowed };
    }

    const subs = await database.collection('exam_submissions').find(filter).sort({ submittedAt: -1 }).toArray();
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
