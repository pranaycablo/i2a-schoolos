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
 * GET /api/homework
 * Scoped by School Tenant and optionally filtered by className
 */
router.get('/', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const { className, sectionName } = req.query;
    const database = await getDb();
    const filter = { ...req.tenantFilter };

    if (className) filter.className = className;
    if (sectionName) filter.sectionName = sectionName;

    // Students only see PUBLISHED homework
    if (req.user.role === 'STUDENT' || req.user.role === 'PARENT') {
      filter.status = 'PUBLISHED';
    }

    const homeworkList = await database.collection('homework').find(filter).sort({ assignedDate: -1 }).toArray();
    res.json(homeworkList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/homework
 * Teacher creates homework assignment
 */
router.post('/', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), async (req, res) => {
  try {
    const {
      title,
      description,
      className,
      sectionName,
      subjectName,
      topicName,
      dueDate,
      dueTime,
      maxMarks,
      allowLateSubmission,
      latePenaltyPercent,
      attachments
    } = req.body;

    if (!title || !className || !dueDate) {
      return res.status(400).json({ error: 'Title, class name, and due date are required.' });
    }

    const database = await getDb();
    const newHw = {
      id: `hw-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: req.user.schoolId,
      title,
      description: description || '',
      className,
      sectionName: sectionName || 'A',
      subjectName: subjectName || 'General',
      topicName: topicName || '',
      assignedDate: new Date().toISOString().split('T')[0],
      dueDate,
      dueTime: dueTime || '23:59',
      maxMarks: Number(maxMarks) || 20,
      allowLateSubmission: allowLateSubmission !== undefined ? Boolean(allowLateSubmission) : true,
      latePenaltyPercent: Number(latePenaltyPercent) || 10,
      attachments: attachments || [],
      status: 'PUBLISHED',
      createdBy: req.user.id,
      createdByName: req.user.name,
      createdAt: new Date().toISOString()
    };

    await database.collection('homework').insertOne(newHw);

    await logAuditEvent({
      schoolId: req.user.schoolId,
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'CREATE_HOMEWORK',
      module: 'HOMEWORK_LEARNING',
      details: `Published homework: "${title}" for ${className} (Due: ${dueDate})`,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, homework: newHw });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/homework/:id/submit
 * Student submission engine
 */
router.post('/:id/submit', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const { textResponse, attachments = [] } = req.body;
    const database = await getDb();

    const hw = await database.collection('homework').findOne({ id: req.params.id, ...req.tenantFilter });
    if (!hw) {
      return res.status(404).json({ error: 'Homework assignment not found.' });
    }

    // Determine student ID
    const studentId = req.user.studentId || req.user.id;
    const studentName = req.user.name;

    const nowIso = new Date().toISOString().split('T')[0];
    const isLate = nowIso > hw.dueDate;

    if (isLate && !hw.allowLateSubmission) {
      return res.status(403).json({
        error: 'Late submissions are disabled for this assignment.',
        code: 'LATE_SUBMISSION_REJECTED'
      });
    }

    const existingSub = await database.collection('homework_submissions').findOne({
      homeworkId: hw.id,
      studentId
    });

    const attemptNumber = existingSub ? (existingSub.attemptNumber || 1) + 1 : 1;
    const status = isLate ? 'LATE_SUBMITTED' : 'SUBMITTED';

    const submissionDoc = {
      id: existingSub ? existingSub.id : `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      homeworkId: hw.id,
      homeworkTitle: hw.title,
      schoolId: hw.schoolId,
      studentId,
      studentName,
      className: hw.className,
      sectionName: hw.sectionName,
      submittedAt: new Date().toISOString(),
      attemptNumber,
      textResponse: textResponse || '',
      attachments,
      status,
      isLate
    };

    await database.collection('homework_submissions').updateOne(
      { homeworkId: hw.id, studentId, schoolId: hw.schoolId },
      { $set: submissionDoc },
      { upsert: true }
    );

    res.json({ success: true, submission: submissionDoc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/homework/:id/submissions
 * Submissions list with authorization filters
 */
router.get('/:id/submissions', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const filter = { homeworkId: req.params.id, ...req.tenantFilter };

    if (req.user.role === 'STUDENT') {
      filter.studentId = req.user.studentId || req.user.id;
    } else if (req.user.role === 'PARENT') {
      const allowed = req.user.childrenIds || (req.user.studentId ? [req.user.studentId] : []);
      filter.studentId = { $in: allowed };
    }

    const subs = await database.collection('homework_submissions').find(filter).toArray();
    res.json(subs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/homework/submissions/:subId/grade
 * Teacher evaluation and marks grading
 */
router.post('/submissions/:subId/grade', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'TEACHER'), async (req, res) => {
  try {
    const { awardedMarks, teacherFeedback } = req.body;
    const database = await getDb();

    const sub = await database.collection('homework_submissions').findOne({ id: req.params.subId, ...req.tenantFilter });
    if (!sub) return res.status(404).json({ error: 'Submission not found.' });

    const hw = await database.collection('homework').findOne({ id: sub.homeworkId, ...req.tenantFilter });
    const max = hw ? hw.maxMarks : 100;

    if (Number(awardedMarks) > max) {
      return res.status(400).json({
        error: `Awarded marks (${awardedMarks}) cannot exceed maximum marks (${max}) for this assignment.`
      });
    }

    const updated = {
      awardedMarks: Number(awardedMarks),
      teacherFeedback: teacherFeedback || 'Evaluated',
      status: 'GRADED',
      gradedBy: req.user.id,
      gradedByName: req.user.name,
      gradedAt: new Date().toISOString()
    };

    const result = await database.collection('homework_submissions').updateOne(
      { id: req.params.subId, ...req.tenantFilter },
      { $set: updated }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Submission not found in authorized school.' });
    }

    res.json({ success: true, submission: { ...sub, ...updated } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
