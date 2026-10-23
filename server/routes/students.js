import express from 'express';
import { getDb } from '../db.js';
import {
  authenticateToken,
  enforceTenant,
  requireRoles,
  requirePermissions,
  logAuditEvent
} from '../middleware/auth.js';
import { sendError, ERROR_CODES } from '../middleware/apiResponse.js';
import { redactStudentPii, logStudentDataExport } from '../services/privacyService.js';
import { PERMISSIONS } from '../middleware/rbac.js';

const router = express.Router();

/**
 * GET /api/students/export
 * Audited, permission-gated student data export
 */
router.get('/export', authenticateToken, enforceTenant, requirePermissions(PERMISSIONS.STUDENTS_EXPORT), async (req, res) => {
  try {
    const database = await getDb();
    const students = await database.collection('students').find(req.tenantFilter).toArray();

    await logStudentDataExport({
      schoolId: req.user.schoolId,
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      recordCount: students.length,
      exportFormat: req.query.format || 'JSON',
      ipAddress: req.ip
    });

    res.json({
      success: true,
      count: students.length,
      exportedAt: new Date().toISOString(),
      students
    });
  } catch (err) {
    return sendError(res, { status: 500, code: ERROR_CODES.INTERNAL_ERROR, message: err.message, req });
  }
});

/**
 * GET /api/students
 * Scoped by School Tenant and Role, with PII Redaction
 */
router.get('/', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const filter = { ...req.tenantFilter };

    // Parent Object Authorization: Only view linked children
    if (req.user.role === 'PARENT') {
      const allowedStudentIds = req.user.childrenIds || (req.user.studentId ? [req.user.studentId] : []);
      filter.$or = [
        { id: { $in: allowedStudentIds } },
        { parentEmail: req.user.email }
      ];
    }

    // Student Object Authorization: Only view self
    if (req.user.role === 'STUDENT') {
      filter.id = req.user.studentId || req.user.id;
    }

    // Teacher Authorization: If teacher is assigned to specific class/section
    if (req.user.role === 'TEACHER' && req.user.assignedClasses && req.user.assignedClasses.length > 0) {
      if (req.query.className) {
        if (!req.user.assignedClasses.includes(req.query.className)) {
          filter.className = { $in: [] };
        } else {
          filter.className = req.query.className;
        }
      } else {
        filter.className = { $in: req.user.assignedClasses };
      }
    }

    const students = await database.collection('students').find(filter).toArray();
    // Apply privacy-by-design PII redaction based on role and ownership
    const safeStudents = students.map((s) => redactStudentPii(s, req.user));
    res.json(safeStudents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/students/:id
 * Single 360° student profile with PII redaction
 */
router.get('/:id', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const student = await database.collection('students').findOne({
      id: req.params.id,
      ...req.tenantFilter
    });

    if (!student) {
      return sendError(res, {
        status: 404,
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: 'Student record not found in authorized school.',
        req
      });
    }

    // Parent access validation
    if (req.user.role === 'PARENT') {
      const allowed = (req.user.childrenIds && req.user.childrenIds.includes(student.id)) ||
                      req.user.studentId === student.id ||
                      student.parentEmail === req.user.email;
      if (!allowed) {
        return sendError(res, {
          status: 403,
          code: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
          message: 'FORBIDDEN: Parent cannot access unauthorized child profile.',
          req
        });
      }
    }

    // Student access validation
    if (req.user.role === 'STUDENT' && (req.user.studentId || req.user.id) !== student.id) {
      return sendError(res, {
        status: 403,
        code: ERROR_CODES.INSUFFICIENT_PERMISSIONS,
        message: 'FORBIDDEN: Students can only view their own record.',
        req
      });
    }

    const safeStudent = redactStudentPii(student, req.user);
    res.json(safeStudent);
  } catch (err) {
    return sendError(res, { status: 500, code: ERROR_CODES.INTERNAL_ERROR, message: err.message, req });
  }
});

/**
 * POST /api/students
 * Add new student directly with input validation and mass assignment protection
 */
router.post('/', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'STAFF'), async (req, res) => {
  try {
    const database = await getDb();
    const data = req.body;

    // Strict input validation
    if (!data || !data.name || !data.className || !data.section) {
      return sendError(res, {
        status: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed: Student name, className, and section are required fields.',
        details: [
          ...(!data?.name ? ['Field "name" is required.'] : []),
          ...(!data?.className ? ['Field "className" is required.'] : []),
          ...(!data?.section ? ['Field "section" is required.'] : [])
        ],
        req
      });
    }

    const studentCount = await database.collection('students').countDocuments(req.tenantFilter);
    const admissionNo = data.admissionNo || String(1000 + studentCount + 1);

    // Whitelist allowed fields to prevent mass-assignment
    const allowedFields = [
      'name', 'gender', 'dob', 'bloodGroup', 'category', 'className', 'section',
      'rollNo', 'fatherName', 'motherName', 'parentMobile', 'parentEmail',
      'address', 'city', 'state', 'pincode', 'status', 'admissionDate'
    ];
    const cleanPayload = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) {
        cleanPayload[key] = data[key];
      }
    }

    const newStudent = {
      ...cleanPayload,
      id: `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: req.user.role === 'SUPER_ADMIN' ? (data.schoolId || req.user.schoolId) : req.user.schoolId,
      admissionNo,
      status: cleanPayload.status || 'ACTIVE',
      admissionDate: cleanPayload.admissionDate || new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString()
    };

    await database.collection('students').insertOne(newStudent);

    await logAuditEvent({
      schoolId: newStudent.schoolId,
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'ADD_STUDENT',
      module: 'STUDENT_INFORMATION_SYSTEM',
      details: `Enrolled student: ${newStudent.name} (Adm No: ${admissionNo}) in ${newStudent.className}-${newStudent.section}`,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, student: newStudent });
  } catch (err) {
    return sendError(res, { status: 500, code: ERROR_CODES.INTERNAL_ERROR, message: err.message, req });
  }
});

/**
 * PUT /api/students/:id
 * Update student record with tenant ownership guarantee & mass assignment defense
 */
router.put('/:id', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'STAFF', 'TEACHER'), async (req, res) => {
  try {
    const database = await getDb();
    
    // Strict whitelist to prevent mass-assignment of sensitive or identity attributes
    const allowedFields = [
      'name', 'gender', 'dob', 'bloodGroup', 'category', 'className', 'section',
      'rollNo', 'fatherName', 'motherName', 'parentMobile', 'parentEmail',
      'address', 'city', 'state', 'pincode', 'status', 'admissionDate'
    ];
    const updates = {};
    for (const key of Object.keys(req.body || {})) {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    }

    const result = await database.collection('students').updateOne(
      { id: req.params.id, ...req.tenantFilter },
      { $set: { ...updates, updatedAt: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) {
      return sendError(res, {
        status: 404,
        code: ERROR_CODES.RESOURCE_NOT_FOUND,
        message: 'Student record not found or unauthorized in this tenant.',
        req
      });
    }

    const updated = await database.collection('students').findOne({ id: req.params.id, ...req.tenantFilter });
    res.json({ success: true, student: updated });
  } catch (err) {
    return sendError(res, { status: 500, code: ERROR_CODES.INTERNAL_ERROR, message: err.message, req });
  }
});

export default router;
