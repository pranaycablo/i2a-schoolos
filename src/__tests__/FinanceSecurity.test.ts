import { describe, it, expect } from 'vitest';
import { FeeFinanceService, PaymentWebhookPayload, StudentInvoice } from '../services/FeeFinanceService';
import { UserSession, TenantSecurityException } from '../services/TenantSecurityService';

describe('i2A SchoolOS Master Finance Security, Webhook & Idempotency Test Suite', () => {
  const schoolA_User: UserSession = {
    id: 'usr-accountant-a',
    email: 'accountant@schoola.edu.in',
    tenantId: 'sch-001',
    role: 'ACCOUNTANT',
    status: 'ACTIVE'
  };

  const sampleInvoice: StudentInvoice = {
    id: 'inv-101',
    tenantId: 'sch-001',
    invoiceNo: 'INV-2026-00100',
    studentId: 'std-101',
    studentName: 'Rahul Kumar',
    admissionNo: '1024',
    className: 'Class VIII',
    section: 'A',
    feeItems: [{ feeTypeId: 'fee-1', feeName: 'Tuition Fee', amount: 2000 }],
    baseTotal: 2000,
    discountAmount: 200,
    scholarshipAmount: 0,
    fineAmount: 50,
    netPayable: 1850,
    paidAmount: 0,
    balanceAmount: 1850,
    status: 'ISSUED',
    issueDate: '2026-10-01',
    dueDate: '2026-10-10'
  };

  const validWebhook: PaymentWebhookPayload = {
    eventId: 'evt-webhook-984210',
    gatewayTransactionId: 'UPI-9842104821',
    tenantId: 'sch-001',
    invoiceNo: 'INV-2026-00100',
    studentId: 'std-101',
    amount: 1850,
    currency: 'INR',
    signature: 'VALID_SHA256_SIGNATURE_OK',
    paymentMode: 'UPI'
  };

  it('1. Server-Side Financial Balance Calculation: Base (2000) + Fine (50) - Discount (200) = Net (1850)', () => {
    const calc = FeeFinanceService.calculateInvoiceTotal(2000, 200, 0, 50, 0);
    expect(calc.netPayable).toBe(1850);
    expect(calc.balanceAmount).toBe(1850);
  });

  it('2. Cross-Tenant Financial Isolation: School A accountant accessing School B tenant invoice -> DENIED', () => {
    const crossTenantWebhook: PaymentWebhookPayload = { ...validWebhook, tenantId: 'sch-002' };

    expect(() => {
      FeeFinanceService.verifyPaymentAndSettle(schoolA_User, crossTenantWebhook, sampleInvoice, 1850);
    }).toThrowError(TenantSecurityException);
  });

  it('3. Webhook Signature Protection: Invalid signature rejected -> 400 DENIED', () => {
    const spoofedWebhook: PaymentWebhookPayload = { ...validWebhook, signature: 'INVALID_SIGNATURE' };

    expect(() => {
      FeeFinanceService.verifyPaymentAndSettle(schoolA_User, spoofedWebhook, sampleInvoice, 1850);
    }).toThrowError('DENIED: Payment gateway webhook signature verification failed.');
  });

  it('4. Duplicate Webhook Idempotency: Repeated webhook event skips duplicate receipt generation', () => {
    const uniqueEventId = `evt-dup-${Date.now()}`;
    const webhook: PaymentWebhookPayload = { ...validWebhook, eventId: uniqueEventId };

    // First attempt -> SUCCESS
    const firstTry = FeeFinanceService.verifyPaymentAndSettle(schoolA_User, webhook, sampleInvoice, 1850);
    expect(firstTry.status).toBe('SUCCESS');

    // Duplicate second attempt -> IDEMPOTENT_SKIPPED
    const secondTry = FeeFinanceService.verifyPaymentAndSettle(schoolA_User, webhook, sampleInvoice, 1850);
    expect(secondTry.status).toBe('IDEMPOTENT_SKIPPED');
  });

  it('5. Notification Failure Isolation: Payment status remains SUCCESS even if notification fails', () => {
    const uniqueEventId = `evt-notif-${Date.now()}`;
    const webhook: PaymentWebhookPayload = { ...validWebhook, eventId: uniqueEventId };

    const result = FeeFinanceService.verifyPaymentAndSettle(schoolA_User, webhook, sampleInvoice, 1850);
    expect(result.status).toBe('SUCCESS');
    expect(result.updatedInvoice.status).toBe('PAID');
    expect(result.updatedInvoice.balanceAmount).toBe(0);
  });
});
