/**
 * i2A SchoolOS — Standardized API Response and Error Contract Helper
 * 
 * Implements predictable API responses and error codes as mandated by
 * Master Prompt 02 Section 7 and Section 8.
 */

export const ERROR_CODES = {
  BAD_REQUEST: 'BAD_REQUEST',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  AUTH_TOKEN_MISSING: 'AUTH_TOKEN_MISSING',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  CROSS_TENANT_VIOLATION: 'CROSS_TENANT_VIOLATION',
  ATTENDANCE_LOCKED: 'ATTENDANCE_LOCKED',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  CONFLICT: 'CONFLICT',
  SIGNATURE_VERIFICATION_FAILED: 'SIGNATURE_VERIFICATION_FAILED',
  DATABASE_UNAVAILABLE: 'DATABASE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};

/**
 * Send standardized success response
 */
export function sendSuccess(res, data = {}, status = 200, message = undefined) {
  const payload = {
    success: true,
    ...(message ? { message } : {}),
    ...(typeof data === 'object' && !Array.isArray(data) ? data : { data })
  };
  return res.status(status).json(payload);
}

/**
 * Send standardized error response conforming to Master Prompt 02 contract
 * 
 * Preserves existing string expectations:
 * {
 *   success: false,
 *   error: "Human readable safe message",
 *   code: "MACHINE_READABLE_CODE",
 *   details: [...], // optional
 *   requestId: "req-xxx" // optional
 * }
 */
export function sendError(res, {
  status = 500,
  code = ERROR_CODES.INTERNAL_ERROR,
  message = 'An unexpected internal error occurred.',
  details = null,
  req = null
}) {
  const payload = {
    success: false,
    error: message,
    code,
    ...(details ? { details } : {}),
    ...(req?.requestId ? { requestId: req.requestId } : {})
  };
  return res.status(status).json(payload);
}
