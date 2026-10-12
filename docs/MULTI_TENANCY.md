# 🏢 i2A SchoolOS — Multi-Tenancy & Data Isolation Specification
> **Server-Side Context Resolution & Defense-In-Depth Security**

---

## 📌 1. Multi-Tenant Architecture

Every entity is bound to `tenant_id` (`school_id`).

```typescript
export function validateTenantAccess(user: UserSession, targetTenantId: string): boolean {
  if (user.role === 'SUPER_ADMIN') return true;
  if (user.tenantId !== targetTenantId) {
    throw new TenantSecurityException('DENIED: Cross-tenant access violation.', 403);
  }
  return true;
}
```

- **Client Manipulation Defense**: Target tenant ID is resolved strictly from the authenticated server session context.
- **Cache & Storage Scoping**: Storage keys prefixed with `tenant:{tenantId}:...`
