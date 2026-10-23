/**
 * i2A SchoolOS — Child Data Privacy & DPDP Rights Management API
 * Reference: Master Prompt 04 — Part 7: Child Data Privacy & India-Ready Controls
 */

import express from 'express';
import { getDb } from '../db.js';
import {
  authenticateToken,
  enforceTenant,
  requireRoles,
  requirePermissions,
  logAuditEvent
} from '../middleware/auth.js';
import { submitPrivacyRequest } from '../services/privacyService.js';
import { PERMISSIONS } from '../middleware/rbac.js';

const router = express.Router();

/**
 * POST /api/privacy/requests
 * Allows parents or students to request data correction, erasure, or consent revocation under DPDP
 */
router.post('/requests', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const { studentId, requestType, reason } = req.body || {};

    if (!studentId || !requestType || !reason) {
      return res.status(400).json({
        error: 'Validation failed: studentId, requestType, and reason are required.',
        code: 'VALIDATION_ERROR'
      });
    }

    // Authorization: Parents can only request for linked children; Students only for self
    if (req.user.role === 'PARENT') {
      const allowed = (req.user.childrenIds && req.user.childrenIds.includes(studentId)) ||
                      req.user.studentId === studentId;
      if (!allowed) {
        return res.status(403).json({
          error: 'FORBIDDEN: Parent can only file privacy requests for their linked children.',
          code: 'UNAUTHORIZED_STUDENT_REQUEST'
        });
      }
    }

    if (req.user.role === 'STUDENT') {
      if ((req.user.studentId || req.user.id) !== studentId) {
        return res.status(403).json({
          error: 'FORBIDDEN: Students can only file privacy requests for their own record.',
          code: 'UNAUTHORIZED_STUDENT_REQUEST'
        });
      }
    }

    const doc = await submitPrivacyRequest({
      schoolId: req.user.schoolId,
      studentId,
      requesterEmail: req.user.email,
      requesterRole: req.user.role,
      requestType,
      reason
    });

    res.status(201).json({
      success: true,
      message: 'Privacy request successfully logged and queued for data protection review.',
      request: doc
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/privacy/requests
 * View school privacy requests (Principal / Admin only)
 */
router.get('/requests', authenticateToken, enforceTenant, requirePermissions(PERMISSIONS.PRIVACY_MANAGE), async (req, res) => {
  try {
    const database = await getDb();
    const requests = await database.collection('privacy_requests')
      .find(req.tenantFilter)
      .sort({ submittedAt: -1 })
      .toArray();

    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/privacy/requests/:id/status
 * Update status of privacy request (APPROVE / REJECT / RESOLVE)
 */
router.put('/requests/:id/status', authenticateToken, enforceTenant, requirePermissions(PERMISSIONS.PRIVACY_MANAGE), async (req, res) => {
  try {
    const database = await getDb();
    const { status, resolutionNotes } = req.body || {};

    if (!['APPROVED', 'REJECTED', 'RESOLVED'].includes(status)) {
      return res.status(400).json({ error: 'Status must be APPROVED, REJECTED, or RESOLVED.' });
    }

    const result = await database.collection('privacy_requests').updateOne(
      { id: req.params.id, ...req.tenantFilter },
      {
        $set: {
          status,
          resolutionNotes: resolutionNotes || '',
          resolvedBy: req.user.id,
          resolvedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Privacy request not found in authorized school.' });
    }

    await logAuditEvent({
      schoolId: req.user.schoolId,
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'PRIVACY_REQUEST_RESOLVED',
      module: 'DATA_PRIVACY',
      details: `Privacy request [${req.params.id}] marked as [${status}] by [${req.user.name}]`,
      ipAddress: req.ip
    });

    res.json({ success: true, message: `Privacy request updated to ${status}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
