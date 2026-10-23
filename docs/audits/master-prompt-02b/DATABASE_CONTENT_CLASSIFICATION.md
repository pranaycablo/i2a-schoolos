# i2A SchoolOS — Master Prompt 02B: Database Content Classification
**Document ID:** `DOC-MP02B-CLASSIFICATION-001`  
**Phase:** Master Prompt 02B — Test Data Privacy & Isolation Repair  
**Auditor / Roles:** Senior Database Security Engineer, Privacy Engineer, Release Auditor  
**Date:** 2026-10-17  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Git Branch:** `phase-a-remediation`  

---

## 1. Executive Summary & Privacy Mandate

In accordance with Rule 2 and Section 3 of Master Prompt 02B, a strict read-only metadata audit was performed on the local MongoDB instance targeting:
- `i2a_schoolos` (Primary Application Database)
- `i2a_schoolos_test` (Previously Cloned Test Database)

### Privacy Enforcement
**Zero Personally Identifiable Information (PII) is included in this report.** No individual names, phone numbers, email addresses, street addresses, student identifiers, or password hash strings are reproduced in plain text. Analysis is strictly conducted at schema, collection, and metadata classification levels.

---

## 2. Collection Metadata & PII Sensitivity Classification

### 2.1 Metadata Matrix (`i2a_schoolos` vs `i2a_schoolos_test`)

| Collection Name | `i2a_schoolos` Count | `i2a_schoolos_test` Count | Top-Level Field Names | Potential PII Categories Detected | Cloned Evidence Rating |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`students`** | 18 | 18 | `_id`, `id`, `schoolId`, `admissionNo`, `rollNo`, `name`, `photoUrl`, `dob`, `gender`, `className`, `section`, `house`, `fatherName`, `motherName`, `parentMobile`, `parentWhatsApp`, `parentEmail`, `address`, `admissionDate`, `status`, `documents`, `assignedSubjects`, `attendanceRate` | **HIGH**: Student identity, DOB, parents' identities, phone/WhatsApp contacts, home address, uploaded document statuses | **CERTAIN (100% Schema & Count Match)** |
| **`users`** | 10 | 10 | `_id`, `id`, `name`, `email`, `role`, `schoolId`, `passwordHash`, `status`, `updatedAt` | **CRITICAL**: User names, institutional email addresses, bcrypt password hash strings | **CERTAIN (100% Schema & Count Match)** |
| **`tenants`** | 2 | 2 | `_id`, `id`, `name`, `code`, `board`, `city`, `adminName`, `adminEmail`, `adminPhone`, `planId`, `planName`, `billingCycle`, `subscriptionStatus`, `registeredAt`, `expiresAt`, `studentLimit`, `isOnboarded`, `branding` | **HIGH**: Institutional executive names, administrative contact phone/email, address, signature URLs | **CERTAIN (100% Schema & Count Match)** |
| **`admissions`** | 3 | 3 | `_id`, `id`, `schoolId`, `applicationNo`, `studentName`, `applyingClass`, `parentName`, `phone`, `email`, `status`, `submittedDate`, `documentsUploaded`, `remarks` | **HIGH**: Prospective minor student names, parent names, phone numbers, email addresses | **CERTAIN (100% Schema & Count Match)** |
| **`staff`** | 4 | 4 | `_id`, `id`, `schoolId`, `employeeId`, `name`, `role`, `designation`, `qualification`, `joiningDate`, `mobile`, `email`, `baseSalary`, `status`, `assignedClasses`, `assignedSubjects` | **HIGH**: Employee full names, mobile numbers, email addresses, salary figures | **CERTAIN (100% Schema & Count Match)** |
| **`payroll`** | 2 | 2 | `_id`, `id`, `schoolId`, `month`, `staffId`, `staffName`, `baseSalary`, `presentDays`, `workingDays`, `bonus`, `deductions`, `netSalary`, `status`, `disbursedDate` | **MEDIUM**: Staff names, detailed compensation amounts | **CERTAIN (100% Schema & Count Match)** |
| **`fee_receipts`** | 2 | 2 | `_id`, `id`, `schoolId`, `receiptNo`, `studentId`, `studentName`, `admissionNo`, `className`, `section`, `feeBreakup`, `totalAmount`, `paidAmount`, `balanceAmount`, `paymentMode`, `transactionId`, `paymentDate`, `status`, `emailSent`, `whatsappSent` | **MEDIUM**: Student names, payment transaction references | **CERTAIN (100% Schema & Count Match)** |
| **`notifications`** | 15 | 15 | `_id`, `id`, `schoolId`, `recipientType`, `recipientName`, `recipientEmail`, `recipientPhone`, `role`, `title`, `message`, `channel`, `deliveryStatus`, `read`, `dispatchedBy`, `dispatchedDate`, `dispatchedAt` | **HIGH**: Recipient individual names, contact emails, phone numbers | **CERTAIN (100% Schema & Count Match)** |
| **`attendance`** | 14 | 14 | `_id`, `entityId`, `date`, `entityType`, `schoolId`, `className`, `entityName`, `id`, `markedAt`, `markedBy`, `markedByName`, `markedByRole`, `remarks`, `section`, `status` | **MEDIUM**: Minor student names, marking staff names | **CERTAIN (100% Schema & Count Match)** |
| **`transport_routes`** | 2 | 2 | `_id`, `id`, `schoolId`, `routeNumber`, `routeName`, `driverName`, `driverMobile`, `vehicleNumber`, `capacity`, `assignedStudentsCount`, `liveStatus`, `currentLocation`, `stops` | **MEDIUM**: Driver names, driver contact numbers | **CERTAIN (100% Schema & Count Match)** |
| **`school_applications`**| 2 | 2 | `_id`, `id`, `applicationNo`, `schoolName`, `board`, `city`, `state`, `adminName`, `adminEmail`, `adminPhone`, `domainType`, `subdomainSlug`, `planId`, `status`, `submittedDate`, `affiliationNumber`, `documentsSubmitted` | **HIGH**: School applicant administrator names, phones, emails | **CERTAIN (100% Schema & Count Match)** |
| **`audit_logs`** | 207 | 267 | `_id`, `id`, `schoolId`, `timestamp`, `user`, `role`, `action`, `module`, `details`, `ipAddress` | **LOW**: Diagnostic action records, client IP addresses (`127.0.0.1`) | **Diverged (+60 test logs in test DB)** |
| **`fee_types`** | 6 | 6 | `_id`, `id`, `schoolId`, `name`, `code`, `amount`, `frequency`, `category`, `isOptional`, `description` | **NONE**: Institutional pricing configuration | **CERTAIN (100% Match)** |
| **`timetables`** | 1 | 1 | `_id`, `id`, `schoolId`, `className`, `section`, `academicYear`, `schedule` | **LOW**: Academic period slot schedules | **CERTAIN (100% Match)** |
| **`digital_books`** | 2 | 2 | `_id`, `id`, `schoolId`, `title`, `className`, `subject`, `coverUrl`, `chaptersCount`, `chapters` | **NONE**: Educational textbook metadata | **CERTAIN (100% Match)** |
| **`question_bank`** | 4 | 4 | `_id`, `id`, `schoolId`, `className`, `subject`, `chapterId`, `chapterTitle`, `questionText`, `type`, `options`, `correctAnswer`, `difficulty`, `marks` | **NONE**: Academic assessment questions | **CERTAIN (100% Match)** |
| **`exam_papers`** | 1 | 1 | `_id`, `id`, `schoolId`, `paperTitle`, `className`, `subject`, `totalMarks`, `durationMinutes`, `questions`, `status`, `generatedDate`, `approvedBy`, `autoScheduleDays` | **NONE**: Academic test paper layouts | **CERTAIN (100% Match)** |
| **`exam_submissions`**| 1 | 1 | `_id`, `id`, `schoolId`, `examPaperId`, `examTitle`, `studentId`, `studentName`, `className`, `section`, `submittedAt`, `score`, `totalMarks`, `percentage`, `grade`, `status`, `answers` | **LOW**: Student name, test scores | **CERTAIN (100% Match)** |
| **`processed_webhooks`**| 14 | 14 | `_id`, `eventId`, `gatewayOrderId`, `paymentId`, `tenantId`, `amount`, `status`, `processedAt` | **NONE**: Webhook idempotency ledger | **CERTAIN (100% Match)** |
| **`attendance_locks`** | 7 | 7 | `_id`, `schoolId`, `className`, `date`, `isLocked`, `lockedAt`, `lockedBy`, `reason` | **NONE**: Administrative freeze locks | **CERTAIN (100% Match)** |
| **`expenses`** | 3 | 3 | `_id`, `id`, `schoolId`, `title`, `category`, `amount`, `date`, `paidTo`, `approvedBy` | **LOW**: Institutional expense entries | **CERTAIN (100% Match)** |
| **`homework`** | 0 | 0 | N/A | **NONE** | **Identical (Empty)** |
| **`homework_submissions`**| 0 | 0 | N/A | **NONE** | **Identical (Empty)** |
| **`marketplace_products`**| 0 | 0 | N/A | **NONE** | **Identical (Empty)** |
| **`marketplace_orders`**| 0 | 0 | N/A | **NONE** | **Identical (Empty)** |
| **`password_resets`** | 0 | 0 | N/A | **NONE** | **Identical (Empty)** |

---

## 3. Data Lineage & Forensic Finding

The metadata examination confirms that:
1. `i2a_schoolos_test` was created via a full collection-level copy of `i2a_schoolos`.
2. Every document key, identifier structure, and count in `i2a_schoolos_test` precisely matches `i2a_schoolos` (with the exception of `audit_logs`, which expanded from 207 to 267 due to automated test traffic).
3. The copied data contains schema attributes representing personal data categories (student profiles, guardian contacts, phone numbers, addresses, employee salaries, and credential hashes).

### Classification Conclusion:
Even though the data in `i2a_schoolos` originated as developmental seed data, **under strict privacy and security standards, copying an application database into a test database is a violation of data governance principles**. 

Therefore, `i2a_schoolos_test` must be quarantined and replaced with a dedicated, 100% synthetic database (`i2a_schoolos_synthetic_test`) built exclusively from sanitized dummy fixtures.
