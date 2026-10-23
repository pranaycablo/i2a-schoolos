import express from 'express';
import { getDb } from '../db.js';
import {
  authenticateToken,
  enforceTenant,
  requireRoles,
  logAuditEvent
} from '../middleware/auth.js';
import { sendError, ERROR_CODES } from '../middleware/apiResponse.js';

const router = express.Router();

/**
 * GET /api/fees/types
 * List all configured fee types for the tenant
 */
router.get('/types', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const feeTypes = await database.collection('fee_types').find(req.tenantFilter).toArray();
    res.json(feeTypes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/fees/types
 * Configure a new fee component
 */
router.post('/types', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { name, amount, frequency, category, isOptional, description } = req.body;
    if (!name || amount === undefined || isNaN(Number(amount)) || Number(amount) < 0) {
      return sendError(res, {
        status: 400,
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed: Fee name is required and amount must be a non-negative number.',
        req
      });
    }

    const database = await getDb();
    const newFee = {
      id: `fee-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: req.user.role === 'SUPER_ADMIN' ? (req.body.schoolId || req.user.schoolId) : req.user.schoolId,
      name,
      amount: Number(amount),
      frequency: frequency || 'MONTHLY',
      category: category || 'TUITION',
      isOptional: Boolean(isOptional),
      description: description || '',
      createdAt: new Date().toISOString()
    };

    await database.collection('fee_types').insertOne(newFee);

    await logAuditEvent({
      schoolId: newFee.schoolId,
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'CREATE_FEE_TYPE',
      module: 'FEE_MANAGEMENT',
      details: `Created fee type ${name}: ₹${amount} (${frequency})`,
      ipAddress: req.ip
    });

    res.status(201).json({ success: true, feeType: newFee });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/fees/receipts
 * Scoped by School Tenant. Parents only see their children's receipts.
 */
router.get('/receipts', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const filter = { ...req.tenantFilter };

    if (req.user.role === 'PARENT') {
      const allowedStudentIds = req.user.childrenIds || (req.user.studentId ? [req.user.studentId] : []);
      if (req.query.studentId) {
        if (allowedStudentIds.includes(req.query.studentId)) {
          filter.studentId = req.query.studentId;
        } else {
          filter.studentId = { $in: [] };
        }
      } else {
        filter.studentId = { $in: allowedStudentIds };
      }
    } else if (req.user.role === 'STUDENT') {
      const myStudentId = req.user.studentId || req.user.id;
      if (req.query.studentId && req.query.studentId !== myStudentId) {
        filter.studentId = { $in: [] };
      } else {
        filter.studentId = myStudentId;
      }
    }

    const receipts = await database.collection('fee_receipts').find(filter).sort({ paymentDate: -1 }).toArray();
    res.json(receipts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/fees/receipts/collect
 * Server-Side Absolute Financial Source of Truth:
 * Calculates balance, verifies fee amounts against master, generates immutable receipt
 */
router.post('/receipts/collect', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ACCOUNTANT', 'STAFF'), async (req, res) => {
  try {
    const { studentId, feeIds, paymentMode, discountAmount = 0, fineAmount = 0, transactionRef, idempotencyKey } = req.body;
    if (!studentId || !Array.isArray(feeIds) || feeIds.length === 0) {
      return res.status(400).json({ error: 'Student ID and at least one Fee ID are required.' });
    }

    const database = await getDb();

    // Verify student exists and belongs to this school
    const student = await database.collection('students').findOne({ id: studentId, ...req.tenantFilter });
    if (!student) {
      return res.status(404).json({ error: 'Student not found in authorized school.' });
    }

    // 1. Idempotency Check: By idempotencyKey or transactionRef
    const effectiveIdempotencyKey = (idempotencyKey || req.headers['idempotency-key'] || '').toString().trim();
    if (effectiveIdempotencyKey) {
      const existingByIdemp = await database.collection('fee_receipts').findOne({
        schoolId: student.schoolId,
        $or: [
          { idempotencyKey: effectiveIdempotencyKey },
          { transactionRef: effectiveIdempotencyKey }
        ]
      });
      if (existingByIdemp) {
        return res.status(200).json({
          success: true,
          message: 'Existing receipt retrieved via idempotency key.',
          receipt: existingByIdemp,
          duplicatePrevented: true
        });
      }
    }

    // 2. Duplicate Submission Window Guard: Check for identical receipt within last 30 seconds
    const thirtySecAgo = new Date(Date.now() - 30 * 1000).toISOString();
    const sortedFeeIds = [...feeIds].sort().join(',');
    const recentDuplicate = await database.collection('fee_receipts').findOne(
      {
        schoolId: student.schoolId,
        studentId: student.id,
        createdAt: { $gte: thirtySecAgo }
      },
      { sort: { createdAt: -1 } }
    );

    if (recentDuplicate && recentDuplicate.feeBreakup) {
      const recentFeeIds = recentDuplicate.feeBreakup.map(f => f.feeId).filter(Boolean).sort().join(',');
      if (recentFeeIds === sortedFeeIds) {
        return res.status(200).json({
          success: true,
          message: 'Identical collection processed seconds ago. Duplicate submission prevented.',
          receipt: recentDuplicate,
          duplicatePrevented: true
        });
      }
    }

    // Fetch official fee items directly from database (Do not trust client amounts!)
    const feeRecords = await database.collection('fee_types').find({
      id: { $in: feeIds },
      ...req.tenantFilter
    }).toArray();

    if (feeRecords.length === 0) {
      return res.status(400).json({ error: 'No valid fee types found for payment.' });
    }

    const baseTotal = feeRecords.reduce((acc, f) => acc + f.amount, 0);
    const netPayable = Math.max(0, baseTotal + Number(fineAmount) - Number(discountAmount));
    const paidAmount = netPayable;
    const balanceAmount = 0;

    const receiptNo = `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const newReceipt = {
      id: `rcp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: student.schoolId,
      receiptNo,
      studentId: student.id,
      studentName: student.name,
      admissionNo: student.admissionNo,
      className: student.className,
      section: student.section,
      feeBreakup: feeRecords.map(f => ({ feeId: f.id, feeName: f.name, amount: f.amount })),
      baseTotal,
      discountAmount: Number(discountAmount),
      fineAmount: Number(fineAmount),
      totalAmount: netPayable,
      paidAmount,
      balanceAmount,
      paymentMode: paymentMode || 'ONLINE_UPI',
      paymentDate: new Date().toISOString().split('T')[0],
      transactionRef: transactionRef || (effectiveIdempotencyKey || `TXN-OFFLINE-${Date.now()}`),
      status: 'PAID',
      collectedBy: req.user.name,
      collectedByRole: req.user.role,
      createdAt: new Date().toISOString()
    };

    if (effectiveIdempotencyKey) {
      newReceipt.idempotencyKey = effectiveIdempotencyKey;
    }

    try {
      await database.collection('fee_receipts').insertOne(newReceipt);
    } catch (insertErr) {
      if (insertErr.code === 11000 && effectiveIdempotencyKey) {
        const winner = await database.collection('fee_receipts').findOne({
          schoolId: student.schoolId,
          $or: [
            { idempotencyKey: effectiveIdempotencyKey },
            { transactionRef: effectiveIdempotencyKey }
          ]
        });
        if (winner) {
          return res.status(200).json({
            success: true,
            message: 'Concurrent duplicate collection intercepted. Existing receipt returned.',
            receipt: winner,
            duplicatePrevented: true
          });
        }
      }
      throw insertErr;
    }

    // Update student balance in database
    await database.collection('students').updateOne(
      { id: student.id, ...req.tenantFilter },
      {
        $set: {
          lastPaymentDate: newReceipt.paymentDate,
          lastReceiptNo: receiptNo,
          updatedAt: new Date().toISOString()
        },
        $inc: {
          totalPaid: paidAmount
        }
      }
    );

    // Record Ledger Entry
    await database.collection('expenses').insertOne({
      id: `led-${Date.now()}`,
      schoolId: student.schoolId,
      title: `Fee Collection - ${student.name} (${student.admissionNo})`,
      category: 'FEE_INCOME',
      amount: paidAmount,
      type: 'INCOME',
      date: newReceipt.paymentDate,
      receiptNo,
      referenceNo: newReceipt.transactionRef,
      status: 'VERIFIED',
      recordedBy: req.user.name,
      createdAt: new Date().toISOString()
    });

    await logAuditEvent({
      schoolId: student.schoolId,
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'COLLECT_FEE',
      module: 'FEE_MANAGEMENT',
      details: `Collected ₹${paidAmount} from ${student.name} (Receipt #${receiptNo}, Mode: ${paymentMode})`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Payment verified and receipt generated.',
      receipt: newReceipt
    });
  } catch (err) {
    res.status(500).json({ error: 'Fee collection failed: ' + err.message });
  }
});

export default router;
