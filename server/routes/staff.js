/**
 * i2A SchoolOS — Staff Workforce, Accounts & Permission Administration Routes
 * Master Prompt 10: Staff, Accounts & Permission Administration
 *
 * REST Endpoints:
 * - GET    /api/staff                      List staff (filters: department, designation, branch, status, search)
 * - POST   /api/staff                      Onboard new staff member & provision user account
 * - GET    /api/staff/:id                  Get staff profile with least-privilege PII masking
 * - PUT    /api/staff/:id                  Update staff profile & sync user roles
 * - PATCH  /api/staff/:id/status           Change status (ACTIVE, SUSPENDED, TERMINATED, INACTIVE) & sync auth access
 * - POST   /api/staff/:id/branches         Assign allowed branches with cross-tenant validation
 * - POST   /api/staff/leaves               Apply for leave
 * - GET    /api/staff/leaves               List leave requests scoped by tenant & role
 * - PATCH  /api/staff/leaves/:id/decision  Approve or reject leave with distributed mutex lock
 * - POST   /api/staff/bulk-validate        Validate bulk import rows before ingestion
 */

import express from 'express';
import {
  authenticateToken,
  enforceTenant,
  requireRoles,
  logAuditEvent
} from '../middleware/auth.js';
import {
  listStaff,
  getStaffById,
  createStaff,
  updateStaff,
  updateStaffStatus,
  assignStaffBranches,
  applyLeave,
  listLeaveRequests,
  processLeaveDecision,
  validateBulkStaffImport
} from '../services/staffWorkforceService.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// 1. Staff Directory & Search (GET /api/staff)
// ---------------------------------------------------------------------------
router.get('/', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const {
      branchId,
      department,
      designation,
      status,
      isTeacher,
      search,
      page,
      limit
    } = req.query;

    const result = await listStaff({
      schoolId,
      branchId,
      department,
      designation,
      status,
      isTeacher: isTeacher !== undefined ? isTeacher === 'true' : undefined,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 100,
      requestingUser: req.user
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message,
      code: err.code || 'INTERNAL_ERROR'
    });
  }
});

// ---------------------------------------------------------------------------
// 2. Onboard New Staff & Provision Account (POST /api/staff)
// ---------------------------------------------------------------------------
router.post(
  '/',
  authenticateToken,
  enforceTenant,
  requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ORG_DIRECTOR', 'HR'),
  async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const institutionId = req.user.institutionId || schoolId;
      const staffData = req.body;

      const result = await createStaff({
        schoolId,
        institutionId,
        staffData,
        creatorUser: req.user
      });

      res.status(201).json(result);
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        error: err.message,
        code: err.code || 'INTERNAL_ERROR'
      });
    }
  }
);

// ---------------------------------------------------------------------------
// 3. Leave Management Endpoints (Mounted before /:id to prevent route clash)
// ---------------------------------------------------------------------------
router.get('/leaves', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { staffId, status, branchId } = req.query;

    const result = await listLeaveRequests({
      schoolId,
      staffId,
      status,
      branchId,
      requestingUser: req.user
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message,
      code: err.code || 'INTERNAL_ERROR'
    });
  }
});

router.post('/leaves', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { staffId, startDate, endDate, leaveType, reason } = req.body;

    const result = await applyLeave({
      schoolId,
      staffId: staffId || req.user.staffId || req.user.id,
      leaveData: { startDate, endDate, leaveType, reason },
      requestingUser: req.user
    });

    res.status(201).json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message,
      code: err.code || 'INTERNAL_ERROR'
    });
  }
});

router.patch(
  '/leaves/:id/decision',
  authenticateToken,
  enforceTenant,
  requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ORG_DIRECTOR', 'HR'),
  async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const leaveId = req.params.id;
      const { decision, comments } = req.body;

      const result = await processLeaveDecision({
        schoolId,
        leaveId,
        decision,
        comments,
        decidingUser: req.user
      });

      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        error: err.message,
        code: err.code || 'INTERNAL_ERROR'
      });
    }
  }
);

// ---------------------------------------------------------------------------
// 4. Bulk Import Validation (POST /api/staff/bulk-validate)
// ---------------------------------------------------------------------------
router.post(
  '/bulk-validate',
  authenticateToken,
  enforceTenant,
  requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ORG_DIRECTOR', 'HR'),
  async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const { rows } = req.body;

      const result = await validateBulkStaffImport({
        schoolId,
        rows: Array.isArray(rows) ? rows : []
      });

      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        error: err.message,
        code: err.code || 'INTERNAL_ERROR'
      });
    }
  }
);

// ---------------------------------------------------------------------------
// 5. Individual Staff Profile Operations (GET, PUT, PATCH, POST branches)
// ---------------------------------------------------------------------------
router.get('/:id', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const staffId = req.params.id;

    const result = await getStaffById({
      schoolId,
      staffId,
      requestingUser: req.user
    });

    res.json(result);
  } catch (err) {
    res.status(err.status || 500).json({
      success: false,
      error: err.message,
      code: err.code || 'INTERNAL_ERROR'
    });
  }
});

router.put(
  '/:id',
  authenticateToken,
  enforceTenant,
  requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ORG_DIRECTOR', 'HR'),
  async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const staffId = req.params.id;
      const updateData = req.body;

      const result = await updateStaff({
        schoolId,
        staffId,
        updateData,
        updatingUser: req.user
      });

      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        error: err.message,
        code: err.code || 'INTERNAL_ERROR'
      });
    }
  }
);

router.patch(
  '/:id/status',
  authenticateToken,
  enforceTenant,
  requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ORG_DIRECTOR', 'HR'),
  async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const staffId = req.params.id;
      const { status, reason } = req.body;

      const result = await updateStaffStatus({
        schoolId,
        staffId,
        newStatus: status,
        reason,
        updatingUser: req.user
      });

      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        error: err.message,
        code: err.code || 'INTERNAL_ERROR'
      });
    }
  }
);

router.post(
  '/:id/branches',
  authenticateToken,
  enforceTenant,
  requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ORG_DIRECTOR', 'HR'),
  async (req, res) => {
    try {
      const schoolId = req.user.schoolId;
      const staffId = req.params.id;
      const { primaryBranchId, allowedBranchIds } = req.body;

      const result = await assignStaffBranches({
        schoolId,
        staffId,
        primaryBranchId,
        allowedBranchIds,
        updatingUser: req.user
      });

      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({
        success: false,
        error: err.message,
        code: err.code || 'INTERNAL_ERROR'
      });
    }
  }
);

export default router;
