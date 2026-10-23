import express from 'express';
import { getDb } from '../db.js';
import {
  authenticateToken,
  enforceTenant,
  requireRoles,
  logAuditEvent
} from '../middleware/auth.js';
import { maskPhone } from '../services/privacyService.js';

const router = express.Router();

/**
 * GET /api/attendance
 * Fetches attendance records for a specific date and class
 */
router.get('/', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const { date, className, section, entityType = 'STUDENT' } = req.query;
    const database = await getDb();
    const filter = { ...req.tenantFilter, entityType };

    if (date) filter.date = date;
    if (className) filter.className = className;
    if (section) filter.section = section;

    // Student view: only self
    if (req.user.role === 'STUDENT') {
      filter.entityId = req.user.studentId || req.user.id;
    }
    // Parent view: only children
    if (req.user.role === 'PARENT') {
      const allowed = req.user.childrenIds || (req.user.studentId ? [req.user.studentId] : []);
      filter.entityId = { $in: allowed };
    }

    const records = await database.collection('attendance').find(filter).toArray();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/attendance/mark
 * Marks attendance for a roster. Validates lock status.
 */
router.post('/mark', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'TEACHER', 'STAFF'), async (req, res) => {
  try {
    const { date, className, section, attendanceList, entityType = 'STUDENT' } = req.body;
    if (!date || !Array.isArray(attendanceList) || attendanceList.length === 0) {
      return res.status(400).json({ error: 'Date and attendance roster list are required.' });
    }

    const database = await getDb();

    // Check if day is locked for this class or whole school
    const lockRecord = await database.collection('attendance_locks').findOne({
      schoolId: req.user.schoolId,
      date,
      $or: [
        { className: className || 'ALL' },
        { className: 'ALL' }
      ],
      isLocked: true
    });

    if (lockRecord) {
      return res.status(403).json({
        error: `Attendance for ${date} (${lockRecord.className || 'School'}) is locked. Contact Principal for unlock permissions.`,
        code: 'ATTENDANCE_LOCKED'
      });
    }

    const ops = attendanceList.map(item => ({
      updateOne: {
        filter: {
          schoolId: req.user.schoolId,
          date,
          entityId: item.entityId,
          entityType
        },
        update: {
          $set: {
            id: item.id || `att-${Date.now()}-${item.entityId}`,
            schoolId: req.user.schoolId,
            date,
            entityType,
            entityId: item.entityId,
            entityName: item.entityName,
            className: item.className || className,
            section: item.section || section,
            status: item.status || 'PRESENT',
            remarks: item.remarks || '',
            markedBy: req.user.id,
            markedByName: req.user.name,
            markedByRole: req.user.role,
            markedAt: new Date().toISOString()
          }
        },
        upsert: true
      }
    }));

    await database.collection('attendance').bulkWrite(ops);

    await logAuditEvent({
      schoolId: req.user.schoolId,
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'MARK_ATTENDANCE',
      module: 'ATTENDANCE',
      details: `Marked attendance for ${attendanceList.length} records in ${className || 'Staff'} on ${date}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `Successfully marked attendance for ${attendanceList.length} entities on ${date}.`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark attendance: ' + err.message });
  }
});

/**
 * POST /api/attendance/lock
 * Locks attendance for a class on a given date (Principal/Admin authority)
 */
router.post('/lock', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN'), async (req, res) => {
  try {
    const { date, className, isLocked = true, reason } = req.body;
    if (!date) return res.status(400).json({ error: 'Date is required to lock attendance.' });

    const database = await getDb();
    const lockId = `lock-${req.user.schoolId}-${date}-${className || 'ALL'}`;
    await database.collection('attendance_locks').updateOne(
      { schoolId: req.user.schoolId, date, className: className || 'ALL' },
      {
        $set: {
          id: lockId,
          schoolId: req.user.schoolId,
          date,
          className: className || 'ALL',
          isLocked: Boolean(isLocked),
          lockedBy: req.user.name,
          lockedAt: new Date().toISOString(),
          reason: reason || 'Standard End-of-Day Roster Verification'
        }
      },
      { upsert: true }
    );

    res.json({
      success: true,
      message: `Attendance for ${date} (${className || 'All'}) has been ${isLocked ? 'LOCKED' : 'UNLOCKED'}.`,
      lock: {
        id: lockId,
        schoolId: req.user.schoolId,
        date,
        className: className || 'ALL',
        isLocked: Boolean(isLocked)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/attendance/summary
 * Analyzes student attendance rates and surfaces students below 85% threshold
 */
router.get('/summary', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const students = await database.collection('students').find(req.tenantFilter).toArray();

    const lowAttendanceList = students.filter(s => (s.attendanceRate || 100) < 85);
    const overallAvg = students.length > 0
      ? (students.reduce((acc, s) => acc + (s.attendanceRate || 0), 0) / students.length).toFixed(1)
      : '100';

    res.json({
      totalStudents: students.length,
      averageAttendanceRate: Number(overallAvg),
      lowAttendanceCount: lowAttendanceList.length,
      lowAttendanceStudents: lowAttendanceList.map(s => {
        const canViewPii = ['SUPER_ADMIN', 'PRINCIPAL', 'ADMIN'].includes(req.user.role);
        return {
          id: s.id,
          name: s.name,
          className: s.className,
          section: s.section,
          parentMobile: canViewPii ? s.parentMobile : maskPhone(s.parentMobile),
          attendanceRate: s.attendanceRate
        };
      })
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/attendance/leaves
 * Leave applications
 */
router.get('/leaves', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const filter = { ...req.tenantFilter };
    if (req.user.role === 'TEACHER' || req.user.role === 'STAFF') {
      filter.applicantId = req.user.id;
    }
    const leaves = await database.collection('leaves').find(filter).sort({ startDate: -1 }).toArray();
    res.json(leaves);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/attendance/leaves
 * Submit leave request
 */
router.post('/leaves', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;
    const database = await getDb();

    const newLeave = {
      id: `lv-${Date.now()}`,
      schoolId: req.user.schoolId,
      applicantId: req.user.id,
      applicantName: req.user.name,
      role: req.user.role,
      leaveType: leaveType || 'CASUAL',
      startDate,
      endDate,
      reason: reason || '',
      status: 'PENDING',
      submittedAt: new Date().toISOString()
    };

    await database.collection('leaves').insertOne(newLeave);
    res.status(201).json({ success: true, leave: newLeave });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/attendance/leaves/:id/status
 * Approve/Reject leave
 */
router.put('/leaves/:id/status', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN'), async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const database = await getDb();

    const result = await database.collection('leaves').updateOne(
      { id: req.params.id, ...req.tenantFilter },
      {
        $set: {
          status,
          approvedBy: req.user.name,
          reviewedAt: new Date().toISOString(),
          remarks: remarks || ''
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Leave application not found in authorized school.' });
    }

    res.json({ success: true, message: `Leave application ${status}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
