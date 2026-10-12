# 🚀 i2A SchoolOS — School Onboarding & Setup Specification
> **Multi-Step Onboarding Wizard & Progress Tracking Engine**

---

## 📌 Onboarding Workflow

```
School Registration ➔ Owner Account Creation ➔ Branding Configuration ➔ Academic Session Setup ➔ Class & Section Allocation ➔ Staff Invites ➔ Setup Completed
```

- **Onboarding States**: `NOT_STARTED`, `IN_PROGRESS`, `READY`, `COMPLETED`.
- **Progress Tracking**: Real-time progress bar calculation (`Math.round((currentStep / totalSteps) * 100)`).
