# End-to-End User Journeys & Workflow Specifications
**i2A SchoolOS — Global Multi-Tenant Education Management Platform**  
*Document Ref: i2A-STRAT-008 | Date: October 17, 2026 | Status: ARCHITECTURAL_BLUEPRINT*

---

## 1. Specification Standard

Each of the 20 primary operational workflows is detailed according to the strict architectural standard:
- **Trigger & Actor:** Who initiates the workflow and under what event.
- **Preconditions:** What state must exist prior to initiation.
- **Main Flow:** Step-by-step transaction sequence.
- **Validation & Backend Responsibilities:** Server-side checks and atomic operations.
- **Data Persistence:** Affected database collections.
- **Notifications & Audit:** Events dispatched and security log entries.
- **Failure & Negative Scenarios:** How invalid or unauthorized attempts are rejected.

---

## 2. Core Operational Workflows (Workflows A through T)

### Workflow A: Online Admission to Enrolled Student Lifecycle
- **Trigger:** Parent/Guardian submits an online application on the public school portal.
- **Actor:** Prospective Parent / Front-Desk Staff / Principal.
- **Preconditions:** School academic session is open for new admissions; admission quota not exceeded.
- **Main Steps:**
  1. Parent fills student demographics, previous schooling, and uploads Birth Certificate + Aadhaar.
  2. System issues public reference `ADM-YYYY-XXXX` and sends confirmation SMS/Email.
  3. Front-Desk Staff verifies uploaded documents -> marks status `DOCUMENTS_VERIFIED`.
  4. Principal schedules entrance assessment/interview -> inputs score.
  5. Principal clicks "Approve Application".
  6. Backend automatically:
     - Promotes application to active `Student` entity with unique Admission Number.
     - Creates `Parent` user account and links guardian relationship.
     - Generates initial Admission & Term 1 Fee Invoice.
     - Sends welcome credentials to parent.
- **API Endpoints:** `POST /api/admissions/public`, `PUT /api/admissions/:id/status`, `POST /api/admissions/:id/approve`.
- **Database Collections:** `admissions`, `students`, `users`, `parent_student_links`, `fee_invoices`.
- **Negative Test Case:** Staff attempting to approve an admission without Principal role returns `403 Forbidden`. Duplicate Aadhaar number for existing active student triggers `409 Conflict`.

---

### Workflow B: Student and Guardian 360° Profile & Document Vault
- **Trigger:** Student updates address, emergency contact, or submits medical allergy notification.
- **Actor:** Parent / Student / Admin Staff.
- **Main Steps:**
  1. Parent accesses Child 360° Profile in Parent Portal.
  2. Modifies emergency phone number or uploads updated immunization certificate.
  3. Server validates phone format, checks file type (PDF/PNG only, max 5MB), and encrypts document path.
  4. Updates reflected across Principal and Teacher attendance emergency rosters immediately.
- **API Endpoints:** `GET /api/students/:id`, `PUT /api/students/:id`.
- **Negative Test Case:** Unauthenticated parent attempting to fetch profile of unrelated student returns `403 Forbidden` (IDOR check).

---

### Workflow C: Academic Calendar & Holiday Roster
- **Trigger:** Principal configures annual academic calendar at session onset.
- **Actor:** Principal / Academic Coordinator.
- **Main Steps:**
  1. Configures working days, term start/end dates, gazetted holidays, and exam blackout dates.
  2. System propagates non-working days into the automated attendance calculation engine.
- **API Endpoints:** `POST /api/academics/calendar`, `GET /api/academics/calendar`.

---

### Workflow D: Timetable Scheduling & Substitution Engine
- **Trigger:** Routine timetable generation or daily teacher absence.
- **Actor:** Timetable Coordinator / Principal.
- **Main Steps:**
  1. Algorithmic solver maps subjects, teacher maximum weekly periods ($\le 30$), and room capacities.
  2. Detects conflicts: Teacher double-booking or Room double-booking yields `409 Conflict`.
  3. In case of teacher leave, system surfaces available free teachers for that period -> Principal clicks "Assign Substitute" -> Notification sent to substitute teacher app.
- **API Endpoints:** `POST /api/timetables/cells`, `POST /api/timetables/substitutions`.
- **Negative Test Case:** Overriding a hard timetable clash without `forceOverride=true` returns `Schedule Conflict Detected`.

---

### Workflow E: Daily Classroom Attendance & Low-Attendance Parent Alert
- **Trigger:** Class teacher takes daily morning attendance.
- **Actor:** Class Teacher.
- **Main Steps:**
  1. Teacher opens Attendance Module -> Class roster loads with default "All Present".
  2. Teacher taps 2 absent students -> clicks "Submit Attendance".
  3. Backend records attendance batch atomically.
  4. System evaluates student YTD attendance percentage: if $< 85\%$, triggers automated in-app/WhatsApp alert to guardian: *"Attention: Aarav's attendance has dropped to 81%."*
  5. Principal executes "Lock Attendance for Date" -> prevents retroactive teacher modifications.
- **API Endpoints:** `POST /api/attendance/mark`, `POST /api/attendance/lock`.
- **Negative Test Case:** Modifying attendance for a locked date returns `403 Attendance for this date is locked`.

---

### Workflow F: Daily Homework Posting & Digital Student Submissions
- **Trigger:** Subject teacher assigns homework after class.
- **Actor:** Teacher / Student.
- **Main Steps:**
  1. Teacher selects Class, Subject, due date, description, and attaches practice PDF -> clicks "Publish".
  2. Assignment appears in student and parent daily feeds.
  3. Student completes homework -> takes photo -> uploads submission via student portal.
  4. Teacher reviews submission, enters remarks ("Excellent handwriting"), and marks `GRADED`.
- **API Endpoints:** `POST /api/homework`, `POST /api/homework/:id/submit`, `PUT /api/homework/submissions/:id/grade`.

---

### Workflow G: Weekly Tests & Continuous Assessment
- **Trigger:** Teacher schedules routine weekly formative test.
- **Actor:** Teacher.
- **Main Steps:**
  1. Teacher selects class and chapter -> pulls 10 questions from verified Question Bank.
  2. Generates test paper -> conducts test online or prints question sheets.
  3. Enters marks into continuous assessment ledger -> updates formative internal grades.

---

### Workflow H: Term Examinations & Multi-Format Grading
- **Trigger:** Annual / Term Exam cycle initiated by Exam Controller.
- **Actor:** Exam Controller / Teachers / Principal.
- **Main Steps:**
  1. Blueprint constructed (Total marks, passing threshold, section weightages).
  2. Online exam taken with timer countdown, auto-save every 30 seconds, and anti-tab switch detection.
  3. Objective questions auto-evaluated immediately upon submission.
  4. Subjective questions routed to teacher grading queue.
  5. Teacher submits grades -> Exam Controller reviews -> Principal executes "Publish Results".
- **API Endpoints:** `POST /api/exams/papers`, `POST /api/exams/papers/:id/submit`, `PUT /api/exams/papers/:id/lock`.

---

### Workflow I: Branded Report Card & Progress Report Generation
- **Trigger:** Post-examination report card distribution.
- **Actor:** Principal / Class Teacher / Parent.
- **Main Steps:**
  1. System compiles scholastic marks, co-scholastic grades, attendance percentage, and teacher comments.
  2. Computes CGPA / Percentage according to CBSE / ICSE or State Board rules.
  3. Generates high-fidelity, printable PDF featuring School Logo, Board Affiliation Number, Principal Stamp, and Signature.
  4. Published to Parent Portal for 1-click download.

---

### Workflow J: Parent Communications & Multichannel Alerts
- **Trigger:** School notice, emergency weather closure, or event announcement.
- **Actor:** School Admin / Principal.
- **Main Steps:**
  1. Admin composes notice, targets audience (`ALL_PARENTS` or `CLASS_X`).
  2. Selects channels: `IN_APP`, `EMAIL`, `WHATSAPP`.
  3. Backend dispatches in-app notification immediately; evaluates external provider credentials.
  4. If SMTP/WhatsApp credentials present, sends external messages; if absent, records truthful `BLOCKED_NO_SMTP_PROVIDER` status.

---

### Workflow K: Student Home-Learning & Revision Video Access
- **Trigger:** Student reviews challenging concept at home.
- **Actor:** Student.
- **Main Steps:**
  1. Student navigates to "Revision Video Library" in Student Portal.
  2. Filters by Subject (e.g. Mathematics) and Topic (e.g. Quadratic Equations).
  3. System checks school subscription tier:
     - Under ₹40 plan: Validates video recording date is $\le 30\text{ days}$ old.
     - Under ₹50 plan: Validates video recording date is $\le 365\text{ days}$ old.
  4. Streams video securely without exposing raw download URLs.

---

### Workflow L: School Fee Structure & Invoicing Engine
- **Trigger:** Bursar generates quarterly fee schedules.
- **Actor:** Accountant / Bursar.
- **Main Steps:**
  1. Defines fee components: Tuition Fee, Laboratory Fee, Transport Fee, Computer Fee.
  2. Assigns due dates and automated late fine rules (e.g. ₹50/day after 10th of month).
  3. Generates digital invoices for all enrolled students in target class.
- **API Endpoints:** `POST /api/fees/types`, `GET /api/fees/receipts`.

---

### Workflow M: Fee Collection, Counter POS & Instant Receipts
- **Trigger:** Parent pays fees online or at school counter.
- **Actor:** Parent / Accountant.
- **Main Steps:**
  1. Online Flow: Parent selects fee dues -> opens Razorpay checkout -> completes UPI payment -> Webhook verifies SHA256 HMAC -> Receipt marked `PAID`.
  2. Counter Flow: Accountant selects student -> enters Cash/Cheque details -> clicks "Collect & Print Receipt".
  3. System generates branded PDF receipt with unique invoice reference (`REC-2026-XXXX`).
  4. Ledgers updated atomically; student fee balance decremented.

---

### Workflow N: Staff Records, Attendance & Automated Payroll
- **Trigger:** Monthly staff salary disbursement.
- **Actor:** Accountant / Principal.
- **Main Steps:**
  1. System compiles staff biometric attendance and approved leave days for calendar month.
  2. Computes Gross Salary, deductions (Provident Fund, TDS, unpaid leaves), and Net Pay.
  3. Generates draft payroll register -> Principal reviews and clicks "Approve Payroll".
  4. Accountant clicks "Disburse" -> records disbursement UTR references -> individual payslips generated in staff portals.
- **API Endpoints:** `GET /api/operations/payroll`, `POST /api/operations/payroll/disburse`.

---

### Workflow O: Transport Fleet, Bus Routes & Daily Manifest
- **Trigger:** Daily school bus route operation.
- **Actor:** Transport Manager / Driver / Parent.
- **Main Steps:**
  1. Transport Manager configures Bus Route (Stops, Timings, Assigned Vehicle, Driver).
  2. Maps enrolled students to designated pickup/drop stops.
  3. Driver opens Driver Mobile Web App -> checks passenger manifest -> confirms student boarding.
  4. In-app status updates for parents: *"Bus arrived at Sector 4 Stop."*

---

### Workflow P: Digital Library Cataloging & Book Circulation
- **Trigger:** Student borrows or returns library book.
- **Actor:** Librarian / Student.
- **Main Steps:**
  1. Librarian scans book barcode -> scans student ID card.
  2. System records loan transaction with 14-day return due date.
  3. On return, checks for overdue days -> calculates late fine automatically if applicable.

---

### Workflow Q: School Marketplace Store & Curated Kit Bundles
- **Trigger:** Parent purchases annual uniform and book kit.
- **Actor:** Parent / School Store Operator.
- **Main Steps:**
  1. Parent navigates to School Store -> selects "Class 6 Complete Annual Kit".
  2. Selects uniform size -> clicks "Place Order" with idempotency key.
  3. Backend atomically checks and decrements component inventory stock.
  4. Order generated (`ORD-YYYY-XXXX`) with collection slot at school counter.
  5. If order cancelled, inventory replenished atomically.
- **API Endpoints:** `GET /api/marketplace/products`, `POST /api/marketplace/orders`.

---

### Workflow R: Executive Reports & Management Intelligence
- **Trigger:** Principal/Owner reviews institutional KPI health.
- **Actor:** Principal / Director / Super Admin.
- **Main Steps:**
  1. Dashboard displays real-time widgets: Total Enrolled Students, Today's Attendance %, Month-to-Date Fee Collection, Outstanding Dues, Staff Present.
  2. Exports comprehensive multi-column audit reports in Excel/PDF format.

---

### Workflow S: Secure Document Management Vault
- **Trigger:** Upload and archival of sensitive student/staff documents.
- **Actor:** School Admin / Principal.
- **Main Steps:**
  1. Admin uploads Transfer Certificates, Birth Certificates, Staff Contracts, or Board Affiliations.
  2. Stored in private, access-controlled storage (never publicly indexed).
  3. Access restricted to authorized roles and logged in security audit trails.

---

### Workflow T: Data Import / Export & Retention Archival
- **Trigger:** Beginning of academic year bulk onboarding or statutory audit.
- **Actor:** School Admin / Super Admin.
- **Main Steps:**
  1. Admin uploads CSV template with 500 student records.
  2. Backend validates row-by-row (detects duplicate admission numbers, invalid email formats).
  3. Displays pre-import validation summary -> Admin clicks "Execute Bulk Ingestion".
  4. Records ingested atomically into MongoDB.
