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
 * GET /api/timetables
 * Fetches timetable cells for a school / class
 */
router.get('/', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const { className, sectionName } = req.query;
    const database = await getDb();
    const filter = { ...req.tenantFilter };

    if (className) filter.className = className;
    if (sectionName) filter.sectionName = sectionName;

    const cells = await database.collection('timetables').find(filter).toArray();
    res.json(cells);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/timetables/cells
 * Adds or updates a timetable cell with server-side conflict detection
 */
router.post('/cells', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN'), async (req, res) => {
  try {
    const { className, sectionName, day, periodId, subjectName, teacherId, teacherName, roomId, roomName } = req.body;
    if (!className || !day || !periodId || !teacherId) {
      return res.status(400).json({ error: 'Class, day, period, and teacher are required.' });
    }

    const database = await getDb();

    // Conflict Check 1: Teacher double-booking
    const teacherConflict = await database.collection('timetables').findOne({
      schoolId: req.user.schoolId,
      day,
      periodId,
      teacherId,
      className: { $ne: className }
    });

    if (teacherConflict) {
      return res.status(409).json({
        error: `CONFLICT: Teacher ${teacherName || teacherId} is already assigned to ${teacherConflict.className}-${teacherConflict.sectionName} on ${day} during ${periodId}.`,
        code: 'TEACHER_CONFLICT'
      });
    }

    // Conflict Check 2: Room double-booking
    if (roomId) {
      const roomConflict = await database.collection('timetables').findOne({
        schoolId: req.user.schoolId,
        day,
        periodId,
        roomId,
        className: { $ne: className }
      });

      if (roomConflict) {
        return res.status(409).json({
          error: `CONFLICT: Room ${roomName || roomId} is already occupied by ${roomConflict.className}-${roomConflict.sectionName} on ${day} during ${periodId}.`,
          code: 'ROOM_CONFLICT'
        });
      }
    }

    const cellId = `cell-${req.user.schoolId}-${className}-${sectionName || 'A'}-${day}-${periodId}`;
    const cellData = {
      id: cellId,
      schoolId: req.user.schoolId,
      className,
      sectionName: sectionName || 'A',
      day,
      periodId,
      subjectName,
      teacherId,
      teacherName,
      roomId: roomId || 'rm-default',
      roomName: roomName || 'Classroom',
      updatedAt: new Date().toISOString()
    };

    await database.collection('timetables').updateOne(
      { id: cellId, schoolId: req.user.schoolId },
      { $set: cellData },
      { upsert: true }
    );

    res.json({ success: true, cell: cellData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/timetables/workload
 * Returns teacher workload statistics across the timetable
 */
router.get('/workload', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const cells = await database.collection('timetables').find(req.tenantFilter).toArray();

    const loadMap = {};
    for (const c of cells) {
      if (c.teacherId) {
        if (!loadMap[c.teacherId]) {
          loadMap[c.teacherId] = {
            teacherId: c.teacherId,
            teacherName: c.teacherName,
            periodsPerWeek: 0,
            subjects: new Set(),
            classes: new Set()
          };
        }
        loadMap[c.teacherId].periodsPerWeek += 1;
        if (c.subjectName) loadMap[c.teacherId].subjects.add(c.subjectName);
        if (c.className) loadMap[c.teacherId].classes.add(c.className);
      }
    }

    const result = Object.values(loadMap).map(item => ({
      ...item,
      subjects: Array.from(item.subjects),
      classes: Array.from(item.classes),
      maxWeeklyLimit: 30,
      isOverloaded: item.periodsPerWeek > 30
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
