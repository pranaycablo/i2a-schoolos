/**
 * i2A SchoolOS — Organization Hierarchy Management REST API
 * Reference: Master Prompt 04 — Enterprise Security, Tenant Isolation & Hierarchy Hardening
 * Uses Transactional Hierarchy Service with In-Transaction Mutex Locks
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
import {
  createOrganization,
  updateOrganizationParent,
  resolveOrganizationTree,
  detectHierarchyCycle
} from '../services/hierarchyService.js';
import { PERMISSIONS } from '../middleware/rbac.js';

const router = express.Router();

/**
 * GET /api/organizations
 * Scoped organization listing
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const database = await getDb();
    let filter = {};

    if (req.user.role === 'SUPER_ADMIN') {
      filter = {};
    } else if (req.user.role === 'ORG_DIRECTOR' && req.user.orgId) {
      filter = { $or: [{ id: req.user.orgId }, { parentOrgId: req.user.orgId }] };
    } else if (req.user.orgId) {
      filter = { id: req.user.orgId };
    } else {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN: User does not possess organization-level access.',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    const orgs = await database.collection('organizations').find(filter).toArray();
    res.json(orgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/organizations/:id
 * Single organization details
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const database = await getDb();
    const org = await database.collection('organizations').findOne({ id: req.params.id });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found.', code: 'ORGANIZATION_NOT_FOUND' });
    }

    // Tenant / Organization Access Scoping
    if (req.user.role !== 'SUPER_ADMIN') {
      if (req.user.orgId && req.user.orgId !== org.id && req.user.orgId !== org.parentOrgId) {
        return res.status(403).json({
          error: 'FORBIDDEN: User cannot access unrelated organization.',
          code: 'ORGANIZATION_ACCESS_DENIED'
        });
      }
    }

    res.json(org);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/organizations/:id/tree
 * Hierarchy tree resolution
 */
router.get('/:id/tree', authenticateToken, async (req, res) => {
  try {
    const database = await getDb();
    const tree = await resolveOrganizationTree(req.params.id, database);
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/organizations
 * Creates a new organization document transactionally
 */
router.post('/', authenticateToken, requireRoles('SUPER_ADMIN', 'ORG_DIRECTOR'), requirePermissions(PERMISSIONS.ORGANIZATION_MANAGE), async (req, res) => {
  try {
    const database = await getDb();
    const orgPayload = req.body;

    if (!orgPayload || !orgPayload.id || !orgPayload.name || !orgPayload.orgType) {
      return res.status(400).json({
        error: 'Validation failed: id, name, and orgType are required fields.',
        code: 'VALIDATION_ERROR'
      });
    }

    // Role boundary: Non-SuperAdmin cannot create top-level organization unless authorized
    if (req.user.role !== 'SUPER_ADMIN' && !orgPayload.parentOrgId) {
      return res.status(403).json({
        error: 'FORBIDDEN: Only Platform Super Admin can create standalone root organizations.',
        code: 'PRIVILEGE_ESCALATION_BLOCKED'
      });
    }

    const created = await createOrganization(orgPayload, database);

    await logAuditEvent({
      schoolId: 'ORGANIZATION',
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'ORGANIZATION_CREATED',
      module: 'ORGANIZATION_HIERARCHY',
      details: `Created organization [${created.id}] (${created.name}) under parent [${created.parentOrgId || 'NONE'}]`,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, organization: created });
  } catch (err) {
    res.status(400).json({ error: err.message, code: err.code || 'ORGANIZATION_CREATE_FAILED' });
  }
});

/**
 * PUT /api/organizations/:id/parent
 * Atomically updates parent organization with ACID transactions, mutex lock-touch, and cycle prevention
 */
router.put('/:id/parent', authenticateToken, requireRoles('SUPER_ADMIN', 'ORG_DIRECTOR'), requirePermissions(PERMISSIONS.ORGANIZATION_MANAGE), async (req, res) => {
  try {
    const database = await getDb();
    const childId = req.params.id;
    const { parentId } = req.body || {};

    // Validate Org Director boundary: cannot move organizations outside their jurisdiction
    if (req.user.role === 'ORG_DIRECTOR' && req.user.orgId) {
      if (childId === req.user.orgId && parentId !== null) {
        return res.status(403).json({
          error: 'FORBIDDEN: Organization Director cannot reassign their own root organization parent.',
          code: 'ROOT_MUTATION_DENIED'
        });
      }
    }

    const mutationResult = await updateOrganizationParent({ childId, parentId, database });

    await logAuditEvent({
      schoolId: 'ORGANIZATION',
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'HIERARCHY_MUTATION',
      module: 'ORGANIZATION_HIERARCHY',
      details: `Updated parent for [${childId}] to [${parentId || 'ROOT'}]. Version: ${mutationResult.version}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      result: mutationResult
    });
  } catch (err) {
    const isCycle = err.code === 'CIRCULAR_HIERARCHY_DETECTED' || err.message.includes('Circular');
    const isUnsupported = err.code === 'TRANSACTION_UNSUPPORTED_TOPOLOGY';
    const status = isCycle ? 409 : (isUnsupported ? 503 : 400);

    res.status(status).json({
      success: false,
      error: err.message,
      code: err.code || 'HIERARCHY_UPDATE_FAILED'
    });
  }
});

export default router;
