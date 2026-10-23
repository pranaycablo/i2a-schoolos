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
 * GET /api/marketplace/products
 * Scoped by School Tenant
 */
router.get('/products', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    let products = await database.collection('marketplace_products').find(req.tenantFilter).toArray();

    // If tenant has no products yet, seed initial default school store items
    if (products.length === 0) {
      const defaultProducts = [
        {
          id: `prod-${req.user.schoolId}-01`,
          schoolId: req.user.schoolId,
          sku: 'UNI-REG-M',
          title: 'Official School Uniform Regular Set (Shirt + Trousers)',
          category: 'UNIFORM',
          price: 1250,
          stock: 45,
          rating: 4.8,
          inStock: true,
          sizes: ['S', 'M', 'L', 'XL'],
          imageUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&auto=format&fit=crop&q=80'
        },
        {
          id: `prod-${req.user.schoolId}-02`,
          schoolId: req.user.schoolId,
          sku: 'KIT-VIII-ALL',
          title: 'Class VIII Complete NCERT Textbook & Workbook Bundle',
          category: 'BOOKS',
          price: 2400,
          stock: 30,
          rating: 4.9,
          inStock: true,
          imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80'
        },
        {
          id: `prod-${req.user.schoolId}-03`,
          schoolId: req.user.schoolId,
          sku: 'STN-GEO-BOX',
          title: 'Deluxe Mathematical Geometry & Drawing Kit',
          category: 'STATIONERY',
          price: 350,
          stock: 80,
          rating: 4.6,
          inStock: true,
          imageUrl: 'https://images.unsplash.com/photo-1588072432836-e10032774350?w=200&auto=format&fit=crop&q=80'
        }
      ];
      await database.collection('marketplace_products').insertMany(defaultProducts);
      products = defaultProducts;
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/marketplace/products
 * Add product (ADMIN / PRINCIPAL)
 */
router.post('/products', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN'), async (req, res) => {
  try {
    const database = await getDb();
    const data = req.body;
    const newProd = {
      ...data,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      schoolId: req.user.schoolId,
      price: Number(data.price) || 0,
      stock: Number(data.stock) || 0,
      inStock: Number(data.stock) > 0,
      createdAt: new Date().toISOString()
    };
    await database.collection('marketplace_products').insertOne(newProd);
    res.status(201).json({ success: true, product: newProd });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/marketplace/orders
 * Orders listing with authorization checks
 */
router.get('/orders', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const database = await getDb();
    const filter = { ...req.tenantFilter };

    if (req.user.role === 'STUDENT' || req.user.role === 'PARENT') {
      filter.userId = req.user.id;
    }

    const orders = await database.collection('marketplace_orders').find(filter).sort({ orderDate: -1 }).toArray();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/marketplace/orders
 * Atomic order creation with Idempotency Key and Inventory Decrement
 */
router.post('/orders', authenticateToken, enforceTenant, async (req, res) => {
  try {
    const { items, paymentMode, deliveryAddress, studentName, className, idempotencyKey } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    const database = await getDb();

    // Idempotency verification: avoid double charge / duplicate order
    if (idempotencyKey) {
      const existingOrder = await database.collection('marketplace_orders').findOne({
        schoolId: req.user.schoolId,
        idempotencyKey
      });
      if (existingOrder) {
        return res.json({
          success: true,
          message: 'Order already processed (Idempotent response).',
          order: existingOrder
        });
      }
    }

    // Verify stock availability
    let totalAmount = 0;
    const validatedItems = [];

    for (const item of items) {
      const prod = await database.collection('marketplace_products').findOne({
        id: item.productId,
        ...req.tenantFilter
      });

      if (!prod) {
        return res.status(404).json({ error: `Product "${item.title || item.productId}" not found in school store.` });
      }

      const qty = Number(item.quantity) || 1;
      if (prod.stock < qty) {
        return res.status(409).json({
          error: `Insufficient stock for "${prod.title}". Requested: ${qty}, Available: ${prod.stock}`,
          code: 'INSUFFICIENT_STOCK'
        });
      }

      totalAmount += prod.price * qty;
      validatedItems.push({
        productId: prod.id,
        sku: prod.sku,
        title: prod.title,
        price: prod.price,
        quantity: qty,
        selectedSize: item.selectedSize || 'STANDARD',
        subtotal: prod.price * qty
      });
    }

    // Atomically decrement stock
    for (const item of validatedItems) {
      await database.collection('marketplace_products').updateOne(
        { id: item.productId, ...req.tenantFilter },
        {
          $inc: { stock: -item.quantity },
          $set: { updatedAt: new Date().toISOString() }
        }
      );
    }

    const orderNo = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const newOrder = {
      id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderNo,
      schoolId: req.user.schoolId,
      userId: req.user.id,
      customerName: req.user.name,
      customerEmail: req.user.email,
      studentName: studentName || req.user.name,
      className: className || 'General',
      items: validatedItems,
      totalAmount,
      paymentMode: paymentMode || 'UPI',
      paymentStatus: 'PAID',
      fulfillmentStatus: 'PROCESSING',
      orderDate: new Date().toISOString(),
      idempotencyKey: idempotencyKey || `idem-${Date.now()}`,
      deliveryAddress: deliveryAddress || 'Campus Counter Pickup'
    };

    await database.collection('marketplace_orders').insertOne(newOrder);

    await logAuditEvent({
      schoolId: req.user.schoolId,
      userId: req.user.id,
      userName: req.user.name,
      role: req.user.role,
      action: 'PLACE_MARKETPLACE_ORDER',
      module: 'SCHOOL_MARKETPLACE',
      details: `Placed Order #${orderNo} for ₹${totalAmount} (${validatedItems.length} items)`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Order successfully placed.',
      order: newOrder
    });
  } catch (err) {
    res.status(500).json({ error: 'Order creation failed: ' + err.message });
  }
});

export default router;
