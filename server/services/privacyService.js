/**
 * i2A SchoolOS — Child Data Privacy & India DPDP Act Readiness Engine
 * Reference: Master Prompt 04 — Part 7: Child Data Privacy & India-Ready Controls
 */

import { recordAuditEvent } from './auditService.js';
import { getDb } from '../db.js';

/**
 * Masks a phone number: preserves last 4 digits
 */
export function maskPhone(phone) {
  if (!phone || typeof phone !== 'string') return '';
  const clean = phone.trim();
  if (clean.length <= 4) return '****';
  return '*'.repeat(clean.length - 4) + clean.slice(-4);
}

/**
 * Masks an email: preserves first character and domain
 */
export function maskEmail(email) {
  if (!email || typeof email !== 'string') return '';
  const parts = email.trim().split('@');
  if (parts.length !== 2) return '****@domain.com';
  const name = parts[0];
  const domain = parts[1];
  if (name.length <= 2) return `*@${domain}`;
  return `${name[0]}${'*'.repeat(Math.max(1, name.length - 2))}${name.slice(-1)}@${domain}`;
}

/**
 * Masks national ID or Aadhaar if present
 */
export function maskNationalId(idStr) {
  if (!idStr || typeof idStr !== 'string') return '';
  const clean = idStr.trim();
  if (clean.length <= 4) return 'XXXX';
  return 'XXXX-XXXX-' + clean.slice(-4);
}

/**
 * Redacts student PII based on requesting user role and object ownership.
 * Implements strict data minimization and purpose limitation.
 */
export function redactStudentPii(student, user) {
  if (!student) return null;
  const clone = { ...student };

  // Super Admin, Principal, and School Admin have full administrative view
  const privilegedRoles = ['SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ADMISSION_OFFICER'];
  if (user && privilegedRoles.includes(user.role)) {
    return clone;
  }

  // Parent viewing their own child has full view
  if (user && user.role === 'PARENT') {
    const isOwnChild = (user.childrenIds && user.childrenIds.includes(student.id)) ||
                       user.studentId === student.id ||
                       (student.parentEmail && student.parentEmail.toLowerCase() === (user.email || '').toLowerCase());
    if (isOwnChild) {
      return clone;
    }
  }

  // Student viewing their own record has full view
  if (user && user.role === 'STUDENT') {
    if ((user.studentId || user.id) === student.id) {
      return clone;
    }
  }

  // For Teachers, Staff, Accountants, and other roles: Apply strict PII redaction
  if (clone.parentMobile) {
    clone.parentMobile = maskPhone(clone.parentMobile);
  }
  if (clone.parentEmail) {
    clone.parentEmail = maskEmail(clone.parentEmail);
  }
  if (clone.fatherMobile) {
    clone.fatherMobile = maskPhone(clone.fatherMobile);
  }
  if (clone.motherMobile) {
    clone.motherMobile = maskPhone(clone.motherMobile);
  }
  if (clone.aadhaar || clone.aadhaarNo || clone.nationalId) {
    clone.aadhaar = maskNationalId(clone.aadhaar || clone.aadhaarNo || clone.nationalId);
    delete clone.aadhaarNo;
    delete clone.nationalId;
  }
  if (clone.annualIncome || clone.parentIncome) {
    delete clone.annualIncome;
    delete clone.parentIncome;
  }
  if (clone.bankAccountNumber) {
    delete clone.bankAccountNumber;
    delete clone.ifscCode;
  }
  if (clone.medicalNotes && user && !['PRINCIPAL', 'ADMIN', 'STAFF'].includes(user.role)) {
    delete clone.medicalNotes;
  }

  clone._isPiiRedacted = true;
  return clone;
}

/**
 * Logs and gates student record bulk export requests
 */
export async function logStudentDataExport({ schoolId, userId, userName, role, recordCount, exportFormat, ipAddress }) {
  return recordAuditEvent({
    schoolId,
    actorId: userId,
    actorName: userName,
    role,
    action: 'STUDENT_PII_EXPORT',
    resourceType: 'STUDENT',
    outcome: 'SUCCESS',
    details: `Exported ${recordCount} student records in format [${exportFormat}]. Purpose: Institutional reporting.`,
    ipAddress
  });
}

/**
 * Handles DPDP Data Subject Rights Requests (Correction, Deletion, Grievance)
 */
export async function submitPrivacyRequest({ schoolId, studentId, requesterEmail, requesterRole, requestType, reason }) {
  const database = await getDb();
  const requestId = `priv-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

  const doc = {
    id: requestId,
    schoolId,
    studentId,
    requesterEmail,
    requesterRole,
    requestType, // 'CORRECTION' | 'ERASURE' | 'REVOCATION' | 'ACCESS'
    reason,
    status: 'PENDING_REVIEW',
    submittedAt: new Date().toISOString()
  };

  await database.collection('privacy_requests').insertOne(doc);

  await recordAuditEvent({
    schoolId,
    actorId: requesterEmail,
    actorName: requesterEmail,
    role: requesterRole,
    action: 'PRIVACY_REQUEST_SUBMITTED',
    resourceType: 'PRIVACY_REQUEST',
    resourceId: requestId,
    outcome: 'SUCCESS',
    details: `Submitted privacy request [${requestType}] for student [${studentId}]. Reason: ${reason}`
  });

  return doc;
}
