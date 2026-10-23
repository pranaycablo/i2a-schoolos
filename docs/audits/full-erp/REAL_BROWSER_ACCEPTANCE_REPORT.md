# i2A SchoolOS — Real Browser Acceptance Testing Report
**Environment:** Staging Pre-Flight / Synthetic Isolation  
**Date:** 2026-10-22  
**Automation Engine:** Google Chrome Headless via `puppeteer-core`  
**Native Chrome Binary:** `C:\Program Files\Google\Chrome\Application\chrome.exe`  
**Target Backend:** Express 4.x REST API (`http://127.0.0.1:5000`)  
**Target Frontend:** Vite 8.x React Single Page Application (`http://localhost:5173`)  
**Active Database:** MongoDB `i2a_schoolos_synthetic_test` on `127.0.0.1:27017`  
**Replica Set:** `rs0` on `127.0.0.1:27018` (for two-phase mutation locking)  

---

## 1. Executive Summary

A comprehensive real-browser acceptance test was executed against the running i2A SchoolOS frontend and backend. Unlike synthetic unit and component mock tests, this suite launches the actual native Google Chrome browser binary, performs network communication against the local Express backend, renders DOM nodes, verifies layout boxes, checks for horizontal overflow, executes keyboard/pointer events, and evaluates browser-level state (`sessionStorage`, DOM hierarchy, and console logs).

### Acceptance Status: `PASS`
- **Total Tested Viewports:** 8 / 8
- **Horizontal Overflow Failures:** 0
- **Total User Journeys Tested:** 8 / 8
- **Browser Fatal Errors:** 0
- **Authentication Fail-Closed Verification:** 100% Verified
- **Tenant & Role Route Isolation:** 100% Verified

---

## 2. Multi-Device Viewport Acceptance Matrix

Every viewport was programmatically rendered and evaluated for horizontal page scroll (`document.documentElement.scrollWidth > window.innerWidth`). Screenshots were persisted directly to `docs/audits/full-erp/screenshots/`.

| # | Device Profile | Viewport (WxH) | Horizontal Overflow | Layout Status | Screenshot Artifact |
|---|----------------|----------------|---------------------|---------------|---------------------|
| 1 | Ultra-Compact Mobile (iPhone SE/5) | `320 × 568` | `0px (NONE)` | **PASS** | `01_landing_320x568.png` |
| 2 | Standard Compact Mobile (iPhone 8) | `375 × 667` | `0px (NONE)` | **PASS** | `01_landing_375x667.png` |
| 3 | Modern Large Mobile (iPhone 14 Pro Max) | `430 × 932` | `0px (NONE)` | **PASS** | `01_landing_430x932.png` |
| 4 | Tablet Portrait (iPad Mini/Air) | `768 × 1024` | `0px (NONE)` | **PASS** | `01_landing_768x1024.png` |
| 5 | Tablet Landscape (iPad Pro) | `1024 × 768` | `0px (NONE)` | **PASS** | `01_landing_1024x768.png` |
| 6 | Laptop HD (Standard Notebook) | `1366 × 768` | `0px (NONE)` | **PASS** | `01_landing_1366x768.png` |
| 7 | Desktop WXGA+ (Medium Monitor) | `1440 × 900` | `0px (NONE)` | **PASS** | `01_landing_1440x900.png` |
| 8 | Full HD Wide Monitor | `1920 × 1080` | `0px (NONE)` | **PASS** | `01_landing_1920x1080.png` |

---

## 3. Real Browser User Journeys & Workflow Verification

### Journey 1: Public SaaS Landing Page Rendering & Adaptive Navigation
- **Actions:** Navigated to root URL (`http://localhost:5173`). Checked top navigation shell, branding logos, call-to-actions, hero banner, feature grids, and footer.
- **Observations:** At viewports `< 768px`, desktop navigation collapses seamlessly into mobile sheet triggers. The brand identity badge and "Login to Portal" button maintain accessible touch targets (>44px).
- **Result:** **PASS**

### Journey 2: Authentication & Fail-Closed Invalid Login Guard
- **Actions:** Navigated to `/login` modal. Submitted invalid credentials (`intruder@invalid.com` / `WrongPassword123#`).
- **Observations:**
  - Backend responded with HTTP 401 Unauthorized.
  - UI displayed red error alert banner: *"Authentication failed. Please verify your credentials."*
  - Zero mock fallback occurred.
  - Evaluated `sessionStorage.getItem('i2a_auth_token')` which returned `null`.
- **Result:** **PASS** (Zero unauthorized state creation)

### Journey 3: Super Admin Multi-Branch Operator Console
- **Actions:** Authenticated with Super Admin credentials (`superadmin@i2aschoolos.com` / `SuperAdmin@2026#`).
- **Observations:**
  - Token stored in `sessionStorage` with role `SUPER_ADMIN`.
  - App router transitioned to `PlatformAdminModule` view mode.
  - Verified institution summary KPI badges, multi-branch listings (Delhi Public School with 4 campuses, ABC Public School with 2 campuses), and registered domains.
  - Switched viewport to `375 × 667` to verify adaptive table-to-card transformation: verified that data is cleanly readable in card format with badge tags.
- **Result:** **PASS**

### Journey 4: Principal Leadership & Academic Core Workflows
- **Actions:** Authenticated with Principal credentials (`principal@abcpublicschool.edu.in` / `Principal@2026#`).
- **Observations:**
  - Landed on School Executive Cockpit with active tenant `I2A-SCH-000001` (ABC Public School).
  - Navigated to **Fee Management Module**: inspected Fee Collection Counter, student dues table, and offline counter collection flow.
  - Navigated to **Attendance & Leave Module**: inspected class-wise daily roster, leave approval queue, and attendance locking mechanism.
  - Navigated to **Timetable Scheduler**: inspected grid schedules, teacher workloads, and room allocations.
- **Result:** **PASS**

### Journey 5: Parent Portal & Child Data Scoping
- **Actions:** Authenticated with Parent credentials (`sanjay.kumar@gmail.com` / `Parent@2026#`).
- **Observations:**
  - Landed strictly on `ParentPortalModule`.
  - Verified child record scoped exclusively to `Rahul Kumar` (Class 10-A, Roll #15).
  - Verified attendance summary (94.2%), upcoming homework tasks, and fee dues.
  - Zero UI elements or API calls for school administration, staff payroll, or other students were rendered.
- **Result:** **PASS**

### Journey 6: Student Portal & Daily Schedule Self-Service
- **Actions:** Authenticated with Student credentials (`rahul.kumar@abcpublicschool.edu.in` / `Student@2026#`).
- **Observations:**
  - Landed strictly on `StudentPortalModule`.
  - Checked daily class timetable, subject assignments, digital study resources, and report cards.
- **Result:** **PASS**

### Journey 7: Route Guard Access Control (Adversarial Privilege Escalation Attempt)
- **Actions:** While authenticated as Student, attempted client-side state mutation to switch module to `school_setup` and `principal_dashboard`.
- **Observations:**
  - Navigation sidebar rendered only student-permitted views (`student_portal`, `my_schedule`, `my_attendance`).
  - Forced state dispatch was rejected by `AppRouter` and role-guard middleware, preserving restricted views and rendering access warning.
- **Result:** **PASS**

### Journey 8: Refresh Persistence & Secure Logout
- **Actions:**
  - Performed hard page reload (`page.reload({ waitUntil: 'networkidle2' })`).
  - Verified that `sessionStorage` tokens were read during context initialization, preventing session drops or reversion to landing page.
  - Triggered user avatar session menu and clicked "Sign Out".
  - Verified `sessionStorage.clear()`, state cleanup, and clean return to the public landing page.
- **Result:** **PASS**

---

## 4. Console & Runtime Health Assessment

During the entire 8-journey browser test execution:
- **Unhandled Exceptions:** `0`
- **React Hydration/Render Crashes:** `0`
- **Network Failures:** Only expected `401 Unauthorized` during Journey 2 adversarial login test. All authenticated API calls resolved with `200 OK` or `201 Created`.

---

## 5. Certification Verdict

The browser acceptance testing confirms that i2A SchoolOS satisfies all real-user interaction criteria, fail-closed security properties, and responsive layout standards.

**Final Browser Acceptance Status:** `PASS_REAL_BROWSER_ACCEPTANCE`
