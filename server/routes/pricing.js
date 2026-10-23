import express from 'express';

const router = express.Router();

export const PUBLIC_PRICING_PLANS = [
  {
    id: 'STARTER',
    name: 'Starter Plan',
    tierName: 'Starter',
    subtitle: 'Ideal for single-branch schools, tuition academies, preschools & sports studios',
    baseMonthlyPrice: 2000,
    baseYearlyPrice: 20000, // 2 months free equivalent on annual
    perStudentYearlyPrice: 120, // ₹10/student/month
    perStudentMonthlyPrice: 12,
    maxStudents: 300,
    maxStaff: 25,
    recommendedFor: 'Preschools, Micro-Schools, Coaching & Tuition Hubs',
    highlight: false,
    trialDays: 14,
    features: [
      'Student Information System (SIS) & Digital Bio-Data',
      'Daily Attendance (Web, Mobile & Teacher App)',
      'Term Fee Schedules & Digital Receipts',
      'Timetable Master & Class Rosters',
      'Parent Communication SMS / In-App Alerts',
      'Basic Report Cards (CBSE / State Format)',
      'Standard Email & Community Support'
    ],
    excludedFeatures: [
      'Biometric / RFID Hardware Machine Sync',
      'Live Bus GPS Geofence & Speed Tracking',
      'AI Question Bank & Online Timer Exams',
      'Multi-Branch Trust Treasury Dashboard',
      'Dedicated Account Manager'
    ]
  },
  {
    id: 'PROFESSIONAL',
    name: 'Professional Plan',
    tierName: 'Professional',
    subtitle: 'Complete ERP operating system for mainstream K-12 schools & test-prep institutes',
    baseMonthlyPrice: 4000,
    baseYearlyPrice: 40000,
    perStudentYearlyPrice: 100, // ~₹8.33/student/month
    perStudentMonthlyPrice: 10,
    maxStudents: 1500,
    maxStaff: 100,
    recommendedFor: 'K-12 CBSE / ICSE Schools & Competitive Coaching Institutes',
    highlight: true,
    trialDays: 14,
    features: [
      'All Starter Plan Modules Included',
      'AI Question Bank & Auto-Generated Practice Papers',
      'Online CBT & OMR Exam Series with Percentile Ranking',
      'Biometric Machine Integration (ZKTeco / eSSL)',
      'School Bus Fleet Tracking with Driver Mobile App',
      'Online Fee Gateway (UPI, Cards, NetBanking, QR Receipts)',
      'Staff Payroll, Leave Accruals & Service Book',
      'Library Management with Barcode Scanner',
      'Priority WhatsApp & Phone Technical Support'
    ],
    excludedFeatures: [
      'Multi-Branch Trust Treasury Dashboard',
      'Custom Dedicated Database Instance',
      'White-label Native App on Google Play / App Store'
    ]
  },
  {
    id: 'ENTERPRISE',
    name: 'Enterprise Plan',
    tierName: 'Enterprise',
    subtitle: 'High-availability infrastructure for multi-branch trusts, colleges & educational chains',
    baseMonthlyPrice: 8000,
    baseYearlyPrice: 80000,
    perStudentYearlyPrice: 80, // ~₹6.66/student/month
    perStudentMonthlyPrice: 8,
    maxStudents: 10000,
    maxStaff: 500,
    recommendedFor: 'School Groups, Educational Trusts & Higher Education Institutions',
    highlight: false,
    trialDays: 14,
    features: [
      'All Professional Plan Modules Included',
      'Centralized Multi-Campus Trust Headquarters Portal',
      'Cross-Branch Treasury & Unified Financial Ledger',
      'Custom Subdomain & Automated SSL Certificates',
      'Choice Based Credit System (CBCS) & NEP 2020 Matrix',
      'Placement Drives & Corporate Recruiter Portal',
      'Custom Role Permissions & Granular Field-Level Security',
      'Automated Nightly Cloud Backups & Point-in-Time Recovery',
      'Dedicated Customer Success Architect with 99.9% SLA'
    ],
    excludedFeatures: []
  }
];

/**
 * GET /api/pricing/plans
 * Public endpoint to fetch published subscription plans
 */
router.get('/plans', (req, res) => {
  res.json({
    success: true,
    currency: 'INR',
    currencySymbol: '₹',
    gstRatePercent: 18,
    plans: PUBLIC_PRICING_PLANS
  });
});

/**
 * POST /api/pricing/quote
 * Deterministic pricing quote calculator with transparent volume rules
 */
router.post('/quote', (req, res) => {
  try {
    // 1. Consistent studentCount and students alias handling
    const rawStudentInput = req.body.studentCount !== undefined ? req.body.studentCount : req.body.students;
    if (rawStudentInput === undefined || rawStudentInput === null || rawStudentInput === '') {
      return res.status(400).json({
        success: false,
        error: 'studentCount is required.',
        code: 'MISSING_STUDENT_COUNT'
      });
    }

    const numStudents = Number(rawStudentInput);
    if (!Number.isFinite(numStudents) || isNaN(numStudents)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid studentCount: must be a valid finite number.',
        code: 'INVALID_STUDENT_COUNT'
      });
    }

    if (!Number.isInteger(numStudents)) {
      return res.status(400).json({
        success: false,
        error: 'Fractional student counts are not permitted. Please provide a whole integer.',
        code: 'FRACTIONAL_STUDENT_COUNT'
      });
    }

    if (numStudents < 1) {
      return res.status(400).json({
        success: false,
        error: 'Student count must be at least 1.',
        code: 'STUDENT_COUNT_BELOW_MINIMUM'
      });
    }

    if (numStudents > 25000) {
      return res.status(400).json({
        success: false,
        error: 'Student count exceeds maximum institutional tier limit of 25,000. Please contact Enterprise sales for custom deployments.',
        code: 'STUDENT_COUNT_EXCEEDS_MAXIMUM'
      });
    }

    // 2. Duration years validation
    const rawDurationInput = req.body.durationYears !== undefined ? req.body.durationYears : 1;
    const numDuration = Number(rawDurationInput);
    if (!Number.isFinite(numDuration) || isNaN(numDuration)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid durationYears: must be a finite number.',
        code: 'INVALID_DURATION_YEARS'
      });
    }

    if (!Number.isInteger(numDuration)) {
      return res.status(400).json({
        success: false,
        error: 'Fractional duration years are not permitted. Please provide a whole integer between 1 and 5.',
        code: 'FRACTIONAL_DURATION'
      });
    }

    if (numDuration < 1 || numDuration > 5) {
      return res.status(400).json({
        success: false,
        error: 'Duration must be between 1 and 5 years.',
        code: 'DURATION_OUT_OF_BOUNDS'
      });
    }

    // 3. Plan ID validation
    const validPlanIds = ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
    const planId = req.body.planId || 'PROFESSIONAL';
    if (!validPlanIds.includes(planId)) {
      return res.status(400).json({
        success: false,
        error: `Invalid planId '${planId}'. Allowed values: ${validPlanIds.join(', ')}`,
        code: 'INVALID_PLAN_ID'
      });
    }

    // 4. Billing cycle validation
    const billingCycle = req.body.billingCycle || 'YEARLY';
    if (!['YEARLY', 'MONTHLY'].includes(billingCycle)) {
      return res.status(400).json({
        success: false,
        error: "Invalid billingCycle. Allowed values are 'YEARLY' or 'MONTHLY'.",
        code: 'INVALID_BILLING_CYCLE'
      });
    }

    const plan = PUBLIC_PRICING_PLANS.find(p => p.id === planId) || PUBLIC_PRICING_PLANS[1];
    const students = numStudents;
    const years = numDuration;
    const isYearly = billingCycle === 'YEARLY';

    // Volume discount brackets on student tier
    let volumeDiscountPercent = 0;
    if (students > 3000) volumeDiscountPercent = 20;
    else if (students > 1500) volumeDiscountPercent = 15;
    else if (students > 800) volumeDiscountPercent = 10;
    else if (students > 400) volumeDiscountPercent = 5;

    // Multi-year commitment discount
    let multiYearDiscountPercent = 0;
    if (years >= 5) multiYearDiscountPercent = 20;
    else if (years >= 3) multiYearDiscountPercent = 15;
    else if (years >= 2) multiYearDiscountPercent = 10;

    // Total discount strictly capped at 40% maximum
    const totalDiscountPercent = Math.min(40, volumeDiscountPercent + multiYearDiscountPercent);

    // Completely ignore client-supplied prices or discounts — compute authoritative figures
    const baseCostPerYear = isYearly ? plan.baseYearlyPrice : plan.baseMonthlyPrice * 12;
    const studentCostPerYear = students * (isYearly ? plan.perStudentYearlyPrice : plan.perStudentMonthlyPrice * 12);
    const annualSubtotal = baseCostPerYear + studentCostPerYear;
    const grossTotal = annualSubtotal * years;

    const discountAmount = Math.round((grossTotal * totalDiscountPercent) / 100);
    const netTaxableAmount = Math.max(0, grossTotal - discountAmount);
    const gstAmount = Math.round(netTaxableAmount * 0.18);
    const grandTotalWithGst = netTaxableAmount + gstAmount;

    const effectiveMonthlyPerStudent = Math.round((netTaxableAmount / (students * 12 * years)) * 10) / 10;

    res.json({
      success: true,
      quote: {
        planId: plan.id,
        planName: plan.name,
        students,
        studentCount: students,
        durationYears: years,
        billingCycle: isYearly ? 'YEARLY' : 'MONTHLY',
        baseCostPerYear,
        studentCostPerYear,
        annualSubtotal,
        grossTotal,
        volumeDiscountPercent,
        multiYearDiscountPercent,
        totalDiscountPercent,
        discountAmount,
        netTaxableAmount,
        gstRatePercent: 18,
        gstAmount,
        grandTotalWithGst,
        effectiveMonthlyPerStudent,
        currency: 'INR',
        currencySymbol: '₹',
        isProvisional: true,
        disclaimer: 'This quote represents a provisional pricing estimate based on standard cloud tiers. Final commercial invoices may vary based on hardware telemetry add-ons and institutional SLA terms.',
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to calculate quote: ' + err.message });
  }
});

export default router;
