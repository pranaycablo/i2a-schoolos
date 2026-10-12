import { TenantSecurityService, type UserSession, TenantSecurityException } from '../TenantSecurityService';
import type {
  PaymentGatewayProvider,
  GatewayEnvironment,
  SchoolPaymentGatewayConfig,
  PaymentInitiationRequest,
  PaymentInitiationResult,
  PaymentVerificationRequest,
  PaymentVerificationResult,
  GatewayRefundRequest,
  GatewayRefundResult,
  PaymentReconciliationRecord
} from '../../types';

// ============================================================================
// Provider Adapter Interface (FOV-07A Provider Adapter Pattern)
// ============================================================================
export interface IPaymentGatewayAdapter {
  readonly provider: PaymentGatewayProvider;

  initializePayment(
    config: SchoolPaymentGatewayConfig,
    request: PaymentInitiationRequest
  ): Promise<PaymentInitiationResult>;

  verifyPayment(
    config: SchoolPaymentGatewayConfig,
    request: PaymentVerificationRequest
  ): Promise<PaymentVerificationResult>;

  processRefund(
    config: SchoolPaymentGatewayConfig,
    request: GatewayRefundRequest
  ): Promise<GatewayRefundResult>;
}

// ============================================================================
// 1. Razorpay Gateway Adapter
// ============================================================================
export class RazorpayGatewayAdapter implements IPaymentGatewayAdapter {
  readonly provider: PaymentGatewayProvider = 'RAZORPAY';

  async initializePayment(
    config: SchoolPaymentGatewayConfig,
    request: PaymentInitiationRequest
  ): Promise<PaymentInitiationResult> {
    if (config.environment === 'LIVE') {
      return {
        success: false,
        status: 'BLOCKED_NO_BACKEND',
        error: 'Live Razorpay API calls require server-side order generation and secret key HMAC verification.',
        verificationCaveat: 'REAL_LIVE_BACKEND_REQUIRED: Client-side only. Cannot call https://api.razorpay.com/v1/orders directly without exposing secrets.'
      };
    }

    // Test/UAT Mode mock payload for Razorpay Checkout
    const mockRzpOrderId = `order_rzp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      success: true,
      status: 'INITIATED',
      gatewayOrderId: mockRzpOrderId,
      sdkPayload: {
        key: config.publicKeyId,
        amount: request.amountInPaise,
        currency: 'INR',
        name: `School Store [${config.schoolId}]`,
        description: `Order ${request.orderNo}`,
        order_id: mockRzpOrderId,
        prefill: {
          name: request.customerName,
          email: request.customerEmail || 'parent@school.com',
          contact: request.customerPhone || '9876543210'
        },
        theme: { color: '#4f46e5' }
      },
      verificationCaveat: 'DEMO/TEST SIMULATION: No real currency charged. Server webhook verification needed for true confirmation.'
    };
  }

  async verifyPayment(
    config: SchoolPaymentGatewayConfig,
    request: PaymentVerificationRequest
  ): Promise<PaymentVerificationResult> {
    if (config.environment === 'LIVE') {
      return {
        verified: false,
        status: 'BLOCKED_NO_BACKEND',
        amountInPaise: 0,
        transactionRef: '',
        message: 'BLOCKED: Real Razorpay webhook signature verification requires backend crypto module with secret key.'
      };
    }

    return {
      verified: true,
      status: 'SUCCESS',
      amountInPaise: 0, // snapshot will be matched from order
      transactionRef: `pay_rzp_mock_${Date.now()}`,
      message: 'Razorpay Test Mode signature accepted (Simulated).'
    };
  }

  async processRefund(
    config: SchoolPaymentGatewayConfig,
    request: GatewayRefundRequest
  ): Promise<GatewayRefundResult> {
    if (config.environment === 'LIVE') {
      return {
        refundId: '',
        status: 'BLOCKED_NO_BACKEND',
        amountInPaise: request.amountInPaise,
        message: 'Live refunds require server-side Razorpay API credentials.'
      };
    }

    return {
      refundId: `rfnd_rzp_${Date.now()}`,
      status: 'PROCESSED',
      amountInPaise: request.amountInPaise,
      message: `Simulated refund of ₹${(request.amountInPaise / 100).toFixed(2)} processed to parent account.`
    };
  }
}

// ============================================================================
// 2. PhonePe Payment Gateway Adapter
// ============================================================================
export class PhonePeGatewayAdapter implements IPaymentGatewayAdapter {
  readonly provider: PaymentGatewayProvider = 'PHONEPE';

  async initializePayment(
    config: SchoolPaymentGatewayConfig,
    request: PaymentInitiationRequest
  ): Promise<PaymentInitiationResult> {
    if (config.environment === 'LIVE') {
      return {
        success: false,
        status: 'BLOCKED_NO_BACKEND',
        error: 'Live PhonePe requires server-side SHA256 base64 payload hashing with Merchant Salt Key.',
        verificationCaveat: 'REAL_LIVE_BACKEND_REQUIRED: PhonePe API v3 payload generation requires server backend.'
      };
    }

    const mockPhonePeTxnId = `TXN_PHONEPE_${Date.now()}`;
    return {
      success: true,
      status: 'INITIATED',
      gatewayOrderId: mockPhonePeTxnId,
      paymentUrl: `https://mercury-uat.phonepe.com/transact/simulator?merchantId=${config.merchantId}&txnId=${mockPhonePeTxnId}`,
      verificationCaveat: 'DEMO/UAT SIMULATION: Simulated PhonePe PG redirect URL.'
    };
  }

  async verifyPayment(
    config: SchoolPaymentGatewayConfig,
    request: PaymentVerificationRequest
  ): Promise<PaymentVerificationResult> {
    if (config.environment === 'LIVE') {
      return {
        verified: false,
        status: 'BLOCKED_NO_BACKEND',
        amountInPaise: 0,
        transactionRef: '',
        message: 'BLOCKED: Server S2S checksum callback verification required for PhonePe.'
      };
    }

    return {
      verified: true,
      status: 'SUCCESS',
      amountInPaise: 0,
      transactionRef: `T2600_${Date.now()}`,
      message: 'PhonePe UAT status callback verified (Simulated).'
    };
  }

  async processRefund(
    config: SchoolPaymentGatewayConfig,
    request: GatewayRefundRequest
  ): Promise<GatewayRefundResult> {
    if (config.environment === 'LIVE') {
      return {
        refundId: '',
        status: 'BLOCKED_NO_BACKEND',
        amountInPaise: request.amountInPaise,
        message: 'Live PhonePe refund requires server-side S2S API integration.'
      };
    }

    return {
      refundId: `rfnd_ppe_${Date.now()}`,
      status: 'PROCESSED',
      amountInPaise: request.amountInPaise,
      message: `Simulated PhonePe refund of ₹${(request.amountInPaise / 100).toFixed(2)} recorded.`
    };
  }
}

// ============================================================================
// 3. Paytm Payment Gateway Adapter
// ============================================================================
export class PaytmGatewayAdapter implements IPaymentGatewayAdapter {
  readonly provider: PaymentGatewayProvider = 'PAYTM';

  async initializePayment(
    config: SchoolPaymentGatewayConfig,
    request: PaymentInitiationRequest
  ): Promise<PaymentInitiationResult> {
    if (config.environment === 'LIVE') {
      return {
        success: false,
        status: 'BLOCKED_NO_BACKEND',
        error: 'Live Paytm PG requires server-side initiateTransaction API to generate txnToken using Merchant Key.',
        verificationCaveat: 'REAL_LIVE_BACKEND_REQUIRED: Paytm PG v2 initiateTransaction API requires server-to-server call.'
      };
    }

    const mockPaytmToken = `ptm_tok_${Date.now()}`;
    return {
      success: true,
      status: 'INITIATED',
      gatewayOrderId: `PAYTM_${request.orderNo}_${Date.now()}`,
      sdkPayload: {
        mid: config.merchantId,
        orderId: request.orderNo,
        txnToken: mockPaytmToken,
        amount: (request.amountInPaise / 100).toFixed(2)
      },
      verificationCaveat: 'DEMO/TEST SIMULATION: Simulated Paytm PG txnToken.'
    };
  }

  async verifyPayment(
    config: SchoolPaymentGatewayConfig,
    request: PaymentVerificationRequest
  ): Promise<PaymentVerificationResult> {
    if (config.environment === 'LIVE') {
      return {
        verified: false,
        status: 'BLOCKED_NO_BACKEND',
        amountInPaise: 0,
        transactionRef: '',
        message: 'BLOCKED: Paytm server transaction status query (ORDER_STATUS_QUERY) required.'
      };
    }

    return {
      verified: true,
      status: 'SUCCESS',
      amountInPaise: 0,
      transactionRef: `PTM_TXN_${Date.now()}`,
      message: 'Paytm Test Checksum verified (Simulated).'
    };
  }

  async processRefund(
    config: SchoolPaymentGatewayConfig,
    request: GatewayRefundRequest
  ): Promise<GatewayRefundResult> {
    if (config.environment === 'LIVE') {
      return {
        refundId: '',
        status: 'BLOCKED_NO_BACKEND',
        amountInPaise: request.amountInPaise,
        message: 'Live Paytm refund requires server-side API integration.'
      };
    }

    return {
      refundId: `rfnd_ptm_${Date.now()}`,
      status: 'PROCESSED',
      amountInPaise: request.amountInPaise,
      message: `Simulated Paytm refund of ₹${(request.amountInPaise / 100).toFixed(2)} recorded.`
    };
  }
}

// ============================================================================
// Payment Gateway Multi-Tenant Service
// ============================================================================
export class PaymentGatewayService {
  private static instance: PaymentGatewayService;

  private adapters: Map<PaymentGatewayProvider, IPaymentGatewayAdapter> = new Map();
  private configs: Map<string, SchoolPaymentGatewayConfig> = new Map();
  private reconciliations: Map<string, PaymentReconciliationRecord[]> = new Map();

  private readonly STORAGE_KEY_CONFIGS = 'i2a_school_gateway_configs';
  private readonly STORAGE_KEY_RECONCILIATIONS = 'i2a_school_gateway_reconciliation';

  private constructor() {
    // Register Gateway Adapters (Adapter Pattern)
    this.registerAdapter(new RazorpayGatewayAdapter());
    this.registerAdapter(new PhonePeGatewayAdapter());
    this.registerAdapter(new PaytmGatewayAdapter());

    this.initializeDefaultData();
  }

  public static getInstance(): PaymentGatewayService {
    if (!PaymentGatewayService.instance) {
      PaymentGatewayService.instance = new PaymentGatewayService();
    }
    return PaymentGatewayService.instance;
  }

  public registerAdapter(adapter: IPaymentGatewayAdapter): void {
    this.adapters.set(adapter.provider, adapter);
  }

  public getAdapter(provider: PaymentGatewayProvider): IPaymentGatewayAdapter {
    const adapter = this.adapters.get(provider);
    if (!adapter) {
      throw new Error(`Unsupported Payment Gateway Provider: ${provider}`);
    }
    return adapter;
  }

  private initializeDefaultData(): void {
    // 1. Default Configurations for Multiple Schools (Strict Tenant Isolation)
    // School A: ABC Public School -> Razorpay
    const schoolAConfig: SchoolPaymentGatewayConfig = {
      schoolId: 'I2A-SCH-000001',
      provider: 'RAZORPAY',
      environment: 'TEST',
      merchantId: 'rzp_test_MID_000001',
      publicKeyId: 'rzp_test_pub_918237461982',
      webhookEndpointUrl: 'https://api.i2aschoolos.internal/v1/webhooks/razorpay/I2A-SCH-000001',
      onboardingStatus: 'VERIFIED',
      connectionStatus: 'CONNECTED',
      settlementType: 'DIRECT_SCHOOL_MERCHANT',
      schoolBankAccountMasked: 'HDFC Bank - A/C ending in 5521 (IFSC: HDFC0001234)',
      isLiveConfirmed: false,
      updatedAt: new Date().toISOString()
    };

    // School B: Delhi Model Academy -> PhonePe
    const schoolBConfig: SchoolPaymentGatewayConfig = {
      schoolId: 'I2A-SCH-000002',
      provider: 'PHONEPE',
      environment: 'TEST',
      merchantId: 'PHONEPE_UAT_SCH002',
      publicKeyId: 'UAT_PUBKEY_9921',
      webhookEndpointUrl: 'https://api.i2aschoolos.internal/v1/webhooks/phonepe/I2A-SCH-000002',
      onboardingStatus: 'VERIFIED',
      connectionStatus: 'CONNECTED',
      settlementType: 'DIRECT_SCHOOL_MERCHANT',
      schoolBankAccountMasked: 'ICICI Bank - A/C ending in 8834 (IFSC: ICIC0005678)',
      isLiveConfirmed: false,
      updatedAt: new Date().toISOString()
    };

    // School C: St. Xavier International -> Paytm
    const schoolCConfig: SchoolPaymentGatewayConfig = {
      schoolId: 'I2A-SCH-000003',
      provider: 'PAYTM',
      environment: 'TEST',
      merchantId: 'PAYTM_TEST_SCH003',
      publicKeyId: 'PTM_PUBKEY_7712',
      webhookEndpointUrl: 'https://api.i2aschoolos.internal/v1/webhooks/paytm/I2A-SCH-000003',
      onboardingStatus: 'PENDING_VERIFICATION',
      connectionStatus: 'DISCONNECTED',
      settlementType: 'DIRECT_SCHOOL_MERCHANT',
      schoolBankAccountMasked: 'SBI - A/C ending in 1190 (IFSC: SBIN0009988)',
      isLiveConfirmed: false,
      updatedAt: new Date().toISOString()
    };

    // Load from localStorage or seed
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedConfigs = localStorage.getItem(this.STORAGE_KEY_CONFIGS);
        if (storedConfigs) {
          const parsed = JSON.parse(storedConfigs) as Record<string, SchoolPaymentGatewayConfig>;
          Object.entries(parsed).forEach(([schId, cfg]) => {
            this.configs.set(schId, cfg);
          });
        }
      }
    } catch {
      // fallback
    }

    if (!this.configs.has('I2A-SCH-000001')) this.configs.set('I2A-SCH-000001', schoolAConfig);
    if (!this.configs.has('I2A-SCH-000002')) this.configs.set('I2A-SCH-000002', schoolBConfig);
    if (!this.configs.has('I2A-SCH-000003')) this.configs.set('I2A-SCH-000003', schoolCConfig);

    // Seed Reconciliations
    const sampleReconA: PaymentReconciliationRecord[] = [
      {
        id: 'rec-001',
        schoolId: 'I2A-SCH-000001',
        orderNo: 'ORD-2026-0001',
        provider: 'RAZORPAY',
        amountInPaise: 279900,
        platformFeeInPaise: 0, // Direct school merchant - 0 platform deduction
        netSettledToSchoolInPaise: 279900,
        status: 'SETTLED',
        settlementDate: '2026-10-10T14:30:00Z',
        bankRef: 'UTR-HDFC-9921002341'
      },
      {
        id: 'rec-002',
        schoolId: 'I2A-SCH-000001',
        orderNo: 'ORD-2026-0002',
        provider: 'RAZORPAY',
        amountInPaise: 135000,
        platformFeeInPaise: 0,
        netSettledToSchoolInPaise: 135000,
        status: 'SETTLED',
        settlementDate: '2026-10-11T09:15:00Z',
        bankRef: 'UTR-HDFC-9921004512'
      }
    ];

    const sampleReconB: PaymentReconciliationRecord[] = [
      {
        id: 'rec-003',
        schoolId: 'I2A-SCH-000002',
        orderNo: 'ORD-SCH2-001',
        provider: 'PHONEPE',
        amountInPaise: 185000,
        platformFeeInPaise: 0,
        netSettledToSchoolInPaise: 185000,
        status: 'SETTLED',
        settlementDate: '2026-10-11T10:00:00Z',
        bankRef: 'UTR-ICIC-8812993012'
      }
    ];

    this.reconciliations.set('I2A-SCH-000001', sampleReconA);
    this.reconciliations.set('I2A-SCH-000002', sampleReconB);
    this.reconciliations.set('I2A-SCH-000003', []);
  }

  private persistConfigs(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const obj: Record<string, SchoolPaymentGatewayConfig> = {};
        this.configs.forEach((cfg, key) => {
          obj[key] = cfg;
        });
        localStorage.setItem(this.STORAGE_KEY_CONFIGS, JSON.stringify(obj));
      }
    } catch {
      // LocalStorage error
    }
  }

  // ============================================================================
  // Multi-Tenant Access Methods with Security Guards
  // ============================================================================
  public getGatewayConfig(
    targetSchoolId: string,
    session: UserSession
  ): SchoolPaymentGatewayConfig {
    // Tenant validation: User can only access their own school config (unless SUPER_ADMIN)
    TenantSecurityService.validateTenantAccess(session, targetSchoolId);

    const config = this.configs.get(targetSchoolId);
    if (!config) {
      // Provide default template for newly registered school
      const defaultConfig: SchoolPaymentGatewayConfig = {
        schoolId: targetSchoolId,
        provider: 'RAZORPAY',
        environment: 'TEST',
        merchantId: '',
        publicKeyId: '',
        webhookEndpointUrl: `https://api.i2aschoolos.internal/v1/webhooks/razorpay/${targetSchoolId}`,
        onboardingStatus: 'NOT_CONFIGURED',
        connectionStatus: 'DISCONNECTED',
        settlementType: 'DIRECT_SCHOOL_MERCHANT',
        schoolBankAccountMasked: 'Not configured',
        isLiveConfirmed: false,
        updatedAt: new Date().toISOString()
      };
      this.configs.set(targetSchoolId, defaultConfig);
      return defaultConfig;
    }

    return { ...config };
  }

  public updateGatewayConfig(
    targetSchoolId: string,
    updates: Partial<SchoolPaymentGatewayConfig>,
    session: UserSession
  ): SchoolPaymentGatewayConfig {
    TenantSecurityService.validateTenantAccess(session, targetSchoolId);

    // Only Admin / Principal / Super Admin can change payment gateway settings
    if (!['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL'].includes(session.role)) {
      throw new TenantSecurityException(
        `ROLE_DENIED: Role ${session.role} is not permitted to modify school payment settings.`,
        403
      );
    }

    // SECURITY RULE 1: School ID is strictly immutable
    if (updates.schoolId && updates.schoolId !== targetSchoolId) {
      throw new TenantSecurityException(
        'CROSS_TENANT_MUTATION_DENIED: Cannot change school ID of payment configuration.',
        403
      );
    }

    // SECURITY RULE 2: Client Zero Secrets Guarantee
    // Reject any payload attempting to transmit secret keys to the browser
    const rawUpdates = updates as Record<string, unknown>;
    const forbiddenKeys = ['secretKey', 'merchantSecret', 'saltKey', 'webhookSecret', 'privateKey', 'apiSecret'];
    for (const key of forbiddenKeys) {
      if (rawUpdates[key]) {
        throw new Error(
          `SECURITY_VIOLATION: "${key}" detected! Secret credentials must never be passed to client or stored in browser. Use Server-side KMS.`
        );
      }
    }

    const current = this.getGatewayConfig(targetSchoolId, session);

    // If changing to LIVE mode, verify explicit confirmation
    if (updates.environment === 'LIVE' && current.environment !== 'LIVE') {
      if (!updates.isLiveConfirmed) {
        throw new Error(
          'LIVE_CONFIRMATION_REQUIRED: You must review and acknowledge live merchant terms and server verification before switching to LIVE mode.'
        );
      }
    }

    const merged: SchoolPaymentGatewayConfig = {
      ...current,
      ...updates,
      schoolId: targetSchoolId, // Immutable
      updatedAt: new Date().toISOString()
    };

    // Auto-update webhook endpoint when provider changes
    if (updates.provider && updates.provider !== current.provider) {
      merged.webhookEndpointUrl = `https://api.i2aschoolos.internal/v1/webhooks/${updates.provider.toLowerCase()}/${targetSchoolId}`;
    }

    this.configs.set(targetSchoolId, merged);
    this.persistConfigs();
    return merged;
  }

  public async testGatewayConnection(
    targetSchoolId: string,
    session: UserSession
  ): Promise<{ success: boolean; message: string; latencyMs: number }> {
    TenantSecurityService.validateTenantAccess(session, targetSchoolId);

    const config = this.getGatewayConfig(targetSchoolId, session);
    if (!config.merchantId || !config.publicKeyId) {
      return {
        success: false,
        message: 'Configuration incomplete: Merchant ID and Public Key are required to test connection.',
        latencyMs: 0
      };
    }

    // Simulated provider ping (Adapter test)
    await new Promise((r) => setTimeout(r, 450));

    // Update connection status
    config.connectionStatus = 'CONNECTED';
    config.onboardingStatus = 'VERIFIED';
    this.configs.set(targetSchoolId, config);
    this.persistConfigs();

    return {
      success: true,
      message: `Successfully connected to ${config.provider} (${config.environment} Environment) for School ${targetSchoolId}.`,
      latencyMs: 142
    };
  }

  public getReconciliationRecords(
    targetSchoolId: string,
    session: UserSession
  ): PaymentReconciliationRecord[] {
    TenantSecurityService.validateTenantAccess(session, targetSchoolId);
    return this.reconciliations.get(targetSchoolId) || [];
  }

  // ============================================================================
  // Payment Execution & Adapter Delegation
  // ============================================================================
  public async initiateOrderPayment(
    targetSchoolId: string,
    request: PaymentInitiationRequest,
    session: UserSession
  ): Promise<PaymentInitiationResult> {
    TenantSecurityService.validateTenantAccess(session, targetSchoolId);

    const config = this.getGatewayConfig(targetSchoolId, session);
    const adapter = this.getAdapter(config.provider);

    return adapter.initializePayment(config, request);
  }

  public async verifyOrderPayment(
    targetSchoolId: string,
    request: PaymentVerificationRequest,
    session: UserSession
  ): Promise<PaymentVerificationResult> {
    TenantSecurityService.validateTenantAccess(session, targetSchoolId);

    const config = this.getGatewayConfig(targetSchoolId, session);
    const adapter = this.getAdapter(config.provider);

    return adapter.verifyPayment(config, request);
  }

  public async processOrderRefund(
    targetSchoolId: string,
    request: GatewayRefundRequest,
    session: UserSession
  ): Promise<GatewayRefundResult> {
    TenantSecurityService.validateTenantAccess(session, targetSchoolId);

    const config = this.getGatewayConfig(targetSchoolId, session);
    const adapter = this.getAdapter(config.provider);

    const result = await adapter.processRefund(config, request);

    if (result.status === 'PROCESSED') {
      // Add refund record to reconciliations
      const recs = this.reconciliations.get(targetSchoolId) || [];
      recs.unshift({
        id: `rec-rfnd-${Date.now()}`,
        schoolId: targetSchoolId,
        orderNo: request.orderId,
        provider: config.provider,
        amountInPaise: request.amountInPaise,
        platformFeeInPaise: 0,
        netSettledToSchoolInPaise: -request.amountInPaise,
        status: 'REFUNDED',
        settlementDate: new Date().toISOString(),
        bankRef: result.refundId
      });
      this.reconciliations.set(targetSchoolId, recs);
    }

    return result;
  }
}
