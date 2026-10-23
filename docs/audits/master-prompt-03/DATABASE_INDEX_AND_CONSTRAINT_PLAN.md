# i2A SchoolOS — Master Prompt 03: Database Index & Constraint Plan
**Document ID:** `DOC-MP03-INDEX-PLAN-006`  
**Phase:** Master Prompt 03 — Domain Model, Data Dictionary & Organization Hierarchy  
**Architect:** Database Architect, Data Reliability Engineer  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Executive Summary & Reliability Rules

Database indexes in i2A SchoolOS enforce both performance and data integrity invariants. In a multi-tenant education operating system:
1. **Uniqueness Must Be Tenant-Scoped:** Uniqueness constraints on business identifiers (such as Student Admission Number, Class Name, Section Name, or Academic Session Name) must **always** be compound keys prefixed with `schoolId`. A global unique index on `admissionNo` would cause critical collisions across different schools.
2. **Deterministic Primary Keys:** Every entity maintains an explicit, immutable `id` field indexed with a global unique index (`{ id: 1 }, { unique: true }`).
3. **Sparse Indexes for Optional Identifiers:** Fields that may be absent during drafting (such as `orgCode` or external registration numbers) utilize sparse indexes to allow null/missing fields without duplicate key conflicts.
4. **Zero Destructive Cleanup Rule:** MongoDB index initialization scripts **must never** execute automated bulk deletion or record drops when encountering pre-existing duplicate entries during index creation.

---

## 2. Collection Index Inventory

### 2.1 Governance & Organization Hierarchy
| Collection | Index Specification | Options | Purpose / Invariant |
| :--- | :--- | :--- | :--- |
| `organizations` | `{ id: 1 }` | `{ unique: true }` | Primary key identity |
| `organizations` | `{ orgCode: 1 }` | `{ unique: true, sparse: true }` | Unique organization business slug |
| `organizations` | `{ parentOrgId: 1 }` | Standard | Tree traversal & hierarchy resolution |
| `tenants` | `{ id: 1 }` | `{ unique: true }` | Authoritative School Tenant ID (`I2A-SCH-XXXXXX`) |
| `tenants` | `{ code: 1 }` | Standard | Quick lookup by school code |
| `tenants` | `{ orgId: 1 }` | Standard | Fast retrieval of all campuses under an organization |

### 2.2 Academic Masters & Progression
| Collection | Index Specification | Options | Purpose / Invariant |
| :--- | :--- | :--- | :--- |
| `academic_sessions` | `{ id: 1 }` | `{ unique: true }` | Primary key identity |
| `academic_sessions` | `{ schoolId: 1, sessionName: 1 }` | `{ unique: true }` | **Compound UK:** Prevents duplicate session names in same school |
| `academic_sessions` | `{ schoolId: 1, isCurrent: 1 }` | Standard | Fast query for school's active session |
| `classes` | `{ id: 1 }` | `{ unique: true }` | Primary key identity |
| `classes` | `{ schoolId: 1, name: 1 }` | Standard | Fast grade retrieval per school |
| `sections` | `{ id: 1 }` | `{ unique: true }` | Primary key identity |
| `sections` | `{ schoolId: 1, classId: 1, name: 1 }` | Standard | Roster cohort lookup |
| `student_enrollments` | `{ id: 1 }` | `{ unique: true }` | Primary key identity |
| `student_enrollments` | `{ schoolId: 1, studentId: 1, academicSessionId: 1 }` | `{ unique: true }` | **Compound UK:** Prevents duplicate enrollment for student in same session |
| `student_enrollments` | `{ schoolId: 1, classId: 1, sectionId: 1, academicSessionId: 1 }` | Standard | Class/Section roster index |

### 2.3 Identity, Students & Guardianship
| Collection | Index Specification | Options | Purpose / Invariant |
| :--- | :--- | :--- | :--- |
| `users` | `{ email: 1 }` | `{ unique: true, sparse: true }` | Global unique login credential |
| `users` | `{ schoolId: 1, role: 1 }` | Standard | Role-based user listing |
| `students` | `{ id: 1 }` | `{ unique: true }` | Permanent student identity |
| `students` | `{ schoolId: 1, admissionNo: 1 }` | `{ unique: true }` | **Compound UK:** Admission number unique per school |
| `students` | `{ schoolId: 1, className: 1, section: 1 }` | Standard | Class roster queries |
| `guardian_relationships`| `{ id: 1 }` | `{ unique: true }` | Primary key identity |
| `guardian_relationships`| `{ schoolId: 1, studentId: 1, guardianUserId: 1 }`| `{ unique: true }` | **Compound UK:** Prevents duplicate link between same parent & child |
| `guardian_relationships`| `{ guardianUserId: 1 }` | Standard | Lookup of all linked students for a parent |

### 2.4 Operational & Financial Indexes
| Collection | Index Specification | Options | Purpose / Invariant |
| :--- | :--- | :--- | :--- |
| `attendance_locks` | `{ id: 1 }` | `{ unique: true, sparse: true }` | Primary key identity |
| `attendance_locks` | `{ schoolId: 1, date: 1, className: 1 }` | `{ unique: true }` | **Compound UK:** Single lock per class per date per school |
| `fee_receipts` | `{ id: 1 }` | `{ unique: true }` | Receipt PK |
| `fee_receipts` | `{ schoolId: 1, receiptNo: 1 }` | Standard | Receipt verification index |
| `processed_webhooks`| `{ eventId: 1 }` | `{ unique: true }` | Webhook idempotency replay protection |
| `password_resets` | `{ createdAt: 1 }` | `{ expireAfterSeconds: 600 }` | **TTL Index:** Auto-purge reset tokens after 10 minutes |

---

## 3. Idempotent Index Implementation in `server/db.js`

Index creation is initialized within `initializeIndexes(database)` upon server start or database connection. All calls wrap `.createIndex()` in idempotent invocations:
- If the index already exists with matching options, MongoDB performs a zero-overhead no-op.
- Any conflict or failure logs a structured diagnostic warning (`⚠️ [MongoDB] Index initialization notice:`) rather than crashing the operational server.
