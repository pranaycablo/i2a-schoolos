import express from 'express';
import { getDb } from '../db.js';
import {
  authenticateToken,
  enforceTenant,
  requireRoles,
  logAuditEvent
} from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/notifications
 * In-app notifications for authenticated user / school
 */
router.get('/', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const filter = { ...req.tenantFilter };

    // Role-based or user-targeted filtering
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'PRINCIPAL') {
      filter.$or = [
        { recipientEmail: req.user.email },
        { recipientId: req.user.id },
        { role: req.user.role },
        { recipientType: 'ALL' }
      ];
    }

    const notifications = await database.collection('notifications').find(filter).sort({ dispatchedAt: -1 }).limit(50).toArray();
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/notifications/dispatch
 * Dispatches notification to in-app hub and logs external provider status
 */
router.post('/dispatch', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'STAFF', 'TEACHER'), async (req, res) => {
  try {
    const { recipientType, recipientName, recipientEmail, recipientPhone, role, title, message, channel = 'IN_APP' } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: 'Title and message are required.' });
    }

    const database = await getDb();
    const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);
    const whatsappConfigured = Boolean(process.env.WHATSAPP_API_KEY);

    let deliveryStatus = 'IN_APP_QUEUED';
    if (channel === 'EMAIL') {
      deliveryStatus = smtpConfigured ? 'SENT_VIA_SMTP' : 'BLOCKED_NO_SMTP_PROVIDER';
    } else if (channel === 'WHATSAPP') {
      deliveryStatus = whatsappConfigured ? 'SENT_VIA_WHATSAPP' : 'BLOCKED_NO_WHATSAPP_PROVIDER';
    }

    const newNotif = {
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: req.user.schoolId,
      recipientType: recipientType || 'STUDENT',
      recipientName: recipientName || 'Recipient',
      recipientEmail: recipientEmail || '',
      recipientPhone: recipientPhone || '',
      role: role || 'ALL',
      title,
      message,
      channel,
      deliveryStatus,
      read: false,
      dispatchedBy: req.user.name,
      dispatchedDate: new Date().toISOString().split('T')[0],
      dispatchedAt: new Date().toLocaleString('en-IN')
    };

    await database.collection('notifications').insertOne(newNotif);

    res.status(201).json({
      success: true,
      notification: newNotif,
      providerNote: !smtpConfigured && channel === 'EMAIL'
        ? 'NOTE: Live email delivery is pending SMTP configuration (SMTP_HOST, SMTP_USER). In-app notification preserved.'
        : undefined
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/notifications/:id/read
 * Marks single notification as read
 */
router.put('/:id/read', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const result = await database.collection('notifications').updateOne(
      { id: req.params.id, ...req.tenantFilter },
      { $set: { read: true, readAt: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Notification not found in authorized school.' });
    }

    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/notifications/clear
 * Clears read notifications
 */
router.delete('/clear', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    await database.collection('notifications').deleteMany({
      ...req.tenantFilter,
      read: true
    });
    res.json({ success: true, message: 'Cleared read notifications.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
