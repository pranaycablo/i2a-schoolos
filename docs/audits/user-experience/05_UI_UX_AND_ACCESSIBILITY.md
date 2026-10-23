# i2A SchoolOS — UI/UX, Mobile & Accessibility Audit

**Audit Scope:** Deep heuristic evaluation of design system compliance, responsive layout, touch targets, keyboard navigation, and bilingual localization.

---

## 1. Visual Consistency & Design System Evaluation

### Strengths:
- **Consistent Modern Aesthetic:** Tailwind CSS v4 styling with consistent slate palette (`slate-900`, `slate-800`, `slate-50`), rounded cards (`rounded-3xl`, `rounded-2xl`), and Lucide icons.
- **Dark Mode Support:** Clean transition between light and dark themes toggled in `ProfileSessionMenu.tsx` and persisted in `localStorage`.
- **Badge & Status Standardization:** Consistent status colors across most modules (`EMERALD` for Active/Paid/Approved, `AMBER` for Pending/Draft, `ROSE` for Overdue/Rejected, `PURPLE` for Super Admin).

### Deficiencies & Inconsistencies:
- **Card-Only Grids vs Professional Data Tables:** In `StudentManagementModule.tsx` and `FeeManagementModule.tsx`, records are rendered primarily as visual cards rather than dense, sortable, paginated data tables. For schools with 1,000+ students, scrolling through card grids is tedious.
- **Variable Modal Sizes:** Some modals specify fixed `max-w-md` while others use `max-w-2xl` with differing scroll behaviors.
- **Button Hover States:** Several primary action buttons use `cursor-pointer`, but some lack an explicit disabled visual state when forms are submitting.

---

## 2. Mobile & Responsive Usability

### Breakpoint Analysis:
- **Desktop ($\ge$ 1024px):** Excellent. Dual-column layouts, sticky sidebar, top search bar, and wide data previews render cleanly.
- **Tablet (768px - 1023px):** Moderate. Sidebar auto-collapses to mobile drawer toggled via the hamburger icon. However, wide tables (like the fee collection history and timetable grid) require horizontal scrolling without a sticky left header column.
- **Small Phone ($\le$ 640px):**
  - *Timetable Grid:* The 7-period $\times$ 6-day timetable grid in `TimetableModule.tsx` is completely unusable on mobile devices without pinching and zooming.
  - *Report Card Preview:* The A4 report card preview in `ReportCardCertificateModule.tsx` spills outside the mobile viewport unless wrapped in an overflow container.
  - *Header Clutter:* The `ShellHeader.tsx` compresses the brand name, school switcher, search bar, and notification bell into a crowded row on devices under 400px.

---

## 3. Accessibility (a11y) & Keyboard Navigation

### Evaluation Standards: WCAG 2.1 Level AA

| Accessibility Vector | Finding | Compliance Status |
|---|---|:---:|
| **Keyboard Navigation** | Tab navigation works for primary buttons and inputs. Modals trap focus in some cases but lack explicit focus return on close. | 🟡 **Partial** |
| **Visible Focus Indicators** | Custom `.focus-ring` class is used in `ShellHeader` and inputs, but absent on several custom card action buttons. | 🟡 **Partial** |
| **Screen Reader Semantics** | Inputs have `<label>` tags, but icon-only buttons (`X`, `Printer`, `Search`) frequently lack `aria-label` or `aria-describedby`. | 🔴 **Fails WCAG 1.3.1** |
| **Color Contrast** | Slate-400 text on slate-900 backgrounds (`#94a3b8` on `#0f172a`) has a contrast ratio of ~4.6:1, meeting the 4.5:1 minimum for normal text. However, small `[10px]` subtexts fall below standard readability. | 🟡 **Borderline** |
| **Color-Independent Status** | Badges combine text labels ("PAID", "OVERDUE", "ACTIVE") with colors, satisfying color-independent status requirements. | ✅ **Passes WCAG 1.4.1** |

---

## 4. Language, Comprehension & Bilingual Localization

### Language Architecture:
- Language state (`'en' | 'hi'`) is stored in `SchoolContext` and toggled via the profile menu.
- A translation utility `src/utils/translations.ts` provides Hindi equivalents for core keys.

### Forensic Findings on Hindi / English Support:
1. **Incomplete Translation Coverage:**
   - While `PrincipalAIDashboardModule.tsx` and `DigitalBooksAIQuestionBankModule.tsx` have rich Hindi prompts and titles (`isHindi ? ... : ...`), major administrative modules (`StudentManagementModule.tsx`, `TimetableModule.tsx`, `InstitutionalHierarchyModule.tsx`) have only 10-20% bilingual coverage. Most form labels, table headers, and error messages remain strictly English.
2. **Hardcoded Hindi in Alerts:**
   - In `PlatformAdminModule.tsx` line 64: `setApprovalSuccessMsg('✅ स्कूल "${newTenant.name}" सफलतापूर्वक वेरिफाई और अप्रूव हो गया!')`. Even if the language toggle is set to English, this success notification displays in Hindi!
3. **Terminology Appropriateness:**
   - Indian academic terms (CBSE, CCE marks, PTM, Roll No, Admission No, Aadhaar) are well understood by Indian school clerks. However, terms like "DAG Acyclic Validation", "Monotonic Fencing Lease", and "Telematics" will baffle non-technical school operators and must be hidden behind plain-language labels.
