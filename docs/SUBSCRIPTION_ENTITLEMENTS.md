# 💳 i2A SchoolOS — Subscription Entitlements & Feature Gating
> **Plan Entitlements, Usage Limits & Feature Access Engine**

---

## 📌 Entitlements & Feature Flags

- **Subscription Statuses**: `TRIAL`, `ACTIVE`, `GRACE_PERIOD`, `EXPIRED`, `SUSPENDED`.
- **Feature Keys**: `ONLINE_EXAM`, `AI_QUESTION_BANK`, `WHATSAPP_AUTOMATION`, `CUSTOM_DOMAIN`.
- **Enforcement**: Evaluated via `TenantSecurityService.canUseFeature(status, featureKey)`. Backend enforces feature blocks even if frontend UI is tampered with.
