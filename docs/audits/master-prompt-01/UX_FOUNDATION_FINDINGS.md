# MASTER PROMPT 01 — UX FOUNDATION REVIEW FINDINGS
**Project:** i2A SchoolOS | Global Multi-Tenant Education Management Platform  
**Audit Root:** `D:\i2A_School ERP & Managment`  
**Phase:** Phase G — User Experience, Accessibility & Interface Integrity Audit  

---

## 1. Interface Architecture Overview

The frontend interface of i2A SchoolOS is built as a single responsive dashboard layout composed of:
1. **Top Application Bar ([`Header.tsx`](file:///D:/i2A_School%20ERP%20&%20Managment/src/components/layout/Header.tsx)):** Active tenant switcher, live database indicator, role switcher dropdown, bilingual language toggle (EN / हिन्दी), controlled notification drawer, dark mode toggle, and mobile menu trigger.
2. **Left Navigation Drawer ([`Sidebar.tsx`](file:///D:/i2A_School%20ERP%20&%20Managment/src/components/layout/Sidebar.tsx)):** Role-filtered navigation links organized by workflow domain.
3. **Main Content Container ([`App.tsx`](file:///D:/i2A_School%20ERP%20&%20Managment/src/App.tsx)):** Dynamically mounts feature modules with responsive padding and fluid layout.

---

## 2. Navigation & Route Consistency

| Aspect | Current Implementation | UX Assessment | Status |
| :--- | :--- | :--- | :--- |
| **Role-Based Nav Filtering** | `navItems.filter(n => n.roles.includes(currentRole))` | Navigation links strictly match authorized modules | **VERIFIED** |
| **Campus Switcher** | Dropdown displays school code, city, board, and tenant ID | Immediate visual context of active institution | **VERIFIED** |
| **Active Module Highlighting** | Tailwind CSS `bg-indigo-600 text-white shadow-sm` | Clear visual indication of active screen | **VERIFIED** |
| **Dead Links / Broken Buttons** | Audited all module routes | Zero dead `href="#"` or unhandled clicks | **VERIFIED** |
| **Responsive Drawer** | Mobile drawer toggle with backdrop overlay | Seamless navigation on phones and tablets | **VERIFIED** |

---

## 3. Form Validation, States & Feedback

### 3.1 Input Validation & Helpful Error Messages
- **Admission Applications:** Mandatory fields (`studentName`, `parentName`, `phone`, `email`, `applyingClass`) have HTML5 and state-level checks. Phone numbers validate 10-digit format.
- **Fee Collection:** Client verifies at least one fee head is selected; calculates total in real-time before submission; server performs independent recalculation.
- **Password Reset:** Requires minimum 8 characters; displays remaining verification attempts upon incorrect OTP entry.

### 3.2 Loading, Empty & Error States
- **Empty States:** When student lists, fee receipts, or audit logs have zero items, descriptive empty state graphics and guidance messages are rendered (e.g., "No admission applications pending review").
- **Live Sync Indicator:** Top header displays `Syncing...`, `DB Live` (emerald), or `Offline` (amber), giving administrators immediate visibility into backend database reachability.
- **Session Expiry:** When backend returns HTTP 401, `apiClient` clears session state, and the UI redirects the user gracefully to the login view without unhandled promise crashes.

---

## 4. Bilingual Localization & Pure Language Rendering

The application features a centralized dictionary-based localization system ([`src/utils/translations.ts`](file:///D:/i2A_School%20ERP%20&%20Managment/src/utils/translations.ts)):
- **Languages Supported:** English (`en`) and Hindi (`hi`).
- **Persistence:** Stored in `localStorage.getItem('i2a_lang')` and synchronized across all modules.
- **Header Switcher:** One-click toggle between `EN` and `हिन्दी` pill buttons.
- **Pure Rendering:** Hindi translations use formal, standardized academic terminology (e.g., *प्रधानाचार्य*, *उपस्थिति*, *शुल्क प्रबंधन*, *समय सारणी*) rather than automated transliteration.

---

## 5. Accessibility & Responsive Ergonomics

1. **Dark Mode Ergonomics:**
   - Dark mode toggle uses `class="dark"` on `document.documentElement`.
   - Contrast ratios comply with WCAG AA guidelines (slate-900 backgrounds with slate-100 high-contrast typography).
   - Theme preference persists in `localStorage.getItem('i2a_dark')`.
2. **Touch Targets:**
   - Mobile buttons and action icons maintain minimum 40x40px touch areas for mobile and tablet operation.
3. **Pending Dispatches Drawer:**
   - Bell notification badge displays a pulsing counter of pending admissions and credential dispatches with one-click full credential email preview.
