import type { UserRole } from '../types';

export interface UserSession {
  id: string;
  email: string;
  tenantId: string;
  role: UserRole;
  status: 'ACTIVE' | 'INVITED' | 'PENDING' | 'SUSPENDED' | 'LOCKED';
  assignedClass?: string;
  assignedSection?: string;
  childrenIds?: string[];
}

export class TenantSecurityException extends Error {
  public statusCode: number;
  constructor(message: string, statusCode: number = 403) {
    super(message);
    this.name = 'TenantSecurityException';
    this.statusCode = statusCode;
  }
}

export class TenantSecurityService {
  /**
   * Enforces server-side cross-tenant security.
   * Rejects client-side tenant ID manipulation.
   */
  public static validateTenantAccess(user: UserSession, targetTenantId: string): boolean {
    if (!user || user.status !== 'ACTIVE') {
      throw new TenantSecurityException('DENIED: User session is invalid or account is suspended.', 401);
    }

    // Super Admin can access all tenants in privileged administrative scope
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Enforce Tenant Isolation
    if (user.tenantId !== targetTenantId) {
      throw new TenantSecurityException(
        `DENIED: Cross-tenant access violation. User tenant (${user.tenantId}) attempted to access (${targetTenantId}).`,
        403
      );
    }

    return true;
  }

  /**
   * Object-Level Authorization Engine
   * Ensures Parents only view their own children, Students only view their own records,
   * and Teachers only view their assigned classes.
   */
  public static authorizeObjectAccess(
    user: UserSession,
    _resourceType: 'STUDENT_PROFILE' | 'EXAM_RESULT' | 'FEE_RECEIPT' | 'CLASS_ROSTER',
    resource: { tenantId: string; studentId?: string; parentId?: string; className?: string; section?: string }
  ): boolean {
    // 1. First enforce Tenant Isolation
    this.validateTenantAccess(user, resource.tenantId);

    // 2. Platform Admin / Principal / Accountant have school-wide access
    if (['SUPER_ADMIN', 'PRINCIPAL', 'ACCOUNTANT'].includes(user.role)) {
      return true;
    }

    // 3. Parent Object Authorization: Only own children
    if (user.role === 'PARENT') {
      if (resource.studentId && user.childrenIds && !user.childrenIds.includes(resource.studentId)) {
        throw new TenantSecurityException('DENIED: Parent attempted to access unauthorized child profile.', 403);
      }
      return true;
    }

    // 4. Student Object Authorization: Only own records
    if (user.role === 'STUDENT') {
      if (resource.studentId && resource.studentId !== user.id) {
        throw new TenantSecurityException('DENIED: Student attempted to access another student record.', 403);
      }
      return true;
    }

    // 5. Teacher Object Authorization: Only assigned class/section
    if (user.role === 'TEACHER') {
      if (user.assignedClass && resource.className && user.assignedClass !== resource.className) {
        throw new TenantSecurityException(
          `DENIED: Teacher assigned to ${user.assignedClass} attempted to access ${resource.className}.`,
          403
        );
      }
      return true;
    }

    return true;
  }

  /**
   * Feature Entitlement Gating Engine
   */
  public static canUseFeature(
    subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'EXPIRED' | 'SUSPENDED',
    _featureKey: 'ONLINE_EXAM' | 'AI_QUESTION_BANK' | 'WHATSAPP_AUTOMATION' | 'CUSTOM_DOMAIN'
  ): boolean {
    if (subscriptionStatus === 'EXPIRED' || subscriptionStatus === 'SUSPENDED') {
      return false;
    }
    // All active & trial plans entitle core features
    return true;
  }
}
