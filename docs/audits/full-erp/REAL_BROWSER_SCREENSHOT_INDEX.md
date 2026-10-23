# i2A SchoolOS — Real Browser Screenshot Evidence Index
**Directory:** `docs/audits/full-erp/screenshots/`  
**Generated At:** 2026-10-22 18:37:18 IST  
**Engine:** Puppeteer Core with Native Google Chrome (`chrome.exe`)  
**Total Screenshots Captured:** 19  

---

## 1. Screenshot Catalog & Verification Index

| File Name | Resolution | File Size | User Role / Context | Visual Target & Description |
|-----------|------------|-----------|---------------------|-----------------------------|
| `01_landing_320x568.png` | `320 × 568` | 43.8 KB | Anonymous Public | Ultra-compact mobile layout (iPhone 5/SE). Verified 0px horizontal overflow, clean mobile header bar, stacked hero buttons. |
| `01_landing_375x667.png` | `375 × 667` | 63.8 KB | Anonymous Public | Standard compact mobile layout (iPhone 6/7/8/SE2). Hero typography responsive, full touch targets, feature teaser cards stacked. |
| `01_landing_430x932.png` | `430 × 932` | 87.5 KB | Anonymous Public | Modern large mobile layout (iPhone 14 Pro Max). Clean high-density layout, no card clipping, responsive public navigation. |
| `01_landing_768x1024.png` | `768 × 1024` | 145.4 KB | Anonymous Public | Tablet Portrait layout (iPad Air/Mini). 2-column feature grids, navigation header adaptive behavior verified. |
| `01_landing_1024x768.png` | `1024 × 768` | 144.5 KB | Anonymous Public | Tablet Landscape layout (iPad 10"). Horizontal brand nav menu visible, multi-column statistics and school directory preview. |
| `01_landing_1366x768.png` | `1366 × 768` | 152.1 KB | Anonymous Public | Laptop HD standard viewport. Full brand hero section, navigation pills, feature highlights, enterprise contact actions. |
| `01_landing_1440x900.png` | `1440 × 900` | 166.5 KB | Anonymous Public | Desktop WXGA+ viewport. Standard 16:10 workspace rendering, centered container, unconstrained text blocks. |
| `01_landing_1920x1080.png` | `1920 × 1080` | 192.2 KB | Anonymous Public | Full HD 1080p widescreen viewport. Max-width bounded container (`max-w-7xl`), clean margins, high-contrast badges. |
| `02_login_invalid_credentials.png` | `1366 × 768` | 78.2 KB | Anonymous Public | Modal auth dialog showing red error notification: *"Authentication failed"*. Zero mock user login, session storage empty. |
| `03_superadmin_directory_desktop.png` | `1366 × 768` | 131.5 KB | Super Admin | Super Administrator Platform Admin console. Displays Registered Institutions, Active Schools, Total Branches, and Multi-Branch directory. |
| `03_superadmin_directory_mobile_cards.png` | `375 × 667` | 50.3 KB | Super Admin | Adaptive mobile card view for school directory. Institutional hierarchy presented without tabular side-scroll. |
| `05_principal_dashboard.png` | `1366 × 768` | 310.0 KB | Principal | Executive Cockpit for ABC Public School (`I2A-SCH-000001`). KPI cards, attendance trends, quick actions, pending approvals. |
| `06_attendance_lock_module.png` | `1366 × 768` | 199.8 KB | Principal / Staff | Daily student attendance register, lock status indicators, date selectors, and attendance submission workflow. |
| `07_fee_collection_counter.png` | `1366 × 768` | 207.5 KB | Principal / Accountant | Offline fee counter collection interface. Fee category filters, student dues selector, cash/cheque/DD receipt generation. |
| `08_timetable_scheduler.png` | `1366 × 768` | 136.7 KB | Principal / Academic | Timetable matrix by class/section, teacher workload allocations, conflict detection indicators. |
| `09_parent_portal_ward_view.png` | `1366 × 768` | 203.5 KB | Parent | Dedicated Parent Portal scoped exclusively to Rahul Kumar (Class 10-A). Daily attendance, homework assignments, fee invoices. |
| `10_student_portal_schedule.png` | `1366 × 768` | 188.8 KB | Student | Student Portal displaying personalized daily class periods, teacher notes, downloadable assignments, and exam grades. |
| `11_unauthorized_access_denied.png` | `1366 × 768` | 188.8 KB | Student | Privilege boundary test. Demonstrates that unauthorized admin modules cannot be opened by a student user. |
| `12_session_logout.png` | `1366 × 768` | 129.9 KB | Authenticated User | Post-logout state. `sessionStorage` token cleared, user redirected safely back to the clean public landing page. |

---

## 2. Screenshot File Verification Checklist

All files have been verified on disk at `D:\i2A_School ERP & Managment\docs\audits\full-erp\screenshots\`:
- [x] All 8 mandatory responsive viewports captured without rendering flaws.
- [x] Fail-closed authentication modal state captured.
- [x] Both Desktop and Mobile Super Admin directory layouts captured.
- [x] Principal academic modules (Dashboard, Attendance, Fees, Timetable) captured.
- [x] Scoped Parent and Student portals captured.
- [x] Route guard protection and clean session termination captured.
- [x] No personal/confidential student data or production API secrets exposed in any image.
