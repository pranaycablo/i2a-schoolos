/**
 * i2A SchoolOS — Hardened Authentication, Session & Multi-Tenant Scoping Middleware
 * Reference: Master Prompt 04 — Enterprise Security, Privacy, RBAC & Tenant Isolation
 */

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getDb } from '../db.js';
import { isSchoolUnderOrganization } from '../services/hierarchyService.js';
import { hasPermission, ROLES } from './rbac.js';
import { recordAuditEvent } from '../services/auditService.js';

// ---------------------------------------------------------------------------
// 1. Environment-Driven Secret Configuration (Fail-Closed in Production)
// ---------------------------------------------------------------------------
const DEFAULT_DEV_SECRET = 'i2a_schoolos_jwt_super_secret_key_2026_production';

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret || secret === DEFAULT_DEV_SECRET) {
      throw new Error(
        'CRITICAL_CONFIG_ERROR: In production, JWT_SECRET must be explicitly configured in the environment. Fail-closed.'
      );
    }
    return secret;
  }
  return secret || DEFAULT_DEV_SECRET;
}

export const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_DEV_SECRET;
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// ---------------------------------------------------------------------------
// 2. Token Revocation & Active Session Blacklist Engine (Persistent & Hashed)
// Never stores raw bearer tokens in database/logs: hashes with SHA-256
// Multi-instance safe & survives server process restarts via MongoDB
// ---------------------------------------------------------------------------
const inMemoryRevokedTokens = new Set();

export function hashToken(token) {
  if (!token) return '';
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Revokes an active JWT token (e.g. on logout, password change, account suspension)
 */
export async function revokeToken(token, reason = 'LOGOUT') {
  if (!token) return;
  const tokenHash = hashToken(token);
  inMemoryRevokedTokens.add(tokenHash);

  try {
    const database = await getDb();
    await database.collection('revoked_tokens').updateOne(
      { tokenHash },
      {
        $set: {
          tokenHash,
          reason,
          revokedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      },
      { upsert: true }
    );
  } catch (err) {
    // If DB fails, in-memory set remains authoritative for active process
    console.error('⚠️ [TokenRevocation] DB record failed, in-memory blacklist active:', err.message);
  }
}

/**
 * Checks whether a token has been revoked across in-memory cache and persistent MongoDB store
 */
export async function isTokenRevoked(token) {
  if (!token) return true;
  const tokenHash = hashToken(token);
  if (inMemoryRevokedTokens.has(tokenHash)) return true;

  try {
    const database = await getDb();
    const found = await database.collection('revoked_tokens').findOne({ tokenHash });
    if (found) {
      inMemoryRevokedTokens.add(tokenHash);
      return true;
    }
  } catch (err) {
    // Return memory result on DB disconnection
  }
  return false;
}

/**
 * Test helper to clear in-memory revocation cache to simulate a cold server restart
 */
export function clearInMemoryRevocationCache() {
  inMemoryRevokedTokens.clear();
}

// ---------------------------------------------------------------------------
// 3. Brute-Force Throttling & Account Lockout (Multi-Instance & Persistent)
// Backed by MongoDB 'login_attempts' collection with in-memory short-cache
// ---------------------------------------------------------------------------
const failedLoginAttempts = new Map();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export async function recordFailedLoginAttempt(identifier) {
  if (!identifier) return null;
  const key = identifier.toLowerCase().trim();
  const now = Date.now();

  // 1. Update in-memory cache
  const current = failedLoginAttempts.get(key) || { count: 0, lastFailed: now, lockedUntil: null };
  current.count += 1;
  current.lastFailed = now;

  if (current.count >= MAX_FAILED_ATTEMPTS) {
    current.lockedUntil = now + LOCKOUT_DURATION_MS;
  }
  failedLoginAttempts.set(key, current);

  // 2. Persist to MongoDB for restart & multi-process durability
  try {
    const database = await getDb();
    const lockedUntilDate = current.lockedUntil ? new Date(current.lockedUntil) : null;
    await database.collection('login_attempts').updateOne(
      { identifier: key },
      {
        $set: {
          count: current.count,
          lastFailed: new Date(now),
          lockedUntil: lockedUntilDate,
          updatedAt: new Date(now)
        }
      },
      { upsert: true }
    );
  } catch (err) {
    // In-memory fallback
  }

  return current;
}

export async function isAccountLocked(identifier) {
  if (!identifier) return false;
  const key = identifier.toLowerCase().trim();
  const now = Date.now();

  // Check in-memory first for high throughput
  const memCurrent = failedLoginAttempts.get(key);
  if (memCurrent && memCurrent.lockedUntil && now < memCurrent.lockedUntil) {
    const remainingSec = Math.ceil((memCurrent.lockedUntil - now) / 1000);
    return { locked: true, remainingSec };
  }

  // Check persistent store for restart resilience or other clustered instances
  try {
    const database = await getDb();
    const doc = await database.collection('login_attempts').findOne({ identifier: key });
    if (doc && doc.lockedUntil) {
      const lockedUntilMs = new Date(doc.lockedUntil).getTime();
      if (now < lockedUntilMs) {
        const remainingSec = Math.ceil((lockedUntilMs - now) / 1000);
        failedLoginAttempts.set(key, {
          count: doc.count,
          lastFailed: new Date(doc.lastFailed).getTime(),
          lockedUntil: lockedUntilMs
        });
        return { locked: true, remainingSec };
      }
    }
  } catch (err) {
    // In-memory fallback
  }

  if (memCurrent && memCurrent.lockedUntil && now >= memCurrent.lockedUntil) {
    failedLoginAttempts.delete(key);
  }
  return false;
}

export async function clearFailedLogins(identifier) {
  if (!identifier) return;
  const key = identifier.toLowerCase().trim();
  failedLoginAttempts.delete(key);
  try {
    const database = await getDb();
    await database.collection('login_attempts').deleteOne({ identifier: key });
  } catch (err) {
    // In-memory cleared
  }
}

/**
 * Test helper to clear in-memory throttling cache to simulate a cold server restart
 */
export function clearInMemoryThrottlingCache() {
  failedLoginAttempts.clear();
}

// ---------------------------------------------------------------------------
// 4. Password Hashing & Verification
// ---------------------------------------------------------------------------
export async function hashPassword(plainPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plainPassword, salt);
}

export async function comparePassword(plainPassword, hashedPassword) {
  if (!plainPassword || !hashedPassword) return false;
  return bcrypt.compare(plainPassword, hashedPassword);
}

export function generateToken(payload) {
  const secret = getJwtSecret();
  return jwt.sign(payload, secret, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'i2a_schoolos',
    audience: 'i2a_schoolos_api'
  });
}

// ---------------------------------------------------------------------------
// 5. Authentication Middleware: Bearer JWT Extraction & Verification
// ---------------------------------------------------------------------------
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED: Authentication token missing. Please log in.',
      code: 'AUTH_TOKEN_MISSING',
      requestId: req.requestId
    });
  }

  // Check Token Revocation Blacklist
  const revoked = await isTokenRevoked(token);
  if (revoked) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED: Session has been logged out or revoked. Please log in again.',
      code: 'TOKEN_REVOKED',
      requestId: req.requestId
    });
  }

  try {
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);

    // Verify user exists and check active account status
    const database = await getDb();
    const user = await database.collection('users').findOne({ id: decoded.id });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED: User account not found.',
        code: 'USER_NOT_FOUND',
        requestId: req.requestId
      });
    }

    if (user.status && user.status !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        error: `FORBIDDEN: User account is ${user.status.toLowerCase()}. Access denied.`,
        code: user.status === 'DISABLED' ? 'ACCOUNT_DISABLED' : 'ACCOUNT_SUSPENDED',
        requestId: req.requestId
      });
    }

    // Check membership revocation across institution/branch scope
    if (user.schoolId && user.schoolId !== 'ALL') {
      const membership = await database.collection('memberships').findOne({
        userId: user.id,
        schoolId: user.schoolId
      });
      if (membership && (membership.status === 'REVOKED' || membership.status === 'SUSPENDED' || membership.status === 'INACTIVE')) {
        return res.status(403).json({
          success: false,
          error: `FORBIDDEN: User membership in school [${user.schoolId}] is revoked or inactive.`,
          code: 'MEMBERSHIP_REVOKED',
          requestId: req.requestId
        });
      }
    }

    req.token = token;
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      orgId: user.orgId || null,
      studentId: user.studentId,
      childrenIds: user.childrenIds,
      assignedClasses: user.assignedClasses,
      subjects: user.subjects
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED: Session expired. Please log in again.',
        code: 'TOKEN_EXPIRED',
        requestId: req.requestId
      });
    }
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN: Invalid authentication token.',
      code: 'INVALID_TOKEN',
      requestId: req.requestId
    });
  }
}

// ---------------------------------------------------------------------------
// 6. Multi-Tenant Isolation Middleware (Zero-Bypass)
// ---------------------------------------------------------------------------
export async function enforceTenant(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'UNAUTHORIZED: No active user session.',
      code: 'UNAUTHORIZED',
      requestId: req.requestId
    });
  }

  // Super Admin can access all schools or filter by target school
  if (req.user.role === ROLES.SUPER_ADMIN) {
    const targetSchoolId = req.params.schoolId || req.query.schoolId || req.body?.schoolId;
    req.tenantFilter = targetSchoolId && targetSchoolId !== 'ALL' ? { schoolId: targetSchoolId } : {};
    return next();
  }

  // Org Director can access schools under their parent organization
  if (req.user.role === ROLES.ORG_DIRECTOR && req.user.orgId) {
    const requestedSchoolId = req.params.schoolId || req.query.schoolId || req.body?.schoolId;
    if (!requestedSchoolId) {
      req.tenantFilter = { orgId: req.user.orgId };
      return next();
    }
    const database = await getDb();
    const isAuthorized = await isSchoolUnderOrganization(req.user.orgId, requestedSchoolId, database);
    if (!isAuthorized) {
      await recordAuditEvent({
        schoolId: requestedSchoolId,
        actorId: req.user.id,
        actorName: req.user.name,
        role: req.user.role,
        action: 'CROSS_TENANT_VIOLATION_BLOCKED',
        resourceType: 'TENANT',
        outcome: 'DENIED',
        details: `Organization [${req.user.orgId}] does not govern target school [${requestedSchoolId}]`,
        ipAddress: req.ip,
        requestId: req.requestId
      });
      return res.status(403).json({
        success: false,
        error: `FORBIDDEN: Cross-tenant organization violation. Organization [${req.user.orgId}] does not govern school [${requestedSchoolId}].`,
        code: 'CROSS_TENANT_VIOLATION',
        requestId: req.requestId
      });
    }
    req.tenantFilter = { schoolId: requestedSchoolId };
    return next();
  }

  // Fail-closed if user does not possess an assigned schoolId
  if (!req.user.schoolId) {
    return res.status(403).json({
      success: false,
      error: 'FORBIDDEN: User account has no assigned school tenant context.',
      code: 'MISSING_TENANT_CONTEXT',
      requestId: req.requestId
    });
  }

  const requestedSchoolId = req.params.schoolId || req.query.schoolId || req.body?.schoolId;

  // Strict cross-tenant rejection if client specifies a foreign school ID
  if (requestedSchoolId && requestedSchoolId !== req.user.schoolId) {
    await recordAuditEvent({
      schoolId: requestedSchoolId,
      actorId: req.user.id,
      actorName: req.user.name,
      role: req.user.role,
      action: 'CROSS_TENANT_VIOLATION_BLOCKED',
      resourceType: 'TENANT',
      outcome: 'DENIED',
      details: `User belonging to [${req.user.schoolId}] attempted access to foreign tenant [${requestedSchoolId}]`,
      ipAddress: req.ip,
      requestId: req.requestId
    });
    return res.status(403).json({
      success: false,
      error: `FORBIDDEN: Cross-tenant access violation. Your account belongs to [${req.user.schoolId}] and cannot access [${requestedSchoolId}].`,
      code: 'CROSS_TENANT_VIOLATION',
      requestId: req.requestId
    });
  }

  // Inject authoritative tenant filter for all subsequent database queries
  req.tenantFilter = { schoolId: req.user.schoolId };
  next();
}

// ---------------------------------------------------------------------------
// 7. Role-Based Access Control (RBAC) Middleware
// ---------------------------------------------------------------------------
export function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED: User session required.',
        code: 'UNAUTHORIZED',
        requestId: req.requestId
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      recordAuditEvent({
        schoolId: req.user.schoolId,
        actorId: req.user.id,
        actorName: req.user.name,
        role: req.user.role,
        action: 'INSUFFICIENT_PERMISSIONS_BLOCKED',
        resourceType: 'API_ENDPOINT',
        outcome: 'DENIED',
        details: `Role '${req.user.role}' attempted action requiring roles: [${allowedRoles.join(', ')}]`,
        ipAddress: req.ip,
        requestId: req.requestId
      });
      return res.status(403).json({
        success: false,
        error: `FORBIDDEN: Role '${req.user.role}' is not authorized for this operation. Required roles: ${allowedRoles.join(', ')}`,
        code: 'INSUFFICIENT_PERMISSIONS',
        requestId: req.requestId
      });
    }

    next();
  };
}

// ---------------------------------------------------------------------------
// 8. Permission-Based Access Control Middleware
// ---------------------------------------------------------------------------
export function requirePermissions(...requiredPermissions) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED: User session required.',
        code: 'UNAUTHORIZED',
        requestId: req.requestId
      });
    }

    for (const perm of requiredPermissions) {
      if (!hasPermission(req.user.role, perm)) {
        recordAuditEvent({
          schoolId: req.user.schoolId,
          actorId: req.user.id,
          actorName: req.user.name,
          role: req.user.role,
          action: 'PERMISSION_DENIED',
          resourceType: 'PERMISSION',
          resourceId: perm,
          outcome: 'DENIED',
          details: `Role '${req.user.role}' lacks required permission '${perm}'`,
          ipAddress: req.ip,
          requestId: req.requestId
        });
        return res.status(403).json({
          success: false,
          error: `FORBIDDEN: Role '${req.user.role}' lacks permission '${perm}' required for this operation.`,
          code: 'INSUFFICIENT_PERMISSIONS',
          requestId: req.requestId
        });
      }
    }

    next();
  };
}

// ---------------------------------------------------------------------------
// 9. Forensic Audit Logger Adapter (Maintains Backwards Compatibility)
// ---------------------------------------------------------------------------
export async function logAuditEvent({ schoolId, userId, userName, role, action, module, details, ipAddress }) {
  return recordAuditEvent({
    schoolId,
    actorId: userId,
    actorName: userName,
    role,
    action,
    module,
    details,
    ipAddress
  });
}
