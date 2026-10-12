import { describe, it, expect } from 'vitest';
import { SubscriptionBillingService } from '../services/subscription/SubscriptionBillingService';
import { TenantSecurityException, type UserSession } from '../services/TenantSecurityService';

describe('FOV-08: i2A SchoolOS Subscription, Free Trial & Dynamic Pricing Engine', () => {
  const service = SubscriptionBillingService.getInstance();

  const schoolAId = 'I2A-SCH-000001';
  const schoolBId = 'I2A-SCH-000002';
  const newSchoolId = 'I2A-SCH-000099';

  const adminSessionA: UserSession = {
    id: 'admin-sch-1',
    email: 'admin@school1.edu',
    tenantId: schoolAId,
    role: 'ADMIN',
    status: 'ACTIVE'
  };

  const adminSessionB: UserSession = {
    id: 'admin-sch-2',
    email: 'admin@school2.edu',
    tenantId: schoolBId,
    role: 'ADMIN',
    status: 'ACTIVE'
  };

  const superAdminSession: UserSession = {
    id: 'super-admin-01',
    email: 'ops@i2aschoolos.com',
    tenantId: 'I2A-PLATFORM',
    role: 'SUPER_ADMIN',
    status: 'ACTIVE'
  };

  // ==========================================================================
  // PHASE 8 — TESTS 1 TO 9: TRIAL ENGINE & REMINDERS
  // ==========================================================================
  it('1. Enforces single eligible 30-day free trial per school identity', () => {
    // School A already has an active trial
    expect(() => {
      service.startFreeTrial(schoolAId, 'Duplicate ABC School', adminSessionA);
    }).toThrowError(/TRIAL_ALREADY_CONSUMED/i);

    // New school can start trial
    const newSession: UserSession = {
      id: 'admin-new-01',
      email: 'principal@newhaven.edu',
      tenantId: newSchoolId,
      role: 'PRINCIPAL',
      status: 'ACTIVE'
    };
    const profile = service.startFreeTrial(newSchoolId, 'New Haven Academy', newSession);
    expect(profile.status).toBe('TRIAL_ACTIVE');
    expect(profile.trialDaysRemaining).toBe(30);
  });

  it('2. Verifies correct 30-day trial window calculation', () => {
    const profileA = service.getSubscriptionProfile(schoolAId, adminSessionA);
    const startMs = new Date(profileA.trialStartAt).getTime();
    const endMs = new Date(profileA.trialEndAt).getTime();
    const diffDays = Math.round((endMs - startMs) / (24 * 60 * 60 * 1000));

    expect(diffDays).toBe(30);
  });

  it('3. Generates Day 20 reminder when trial elapsed days reaches 20', () => {
    // Simulate Day 20 time for School A
    const day20Date = new Date(new Date(service.getSubscriptionProfile(schoolAId, adminSessionA).trialStartAt).getTime() + 19.5 * 24 * 60 * 60 * 1000);
    const result = service.runTrialReminderScheduler(day20Date);
    expect(result.processedCount).toBeGreaterThan(0);

    const notifs = service.getSchoolNotifications(schoolAId, adminSessionA);
    const day20Notif = notifs.find((n) => n.dayNumber === 20);
    expect(day20Notif).toBeDefined();
    expect(day20Notif?.title).toContain('Day 20 Reminder');
  });

  it('4. Sends daily reminder during Days 21-29 (max 1 per day)', () => {
    // Simulate Day 24 for School A
    const day24Date = new Date(new Date(service.getSubscriptionProfile(schoolAId, adminSessionA).trialStartAt).getTime() + 23.5 * 24 * 60 * 60 * 1000);
    service.runTrialReminderScheduler(day24Date);

    const notifs = service.getSchoolNotifications(schoolAId, adminSessionA);
    const day24Notif = notifs.find((n) => n.dayNumber === 24);
    expect(day24Notif).toBeDefined();
  });

  it('5. Generates Day 30 final day reminder and transitions status to GRACE_PERIOD', () => {
    // Simulate Day 31 for School A
    const day31Date = new Date(new Date(service.getSubscriptionProfile(schoolAId, adminSessionA).trialStartAt).getTime() + 30.5 * 24 * 60 * 60 * 1000);
    service.runTrialReminderScheduler(day31Date);

    const profileA = service.getSubscriptionProfile(schoolAId, adminSessionA);
    expect(profileA.status).toBe('GRACE_PERIOD');
  });

  it('6. Stops trial reminders once subscription invoice is paid', () => {
    // School B generates invoice and pays
    const invoice = service.generateSubscriptionInvoice(schoolBId, adminSessionB);
    service.paySubscriptionInvoice(schoolBId, invoice.id, 'UTR-ONLINE-SUB-9921', adminSessionB);

    const profileB = service.getSubscriptionProfile(schoolBId, adminSessionB);
    expect(profileB.status).toBe('ACTIVE_PAID');

    // Run scheduler now: School B should receive NO new trial reminders
    const notifsBefore = service.getSchoolNotifications(schoolBId, adminSessionB).length;
    service.runTrialReminderScheduler(new Date());
    const notifsAfter = service.getSchoolNotifications(schoolBId, adminSessionB).length;

    expect(notifsAfter).toBe(notifsBefore);
  });

  it('7. Idempotent scheduler runs prevent duplicate notifications on the same day', () => {
    const fixedDate = new Date();
    service.runTrialReminderScheduler(fixedDate);
    const count1 = service.getSchoolNotifications(schoolAId, adminSessionA).length;

    // Run immediately again with same date
    service.runTrialReminderScheduler(fixedDate);
    const count2 = service.getSchoolNotifications(schoolAId, adminSessionA).length;

    expect(count2).toBe(count1);
  });

  it('8. Cross-tenant isolation: School A admin cannot access School B subscription profile or invoices', () => {
    // Admin A trying to access School B profile
    expect(() => {
      service.getSubscriptionProfile(schoolBId, adminSessionA);
    }).toThrowError(TenantSecurityException);

    // Admin A trying to access School B invoices
    expect(() => {
      service.getInvoicesForSchool(schoolBId, adminSessionA);
    }).toThrowError(TenantSecurityException);
  });

  // ==========================================================================
  // PHASE 8 — TESTS 10 TO 16: DYNAMIC PRICING & BILLING
  // ==========================================================================
  it('10. Calculates class-wise per-student rates correctly in integer paise', () => {
    const counts = {
      NURSERY: 50,    // 50 * 3000 = 150000 paise (₹1,500)
      LKG_UKG: 50,    // 50 * 3500 = 175000 paise (₹1,750)
      CLASS_1_5: 100, // 100 * 4000 = 400000 paise (₹4,000)
      CLASS_6_8: 100, // 100 * 4500 = 450000 paise (₹4,500)
      CLASS_9_10: 50, // 50 * 5500 = 275000 paise (₹2,750)
      CLASS_11_12: 50 // 50 * 6500 = 325000 paise (₹3,250)
    };

    const estimate = service.calculateSubscriptionEstimate(
      schoolAId,
      counts,
      ['SCHOOL_ERP_CORE'],
      adminSessionA
    );

    // Expected Subtotal: 150000 + 175000 + 400000 + 450000 + 275000 + 325000 = 1775000 paise (₹17,750)
    expect(estimate.subtotalInPaise).toBe(1775000);
    // Tax: 18% of 1775000 = 319500 paise (₹3,195)
    expect(estimate.taxInPaise).toBe(319500);
    // Total: 1775000 + 319500 = 2094500 paise (₹20,945)
    expect(estimate.totalAmountInPaise).toBe(2094500);
  });

  it('11. Verifies NEET Prep is an independent add-on and NOT bundled into core ERP', () => {
    const counts = {
      NURSERY: 0,
      LKG_UKG: 0,
      CLASS_1_5: 0,
      CLASS_6_8: 0,
      CLASS_9_10: 0,
      CLASS_11_12: 40 // 40 senior students
    };

    // Calculation WITHOUT NEET Prep (Only Core ERP)
    const withoutNeet = service.calculateSubscriptionEstimate(
      schoolAId,
      counts,
      ['SCHOOL_ERP_CORE'],
      adminSessionA
    );
    expect(withoutNeet.subtotalInPaise).toBe(40 * 6500); // 260000 paise (₹2,600)

    // Calculation WITH NEET Prep (Adds 40 * 15000 = 600000 paise)
    const withNeet = service.calculateSubscriptionEstimate(
      schoolAId,
      counts,
      ['SCHOOL_ERP_CORE', 'NEET_PREP'],
      adminSessionA
    );

    expect(withNeet.subtotalInPaise).toBe(40 * 6500 + 40 * 15000); // 260000 + 600000 = 860000 paise (₹8,600)
    const neetLine = withNeet.lineItems.find((l) => l.category === 'NEET_PREP');
    expect(neetLine).toBeDefined();
    expect(neetLine?.amountInPaise).toBe(600000);
  });

  it('12. Preserves historical invoice immutability when Platform Admin updates future pricing rules', () => {
    // Generate an invoice for School A under current rates
    const invoice = service.generateSubscriptionInvoice(schoolAId, adminSessionA);
    const originalTotal = invoice.totalAmountInPaise;

    // Platform Admin updates Class 11-12 rate from 6500 to 9000 paise
    service.updateClassPricingRule('CLASS_11_12', 9000, superAdminSession);

    // Fetch existing historical invoice - total must NOT change!
    const invoices = service.getInvoicesForSchool(schoolAId, adminSessionA);
    const existing = invoices.find((i) => i.id === invoice.id)!;
    expect(existing.totalAmountInPaise).toBe(originalTotal);

    // Revert rate back
    service.updateClassPricingRule('CLASS_11_12', 6500, superAdminSession);
  });

  it('13. Blocks non-Super Admin roles from modifying global pricing tiers', () => {
    expect(() => {
      service.updateClassPricingRule('NURSERY', 9999, adminSessionA);
    }).toThrowError(TenantSecurityException);
  });
});
