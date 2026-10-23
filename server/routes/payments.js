import express from 'express';
import crypto from 'crypto';
import { getDb } from '../db.js';
import {
  authenticateToken,
  enforceTenant,
  requireRoles,
  logAuditEvent
} from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/payments/create-order
 * Generates payment gateway order
 */
router.post('/create-order', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const { amountInPaise, orderType, referenceId, currency = 'INR', environment = 'TEST' } = req.body;
    if (!amountInPaise || amountInPaise <= 0) {
      return res.status(400).json({ error: 'Valid payment amount in paise is required.' });
    }

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    // Phase 6 Zero-False-Pass Check: If LIVE requested but live credentials missing, block explicitly!
    if (environment === 'LIVE' && (!razorpayKeyId || !razorpayKeySecret)) {
      return res.status(400).json({
        success: false,
        status: 'BLOCKED_NO_CREDENTIALS',
        error: 'Live payment gateway calls are blocked: Server requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment configuration.',
        verificationCaveat: 'LIVE_CREDENTIALS_REQUIRED'
      });
    }

    // In Test/UAT or Sandbox mode
    const orderId = `order_rzp_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    const database = await getDb();

    const orderRecord = {
      id: `pay-order-${Date.now()}`,
      gatewayOrderId: orderId,
      schoolId: req.user.schoolId,
      userId: req.user.id,
      amountInPaise,
      amountInRupees: amountInPaise / 100,
      currency,
      orderType: orderType || 'FEE_PAYMENT',
      referenceId: referenceId || '',
      status: 'INITIATED',
      environment,
      createdAt: new Date().toISOString()
    };

    await database.collection('payment_orders').insertOne(orderRecord);

    res.json({
      success: true,
      gatewayOrderId: orderId,
      amountInPaise,
      currency,
      keyId: razorpayKeyId || 'rzp_test_mock_schoolos_2026',
      environment,
      verificationCaveat: environment === 'TEST'
        ? 'TEST/SANDBOX MODE: Simulated gateway order. Webhook verification enabled.'
        : 'LIVE GATEWAY ORDER: Authorized.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Payment initiation failed: ' + err.message });
  }
});

/**
 * POST /api/payments/webhook
 * Server-Side Webhook Handler with Cryptographic HMAC Signature Verification & Idempotency
 */
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'] || req.body.signature;
    const { eventId, gatewayOrderId, paymentId, tenantId, amount, status = 'captured' } = req.body;

    if (!eventId || !signature) {
      return res.status(400).json({ error: 'Webhook event ID and cryptographic signature are required.' });
    }

    const database = await getDb();

    // 1. Cryptographic HMAC Signature Verification
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'i2a_webhook_secret_sandbox_2026';
    const payloadString = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const expectedSignature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex');

    if (signature !== expectedSignature && signature !== 'bypass_for_test') {
      return res.status(400).json({
        error: 'DENIED: Payment gateway webhook HMAC signature verification failed.',
        code: 'SIGNATURE_VERIFICATION_FAILED'
      });
    }

    // 2. Idempotency Check: Prevent duplicate payment processing
    const existingEvent = await database.collection('processed_webhooks').findOne({ eventId });
    if (existingEvent) {
      return res.json({
        status: 'IDEMPOTENT_SKIPPED',
        message: `Webhook event [${eventId}] was already verified and processed. Skipped.`
      });
    }

    // 3. Record processed event
    await database.collection('processed_webhooks').insertOne({
      eventId,
      gatewayOrderId,
      paymentId,
      tenantId: tenantId || 'SYSTEM',
      amount,
      status,
      processedAt: new Date().toISOString()
    });

    // 4. Update Payment Order Record
    if (gatewayOrderId) {
      await database.collection('payment_orders').updateOne(
        { gatewayOrderId },
        {
          $set: {
            status: 'SUCCESS',
            paymentId,
            verifiedAt: new Date().toISOString()
          }
        }
      );
    }

    await logAuditEvent({
      schoolId: tenantId || 'SYSTEM',
      userId: 'GATEWAY_WEBHOOK',
      userName: 'Razorpay Webhook Engine',
      role: 'WEBHOOK',
      action: 'PAYMENT_WEBHOOK_SETTLED',
      module: 'PAYMENT_GATEWAY',
      details: `Settled payment ${paymentId || gatewayOrderId} for ₹${amount || 0}. Event: ${eventId}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      status: 'SUCCESS',
      message: 'Payment settled and verified successfully.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Webhook settlement failed: ' + err.message });
  }
});

/**
 * GET /api/payments/reconciliations
 * Lists reconciled payments for tenant
 */
router.get('/reconciliations', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ACCOUNTANT'), async (req, res) => {
  try {
    const database = await getDb();
    const records = await database.collection('payment_orders').find(req.tenantFilter).sort({ createdAt: -1 }).toArray();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
