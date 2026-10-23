# i2A SchoolOS — Public Pages & Routing Architecture Inventory
**Audit Reference:** Master Prompt 07 — Public SaaS Website, Category CMS & Advertising Foundation  
**Deliverable:** 03 / 11  
**Timestamp:** 2026-10-18T17:59:30+05:30  
**Scope:** Canonical Public Page Suite & Navigation Routing Engine  

---

## 1. Canonical Public Route Inventory

i2A SchoolOS implements a comprehensive suite of 14 canonical public pages rendered via `PublicWebsiteShell.tsx`:

| Canonical Route | Target Component | Purpose & Content | Primary Interactive Features |
|---|---|---|---|
| `/` (`home`) | `HomePage.tsx` | Platform introduction, value proposition, live factual metrics, and trial entry. | Category cards, live metric counters, module highlights, trial CTA. |
| `/product` | `ProductPage.tsx` | Deep dive into cloud architecture, tenant isolation, and hardware synchronization. | Multi-tier topology diagram, specification matrix, security layer breakdown. |
| `/features` | `FeaturesPage.tsx` | Complete operational module inventory across SIS, academics, fees, and fleet. | Category filter pills (All, Academic, Finance, Operations), feature check-lists. |
| `/solutions` | `SolutionsPage.tsx` | Overview hub for all 7 educational institution verticals. | Category search bar, dynamic card grid from `/api/categories`, compliance tags. |
| `/solutions/:slug` | `CategoryDetailPage.tsx` | Dedicated institutional deep dive for each category slug. | Step-by-step workflow blueprints, regulatory badges, category-tailored trial CTA. |
| `/pricing` | `PricingPage.tsx` | Transparent subscription tiers and interactive pricing quote calculator. | Student count slider (50 to 3,000+), Monthly/Yearly toggle, feature comparison table. |
| `/about` | `AboutPage.tsx` | Company mission, founding narrative, and Indian institutional commitment. | Core engineering principles, data sovereignty pillars, story narrative. |
| `/contact` | `ContactPage.tsx` | Sales inquiry desk, campus demo scheduling, and official support contacts. | Inquiry form submitting to backend API, headquarter address, toll-free phone. |
| `/faq` | `FaqPage.tsx` | Categorized, searchable frequently asked questions. | Search input, category filter pills, accordion expand/collapse panels. |
| `/privacy` | `PrivacyPolicyPage.tsx` | Statutory privacy statement compliant with DPDP Act 2023. | Statutory role breakdown (Fiduciary vs Processor), children's data safeguards, Grievance Officer details. |
| `/terms` | `TermsPage.tsx` | Institutional SaaS terms of service and SLA agreement. | 99.9% uptime SLA, 100% institutional data ownership clause, cancellation terms. |
| `/security` | `SecurityPage.tsx` | Cryptographic posture, encryption ciphers, and audit log guarantees. | AES-256 and TLS 1.3 specs, NoSQL injection guard details, vulnerability reporting. |
| `/register` | `RegisterTrialPage.tsx` | Public 14-day institutional free trial application entry. | Category selector, board dropdown, student count input, instant reference tracking ID. |
| `/login` | `LoginPage.tsx` | Unified portal authentication bridge. | School selector, role selection (Principal, Teacher, Parent, etc.), secure credentials input. |

---

## 2. Navigation State Engine & Transition Mechanics

### A. Routing Coordination in `PublicWebsiteShell.tsx`
Public routing is coordinated via reactive route state:
```tsx
const [currentRoute, setCurrentRoute] = useState<PublicRoute>(initialRoute);
const [categorySlug, setCategorySlug] = useState<string>(initialSlug);

const handleNavigate = (route: PublicRoute, slug?: string) => {
  setCurrentRoute(route);
  if (slug) setCategorySlug(slug);
  updatePageMeta(route);
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
```
- **Instant Client-Side Navigation:** Zero page reload or flickering.
- **Scroll Restoration:** Automatically smooth-scrolls to the top of the viewport on route transition.
- **SEO Title & Meta Tag Synchronization:** Calls `updatePageMeta(route)` on each route change, updating `<title>`, `<meta name="description">`, Open Graph tags, and canonical `<link rel="canonical">`.

### B. Header Navigation & Dropdown Controls (`PublicHeader.tsx`)
- Direct navigation pills with active state indicators (`bg-indigo-950/40 text-indigo-400 font-bold`).
- Interactive Solutions dropdown listing all 7 institution types with dedicated icons:
  - K-12 Schools (`School`)
  - School Groups & Trusts (`Building2`)
  - Colleges & Higher Ed (`GraduationCap`)
  - Coaching Institutes (`Target`)
  - Tuition Centres (`BookOpen`)
  - Preschools & Daycares (`Baby`)
  - Sports & Arts Academies (`Trophy`)
- Instant bilingual toggle (`EN` ↔ `हिन्दी`) updating text context across every public component in real-time.
- Mobile Hamburger drawer menu with ARIA accessibility tags (`aria-expanded`, `aria-label`).

---

## 3. Verification & Compliance
All 14 pages have been tested and verified under automated test suite `src/__tests__/PublicWebsiteAndCategoryCms.test.ts`. Navigation resolves without runtime errors, layout shifts, or undefined props.
