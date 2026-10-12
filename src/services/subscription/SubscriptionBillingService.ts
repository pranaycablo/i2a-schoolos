import { TenantSecurityService, type UserSession, TenantSecurityException } from '../TenantSecurityService';
import type {
  ClassGroupPricingCategory,
  CourseProgramCategory,
  ClassPricingRule,
  CourseProgramPlan,
  SchoolSubscriptionProfile,
  SubscriptionInvoice,
  SubscriptionInvoiceLineItem,
  SubscriptionTrialNotification
} from '../../types';

export class SubscriptionBillingService {
  private static instance: SubscriptionBillingService;

  private pricingRules: Map<ClassGroupPricingCategory, ClassPricingRule> = new Map();
  private coursePlans: Map<CourseProgramCategory, CourseProgramPlan> = new Map();
  private schoolProfiles: Map<string, SchoolSubscriptionProfile> = new Map();
  private invoices: Map<string, SubscriptionInvoice> = new Map();
  private notifications: Map<string, SubscriptionTrialNotification[]> = new Map();
  private trialRegisteredSchools: Set<string> = new Set(); // Single trial enforcement

  private readonly STORAGE_KEY_PROFILES = 'i2a_subscription_profiles';
  private readonly STORAGE_KEY_INVOICES = 'i2a_subscription_invoices';
  private readonly STORAGE_KEY_NOTIFS = 'i2a_subscription_notifs';

  private constructor() {
    this.initializePricingRules();
    this.initializeCoursePlans();
    this.initializeSeedData();
    this.loadFromStorage();
  }

  public static getInstance(): SubscriptionBillingService {
    if (!SubscriptionBillingService.instance) {
      SubscriptionBillingService.instance = new SubscriptionBillingService();
    }
    return SubscriptionBillingService.instance;
  }

  // ============================================================================
  // 1. DYNAMIC PRICING ENGINE (CONFIGURABLE BY PLATFORM ADMIN)
  // ============================================================================
  private initializePricingRules(): void {
    const defaultRules: ClassPricingRule[] = [
      {
        classGroup: 'NURSERY',
        label: 'Nursery (Pre-Primary Foundation)',
        pricePerStudentInPaise: 3000, // ₹30/student/month
        minimumCommitment: 20,
        effectiveFrom: '2026-04-01T00:00:00Z',
        version: 1
      },
      {
        classGroup: 'LKG_UKG',
        label: 'LKG & UKG (Kindergarten)',
        pricePerStudentInPaise: 3500, // ₹35/student/month
        minimumCommitment: 25,
        effectiveFrom: '2026-04-01T00:00:00Z',
        version: 1
      },
      {
        classGroup: 'CLASS_1_5',
        label: 'Class 1 to 5 (Primary School)',
        pricePerStudentInPaise: 4000, // ₹40/student/month
        minimumCommitment: 50,
        effectiveFrom: '2026-04-01T00:00:00Z',
        version: 1
      },
      {
        classGroup: 'CLASS_6_8',
        label: 'Class 6 to 8 (Middle School)',
        pricePerStudentInPaise: 4500, // ₹45/student/month
        minimumCommitment: 50,
        effectiveFrom: '2026-04-01T00:00:00Z',
        version: 1
      },
      {
        classGroup: 'CLASS_9_10',
        label: 'Class 9 & 10 (Secondary Board Prep)',
        pricePerStudentInPaise: 5500, // ₹55/student/month
        minimumCommitment: 30,
        effectiveFrom: '2026-04-01T00:00:00Z',
        version: 1
      },
      {
        classGroup: 'CLASS_11_12',
        label: 'Class 11 & 12 (Senior Secondary)',
        pricePerStudentInPaise: 6500, // ₹65/student/month
        minimumCommitment: 30,
        effectiveFrom: '2026-04-01T00:00:00Z',
        version: 1
      }
    ];

    defaultRules.forEach((rule) => this.pricingRules.set(rule.classGroup, rule));
  }

  private initializeCoursePlans(): void {
    const plans: CourseProgramPlan[] = [
      {
        id: 'plan-erp-core',
        program: 'SCHOOL_ERP_CORE',
        name: 'SchoolOS Core ERP Suite',
        description: 'Complete Student SIS, Timetable, Exams, Report Cards, and Attendance',
        pricePerStudentInPaise: 0, // Included with student group tier
        billingCycle: 'MONTHLY',
        isActive: true,
        version: 1
      },
      {
        id: 'plan-neet-prep',
        program: 'NEET_PREP',
        name: 'i2A Medical AI — NEET UG Prep Program',
        description: 'AI Question Bank, NCERT Drill, NEET Mock Exams, and Biology/Physics/Chemistry Analytics',
        pricePerStudentInPaise: 15000, // ₹150/student/month (Independent Add-on)
        billingCycle: 'MONTHLY',
        isActive: true,
        version: 1
      },
      {
        id: 'plan-neet-pg',
        program: 'NEET_PG_PREP',
        name: 'i2A Medical AI — NEET PG Specialization Suite',
        description: 'Advanced Clinical Vignettes, High-Yield Subject Banks, and Residency Entrance Simulator',
        pricePerStudentInPaise: 25000, // ₹250/candidate/month (Independent Add-on)
        billingCycle: 'MONTHLY',
        isActive: true,
        version: 1
      },
      {
        id: 'plan-entrance-prep',
        program: 'ENTRANCE_EXAM_PREP',
        name: 'i2A Olympiad & CUET Prep Pack',
        description: 'National Level Olympiad Tests, CUET General & Domain Question Series',
        pricePerStudentInPaise: 12000, // ₹120/student/month (Independent Add-on)
        billingCycle: 'MONTHLY',
        isActive: true,
        version: 1
      }
    ];

    plans.forEach((p) => this.coursePlans.set(p.program, p));
  }

  // ============================================================================
  // 2. SEED DATA & MULTI-TENANT INITIALIZATION
  // ============================================================================
  private initializeSeedData(): void {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;

    // School A: ABC Public School (Day 16 of Trial - 14 Days Remaining)
    const schoolAStart = new Date(now - 16 * DAY_MS).toISOString();
    const schoolAEnd = new Date(new Date(schoolAStart).getTime() + 30 * DAY_MS).toISOString();
    const profileA: SchoolSubscriptionProfile = {
      schoolId: 'I2A-SCH-000001',
      schoolName: 'ABC Public School',
      trialStartAt: schoolAStart,
      trialEndAt: schoolAEnd,
      trialDaysRemaining: 14,
      status: 'TRIAL_ACTIVE',
      selectedPrograms: ['SCHOOL_ERP_CORE'],
      enrolledCountsByClassGroup: {
        NURSERY: 40,
        LKG_UKG: 60,
        CLASS_1_5: 250,
        CLASS_6_8: 180,
        CLASS_9_10: 120,
        CLASS_11_12: 100
      },
      isTrialEligible: false, // Already consumed eligible free trial
      lastReminderDaySent: 1,
      updatedAt: new Date().toISOString()
    };

    // School B: Delhi Model Academy (Day 23 of Trial - 7 Days Remaining - Day 20+ reminder sent)
    const schoolBStart = new Date(now - 23 * DAY_MS).toISOString();
    const schoolBEnd = new Date(new Date(schoolBStart).getTime() + 30 * DAY_MS).toISOString();
    const profileB: SchoolSubscriptionProfile = {
      schoolId: 'I2A-SCH-000002',
      schoolName: 'Delhi Model Academy',
      trialStartAt: schoolBStart,
      trialEndAt: schoolBEnd,
      trialDaysRemaining: 7,
      status: 'TRIAL_ACTIVE',
      selectedPrograms: ['SCHOOL_ERP_CORE', 'NEET_PREP'], // Includes NEET Prep Addon
      enrolledCountsByClassGroup: {
        NURSERY: 30,
        LKG_UKG: 50,
        CLASS_1_5: 200,
        CLASS_6_8: 150,
        CLASS_9_10: 100,
        CLASS_11_12: 80
      },
      isTrialEligible: false,
      lastReminderDaySent: 23,
      updatedAt: new Date().toISOString()
    };

    // School C: St. Xavier International (Day 35 - Trial Expired -> Read-only Grace Period, data preserved)
    const schoolCStart = new Date(now - 35 * DAY_MS).toISOString();
    const schoolCEnd = new Date(new Date(schoolCStart).getTime() + 30 * DAY_MS).toISOString();
    const profileC: SchoolSubscriptionProfile = {
      schoolId: 'I2A-SCH-000003',
      schoolName: 'St. Xavier International',
      trialStartAt: schoolCStart,
      trialEndAt: schoolCEnd,
      trialDaysRemaining: 0,
      status: 'GRACE_PERIOD',
      selectedPrograms: ['SCHOOL_ERP_CORE'],
      enrolledCountsByClassGroup: {
        NURSERY: 20,
        LKG_UKG: 40,
        CLASS_1_5: 180,
        CLASS_6_8: 120,
        CLASS_9_10: 80,
        CLASS_11_12: 60
      },
      isTrialEligible: false,
      lastReminderDaySent: 30,
      updatedAt: new Date().toISOString()
    };

    this.schoolProfiles.set(profileA.schoolId, profileA);
    this.schoolProfiles.set(profileB.schoolId, profileB);
    this.schoolProfiles.set(profileC.schoolId, profileC);

    this.trialRegisteredSchools.add(profileA.schoolId);
    this.trialRegisteredSchools.add(profileB.schoolId);
    this.trialRegisteredSchools.add(profileC.schoolId);

    // Initial Notifications
    this.notifications.set(profileA.schoolId, [
      {
        id: 'notif-a-1',
        schoolId: profileA.schoolId,
        dayNumber: 1,
        title: 'Welcome to i2A SchoolOS 30-Day Free Trial',
        message: 'Your 30-day all-access free trial is active. Explore all features without credit card.',
        actionUrl: '/billing',
        status: 'READ',
        deliveryChannel: 'IN_APP',
        createdAt: schoolAStart
      }
    ]);

    this.notifications.set(profileB.schoolId, [
      {
        id: 'notif-b-1',
        schoolId: profileB.schoolId,
        dayNumber: 1,
        title: 'Welcome to i2A SchoolOS 30-Day Free Trial',
        message: 'Your 30-day all-access free trial is active.',
        actionUrl: '/billing',
        status: 'READ',
        deliveryChannel: 'IN_APP',
        createdAt: schoolBStart
      },
      {
        id: 'notif-b-20',
        schoolId: profileB.schoolId,
        dayNumber: 20,
        title: 'Day 20 Reminder: 10 Days Remaining in Free Trial',
        message: 'Your free trial ends in 10 days. Select your subscription plan to ensure uninterrupted access.',
        actionUrl: '/billing',
        status: 'SENT',
        deliveryChannel: 'IN_APP',
        createdAt: new Date(now - 3 * DAY_MS).toISOString()
      },
      {
        id: 'notif-b-23',
        schoolId: profileB.schoolId,
        dayNumber: 23,
        title: 'Trial Reminder: 7 Days Remaining',
        message: 'Review your enrolled students count and active plan before trial expiration.',
        actionUrl: '/billing',
        status: 'SENT',
        deliveryChannel: 'IN_APP',
        createdAt: new Date().toISOString()
      }
    ]);
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedProfiles = localStorage.getItem(this.STORAGE_KEY_PROFILES);
        if (storedProfiles) {
          const parsed = JSON.parse(storedProfiles) as Record<string, SchoolSubscriptionProfile>;
          Object.entries(parsed).forEach(([schId, p]) => this.schoolProfiles.set(schId, p));
        }

        const storedInvoices = localStorage.getItem(this.STORAGE_KEY_INVOICES);
        if (storedInvoices) {
          const parsed = JSON.parse(storedInvoices) as Record<string, SubscriptionInvoice>;
          Object.entries(parsed).forEach(([invId, inv]) => this.invoices.set(invId, inv));
        }
      }
    } catch {
      // Storage fallback
    }
  }

  private syncToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const profObj: Record<string, SchoolSubscriptionProfile> = {};
        this.schoolProfiles.forEach((p, k) => { profObj[k] = p; });
        localStorage.setItem(this.STORAGE_KEY_PROFILES, JSON.stringify(profObj));

        const invObj: Record<string, SubscriptionInvoice> = {};
        this.invoices.forEach((inv, k) => { invObj[k] = inv; });
        localStorage.setItem(this.STORAGE_KEY_INVOICES, JSON.stringify(invObj));
      }
    } catch {
      // Storage fallback
    }
  }

  // ============================================================================
  // 3. TRIAL ENGINE & REMINDERS (PHASE 1 & PHASE 2)
  // ============================================================================
  public startFreeTrial(
    schoolId: string,
    schoolName: string,
    session: UserSession
  ): SchoolSubscriptionProfile {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    // Rule 1: Single Trial per School Identity
    if (this.trialRegisteredSchools.has(schoolId)) {
      throw new Error(`TRIAL_ALREADY_CONSUMED: School ${schoolId} has already used its eligible 30-day free trial.`);
    }

    const now = new Date();
    const trialStartAt = now.toISOString();
    const trialEndAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const newProfile: SchoolSubscriptionProfile = {
      schoolId,
      schoolName,
      trialStartAt,
      trialEndAt,
      trialDaysRemaining: 30,
      status: 'TRIAL_ACTIVE',
      selectedPrograms: ['SCHOOL_ERP_CORE'],
      enrolledCountsByClassGroup: {
        NURSERY: 0,
        LKG_UKG: 0,
        CLASS_1_5: 0,
        CLASS_6_8: 0,
        CLASS_9_10: 0,
        CLASS_11_12: 0
      },
      isTrialEligible: false,
      lastReminderDaySent: 1,
      updatedAt: trialStartAt
    };

    this.schoolProfiles.set(schoolId, newProfile);
    this.trialRegisteredSchools.add(schoolId);

    // Create Day 1 Welcome Notification
    this.addNotification({
      id: `notif-${schoolId}-1`,
      schoolId,
      dayNumber: 1,
      title: 'Welcome to i2A SchoolOS 30-Day Free Trial',
      message: 'Your 30-day free trial has officially started. All core modules are active.',
      actionUrl: '/billing',
      status: 'SENT',
      deliveryChannel: 'IN_APP',
      createdAt: trialStartAt
    });

    this.syncToStorage();
    return newProfile;
  }

  public getSubscriptionProfile(
    schoolId: string,
    session: UserSession
  ): SchoolSubscriptionProfile {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    const profile = this.schoolProfiles.get(schoolId);
    if (!profile) {
      throw new Error(`SUBSCRIPTION_NOT_FOUND: No subscription record found for school ${schoolId}`);
    }

    // Refresh remaining days deterministically from server timestamps
    const nowMs = Date.now();
    const endMs = new Date(profile.trialEndAt).getTime();
    const remainingDays = Math.max(0, Math.ceil((endMs - nowMs) / (24 * 60 * 60 * 1000)));

    let status = profile.status;
    if (status === 'TRIAL_ACTIVE' && remainingDays === 0) {
      status = 'GRACE_PERIOD'; // Enters read-only grace period (data not deleted)
    }

    const updated = {
      ...profile,
      trialDaysRemaining: remainingDays,
      status
    };
    this.schoolProfiles.set(schoolId, updated);
    return updated;
  }

  public runTrialReminderScheduler(overrideNow?: Date): { processedCount: number; remindersSent: number } {
    const now = overrideNow || new Date();
    const nowMs = now.getTime();
    let remindersSent = 0;

    this.schoolProfiles.forEach((profile, schoolId) => {
      // If subscription is already active & paid, STOP trial reminders!
      if (profile.status === 'ACTIVE_PAID') {
        return;
      }

      const startMs = new Date(profile.trialStartAt).getTime();
      const elapsedDays = Math.floor((nowMs - startMs) / (24 * 60 * 60 * 1000)) + 1;
      const endMs = new Date(profile.trialEndAt).getTime();
      const daysRemaining = Math.max(0, Math.ceil((endMs - nowMs) / (24 * 60 * 60 * 1000)));

      // Day 20 First Reminder
      if (elapsedDays === 20 && profile.lastReminderDaySent !== 20) {
        this.addNotification({
          id: `notif-${schoolId}-day20-${nowMs}`,
          schoolId,
          dayNumber: 20,
          title: 'Day 20 Reminder: 10 Days Remaining in Free Trial',
          message: 'Your 30-day free trial will end in 10 days. Review your student counts and subscription plan.',
          actionUrl: '/billing',
          status: 'SENT',
          deliveryChannel: 'IN_APP',
          createdAt: now.toISOString()
        });
        profile.lastReminderDaySent = 20;
        remindersSent++;
      }

      // Day 21 to 29 Daily Reminder (Max 1 per day, idempotent)
      else if (elapsedDays > 20 && elapsedDays < 30 && profile.lastReminderDaySent !== elapsedDays) {
        this.addNotification({
          id: `notif-${schoolId}-day${elapsedDays}-${nowMs}`,
          schoolId,
          dayNumber: elapsedDays,
          title: `Trial Reminder: ${daysRemaining} Days Remaining`,
          message: `Your free trial expires in ${daysRemaining} days. Activate your subscription to keep full write access.`,
          actionUrl: '/billing',
          status: 'SENT',
          deliveryChannel: 'IN_APP',
          createdAt: now.toISOString()
        });
        profile.lastReminderDaySent = elapsedDays;
        remindersSent++;
      }

      // Day 30 Final Day Reminder
      else if (elapsedDays >= 30 && profile.lastReminderDaySent !== 30) {
        this.addNotification({
          id: `notif-${schoolId}-day30-${nowMs}`,
          schoolId,
          dayNumber: 30,
          title: 'Final Day: Your Free Trial Ends Today',
          message: 'Today is the last day of your trial. Complete payment to avoid read-only mode.',
          actionUrl: '/billing',
          status: 'SENT',
          deliveryChannel: 'IN_APP',
          createdAt: now.toISOString()
        });
        profile.lastReminderDaySent = 30;
        profile.status = 'GRACE_PERIOD';
        remindersSent++;
      }

      profile.trialDaysRemaining = daysRemaining;
      this.schoolProfiles.set(schoolId, profile);
    });

    this.syncToStorage();
    return { processedCount: this.schoolProfiles.size, remindersSent };
  }

  private addNotification(notif: SubscriptionTrialNotification): void {
    const list = this.notifications.get(notif.schoolId) || [];
    list.unshift(notif);
    this.notifications.set(notif.schoolId, list);
  }

  public getSchoolNotifications(
    schoolId: string,
    session: UserSession
  ): SubscriptionTrialNotification[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);
    return this.notifications.get(schoolId) || [];
  }

  // ============================================================================
  // 4. DYNAMIC BILLING CALCULATION & INVOICING (PHASE 3 & PHASE 4)
  // ============================================================================
  public calculateSubscriptionEstimate(
    schoolId: string,
    enrolledCounts: Record<ClassGroupPricingCategory, number>,
    selectedPrograms: CourseProgramCategory[],
    session: UserSession
  ): {
    lineItems: SubscriptionInvoiceLineItem[];
    subtotalInPaise: number;
    taxInPaise: number;
    discountInPaise: number;
    totalAmountInPaise: number;
  } {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    const lineItems: SubscriptionInvoiceLineItem[] = [];
    let subtotalInPaise = 0;

    // A. Class-wise per-student calculations
    const classGroups: ClassGroupPricingCategory[] = [
      'NURSERY',
      'LKG_UKG',
      'CLASS_1_5',
      'CLASS_6_8',
      'CLASS_9_10',
      'CLASS_11_12'
    ];

    classGroups.forEach((group) => {
      const count = enrolledCounts[group] || 0;
      if (count > 0) {
        const rule = this.pricingRules.get(group)!;
        const lineTotal = count * rule.pricePerStudentInPaise;
        subtotalInPaise += lineTotal;
        lineItems.push({
          id: `line-${group.toLowerCase()}`,
          description: `${rule.label} (${count} students @ ₹${(rule.pricePerStudentInPaise / 100).toFixed(2)})`,
          category: group,
          studentCount: count,
          ratePerStudentInPaise: rule.pricePerStudentInPaise,
          amountInPaise: lineTotal
        });
      }
    });

    // B. Independent Course Programs (e.g. NEET Prep, NEET PG Prep)
    selectedPrograms.forEach((prog) => {
      if (prog === 'SCHOOL_ERP_CORE') return; // Core included in base per-student rates

      const plan = this.coursePlans.get(prog);
      if (plan && plan.isActive) {
        // NEET Prep applies to Class 11 & 12 students
        let eligibleStudents = 0;
        if (prog === 'NEET_PREP') {
          eligibleStudents = enrolledCounts['CLASS_11_12'] || 0;
        } else if (prog === 'NEET_PG_PREP') {
          eligibleStudents = Math.min(25, (enrolledCounts['CLASS_11_12'] || 0)); // specialized batch
        } else if (prog === 'ENTRANCE_EXAM_PREP') {
          eligibleStudents = (enrolledCounts['CLASS_9_10'] || 0) + (enrolledCounts['CLASS_11_12'] || 0);
        }

        if (eligibleStudents > 0) {
          const progTotal = eligibleStudents * plan.pricePerStudentInPaise;
          subtotalInPaise += progTotal;
          lineItems.push({
            id: `line-${prog.toLowerCase()}`,
            description: `${plan.name} (${eligibleStudents} candidates @ ₹${(plan.pricePerStudentInPaise / 100).toFixed(2)}/mo)`,
            category: prog,
            studentCount: eligibleStudents,
            ratePerStudentInPaise: plan.pricePerStudentInPaise,
            amountInPaise: progTotal
          });
        }
      }
    });

    // 18% GST (Standard SaaS tax)
    const taxInPaise = Math.round(subtotalInPaise * 0.18);
    const discountInPaise = 0;
    const totalAmountInPaise = subtotalInPaise + taxInPaise - discountInPaise;

    return {
      lineItems,
      subtotalInPaise,
      taxInPaise,
      discountInPaise,
      totalAmountInPaise
    };
  }

  public generateSubscriptionInvoice(
    schoolId: string,
    session: UserSession
  ): SubscriptionInvoice {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    const profile = this.getSubscriptionProfile(schoolId, session);
    const calculation = this.calculateSubscriptionEstimate(
      schoolId,
      profile.enrolledCountsByClassGroup,
      profile.selectedPrograms,
      session
    );

    const now = new Date();
    const periodStart = now.toISOString();
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const invoiceSeq = this.invoices.size + 1;
    const invoiceNo = `INV-I2A-${now.getFullYear()}-${String(invoiceSeq).padStart(4, '0')}`;
    const invoiceId = `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const invoice: SubscriptionInvoice = {
      id: invoiceId,
      invoiceNo,
      schoolId,
      schoolName: profile.schoolName,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      lineItems: calculation.lineItems,
      subtotalInPaise: calculation.subtotalInPaise,
      taxInPaise: calculation.taxInPaise,
      discountInPaise: calculation.discountInPaise,
      totalAmountInPaise: calculation.totalAmountInPaise,
      status: 'PENDING',
      createdAt: periodStart,
      updatedAt: periodStart
    };

    // Immutability: Store historical invoice snapshot
    this.invoices.set(invoiceId, invoice);
    profile.activeInvoiceId = invoiceId;
    this.schoolProfiles.set(schoolId, profile);

    this.syncToStorage();
    return invoice;
  }

  public getInvoicesForSchool(
    schoolId: string,
    session: UserSession
  ): SubscriptionInvoice[] {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    return Array.from(this.invoices.values())
      .filter((inv) => inv.schoolId === schoolId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public paySubscriptionInvoice(
    schoolId: string,
    invoiceId: string,
    paymentRef: string,
    session: UserSession
  ): SubscriptionInvoice {
    TenantSecurityService.validateTenantAccess(session, schoolId);

    const invoice = this.invoices.get(invoiceId);
    if (!invoice || invoice.schoolId !== schoolId) {
      throw new Error(`INVOICE_NOT_FOUND: Invoice ${invoiceId} does not belong to school ${schoolId}`);
    }

    if (invoice.status === 'PAID') {
      return invoice;
    }

    // Update Invoice to PAID
    const now = new Date().toISOString();
    invoice.status = 'PAID';
    invoice.paidAt = now;
    invoice.paymentRef = paymentRef;
    invoice.paymentMethod = 'I2A_PLATFORM_BILLING_GATEWAY';
    invoice.updatedAt = now;
    this.invoices.set(invoiceId, invoice);

    // Update School Profile to ACTIVE_PAID
    const profile = this.schoolProfiles.get(schoolId);
    if (profile) {
      profile.status = 'ACTIVE_PAID';
      profile.updatedAt = now;
      this.schoolProfiles.set(schoolId, profile);
    }

    this.syncToStorage();
    return invoice;
  }

  // ============================================================================
  // 5. PLATFORM ADMIN PRICING MANAGEMENT (SUPER_ADMIN ONLY)
  // ============================================================================
  public getPricingRules(session: UserSession): ClassPricingRule[] {
    if (session.role !== 'SUPER_ADMIN') {
      throw new TenantSecurityException('DENIED: Only Platform Super Admin can view global pricing rules.', 403);
    }
    return Array.from(this.pricingRules.values());
  }

  public updateClassPricingRule(
    group: ClassGroupPricingCategory,
    newPriceInPaise: number,
    session: UserSession
  ): ClassPricingRule {
    if (session.role !== 'SUPER_ADMIN') {
      throw new TenantSecurityException('DENIED: Only Platform Super Admin can alter global pricing tiers.', 403);
    }

    if (newPriceInPaise < 0) {
      throw new Error('INVALID_PRICE: Subscription rate cannot be negative.');
    }

    const current = this.pricingRules.get(group);
    if (!current) {
      throw new Error(`RULE_NOT_FOUND: No pricing rule for group ${group}`);
    }

    const updated: ClassPricingRule = {
      ...current,
      pricePerStudentInPaise: newPriceInPaise,
      version: current.version + 1,
      effectiveFrom: new Date().toISOString()
    };

    this.pricingRules.set(group, updated);
    return updated;
  }

  public getAllSchoolsBillingOverview(session: UserSession): SchoolSubscriptionProfile[] {
    if (session.role !== 'SUPER_ADMIN') {
      throw new TenantSecurityException('DENIED: Only Platform Super Admin can view global school subscriptions.', 403);
    }
    return Array.from(this.schoolProfiles.values());
  }
}
