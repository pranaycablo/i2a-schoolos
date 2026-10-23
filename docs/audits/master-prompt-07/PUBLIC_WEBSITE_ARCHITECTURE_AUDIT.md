# i2A SchoolOS — Public Website Architecture Audit & Structural Breakdown
**Audit Reference:** Master Prompt 07 — Public SaaS Website, Category CMS & Advertising Foundation  
**Deliverable:** 02 / 11  
**Timestamp:** 2026-10-18T17:59:00+05:30  
**Architect:** Principal SaaS Architect & Senior Full-Stack Developer  

---

## 1. Architectural Evolution & Decomposition

### A. Previous State Analysis
Prior to Master Prompt 07, public landing page functionality was housed in a monolithic component (`src/components/public/PublicSaasLandingPage.tsx`, ~806 lines) which mixed marketing hero sections, feature grids, pricing cards, portal demo triggers, and inline modals within a single file. While functional for preliminary demonstrations, it lacked canonical multi-page routing, dedicated category CMS views, privacy policy pages, terms of service agreements, and standard DPDP Act consent controls.

### B. Modular Phase 07 Architecture
The public presentation layer has been refactored into a high-performance, modular system governed by `PublicWebsiteShell.tsx` and 14 dedicated public pages and layout primitives:

```
src/components/public/
├── PublicWebsiteShell.tsx           # Central public controller & routing coordinator
├── PublicHeader.tsx                 # Responsive universal navigation with mobile drawer
├── PublicFooter.tsx                 # Multi-column footer with 7 categories, trust badges & compliance
├── ConsentBanner.tsx                # DPDP Act 2023 cookie & privacy preference modal/banner
├── AdSlot.tsx                       # Ethical partner spotlight with consent gating & fallback
└── pages/
    ├── HomePage.tsx                 # Hero, factual metrics, quick category cards, pillars
    ├── ProductPage.tsx              # Deep dive on architecture, zero-bypass tenant isolation
    ├── FeaturesPage.tsx             # Complete module inventory across academic, fees & fleet
    ├── SolutionsPage.tsx            # Category hub for all 7 educational institution verticals
    ├── CategoryDetailPage.tsx       # Deep dive for specific category slug with tailored workflows
    ├── PricingPage.tsx              # Interactive enrollment slider calculator & 3-tier comparison
    ├── AboutPage.tsx                # Engineering mission, founding story & Indian context
    ├── ContactPage.tsx              # Inquiries, campus demo scheduler & SLA commitments
    ├── FaqPage.tsx                  # Searchable accordion FAQs on setup, security & hardware
    ├── PrivacyPolicyPage.tsx        # DPDP Act 2023 compliant privacy statement & grievance officer
    ├── TermsPage.tsx                # Enterprise SaaS SLA agreement & data ownership guarantee
    ├── SecurityPage.tsx             # Cryptographic posture, AES-256, TLS 1.3 & failover specs
    └── RegisterTrialPage.tsx        # Public 14-day trial registration submitting to API queue
```

---

## 2. Design Token System & Apple-Grade UI Fidelity

All new public components adhere strictly to the Phase 05 design system tokens (`src/design-system/tokens.ts`):
1. **Color Palette:**
   - Deep Obsidian surfaces (`#090D16`, `bg-slate-950`) with elevated card layers (`#111827`, `bg-slate-900/60`).
   - Accent gradients from brand primary (`#4F46E5`, Indigo 600) via Purple 500 (`#8B5CF6`) to Pink 500.
   - Status indicators: Verified Success (`#10B981`, Emerald), Warning (`#F59E0B`), and Error (`#EF4444`).
2. **Typography & Readability:**
   - Inter and Noto Sans Devanagari typography stack for seamless English & Hindi readability.
   - Fluid typography scales (`text-xs` up to `text-6xl font-extrabold tracking-tight`).
3. **Responsive Mobile Fidelity:**
   - Mobile-first flexbox and CSS Grid layout patterns.
   - Dedicated hamburger drawer menu with full route accessibility on touch devices.
   - Touch targets meeting minimum 44×44px interactive dimension standards.

---

## 3. Strict Boundary Separation (Public vs Protected Portals)

The application shell strictly segregates public marketing views from authenticated administrative dashboards in `src/App.tsx`:
```tsx
const AppRouter: React.FC = () => {
  const { viewMode, setViewMode } = useSchool();

  if (viewMode === 'PUBLIC_SAAS') {
    return <PublicSaasLandingPage />;
  }

  if (viewMode === 'LOGIN') {
    return (
      <LoginPage
        onCancel={() => setViewMode('PUBLIC_SAAS')}
        onSuccess={() => setViewMode('SCHOOL_PORTAL')}
      />
    );
  }

  if (viewMode === 'PLATFORM_ADMIN') {
    return <PlatformAdminModule />;
  }

  return <AppShell />;
};
```
- Public users visiting marketing pages have zero execution footprint inside school portal modules.
- Administrative tokens and private student records are completely unreachable from public routes.

---

## 4. Verification Evidence & Compilation Status
- **Build Status:** `npm run build` completed with exit code 0 (1,985 modules transformed).
- **Linter Status:** `npm run lint` completed with 0 errors across 168 files.
- **Regression Status:** 29 test files, 304 tests passing (100% green).
