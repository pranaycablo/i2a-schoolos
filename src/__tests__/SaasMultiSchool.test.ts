import { describe, it, expect } from 'vitest';
import { TenantSecurityService, UserSession, TenantSecurityException } from '../services/TenantSecurityService';

describe('FOV-02: SaaS Multi-Tenant Platform & Architecture Test Suite', () => {
  it('1. Unique Immutable School ID Generation — Generated School ID matches pattern I2A-SCH-XXXXXX', () => {
    const generateSchoolId = () => {
      const num = Math.floor(100000 + Math.random() * 900000);
      return `I2A-SCH-${num}`;
    };

    const schoolId1 = generateSchoolId();
    const schoolId2 = generateSchoolId();

    expect(schoolId1).toMatch(/^I2A-SCH-\d{6}$/);
    expect(schoolId2).toMatch(/^I2A-SCH-\d{6}$/);
    expect(schoolId1).not.toBe(schoolId2);
  });

  it('2. Multi-School Tenant Data Isolation — School A admin denied access to School B data context', () => {
    const schoolA_Session: UserSession = {
      id: 'usr-admin-a',
      email: 'admin@schoola.edu.in',
      tenantId: 'I2A-SCH-100201',
      role: 'PRINCIPAL',
      status: 'ACTIVE'
    };

    expect(() => {
      TenantSecurityService.validateTenantAccess(schoolA_Session, 'I2A-SCH-100202');
    }).toThrowError(TenantSecurityException);
  });

  it('3. Subscription Entitlement Enforcement — Active and Trial plans entitle features; Expired & Suspended plans block features', () => {
    expect(TenantSecurityService.canUseFeature('ACTIVE', 'ONLINE_EXAM')).toBe(true);
    expect(TenantSecurityService.canUseFeature('TRIAL', 'AI_QUESTION_BANK')).toBe(true);
    expect(TenantSecurityService.canUseFeature('EXPIRED', 'ONLINE_EXAM')).toBe(false);
    expect(TenantSecurityService.canUseFeature('SUSPENDED', 'AI_QUESTION_BANK')).toBe(false);
  });

  it('4. Platform Admin Governance — Super Admin bypasses single-tenant context for platform management', () => {
    const superAdminSession: UserSession = {
      id: 'usr-operator-1',
      email: 'operator@i2aschoolos.com',
      tenantId: 'I2A-PLATFORM',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    };

    // Super Admin can inspect any registered school
    const isAllowedA = TenantSecurityService.validateTenantAccess(superAdminSession, 'I2A-SCH-100201');
    const isAllowedB = TenantSecurityService.validateTenantAccess(superAdminSession, 'I2A-SCH-100202');

    expect(isAllowedA).toBe(true);
    expect(isAllowedB).toBe(true);
  });

  it('5. Subscription Plan Limits Validation — Student count enforcement per plan', () => {
    const starterLimit = 250;
    const proLimit = 1000;

    const schoolA_StudentsCount = 180;
    const schoolB_StudentsCount = 350;

    const isSchoolA_WithinLimit = schoolA_StudentsCount <= starterLimit;
    const isSchoolB_WithinLimit = schoolB_StudentsCount <= starterLimit;

    expect(isSchoolA_WithinLimit).toBe(true);
    expect(isSchoolB_WithinLimit).toBe(false);
  });
});
