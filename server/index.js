import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDb, closeDb, checkDbHealth } from './db.js';
import { initializeUserPasswords } from './routes/auth.js';

// Route Modules
import authRoutes from './routes/auth.js';
import tenantRoutes from './routes/tenants.js';
import studentRoutes from './routes/students.js';
import admissionRoutes from './routes/admissions.js';
import attendanceRoutes from './routes/attendance.js';
import timetableRoutes from './routes/timetables.js';
import homeworkRoutes from './routes/homework.js';
import examRoutes from './routes/exams.js';
import feeRoutes from './routes/fees.js';
import marketplaceRoutes from './routes/marketplace.js';
import operationsRoutes from './routes/operations.js';
import subscriptionRoutes from './routes/subscription.js';
import paymentRoutes from './routes/payments.js';
import notificationRoutes from './routes/notifications.js';

import organizationRoutes from './routes/organizations.js';
import privacyRoutes from './routes/privacy.js';
import categoryRoutes, { ensureCategoriesSeeded } from './routes/categories.js';
import pricingRoutes from './routes/pricing.js';
import hierarchyRoutes from './routes/hierarchy.js';
import staffRoutes from './routes/staff.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------------------------------------------------------------------
// Security Headers Middleware
// ---------------------------------------------------------------------------
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// ---------------------------------------------------------------------------
// Standard Middleware & Request Parsers
// ---------------------------------------------------------------------------
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173'
];
if (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN !== '*') {
  allowedOrigins.push(process.env.CORS_ORIGIN);
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin) || process.env.CORS_ORIGIN === '*' || process.env.NODE_ENV === 'test') {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Request ID & timing middleware for debugging
app.use((req, res, next) => {
  req.requestId = `req-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  req.startTime = Date.now();
  next();
});

// ---------------------------------------------------------------------------
// Strict NoSQL Injection Validation (Fail-Closed, Zero Silent Data Corruption)
// Rejects any keys starting with '$' or containing '.' with HTTP 400
// Preserves legitimate nested JSON objects with alphanumeric keys intact
// ---------------------------------------------------------------------------
function detectNoSqlInjection(target) {
  if (!target || typeof target !== 'object') return null;
  for (const key of Object.keys(target)) {
    if (key.startsWith('$') || key.includes('.')) {
      return key;
    }
    if (typeof target[key] === 'object' && target[key] !== null) {
      const nested = detectNoSqlInjection(target[key]);
      if (nested) return nested;
    }
  }
  return null;
}

app.use((req, res, next) => {
  const badKey = detectNoSqlInjection(req.query) || 
                 detectNoSqlInjection(req.params) || 
                 detectNoSqlInjection(req.body);
  if (badKey) {
    return res.status(400).json({
      success: false,
      error: `MALICIOUS_INPUT: NoSQL operator injection detected in key '${badKey}'. Request rejected.`,
      code: 'NOSQL_INJECTION_REJECTED',
      key: badKey,
      requestId: req.requestId
    });
  }
  next();
});

// ---------------------------------------------------------------------------
// Health Check (unauthenticated — used by load balancers & monitoring)
// ---------------------------------------------------------------------------
app.get('/api/health', async (req, res) => {
  try {
    const dbHealth = await checkDbHealth();
    const uptime = process.uptime();
    res.json({
      status: dbHealth.ok ? 'ONLINE' : 'DEGRADED',
      database: dbHealth.ok ? 'CONNECTED' : 'UNREACHABLE',
      dbError: dbHealth.ok ? undefined : dbHealth.error,
      uptimeSeconds: Math.floor(uptime),
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'ERROR',
      database: 'UNREACHABLE',
      error: err.message
    });
  }
});

// ---------------------------------------------------------------------------
// Mount All API Routes
// ---------------------------------------------------------------------------
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/privacy', privacyRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/timetables', timetableRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/hierarchy', hierarchyRoutes);
app.use('/api/staff', staffRoutes);

// ---------------------------------------------------------------------------
// Audit Logs route (read-only, authenticated)
// ---------------------------------------------------------------------------
import { authenticateToken, enforceTenant, requireRoles } from './middleware/auth.js';

app.get('/api/audit-logs', authenticateToken, enforceTenant, requireRoles('SUPER_ADMIN', 'PRINCIPAL', 'ADMIN', 'ORG_DIRECTOR', 'PLATFORM_AUDITOR', 'ORG_AUDITOR'), async (req, res) => {
  try {
    const database = await getDb();
    const filter = { ...req.tenantFilter };
    const logs = await database.collection('audit_logs')
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(200)
      .toArray();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// 404 Handler for unmatched API routes
// ---------------------------------------------------------------------------
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    error: `API endpoint not found: ${req.method} ${req.originalUrl}`,
    code: 'ROUTE_NOT_FOUND',
    requestId: req.requestId
  });
});

// ---------------------------------------------------------------------------
// Global Error Handler
// ---------------------------------------------------------------------------
app.use((err, req, res, _next) => {
  console.error(`❌ [Server Error] ${req.method} ${req.originalUrl}:`, err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    requestId: req.requestId,
    ...(process.env.NODE_ENV !== 'production' && err.stack ? { detail: err.message } : {})
  });
});

// ---------------------------------------------------------------------------
// Start Server & Initialize Database
// ---------------------------------------------------------------------------
async function startServer() {
  try {
    // Verify database connectivity before accepting requests
    const db = await getDb();
    console.log('✅ [MongoDB] Database connection established.');

    // Initialize seed user password hashes if missing
    await initializeUserPasswords();
    console.log('✅ [Auth] User password hashes initialized.');

    // Initialize default institution categories if missing
    await ensureCategoriesSeeded();

    app.listen(PORT, () => {
      console.log(`\n🌐 i2A SchoolOS API Server running on http://localhost:${PORT}`);
      console.log(`📡 API Base: http://localhost:${PORT}/api`);
      console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/login`);
      console.log(`❤️  Health: http://localhost:${PORT}/api/health`);
      console.log(`⚙️  Environment: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (err) {
    console.error('❌ [FATAL] Failed to start server:', err.message);
    console.error('   Ensure MongoDB is running at:', process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Graceful Shutdown
// ---------------------------------------------------------------------------
async function gracefulShutdown(signal) {
  console.log(`\n🛑 [${signal}] Shutting down gracefully...`);
  await closeDb();
  console.log('✅ [MongoDB] Connection closed.');
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

export { app, startServer };

const isDirectRun = process.argv[1] && (process.argv[1].endsWith('server/index.js') || process.argv[1].endsWith('server\\index.js'));
if (isDirectRun || (!process.env.VITEST && process.env.NODE_ENV !== 'test')) {
  startServer();
}
