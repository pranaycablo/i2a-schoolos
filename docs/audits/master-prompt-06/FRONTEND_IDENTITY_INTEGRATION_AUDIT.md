# i2A SchoolOS — Master Prompt 06
## Frontend Identity & Shell Integration Audit

**Status:** PASS_VERIFIED  
**Date:** October 18, 2026  
**Project Root:** `D:\i2A_School ERP & Managment`  
**Domain:** Frontend Shell, Session State, Role-Gating & UI Defense-in-Depth  

---

### 1. Executive Summary

The frontend application shell and session lifecycle built in Phase 05 was subjected to a comprehensive security audit under Phase 06. All identity-aware UI components, multi-tenant selectors, profile menus, and notification drawers were verified to enforce server-aligned role gating and zero secret leakage.

---

### 2. Component-by-Component Security Audit

#### 2.1 `ProfileSessionMenu.tsx`
- **Location**: [src/components/shell/ProfileSessionMenu.tsx](file:///D:/i2A_School%20ERP%20&%20Managment/src/components/shell/ProfileSessionMenu.tsx)
- **Role Display**: Reflects verified `currentRole` from `SchoolContext` with distinct visual badge colors (`rose` for Super Admin, `indigo` for Principal, `emerald` for Teacher, `purple` for Student, `amber` for Parent).
- **Session Switching**: For users with multi-role or multi-tenant permissions, session switching triggers `loginToSchool` which revalidates the tenant context via the backend API.
- **Secure Logout**: Invokes `authApi.logout()`, triggers backend token revocation (`POST /api/auth/logout`), clears in-memory state, and redirects to `/login`.

#### 2.2 `MultiTenantSelector.tsx`
- **Location**: [src/components/shell/MultiTenantSelector.tsx](file:///D:/i2A_School%20ERP%20&%20Managment/src/components/shell/MultiTenantSelector.tsx)
- **Role Gating**: Only rendered or enabled for privileged actors (`SUPER_ADMIN`, `ORG_DIRECTOR`).
- **Institutional Users**: For standard institutional principals, teachers, and students, the selector is locked to the assigned school (`I2A-SCH-XXXXXX`) and displays the verified institution badge with no option to switch to unauthorized tenants.

#### 2.3 `NotificationDrawer.tsx`
- **Location**: [src/components/shell/NotificationDrawer.tsx](file:///D:/i2A_School%20ERP%20&%20Managment/src/components/shell/NotificationDrawer.tsx)
- **Permission Check**: `canViewCredentials = ['PRINCIPAL', 'SUPER_ADMIN', 'ADMIN'].includes(currentRole);`
- **Credentials Dispatch Records**: The "View Credentials Dispatch Record" button is strictly hidden for unauthorized roles (e.g. students, parents, and support staff).
- **Password Masking**: All credential dispatch payloads present masked values (`••••••••••••`).

#### 2.4 `NotificationToast.tsx`
- **Location**: [src/components/layout/NotificationToast.tsx](file:///D:/i2A_School%20ERP%20&%20Managment/src/components/layout/NotificationToast.tsx)
- **Email Preview Simulation**: Sensitive credential rows (such as initial setup passwords) are rendered with a dedicated amber warning badge and masked string `•••••••••••• (Sent securely to recipient)`.
- **Clipboard Protection**: The copy button is deactivated for sensitive credential fields, preventing accidental copying of masked placeholders or secrets into unsecure clipboards.

#### 2.5 `LoginPage.tsx`
- **Location**: [src/pages/LoginPage.tsx](file:///D:/i2A_School%20ERP%20&%20Managment/src/pages/LoginPage.tsx)
- **Authentication**: Submits clean strings to `POST /api/auth/login`. Handles locked accounts with countdown timer (`remainingSec`).
- **Forgot Password Workflow**: Modal integrates rate-limited OTP request (`POST /api/auth/forgot-password`), 6-digit verification code check (`POST /api/auth/verify-otp`), and bcrypt password reset (`POST /api/auth/reset-password`).
- **Zero Account Enumeration**: Forgot password endpoint always returns generic success message even if email is absent from the database.

#### 2.6 `AccessDeniedPage.tsx` (403 Handler)
- **Location**: [src/pages/AccessDeniedPage.tsx](file:///D:/i2A_School%20ERP%20&%20Managment/src/pages/AccessDeniedPage.tsx)
- **Security Guidance**: Renders clear explanation of permission violation, displays request ID for administrative trace, and offers a safe return navigation button to the authorized dashboard.

---

### 3. API Client Integration & Request Interceptor

- **Location**: [src/services/apiClient.ts](file:///D:/i2A_School%20ERP%20&%20Managment/src/services/apiClient.ts)
- **Bearer Token Attachment**: The Axios interceptor automatically retrieves the active JWT and injects `Authorization: Bearer ${token}`.
- **Fail-Closed on 401**: Interceptor catches `401 TOKEN_EXPIRED` or `401 TOKEN_REVOKED`, purges stale local tokens, and redirects the user to the login screen.
- **Zero Secret Ingestion**: Tokens are never logged to console or attached to unauthenticated public endpoints.

---

### 4. Verification Verdict

All frontend identity and shell components have been validated with zero TypeScript diagnostics, 0 ESLint errors across 146 files, and complete test coverage.
