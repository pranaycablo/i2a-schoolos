import { describe, it, expect } from 'vitest';
import { PaymentGatewayService } from '../services/payment/PaymentGatewayService';
import { TenantSecurityException, type UserSession } from '../services/TenantSecurityService';

describe('FOV-07A: School-wise Independent Payment Gateway & Isolation', () => {
  const service = PaymentGatewayService.getInstance();

  const schoolAId = 'I2A-SCH-000001';
  const schoolBId = 'I2A-SCH-000002';
  const schoolCId = 'I2A-SCH-000003';

  const adminSessionA: UserSession = {
    id: 'admin-sch-1',
    email: 'principal@school1.edu',
    tenantId: schoolAId,
    role: 'PRINCIPAL',
    status: 'ACTIVE'
  };

  const adminSessionB: UserSession = {
    id: 'admin-sch-2',
    email: 'principal@school2.edu',
    tenantId: schoolBId,
    role: 'ADMIN',
    status: 'ACTIVE'
  };

  const parentSessionA: UserSession = {
    id: 'parent-001',
    email: 'parent@home.com',
    tenantId: schoolAId,
    role: 'PARENT',
    status: 'ACTIVE'
  };

  // Test 1: Three different schools have independent gateway providers
  it('1. Verifies independent gateway providers across 3 different schools', () => {
    const configA = service.getGatewayConfig(schoolAId, adminSessionA);
    const configB = service.getGatewayConfig(schoolBId, adminSessionB);

    // School A is configured with Razorpay
    expect(configA.provider).toBe('RAZORPAY');
    expect(configA.schoolId).toBe(schoolAId);
    expect(configA.merchantId).toBe('rzp_test_MID_000001');

    // School B is configured with PhonePe
    expect(configB.provider).toBe('PHONEPE');
    expect(configB.schoolId).toBe(schoolBId);
    expect(configB.merchantId).toBe('PHONEPE_UAT_SCH002');

    // Verification of School C (Paytm)
    const superAdminSession: UserSession = {
      id: 'super-admin-01',
      email: 'ops@i2aschoolos.com',
      tenantId: 'I2A-PLATFORM',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE'
    };
    const configC = service.getGatewayConfig(schoolCId, superAdminSession);
    expect(configC.provider).toBe('PAYTM');
    expect(configC.schoolId).toBe(schoolCId);
  });

  // Test 2: Cross-tenant configuration access rejection
  it('2. Prevents Admin of School A from accessing or mutating School B payment configuration', () => {
    // Admin A trying to read School B config
    expect(() => {
      service.getGatewayConfig(schoolBId, adminSessionA);
    }).toThrowError(TenantSecurityException);

    // Admin A trying to update School B config
    expect(() => {
      service.updateGatewayConfig(schoolBId, { provider: 'PAYTM' }, adminSessionA);
    }).toThrowError(TenantSecurityException);
  });

  // Test 3: Client Zero-Secrets Policy Enforcement
  it('3. Strictly rejects any configuration payload containing secret keys or salt keys', () => {
    // Attempting to send razorpay secret key
    expect(() => {
      service.updateGatewayConfig(
        schoolAId,
        {
          secretKey: 'rzp_live_supersecret_forbidden_in_browser'
        } as unknown as Record<string, unknown>,
        adminSessionA
      );
    }).toThrowError(/SECURITY_VIOLATION.*Secret credentials must never be passed to client/i);

    // Attempting to send phonepe salt key
    expect(() => {
      service.updateGatewayConfig(
        schoolAId,
        {
          saltKey: 'super_secret_phonepe_salt_forbidden'
        } as unknown as Record<string, unknown>,
        adminSessionA
      );
    }).toThrowError(/SECURITY_VIOLATION.*saltKey.*detected/i);
  });

  // Test 4: Switching to LIVE mode requires explicit confirmation
  it('4. Rejects switching to LIVE mode without explicit confirmation acknowledgment', () => {
    expect(() => {
      service.updateGatewayConfig(
        schoolAId,
        {
          environment: 'LIVE',
          isLiveConfirmed: false // Not confirmed!
        },
        adminSessionA
      );
    }).toThrowError(/LIVE_CONFIRMATION_REQUIRED/i);

    // Switching with confirmation succeeds
    const confirmed = service.updateGatewayConfig(
      schoolAId,
      {
        environment: 'LIVE',
        isLiveConfirmed: true
      },
      adminSessionA
    );
    expect(confirmed.environment).toBe('LIVE');
    expect(confirmed.isLiveConfirmed).toBe(true);

    // Revert back to TEST mode for clean test environment
    service.updateGatewayConfig(schoolAId, { environment: 'TEST' }, adminSessionA);
  });

  // Test 5: Role-based restriction: Parents and Students cannot alter payment gateway settings
  it('5. Denies non-administrative roles from viewing/modifying gateway configuration', () => {
    expect(() => {
      service.updateGatewayConfig(schoolAId, { provider: 'PAYTM' }, parentSessionA);
    }).toThrowError(TenantSecurityException);
  });

  // Test 6: Provider Adapter Pattern & Live Mode Safety Check
  it('6. Blocks live payment generation with BLOCKED_NO_BACKEND when in Live mode', async () => {
    // Put into Live mode
    service.updateGatewayConfig(schoolAId, { environment: 'LIVE', isLiveConfirmed: true }, adminSessionA);

    const initReq = {
      orderId: 'ord-101',
      orderNo: 'ORD-2026-9999',
      schoolId: schoolAId,
      amountInPaise: 150000,
      currency: 'INR' as const,
      customerName: 'Rohit Verma',
      provider: 'RAZORPAY' as const
    };

    const res = await service.initiateOrderPayment(schoolAId, initReq, adminSessionA);
    expect(res.status).toBe('BLOCKED_NO_BACKEND');
    expect(res.success).toBe(false);

    // Reset back to TEST mode
    service.updateGatewayConfig(schoolAId, { environment: 'TEST' }, adminSessionA);
  });

  // Test 7: Direct School Settlement Reconciliation
  it('7. Verifies Direct School Merchant Settlement with 0% platform fee in ledger', () => {
    const recs = service.getReconciliationRecords(schoolAId, adminSessionA);
    expect(recs.length).toBeGreaterThan(0);

    recs.forEach((rec) => {
      expect(rec.schoolId).toBe(schoolAId);
      expect(rec.platformFeeInPaise).toBe(0); // Direct merchant: ₹0 platform cut
      expect(rec.netSettledToSchoolInPaise).toBe(rec.amountInPaise); // 100% to school bank
    });
  });
});
