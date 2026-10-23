/**
 * i2A SchoolOS — Forensic Structured Audit Logging Engine
 * Reference: Master Prompt 04 — Enterprise Security, Privacy & Audit Logging
 * Document Ref: Part 9 — Audit Logging & Accountability
 */

import { getDb } from '../db.js';

/**
 * Strips sensitive data (passwords, tokens, raw Aadhaar, private payment secrets) from audit metadata
 */
export function sanitizeAuditDetails(details) {
  if (!details) return '';
  if (typeof details === 'object') {
    const clone = { ...details };
    const forbiddenKeys = [
      'password',
      'passwordHash',
      'plainPassword',
      'token',
      'resetToken',
      'hashedResetToken',
      'otp',
      'hashedOtp',
      'aadhaar',
      'nationalId',
      'secretKey',
      'creditCard',
      'cvv'
    ];
    for (const key of Object.keys(clone)) {
      if (forbiddenKeys.some((f) => key.toLowerCase().includes(f.toLowerCase()))) {
        clone[key] = '[REDACTED_SECURITY_DATA]';
      }
    }
    return JSON.stringify(clone);
  }
  let str = String(details);
  // Redact potential passwords or tokens matching common patterns
  str = str.replace(/(password|token|otp|secret)=([^\s&]+)/gi, '$1=[REDACTED]');
  return str;
}

/**
 * Records an immutable, append-only structured audit event into `audit_logs`
 */
export async function recordAuditEvent({
  schoolId,
  tenantId,
  orgId,
  actorId,
  userId,
  actorName,
  userName,
  role,
  actorRole,
  action,
  module,
  resourceType,
  resourceId,
  outcome = 'SUCCESS',
  details,
  ipAddress,
  userAgent,
  correlationId,
  requestId
}) {
  try {
    const database = await getDb();
    const effectiveSchoolId = schoolId || tenantId || 'SYSTEM';
    const effectiveActorId = actorId || userId || 'ANONYMOUS';
    const effectiveActorName = actorName || userName || 'System Service';
    const effectiveRole = role || actorRole || 'SYSTEM';
    const effectiveCorrelationId = correlationId || requestId || `corr-${Date.now()}`;
    const sanitizedDesc = sanitizeAuditDetails(details);

    const eventDoc = {
      id: `audit-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      schoolId: effectiveSchoolId,
      orgId: orgId || null,
      actorId: effectiveActorId,
      actorName: effectiveActorName,
      actorRole: effectiveRole,
      role: effectiveRole,
      action,
      module: module || 'CORE_SYSTEM',
      resourceType: resourceType || 'SYSTEM',
      resourceId: resourceId || null,
      outcome, // SUCCESS | DENIED | FAILED
      details: sanitizedDesc,
      ipAddress: ipAddress || '127.0.0.1',
      userAgent: userAgent || 'internal/system',
      correlationId: effectiveCorrelationId,
      isSystemEvent: effectiveRole === 'SYSTEM'
    };

    await database.collection('audit_logs').insertOne(eventDoc);
    return eventDoc;
  } catch (err) {
    // Audit logging failure must never leak secrets or crash primary operations
    console.error('⚠️ [AuditEngine] Failed to persist audit event:', err.message);
    return null;
  }
}
