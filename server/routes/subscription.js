import express from 'express';
import { getDb } from '../db.js';
import {
  authenticateToken,
  enforceTenant,
  requireRoles,
  logAuditEvent
} from '../middleware/auth.js';

const router = express.Router();

export const SUBSCRIPTION_PLANS = [
  {
    id: 'STARTER',
    name: 'Starter Plan',
    baseYearlyPrice: 24000,
    perStudentYearlyPrice: 120,
    maxStudents: 250,
    maxStaff: 25,
    features: ['Student SIS', 'Basic Fee Collection', 'Attendance', 'Timetable Engine', 'PDF Receipts']
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional Plan',
    baseYearlyPrice: 48000,
    perStudentYearlyPrice: 100,
    maxStudents: 1000,
    maxStaff: 80,
    features: ['All Starter Features', 'AI Question Bank', 'Online Timer Exams', 'Automated Report Cards', 'Staff Payroll', 'Marketplace Store', 'SMS/WhatsApp Simulation']
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise Plan',
    baseYearlyPrice: 96000,
    perStudentYearlyPrice: 80,
    maxStudents: 5000,
    maxStaff: 300,
    features: ['All Professional Features', 'Custom Subdomain & SSL', 'Biometric Device Ingest', 'Live Fleet GPS', 'Multi-Branch Analytics', 'Priority 24/7 SLA']
  }
];

/**
 * GET /api/subscription/plans
 */
router.get('/plans', (req, res) => {
  res.json(SUBSCRIPTION_PLANS);
});

/**
 * POST /api/subscription/calculate-price
 * Server is the absolute source of financial truth.
 * Client-submitted discount rates are validated against maximum 40% cap.
 */
router.post('/calculate-price', (req, res) => {
  try {
    const { planId, studentCount, durationYears = 1, requestedDiscountPercent = 0 } = req.body;

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[1];
    const students = Math.max(1, Number(studentCount) || plan.maxStudents);
    const years = Math.max(1, Math.min(5, Number(durationYears) || 1)); // 1 to 5 years

    // Duration Multiplier Discount
    let durationDiscountPercent = 0;
    if (years === 2) durationDiscountPercent = 10;
    else if (years === 3) durationDiscountPercent = 20;
    else if (years >= 5) durationDiscountPercent = 30;

    // Additional requested promo discount, strictly capped so total <= 40%
    const totalDiscountPercent = Math.min(40, durationDiscountPercent + Math.min(10, Math.max(0, Number(requestedDiscountPercent) || 0)));

    const annualBase = plan.baseYearlyPrice + (students * plan.perStudentYearlyPrice);
    const grossTotal = annualBase * years;
    const discountAmount = Math.round((grossTotal * totalDiscountPercent) / 100);
    const netPayable = Math.max(0, grossTotal - discountAmount);

    res.json({
      planId: plan.id,
      planName: plan.name,
      students,
      durationYears: years,
      annualBasePrice: annualBase,
      grossTotal,
      discountPercent: totalDiscountPercent,
      discountAmount,
      netPayable,
      gstAmount: Math.round(netPayable * 0.18),
      grandTotalWithGst: Math.round(netPayable * 1.18),
      calculatedAt: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: 'Calculation failed: ' + err.message });
  }
});

/**
 * GET /api/subscription/trial-status
 * Inspects school trial progress and triggers Day 20+ reminder policy
 */
router.get('/trial-status', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const tenant = await database.collection('tenants').findOne({ id: req.user.schoolId });
    if (!tenant) return res.status(404).json({ error: 'Tenant record not found.' });

    const registeredTime = new Date(tenant.registeredAt || Date.now()).getTime();
    const nowTime = Date.now();
    const daysElapsed = Math.floor((nowTime - registeredTime) / (1000 * 60 * 60 * 24));
    const totalTrialDays = 30;
    const daysRemaining = Math.max(0, totalTrialDays - daysElapsed);

    const isTrialActive = tenant.subscriptionStatus === 'TRIAL';
    const isDay20ReminderEligible = isTrialActive && daysElapsed >= 20;

    // Daily Reminder Policy: At most 1 reminder per day from Day 20 onwards
    let reminderDispatchedToday = false;
    if (isDay20ReminderEligible) {
      const todayIso = new Date().toISOString().split('T')[0];
      const existingReminder = await database.collection('notifications').findOne({
        schoolId: tenant.id,
        title: { $regex: /Trial Expiry Reminder/i },
        dispatchedDate: todayIso
      });

      if (!existingReminder) {
        await database.collection('notifications').insertOne({
          id: `notif-trial-${Date.now()}`,
          schoolId: tenant.id,
          recipientType: 'ADMIN',
          recipientName: tenant.adminName,
          recipientEmail: tenant.adminEmail,
          role: 'PRINCIPAL',
          title: `⚠️ Trial Expiry Reminder: ${daysRemaining} Days Remaining`,
          message: `Your 30-day full access trial for ${tenant.name} has ${daysRemaining} days remaining. Upgrade now to preserve all school records and active websites without disruption.`,
          read: false,
          dispatchedDate: todayIso,
          dispatchedAt: new Date().toLocaleString('en-IN')
        });
        reminderDispatchedToday = true;
      }
    }

    res.json({
      schoolId: tenant.id,
      schoolName: tenant.name,
      planName: tenant.planName,
      subscriptionStatus: tenant.subscriptionStatus,
      registeredAt: tenant.registeredAt,
      expiresAt: tenant.expiresAt,
      daysElapsed,
      daysRemaining,
      isTrialActive,
      isDay20ReminderEligible,
      reminderDispatchedToday
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/subscription/upgrade
 * Activates or renews a school subscription
 */
router.post('/upgrade', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN'), async (req, res) => {
  try {
    const { planId, billingCycle = 'YEARLY', durationYears = 1, paymentRef } = req.body;
    const database = await getDb();

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId) || SUBSCRIPTION_PLANS[1];
    const newExpiresAt = new Date(Date.now() + durationYears * 365 * 86400000).toISOString().split('T')[0];

    await database.collection('tenants').updateOne(
      { id: req.user.schoolId },
      {
        $set: {
          planId: plan.id,
          planName: plan.name,
          billingCycle,
          subscriptionStatus: 'ACTIVE',
          expiresAt: newExpiresAt,
          studentLimit: plan.maxStudents,
          updatedAt: new Date().toISOString()
        }
      }
    );

    await logAuditEvent({
      schoolId: req.user.schoolId,
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'UPGRADE_SUBSCRIPTION',
      module: 'SUBSCRIPTION_BILLING',
      details: `Upgraded to ${plan.name} (${billingCycle}). Valid until ${newExpiresAt}. Payment Ref: ${paymentRef || 'TXN-ONLINE'}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `Subscription successfully upgraded to ${plan.name}.`,
      status: 'ACTIVE',
      expiresAt: newExpiresAt
    });
  } catch (err) {
    res.status(500).json({ error: 'Upgrade failed: ' + err.message });
  }
});

export default router;
