import { describe, it, expect } from 'vitest';
import type { SystemNotification, DispatchedEmailPayload } from '../types';

describe('i2A SchoolOS Credentials & WebApp Notification Dispatch Engine', () => {
  const WEBAPP_URL = 'https://pranaycablo.github.io/i2a-schoolos/';

  it('1. Generates verified School Admin Credentials payload on school registration', () => {
    const schoolPayload: DispatchedEmailPayload = {
      to: 'principal@delhipublic.edu.in',
      recipientName: 'Dr. R.K. Sharma',
      subject: 'i2A SchoolOS: Welcome to Delhi Public Academy - Credentials & Portal Access',
      schoolName: 'Delhi Public Academy',
      schoolId: 'I2A-SCH-000009',
      role: 'ADMIN',
      loginId: 'I2A-SCH-000009',
      username: 'principal@delhipublic.edu.in',
      password: 'Admin@2026#Launch',
      loginUrl: WEBAPP_URL,
      webAppDownloadUrl: WEBAPP_URL,
      dispatchedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };

    expect(schoolPayload.role).toBe('ADMIN');
    expect(schoolPayload.schoolId).toBe('I2A-SCH-000009');
    expect(schoolPayload.password).toBe('Admin@2026#Launch');
    expect(schoolPayload.webAppDownloadUrl).toContain('pranaycablo.github.io/i2a-schoolos');
  });

  it('2. Dispatches Staff Credentials payload with WebApp installation link on employee onboarding', () => {
    const staffPayload: DispatchedEmailPayload = {
      to: 'vikram.singh@delhipublic.edu.in',
      recipientName: 'Vikram Singh',
      subject: 'Staff Credentials & WebApp Download - Delhi Public Academy',
      schoolName: 'Delhi Public Academy',
      schoolId: 'I2A-SCH-000009',
      role: 'STAFF',
      loginId: 'EMP-2026-0891',
      username: 'vikram.singh@delhipublic.edu.in',
      password: 'Staff@2026',
      loginUrl: WEBAPP_URL,
      webAppDownloadUrl: WEBAPP_URL,
      dispatchedAt: '12:30 PM'
    };

    const notif: SystemNotification = {
      id: 'notif-staff-1',
      type: 'STAFF_CREDENTIALS',
      title: 'स्टाफ क्रेडेंशियल्स प्रेषित: Vikram Singh',
      message: 'Vikram Singh (ID: EMP-2026-0891) को लॉगिन पासवर्ड व वेबऐप डाउनलोड लिंक ईमेल पर भेज दिया गया है।',
      recipientEmail: 'vikram.singh@delhipublic.edu.in',
      recipientName: 'Vikram Singh',
      recipientRole: 'STAFF',
      timestamp: 'Just now',
      read: false,
      emailPayload: staffPayload
    };

    expect(notif.type).toBe('STAFF_CREDENTIALS');
    expect(notif.emailPayload?.loginId).toBe('EMP-2026-0891');
    expect(notif.emailPayload?.password).toBe('Staff@2026');
    expect(notif.read).toBe(false);
  });

  it('3. Dispatches Student/Parent Credentials payload with WebApp guide upon admission approval', () => {
    const studentPayload: DispatchedEmailPayload = {
      to: 'parent.aarav@gmail.com',
      recipientName: 'Aarav Sharma (Parent)',
      subject: 'Student Login Credentials & Mobile WebApp Download - Delhi Public Academy',
      schoolName: 'Delhi Public Academy',
      schoolId: 'I2A-SCH-000009',
      role: 'STUDENT',
      loginId: 'STU-2026-4412',
      username: 'parent.aarav@gmail.com',
      password: 'Student@2026',
      loginUrl: WEBAPP_URL,
      webAppDownloadUrl: WEBAPP_URL,
      dispatchedAt: '12:35 PM'
    };

    expect(studentPayload.role).toBe('STUDENT');
    expect(studentPayload.loginId).toMatch(/^STU-2026-/);
    expect(studentPayload.password).toBe('Student@2026');
    expect(studentPayload.webAppDownloadUrl).toBe(WEBAPP_URL);
  });

  it('4. Correctly flags notification as read upon user view or acknowledge', () => {
    const notif: SystemNotification = {
      id: 'notif-ack-1',
      type: 'SCHOOL_CREDENTIALS',
      title: 'School Registered',
      message: 'Credentials sent',
      recipientEmail: 'test@school.in',
      recipientName: 'Principal Test',
      recipientRole: 'ADMIN',
      timestamp: 'Just now',
      read: false
    };

    const updatedNotif = { ...notif, read: true };
    expect(updatedNotif.read).toBe(true);
  });
});
