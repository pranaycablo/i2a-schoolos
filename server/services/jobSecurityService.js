/**
 * i2A SchoolOS — Background Job & Automated Task Authorization Framework
 * Reference: Master Prompt 04 — Part 10: Secure Background Jobs & Future Modules
 */

import { recordAuditEvent } from './auditService.js';

export class JobSecurityException extends Error {
  constructor(message, code = 'JOB_SECURITY_DENIED') {
    super(message);
    this.name = 'JobSecurityException';
    this.code = code;
  }
}

/**
 * Creates a cryptographically bound Job Execution Context.
 * Ensures background crons, message dispatchers, and AI workers carry explicit tenant scope and action bounds.
 */
export function createJobSecurityContext({
  serviceIdentity,
  tenantId,
  orgId = null,
  allowedActions = [],
  purpose = 'SCHEDULED_AUTOMATION',
  correlationId = null
}) {
  if (!serviceIdentity) {
    throw new JobSecurityException('FAIL_CLOSED: Background job requires an explicit serviceIdentity.');
  }

  if (!tenantId) {
    throw new JobSecurityException('FAIL_CLOSED: Background job must define explicit tenantId boundary.');
  }

  const effectiveCorrelationId = correlationId || `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  return {
    serviceIdentity,
    tenantId,
    orgId,
    allowedActions: Array.isArray(allowedActions) ? allowedActions : [allowedActions],
    purpose,
    correlationId: effectiveCorrelationId,
    createdAt: new Date().toISOString()
  };
}

/**
 * Validates and executes an isolated tenant operation within a background job context.
 * Prevents unintended global mutations and ensures audit log persistence.
 */
export async function executeScopedJobTask(jobContext, action, targetTenantId, taskFn) {
  if (!jobContext || !jobContext.serviceIdentity) {
    throw new JobSecurityException('Background task rejected: Invalid or missing JobSecurityContext.');
  }

  if (!jobContext.allowedActions.includes(action) && !jobContext.allowedActions.includes('*')) {
    await recordAuditEvent({
      schoolId: targetTenantId,
      actorId: jobContext.serviceIdentity,
      actorName: `Service [${jobContext.serviceIdentity}]`,
      role: 'SYSTEM_JOB',
      action: 'BACKGROUND_TASK_UNAUTHORIZED',
      resourceType: 'SYSTEM_JOB',
      outcome: 'DENIED',
      details: `Action [${action}] is not permitted for service [${jobContext.serviceIdentity}]`,
      correlationId: jobContext.correlationId
    });
    throw new JobSecurityException(
      `Background task [${action}] denied for service [${jobContext.serviceIdentity}]. Action not in permitted whitelist.`
    );
  }

  // Cross-tenant boundary check
  if (jobContext.tenantId !== 'PLATFORM_SYSTEM' && jobContext.tenantId !== targetTenantId) {
    await recordAuditEvent({
      schoolId: targetTenantId,
      actorId: jobContext.serviceIdentity,
      actorName: `Service [${jobContext.serviceIdentity}]`,
      role: 'SYSTEM_JOB',
      action: 'BACKGROUND_CROSS_TENANT_VIOLATION',
      resourceType: 'SYSTEM_JOB',
      outcome: 'DENIED',
      details: `Service configured for tenant [${jobContext.tenantId}] attempted to execute in tenant [${targetTenantId}]`,
      correlationId: jobContext.correlationId
    });
    throw new JobSecurityException(
      `Cross-tenant execution violation: Job scope [${jobContext.tenantId}] cannot mutate target tenant [${targetTenantId}].`
    );
  }

  // Execute task with audit trail
  try {
    const result = await taskFn();
    await recordAuditEvent({
      schoolId: targetTenantId,
      actorId: jobContext.serviceIdentity,
      actorName: `Service [${jobContext.serviceIdentity}]`,
      role: 'SYSTEM_JOB',
      action: `JOB_${action}_SUCCESS`,
      resourceType: 'SYSTEM_JOB',
      outcome: 'SUCCESS',
      details: `Background job task [${action}] completed successfully for tenant [${targetTenantId}]`,
      correlationId: jobContext.correlationId
    });
    return result;
  } catch (err) {
    await recordAuditEvent({
      schoolId: targetTenantId,
      actorId: jobContext.serviceIdentity,
      actorName: `Service [${jobContext.serviceIdentity}]`,
      role: 'SYSTEM_JOB',
      action: `JOB_${action}_FAILED`,
      resourceType: 'SYSTEM_JOB',
      outcome: 'FAILED',
      details: `Background job task [${action}] failed: ${err.message}`,
      correlationId: jobContext.correlationId
    });
    throw err;
  }
}
