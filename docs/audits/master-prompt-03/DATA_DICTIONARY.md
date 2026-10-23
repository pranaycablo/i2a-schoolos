# i2A SchoolOS — Master Prompt 03: Data Dictionary
**Document ID:** `DOC-MP03-DATA-DICT-003`  
**Phase:** Master Prompt 03 — Domain Model, Data Dictionary & Organization Hierarchy  
**Architect:** Database Architect, Data Governance Lead, Application Security Engineer  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Data Classification & Sensitivity Guidelines

All fields in the i2A SchoolOS data dictionary are classified under four sensitivity tiers in accordance with DPDP Act 2023 & GDPR standards:

1. **`HIGH_PII`**: Personal Identifiable Information (Full name, phone, email, Aadhaar/government IDs, date of birth, residential address, medical history). Strict access controls, encrypted at rest, never logged in plain text.
2. **`FINANCIAL`**: Ledger balances, fee payments, bank transaction IDs, merchant identifiers. Strict immutable audit trail, integer paise precision.
3. **`OPERATIONAL_INTERNAL`**: Student enrollments, class rosters, attendance records, marks, timetable slots. Tenant-scoped, accessible only to authorized institutional roles.
4. **`OPERATIONAL_PUBLIC`**: School names, logos, public contact email, board affiliation. Publicly accessible on school landing portals.

---

## 2. Institutional Governance Entities

### 2.1 Entity: `Organization` (`organizations`)
- **Business Purpose:** Represents the top-level educational trust, corporate school group, society, or government department that governs one or more operating school campuses.
- **Tenant Scope:** Scoped at Trust / Organization level.

| Field Name | Type | Req/Opt | Index / Key | Default | Validation Rules | Relationship & FK | Sensitivity | Synthetic Example |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | **Req** | **PK / Unique** | N/A | Deterministic string e.g. `org-xxx` | Target of `tenants.orgId` | `OPERATIONAL_INTERNAL` | `"org-synth-dps"` |
| `orgCode` | `string` | **Req** | **Unique Sparse** | N/A | Regex `^[A-Z0-9_-]{3,20}$` | Public business code | `OPERATIONAL_INTERNAL` | `"DPS-SYNTH"` |
| `legalName` | `string` | **Req** | Non-unique | N/A | Min 3 chars | Legal registered title | `OPERATIONAL_INTERNAL` | `"Delhi Public Educational Trust"` |
| `orgType` | `string` | **Req** | Indexed | N/A | Enum: `PRIVATE_TRUST`, `CORPORATE_GROUP`, `GOVT_DEPARTMENT`, `COACHING_FEDERATION`, `INDEPENDENT_SCHOOL` | Governance category | `OPERATIONAL_INTERNAL` | `"PRIVATE_TRUST"` |
| `parentOrgId`| `string` | Opt | Indexed | `null` | Must exist in `organizations.id`, anti-cycle check | FK -> `organizations.id` | `OPERATIONAL_INTERNAL` | `null` |
| `registrationNo`| `string` | Opt | Sparse | N/A | Alphanumeric | Trust registration cert | `OPERATIONAL_INTERNAL` | `"SYNTH-REG-TRUST-001"` |
| `primaryContact`| `object` | **Req** | Embedded | `{}` | Valid email and phone | Internal contact profile | `HIGH_PII` | `{ name: "Dr. Vikram", email: "dir@dps.test", phone: "+91 99999 00099" }` |
| `status` | `string` | **Req** | Indexed | `'ACTIVE'` | Enum: `DRAFT`, `ACTIVE`, `SUSPENDED`, `ARCHIVED` | Lifecycle state | `OPERATIONAL_INTERNAL` | `"ACTIVE"` |
| `createdAt` | `string` | **Req** | Non-unique | ISO Now | Valid ISO 8601 | Audit timestamp | `OPERATIONAL_INTERNAL` | `"2026-01-01T00:00:00.000Z"` |
| `updatedAt` | `string` | **Req** | Non-unique | ISO Now | Valid ISO 8601 | Audit timestamp | `OPERATIONAL_INTERNAL` | `"2026-01-01T00:00:00.000Z"` |

---

### 2.2 Entity: `BranchCampus` (`tenants`)
- **Business Purpose:** Represents the individual school campus, coaching center, or college where educational operations and student lifecycle occur.
- **Tenant Scope:** Authoritative tenant boundary (`schoolId`).

| Field Name | Type | Req/Opt | Index / Key | Default | Validation Rules | Relationship & FK | Sensitivity | Synthetic Example |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | **Req** | **PK / Unique** | N/A | Regex `^I2A-SCH-[0-9]{6}$` | Core Tenant Primary Key | `OPERATIONAL_PUBLIC` | `"I2A-SCH-000001"` |
| `orgId` | `string` | Opt | **Indexed** | `null` | Must exist in `organizations.id` if non-null | FK -> `organizations.id` | `OPERATIONAL_INTERNAL` | `"org-synth-dps"` |
| `name` | `string` | **Req** | Non-unique | N/A | Min 2 chars (Identical names allowed across tenants) | Campus display name | `OPERATIONAL_PUBLIC` | `"ABC Public School (Synthetic Test)"` |
| `code` | `string` | **Req** | Indexed | N/A | Uppercase alphanumeric | Campus branch slug | `OPERATIONAL_INTERNAL` | `"ABC-SYNTH"` |
| `board` | `string` | **Req** | Indexed | `'CBSE'` | Enum: `CBSE`, `ICSE`, `STATE_BOARD`, `IB`, `CAMBRIDGE`, `UNIVERSITY`, `AUTONOMOUS`, `NONE` | Curriculum Board | `OPERATIONAL_PUBLIC` | `"CBSE"` |
| `officialIdentifiers`| `object` | Opt | Embedded | `{}` | `udiseCode`: exactly 11 digits | Government registration | `OPERATIONAL_INTERNAL` | `{ udiseCode: "07010100101" }` |
| `planId` | `string` | **Req** | Indexed | `'STARTER'` | Enum: `STARTER`, `PROFESSIONAL`, `ENTERPRISE` | SaaS Subscription Plan | `OPERATIONAL_INTERNAL` | `"PROFESSIONAL"` |
| `subscriptionStatus` | `string` | **Req** | Indexed | `'TRIAL'` | Enum: `TRIAL`, `ACTIVE`, `GRACE_PERIOD`, `EXPIRED`, `SUSPENDED` | Subscription Gate | `OPERATIONAL_INTERNAL` | `"ACTIVE"` |
| `studentLimit` | `number` | **Req** | Non-unique | `250` | Positive integer | Max enrolled student quota | `OPERATIONAL_INTERNAL` | `1000` |
| `branding` | `object` | Opt | Embedded | `{}` | Theme colors, logos, signatures | Public portal branding | `OPERATIONAL_PUBLIC` | `{ primaryColor: "#4F46E5", tagline: "Excellence" }` |

---

## 3. Academic Structure Entities

### 3.1 Entity: `AcademicSessionEntity` (`academic_sessions`)
- **Business Purpose:** Represents the academic calendar year or semester cycle (e.g. 2026-2027).
- **Tenant Scope:** Scoped to `schoolId`.

| Field Name | Type | Req/Opt | Index / Key | Default | Validation Rules | Relationship & FK | Sensitivity | Synthetic Example |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | **Req** | **PK / Unique** | N/A | Unique deterministic string | Referenced by enrollments | `OPERATIONAL_INTERNAL` | `"sess-001-2026"` |
| `schoolId` | `string` | **Req** | **Compound UK** | N/A | Must match `tenants.id` | FK -> `tenants.id` | `OPERATIONAL_INTERNAL` | `"I2A-SCH-000001"` |
| `sessionName`| `string` | **Req** | **Compound UK** | N/A | e.g. `"2026-2027"` | Compound UK with `schoolId` | `OPERATIONAL_INTERNAL` | `"2026-2027"` |
| `startDate` | `string` | **Req** | Non-unique | N/A | YYYY-MM-DD | Must be strictly < `endDate` | `OPERATIONAL_INTERNAL` | `"2026-04-01"` |
| `endDate` | `string` | **Req** | Non-unique | N/A | YYYY-MM-DD | Must be strictly > `startDate` | `OPERATIONAL_INTERNAL` | `"2027-03-31"` |
| `isCurrent` | `boolean`| **Req** | Indexed | `false` | Only one session may be `true` per school | Single Active Session Rule | `OPERATIONAL_INTERNAL` | `true` |
| `status` | `string` | **Req** | Indexed | `'UPCOMING'` | Enum: `UPCOMING`, `ACTIVE`, `COMPLETED`, `ARCHIVED` | Lifecycle State | `OPERATIONAL_INTERNAL` | `"ACTIVE"` |

---

### 3.2 Entity: `ClassGrade` (`classes`)
- **Business Purpose:** Standard or academic grade (Nursery, Grade 1 to 12, NEET batch).
- **Tenant Scope:** Scoped to `schoolId`.

| Field Name | Type | Req/Opt | Index / Key | Default | Validation Rules | Relationship & FK | Sensitivity | Synthetic Example |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | **Req** | **PK / Unique** | N/A | Deterministic ID | Referenced by sections/enrollments | `OPERATIONAL_INTERNAL` | `"cls-001-gr8"` |
| `schoolId` | `string` | **Req** | Indexed | N/A | Must match `tenants.id` | FK -> `tenants.id` | `OPERATIONAL_INTERNAL` | `"I2A-SCH-000001"` |
| `name` | `string` | **Req** | Non-unique | N/A | Non-empty string | Grade title | `OPERATIONAL_INTERNAL` | `"Class VIII"` |
| `numericOrder`| `number`| **Req** | Indexed | N/A | Numeric (Nursery: -2, LKG: -1, UKG: 0, 1..12: 1..12, Coaching: 13+) | Grade progression ordering | `OPERATIONAL_INTERNAL` | `8` |
| `status` | `string` | **Req** | Indexed | `'ACTIVE'` | Enum: `ACTIVE`, `ARCHIVED` | Availability | `OPERATIONAL_INTERNAL` | `"ACTIVE"` |

---

### 3.3 Entity: `SectionBatch` (`sections`)
- **Business Purpose:** Classroom cohort or coaching batch within a class.
- **Tenant Scope:** Scoped to `schoolId`.

| Field Name | Type | Req/Opt | Index / Key | Default | Validation Rules | Relationship & FK | Sensitivity | Synthetic Example |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | **Req** | **PK / Unique** | N/A | Deterministic ID | Referenced by enrollments | `OPERATIONAL_INTERNAL` | `"sec-001-8a"` |
| `schoolId` | `string` | **Req** | Indexed | N/A | Must match `tenants.id` | FK -> `tenants.id` | `OPERATIONAL_INTERNAL` | `"I2A-SCH-000001"` |
| `classId` | `string` | **Req** | Indexed | N/A | Must match `classes.id` | FK -> `classes.id` | `OPERATIONAL_INTERNAL` | `"cls-001-gr8"` |
| `name` | `string` | **Req** | Non-unique | N/A | e.g. `"A"` or `"Morning Batch"` | Section name | `OPERATIONAL_INTERNAL` | `"A"` |
| `capacity` | `number` | **Req** | Non-unique | `40` | Positive integer > 0 | Max enrollment limit | `OPERATIONAL_INTERNAL` | `40` |
| `currentEnrolled` | `number` | **Req** | Non-unique | `0` | Must not exceed `capacity` | Real-time headcount | `OPERATIONAL_INTERNAL` | `2` |
| `classTeacherId` | `string` | Opt | Indexed | `null` | Must exist in `users.id` | FK -> `users.id` | `OPERATIONAL_INTERNAL` | `"usr-004"` |

---

## 4. Student & Guardian Domain Entities

### 4.1 Entity: `StudentEntity` (`students`)
- **Business Purpose:** Lifelong identity record of a student across their complete institutional history.
- **Tenant Scope:** Scoped to `schoolId`.

| Field Name | Type | Req/Opt | Index / Key | Default | Validation Rules | Relationship & FK | Sensitivity | Synthetic Example |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | **Req** | **PK / Unique** | N/A | `std-xxx` format | Core student identity | `HIGH_PII` | `"std-101"` |
| `schoolId` | `string` | **Req** | **Compound UK** | N/A | Must match `tenants.id` | FK -> `tenants.id` | `OPERATIONAL_INTERNAL` | `"I2A-SCH-000001"` |
| `admissionNo`| `string`| **Req** | **Compound UK** | N/A | Unique per school | Admission record | `HIGH_PII` | `"1024"` |
| `name` | `string` | **Req** | Non-unique | N/A | Min 2 characters | Full Student Name | `HIGH_PII` | `"Rahul Kumar (Synthetic Student)"` |
| `dob` | `string` | **Req** | Non-unique | N/A | YYYY-MM-DD, must be in past | Date of Birth | `HIGH_PII` | `"2012-05-14"` |
| `gender` | `string` | **Req** | Non-unique | N/A | Enum: `MALE`, `FEMALE`, `OTHER` | Demographics | `HIGH_PII` | `"MALE"` |
| `status` | `string` | **Req** | Indexed | `'ACTIVE'` | Enum: `ACTIVE`, `PROVISIONAL`, `GRADUATED`, `TRANSFERRED`, `SUSPENDED` | Lifecycle status | `OPERATIONAL_INTERNAL` | `"ACTIVE"` |
| `parentEmail`| `string` | Opt | Indexed | `null` | Valid email | Legacy fallback link | `HIGH_PII` | `"sanjay.kumar@gmail.com"` |
| `parentMobile`| `string`| Opt | Non-unique | `null` | Valid phone | Emergency contact | `HIGH_PII` | `"+91 99999 00010"` |

---

### 4.2 Entity: `StudentEnrollmentEntity` (`student_enrollments`)
- **Business Purpose:** Session-specific enrollment and academic progression record for a student.
- **Tenant Scope:** Scoped to `schoolId`.

| Field Name | Type | Req/Opt | Index / Key | Default | Validation Rules | Relationship & FK | Sensitivity | Synthetic Example |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | **Req** | **PK / Unique** | N/A | `enr-xxx` format | Enrollment PK | `OPERATIONAL_INTERNAL` | `"enr-std101-2026"` |
| `schoolId` | `string` | **Req** | **Compound UK** | N/A | Must match `tenants.id` | FK -> `tenants.id` | `OPERATIONAL_INTERNAL` | `"I2A-SCH-000001"` |
| `studentId` | `string` | **Req** | **Compound UK** | N/A | Must match `students.id` | FK -> `students.id` | `OPERATIONAL_INTERNAL` | `"std-101"` |
| `academicSessionId`| `string`| **Req** | **Compound UK** | N/A | Must match `academic_sessions.id` | FK -> `academic_sessions.id` | `OPERATIONAL_INTERNAL` | `"sess-001-2026"` |
| `classId` | `string` | **Req** | Indexed | N/A | Must match `classes.id` | FK -> `classes.id` | `OPERATIONAL_INTERNAL` | `"cls-001-gr8"` |
| `sectionId` | `string` | **Req** | Indexed | N/A | Must match `sections.id` | FK -> `sections.id` | `OPERATIONAL_INTERNAL` | `"sec-001-8a"` |
| `rollNumber`| `string` | Opt | Non-unique | `null` | Section roll number | Roster position | `OPERATIONAL_INTERNAL` | `"01"` |
| `status` | `string` | **Req** | Indexed | `'ENROLLED'` | Enum: `ENROLLED`, `PROMOTED`, `RETAINED`, `TRANSFERRED`, `COMPLETED` | Academic Progression | `OPERATIONAL_INTERNAL` | `"ENROLLED"` |
| `enrollmentDate`| `string`| **Req** | Non-unique | ISO Date | YYYY-MM-DD | Enrollment start | `OPERATIONAL_INTERNAL` | `"2026-04-05"` |

---

### 4.3 Entity: `StudentGuardianRelationshipEntity` (`guardian_relationships`)
- **Business Purpose:** Models many-to-many relationships between students and multiple authorized guardians/parents.
- **Tenant Scope:** Scoped to `schoolId`.

| Field Name | Type | Req/Opt | Index / Key | Default | Validation Rules | Relationship & FK | Sensitivity | Synthetic Example |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `id` | `string` | **Req** | **PK / Unique** | N/A | `rel-xxx` format | Relationship PK | `OPERATIONAL_INTERNAL` | `"rel-std101-usr9"` |
| `schoolId` | `string` | **Req** | **Compound UK** | N/A | Must match `tenants.id` | FK -> `tenants.id` | `OPERATIONAL_INTERNAL` | `"I2A-SCH-000001"` |
| `studentId` | `string` | **Req** | **Compound UK** | N/A | Must match `students.id` | FK -> `students.id` | `OPERATIONAL_INTERNAL` | `"std-101"` |
| `guardianUserId`| `string`| **Req** | **Compound UK** | N/A | Must match `users.id` (role PARENT) | FK -> `users.id` | `OPERATIONAL_INTERNAL` | `"usr-009"` |
| `relationshipType`| `string`| **Req** | Non-unique | N/A | Enum: `FATHER`, `MOTHER`, `LEGAL_GUARDIAN`, `AUTHORIZED_SPONSOR`, `SIBLING`, `OTHER` | Family connection | `OPERATIONAL_INTERNAL` | `"FATHER"` |
| `isPrimaryContact`| `boolean`| **Req** | Non-unique | `false` | Single primary per student | Emergency triage | `OPERATIONAL_INTERNAL` | `true` |
| `canPickup` | `boolean`| **Req** | Non-unique | `true` | Authorization flag | Campus security gate | `OPERATIONAL_INTERNAL` | `true` |
| `hasFinancialResponsibility`| `boolean`| **Req** | Non-unique | `true` | Invoicing target | Fee ledger liability | `FINANCIAL` | `true` |

---

## 5. Retention, Deletion & Archival Policies

1. **Academic Ledgers & Enrollment History:** Retained permanently for lifelong credential verification. Hard deletion is forbidden; status is marked `COMPLETED` or `ARCHIVED`.
2. **Student PII upon School Transfer / Withdrawal:** Status transitioned to `TRANSFERRED` or `WITHDRAWN`. Student records cannot be dropped while linked to existing financial ledgers or attendance locks.
3. **Password Reset OTPs (`password_resets`):** MongoDB TTL index automatically purges records after 600 seconds (10 minutes).
