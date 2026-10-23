import express from 'express';
import { getDb } from '../db.js';
import {
  authenticateToken,
  enforceTenant,
  requireRoles,
  hashPassword,
  logAuditEvent
} from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/admissions
 * Fetches applications for the school tenant
 */
router.get('/', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'STAFF', 'ACCOUNTANT'), async (req, res) => {
  try {
    const database = await getDb();
    const admissions = await database.collection('admissions').find(req.tenantFilter).toArray();
    res.json(admissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admissions/public
 * Direct public/parent admission application submission
 */
router.post('/public', async (req, res) => {
  try {
    const { schoolId, studentName, applyingClass, parentName, phone, email, remarks, documentsUploaded } = req.body;
    if (!studentName || !parentName || !phone) {
      return res.status(400).json({ error: 'Student name, parent name, and phone are required.' });
    }

    const database = await getDb();
    const targetSchoolId = schoolId || 'I2A-SCH-000001';
    const appNo = `APP-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const newApp = {
      id: `adm-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: targetSchoolId,
      applicationNo: appNo,
      studentName,
      applyingClass: applyingClass || 'Class VIII',
      parentName,
      phone,
      email: email || '',
      remarks: remarks || '',
      submittedDate: new Date().toISOString().split('T')[0],
      status: 'SUBMITTED',
      documentsUploaded: Boolean(documentsUploaded),
      createdAt: new Date().toISOString()
    };

    await database.collection('admissions').insertOne(newApp);

    await logAuditEvent({
      schoolId: targetSchoolId,
      userId: 'PUBLIC_PORTAL',
      userName: parentName,
      role: 'PARENT',
      action: 'SUBMIT_ADMISSION_APPLICATION',
      module: 'ONLINE_ADMISSION',
      details: `Application submitted for ${studentName} (${applyingClass}). App No: ${appNo}`,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, application: newApp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/admissions/:id/status
 * Updates status (INTERVIEW_SCHEDULED, ENTRANCE_PASSED, REJECTED)
 */
router.put('/:id/status', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN'), async (req, res) => {
  try {
    const { status, testScore, interviewDate, remarks } = req.body;
    const database = await getDb();

    const updateFields = {
      status,
      updatedAt: new Date().toISOString()
    };
    if (testScore !== undefined) updateFields.testScore = testScore;
    if (interviewDate) updateFields.interviewDate = interviewDate;
    if (remarks) updateFields.remarks = remarks;

    const result = await database.collection('admissions').updateOne(
      { id: req.params.id, ...req.tenantFilter },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Admission application not found or unauthorized.' });
    }

    res.json({ success: true, message: `Application status updated to ${status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admissions/:id/approve
 * Zero-Manual Automation: Approves admission, creates Student Profile, Parent user account, and enrollment records
 */
router.post('/:id/approve', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN'), async (req, res) => {
  try {
    const database = await getDb();
    const app = await database.collection('admissions').findOne({ id: req.params.id, ...req.tenantFilter });

    if (!app) {
      return res.status(404).json({ error: 'Admission application not found in authorized school.' });
    }

    if (app.status === 'ENROLLED') {
      return res.status(400).json({ error: 'Student has already been enrolled from this application.' });
    }

    const studentCount = await database.collection('students').countDocuments(req.tenantFilter);
    const newAdmissionNo = String(1000 + studentCount + 1);
    const newStudentId = `std-${Date.now()}`;

    // 1. Create Student record
    const newStudent = {
      id: newStudentId,
      schoolId: app.schoolId,
      admissionNo: newAdmissionNo,
      rollNo: String(studentCount + 1),
      name: app.studentName,
      photoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150&auto=format&fit=crop&q=80',
      dob: '2013-03-15',
      gender: 'MALE',
      className: app.applyingClass,
      section: 'A',
      fatherName: app.parentName,
      motherName: 'Parent Guardian',
      parentMobile: app.phone,
      parentWhatsApp: app.phone,
      parentEmail: app.email,
      address: 'Registered Admission Address',
      admissionDate: new Date().toISOString().split('T')[0],
      status: 'ACTIVE',
      documents: { birthCertificate: 'Uploaded' },
      assignedSubjects: ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'],
      attendanceRate: 100,
      createdAt: new Date().toISOString()
    };

    await database.collection('students').insertOne(newStudent);

    // 2. Provision Parent & Student User Accounts with hashed passwords
    if (app.email) {
      const parentUserExisting = await database.collection('users').findOne({ email: app.email.toLowerCase() });
      if (!parentUserExisting) {
        const parentPassHash = await hashPassword('Parent@2026#');
        await database.collection('users').insertOne({
          id: `usr-parent-${Date.now()}`,
          name: `${app.parentName} (Parent)`,
          email: app.email.toLowerCase(),
          role: 'PARENT',
          schoolId: app.schoolId,
          childrenIds: [newStudentId],
          studentId: newStudentId,
          status: 'ACTIVE',
          passwordHash: parentPassHash,
          createdAt: new Date().toISOString()
        });
      } else {
        await database.collection('users').updateOne(
          { _id: parentUserExisting._id },
          { $addToSet: { childrenIds: newStudentId } }
        );
      }
    }

    // 3. Mark application as ENROLLED
    await database.collection('admissions').updateOne(
      { id: req.params.id, ...req.tenantFilter },
      {
        $set: {
          status: 'ENROLLED',
          approvedBy: req.user.name,
          enrolledStudentId: newStudentId,
          enrolledAdmissionNo: newAdmissionNo,
          enrolledAt: new Date().toISOString()
        }
      }
    );

    // 4. Create Notification
    await database.collection('notifications').insertOne({
      id: `notif-${Date.now()}`,
      schoolId: app.schoolId,
      recipientType: 'STUDENT',
      recipientName: `${app.studentName} (Parent: ${app.parentName})`,
      recipientEmail: app.email,
      recipientPhone: app.phone,
      role: 'STUDENT & PARENT',
      title: '🎉 Admission Approved & Profile Provisioned',
      message: `Welcome ${app.studentName} to the school. Your Admission No is #${newAdmissionNo}.`,
      read: false,
      dispatchedAt: new Date().toLocaleString('en-IN')
    });

    await logAuditEvent({
      schoolId: app.schoolId,
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'ZERO_MANUAL_ADMISSION_APPROVAL',
      module: 'ONLINE_ADMISSION',
      details: `Approved application ${app.applicationNo}. Auto-created Student #${newAdmissionNo} and Parent account.`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Admission successfully approved. Student enrolled and accounts created.',
      student: newStudent
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve admission: ' + err.message });
  }
});

export default router;
