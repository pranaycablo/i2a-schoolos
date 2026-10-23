# i2A SchoolOS — Cross-Role End-to-End Acceptance Evidence

**Test Suite:** [`src/__tests__/IdentityCredentialLifecycleAndEmail.test.ts`](file:///d:/i2A_School%20ERP%20%26%20Managment/src/__tests__/IdentityCredentialLifecycleAndEmail.test.ts)  
**Database:** `i2a_schoolos_synthetic_test`  
**Execution Pass Rate:** 27 / 27 Tests Passed (100%)  
**Execution Timestamp:** 2026-10-22 18:52:58 IST  

---

## 1. Scenario 1 — Student Credential Lifecycle & Identity Isolation

```
[Admin School A] ──POST /api/auth/invite-user──> User created with status: 'INVITED'
                                                 SHA-256 token hash stored in MongoDB
                                                 Captured in email sink
[Unactivated Student] ──POST /api/auth/login────> HTTP 403 (ACCOUNT_NOT_ACTIVATED)
[Student] ──POST /api/auth/activate-account─────> HTTP 200 (Password set, token consumed)
[Adversary] ──POST /api/auth/activate-account───> HTTP 400 (Replay attack blocked!)
[Student] ──POST /api/auth/login────────────────> HTTP 200 (JWT session issued)
[Student] ──POST /api/auth/change-password──────> HTTP 200 (Old pass invalid, new pass active)
[Student] ──GET /api/staff──────────────────────> HTTP 403 (Admin route blocked)
```

- **Test 1.1:** Created student `Ananya Sharma` (`synth.student.*@abcschool.in`). Token length 64 hex chars. Asserted `userDoc.invitationTokenHash` exists, `userDoc.invitationToken` is undefined, `userDoc.passwordHash` is undefined. Email captured in sink with template `STUDENT_INVITATION`. **PASSED (40ms)**
- **Test 1.2:** Unactivated login attempt returned `403 ACCOUNT_NOT_ACTIVATED`. **PASSED (20ms)**
- **Test 1.3:** Activation with password `StudentSecurePass2026#` succeeded with HTTP 200. Token atomically unset, `invitationConsumedAt` timestamp recorded. **PASSED (89ms)**
- **Test 1.4:** Replay attack with same token returned `400 INVALID_INVITATION_TOKEN`. **PASSED (3ms)**
- **Test 1.5:** Login with new password succeeded, returned signed JWT. **PASSED (83ms)**
- **Test 1.6:** Password changed to `StudentNewPassword2026!`. Verified old password returns 401, new password returns 200. Active token revoked. **PASSED (331ms)**
- **Test 1.7:** Access to `/api/staff` returned 403 Forbidden. **PASSED (2ms)**

---

## 2. Scenario 2 — Parent Credential Lifecycle & Sibling Isolation

```
[Admin School A] ──POST /api/auth/invite-user──> Linked to [Child A (Class X), Child B (Class VI)]
[Parent] ──POST /api/auth/activate-account─────> Account activated
[Parent] ──GET /api/students────────────────────> Returns ONLY Child A & Child B
[Parent] ──GET /api/students/:childSchoolB──────> HTTP 403 FORBIDDEN
```

- **Test 2.1:** Invited parent `Mr. Ramesh Gupta` linked to `std-child-alpha-001` and `std-child-beta-002`. Email dispatched with template `PARENT_INVITATION`. **PASSED (13ms)**
- **Test 2.2:** Activated account with `ParentSecure2026!#`. Received JWT with `childrenIds: ['std-child-alpha-001', 'std-child-beta-002']`. **PASSED (77ms)**
- **Test 2.3:** Queried `/api/students`. Returned `std-child-alpha-001` and `std-child-beta-002`. Unrelated School B student `std-other-school-003` strictly omitted. **PASSED (6ms)**
- **Test 2.4:** Direct GET request for School B student `std-other-school-003` returned `403 Forbidden`. **PASSED (5ms)**

---

## 3. Scenario 3 — Teacher & Staff Lifecycle & Privilege Enforcement

```
[Admin School A] ──POST /api/auth/invite-user──> Role: TEACHER, Department: Science
[Teacher] ──POST /api/auth/activate-account────> Password set & activated
[Teacher] ──POST /api/homework──────────────────> HTTP 201 (Authorized homework created)
[Teacher] ──POST /api/auth/register-school─────> HTTP 403 (Administrative route blocked)
[Admin] ──Sets Teacher status: 'SUSPENDED'──────> Subsequent login returns 403 ACCOUNT_SUSPENDED
```

- **Test 3.1:** Invited `Dr. Sunita Sen` as `TEACHER` in Science department. Email sink received `STAFF_INVITATION`. **PASSED (12ms)**
- **Test 3.2:** Activated account with `TeacherSecure2026@Pass`. Issued role `TEACHER`. **PASSED (83ms)**
- **Test 3.3:** Created homework *"Physics Wave Optics Quiz"* via `POST /api/homework`. Returned HTTP 201 Created. **PASSED (17ms)**
- **Test 3.4:** Attempted administrative registration endpoint. Rejected with 403. **PASSED (2ms)**
- **Test 3.5:** Suspended user login returned `403 ACCOUNT_SUSPENDED`. **PASSED (4ms)**

---

## 4. Scenario 4 — Forgot Password, OTP Verification & Session Cleared

```
[Anonymous] ──POST /api/auth/forgot-password (ghost email)──> HTTP 200 (Generic anti-enumeration message)
[Anonymous] ──POST /api/auth/forgot-password (valid email)──> HTTP 200, 6-digit OTP captured in sink
[Anonymous] ──POST /api/auth/verify-otp (bad code)──────────> HTTP 400 (Bad code, attempt counter incremented)
[Anonymous] ──POST /api/auth/verify-otp (valid code)────────> HTTP 200, 15-min single-use resetToken issued
[Anonymous] ──POST /api/auth/reset-password─────────────────> HTTP 200 (Password updated, replay blocked)
```

- **Test 4.1:** Ghost email request returned generic 200 response with `debugOtp: undefined`. **PASSED (4ms)**
- **Test 4.2:** Valid email request generated 6-digit OTP captured in email sink. Template `PASSWORD_RESET_OTP`. **PASSED (14ms)**
- **Test 4.3:** Invalid OTP `000000` returned HTTP 400. **PASSED (3ms)**
- **Test 4.4:** Correct OTP verified, returned 32-byte `resetToken`. **PASSED (4ms)**
- **Test 4.5:** Consumed `resetToken` to set `RecoveredSecure2026#Pass`. Replay returned HTTP 400. Login with new credentials returned 200. **PASSED (95ms)**

---

## 5. Scenario 5 — Cross-Tenant Attack Mitigation

- **Test 5.1:** Principal of School A attempting to invite a user into School B has the tenant parameter overridden to School A by the `enforceTenant` middleware. **PASSED (4ms)**
- **Test 5.2:** Principal attempting to invite a `SUPER_ADMIN` returned `403 PRIVILEGE_ESCALATION_BLOCKED`. **PASSED (4ms)**
- **Test 5.3:** Administrative revocation via `POST /api/auth/revoke-invitation` prevented subsequent token activation (returned `400 INVALID_INVITATION_TOKEN`). **PASSED (19ms)**

---

## 6. Scenario 6 — Email Delivery Engine & Security Controls

- **Test 6.1:** Provider mode correctly reports `TEST_SINK`. **PASSED (0ms)**
- **Test 6.2:** CRLF header injection payload rejected with HTTP 400. **PASSED (1ms)**
- **Test 6.3:** Outgoing emails in test environment confirmed to have `isSimulated: true`. **PASSED (0ms)**
