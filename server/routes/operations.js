import express from 'express';
import { getDb } from '../db.js';
import {
  authenticateToken,
  enforceTenant,
  requireRoles,
  logAuditEvent
} from '../middleware/auth.js';

const router = express.Router();

// -------------------------------------------------------------
// 1. STAFF WORKFORCE
// -------------------------------------------------------------
router.get('/staff', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const staff = await database.collection('staff').find(req.tenantFilter).toArray();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/staff', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN'), async (req, res) => {
  try {
    const database = await getDb();
    const data = req.body;
    const newStaff = {
      ...data,
      id: `stf-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: req.user.schoolId,
      status: data.status || 'ACTIVE',
      createdAt: new Date().toISOString()
    };
    await database.collection('staff').insertOne(newStaff);
    res.status(201).json({ success: true, staff: newStaff });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 2. PAYROLL RECORDS
// -------------------------------------------------------------
router.get('/payroll', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const database = await getDb();
    const records = await database.collection('payroll').find(req.tenantFilter).sort({ month: -1 }).toArray();
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/payroll/disburse', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { recordId } = req.body;
    const database = await getDb();

    const record = await database.collection('payroll').findOne({ id: recordId, ...req.tenantFilter });
    if (!record) return res.status(404).json({ error: 'Payroll record not found.' });

    const result = await database.collection('payroll').updateOne(
      { id: recordId, ...req.tenantFilter },
      {
        $set: {
          status: 'PAID',
          disbursedAt: new Date().toISOString(),
          disbursedBy: req.user.name
        }
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Payroll record not found in authorized school.' });
    }

    // Record School Expense
    await database.collection('expenses').insertOne({
      id: `exp-pay-${Date.now()}`,
      schoolId: record.schoolId,
      title: `Salary Disbursement: ${record.staffName} (${record.month})`,
      category: 'SALARY',
      amount: record.netSalary,
      type: 'EXPENSE',
      date: new Date().toISOString().split('T')[0],
      status: 'VERIFIED',
      recordedBy: req.user.name,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, message: `Disbursed ₹${record.netSalary} to ${record.staffName}.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 3. EXPENSE MANAGEMENT
// -------------------------------------------------------------
router.get('/expenses', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const database = await getDb();
    const expenses = await database.collection('expenses').find(req.tenantFilter).sort({ date: -1 }).toArray();
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/expenses', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { title, category, amount, date, description } = req.body;
    if (!title || amount === undefined) {
      return res.status(400).json({ error: 'Expense title and amount are required.' });
    }

    const database = await getDb();
    const newExp = {
      id: `exp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: req.user.schoolId,
      title,
      category: category || 'OPERATIONAL',
      amount: Number(amount),
      type: 'EXPENSE',
      date: date || new Date().toISOString().split('T')[0],
      description: description || '',
      recordedBy: req.user.name,
      status: 'VERIFIED',
      createdAt: new Date().toISOString()
    };

    await database.collection('expenses').insertOne(newExp);
    res.status(201).json({ success: true, expense: newExp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 4. TRANSPORT FLEET & ROUTES
// -------------------------------------------------------------
router.get('/transport', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const routes = await database.collection('transport_routes').find(req.tenantFilter).toArray();
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/transport', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'TRANSPORT'), async (req, res) => {
  try {
    const database = await getDb();
    const data = req.body;
    const newRoute = {
      ...data,
      id: `tr-${Date.now()}`,
      schoolId: req.user.schoolId,
      createdAt: new Date().toISOString()
    };
    await database.collection('transport_routes').insertOne(newRoute);
    res.status(201).json({ success: true, route: newRoute });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// 5. LIBRARY CATALOG
// -------------------------------------------------------------
router.get('/library', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const books = await database.collection('digital_books').find(req.tenantFilter).toArray();
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/library', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'TEACHER'), async (req, res) => {
  try {
    const database = await getDb();
    const data = req.body;
    const newBook = {
      ...data,
      id: data.id || `bk-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: req.user.schoolId,
      createdAt: new Date().toISOString()
    };
    await database.collection('digital_books').insertOne(newBook);
    res.status(201).json({ success: true, book: newBook });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
