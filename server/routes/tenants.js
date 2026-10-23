import express from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { getDb } from '../db.js';
import {
  authenticateToken,
  enforceTenant,
  requireRoles,
  logAuditEvent,
  getJwtSecret
} from '../middleware/auth.js';
import { calculateAcademicSessionPolicy } from '../services/academicCalendarService.js';

const router = express.Router();

/**
 * GET /api/tenants
 * Lists school tenants with enriched branch counts and locations.
 * SUPER_ADMIN sees all; others see only their own tenant.
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const database = await getDb();
    let tenants = [];
    if (req.user.role === 'SUPER_ADMIN') {
      tenants = await database.collection('tenants').find({}).toArray();
    } else {
      const tenant = await database.collection('tenants').findOne({ id: req.user.schoolId });
      tenants = tenant ? [tenant] : [];
    }

    // Enrich tenants with branch counts and location summaries
    const schoolIds = tenants.map((t) => t.id);
    const branches = await database.collection('branches').find({
      institutionId: { $in: schoolIds },
      status: { $ne: 'ARCHIVED' }
    }).toArray();

    const branchMap = new Map();
    for (const b of branches) {
      if (!branchMap.has(b.institutionId)) {
        branchMap.set(b.institutionId, []);
      }
      branchMap.get(b.institutionId).push(b);
    }

    const enriched = tenants.map((t) => {
      const schoolBranches = branchMap.get(t.id) || [];
      const mainBranch = schoolBranches.find((b) => b.isMainBranch) || schoolBranches[0];
      return {
        ...t,
        branchCount: schoolBranches.length,
        branches: schoolBranches.map((b) => ({
          id: b.id,
          branchCode: b.branchCode,
          name: b.name,
          displayName: b.displayName,
          isMainBranch: b.isMainBranch,
          status: b.status,
          capacity: b.capacity,
          address: b.address,
          contact: b.contact
        })),
        location: t.location || (mainBranch ? mainBranch.address : {
          city: t.city,
          state: t.branding?.address?.split(',')?.pop()?.trim() || 'India',
          country: 'IN'
        })
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tenants/:schoolId
 * Fetches single tenant details enriched with branches
 */
router.get('/:schoolId', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const tenant = await database.collection('tenants').findOne({ id: req.params.schoolId });
    if (!tenant) return res.status(404).json({ error: 'Tenant not found.' });

    const branches = await database.collection('branches').find({
      institutionId: tenant.id,
      status: { $ne: 'ARCHIVED' }
    }).toArray();

    const mainBranch = branches.find((b) => b.isMainBranch) || branches[0];
    const enriched = {
      ...tenant,
      branchCount: branches.length,
      branches,
      location: tenant.location || (mainBranch ? mainBranch.address : null)
    };

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/tenants
 * Direct atomic school onboarding from i2A Platform Admin Console (SUPER_ADMIN only)
 */
router.post('/', authenticateToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const database = await getDb();
    const {
      name,
      code,
      board = 'CBSE',
      category = 'k12-schools',
      adminName,
      adminEmail,
      adminPhone,
      planId = 'PROFESSIONAL',
      billingCycle = 'YEARLY',
      address = {},
      initialBranch = {}
    } = req.body;

    // Validation
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'School name is required.', field: 'name' });
    }
    if (!adminName || typeof adminName !== 'string' || !adminName.trim()) {
      return res.status(400).json({ success: false, error: 'Administrator contact name is required.', field: 'adminName' });
    }
    if (!adminEmail || typeof adminEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) {
      return res.status(400).json({ success: false, error: 'Valid administrator email address is required.', field: 'adminEmail' });
    }
    if (!adminPhone || typeof adminPhone !== 'string' || adminPhone.trim().length < 7) {
      return res.status(400).json({ success: false, error: 'Valid administrator phone number is required.', field: 'adminPhone' });
    }

    // Coordinates Validation
    const lat = address.latitude !== undefined && address.latitude !== null && address.latitude !== '' ? Number(address.latitude) : null;
    const lng = address.longitude !== undefined && address.longitude !== null && address.longitude !== '' ? Number(address.longitude) : null;

    if (lat !== null && (isNaN(lat) || lat < -90 || lat > 90)) {
      return res.status(400).json({ success: false, error: 'Latitude must be between -90 and +90.', field: 'latitude' });
    }
    if (lng !== null && (isNaN(lng) || lng < -180 || lng > 180)) {
      return res.status(400).json({ success: false, error: 'Longitude must be between -180 and +180.', field: 'longitude' });
    }

    // Duplicate Check
    const trimmedName = name.trim();
    const existingSchool = await database.collection('tenants').findOne({
      name: { $regex: new RegExp(`^${trimmedName.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
    });
    if (existingSchool) {
      return res.status(409).json({
        success: false,
        error: `A school with the name "${trimmedName}" is already registered (ID: ${existingSchool.id}).`,
        code: 'DUPLICATE_SCHOOL_NAME'
      });
    }

    const trimmedEmail = adminEmail.trim();
    const existingUser = await database.collection('users').findOne({
      email: { $regex: new RegExp(`^${trimmedEmail.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') }
    });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: `An administrator account with email "${trimmedEmail}" is already registered.`,
        code: 'DUPLICATE_ADMIN_EMAIL'
      });
    }

    // Generate Unique School ID
    let tenantCount = await database.collection('tenants').countDocuments();
    let formattedId = `I2A-SCH-${String(tenantCount + 1).padStart(6, '0')}`;
    while (await database.collection('tenants').findOne({ id: formattedId })) {
      tenantCount += 1;
      formattedId = `I2A-SCH-${String(tenantCount + 1).padStart(6, '0')}`;
    }

    // Generate Unique Code
    const baseCode = (code ? code.replace(/[^A-Za-z0-9]/g, '') : trimmedName.replace(/[^A-Za-z0-9]/g, '').substring(0, 4) || 'SCH').toUpperCase();
    let cleanCode = baseCode;
    let suffix = 1;
    while (await database.collection('organizations').findOne({ orgCode: cleanCode }) || await database.collection('tenants').findOne({ code: cleanCode })) {
      cleanCode = `${baseCode}${suffix++}`;
    }

    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];
    const sessionPolicy = calculateAcademicSessionPolicy(category, nowIso);

    const schoolCity = address.city?.trim() || req.body.city?.trim() || 'Patna';
    const schoolState = address.state?.trim() || req.body.state?.trim() || 'Bihar';

    const cleanLocation = {
      street: address.street?.trim() || '',
      locality: address.locality?.trim() || '',
      city: schoolCity,
      district: address.district?.trim() || '',
      state: schoolState,
      postalCode: address.postalCode?.trim() || '',
      country: address.country?.trim() || 'IN',
      latitude: lat,
      longitude: lng,
      isGeocoded: Boolean(lat && lng)
    };

    // 1. Provision New Tenant Record
    const newTenant = {
      id: formattedId,
      name: trimmedName,
      code: `${cleanCode}-${schoolCity.toUpperCase().replace(/\s+/g, '')}`,
      board,
      category,
      city: schoolCity,
      adminName: adminName.trim(),
      adminEmail: adminEmail.trim(),
      adminPhone: adminPhone.trim(),
      planId,
      planName: `${planId.charAt(0) + planId.slice(1).toLowerCase()} Plan`,
      billingCycle,
      subscriptionStatus: 'ACTIVE',
      registeredAt: todayDate,
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      studentLimit: planId === 'ENTERPRISE' ? 5000 : planId === 'PROFESSIONAL' ? 1500 : 500,
      isOnboarded: true,
      location: cleanLocation,
      branding: {
        id: formattedId,
        name: trimmedName,
        tagline: 'Excellence in Education & Character Building',
        logoUrl: '',
        stampUrl: 'https://api.iconify.design/emojione-v1:approved.svg',
        principalSignatureUrl: 'https://api.iconify.design/ci:edit-pencil.svg',
        primaryColor: '#4F46E5',
        secondaryColor: '#06B6D4',
        address: `${cleanLocation.street ? cleanLocation.street + ', ' : ''}${schoolCity}, ${schoolState}${cleanLocation.postalCode ? ' - ' + cleanLocation.postalCode : ''}`,
        phone: adminPhone.trim(),
        email: adminEmail.trim(),
        whatsappNumber: adminPhone.trim(),
        website: `${cleanCode.toLowerCase()}.schoolos.in`,
        principalName: adminName.trim(),
        regNumber: `REG-${formattedId}`,
        board,
        medium: 'ENGLISH',
        academicSession: sessionPolicy.sessionName,
        invoiceHeader: trimmedName.toUpperCase(),
        invoiceFooter: 'Official Digital Fee Receipt - i2A SchoolOS',
        reportCardTheme: 'EMERALD_MODERN',
        certificateTheme: 'OFFICIAL'
      }
    };

    // 2. Provision Root Organization in Hierarchy
    const newOrg = {
      id: formattedId,
      name: trimmedName,
      orgCode: cleanCode,
      type: 'STANDALONE_INSTITUTION',
      status: 'ACTIVE',
      tenantId: formattedId,
      registeredDate: todayDate,
      contactEmail: adminEmail.trim(),
      contactPhone: adminPhone.trim(),
      address: `${schoolCity}, ${schoolState}`
    };

    // 3. Provision Administrator User
    const newAdminUser = {
      id: `USER-ADMIN-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: adminName.trim(),
      email: adminEmail.trim(),
      role: 'PRINCIPAL',
      schoolId: formattedId,
      tenantId: formattedId,
      isActive: true,
      createdAt: nowIso
    };

    // 4. Provision Initial Academic Session
    const newSession = {
      id: `SESS-${formattedId}-${sessionPolicy.sessionName}`,
      schoolId: formattedId,
      sessionName: sessionPolicy.sessionName,
      startDate: sessionPolicy.startDate,
      endDate: sessionPolicy.endDate,
      isCurrent: true,
      policy: sessionPolicy.policy
    };

    // 5. Provision Initial Main Branch
    const branchCode = (initialBranch.branchCode?.trim() || 'MAIN').toUpperCase();
    const branchName = initialBranch.name?.trim() || `${trimmedName} (Main Campus)`;
    const newBranch = {
      id: `BR-${formattedId}-${branchCode}-${Date.now().toString(36)}`,
      institutionId: formattedId,
      orgId: formattedId,
      branchCode,
      name: branchName,
      displayName: branchName,
      isMainBranch: true,
      institutionType: 'K12_SCHOOL',
      boardAffiliation: board,
      address: cleanLocation,
      contact: {
        email: adminEmail.trim(),
        phone: adminPhone.trim(),
        principalName: adminName.trim()
      },
      capacity: Number(initialBranch.capacity) || 1000,
      status: 'ACTIVE',
      createdAt: nowIso,
      updatedAt: nowIso,
      createdBy: req.user.id
    };

    await database.collection('tenants').insertOne(newTenant);
    await database.collection('organizations').insertOne(newOrg);
    await database.collection('users').insertOne(newAdminUser);
    await database.collection('academic_sessions').insertOne(newSession);
    await database.collection('branches').insertOne(newBranch);

    await logAuditEvent({
      schoolId: formattedId,
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'ONBOARD_SCHOOL_TENANT',
      module: 'PLATFORM_ADMIN',
      details: `Created new school tenant "${trimmedName}" (${formattedId}) with main branch "${branchCode}" and verified location.`,
      ipAddress: req.ip
    });

    const enrichedResult = {
      ...newTenant,
      branchCount: 1,
      branches: [newBranch]
    };

    res.status(201).json({
      success: true,
      message: `School "${trimmedName}" (${formattedId}) successfully onboarded and activated.`,
      tenant: enrichedResult,
      branch: newBranch
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/tenants/:schoolId/location
 * Updates official school location & coordinates with boundary validation
 */
router.put('/:schoolId/location', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN'), async (req, res) => {
  try {
    const database = await getDb();
    const targetId = req.user.role === 'SUPER_ADMIN' ? req.params.schoolId : req.user.schoolId;
    const { street, locality, city, district, state, postalCode, country = 'IN', latitude, longitude } = req.body;

    const lat = latitude !== undefined && latitude !== null && latitude !== '' ? Number(latitude) : null;
    const lng = longitude !== undefined && longitude !== null && longitude !== '' ? Number(longitude) : null;

    if (lat !== null && (isNaN(lat) || lat < -90 || lat > 90)) {
      return res.status(400).json({ success: false, error: 'Latitude must be between -90 and +90.' });
    }
    if (lng !== null && (isNaN(lng) || lng < -180 || lng > 180)) {
      return res.status(400).json({ success: false, error: 'Longitude must be between -180 and +180.' });
    }

    const locationUpdate = {
      street: street?.trim() || '',
      locality: locality?.trim() || '',
      city: city?.trim() || '',
      district: district?.trim() || '',
      state: state?.trim() || '',
      postalCode: postalCode?.trim() || '',
      country: country?.trim() || 'IN',
      latitude: lat,
      longitude: lng,
      isGeocoded: Boolean(lat && lng)
    };

    const formattedAddress = `${locationUpdate.street ? locationUpdate.street + ', ' : ''}${locationUpdate.city}, ${locationUpdate.state}${locationUpdate.postalCode ? ' - ' + locationUpdate.postalCode : ''}`;

    await database.collection('tenants').updateOne(
      { id: targetId },
      {
        $set: {
          location: locationUpdate,
          'branding.address': formattedAddress,
          city: locationUpdate.city || undefined,
          updatedAt: new Date().toISOString()
        }
      }
    );

    await database.collection('organizations').updateOne(
      { id: targetId },
      {
        $set: {
          address: formattedAddress,
          updatedAt: new Date().toISOString()
        }
      }
    );

    await logAuditEvent({
      schoolId: targetId,
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'UPDATE_SCHOOL_LOCATION',
      module: 'PLATFORM_ADMIN',
      details: `Updated location for school ${targetId}`,
      ipAddress: req.ip
    });

    res.json({ success: true, location: locationUpdate });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/tenants/:schoolId/branding
 * Updates school branding, colors, stamps, and signatures
 */
router.put('/:schoolId/branding', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN'), async (req, res) => {
  try {
    const database = await getDb();
    const updates = req.body || {};
    const brandingPayload = updates.branding && typeof updates.branding === 'object' ? updates.branding : updates;
    
    // Disallow tampering with school ID or plan ID in branding update
    delete brandingPayload.id;
    delete brandingPayload.schoolId;

    const targetTenantId = req.user.role === 'SUPER_ADMIN' ? req.params.schoolId : req.user.schoolId;
    const result = await database.collection('tenants').updateOne(
      { id: targetTenantId },
      {
        $set: {
          'branding': { ...brandingPayload, id: targetTenantId },
          updatedAt: new Date().toISOString()
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Tenant record not found or unauthorized.' });
    }

    await logAuditEvent({
      schoolId: targetTenantId,
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'UPDATE_BRANDING',
      module: 'SCHOOL_SETUP',
      details: `Updated school branding profile for ${targetTenantId}`,
      ipAddress: req.ip
    });

    const updated = await database.collection('tenants').findOne({ id: targetTenantId });
    res.json({ success: true, branding: updated.branding });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Phase 08 — Institution Onboarding State Machine & Verification Console
// ---------------------------------------------------------------------------

const VALID_CATEGORIES = [
  'k12-schools',
  'school-groups-trusts',
  'colleges-higher-ed',
  'coaching-test-prep',
  'preschools-daycare',
  'vocational-skill-centers',
  'sports-arts-academies'
];

const VALID_BOARDS = ['CBSE', 'ICSE', 'STATE_BOARD', 'IB', 'CAMBRIDGE', 'UNIVERSITY', 'OTHER'];

const sanitize = (val) => (typeof val === 'string' ? val.replace(/<[^>]*>/g, '').trim() : '');

/**
 * Failure Injection Lockdown Helper
 * Multi-factor fail-closed gate: active ONLY in isolated test harness against synthetic test DB
 * Client-supplied headers in production mode or against production DB are strictly ignored.
 */
export function isFailureInjectionAllowed(req, dbName) {
  if (process.env.NODE_ENV === 'production') {
    return false;
  }
  if (process.env.ALLOW_SYNTHETIC_FAILURE_INJECTION !== 'true' && process.env.VITEST !== 'true') {
    return false;
  }
  if (dbName !== 'i2a_schoolos_synthetic_test') {
    return false;
  }
  return true;
}

/**
 * Tracking Throttling & Brute-Force Rate Limiting Engine
 */
const failedTrackingAttempts = new Map();
const MAX_FAILED_TRACKING_ATTEMPTS = 5;
const TRACKING_LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

export function clearTrackingThrottlingCache() {
  failedTrackingAttempts.clear();
}

async function recordFailedTrackingAttempt(identifier) {
  if (!identifier) return null;
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  const current = failedTrackingAttempts.get(key) || { count: 0, lastFailed: now, lockedUntil: null };
  current.count += 1;
  current.lastFailed = now;
  if (current.count >= MAX_FAILED_TRACKING_ATTEMPTS) {
    current.lockedUntil = now + TRACKING_LOCKOUT_MS;
  }
  failedTrackingAttempts.set(key, current);

  try {
    const database = await getDb();
    await database.collection('tracking_attempts').updateOne(
      { identifier: key },
      {
        $set: {
          count: current.count,
          lastFailed: new Date(now),
          lockedUntil: current.lockedUntil ? new Date(current.lockedUntil) : null,
          updatedAt: new Date(now)
        }
      },
      { upsert: true }
    );
  } catch (e) {
    // In-memory fallback
  }
  return current;
}

async function isTrackingLocked(identifier) {
  if (!identifier) return false;
  const key = identifier.toLowerCase().trim();
  const now = Date.now();
  const mem = failedTrackingAttempts.get(key);
  if (mem && mem.lockedUntil && now < mem.lockedUntil) {
    const remainingSec = Math.ceil((mem.lockedUntil - now) / 1000);
    return { locked: true, remainingSec };
  }

  try {
    const database = await getDb();
    const doc = await database.collection('tracking_attempts').findOne({ identifier: key });
    if (doc && doc.lockedUntil) {
      const lockedUntilMs = new Date(doc.lockedUntil).getTime();
      if (now < lockedUntilMs) {
        const remainingSec = Math.ceil((lockedUntilMs - now) / 1000);
        failedTrackingAttempts.set(key, {
          count: doc.count,
          lastFailed: new Date(doc.lastFailed).getTime(),
          lockedUntil: lockedUntilMs
        });
        return { locked: true, remainingSec };
      }
    }
  } catch (e) {
    // In-memory fallback
  }
  return false;
}

async function clearTrackingAttempts(identifier) {
  if (!identifier) return;
  const key = identifier.toLowerCase().trim();
  failedTrackingAttempts.delete(key);
  try {
    const database = await getDb();
    await database.collection('tracking_attempts').deleteOne({ identifier: key });
  } catch (e) {}
}

/**
 * Validates application ownership for tracking, token rotation, and token revocation.
 * Accepts either:
 *  1. SUPER_ADMIN Bearer JWT
 *  2. High-entropy cryptographic tracking token (timing-safe hash comparison)
 */
export function verifyApplicationTrackingAuth(req, app) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const secret = getJwtSecret();
      const decoded = jwt.verify(token, secret);
      if (decoded && decoded.role === 'SUPER_ADMIN') {
        return { authorized: true, isSuperAdmin: true, user: decoded };
      }
    } catch (e) {
      // not a valid super admin token, fall through to tracking token check
    }
  }

  const trackingToken = req.headers['x-tracking-token'] || req.query?.token;
  if (!trackingToken) {
    return {
      authorized: false,
      status: 401,
      error: 'Access denied. Registered email alone is not sufficient proof of application ownership. Cryptographic tracking token is required.',
      code: 'TRACKING_TOKEN_REQUIRED'
    };
  }

  if (app.trackingTokenRevoked) {
    return {
      authorized: false,
      status: 403,
      error: 'The tracking token for this application has been revoked. Please contact support.',
      code: 'TRACKING_TOKEN_REVOKED'
    };
  }

  if (app.trackingTokenExpiresAt && new Date(app.trackingTokenExpiresAt) < new Date()) {
    return {
      authorized: false,
      status: 403,
      error: 'The tracking token for this application has expired. Please contact support.',
      code: 'TRACKING_TOKEN_EXPIRED'
    };
  }

  const inputHash = crypto.createHash('sha256').update(String(trackingToken).trim()).digest('hex');
  let isTokenMatch = false;
  if (app.trackingTokenHash && app.trackingTokenHash.length === inputHash.length) {
    try {
      isTokenMatch = crypto.timingSafeEqual(
        Buffer.from(app.trackingTokenHash, 'hex'),
        Buffer.from(inputHash, 'hex')
      );
    } catch (e) {
      isTokenMatch = false;
    }
  }

  if (!isTokenMatch) {
    return {
      authorized: false,
      status: 403,
      error: 'The provided tracking token is invalid for this application.',
      code: 'INVALID_TRACKING_TOKEN'
    };
  }

  return { authorized: true, isSuperAdmin: false };
}


/**
 * POST /api/tenants/applications
 * Public endpoint for new school application submission
 */
router.post('/applications', async (req, res) => {
  try {
    const data = req.body || {};
    const schoolName = sanitize(data.schoolName || '');
    const adminEmail = String(data.adminEmail || '').trim().toLowerCase();
    const adminPhone = String(data.adminPhone || '').trim();

    if (!schoolName || !adminEmail || !adminPhone) {
      return res.status(400).json({
        success: false,
        error: 'School/Institution name, administrator email, and mobile phone are required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(adminEmail)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email address format.'
      });
    }

    const phoneRegex = /^[+]?[0-9\s\-()]{10,20}$/;
    if (!phoneRegex.test(adminPhone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format. Provide a valid 10-digit mobile number.'
      });
    }

    const normalizedEmail = adminEmail.toLowerCase().trim();
    const database = await getDb();

    // Prevent spam and double submissions: 10-minute cooldown on pending applications with same email
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const existingRecentApp = await database.collection('school_applications').findOne({
      adminEmail: normalizedEmail,
      status: { $in: ['PENDING_VERIFICATION', 'UNDER_REVIEW', 'NEEDS_CORRECTION'] },
      submittedDate: { $gte: tenMinutesAgo }
    });

    if (existingRecentApp) {
      return res.status(429).json({
        success: false,
        error: 'An application for this email address was recently submitted and is pending verification. Please wait before submitting again.',
        code: 'DUPLICATE_APPLICATION_THROTTLED',
        applicationNo: existingRecentApp.applicationNo
      });
    }

    // Document metadata sanitization if present
    const documentsSubmitted = {};
    if (data.documentsSubmitted && typeof data.documentsSubmitted === 'object') {
      const allowedDocTypes = ['govtRegCert', 'affiliationDoc', 'principalIdDoc', 'taxExemptionCert'];
      for (const [key, val] of Object.entries(data.documentsSubmitted)) {
        if (allowedDocTypes.includes(key)) {
          if (typeof val === 'string') {
            documentsSubmitted[key] = sanitize(val).replace(/[^a-zA-Z0-9._-]/g, '_');
          } else if (val && typeof val === 'object') {
            const rawFileName = sanitize(val.fileName || 'document.pdf');
            const cleanFileName = rawFileName.replace(/[^a-zA-Z0-9._-]/g, '_');
            documentsSubmitted[key] = {
              type: sanitize(val.type || key),
              fileName: cleanFileName,
              fileSizeBytes: Math.min(10485760, Number(val.fileSizeBytes) || 1024),
              mimeType: ['application/pdf', 'image/png', 'image/jpeg'].includes(val.mimeType) ? val.mimeType : 'application/pdf',
              storageKey: `docs/tenants/pending/${Date.now()}_${cleanFileName}`,
              uploadedAt: new Date().toISOString()
            };
          }
        }
      }
    }

    // Cryptographically secure tracking token (256-bit entropy)
    const rawTrackingToken = crypto.randomBytes(32).toString('hex');
    const trackingTokenHash = crypto.createHash('sha256').update(rawTrackingToken).digest('hex');

    // Cryptographically secure application tracking number format (REG-YYYY-XXXXXX)
    const year = new Date().getFullYear();
    const randomDigits = crypto.randomInt(100000, 1000000);
    const appNo = `REG-${year}-${randomDigits}`;

    const category = VALID_CATEGORIES.includes(data.category) ? data.category : 'k12-schools';
    const board = VALID_BOARDS.includes(data.board) ? data.board : 'CBSE';
    const nowIso = new Date().toISOString();

    // Strict field whitelist to prevent tamper / privilege injection
    const newApp = {
      id: `APP-SCH-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      applicationNo: appNo,
      schoolName,
      category,
      board,
      adminName: sanitize(data.adminName || 'Institution Lead'),
      adminEmail: normalizedEmail,
      adminPhone,
      city: sanitize(data.city || 'Patna'),
      state: sanitize(data.state || 'Bihar'),
      estimatedStudents: Math.max(1, Math.min(50000, Number(data.estimatedStudents) || 300)),
      planInterest: ['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(data.planInterest || data.planId)
        ? (data.planInterest || data.planId)
        : 'PROFESSIONAL',
      notes: sanitize(data.notes || data.message || ''),
      submittedDate: nowIso,
      status: 'PENDING_VERIFICATION',
      verified: false,
      trackingTokenHash,
      trackingTokenCreatedAt: nowIso,
      trackingTokenExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      trackingTokenRevoked: false,
      documentsSubmitted,
      verificationChecklist: {
        docVerified: false,
        contactVerified: false,
        boardAffiliationVerified: false
      },
      statusHistory: [
        {
          status: 'PENDING_VERIFICATION',
          changedAt: nowIso,
          changedBy: 'PUBLIC_APPLICANT',
          actorRole: 'APPLICANT',
          notes: 'Application submitted via public trial registration'
        }
      ]
    };

    try {
      await database.collection('school_applications').insertOne(newApp);
    } catch (insertErr) {
      // Concurrency collision caught by MongoDB partial unique index
      if (insertErr.code === 11000 || (insertErr.message && insertErr.message.includes('E11000'))) {
        const winningApp = await database.collection('school_applications').findOne({
          adminEmail: normalizedEmail,
          status: 'PENDING_VERIFICATION'
        });
        return res.status(429).json({
          success: false,
          error: 'An application for this email address is already pending verification. Please wait for our team to review your application.',
          code: 'DUPLICATE_APPLICATION_THROTTLED',
          applicationNo: winningApp?.applicationNo || 'PENDING'
        });
      }
      throw insertErr;
    }

    // Emit notification to platform queue
    await database.collection('notifications').insertOne({
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      schoolId: 'PLATFORM',
      recipientEmail: normalizedEmail,
      type: 'APPLICATION_SUBMITTED',
      title: 'School Application Received',
      message: `Thank you for registering [${newApp.schoolName}]. Your tracking reference is ${appNo}.`,
      applicationNo: appNo,
      createdAt: nowIso,
      read: false
    });

    await logAuditEvent({
      schoolId: 'PLATFORM',
      userId: 'PUBLIC_APPLICANT',
      userName: newApp.adminName,
      role: 'APPLICANT',
      action: 'SCHOOL_APPLICATION_SUBMITTED',
      module: 'PLATFORM_ADMIN',
      resourceType: 'school_applications',
      details: `New institution applied: [${newApp.schoolName}] (${newApp.category}). Application No: ${appNo}`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully. Our verification team will review your institution credentials within 24-48 hours.',
      applicationNo: appNo,
      trackingToken: rawTrackingToken,
      application: {
        ...newApp,
        trackingToken: rawTrackingToken
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/tenants/applications/status/:applicationNo
 * Secure public tracking endpoint for applicant to verify review progress.
 * Enforces mandatory cryptographic ownership verification via tracking token or super admin session.
 * Registered email alone is strictly NOT accepted as proof of ownership.
 */
router.get('/applications/status/:applicationNo', async (req, res) => {
  try {
    const { applicationNo } = req.params;
    const cleanNo = String(applicationNo).trim();
    const rateLimitKey = `track:${cleanNo}:${req.ip || 'client'}`;

    // 1. Check brute-force rate limiting lock
    const lockStatus = await isTrackingLocked(rateLimitKey);
    if (lockStatus && lockStatus.locked) {
      return res.status(429).json({
        success: false,
        error: `Too many failed tracking attempts. Access temporarily locked for ${lockStatus.remainingSec} seconds.`,
        code: 'TRACKING_RATE_LIMITED',
        remainingSec: lockStatus.remainingSec
      });
    }

    const database = await getDb();
    const app = await database.collection('school_applications').findOne({
      $or: [{ applicationNo: cleanNo }, { id: cleanNo }]
    });

    if (!app) {
      await recordFailedTrackingAttempt(rateLimitKey);
      return res.status(404).json({
        success: false,
        error: `Application with tracking number '${cleanNo}' was not found.`,
        code: 'APPLICATION_NOT_FOUND'
      });
    }

    const authResult = verifyApplicationTrackingAuth(req, app);
    if (!authResult.authorized) {
      await recordFailedTrackingAttempt(rateLimitKey);
      return res.status(authResult.status).json({
        success: false,
        error: authResult.error,
        code: authResult.code
      });
    }

    // If applicant email is also provided as a secondary constraint, it must match
    const applicantEmail = req.headers['x-applicant-email'] || req.query.email;
    if (!authResult.isSuperAdmin && applicantEmail && typeof applicantEmail === 'string') {
      if (app.adminEmail && app.adminEmail.toLowerCase() !== applicantEmail.trim().toLowerCase()) {
        await recordFailedTrackingAttempt(rateLimitKey);
        return res.status(403).json({
          success: false,
          error: 'Email address does not match this application tracking record.',
          code: 'EMAIL_MISMATCH'
        });
      }
    }

    // Clear failed attempts upon successful verification
    await clearTrackingAttempts(rateLimitKey);

    // Return safe public tracking payload (zero internal reviewer IDs, internal checklists, documents, or tenant IDs)
    res.json({
      success: true,
      application: {
        applicationNo: app.applicationNo,
        schoolName: app.schoolName,
        category: app.category,
        board: app.board,
        city: app.city,
        state: app.state,
        status: app.status,
        submittedDate: app.submittedDate,
        reviewedAt: app.reviewedAt,
        correctionNotes: app.status === 'NEEDS_CORRECTION' ? app.correctionNotes : undefined,
        rejectionReason: app.status === 'REJECTED' ? app.rejectionReason : undefined,
        approvedAt: app.status === 'APPROVED' ? app.approvedAt : undefined
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tenants/applications/:appId/rotate-tracking-token
 * Rotates the cryptographic tracking token for an application.
 * Requires either valid current tracking token or SUPER_ADMIN authorization.
 */
router.post('/applications/:appId/rotate-tracking-token', async (req, res) => {
  try {
    const { appId } = req.params;
    const cleanAppId = String(appId).trim();
    const rateLimitKey = `track:${cleanAppId}:${req.ip || 'client'}`;

    const lockStatus = await isTrackingLocked(rateLimitKey);
    if (lockStatus && lockStatus.locked) {
      return res.status(429).json({
        success: false,
        error: `Too many failed attempts. Access temporarily locked for ${lockStatus.remainingSec} seconds.`,
        code: 'TRACKING_RATE_LIMITED',
        remainingSec: lockStatus.remainingSec
      });
    }

    const database = await getDb();
    const app = await database.collection('school_applications').findOne({
      $or: [{ id: cleanAppId }, { applicationNo: cleanAppId }]
    });

    if (!app) {
      await recordFailedTrackingAttempt(rateLimitKey);
      return res.status(404).json({ success: false, error: 'Application not found.', code: 'APPLICATION_NOT_FOUND' });
    }

    const authResult = verifyApplicationTrackingAuth(req, app);
    if (!authResult.authorized) {
      await recordFailedTrackingAttempt(rateLimitKey);
      return res.status(authResult.status).json({ success: false, error: authResult.error, code: authResult.code });
    }

    await clearTrackingAttempts(rateLimitKey);

    const newRawToken = crypto.randomBytes(32).toString('hex');
    const newHash = crypto.createHash('sha256').update(newRawToken).digest('hex');
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = new Date().toISOString();

    await database.collection('school_applications').updateOne(
      { _id: app._id },
      {
        $set: {
          trackingTokenHash: newHash,
          trackingTokenExpiresAt: newExpiresAt,
          trackingTokenRevoked: false,
          trackingTokenRotatedAt: nowIso,
          updatedAt: nowIso
        },
        $push: {
          statusHistory: {
            status: app.status,
            changedAt: nowIso,
            changedBy: authResult.isSuperAdmin ? authResult.user?.id || 'SUPER_ADMIN' : 'APPLICANT',
            actorRole: authResult.isSuperAdmin ? 'SUPER_ADMIN' : 'APPLICANT',
            notes: 'Application tracking token rotated.'
          }
        }
      }
    );

    await logAuditEvent({
      schoolId: 'PLATFORM',
      userId: authResult.isSuperAdmin ? authResult.user?.id : 'PUBLIC_APPLICANT',
      userName: authResult.isSuperAdmin ? authResult.user?.name : app.adminName,
      role: authResult.isSuperAdmin ? 'SUPER_ADMIN' : 'APPLICANT',
      action: 'APPLICATION_TRACKING_TOKEN_ROTATED',
      module: 'PLATFORM_ADMIN',
      resourceType: 'school_applications',
      details: `Tracking token rotated for application [${app.applicationNo}]`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Tracking token rotated successfully.',
      trackingToken: newRawToken,
      expiresAt: newExpiresAt
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tenants/applications/:appId/revoke-tracking-token
 * Revokes the cryptographic tracking token for an application.
 * Requires either valid current tracking token or SUPER_ADMIN authorization.
 */
router.post('/applications/:appId/revoke-tracking-token', async (req, res) => {
  try {
    const { appId } = req.params;
    const cleanAppId = String(appId).trim();
    const rateLimitKey = `track:${cleanAppId}:${req.ip || 'client'}`;

    const lockStatus = await isTrackingLocked(rateLimitKey);
    if (lockStatus && lockStatus.locked) {
      return res.status(429).json({
        success: false,
        error: `Too many failed attempts. Access temporarily locked for ${lockStatus.remainingSec} seconds.`,
        code: 'TRACKING_RATE_LIMITED',
        remainingSec: lockStatus.remainingSec
      });
    }

    const database = await getDb();
    const app = await database.collection('school_applications').findOne({
      $or: [{ id: cleanAppId }, { applicationNo: cleanAppId }]
    });

    if (!app) {
      await recordFailedTrackingAttempt(rateLimitKey);
      return res.status(404).json({ success: false, error: 'Application not found.', code: 'APPLICATION_NOT_FOUND' });
    }

    const authResult = verifyApplicationTrackingAuth(req, app);
    if (!authResult.authorized) {
      await recordFailedTrackingAttempt(rateLimitKey);
      return res.status(authResult.status).json({ success: false, error: authResult.error, code: authResult.code });
    }

    await clearTrackingAttempts(rateLimitKey);

    const nowIso = new Date().toISOString();

    await database.collection('school_applications').updateOne(
      { _id: app._id },
      {
        $set: {
          trackingTokenRevoked: true,
          trackingTokenRevokedAt: nowIso,
          updatedAt: nowIso
        },
        $push: {
          statusHistory: {
            status: app.status,
            changedAt: nowIso,
            changedBy: authResult.isSuperAdmin ? authResult.user?.id || 'SUPER_ADMIN' : 'APPLICANT',
            actorRole: authResult.isSuperAdmin ? 'SUPER_ADMIN' : 'APPLICANT',
            notes: 'Application tracking token explicitly revoked.'
          }
        }
      }
    );

    await logAuditEvent({
      schoolId: 'PLATFORM',
      userId: authResult.isSuperAdmin ? authResult.user?.id : 'PUBLIC_APPLICANT',
      userName: authResult.isSuperAdmin ? authResult.user?.name : app.adminName,
      role: authResult.isSuperAdmin ? 'SUPER_ADMIN' : 'APPLICANT',
      action: 'APPLICATION_TRACKING_TOKEN_REVOKED',
      module: 'PLATFORM_ADMIN',
      resourceType: 'school_applications',
      details: `Tracking token revoked for application [${app.applicationNo}]`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Tracking token revoked successfully.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});


/**
 * PUT /api/tenants/applications/:appId/resubmit
 * Public applicant correction endpoint for applications in NEEDS_CORRECTION state
 */
router.put('/applications/:appId/resubmit', async (req, res) => {
  try {
    const { appId } = req.params;
    const database = await getDb();
    const app = await database.collection('school_applications').findOne({
      $or: [{ id: appId }, { applicationNo: appId }]
    });

    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found.', code: 'APPLICATION_NOT_FOUND' });
    }

    if (app.status !== 'NEEDS_CORRECTION') {
      return res.status(409).json({
        success: false,
        error: `Cannot resubmit application in '${app.status}' status. Resubmission is only valid for 'NEEDS_CORRECTION'.`,
        code: 'INVALID_STATE_TRANSITION'
      });
    }

    const data = req.body || {};
    const updates = {
      updatedAt: new Date().toISOString(),
      status: 'PENDING_VERIFICATION'
    };

    if (data.schoolName) updates.schoolName = sanitize(data.schoolName);
    if (data.adminPhone) updates.adminPhone = sanitize(data.adminPhone);
    if (data.city) updates.city = sanitize(data.city);
    if (data.state) updates.state = sanitize(data.state);
    if (data.notes) updates.notes = sanitize(data.notes);
    if (data.board && VALID_BOARDS.includes(data.board)) updates.board = data.board;
    if (data.estimatedStudents) updates.estimatedStudents = Math.max(1, Math.min(50000, Number(data.estimatedStudents) || 300));
    if (data.documentsSubmitted) updates.documentsSubmitted = { ...app.documentsSubmitted, ...data.documentsSubmitted };

    const historyItem = {
      status: 'PENDING_VERIFICATION',
      changedAt: new Date().toISOString(),
      changedBy: 'PUBLIC_APPLICANT',
      actorRole: 'APPLICANT',
      notes: sanitize(data.resubmissionNotes || 'Applicant submitted requested corrections')
    };

    await database.collection('school_applications').updateOne(
      { _id: app._id },
      {
        $set: updates,
        $push: { statusHistory: historyItem }
      }
    );

    await logAuditEvent({
      schoolId: 'PLATFORM',
      userId: 'PUBLIC_APPLICANT',
      userName: app.adminName,
      role: 'APPLICANT',
      action: 'APPLICATION_RESUBMITTED',
      module: 'PLATFORM_ADMIN',
      details: `Corrections submitted for [${app.schoolName}] (${app.applicationNo})`,
      ipAddress: req.ip
    });

    const updatedApp = await database.collection('school_applications').findOne({ _id: app._id });
    res.json({
      success: true,
      message: 'Corrections submitted successfully. Application returned to review queue.',
      application: updatedApp
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/tenants/applications/queue
 * SUPER_ADMIN only queue of pending school applications with search, status filters & pagination
 */
router.get('/applications/queue', authenticateToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const database = await getDb();
    const { status, category, search, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status && status !== 'ALL') {
      filter.status = status;
    }
    if (category && category !== 'ALL') {
      filter.category = category;
    }
    if (search) {
      const cleanSearch = String(search).trim();
      filter.$or = [
        { schoolName: { $regex: cleanSearch, $options: 'i' } },
        { applicationNo: { $regex: cleanSearch, $options: 'i' } },
        { adminEmail: { $regex: cleanSearch, $options: 'i' } },
        { city: { $regex: cleanSearch, $options: 'i' } }
      ];
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Math.min(50, Number(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const total = await database.collection('school_applications').countDocuments(filter);
    const apps = await database.collection('school_applications')
      .find(filter)
      .sort({ submittedDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .toArray();

    res.json({
      success: true,
      count: apps.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      },
      applications: apps
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/tenants/applications/:appId
 * SUPER_ADMIN full detail view of a single application
 */
router.get('/applications/:appId', authenticateToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const database = await getDb();
    const app = await database.collection('school_applications').findOne({
      $or: [{ id: req.params.appId }, { applicationNo: req.params.appId }]
    });

    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found.', code: 'APPLICATION_NOT_FOUND' });
    }

    res.json({ success: true, application: app });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tenants/applications/:appId/review
 * SUPER_ADMIN marks application as UNDER_REVIEW
 */
router.post('/applications/:appId/review', authenticateToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const database = await getDb();
    const app = await database.collection('school_applications').findOne({
      $or: [{ id: req.params.appId }, { applicationNo: req.params.appId }]
    });

    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    // Idempotent if already UNDER_REVIEW
    if (app.status === 'UNDER_REVIEW') {
      return res.json({ success: true, message: 'Application is already under review.', application: app });
    }

    // Reject invalid terminal states
    if (['APPROVED', 'REJECTED', 'CANCELLED'].includes(app.status)) {
      return res.status(409).json({
        success: false,
        error: `Cannot review an application in terminal '${app.status}' status.`,
        code: 'INVALID_STATE_TRANSITION'
      });
    }

    const nowIso = new Date().toISOString();
    const historyItem = {
      status: 'UNDER_REVIEW',
      changedAt: nowIso,
      changedBy: req.user.id,
      actorRole: req.user.role,
      notes: sanitize(req.body.notes || 'Reviewer started credential inspection')
    };

    await database.collection('school_applications').updateOne(
      { _id: app._id },
      {
        $set: {
          status: 'UNDER_REVIEW',
          reviewerId: req.user.id,
          reviewerName: req.user.name || 'Platform Reviewer',
          reviewedAt: nowIso
        },
        $push: { statusHistory: historyItem }
      }
    );

    await logAuditEvent({
      schoolId: 'PLATFORM',
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'APPLICATION_MOVED_UNDER_REVIEW',
      module: 'PLATFORM_ADMIN',
      resourceType: 'school_applications',
      details: `Review started for application [${app.applicationNo}] - ${app.schoolName}`,
      ipAddress: req.ip
    });

    const updated = await database.collection('school_applications').findOne({ _id: app._id });
    res.json({ success: true, application: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tenants/applications/:appId/request-correction
 * SUPER_ADMIN flags missing/unclear info and transitions to NEEDS_CORRECTION
 */
router.post('/applications/:appId/request-correction', authenticateToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const rawNotes = req.body.correctionNotes || req.body.notes || '';
    const cleanNotes = sanitize(rawNotes);
    if (!cleanNotes || cleanNotes.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Correction notes are required (at least 5 characters explaining what the applicant must rectify).',
        code: 'MISSING_CORRECTION_NOTES'
      });
    }

    const database = await getDb();
    const app = await database.collection('school_applications').findOne({
      $or: [{ id: req.params.appId }, { applicationNo: req.params.appId }]
    });

    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    if (['APPROVED', 'REJECTED', 'CANCELLED'].includes(app.status)) {
      return res.status(409).json({
        success: false,
        error: `Cannot request correction on an application in '${app.status}' status.`,
        code: 'INVALID_STATE_TRANSITION'
      });
    }

    const nowIso = new Date().toISOString();
    const historyItem = {
      status: 'NEEDS_CORRECTION',
      changedAt: nowIso,
      changedBy: req.user.id,
      actorRole: req.user.role,
      notes: cleanNotes
    };

    await database.collection('school_applications').updateOne(
      { _id: app._id },
      {
        $set: {
          status: 'NEEDS_CORRECTION',
          correctionNotes: cleanNotes,
          updatedAt: nowIso
        },
        $push: { statusHistory: historyItem }
      }
    );

    // Emit applicant notification
    await database.collection('notifications').insertOne({
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      schoolId: 'PLATFORM',
      recipientEmail: app.adminEmail,
      type: 'APPLICATION_NEEDS_CORRECTION',
      title: 'Action Required on Institution Application',
      message: `Your application [${app.applicationNo}] requires clarification: ${cleanNotes}`,
      applicationNo: app.applicationNo,
      createdAt: nowIso,
      read: false
    });

    await logAuditEvent({
      schoolId: 'PLATFORM',
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'APPLICATION_CORRECTION_REQUESTED',
      module: 'PLATFORM_ADMIN',
      resourceType: 'school_applications',
      details: `Correction requested for [${app.applicationNo}]: "${cleanNotes}"`,
      ipAddress: req.ip
    });

    const updated = await database.collection('school_applications').findOne({ _id: app._id });
    res.json({ success: true, message: 'Correction request sent to applicant.', application: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/tenants/applications/:appId/checklist
 * SUPER_ADMIN updates internal verification checklist
 */
router.put('/applications/:appId/checklist', authenticateToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const database = await getDb();
    const app = await database.collection('school_applications').findOne({
      $or: [{ id: req.params.appId }, { applicationNo: req.params.appId }]
    });

    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    if (['REJECTED', 'CANCELLED'].includes(app.status)) {
      return res.status(409).json({
        success: false,
        error: `Cannot update verification checklist for application in '${app.status}' status.`,
        code: 'INVALID_STATE_TRANSITION'
      });
    }

    const { checklist = {} } = req.body;
    const nowIso = new Date().toISOString();

    const updatedChecklist = {
      ...(app.verificationChecklist || {}),
      docVerified: Boolean(checklist.docVerified ?? app.verificationChecklist?.docVerified),
      contactVerified: Boolean(checklist.contactVerified ?? app.verificationChecklist?.contactVerified),
      boardAffiliationVerified: Boolean(checklist.boardAffiliationVerified ?? app.verificationChecklist?.boardAffiliationVerified),
      identityVerified: Boolean(checklist.identityVerified ?? app.verificationChecklist?.identityVerified),
      documentAuthenticityVerified: Boolean(checklist.documentAuthenticityVerified ?? app.verificationChecklist?.documentAuthenticityVerified),
      affiliationVerified: Boolean(checklist.affiliationVerified ?? app.verificationChecklist?.affiliationVerified),
      addressVerified: Boolean(checklist.addressVerified ?? app.verificationChecklist?.addressVerified),
      feeCommercialVerified: Boolean(checklist.feeCommercialVerified ?? app.verificationChecklist?.feeCommercialVerified),
      antiFraudCheckPassed: Boolean(checklist.antiFraudCheckPassed ?? app.verificationChecklist?.antiFraudCheckPassed),
      verifiedBy: req.user.id,
      verifiedAt: nowIso
    };

    await database.collection('school_applications').updateOne(
      { _id: app._id },
      { $set: { verificationChecklist: updatedChecklist, updatedAt: nowIso } }
    );

    await logAuditEvent({
      schoolId: 'PLATFORM',
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'APPLICATION_CHECKLIST_UPDATED',
      module: 'PLATFORM_ADMIN',
      resourceType: 'school_applications',
      details: `Checklist updated for [${app.applicationNo}]`,
      ipAddress: req.ip
    });

    res.json({ success: true, verificationChecklist: updatedChecklist });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tenants/applications/:appId/reject
 * SUPER_ADMIN rejects application with documented reason code
 */
router.post('/applications/:appId/reject', authenticateToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const rawReason = req.body.rejectionReason || req.body.reason || '';
    const cleanReason = sanitize(rawReason);
    if (!cleanReason || cleanReason.length < 5) {
      return res.status(400).json({
        success: false,
        error: 'A rejection reason is required (minimum 5 characters).',
        code: 'MISSING_REJECTION_REASON'
      });
    }

    const database = await getDb();
    const app = await database.collection('school_applications').findOne({
      $or: [{ id: req.params.appId }, { applicationNo: req.params.appId }]
    });

    if (!app) {
      return res.status(404).json({ success: false, error: 'Application not found.' });
    }

    // Idempotent if already REJECTED
    if (app.status === 'REJECTED') {
      return res.json({ success: true, message: 'Application is already rejected.', application: app });
    }

    if (app.status === 'APPROVED') {
      return res.status(409).json({
        success: false,
        error: 'Cannot reject an application that has already been approved and provisioned as an active tenant.',
        code: 'CANNOT_REJECT_APPROVED_TENANT'
      });
    }

    const nowIso = new Date().toISOString();
    const historyItem = {
      status: 'REJECTED',
      changedAt: nowIso,
      changedBy: req.user.id,
      actorRole: req.user.role,
      notes: cleanReason
    };

    await database.collection('school_applications').updateOne(
      { _id: app._id },
      {
        $set: {
          status: 'REJECTED',
          rejectionReason: cleanReason,
          rejectionCode: sanitize(req.body.reasonCode || 'DOCUMENTS_INELIGIBLE'),
          rejectedBy: req.user.id,
          rejectedAt: nowIso
        },
        $push: { statusHistory: historyItem }
      }
    );

    // Notification
    await database.collection('notifications').insertOne({
      id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      schoolId: 'PLATFORM',
      recipientEmail: app.adminEmail,
      type: 'APPLICATION_REJECTED',
      title: 'Update on Institution Application',
      message: `Your application [${app.applicationNo}] was not approved: ${cleanReason}`,
      applicationNo: app.applicationNo,
      createdAt: nowIso,
      read: false
    });

    await logAuditEvent({
      schoolId: 'PLATFORM',
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'APPLICATION_REJECTED',
      module: 'PLATFORM_ADMIN',
      resourceType: 'school_applications',
      details: `Application [${app.applicationNo}] rejected: "${cleanReason}"`,
      ipAddress: req.ip
    });

    const updated = await database.collection('school_applications').findOne({ _id: app._id });
    res.json({ success: true, message: 'Application rejected.', application: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tenants/applications/:appId/approve
 * SUPER_ADMIN approval with atomic, idempotent tenant, organization & admin provisioning
 */
router.post('/applications/:appId/approve', authenticateToken, requireRoles('SUPER_ADMIN'), async (req, res) => {
  try {
    const database = await getDb();
    const app = await database.collection('school_applications').findOne({
      $or: [{ id: req.params.appId }, { applicationNo: req.params.appId }]
    });

    if (!app) return res.status(404).json({ success: false, error: 'Application not found.' });

    // IDEMPOTENCY CHECK: If already approved, return existing tenant without creating duplicates
    if (app.status === 'APPROVED' && app.tenantId) {
      const existingTenant = await database.collection('tenants').findOne({ id: app.tenantId });
      return res.json({
        success: true,
        message: 'Application is already approved and provisioned.',
        tenant: existingTenant,
        idempotent: true
      });
    }

    // Invalid transition checks
    if (['REJECTED', 'CANCELLED'].includes(app.status)) {
      return res.status(409).json({
        success: false,
        error: `Cannot approve application in '${app.status}' status.`,
        code: 'INVALID_STATE_TRANSITION'
      });
    }

    let tenantCount = await database.collection('tenants').countDocuments();
    let formattedId = `I2A-SCH-${String(tenantCount + 1).padStart(6, '0')}`;
    while (await database.collection('tenants').findOne({ id: formattedId })) {
      tenantCount += 1;
      formattedId = `I2A-SCH-${String(tenantCount + 1).padStart(6, '0')}`;
    }

    const baseCode = (app.schoolName.replace(/[^A-Za-z0-9]/g, '').substring(0, 4) || 'SCH').toUpperCase();
    let cleanCode = baseCode;
    let suffix = 1;
    while (await database.collection('organizations').findOne({ orgCode: cleanCode })) {
      cleanCode = `${baseCode}${suffix++}`;
    }
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];

    const sessionPolicy = calculateAcademicSessionPolicy(app.category || 'k12-schools', nowIso);

    // 1. Provision New Tenant Record
    const newTenant = {
      id: formattedId,
      name: app.schoolName,
      code: `${cleanCode}-${(app.city || 'HQ').toUpperCase()}`,
      board: app.board || 'CBSE',
      category: app.category || 'k12-schools',
      city: app.city || 'India',
      adminName: app.adminName,
      adminEmail: app.adminEmail,
      adminPhone: app.adminPhone,
      planId: app.planInterest || 'PROFESSIONAL',
      planName: `${app.planInterest || 'Professional'} Plan`,
      billingCycle: 'YEARLY',
      subscriptionStatus: 'ACTIVE',
      registeredAt: todayDate,
      expiresAt: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      studentLimit: Math.max(1000, (Number(app.estimatedStudents) || 300) * 2),
      isOnboarded: true,
      branding: {
        id: formattedId,
        name: app.schoolName,
        tagline: 'Excellence in Education',
        logoUrl: '',
        stampUrl: 'https://api.iconify.design/emojione-v1:approved.svg',
        principalSignatureUrl: 'https://api.iconify.design/ci:edit-pencil.svg',
        primaryColor: '#4F46E5',
        secondaryColor: '#06B6D4',
        address: `${app.city || 'Main Campus'}, ${app.state || 'India'}`,
        phone: app.adminPhone,
        email: app.adminEmail,
        whatsappNumber: app.adminPhone,
        website: `${cleanCode.toLowerCase()}.schoolos.in`,
        principalName: app.adminName,
        regNumber: `REG-${formattedId}`,
        board: app.board || 'CBSE',
        medium: 'ENGLISH',
        academicSession: sessionPolicy.sessionName,
        invoiceHeader: app.schoolName.toUpperCase(),
        invoiceFooter: 'Official Digital Fee Receipt - i2A SchoolOS',
        reportCardTheme: 'EMERALD_MODERN',
        certificateTheme: 'OFFICIAL'
      }
    };

    // 2. Provision Root Organization in Hierarchy
    const newOrg = {
      id: formattedId,
      name: app.schoolName,
      orgCode: cleanCode,
      type: 'STANDALONE_INSTITUTION',
      status: 'ACTIVE',
      tenantId: formattedId,
      registeredDate: todayDate,
      contactEmail: app.adminEmail,
      contactPhone: app.adminPhone,
      address: `${app.city || 'Main Campus'}, ${app.state || 'India'}`
    };

    // 3. Provision Initial Administrator User with Secure Cryptographic Invitation Token (SHA-256 Hashed Storage)
    const rawInvitationToken = crypto.randomBytes(32).toString('hex');
    const invitationTokenHash = crypto.createHash('sha256').update(rawInvitationToken).digest('hex');
    const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const newAdminUser = {
      id: `USER-ADMIN-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: app.adminName,
      email: app.adminEmail,
      role: 'PRINCIPAL',
      schoolId: formattedId,
      tenantId: formattedId,
      isActive: true,
      invitationTokenHash,
      invitationExpiresAt,
      mustChangePassword: true,
      createdAt: nowIso
    };

    // 4. Provision Initial Academic Session Driven by Policy
    const newSession = {
      id: `SESS-${formattedId}-${sessionPolicy.sessionName}`,
      schoolId: formattedId,
      sessionName: sessionPolicy.sessionName,
      startDate: sessionPolicy.startDate,
      endDate: sessionPolicy.endDate,
      isCurrent: true,
      policy: sessionPolicy.policy
    };

    // 5. Compensatory Rollback Engine & Synthetic Failure Injection (Strictly Gated in Non-Synthetic Environments)
    const allowFailureInjection = isFailureInjectionAllowed(req, database.databaseName);
    const failureStep = allowFailureInjection ? req.headers['x-simulate-failure-after-step'] : null;
    const createdRecords = {
      tenantId: null,
      orgId: null,
      userId: null,
      sessionId: null
    };

    try {
      // Step A: Insert Tenant
      await database.collection('tenants').insertOne(newTenant);
      createdRecords.tenantId = formattedId;
      if (failureStep === 'after-tenant') {
        throw new Error('SIMULATED_FAILURE: Injected failure immediately after tenant record creation.');
      }

      // Step B: Insert Organization
      await database.collection('organizations').insertOne(newOrg);
      createdRecords.orgId = formattedId;
      if (failureStep === 'after-org') {
        throw new Error('SIMULATED_FAILURE: Injected failure immediately after organization record creation.');
      }

      // Step C: Insert Admin User
      await database.collection('users').insertOne(newAdminUser);
      createdRecords.userId = newAdminUser.id;
      if (failureStep === 'after-user') {
        throw new Error('SIMULATED_FAILURE: Injected failure immediately after admin user record creation.');
      }

      // Step D: Insert Academic Session
      await database.collection('academic_sessions').insertOne(newSession);
      createdRecords.sessionId = newSession.id;
      if (failureStep === 'after-session') {
        throw new Error('SIMULATED_FAILURE: Injected failure immediately after academic session creation.');
      }

      // Step E: Update Application Status to APPROVED
      const historyItem = {
        status: 'APPROVED',
        changedAt: nowIso,
        changedBy: req.user.id,
        actorRole: req.user.role,
        notes: `Tenant successfully provisioned with ID [${formattedId}]`
      };

      await database.collection('school_applications').updateOne(
        { _id: app._id },
        {
          $set: {
            status: 'APPROVED',
            tenantId: formattedId,
            approvedAt: nowIso,
            approvedBy: req.user.id,
            verified: true
          },
          $push: { statusHistory: historyItem }
        }
      );

      // Dispatch activation notification with invitation link reference
      await database.collection('notifications').insertOne({
        id: `NOTIF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        schoolId: formattedId,
        recipientEmail: app.adminEmail,
        type: 'TENANT_ACTIVATED',
        title: 'Welcome to i2A SchoolOS — Institution Portal Ready',
        message: `Your institution [${app.schoolName}] is approved! Tenant ID: ${formattedId}. An activation invitation has been dispatched.`,
        applicationNo: app.applicationNo,
        createdAt: nowIso,
        read: false
      });

      await logAuditEvent({
        schoolId: formattedId,
        userId: req.user.id,
        userName: req.user.name,
        role: req.user.role,
        action: 'TENANT_PROVISIONING_FROM_APPLICATION',
        module: 'PLATFORM_ADMIN',
        resourceType: 'school_applications',
        details: `Application [${app.applicationNo}] approved. Tenant ID: [${formattedId}], Org: [${cleanCode}]`,
        ipAddress: req.ip
      });

      res.json({
        success: true,
        message: 'Application approved and tenant provisioned successfully.',
        tenant: newTenant,
        tenantId: formattedId,
        invitationToken: rawInvitationToken
      });
    } catch (provErr) {
      // Compensatory Rollback: Clean up any partially created records in reverse order
      const rollbackLog = [];
      let rollbackFailed = false;
      let rollbackErrorMsg = null;

      try {
        if (allowFailureInjection && req.headers['x-simulate-rollback-failure'] === 'true') {
          throw new Error('SIMULATED_FAILURE: Compensatory rollback failed due to synthetic catastrophic storage error.');
        }
        if (createdRecords.sessionId) {
          await database.collection('academic_sessions').deleteOne({ id: createdRecords.sessionId });
          rollbackLog.push('academic_sessions');
        }
        if (createdRecords.userId) {
          await database.collection('users').deleteOne({ id: createdRecords.userId });
          rollbackLog.push('users');
        }
        if (createdRecords.orgId) {
          await database.collection('organizations').deleteOne({ id: createdRecords.orgId });
          rollbackLog.push('organizations');
        }
        if (createdRecords.tenantId) {
          await database.collection('tenants').deleteOne({ id: createdRecords.tenantId });
          rollbackLog.push('tenants');
        }
      } catch (rollbackErr) {
        rollbackFailed = true;
        rollbackErrorMsg = rollbackErr.message;
      }

      if (rollbackFailed) {
        // Rollback failure: persist durable recovery state and emit critical audit alert
        await database.collection('school_applications').updateOne(
          { _id: app._id },
          {
            $set: {
              provisioningError: provErr.message,
              provisioningRecoveryStatus: 'PROVISIONING_FAILED_COMPENSATION_FAILED',
              manualRecoveryRequired: true,
              rollbackError: rollbackErrorMsg,
              partiallyCreatedRecords: createdRecords,
              provisioningFailedAt: new Date().toISOString()
            },
            $push: {
              statusHistory: {
                status: app.status,
                changedAt: new Date().toISOString(),
                changedBy: req.user.id,
                actorRole: req.user.role,
                notes: `CRITICAL: Provisioning failed (${provErr.message}) and compensatory rollback also failed (${rollbackErrorMsg}). Partially created: ${JSON.stringify(createdRecords)}`
              }
            }
          }
        );

        await logAuditEvent({
          schoolId: 'PLATFORM',
          userId: req.user.id,
          userName: req.user.name,
          role: req.user.role,
          action: 'TENANT_PROVISIONING_ROLLBACK_FAILED',
          module: 'PLATFORM_ADMIN',
          resourceType: 'school_applications',
          details: `CRITICAL ALERT: Provisioning failed for [${app.applicationNo}] and rollback threw error: ${rollbackErrorMsg}. Manual recovery required for: ${JSON.stringify(createdRecords)}`,
          ipAddress: req.ip
        });

        return res.status(500).json({
          success: false,
          error: `Tenant provisioning failed and compensatory rollback could not complete: ${rollbackErrorMsg}`,
          code: 'PROVISIONING_FAILED_COMPENSATION_FAILED',
          manualRecoveryRequired: true,
          partiallyCreatedRecords: createdRecords
        });
      }

      // Successful compensatory rollback
      await database.collection('school_applications').updateOne(
        { _id: app._id },
        {
          $set: {
            provisioningError: provErr.message,
            provisioningRecoveryStatus: 'PROVISIONING_FAILED_COMPENSATED',
            provisioningFailedAt: new Date().toISOString()
          },
          $push: {
            statusHistory: {
              status: app.status,
              changedAt: new Date().toISOString(),
              changedBy: req.user.id,
              actorRole: req.user.role,
              notes: `Provisioning failed: ${provErr.message}. Compensatory rollback executed for: [${rollbackLog.join(', ')}]`
            }
          }
        }
      );

      await logAuditEvent({
        schoolId: 'PLATFORM',
        userId: req.user.id,
        userName: req.user.name,
        role: req.user.role,
        action: 'TENANT_PROVISIONING_FAILED_COMPENSATED',
        module: 'PLATFORM_ADMIN',
        resourceType: 'school_applications',
        details: `Provisioning failed for [${app.applicationNo}]: ${provErr.message}. Compensatory rollback executed for: [${rollbackLog.join(', ')}]`,
        ipAddress: req.ip
      });

      return res.status(500).json({
        success: false,
        error: `Tenant provisioning failed: ${provErr.message}`,
        code: 'PROVISIONING_FAILED_ROLLBACK_EXECUTED',
        compensated: rollbackLog
      });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/tenants/applications/:appId/cancel
 * Applicant or Admin cancels application before approval
 */
router.post('/applications/:appId/cancel', async (req, res) => {
  try {
    const database = await getDb();
    const app = await database.collection('school_applications').findOne({
      $or: [{ id: req.params.appId }, { applicationNo: req.params.appId }]
    });

    if (!app) return res.status(404).json({ success: false, error: 'Application not found.' });

    if (app.status === 'APPROVED') {
      return res.status(409).json({
        success: false,
        error: 'Cannot cancel an application that has already been approved and provisioned.',
        code: 'CANNOT_CANCEL_APPROVED_APPLICATION'
      });
    }

    if (app.status === 'CANCELLED') {
      return res.json({ success: true, message: 'Application is already cancelled.', application: app });
    }

    const nowIso = new Date().toISOString();
    const rawReason = req.body.reason || req.body.notes || 'Application retracted by applicant';
    const historyItem = {
      status: 'CANCELLED',
      changedAt: nowIso,
      changedBy: 'APPLICANT_OR_ADMIN',
      actorRole: 'APPLICANT',
      notes: sanitize(rawReason)
    };

    await database.collection('school_applications').updateOne(
      { _id: app._id },
      {
        $set: { status: 'CANCELLED', cancelledAt: nowIso, cancellationReason: sanitize(rawReason) },
        $push: { statusHistory: historyItem }
      }
    );

    const updated = await database.collection('school_applications').findOne({ _id: app._id });
    res.json({ success: true, message: 'Application cancelled successfully.', application: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
