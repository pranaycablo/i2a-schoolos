/**
 * i2A SchoolOS — Hardened Email Delivery, SMTP/Gmail Adapter & Test Sink Engine
 * Reference: Section 5 — Real Email Provider Integration & Real vs Simulated Classification
 */

import crypto from 'crypto';
import nodemailer from 'nodemailer';

// In-memory local email sink for deterministic, leak-free automated acceptance testing
const localEmailSink = [];
const MAX_SINK_CAPACITY = 200;

/**
 * Resolve trusted public base URL for activation and recovery links.
 * Never relies on untrusted client Host headers.
 */
export function getPublicBaseUrl() {
  return (
    process.env.PUBLIC_APP_URL ||
    process.env.APP_URL ||
    process.env.VITE_APP_URL ||
    'https://schoolos.in'
  ).replace(/\/+$/, '');
}

/**
 * Determine email provider mode
 * Returns 'GMAIL_SMTP' | 'CUSTOM_SMTP' | 'TEST_SINK'
 */
export function getEmailProviderMode() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    if (process.env.SMTP_HOST.toLowerCase().includes('gmail.com')) {
      return 'GMAIL_SMTP';
    }
    return 'CUSTOM_SMTP';
  }
  return 'TEST_SINK';
}

/**
 * Clear local email sink (used in test teardown/setup)
 */
export function clearEmailSink() {
  localEmailSink.length = 0;
}

/**
 * Retrieve all emails captured in sink
 */
export function getEmailSink() {
  return [...localEmailSink];
}

/**
 * Peek at the most recently dispatched email
 */
export function peekLatestEmail() {
  return localEmailSink[localEmailSink.length - 1] || null;
}

/**
 * Validate RFC 5322 email string and sanitize to prevent CRLF injection
 */
export function validateEmailAddress(email) {
  if (!email || typeof email !== 'string') return false;
  // Anti-CRLF header injection
  if (email.includes('\r') || email.includes('\n')) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email.trim());
}

/**
 * Sanitize header string to prevent email header injection
 */
export function sanitizeHeader(val) {
  if (!val) return '';
  return String(val).replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Create or configure live SMTP transport instance
 */
export function createSmtpTransport(options = {}) {
  const host = options.host || process.env.SMTP_HOST;
  const port = options.port || Number(process.env.SMTP_PORT) || 587;
  const user = options.user || process.env.SMTP_USER;
  const pass = options.pass || process.env.SMTP_PASS;
  const secure = options.secure !== undefined ? options.secure : (port === 465);

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    tls: {
      rejectUnauthorized: process.env.NODE_ENV === 'production'
    }
  });
}

/**
 * Verify SMTP connection and authentication status
 */
export async function verifySmtpConnection(transporter) {
  const tx = transporter || createSmtpTransport();
  if (!tx) {
    return {
      verified: false,
      reason: 'CONFIG_MISSING',
      error: 'SMTP_HOST, SMTP_USER, or SMTP_PASS environment variables are not configured.'
    };
  }

  try {
    await tx.verify();
    return {
      verified: true,
      reason: 'CONNECTED',
      error: null
    };
  } catch (err) {
    return {
      verified: false,
      reason: 'AUTH_OR_CONNECTION_FAILED',
      error: err.message
    };
  }
}

/**
 * Core email dispatch engine
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  templateName = 'GENERIC',
  schoolId = 'PLATFORM',
  schoolName = 'i2A SchoolOS',
  forceLiveDelivery = false
}) {
  const cleanTo = sanitizeHeader(to).toLowerCase();
  const cleanSubject = sanitizeHeader(subject);

  if (!validateEmailAddress(cleanTo)) {
    const err = new Error(`INVALID_RECIPIENT_EMAIL: The address '${to}' is malformed or invalid.`);
    err.code = 'INVALID_RECIPIENT_EMAIL';
    err.status = 400;
    throw err;
  }

  const providerMode = getEmailProviderMode();
  // Safe test isolation: Unless explicitly forced for a controlled staging verification test,
  // test environment always routes to the deterministic in-memory sink.
  const isSimulated = !forceLiveDelivery && (providerMode === 'TEST_SINK' || process.env.NODE_ENV === 'test');

  const messageRecord = {
    id: `msg-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`,
    to: cleanTo,
    subject: cleanSubject,
    templateName,
    schoolId,
    schoolName,
    text: text || '',
    html: html || '',
    providerMode,
    isSimulated,
    dispatchedAt: new Date().toISOString()
  };

  // Record into sink for audit and test inspection
  if (localEmailSink.length >= MAX_SINK_CAPACITY) {
    localEmailSink.shift();
  }
  localEmailSink.push(messageRecord);

  // If live SMTP/Gmail is active and live delivery is required
  if (!isSimulated && (providerMode === 'GMAIL_SMTP' || providerMode === 'CUSTOM_SMTP')) {
    const transporter = createSmtpTransport();
    if (!transporter) {
      return {
        success: false,
        deliveryStatus: 'FAILED',
        error: 'SMTP credentials missing at dispatch time.',
        recipient: cleanTo
      };
    }

    const fromAddress = process.env.SMTP_FROM || `"${sanitizeHeader(schoolName)}" <${process.env.SMTP_USER}>`;

    // Safe retry loop (up to 2 retries) for transient transport errors
    let attempts = 0;
    let lastError = null;
    while (attempts < 2) {
      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: cleanTo,
          subject: cleanSubject,
          text: text || '',
          html: html || ''
        });

        return {
          success: true,
          messageId: info.messageId || messageRecord.id,
          deliveryStatus: 'PROVIDER_ACCEPTED',
          provider: providerMode,
          isRealDelivery: true,
          recipient: cleanTo,
          attempts: attempts + 1
        };
      } catch (err) {
        lastError = err;
        attempts++;
        if (attempts < 2) {
          await new Promise(r => setTimeout(r, 500));
        }
      }
    }

    return {
      success: false,
      deliveryStatus: 'FAILED',
      error: `SMTP delivery failed after ${attempts} attempts: ${lastError?.message}`,
      provider: providerMode,
      isRealDelivery: true,
      recipient: cleanTo
    };
  }

  // Simulated test sink response
  return {
    success: true,
    messageId: messageRecord.id,
    deliveryStatus: 'SIMULATED_TEST_SINK',
    provider: 'LOCAL_TEST_SINK',
    isRealDelivery: false,
    note: 'Email captured in synthetic test sink. Live SMTP not contacted.',
    recipient: cleanTo
  };
}

// ---------------------------------------------------------------------------
// HTML & Plaintext Email Templates
// ---------------------------------------------------------------------------

export function renderStudentInvitationTemplate({
  studentName,
  schoolName,
  className,
  section,
  activationLink,
  expiresAt
}) {
  const subject = `Welcome to ${schoolName} — Activate Your Student Account`;
  const text = `Dear ${studentName},\n\nYou have been enrolled in Class ${className}-${section} at ${schoolName}.\nPlease activate your student account and choose your password using the link below:\n\n${activationLink}\n\nThis activation link is single-use and will expire on ${expiresAt}.\n\nWarm regards,\n${schoolName} Administration`;

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="background-color: #1e1b4b; padding: 20px; border-radius: 12px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">i2A SchoolOS</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #a5b4fc;">${schoolName}</p>
      </div>
      <div style="padding: 24px 0;">
        <h3 style="color: #0f172a; margin-top: 0;">Welcome, ${studentName}!</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Your student account has been created for <strong>Class ${className}-${section}</strong> at <strong>${schoolName}</strong>.
          To access your daily timetable, homework assignments, and academic reports, please activate your account and establish a secure password.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${activationLink}" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
            Activate Student Account
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          * Security Notice: This link is single-use and valid until <strong>${expiresAt}</strong>. Do not share this link with anyone.
        </p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
        Official Student Onboarding Notification • ${schoolName}
      </div>
    </div>
  `;

  return { subject, text, html, templateName: 'STUDENT_INVITATION' };
}

export function renderParentInvitationTemplate({
  parentName,
  childName,
  className,
  section,
  schoolName,
  activationLink,
  expiresAt
}) {
  const subject = `Welcome to ${schoolName} Parent Portal — Activate Your Account for ${childName}`;
  const text = `Dear ${parentName},\n\nYou have been invited to the Parent Portal at ${schoolName} for your ward ${childName} (Class ${className}-${section}).\nPlease set up your password and access fee receipts, attendance, and progress reports here:\n\n${activationLink}\n\nThis activation link expires on ${expiresAt}.\n\nBest regards,\n${schoolName}`;

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="background-color: #312e81; padding: 20px; border-radius: 12px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">i2A SchoolOS — Parent Portal</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #c7d2fe;">${schoolName}</p>
      </div>
      <div style="padding: 24px 0;">
        <h3 style="color: #0f172a; margin-top: 0;">Namaste, ${parentName}!</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Your parent portal account has been provisioned for your child <strong>${childName}</strong> (Class ${className}-${section}).
          Through the portal, you can monitor attendance, view term marks, and pay fee dues securely.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${activationLink}" style="background-color: #4338ca; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
            Activate Parent Portal Account
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          * Security Notice: Single-use link expires on <strong>${expiresAt}</strong>.
        </p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
        Official Parent Portal Invitation • ${schoolName}
      </div>
    </div>
  `;

  return { subject, text, html, templateName: 'PARENT_INVITATION' };
}

export function renderStaffInvitationTemplate({
  staffName,
  role,
  department,
  schoolName,
  activationLink,
  expiresAt
}) {
  const subject = `Employee Account Activation — ${schoolName} (${role})`;
  const text = `Dear ${staffName},\n\nYour employee account for ${schoolName} (${department} Department — Role: ${role}) is ready for activation.\nPlease establish your password using the link below:\n\n${activationLink}\n\nExpires: ${expiresAt}\n\nHuman Resources, ${schoolName}`;

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="background-color: #0f172a; padding: 20px; border-radius: 12px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">i2A SchoolOS — Staff Workforce</h2>
        <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">${schoolName}</p>
      </div>
      <div style="padding: 24px 0;">
        <h3 style="color: #0f172a; margin-top: 0;">Welcome to the Team, ${staffName}!</h3>
        <p style="color: #475569; font-size: 14px; line-height: 1.6;">
          Your staff account has been provisioned with role <strong>${role}</strong> in the <strong>${department}</strong> department.
          Please click below to activate your account and configure your credentials.
        </p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${activationLink}" style="background-color: #0284c7; color: #ffffff; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px; display: inline-block;">
            Activate Staff Account
          </a>
        </div>
        <p style="color: #64748b; font-size: 12px; margin-top: 24px;">
          * Security Notice: Single-use link expires on <strong>${expiresAt}</strong>.
        </p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
        Official Workforce Invitation • ${schoolName}
      </div>
    </div>
  `;

  return { subject, text, html, templateName: 'STAFF_INVITATION' };
}

export function renderPasswordResetOtpTemplate({
  userName,
  otp,
  expiresInMinutes = 10,
  schoolName = 'i2A SchoolOS'
}) {
  const subject = `Your Password Reset Verification Code: ${otp} — ${schoolName}`;
  const text = `Hello ${userName},\n\nYour 6-digit password reset verification code is:\n\n${otp}\n\nThis code will expire in ${expiresInMinutes} minutes.\nIf you did not request this code, please contact your school administrator immediately.\n\n${schoolName}`;

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="background-color: #0f172a; padding: 20px; border-radius: 12px; text-align: center; color: #ffffff;">
        <h2 style="margin: 0; font-size: 20px;">i2A SchoolOS Security Desk</h2>
      </div>
      <div style="padding: 24px 0; text-align: center;">
        <h3 style="color: #0f172a; margin-top: 0;">Password Reset Verification Code</h3>
        <p style="color: #475569; font-size: 14px;">Enter the following 6-digit code to proceed with resetting your password:</p>
        <div style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #4338ca; padding: 16px; background-color: #eef2ff; border-radius: 12px; display: inline-block; margin: 16px 0;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 12px;">This code is valid for ${expiresInMinutes} minutes and can only be used once.</p>
      </div>
      <div style="border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center;">
        Automated Security Notification • ${schoolName}
      </div>
    </div>
  `;

  return { subject, text, html, templateName: 'PASSWORD_RESET_OTP' };
}

export function renderPasswordChangedTemplate({
  userName,
  schoolName = 'i2A SchoolOS',
  changedAt = new Date().toLocaleString('en-IN')
}) {
  const subject = `Security Alert: Your Password Was Changed — ${schoolName}`;
  const text = `Hello ${userName},\n\nYour password for ${schoolName} was successfully changed on ${changedAt}.\nIf you did not perform this action, please alert your administrator immediately.\n\n${schoolName} Security Team`;

  const html = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
      <div style="background-color: #047857; padding: 16px; border-radius: 12px; text-align: center; color: #ffffff;">
        <h3 style="margin: 0;">Security Alert: Password Updated</h3>
      </div>
      <div style="padding: 24px 0;">
        <p style="color: #334155; font-size: 14px;">Dear ${userName},</p>
        <p style="color: #475569; font-size: 14px; line-height: 1.5;">
          The password associated with your account at <strong>${schoolName}</strong> was successfully updated on <strong>${changedAt}</strong>.
          Active sessions on other devices have been securely invalidated.
        </p>
        <p style="color: #dc2626; font-size: 13px; font-weight: 600;">
          If you did not initiate this change, contact your school administrator or IT department immediately.
        </p>
      </div>
    </div>
  `;

  return { subject, text, html, templateName: 'PASSWORD_CHANGED_ALERT' };
}
