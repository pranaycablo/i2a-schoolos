# i2A SchoolOS — Real UI Interaction & Behavior Matrix
**Audit Date:** October 2026 | **Project Root:** `D:\i2A_School ERP & Managment`  
**Evaluation Scope:** Form Actions, Route Guards, State Persistence, Idempotency & Error Handling  

---

## 1. Executive Summary
This matrix records the operational UI interaction behavior across all primary screens in `i2A SchoolOS`. Every interactive state—from button click to network error response—was audited against the actual React component tree and Express backend services.

---

## 2. Interactive Behavior Matrix by User Role & Screen

### A. Authentication & Shell Navigation (`LoginPage.tsx`, `AppShell.tsx`, `ShellSidebar.tsx`)
| Interaction Test | Trigger / Action | Expected Result | Actual Observed Behavior | Result |
| :--- | :--- | :--- | :--- | :---: |
| Role-Appropriate Landing | Log in as `PARENT` | Lands directly on Parent Portal | Routed directly to `ParentPortalModule.tsx` (`activeModule: 'parent_portal'`) | **PASS** |
| Role-Appropriate Landing | Log in as `STUDENT` | Lands directly on Student Portal | Routed directly to `StudentPortalModule.tsx` (`activeModule: 'student_portal'`) | **PASS** |
| Route Guard Access Denial | Parent tries opening `/principal_dashboard` | Blocked with Access Denied screen | Rendered `ShieldAlert` Access Denied with fallback button to Parent Portal | **PASS** |
| Session Token Persistence | Browser Page Refresh | User remains logged in | `sessionStorage` token hydrates `useSchool()`, fetches user profile via `GET /api/auth/me` | **PASS** |
| Secure Session Logout | Click "Sign Out & Revoke Session" | Token blacklisted, returns to public | Calls `POST /api/auth/logout`, clears `sessionStorage`, views `PublicSaasLandingPage` | **PASS** |
| Theme & Language Toggle | Click Sun/Moon or Hindi/English | Real-time switch across whole DOM | Root `classList.toggle('dark')` + `translations[key]['hi']` immediate re-render | **PASS** |

---

### B. School Directory & Multi-Branch Management (`PlatformAdminModule.tsx`)
| Interaction Test | Trigger / Action | Expected Result | Actual Observed Behavior | Result |
| :--- | :--- | :--- | :--- | :---: |
| Open Add School Modal | Click `+ Onboard School` | Slide-over / modal appears | `OnboardSchoolModal` renders with 4-step wizard and autofocus input | **PASS** |
| Duplicate School Submission | Submit existing school name | 409 Conflict error toast | Server returns 409; UI displays red alert: "School name already registered" | **PASS** |
| School Detail Drawer | Click school row / card | Drawer slides in from right | `SchoolDetailDrawer` opens showing campuses, location pins, and branch list | **PASS** |
| Geotagging Coordinate Validation | Enter `latitude: 105.0` | Client/Server rejection | Red validation error: "Latitude must be between -90 and 90 degrees" | **PASS** |
| Branch Deactivation | Toggle branch status to `INACTIVE` | Branch deactivated; school untouched | Branch status badge turns gray `INACTIVE`; parent school status stays `ACTIVE` | **PASS** |

---

### C. Fee Collection Desk (`FeeManagementModule.tsx`)
| Interaction Test | Trigger / Action | Expected Result | Actual Observed Behavior | Result |
| :--- | :--- | :--- | :--- | :---: |
| Student Selection & Fee Dues | Select student from dropdown | Displays pending fee structures | Checkbox list populates with Tuition, Transport, Exam heads with amounts | **PASS** |
| Collect Fee Submission | Click `Pay & Generate Receipt` | Atomic write $\to$ Receipt modal | Calls `POST /api/fees/receipts/collect` with idempotency key; receipt displays | **PASS** |
| Double-Click Prevention | Fast double-click on Pay button | Exactly 1 receipt created | Button enters `disabled` state with `isProcessing: true`; 30s idempotency lock | **PASS** |
| Network Failure on Payment | Disconnect network mid-payment | Fail-closed error alert | No receipt generated; red error banner: "Server rejected fee transaction" | **PASS** |
| Double-Entry Ledger Entry | Verify expense ledger after pay | Automatic `INCOME` entry | Ledger in `PayrollExpenseModule.tsx` reflects exact receipt number and amount | **PASS** |

---

### D. Attendance Marking & Tamper Lock (`AttendanceLeaveModule.tsx`)
| Interaction Test | Trigger / Action | Expected Result | Actual Observed Behavior | Result |
| :--- | :--- | :--- | :--- | :---: |
| Roster Attendance Toggle | Click student status badge | Cycles PRESENT $\to$ ABSENT $\to$ LATE | Instant UI state update; calculates total present counter in header badge | **PASS** |
| Lock Daily Attendance | Principal clicks `Lock Daily Roster` | Date becomes read-only | Calls `POST /api/attendance/lock`; status badge changes to `🔒 LOCKED` | **PASS** |
| Tamper Mutation Attempt | Teacher tries editing locked date | 403 Forbidden with error toast | Server rejects with 403; UI shows "Attendance for this date is locked" | **PASS** |

---

### E. Timetable Routine & Conflict Detection (`TimetableModule.tsx`)
| Interaction Test | Trigger / Action | Expected Result | Actual Observed Behavior | Result |
| :--- | :--- | :--- | :--- | :---: |
| Period Cell Assignment | Drag/Assign Teacher to period | Cell populates in weekly grid | Updates cell in state and calls `POST /api/timetables/cells` | **PASS** |
| Double-Booking Conflict | Assign already-busy teacher | 409 Conflict popup | Rejects with `TEACHER_CONFLICT` modal detailing conflicting class and period | **PASS** |

---

### F. Online Admissions & One-Click Enrollment (`AdmissionWorkflowModule.tsx`)
| Interaction Test | Trigger / Action | Expected Result | Actual Observed Behavior | Result |
| :--- | :--- | :--- | :--- | :---: |
| Filter Applications | Select status `SUBMITTED` | Table filters to pending apps | Instant filter; shows badge counter `pendingAdm` in left sidebar | **PASS** |
| One-Click Approve | Click `Approve & Enroll Student` | Auto-creates SIS + Parent User | Atomic mutation generates student profile and temporary credentials | **PASS** |

---

## 3. UI Error Handling & State Resilience Summary
1. **Empty States:** When a school has 0 branches or 0 admissions, dedicated empty state illustrations with clear call-to-action buttons (`+ Add First Branch`, `+ New Admission`) render cleanly.
2. **Loading States:** Async operations utilize animated skeleton placeholders (`animate-pulse`) to prevent layout shifts.
3. **Error Boundaries:** The root layout is wrapped in `ErrorBoundary.tsx`. If an unexpected JavaScript runtime exception occurs inside a module, it renders a localized failure card with a "Reload Module" button rather than crashing the entire browser window.
