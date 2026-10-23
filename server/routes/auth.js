import express from 'express';
import crypto from 'crypto';
import { getDb } from '../db.js';
import {
  generateToken,
  hashPassword,
  comparePassword,
  authenticateToken,
  logAuditEvent,
  revokeToken,
  recordFailedLoginAttempt,
  isAccountLocked,
  clearFailedLogins,
  enforceTenant,
  requireRoles
} from '../middleware/auth.js';
import {
  sendEmail,
  getPublicBaseUrl,
  renderStudentInvitationTemplate,
  renderParentInvitationTemplate,
  renderStaffInvitationTemplate,
  renderPasswordResetOtpTemplate,
  renderPasswordChangedTemplate
} from '../services/emailService.js';

const router = express.Router();

// Rate limiting map for OTP resend (in-memory per-IP / email tracking)
const otpRateLimits = new Map();

/**
 * Helper to ensure default seed users have bcrypt passwords
 */
export async function initializeUserPasswords() {
  const database = await getDb();
  const users = await database.collection('users').find({}).toArray();

  const rolePasswords = {
    SUPER_ADMIN: 'SuperAdmin@2026#',
    PRINCIPAL: 'Principal@2026#',
    ADMIN: 'Admin@2026#',
    TEACHER: 'Teacher@2026#',
    ACCOUNTANT: 'Accountant@2026#',
    STAFF: 'Staff@2026#',
    TRANSPORT: 'Transport@2026#',
    PARENT: 'Parent@2026#',
    STUDENT: 'Student@2026#'
  };

  for (const user of users) {
    if (!user.passwordHash) {
      const defaultPass = rolePasswords[user.role] || 'SchoolOS@2026#';
      const passwordHash = await hashPassword(defaultPass);
      await database.collection('users').updateOne(
        { id: user.id },
        {
          $set: {
            passwordHash,
            status: user.status || 'ACTIVE',
            updatedAt: new Date().toISOString()
          }
        }
      );
    }
  }
}

/**
 * POST /api/auth/login
 * Validates credentials, checks account status, returns signed JWT
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: 'Email/username and password are required.' });
    }

    // NoSQL Injection Defense: Reject non-string primitives
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid input types. Email and password must be plain text strings.',
        code: 'INVALID_INPUT_TYPE'
      });
    }

    const cleanEmail = email.trim();

    // Check Account Lockout (Brute Force Defense - Persistent Across Restarts & Clusters)
    const lockStatus = await isAccountLocked(cleanEmail);
    if (lockStatus && lockStatus.locked) {
      return res.status(403).json({
        success: false,
        error: `Account temporarily locked due to multiple failed login attempts. Please try again after ${lockStatus.remainingSec} seconds.`,
        code: 'ACCOUNT_LOCKED',
        remainingSec: lockStatus.remainingSec
      });
    }

    const database = await getDb();
    
    // Find user by email or username or id
    let user = await database.collection('users').findOne({
      $or: [
        { email: cleanEmail.toLowerCase() },
        { id: cleanEmail },
        { name: cleanEmail }
      ]
    });

    // Special Demo School Credentials Handler (abcschool@gmail.com / i2A@123)
    if (!user && cleanEmail.toLowerCase() === 'abcschool@gmail.com' && password === 'i2A@123') {
      user = {
        id: 'usr-demo-abc',
        name: 'ABC Public School Demo Admin',
        email: 'abcschool@gmail.com',
        role: 'ADMIN',
        schoolId: 'I2A-SCH-000001',
        status: 'ACTIVE'
      };
    }

    if (!user) {
      await recordFailedLoginAttempt(cleanEmail);
      return res.status(401).json({ error: 'Invalid password or credentials. Authentication failed.' });
    }

    if (user.status && user.status !== 'ACTIVE') {
      return res.status(403).json({
        error: user.status === 'INVITED'
          ? 'Account has not been activated. Please use your email invitation link to set up your password.'
          : `Account is ${user.status.toLowerCase()}. Contact school administrator.`,
        code: user.status === 'DISABLED'
          ? 'ACCOUNT_DISABLED'
          : user.status === 'INVITED'
          ? 'ACCOUNT_NOT_ACTIVATED'
          : 'ACCOUNT_SUSPENDED'
      });
    }

    if (user.schoolId && user.schoolId !== 'ALL') {
      const membership = await database.collection('memberships').findOne({
        userId: user.id,
        schoolId: user.schoolId
      });
      if (membership && (membership.status === 'REVOKED' || membership.status === 'SUSPENDED' || membership.status === 'INACTIVE')) {
        return res.status(403).json({
          error: `Membership in school [${user.schoolId}] has been revoked or suspended.`,
          code: 'MEMBERSHIP_REVOKED'
        });
      }
    }

    // Role check if explicitly passed
    if (role && role !== user.role && user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: `User is registered as ${user.role}, cannot log in as ${role}.` });
    }

    // Unactivated invitation account protection (must complete activation flow first)
    if (user.mustChangePassword && !user.passwordHash) {
      return res.status(403).json({
        success: false,
        error: 'Account has not been activated. Please use the activation invitation link sent to your registered email to set up your password.',
        code: 'ACCOUNT_NOT_ACTIVATED'
      });
    }

    const isMatch = (cleanEmail.toLowerCase() === 'abcschool@gmail.com' && password === 'i2A@123') || (await comparePassword(password, user.passwordHash || user.password));
    if (!isMatch) {
      const lockAttempt = await recordFailedLoginAttempt(cleanEmail);
      await logAuditEvent({
        schoolId: user.schoolId,
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: 'FAILED_LOGIN_ATTEMPT',
        module: 'AUTHENTICATION',
        details: `Failed password attempt for user ${user.email} (Attempt count: ${lockAttempt?.count || 1})`,
        ipAddress: req.ip
      });

      if (lockAttempt && lockAttempt.lockedUntil) {
        return res.status(403).json({
          success: false,
          error: 'Maximum failed login attempts reached. Account locked for 15 minutes.',
          code: 'ACCOUNT_LOCKED'
        });
      }

      return res.status(401).json({ error: 'Invalid password or credentials. Authentication failed.' });
    }

    // Credentials verified: Clear any prior failed attempts
    await clearFailedLogins(cleanEmail);

    // Generate JWT
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId
    });

    // Fetch Tenant details
    let tenant = null;
    if (user.schoolId && user.schoolId !== 'ALL') {
      tenant = await database.collection('tenants').findOne({ id: user.schoolId });
    }

    await logAuditEvent({
      schoolId: user.schoolId,
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: 'SUCCESSFUL_LOGIN',
      module: 'AUTHENTICATION',
      details: `User ${user.email} logged in successfully with role ${user.role}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        schoolId: user.schoolId,
        studentId: user.studentId,
        childrenIds: user.childrenIds,
        assignedClasses: user.assignedClasses
      },
      tenant: tenant || {
        id: user.schoolId,
        name: 'i2A SaaS Master Platform'
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal login error: ' + err.message });
  }
});

/**
 * POST /api/auth/logout
 * Revokes active JWT session token
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    await revokeToken(req.token, 'USER_LOGOUT');
    await logAuditEvent({
      schoolId: req.user.schoolId,
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'USER_LOGOUT',
      module: 'AUTHENTICATION',
      details: `User ${req.user.email} successfully logged out and revoked session token`,
      ipAddress: req.ip
    });
    res.json({
      success: true,
      message: 'Logged out successfully. Session invalidated.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed: ' + err.message });
  }
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user session
 */
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const database = await getDb();
    let tenant = null;
    if (req.user.schoolId && req.user.schoolId !== 'ALL') {
      tenant = await database.collection('tenants').findOne({ id: req.user.schoolId });
    }
    res.json({
      success: true,
      user: req.user,
      tenant
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/auth/register-school
 * Onboards a new school tenant, creates initial principal user with hashed password
 */
router.post('/register-school', async (req, res) => {
  try {
    const {
      name,
      board,
      city,
      adminName,
      adminEmail,
      adminPhone,
      planId,
      billingCycle,
      password
    } = req.body;

    if (!name || !adminEmail || !adminName) {
      return res.status(400).json({ error: 'School name, admin email and name are required.' });
    }

    const database = await getDb();
    const existing = await database.collection('users').findOne({ email: adminEmail.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'An administrator with this email already exists.' });
    }

    const schoolCount = await database.collection('tenants').countDocuments();
    const newSchoolId = `I2A-SCH-${String(schoolCount + 1).padStart(6, '0')}`;
    const cleanCode = name.replace(/[^A-Za-z0-9]/g, '').substring(0, 4).toUpperCase();

    const planPrices = {
      STARTER: { maxStudents: 250, name: 'Starter Plan' },
      PROFESSIONAL: { maxStudents: 1000, name: 'Professional Plan' },
      ENTERPRISE: { maxStudents: 5000, name: 'Enterprise Plan' }
    };
    const planMeta = planPrices[planId] || planPrices.PROFESSIONAL;

    const newTenant = {
      id: newSchoolId,
      name,
      code: `${cleanCode}-${city.toUpperCase()}`,
      board: board || 'CBSE',
      city: city || 'New Delhi',
      adminName,
      adminEmail: adminEmail.toLowerCase(),
      adminPhone: adminPhone || '',
      planId: planId || 'PROFESSIONAL',
      planName: planMeta.name,
      billingCycle: billingCycle || 'YEARLY',
      subscriptionStatus: 'TRIAL',
      registeredAt: new Date().toISOString().split('T')[0],
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      studentLimit: planMeta.maxStudents,
      isOnboarded: true,
      branding: {
        id: newSchoolId,
        name,
        tagline: 'Excellence in Education & Character Building',
        logoUrl: '',
        stampUrl: 'https://api.iconify.design/emojione-v1:approved.svg',
        principalSignatureUrl: 'https://api.iconify.design/ci:edit-pencil.svg',
        primaryColor: '#4F46E5',
        secondaryColor: '#06B6D4',
        address: `${city}, India`,
        phone: adminPhone || '',
        email: adminEmail,
        whatsappNumber: adminPhone || '',
        website: `${cleanCode.toLowerCase()}.schoolos.in`,
        principalName: adminName,
        regNumber: `REG-${newSchoolId}`,
        board: board || 'CBSE',
        medium: 'ENGLISH',
        academicSession: '2026-2027',
        invoiceHeader: name.toUpperCase(),
        invoiceFooter: 'Official Computer Generated Digital Fee Receipt - i2A SchoolOS',
        reportCardTheme: 'EMERALD_MODERN',
        certificateTheme: 'OFFICIAL'
      }
    };

    await database.collection('tenants').insertOne(newTenant);

    // Create Initial Principal User
    const plainPass = password || 'Admin@2026#Launch';
    const passwordHash = await hashPassword(plainPass);
    const newAdminUser = {
      id: `usr-${Date.now()}`,
      name: adminName,
      email: adminEmail.toLowerCase(),
      role: 'PRINCIPAL',
      schoolId: newSchoolId,
      status: 'ACTIVE',
      passwordHash,
      createdAt: new Date().toISOString()
    };

    await database.collection('users').insertOne(newAdminUser);

    await logAuditEvent({
      schoolId: newSchoolId,
      userId: newAdminUser.id,
      userName: adminName,
      role: 'PRINCIPAL',
      action: 'REGISTER_SCHOOL',
      module: 'ONBOARDING',
      details: `New school registered: ${name} [${newSchoolId}]. Trial valid until ${newTenant.expiresAt}`,
      ipAddress: req.ip
    });

    const token = generateToken({
      id: newAdminUser.id,
      email: newAdminUser.email,
      role: newAdminUser.role,
      schoolId: newSchoolId
    });

    res.status(201).json({
      success: true,
      message: 'School tenant successfully registered.',
      tenant: newTenant,
      user: {
        id: newAdminUser.id,
        email: newAdminUser.email,
        name: newAdminUser.name,
        role: newAdminUser.role,
        schoolId: newSchoolId
      },
      token
    });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

/**
 * POST /api/auth/forgot-password
 * Generates secure server-side OTP, logs audit event, enforces rate limits
 */
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check rate limit: 1 OTP request every 60 seconds per email
    const lastRequested = otpRateLimits.get(cleanEmail);
    if (lastRequested && Date.now() - lastRequested < 60000) {
      const waitSec = Math.ceil((60000 - (Date.now() - lastRequested)) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitSec} seconds before requesting a new verification code.`,
        code: 'RATE_LIMITED'
      });
    }

    const database = await getDb();
    const user = await database.collection('users').findOne({ email: cleanEmail });

    // Always respond with generic success to prevent account enumeration
    if (!user) {
      return res.json({
        success: true,
        message: 'If the email exists in our system, a 6-digit verification code has been dispatched.',
        expiresInMinutes: 10
      });
    }

    // Generate cryptographically secure 6-digit numeric OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

    // Invalidate previous reset requests for this email
    await database.collection('password_resets').deleteMany({ email: cleanEmail });

    // Store hashed OTP with 10-minute expiry and attempt counter
    await database.collection('password_resets').insertOne({
      email: cleanEmail,
      userId: user.id,
      schoolId: user.schoolId,
      hashedOtp,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });

    otpRateLimits.set(cleanEmail, Date.now());

    // Record audit event
    await logAuditEvent({
      schoolId: user.schoolId,
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: 'OTP_REQUESTED',
      module: 'PASSWORD_RESET',
      details: `Password reset OTP generated for ${cleanEmail}. Expiry: 10 mins.`,
      ipAddress: req.ip
    });

    // Dispatch verification OTP email via email service
    let emailDelivery = null;
    try {
      const emailTemplate = renderPasswordResetOtpTemplate({
        userName: user.name || cleanEmail,
        otp,
        expiresInMinutes: 10,
        schoolName: user.schoolId || 'i2A SchoolOS'
      });
      emailDelivery = await sendEmail({
        to: cleanEmail,
        ...emailTemplate,
        schoolId: user.schoolId
      });
    } catch (_e) {
      // Non-blocking for email delivery
    }

    // In dev/test environment without third-party SMTP, we return the OTP in header/debug for verified testing
    const isLocalDev = process.env.NODE_ENV !== 'production';

    res.json({
      success: true,
      message: 'If the email exists in our system, a 6-digit verification code has been dispatched.',
      expiresInMinutes: 10,
      deliveryStatus: emailDelivery?.deliveryStatus || 'DISPATCHED_TO_NOTIFICATION_HUB',
      debugOtp: isLocalDev ? otp : undefined
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process password reset: ' + err.message });
  }
});

/**
 * POST /api/auth/verify-otp
 * Verifies the 6-digit OTP and returns a single-use reset token
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ error: 'Email and OTP code are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const database = await getDb();
    const resetRecord = await database.collection('password_resets').findOne({ email: cleanEmail });

    if (!resetRecord) {
      return res.status(400).json({ error: 'No active OTP verification session found or OTP has expired.' });
    }

    if (resetRecord.attempts >= resetRecord.maxAttempts) {
      await database.collection('password_resets').deleteOne({ _id: resetRecord._id });
      return res.status(403).json({
        error: 'Maximum verification attempts exceeded. Please request a new code.',
        code: 'MAX_ATTEMPTS_EXCEEDED'
      });
    }

    const testHashedOtp = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    if (testHashedOtp !== resetRecord.hashedOtp) {
      await database.collection('password_resets').updateOne(
        { _id: resetRecord._id },
        { $inc: { attempts: 1 } }
      );
      const remaining = resetRecord.maxAttempts - (resetRecord.attempts + 1);
      return res.status(400).json({
        error: `Invalid verification code. ${remaining} attempts remaining.`,
        remainingAttempts: remaining
      });
    }

    // Generate single-use reset token valid for 15 minutes
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    await database.collection('password_resets').updateOne(
      { _id: resetRecord._id },
      {
        $set: {
          hashedResetToken,
          verified: true,
          verifiedAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'OTP verified successfully.',
      resetToken
    });
  } catch (err) {
    res.status(500).json({ error: 'OTP verification failed: ' + err.message });
  }
});

/**
 * POST /api/auth/reset-password
 * Updates password with bcrypt hash and revokes OTP session
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { email, resetToken, newPassword } = req.body;
    if (!email || !resetToken || !newPassword) {
      return res.status(400).json({ error: 'Email, reset token and new password are required.' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const database = await getDb();
    const resetRecord = await database.collection('password_resets').findOne({ email: cleanEmail });

    if (!resetRecord || !resetRecord.verified) {
      return res.status(400).json({ error: 'Invalid or unverified password reset session.' });
    }

    const testHashedResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    if (testHashedResetToken !== resetRecord.hashedResetToken) {
      return res.status(403).json({ error: 'Invalid reset token.' });
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);
    const nowIso = new Date().toISOString();

    await database.collection('users').updateOne(
      { email: cleanEmail },
      {
        $set: {
          passwordHash,
          password: passwordHash,
          passwordChangedAt: nowIso,
          mustChangePassword: false,
          updatedAt: nowIso
        }
      }
    );

    // Invalidate reset record
    await database.collection('password_resets').deleteOne({ _id: resetRecord._id });

    // Dispatch security alert email
    try {
      const alertTemplate = renderPasswordChangedTemplate({
        userName: cleanEmail,
        schoolName: resetRecord.schoolId || 'i2A SchoolOS',
        changedAt: new Date().toLocaleString('en-IN')
      });
      await sendEmail({
        to: cleanEmail,
        ...alertTemplate,
        schoolId: resetRecord.schoolId
      });
    } catch (_e) {
      // Non-blocking
    }

    await logAuditEvent({
      schoolId: resetRecord.schoolId,
      userId: resetRecord.userId,
      userName: cleanEmail,
      role: 'USER',
      action: 'PASSWORD_RESET_SUCCESSFUL',
      module: 'AUTHENTICATION',
      details: `Password successfully updated via verified OTP for ${cleanEmail}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Password reset failed: ' + err.message });
  }
});

/**
 * POST /api/auth/activate-account
 * Consumes single-use cryptographic invitation token, validates password complexity,
 * sets initial administrator password, activates account, and issues signed session JWT.
 */
router.post('/activate-account', async (req, res) => {
  try {
    const rawToken = req.body?.token || req.body?.invitationToken;
    const { newPassword, email } = req.body || {};
    const token = rawToken;

    if (!token || typeof token !== 'string' || token.trim().length < 16) {
      return res.status(400).json({
        success: false,
        error: 'A valid invitation token is required.',
        code: 'INVALID_INVITATION_TOKEN'
      });
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long.',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    // Complexity check: at least 1 uppercase, 1 lowercase, 1 number, 1 special character
    const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordComplexityRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
        code: 'PASSWORD_COMPLEXITY_FAILED'
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token.trim()).digest('hex');
    const database = await getDb();

    // Query by invitationTokenHash or legacy invitationToken
    const query = {
      $or: [
        { invitationTokenHash: tokenHash },
        { invitationToken: token.trim() }
      ]
    };

    if (email && typeof email === 'string') {
      query.email = email.trim().toLowerCase();
    }

    const user = await database.collection('users').findOne(query);

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invitation token is invalid, expired, or has already been used.',
        code: 'INVALID_INVITATION_TOKEN'
      });
    }

    // Revocation check
    if (user.invitationRevoked) {
      return res.status(400).json({
        success: false,
        error: 'This invitation token has been revoked by an administrator.',
        code: 'INVITATION_REVOKED'
      });
    }

    // Replay attack defense: Check if already consumed
    if (user.invitationConsumedAt) {
      return res.status(400).json({
        success: false,
        error: 'This invitation token has already been consumed. Please log in directly with your password.',
        code: 'INVITATION_ALREADY_USED'
      });
    }

    // Expiry check
    if (user.invitationExpiresAt && new Date(user.invitationExpiresAt) < new Date()) {
      return res.status(400).json({
        success: false,
        error: 'This invitation token has expired. Please contact support or request a new invitation.',
        code: 'INVITATION_EXPIRED'
      });
    }

    const nowIso = new Date().toISOString();
    const newPasswordHash = await hashPassword(newPassword);

    // Atomically activate user and clear invitation token with concurrency guard
    const updateResult = await database.collection('users').updateOne(
      {
        _id: user._id,
        invitationConsumedAt: { $exists: false }
      },
      {
        $set: {
          passwordHash: newPasswordHash,
          mustChangePassword: false,
          status: 'ACTIVE',
          invitationConsumedAt: nowIso,
          activatedAt: nowIso,
          passwordChangedAt: nowIso,
          updatedAt: nowIso
        },
        $unset: {
          invitationTokenHash: '',
          invitationToken: ''
        }
      }
    );

    if (updateResult.matchedCount === 0 || updateResult.modifiedCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'This invitation token has already been consumed or is being processed concurrently.',
        code: 'INVITATION_ALREADY_USED'
      });
    }

    // Generate signed JWT for direct portal access
    const jwtPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      schoolId: user.schoolId,
      tenantId: user.tenantId || user.schoolId,
      studentId: user.studentId,
      childrenIds: user.childrenIds,
      assignedClasses: user.assignedClasses
    };
    const sessionToken = generateToken(jwtPayload);

    await logAuditEvent({
      schoolId: user.schoolId,
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: 'ACCOUNT_ACTIVATED_VIA_INVITATION',
      module: 'AUTHENTICATION',
      details: `User account [${user.email}] (${user.role}) activated successfully via invitation token.`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Account activated successfully. Welcome to i2A SchoolOS!',
      token: sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        tenantId: user.tenantId || user.schoolId,
        studentId: user.studentId,
        childrenIds: user.childrenIds,
        assignedClasses: user.assignedClasses
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Account activation failed: ' + err.message });
  }
});

/**
 * POST /api/auth/change-password
 * Authenticated user changes their own password after confirming current password
 */
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required.',
        code: 'MISSING_CREDENTIALS'
      });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password cannot be identical to current password.',
        code: 'PASSWORD_IDENTICAL'
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters long.',
        code: 'PASSWORD_TOO_SHORT'
      });
    }

    const passwordComplexityRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/;
    if (!passwordComplexityRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        error: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.',
        code: 'PASSWORD_COMPLEXITY_FAILED'
      });
    }

    const database = await getDb();
    const user = await database.collection('users').findOne({ id: req.user.id });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User account not found.' });
    }

    const isMatch = await comparePassword(currentPassword, user.passwordHash || user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password does not match.',
        code: 'INVALID_CURRENT_PASSWORD'
      });
    }

    const newHash = await hashPassword(newPassword);
    const nowIso = new Date().toISOString();

    await database.collection('users').updateOne(
      { id: user.id },
      {
        $set: {
          passwordHash: newHash,
          password: newHash,
          passwordChangedAt: nowIso,
          mustChangePassword: false,
          updatedAt: nowIso
        }
      }
    );

    // Invalidate currently active token to enforce clean session refresh
    if (req.token) {
      await revokeToken(req.token, 'PASSWORD_CHANGE');
    }

    // Dispatch security alert email
    try {
      const template = renderPasswordChangedTemplate({
        userName: user.name || user.email,
        schoolName: user.schoolId || 'i2A SchoolOS',
        changedAt: new Date().toLocaleString('en-IN')
      });
      await sendEmail({
        to: user.email,
        ...template,
        schoolId: user.schoolId
      });
    } catch (_e) {
      // Non-blocking email alert log
    }

    await logAuditEvent({
      schoolId: user.schoolId,
      userId: user.id,
      userName: user.name,
      role: user.role,
      action: 'PASSWORD_CHANGED',
      module: 'AUTHENTICATION',
      details: `Password changed by authenticated user ${user.email}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Password changed successfully. Please log in with your new credentials.'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Password change failed: ' + err.message });
  }
});

/**
 * POST /api/auth/invite-user
 * Administrator or authorized manager provisions an account and generates an activation invitation
 */
router.post(
  '/invite-user',
  authenticateToken,
  enforceTenant,
  requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ORG_DIRECTOR', 'HR'),
  async (req, res) => {
    try {
      const {
        email,
        name,
        role,
        schoolId,
        branchId,
        studentId,
        childrenIds,
        department,
        designation,
        className,
        section
      } = req.body || {};

      if (!email || !name || !role) {
        return res.status(400).json({
          success: false,
          error: 'Email, name, and role are required for user invitation.',
          code: 'VALIDATION_ERROR'
        });
      }

      const cleanEmail = email.trim().toLowerCase();

      // Prevent privilege escalation: only SUPER_ADMIN can invite SUPER_ADMIN
      if (role === 'SUPER_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'Only Super Administrators can provision the SUPER_ADMIN role.',
          code: 'PRIVILEGE_ESCALATION_BLOCKED'
        });
      }

      const targetSchoolId = req.user.role === 'SUPER_ADMIN' ? (schoolId || req.user.schoolId) : req.user.schoolId;
      const database = await getDb();

      // Check duplicate email
      const existingUser = await database.collection('users').findOne({ email: cleanEmail });
      if (existingUser) {
        if (existingUser.schoolId !== targetSchoolId) {
          return res.status(409).json({
            success: false,
            error: `User with email '${cleanEmail}' is already registered with another institution.`,
            code: 'CROSS_TENANT_EMAIL_CONFLICT'
          });
        }
        if (existingUser.status === 'ACTIVE' && existingUser.passwordHash && !existingUser.mustChangePassword) {
          return res.status(409).json({
            success: false,
            error: `User with email '${cleanEmail}' is already active. Use forgot-password to reset credentials.`,
            code: 'USER_ALREADY_ACTIVE'
          });
        }
      }

      // Cryptographic 32-byte invitation token
      const rawInvitationToken = crypto.randomBytes(32).toString('hex');
      const invitationTokenHash = crypto.createHash('sha256').update(rawInvitationToken).digest('hex');
      const invitationExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const nowIso = new Date().toISOString();

      const userId = existingUser ? existingUser.id : `usr-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
      const userDoc = {
        id: userId,
        email: cleanEmail,
        name: name.trim(),
        role,
        schoolId: targetSchoolId,
        tenantId: targetSchoolId,
        branchId: branchId || null,
        studentId: studentId || null,
        childrenIds: childrenIds || (studentId ? [studentId] : []),
        department: department || (role === 'TEACHER' ? 'Academic' : 'General'),
        designation: designation || role,
        status: 'INVITED',
        mustChangePassword: true,
        invitationTokenHash,
        invitationExpiresAt,
        invitationRevoked: false,
        invitedBy: req.user.id,
        invitedByName: req.user.name,
        invitedAt: nowIso,
        updatedAt: nowIso
      };

      await database.collection('users').updateOne(
        { email: cleanEmail },
        { $set: userDoc },
        { upsert: true }
      );

      // Determine school display title
      let schoolTitle = targetSchoolId;
      const tenantDoc = await database.collection('tenants').findOne({ id: targetSchoolId });
      if (tenantDoc && tenantDoc.name) schoolTitle = tenantDoc.name;

      const baseUrl = getPublicBaseUrl();
      const activationLink = `${baseUrl}/activate?token=${rawInvitationToken}&email=${encodeURIComponent(cleanEmail)}`;

      // Prepare template based on role
      let emailTemplate;
      if (role === 'STUDENT') {
        emailTemplate = renderStudentInvitationTemplate({
          studentName: name,
          schoolName: schoolTitle,
          className: className || 'VIII',
          section: section || 'A',
          activationLink,
          expiresAt: new Date(invitationExpiresAt).toLocaleDateString('en-IN')
        });
      } else if (role === 'PARENT') {
        emailTemplate = renderParentInvitationTemplate({
          parentName: name,
          childName: req.body.childName || 'Ward',
          className: className || 'VIII',
          section: section || 'A',
          schoolName: schoolTitle,
          activationLink,
          expiresAt: new Date(invitationExpiresAt).toLocaleDateString('en-IN')
        });
      } else {
        emailTemplate = renderStaffInvitationTemplate({
          staffName: name,
          role,
          department: department || 'Operations',
          schoolName: schoolTitle,
          activationLink,
          expiresAt: new Date(invitationExpiresAt).toLocaleDateString('en-IN')
        });
      }

      const deliveryResult = await sendEmail({
        to: cleanEmail,
        ...emailTemplate,
        schoolId: targetSchoolId,
        schoolName: schoolTitle
      });

      await logAuditEvent({
        schoolId: targetSchoolId,
        userId: req.user.id,
        userName: req.user.name,
        role: req.user.role,
        action: 'USER_INVITATION_DISPATCHED',
        module: 'AUTHENTICATION',
        details: `Dispatched invitation to ${cleanEmail} for role ${role} (Token expires in 7 days)`,
        ipAddress: req.ip
      });

      res.status(201).json({
        success: true,
        message: `Invitation successfully dispatched to ${cleanEmail}.`,
        userId,
        role,
        email: cleanEmail,
        invitationExpiresAt,
        invitationToken: rawInvitationToken,
        invitationLink: activationLink,
        delivery: deliveryResult
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to dispatch invitation: ' + err.message });
    }
  }
);

/**
 * POST /api/auth/resend-invitation
 * Rotates invitation token and dispatches new email to pending invited user
 */
router.post(
  '/resend-invitation',
  authenticateToken,
  enforceTenant,
  requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ORG_DIRECTOR', 'HR'),
  async (req, res) => {
    try {
      const { email, userId } = req.body || {};
      if (!email && !userId) {
        return res.status(400).json({
          success: false,
          error: 'Email or userId is required to resend invitation.',
          code: 'VALIDATION_ERROR'
        });
      }

      const database = await getDb();
      const query = { ...req.tenantFilter };
      if (email) query.email = email.trim().toLowerCase();
      if (userId) query.id = userId;

      const user = await database.collection('users').findOne(query);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'No matching user found in authorized school.',
          code: 'USER_NOT_FOUND'
        });
      }

      if (user.status === 'ACTIVE' && user.passwordHash && !user.mustChangePassword) {
        return res.status(400).json({
          success: false,
          error: 'User has already activated their account. Use password reset instead.',
          code: 'USER_ALREADY_ACTIVE'
        });
      }

      // Rotate token
      const freshRawToken = crypto.randomBytes(32).toString('hex');
      const freshTokenHash = crypto.createHash('sha256').update(freshRawToken).digest('hex');
      const freshExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const nowIso = new Date().toISOString();

      await database.collection('users').updateOne(
        { id: user.id },
        {
          $set: {
            invitationTokenHash: freshTokenHash,
            invitationExpiresAt: freshExpiresAt,
            invitationRevoked: false,
            mustChangePassword: true,
            status: 'INVITED',
            updatedAt: nowIso
          },
          $unset: {
            invitationConsumedAt: ''
          }
        }
      );

      let schoolTitle = user.schoolId;
      const tenantDoc = await database.collection('tenants').findOne({ id: user.schoolId });
      if (tenantDoc && tenantDoc.name) schoolTitle = tenantDoc.name;

      const baseUrl = getPublicBaseUrl();
      const activationLink = `${baseUrl}/activate?token=${freshRawToken}&email=${encodeURIComponent(user.email)}`;

      const emailTemplate = renderStaffInvitationTemplate({
        staffName: user.name,
        role: user.role,
        department: user.department || 'Operations',
        schoolName: schoolTitle,
        activationLink,
        expiresAt: new Date(freshExpiresAt).toLocaleDateString('en-IN')
      });

      const deliveryResult = await sendEmail({
        to: user.email,
        ...emailTemplate,
        schoolId: user.schoolId,
        schoolName: schoolTitle
      });

      await logAuditEvent({
        schoolId: user.schoolId,
        userId: req.user.id,
        userName: req.user.name,
        role: req.user.role,
        action: 'INVITATION_RESENT',
        module: 'AUTHENTICATION',
        details: `Rotated and resent invitation token to ${user.email}`,
        ipAddress: req.ip
      });

      res.json({
        success: true,
        message: `Fresh invitation token dispatched to ${user.email}.`,
        invitationExpiresAt: freshExpiresAt,
        invitationToken: freshRawToken,
        invitationLink: activationLink,
        delivery: deliveryResult
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to resend invitation: ' + err.message });
    }
  }
);

/**
 * POST /api/auth/revoke-invitation
 * Revokes a pending invitation token immediately
 */
router.post(
  '/revoke-invitation',
  authenticateToken,
  enforceTenant,
  requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ORG_DIRECTOR', 'HR'),
  async (req, res) => {
    try {
      const { email, userId } = req.body || {};
      if (!email && !userId) {
        return res.status(400).json({
          success: false,
          error: 'Email or userId is required to revoke invitation.',
          code: 'VALIDATION_ERROR'
        });
      }

      const database = await getDb();
      const query = { ...req.tenantFilter };
      if (email) query.email = email.trim().toLowerCase();
      if (userId) query.id = userId;

      const user = await database.collection('users').findOne(query);
      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'No matching user found in authorized school.',
          code: 'USER_NOT_FOUND'
        });
      }

      const nowIso = new Date().toISOString();

      await database.collection('users').updateOne(
        { id: user.id },
        {
          $set: {
            invitationRevoked: true,
            status: 'REVOKED',
            updatedAt: nowIso
          },
          $unset: {
            invitationTokenHash: '',
            invitationToken: ''
          }
        }
      );

      await logAuditEvent({
        schoolId: user.schoolId,
        userId: req.user.id,
        userName: req.user.name,
        role: req.user.role,
        action: 'INVITATION_REVOKED',
        module: 'AUTHENTICATION',
        details: `Revoked pending invitation for ${user.email}`,
        ipAddress: req.ip
      });

      res.json({
        success: true,
        message: `Invitation for ${user.email} was successfully revoked.`
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Failed to revoke invitation: ' + err.message });
    }
  }
);

export default router;
