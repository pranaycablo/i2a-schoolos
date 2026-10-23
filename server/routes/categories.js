import express from 'express';
import { getDb } from '../db.js';
import {
  authenticateToken,
  requireRoles,
  logAuditEvent
} from '../middleware/auth.js';

const router = express.Router();

// ---------------------------------------------------------------------------
// Seed Data: 7 Primary Educational Institution Categories
// ---------------------------------------------------------------------------
export const SEED_CATEGORIES = [
  {
    id: 'cat-k12-schools',
    slug: 'k12-schools',
    name: 'K-12 Schools',
    subtitle: 'CBSE, ICSE, State Boards & International Schools',
    tagline: 'End-to-end campus administration, continuous evaluation & parent partnership',
    description: 'A comprehensive operating system engineered specifically for Indian K-12 private and government schools. Seamlessly bridges academic planning, automated attendance, board-compliant report cards, transport tracking, fee reconciliation, and parent communication.',
    icon: 'School',
    targetAudience: ['Principals', 'Trustees', 'Headmasters', 'Department Heads'],
    keyFeatures: [
      'CBSE Continuous Evaluation & Report Cards',
      'Multi-modal Attendance (Biometric / RFID / App)',
      'Comprehensive Fee Schedules & Online Collection',
      'Automated Timetable Generation with Substitution',
      'Parent-Teacher Mobile App with Instant Push Alerts',
      'School Bus GPS Live Tracking with Speed Geofencing'
    ],
    workflowHighlights: [
      {
        title: 'Admissions & Paperless Enrollment',
        description: 'Online inquiry, document verification, instant admission number generation, and automatic section assignment.'
      },
      {
        title: 'Academic & Exam Management',
        description: 'Term-wise grading, scholastic & co-scholastic rubrics, automatic marksheet generation compliant with board formats.'
      },
      {
        title: 'Automated Fee Collection',
        description: 'Quarterly and monthly fee cycles, automatic late fee calculation, instant digital receipts, and bank reconciliation.'
      }
    ],
    complianceStandards: ['CBSE Affiliation Bye-Laws 2018', 'State RTE Rules', 'ICSE Affiliation Regulations', 'POCSO Safety Protocols'],
    recommendedPlan: 'PROFESSIONAL',
    status: 'PUBLISHED',
    displayOrder: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-school-groups-trusts',
    slug: 'school-groups-trusts',
    name: 'School Groups & Educational Trusts',
    subtitle: 'Multi-Branch Governance & Centralized Oversight',
    tagline: 'Centralized financial oversight, cross-branch standardisation & unified reporting',
    description: 'Designed for educational societies, trusts, and corporate school networks operating 2 to 50+ campuses. Provides single-pane governance, centralized fee treasury, cross-branch curriculum alignment, unified staff management, and aggregated analytics.',
    icon: 'Building2',
    targetAudience: ['Board of Trustees', 'Chairs', 'Managing Directors', 'Chief Operating Officers'],
    keyFeatures: [
      'Cross-Branch Consolidated Financial Dashboard',
      'Centralized Curriculum & Lesson Plan Distribution',
      'Unified Staff Payroll & Centralized HR Rostering',
      'Group-Wide Admission Inquiries & Pipeline Tracking',
      'Standardized Vendor Procurement & Central Store Distribution',
      'Cross-Campus Academic Performance Benchmarking'
    ],
    workflowHighlights: [
      {
        title: 'Multi-Campus Governance',
        description: 'Single-pane visibility into admissions, fee collection percentages, and staffing vacancies across all sister campuses.'
      },
      {
        title: 'Centralized Procurement & Inventory',
        description: 'Consolidated vendor orders for uniforms, books, and science kits with seamless branch delivery allocation.'
      },
      {
        title: 'Consolidated Statutory Audits',
        description: 'Unified export of student registers, staff qualifications, and ledger accounts for trust auditors.'
      }
    ],
    complianceStandards: ['Charitable Trust Regulations', 'Multi-Campus Statutory Audits', 'State Education Board Guidelines'],
    recommendedPlan: 'ENTERPRISE',
    status: 'PUBLISHED',
    displayOrder: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-colleges-higher-ed',
    slug: 'colleges-higher-ed',
    name: 'Higher Education & Degree Colleges',
    subtitle: 'Undergraduate, Postgraduate & Autonomous Colleges',
    tagline: 'Credit-based grading, department-level autonomy & university compliance',
    description: 'A modular solution tailored for colleges and polytechnics implementing Choice Based Credit System (CBCS) and NEP 2020. Streamlines department course allocations, elective enrollments, semester hall tickets, internal evaluations, and placement drives.',
    icon: 'GraduationCap',
    targetAudience: ['Deans', 'Principals', 'Department Chairs', 'Registrars'],
    keyFeatures: [
      'Choice Based Credit System (CBCS) & NEP 2020 Matrix',
      'Department-Wise Elective Course Allocation',
      'Semester Exam Scheduling & Hall Ticket Generation',
      'Placement Cell Management & Campus Recruitment Tracking',
      'Faculty Workload & Research Publication Logging',
      'Library Barcode & Digital Repository Management'
    ],
    workflowHighlights: [
      {
        title: 'Course & Elective Registration',
        description: 'Students choose core, elective, and value-added courses with dynamic prerequisite and seat cap verification.'
      },
      {
        title: 'Continuous Internal Assessment (CIA)',
        description: 'Continuous assessment rubrics, mid-semester test marks, and attendance percentage merged into final grading sheets.'
      },
      {
        title: 'Placement & Degree Clearance',
        description: 'Automated credit audit, no-dues verification across departments, and placement interview scheduling.'
      }
    ],
    complianceStandards: ['UGC Minimum Standards', 'NAAC Accreditation Criteria', 'AICTE Approval Process Handbook'],
    recommendedPlan: 'ENTERPRISE',
    status: 'PUBLISHED',
    displayOrder: 3,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-coaching-institutes',
    slug: 'coaching-institutes',
    name: 'Coaching & Test-Prep Institutes',
    subtitle: 'JEE, NEET, UPSC, Foundation & Competitive Exam Academies',
    tagline: 'Batch-wise attendance, online test series & micro-level rank analytics',
    description: 'Built for high-performance competitive exam coaching institutions. Accelerates student results through multi-batch scheduling, CBT and OMR test evaluation, negative marking, all-India percentile rankings, and immediate parent SMS/WhatsApp notification.',
    icon: 'Target',
    targetAudience: ['Institute Founders', 'Academic Directors', 'Batch Coordinators'],
    keyFeatures: [
      'Subject/Batch-Wise Time Table & Flexible Scheduling',
      'OMR & Online Computer-Based Test (CBT) Series',
      'Negative Marking & Percentile Rank Analytics',
      'Automated SMS/WhatsApp Absence Alerts to Parents',
      'Installment-Based Fee Tracking with Automated Reminders',
      'Study Material & DPP (Daily Practice Problem) Distribution'
    ],
    workflowHighlights: [
      {
        title: 'Targeted Batch Allotment',
        description: 'Enrollment based on screening test marks, automated assignment to foundation or advanced target batches.'
      },
      {
        title: 'Test Series & Detailed Diagnostics',
        description: 'Question-level timing analysis, concept accuracy scores, and comparative percentile benchmark reports.'
      },
      {
        title: 'Installment & Scholarship Tracking',
        description: 'Custom fee plans, merit scholarship fee offsets, and instant digital payment reminders.'
      }
    ],
    complianceStandards: ['Consumer Protection Guidelines for Coaching Centers 2024', 'Local Municipal Registration'],
    recommendedPlan: 'PROFESSIONAL',
    status: 'PUBLISHED',
    displayOrder: 4,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-tuition-centres',
    slug: 'tuition-centres',
    name: 'Tuition Centres & Learning Hubs',
    subtitle: 'Evening Batches, Micro-Academies & Subject Specialists',
    tagline: 'Simplified batch management, flexible fee cards & zero-admin overhead',
    description: 'An agile, lightweight solution designed for neighborhood tuition hubs and specialized subject tutors. Offers fast mobile attendance, instant UPI payment links, student homework broadcast, and weekly parent progress cards without bureaucratic complexity.',
    icon: 'BookOpen',
    targetAudience: ['Center Managers', 'Individual Educators', 'Tutors'],
    keyFeatures: [
      'Quick Mobile Attendance Check-In',
      'Flexible Hourly/Monthly Student Fee Cards',
      'Digital UPI Payment Links with Auto-Receipts',
      'Homework & Worksheet WhatsApp Integration',
      'Small Batch Progress Cards & Parent Feedback',
      'Tutor Payroll & Revenue Share Calculation'
    ],
    workflowHighlights: [
      {
        title: 'One-Click Batch Setup',
        description: 'Set up morning, evening, or weekend classes by grade and topic in under two minutes.'
      },
      {
        title: 'UPI Payment Link Receipts',
        description: 'Direct payment links sent via WhatsApp with auto-generated branded PDF fee receipts.'
      },
      {
        title: 'Progress Notes to Parents',
        description: 'Weekly student progress notes with test score trends and personalized recommendations.'
      }
    ],
    complianceStandards: ['Shop & Establishment Act', 'Digital Personal Data Protection (DPDP) Act'],
    recommendedPlan: 'STARTER',
    status: 'PUBLISHED',
    displayOrder: 5,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-preschools',
    slug: 'preschools',
    name: 'Preschools & Early Childhood Centres',
    subtitle: 'Playgroups, Nursery, Kindergarten & Daycares',
    tagline: 'Milestone tracking, child safety logs & cheerful parent engagement',
    description: 'Engineered for early childhood educators caring for toddlers and preschoolers. Features daily food and nap logs, developmental milestone tracking aligned with NEP 2020 Foundational Stage, photo memory feed, and biometric pickup verification.',
    icon: 'Baby',
    targetAudience: ['Preschool Directors', 'Early Childhood Educators', 'Center Heads'],
    keyFeatures: [
      'Daily Activity Logs (Meals, Naps, Play, Mood)',
      'Child Milestones & Developmental Skill Reports',
      'Authorized Pickup Verification with Photo IDs',
      'Instant Photo & Video Sharing in Secure Parent Feed',
      'Sanitization & Health Checkup Record Logging',
      'Flexible Half-Day / Full-Day Daycare Billing'
    ],
    workflowHighlights: [
      {
        title: 'Secure Morning Handover',
        description: 'Health checklist, guardian signature, and instant confirmation notification to parents.'
      },
      {
        title: 'Montessori & NEP Milestone Mapping',
        description: 'Qualitative observations on fine motor, sensory, and social skills instead of numerical exams.'
      },
      {
        title: 'Safe Dismissal Protocol',
        description: 'Guardian photo verification before releasing child to authorized parent or driver.'
      }
    ],
    complianceStandards: ['Early Childhood Care and Education (ECCE) Guidelines', 'NEP 2020 Foundational Stage'],
    recommendedPlan: 'STARTER',
    status: 'PUBLISHED',
    displayOrder: 6,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 'cat-sports-arts-academies',
    slug: 'sports-arts-academies',
    name: 'Sports & Arts Academies',
    subtitle: 'Athletics, Martial Arts, Dance, Music & Creative Studios',
    tagline: 'Court/batch scheduling, skill assessment levels & tournament rosters',
    description: 'Designed for sports academies, martial arts dojos, dance academies, and music conservatories. Efficiently manages court and studio reservations, coach-to-student ratios, belt and grade certifications, seasonal camps, and tournament squads.',
    icon: 'Trophy',
    targetAudience: ['Academy Directors', 'Head Coaches', 'Studio Coordinators'],
    keyFeatures: [
      'Court, Pitch & Studio Slot Allocation',
      'Coach-to-Student Ratio Tracking',
      'Belt / Level / Grade Progression Assessments',
      'Tournament & Competition Registration Manager',
      'Equipment Inventory & Gear Issue Tracking',
      'Seasonal Camp & Workshop Booking Portal'
    ],
    workflowHighlights: [
      {
        title: 'Slot & Facility Booking',
        description: 'Automatic schedule management avoiding double-booking of sports courts or recording studios.'
      },
      {
        title: 'Skill Assessment & Belt Testing',
        description: 'Technical proficiency grading, video rubric logs, and automated graduation certificates.'
      },
      {
        title: 'Tournament Roster Management',
        description: 'Team selection, medical fitness documentation, and jersey number allotment for official competitions.'
      }
    ],
    complianceStandards: ['Sports Authority Guidelines', 'Child Safety & Safeguarding Protocols'],
    recommendedPlan: 'STARTER',
    status: 'PUBLISHED',
    displayOrder: 7,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
];

// ---------------------------------------------------------------------------
// Security & Validation Helpers
// ---------------------------------------------------------------------------
function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[<>'"&]/g, (char) => {
      switch (char) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case "'": return '&#39;';
        case '"': return '&quot;';
        case '&': return '&amp;';
        default: return char;
      }
    })
    .trim();
}

function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 60;
}

/**
 * Ensures the categories collection has seed data populated
 */
export async function ensureCategoriesSeeded() {
  try {
    const database = await getDb();
    const count = await database.collection('institution_categories').countDocuments();
    if (count === 0) {
      await database.collection('institution_categories').insertMany(SEED_CATEGORIES);
      await database.collection('institution_categories').createIndex({ slug: 1 }, { unique: true });
      await database.collection('institution_categories').createIndex({ status: 1, displayOrder: 1 });
      console.log('✅ [CategoryCMS] Initialized 7 institution categories.');
    }
  } catch (err) {
    console.warn('⚠️ [CategoryCMS] Seeding notice:', err.message);
  }
}

// ---------------------------------------------------------------------------
// Public Routes
// ---------------------------------------------------------------------------

/**
 * GET /api/categories
 * Returns all PUBLISHED categories sorted by displayOrder
 */
router.get('/', async (req, res) => {
  try {
    const database = await getDb();
    const totalCount = await database.collection('institution_categories').countDocuments();
    let categories;
    if (totalCount === 0) {
      categories = SEED_CATEGORIES.filter(c => c.status === 'PUBLISHED');
    } else {
      categories = await database.collection('institution_categories')
        .find({ status: 'PUBLISHED' })
        .sort({ displayOrder: 1 })
        .toArray();
    }

    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch categories: ' + err.message });
  }
});

/**
 * GET /api/categories/:slug
 * Returns single published category by slug or id
 */
router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const cleanSlug = String(slug).toLowerCase().trim();

    const database = await getDb();
    // Check database first for the slug/id regardless of status
    const categoryInDb = await database.collection('institution_categories').findOne({
      $or: [{ slug: cleanSlug }, { id: cleanSlug }]
    });

    if (categoryInDb) {
      // If it exists in DB but is not PUBLISHED (e.g. ARCHIVED or DRAFT), return 404 immediately
      if (categoryInDb.status !== 'PUBLISHED') {
        return res.status(404).json({
          success: false,
          error: `Category '${slug}' not found or not published.`,
          code: 'CATEGORY_NOT_FOUND'
        });
      }
      return res.json({
        success: true,
        category: categoryInDb
      });
    }

    // Only if collection is completely unseeded/empty do we check static seeds
    const totalCount = await database.collection('institution_categories').countDocuments();
    if (totalCount === 0) {
      const seedCat = SEED_CATEGORIES.find(c => (c.slug === cleanSlug || c.id === cleanSlug) && c.status === 'PUBLISHED');
      if (seedCat) {
        return res.json({
          success: true,
          category: seedCat
        });
      }
    }

    return res.status(404).json({
      success: false,
      error: `Category '${slug}' not found or not published.`,
      code: 'CATEGORY_NOT_FOUND'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch category: ' + err.message });
  }
});

// ---------------------------------------------------------------------------
// Admin Protected Routes (SUPER_ADMIN / PLATFORM_OPS only)
// ---------------------------------------------------------------------------

/**
 * GET /api/categories/admin/all
 * Returns all categories including DRAFT and ARCHIVED for management
 */
router.get('/admin/all', authenticateToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const database = await getDb();
    let categories = await database.collection('institution_categories')
      .find({})
      .sort({ displayOrder: 1 })
      .toArray();

    if (!categories || categories.length === 0) {
      categories = SEED_CATEGORIES;
    }

    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/categories
 * Creates a new institution category with strict validation
 */
router.post('/', authenticateToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const {
      name,
      slug,
      subtitle,
      tagline,
      description,
      icon = 'School',
      targetAudience = [],
      keyFeatures = [],
      workflowHighlights = [],
      complianceStandards = [],
      recommendedPlan = 'STARTER',
      status = 'DRAFT',
      displayOrder = 99
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Category name is required.' });
    }

    const cleanSlug = String(slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')).toLowerCase().trim();

    if (!isValidSlug(cleanSlug)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid slug format. Use lowercase alphanumeric characters and single hyphens (3-60 chars).'
      });
    }

    const database = await getDb();
    const existing = await database.collection('institution_categories').findOne({ slug: cleanSlug });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: `Category slug '${cleanSlug}' already exists. Slugs must be globally unique.`,
        code: 'SLUG_CONFLICT'
      });
    }

    const now = new Date().toISOString();
    const newCategory = {
      id: `cat-${cleanSlug}-${Date.now()}`,
      slug: cleanSlug,
      name: sanitizeInput(name),
      subtitle: sanitizeInput(subtitle || ''),
      tagline: sanitizeInput(tagline || ''),
      description: sanitizeInput(description || ''),
      icon: sanitizeInput(icon),
      targetAudience: Array.isArray(targetAudience) ? targetAudience.map(s => sanitizeInput(String(s))) : [],
      keyFeatures: Array.isArray(keyFeatures) ? keyFeatures.map(s => sanitizeInput(String(s))) : [],
      workflowHighlights: Array.isArray(workflowHighlights) ? workflowHighlights.map(w => ({
        title: sanitizeInput(String(w.title || '')),
        description: sanitizeInput(String(w.description || ''))
      })) : [],
      complianceStandards: Array.isArray(complianceStandards) ? complianceStandards.map(s => sanitizeInput(String(s))) : [],
      recommendedPlan: ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(recommendedPlan) ? recommendedPlan : 'STARTER',
      status: ['PUBLISHED', 'DRAFT', 'ARCHIVED'].includes(status) ? status : 'DRAFT',
      displayOrder: Number(displayOrder) || 99,
      createdAt: now,
      updatedAt: now,
      createdBy: req.user.id
    };

    await database.collection('institution_categories').insertOne(newCategory);

    await logAuditEvent({
      schoolId: 'PLATFORM',
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'CMS_CATEGORY_CREATED',
      module: 'CATEGORY_CMS',
      details: `Created institution category [${newCategory.name}] with slug [${newCategory.slug}]`,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, category: newCategory });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/categories/:id
 * Updates an existing category
 */
router.put('/:id', authenticateToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body || {};
    const database = await getDb();

    const category = await database.collection('institution_categories').findOne({
      $or: [{ id }, { slug: id }]
    });

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    // Check slug uniqueness if slug is being updated
    if (updates.slug && updates.slug !== category.slug) {
      const cleanSlug = String(updates.slug).toLowerCase().trim();
      if (!isValidSlug(cleanSlug)) {
        return res.status(400).json({ success: false, error: 'Invalid slug format.' });
      }
      const conflict = await database.collection('institution_categories').findOne({
        slug: cleanSlug,
        id: { $ne: category.id }
      });
      if (conflict) {
        return res.status(409).json({ success: false, error: 'Slug already in use by another category.' });
      }
      category.slug = cleanSlug;
    }

    const payload = {};
    if (updates.name) payload.name = sanitizeInput(updates.name);
    if (updates.subtitle !== undefined) payload.subtitle = sanitizeInput(updates.subtitle);
    if (updates.tagline !== undefined) payload.tagline = sanitizeInput(updates.tagline);
    if (updates.description !== undefined) payload.description = sanitizeInput(updates.description);
    if (updates.icon) payload.icon = sanitizeInput(updates.icon);
    if (updates.slug) payload.slug = updates.slug;
    if (Array.isArray(updates.targetAudience)) payload.targetAudience = updates.targetAudience.map(s => sanitizeInput(String(s)));
    if (Array.isArray(updates.keyFeatures)) payload.keyFeatures = updates.keyFeatures.map(s => sanitizeInput(String(s)));
    if (Array.isArray(updates.workflowHighlights)) payload.workflowHighlights = updates.workflowHighlights.map(w => ({
      title: sanitizeInput(String(w.title || '')),
      description: sanitizeInput(String(w.description || ''))
    }));
    if (Array.isArray(updates.complianceStandards)) payload.complianceStandards = updates.complianceStandards.map(s => sanitizeInput(String(s)));
    if (updates.recommendedPlan && ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(updates.recommendedPlan)) {
      payload.recommendedPlan = updates.recommendedPlan;
    }
    if (updates.status && ['PUBLISHED', 'DRAFT', 'ARCHIVED'].includes(updates.status)) {
      payload.status = updates.status;
    }
    if (updates.displayOrder !== undefined) {
      payload.displayOrder = Number(updates.displayOrder);
    }
    payload.updatedAt = new Date().toISOString();

    await database.collection('institution_categories').updateOne(
      { id: category.id },
      { $set: payload }
    );

    await logAuditEvent({
      schoolId: 'PLATFORM',
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'CMS_CATEGORY_UPDATED',
      module: 'CATEGORY_CMS',
      details: `Updated category [${category.id}]`,
      ipAddress: req.ip
    });

    const updated = await database.collection('institution_categories').findOne({ id: category.id });
    res.json({ success: true, category: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/categories/:id
 * Soft deletes / archives an institution category
 */
router.delete('/:id', authenticateToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const database = await getDb();

    const category = await database.collection('institution_categories').findOne({
      $or: [{ id }, { slug: id }]
    });

    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found.' });
    }

    await database.collection('institution_categories').updateOne(
      { id: category.id },
      {
        $set: {
          status: 'ARCHIVED',
          updatedAt: new Date().toISOString()
        }
      }
    );

    await logAuditEvent({
      schoolId: 'PLATFORM',
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'CMS_CATEGORY_ARCHIVED',
      module: 'CATEGORY_CMS',
      details: `Archived category [${category.id}] (${category.name})`,
      ipAddress: req.ip
    });

    res.json({ success: true, message: `Category '${category.name}' archived successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
