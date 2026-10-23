# i2A SchoolOS — PRODUCTION DEPLOYMENT & READINESS CHECKLIST

**Document Version:** 1.0.0-PROD  
**Target Environment:** Production Cloud (AWS / GCP / Bare Metal)  
**Architecture:** Node.js Express Backend + MongoDB Replica Set (rs0) + Vite React PWA Client  

---

## 1. Environment Configuration & Secret Management

All secrets MUST be provisioned via secret managers (AWS Secrets Manager, HashiCorp Vault, or encrypted `.env` injected at container runtime). Never commit secrets to version control.

| Variable Name | Required | Default / Format | Description & Security Purpose |
|---------------|----------|------------------|--------------------------------|
| `NODE_ENV` | Yes | `production` | Enables Express production optimizations & disables stack trace leaks |
| `PORT` | Yes | `5000` | Port for the backend API HTTP server |
| `MONGODB_URI` | Yes | `mongodb://user:pass@host1:27017,host2:27017/i2a_schoolos?replicaSet=rs0&ssl=true` | MongoDB connection URI with replica set enabled for multi-document ACID transactions |
| `JWT_SECRET` | Yes | 64+ char cryptographically secure random string | Secret key for signing and verifying user session JWT tokens |
| `CORS_ORIGIN` | Yes | `https://schoolos.in,https://*.schoolos.in` | Explicit allowed web origins for cross-origin resource sharing |
| `ALLOW_PROD_INDEX_INIT` | Only during maintenance | `false` | Must remain `false` during standard startup to protect indexes from accidental mutation |
| `RAZORPAY_KEY_ID` | Production | `rzp_live_...` | Live payment gateway client key for fee checkout |
| `RAZORPAY_KEY_SECRET` | Production | 32+ char secret | Live payment gateway HMAC signature secret for webhook validation |
| `SMTP_HOST` | Production | `smtp.sendgrid.net` | Outbound transactional mail server |
| `SMTP_PORT` | Production | `587` | Outbound mail port (TLS) |
| `SMTP_USER` | Production | `apikey` | Outbound mail username |
| `SMTP_PASS` | Production | Secret key | Outbound mail password |
| `SMS_GATEWAY_API_KEY`| Production | API Key | For parent SMS alerts (DLT approved in India) |

---

## 2. Database Pre-Deployment Migration & Index Initialization

In compliance with strict database safety guards, production index initialization is deliberately blocked during standard server boot.

### Step-by-Step Production Index Provisioning:
1. Verify database connectivity:
   ```bash
   node -e "require('./server/db.js').checkDbHealth().then(console.log)"
   ```
2. Execute controlled index migration with explicit authorization:
   ```bash
   ALLOW_PROD_INDEX_INIT=true node -e "require('./server/db.js').initializeIndexes().then(() => { console.log('Production indexes provisioned successfully.'); process.exit(0); })"
   ```
3. Remove `ALLOW_PROD_INDEX_INIT` from runtime environment before launching services.

---

## 3. High-Availability Replica Set & Transaction Readiness
- MongoDB 7.0+ Replica Set (`rs0`) with at least 3 nodes (1 Primary, 1 Secondary, 1 Arbiter/Secondary) is **mandatory** for:
  - Multi-document transactions (`transactionalHierarchyService.js`)
  - Distributed mutex leases (`hierarchy_locks`)
  - Write concern `w: "majority"` to prevent dirty reads.

---

## 4. Backup, Point-In-Time Recovery & Disaster Recovery

### Daily Scheduled Automated Backup:
```bash
mongodump --uri="$MONGODB_URI" --gzip --archive=/backups/i2a_schoolos_$(date +%Y%m%d_%H%M%S).gz
```

### Point-In-Time Recovery (PITR):
Enable MongoDB Oplog archiving. Test restore in an isolated container:
```bash
mongorestore --uri="mongodb://127.0.0.1:27019/i2a_schoolos_recovery" --gzip --archive=/backups/i2a_schoolos_latest.gz
```

---

## 5. Reverse Proxy, Security Headers & Edge Protection

Configure Nginx or Cloudflare in front of the application:
1. **SSL/TLS:** TLS 1.3 only, HSTS preload enabled (`Strict-Transport-Security: max-age=31536000; includeSubDomains`).
2. **Rate Limiting:**
   - Public auth endpoints (`/api/auth/login`, `/api/auth/reset-password`): 10 requests / minute per IP.
   - Public application submissions (`/api/admissions/public`): 5 requests / minute per IP.
   - Standard API endpoints: 120 requests / minute per IP.
3. **WAF Protection:** Block SQL/NoSQL injection signatures and anomalous query length.

---

## 6. Health Checks & Monitoring

- **Monitoring URL:** `GET https://api.schoolos.in/api/health`
  - Unauthenticated endpoint for load balancer health checks (AWS ALB / GCP Health Check).
  - Validates MongoDB ping latency, uptime, and database connection state.
  - Returns HTTP 200 `{"status": "ONLINE", "database": "CONNECTED"}` when healthy.
  - Returns HTTP 500 `{"status": "ERROR", "database": "UNREACHABLE"}` during database partition.

---

## 7. Rollback Plan

In the event of a critical deployment regression:
1. Re-route DNS / Load Balancer traffic to previous blue/green container cluster.
2. If database schema migration was executed, run down-migration scripts or restore point-in-time snapshot.
3. Notify platform operations and review `/api/audit-logs` for anomaly identification.
