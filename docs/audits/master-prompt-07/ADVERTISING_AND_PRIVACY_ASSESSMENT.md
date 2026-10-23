# i2A SchoolOS — Advertising Foundation & Privacy Assessment
**Audit Reference:** Master Prompt 07 — Public SaaS Website, Category CMS & Advertising Foundation  
**Deliverable:** 07 / 11  
**Timestamp:** 2026-10-18T18:00:30+05:30  
**Scope:** Privacy Consent Engine (`ConsentBanner.tsx`) & Ethical Ad Architecture (`AdSlot.tsx`)  

---

## 1. Statutory Context & Principles

The monetization and advertising posture of educational software in India is subject to the **Digital Personal Data Protection Act, 2023 (DPDP Act)**. Section 9 of the DPDP Act explicitly prohibits the tracking or behavioral monitoring of children, as well as targeted advertising directed at minor students.

i2A SchoolOS implements an ethical advertising and partner spotlight architecture characterized by three non-negotiable principles:
1. **Absolute Route Gating:** Zero commercial advertisements or sponsored banners on authenticated portal routes, administrative dashboards, teacher gradebooks, or student/parent views.
2. **Voluntary Opt-In Consent:** Advertising and analytics components are disabled by default until the user explicitly consents via the DPDP Act compliant consent banner.
3. **Zero Third-Party Tracking Pixels:** No opaque ad network scripts, tracking beacons, or cross-site fingerprinting libraries are injected into the DOM.

---

## 2. Privacy Consent Engine (`ConsentBanner.tsx`)

### A. Preference Model
Consent preferences are modeled with granular statutory scopes:
```typescript
export interface ConsentPreferences {
  essential: boolean;     // Mandatory security & token management (Always true)
  analytics: boolean;     // Anonymous page timing & telemetry (Default: false)
  advertising: boolean;   // Verified educational partner spotlights (Default: false)
  timestamp: string;      // ISO 8601 statutory record
}
```

### B. User Choice Architecture
The banner presents three clear options to visitors:
- **Accept All:** Activates essential, anonymous performance telemetry, and verified partner spotlights.
- **Essential Only (Reject Optional):** Immediately deactivates analytics and partner spotlights. No non-essential storage is written.
- **Customize Preferences:** An expandable modal permitting independent toggles for Analytics and Partner Spotlight.

### C. Live Reactive Updates
Upon user selection, a custom browser event `i2a_consent_updated` is broadcasted. Active components (`AdSlot`) listen to this event and immediately transition without requiring a page refresh.

---

## 3. Ethical Ad Placement Architecture (`AdSlot.tsx`)

### A. Route Placement Scope
Commercial and partner slots are restricted exclusively to public marketing views (e.g. `PublicWebsiteShell.tsx` footer banner). Authenticated shells (`AppShell.tsx`, `LoginPage.tsx`, `PlatformAdminModule.tsx`) contain zero ad slots.

### B. Consent Gating & Fallback Logic
```tsx
// If advertising consent is not granted, render internal educational initiative
if (!hasAdConsent) {
  return (
    <div role="region" aria-label="i2A Education Initiative" className="...">
      {/* Free NEP 2020 School Implementation Blueprint */}
    </div>
  );
}
```
- **Consent Granted:** Displays verified partner spotlights (e.g. ZKTeco/eSSL hardware turnstile partnerships) clearly marked with a "Partner Spotlight" badge.
- **Consent Denied / Not Provided:** Gracefully falls back to internal public service notices (e.g. free downloadable NEP 2020 Implementation Guides) with zero tracking cookies.
- **AdBlocker Resilience:** Component is wrapped in defensive error handling. If an adblocker intercepts network requests or alters DOM elements, the component fails closed and collapses without disrupting layout.

---

## 4. Privacy Audit Matrix

| Compliance Check | Legal / Engineering Standard | Observed Implementation | Status |
|---|---|---|---|
| **Children Behavioral Tracking** | DPDP Act 2023 Section 9 prohibition | Zero tracking pixels or commercial ads in student/parent portals. | **PASS_VERIFIED** |
| **Notice & Purpose Limitation** | Clear disclosure of cookie purposes | `ConsentBanner` discloses essential, analytics, and partner purposes. | **PASS_VERIFIED** |
| **Consent Revocation** | User must be able to change preferences | Settings accessible via "Customize Preferences" or footer. | **PASS_VERIFIED** |
| **Third-Party Script Injection** | Zero unauthorized third-party trackers | No Google AdSense, Taboola, or Outbrain scripts in codebase. | **PASS_VERIFIED** |
| **AdBlocker Fault Tolerance** | Site must not crash if ads are blocked | Defensive try-catch; silent null fallback verified. | **PASS_VERIFIED** |

---

## 5. Certification Verdict
**Verdict:** `PASS_VERIFIED` — The advertising foundation respects Indian data privacy laws, protects students from commercial tracking, and guarantees uninterrupted application performance.
