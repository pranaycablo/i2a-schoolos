/**
 * i2A SchoolOS — Institution Hierarchy & Academic Configuration REST API
 * Reference: Master Prompt 09: Organization, Branch, Campus & Academic Configuration OS
 */

import express from 'express';
import { getDb } from '../db.js';
import {
  authenticateToken,
  requireRoles
} from '../middleware/auth.js';
import {
  createBranch,
  updateBranch,
  archiveBranch,
  listBranches,
  getBranch,
  createCampus,
  updateCampus,
  archiveCampus,
  listCampuses,
  getCampus,
  createAcademicSession,
  activateAcademicSession,
  updateAcademicSession,
  archiveAcademicSession,
  listAcademicSessions,
  resolveHierarchyTree,
  getHierarchyBreadcrumbs,
  onboardApprovedInstitution
} from '../services/institutionHierarchyService.js';

const router = express.Router();

// ============================================================================
// 1. HIERARCHY TREE & BREADCRUMBS
// ============================================================================

/**
 * GET /api/hierarchy/tree
 * Resolves full hierarchical tree for the caller's institution or requested institutionId
 */
router.get('/tree', authenticateToken, async (req, res) => {
  try {
    const database = await getDb();
    const targetInstitutionId = req.query.institutionId || req.user.schoolId || req.user.tenantId || req.user.orgId;

    if (!targetInstitutionId) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR: Target institutionId is required.',
        code: 'VALIDATION_ERROR'
      });
    }

    const tree = await resolveHierarchyTree(targetInstitutionId, database, req.user);
    res.json({ success: true, ...tree });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      error: err.message,
      code: err.code || 'HIERARCHY_TREE_ERROR'
    });
  }
});

/**
 * GET /api/hierarchy/breadcrumbs
 * Resolves upstream hierarchy breadcrumb trail
 */
router.get('/breadcrumbs', authenticateToken, async (req, res) => {
  try {
    const database = await getDb();
    const { entityType, entityId } = req.query;

    if (!entityType || !entityId) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR: "entityType" and "entityId" query parameters are required.',
        code: 'VALIDATION_ERROR'
      });
    }

    const breadcrumbs = await getHierarchyBreadcrumbs(entityType, entityId, database, req.user);
    res.json({ success: true, breadcrumbs });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      error: err.message,
      code: err.code || 'BREADCRUMBS_ERROR'
    });
  }
});

// ============================================================================
// 2. BRANCH ROUTES
// ============================================================================

/**
 * GET /api/hierarchy/branches
 * Scoped branch listing
 */
router.get('/branches', authenticateToken, async (req, res) => {
  try {
    const database = await getDb();
    const filter = {
      institutionId: req.query.institutionId,
      orgId: req.query.orgId,
      status: req.query.status,
      includeArchived: req.query.includeArchived === 'true'
    };

    const branches = await listBranches(filter, database, req.user);
    res.json({ success: true, branches });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      error: err.message,
      code: err.code || 'LIST_BRANCHES_ERROR'
    });
  }
});

/**
 * GET /api/hierarchy/branches/:id
 * Single branch details
 */
router.get('/branches/:id', authenticateToken, async (req, res) => {
  try {
    const database = await getDb();
    const branch = await getBranch(req.params.id, database, req.user);
    res.json({ success: true, branch });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      error: err.message,
      code: err.code || 'GET_BRANCH_ERROR'
    });
  }
});

/**
 * POST /api/hierarchy/branches
 * Create a new branch
 */
router.post(
  '/branches',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL', 'ADMIN'),
  async (req, res) => {
    try {
      const database = await getDb();
      const payload = {
        ...req.body,
        institutionId: req.body.institutionId || req.user.schoolId || req.user.tenantId
      };

      const branch = await createBranch(payload, database, req.user);
      res.status(201).json({ success: true, branch });
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        error: err.message,
        code: err.code || 'CREATE_BRANCH_ERROR'
      });
    }
  }
);

/**
 * PUT /api/hierarchy/branches/:id
 * Update an existing branch
 */
router.put(
  '/branches/:id',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL', 'ADMIN', 'BRANCH_ADMIN'),
  async (req, res) => {
    try {
      const database = await getDb();
      const branch = await updateBranch(req.params.id, req.body, database, req.user);
      res.json({ success: true, branch });
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        error: err.message,
        code: err.code || 'UPDATE_BRANCH_ERROR'
      });
    }
  }
);

/**
 * DELETE /api/hierarchy/branches/:id
 * Soft archive a branch
 */
router.delete(
  '/branches/:id',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL'),
  async (req, res) => {
    try {
      const database = await getDb();
      const result = await archiveBranch(req.params.id, database, req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        error: err.message,
        code: err.code || 'ARCHIVE_BRANCH_ERROR'
      });
    }
  }
);

// ============================================================================
// 3. CAMPUS ROUTES
// ============================================================================

/**
 * GET /api/hierarchy/campuses
 * Scoped campus listing
 */
router.get('/campuses', authenticateToken, async (req, res) => {
  try {
    const database = await getDb();
    const filter = {
      branchId: req.query.branchId,
      institutionId: req.query.institutionId,
      status: req.query.status,
      includeArchived: req.query.includeArchived === 'true'
    };

    const campuses = await listCampuses(filter, database, req.user);
    res.json({ success: true, campuses });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      error: err.message,
      code: err.code || 'LIST_CAMPUSES_ERROR'
    });
  }
});

/**
 * GET /api/hierarchy/campuses/:id
 * Single campus details
 */
router.get('/campuses/:id', authenticateToken, async (req, res) => {
  try {
    const database = await getDb();
    const campus = await getCampus(req.params.id, database, req.user);
    res.json({ success: true, campus });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      error: err.message,
      code: err.code || 'GET_CAMPUS_ERROR'
    });
  }
});

/**
 * POST /api/hierarchy/campuses
 * Create a new campus under a branch
 */
router.post(
  '/campuses',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL', 'ADMIN', 'BRANCH_ADMIN'),
  async (req, res) => {
    try {
      const database = await getDb();
      const campus = await createCampus(req.body, database, req.user);
      res.status(201).json({ success: true, campus });
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        error: err.message,
        code: err.code || 'CREATE_CAMPUS_ERROR'
      });
    }
  }
);

/**
 * PUT /api/hierarchy/campuses/:id
 * Update an existing campus
 */
router.put(
  '/campuses/:id',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL', 'ADMIN', 'BRANCH_ADMIN', 'CAMPUS_ADMIN'),
  async (req, res) => {
    try {
      const database = await getDb();
      const campus = await updateCampus(req.params.id, req.body, database, req.user);
      res.json({ success: true, campus });
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        error: err.message,
        code: err.code || 'UPDATE_CAMPUS_ERROR'
      });
    }
  }
);

/**
 * DELETE /api/hierarchy/campuses/:id
 * Soft archive a campus
 */
router.delete(
  '/campuses/:id',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL', 'ADMIN', 'BRANCH_ADMIN'),
  async (req, res) => {
    try {
      const database = await getDb();
      const result = await archiveCampus(req.params.id, database, req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        error: err.message,
        code: err.code || 'ARCHIVE_CAMPUS_ERROR'
      });
    }
  }
);

// ============================================================================
// 4. ACADEMIC SESSION ROUTES
// ============================================================================

/**
 * GET /api/hierarchy/academic-sessions
 * List academic sessions for an institution
 */
router.get('/academic-sessions', authenticateToken, async (req, res) => {
  try {
    const database = await getDb();
    const institutionId = req.query.institutionId || req.user.schoolId || req.user.tenantId;

    if (!institutionId) {
      return res.status(400).json({
        success: false,
        error: 'VALIDATION_ERROR: "institutionId" is required.',
        code: 'VALIDATION_ERROR'
      });
    }

    const sessions = await listAcademicSessions(institutionId, database, req.user);
    res.json({ success: true, sessions });
  } catch (err) {
    const status = err.status || 500;
    res.status(status).json({
      success: false,
      error: err.message,
      code: err.code || 'LIST_SESSIONS_ERROR'
    });
  }
});

/**
 * POST /api/hierarchy/academic-sessions
 * Create a new academic session
 */
router.post(
  '/academic-sessions',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL', 'ADMIN'),
  async (req, res) => {
    try {
      const database = await getDb();
      const payload = {
        ...req.body,
        institutionId: req.body.institutionId || req.user.schoolId || req.user.tenantId
      };

      const session = await createAcademicSession(payload, database, req.user);
      res.status(201).json({ success: true, session });
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        error: err.message,
        code: err.code || 'CREATE_SESSION_ERROR'
      });
    }
  }
);

/**
 * PUT /api/hierarchy/academic-sessions/:id
 * Update an existing academic session
 */
router.put(
  '/academic-sessions/:id',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL', 'ADMIN'),
  async (req, res) => {
    try {
      const database = await getDb();
      const session = await updateAcademicSession(req.params.id, req.body, database, req.user);
      res.json({ success: true, session });
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        error: err.message,
        code: err.code || 'UPDATE_SESSION_ERROR'
      });
    }
  }
);

/**
 * POST /api/hierarchy/academic-sessions/:id/activate
 * Enforces atomic single active session activation
 */
router.post(
  '/academic-sessions/:id/activate',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL', 'ADMIN'),
  async (req, res) => {
    try {
      const database = await getDb();
      const institutionId = req.body.institutionId || req.user.schoolId || req.user.tenantId;

      if (!institutionId) {
        return res.status(400).json({
          success: false,
          error: 'VALIDATION_ERROR: "institutionId" is required.',
          code: 'VALIDATION_ERROR'
        });
      }

      const result = await activateAcademicSession(req.params.id, institutionId, database, req.user);
      res.json(result);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        error: err.message,
        code: err.code || 'ACTIVATE_SESSION_ERROR'
      });
    }
  }
);

/**
 * DELETE /api/hierarchy/academic-sessions/:id
 * Soft archive an academic session
 */
router.delete(
  '/academic-sessions/:id',
  authenticateToken,
  requireRoles('SUPER_ADMIN', 'ORG_DIRECTOR', 'PRINCIPAL', 'ADMIN'),
  async (req, res) => {
    try {
      const database = await getDb();
      const result = await archiveAcademicSession(req.params.id, database, req.user);
      res.json({ success: true, ...result });
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        error: err.message,
        code: err.code || 'ARCHIVE_SESSION_ERROR'
      });
    }
  }
);

// ============================================================================
// 5. ONBOARDING BRIDGE FOR PHASE 08 APPROVED APPLICATIONS
// ============================================================================

/**
 * POST /api/hierarchy/onboard-application/:appId
 * Idempotently links and initializes an approved application into full hierarchy
 */
router.post(
  '/onboard-application/:appId',
  authenticateToken,
  requireRoles('SUPER_ADMIN'),
  async (req, res) => {
    try {
      const database = await getDb();
      const result = await onboardApprovedInstitution(req.params.appId, database);
      res.json(result);
    } catch (err) {
      const status = err.status || 500;
      res.status(status).json({
        success: false,
        error: err.message,
        code: err.code || 'ONBOARD_APPLICATION_ERROR'
      });
    }
  }
);

export default router;
