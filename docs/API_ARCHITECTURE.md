# 🔌 i2A SchoolOS — RESTful API & Endpoint Architecture Specification
> **Versioned API Endpoint & Service Interface Map**

---

## 📌 1. API Route Structure

All API routes follow standard clean RESTful conventions:

```
GET    /api/v1/schools/profile              # Fetch active tenant profile
PUT    /api/v1/schools/branding             # Update logo, colors, signatures
GET    /api/v1/students                     # List students (with class filter)
POST   /api/v1/students                     # Create student digital profile
GET    /api/v1/admissions                   # List online admission applications
POST   /api/v1/admissions/approve/:id       # Approve admission & auto-create student
GET    /api/v1/fees/types                   # List fee master structures
POST   /api/v1/fees/payments                # Process fee payment & trigger receipt
POST   /api/v1/ai/generate-paper            # Generate AI Question Paper Draft
PUT    /api/v1/ai/papers/:id/approve        # Lock & Approve Question Paper
POST   /api/v1/exams/submit                 # Submit student online timer exam
PUT    /api/v1/exams/grade/:id              # Teacher subjective evaluation update
GET    /api/v1/audit/logs                   # View forensic audit log
```

---

## 📌 2. Standardized JSON Response Envelope

```json
{
  "success": true,
  "statusCode": 200,
  "tenantId": "sch-001",
  "data": {},
  "meta": {
    "timestamp": "2026-10-08T12:00:00Z",
    "requestId": "req-9842104"
  }
}
```
