---
name: security_auditor
description: >-
  Audits and enforces security controls, RBAC authorization, cryptographic token integrity, rate limiting, and data privacy across Pet Care CRM.
---

# Security Auditor Skill - Information Security & Authorization Enforcement

The `security_auditor` skill inspects the Pet Care CRM architecture, API endpoints, authentication flows, and data stores to detect vulnerabilities, privilege escalation paths, and privacy leaks.

---

## When to Activate This Skill
- Whenever authentication, registration, or password reset logic is modified.
- When new API endpoints or ViewSets are exposed.
- When handling sensitive customer PII, medical records, or payment records.
- Prior to staging and production deployments.

---

## Pet Care CRM Threat Model & Security Baseline

### 1. Cryptographic Verification Token Integrity
- **Single-Use Enforcement**:
  - The token used in `/api/auth/verify-registration-token/` or `/verify-email-token/` must be invalidated immediately upon consumption (`token.is_used = True` or deleted).
  - Test against replay attacks: a second invocation with the same token must fail with HTTP 400.
- **Entropy & Unpredictability**:
  - Tokens must be generated via `secrets.token_urlsafe(32)` or cryptographically secure UUID4. Never use sequential counters or timestamp-based tokens.
- **Strict Expiration**:
  - Tokens must expire after 24 hours. The backend must enforce `created_at + timedelta(hours=24) < timezone.now()`.

### 2. Role-Based Access Control (RBAC) & Object-Level Isolation
- **Role Hierarchy**:
  - `ADMIN`: Full access to all 11 domains, financial records, user management, and system reports.
  - `STAFF`: Access to operational records (pets, bookings, daily logs, check-in checklists, appointments, medical records). No access to staff management or system configuration.
  - `CUSTOMER`: Strict self-service access. Can only read and create records linked to their own customer profile.
- **Tenant & Object Isolation Check**:
  - In `PetViewSet`, `AppointmentViewSet`, `BoardingViewSet`, `InvoiceViewSet`:
    ```python
    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.CUSTOMER:
            return self.queryset.filter(owner__user=user)
        return self.queryset.all()
    ```
  - Verify that a customer passing another customer's `pet_id` or `invoice_id` in URL parameters receives `404 Not Found` or `403 Forbidden`.

### 3. Mass Assignment & Privilege Escalation
- In `UserSerializer` and `CustomerSerializer`:
  - `role`, `is_staff`, `is_superuser`, and `is_email_verified` must be declared as `read_only_fields`.
  - A customer posting `role: "ADMIN"` during registration or profile update must have that field ignored or rejected.

### 4. Credential & Secret Management
- **Passwords**:
  - Enforce Django standard password validators (`MinimumLengthValidator`, `NumericPasswordValidator`).
  - Passwords must be hashed using PBKDF2 or Argon2. Never log or store plain text passwords.
- **Sensitive Output Suppression**:
  - Serializers must never return `verification_token`, `otp_code`, `EMAIL_HOST_PASSWORD`, or raw `SECRET_KEY`.

### 5. CORS, CSRF, and JWT Lifetimes
- **JWT Configuration** (`SIMPLE_JWT` in `settings.py`):
  - Access token lifetime: 1 day (development) or 15–60 minutes (production).
  - Refresh token rotation: `ROTATE_REFRESH_TOKENS = True`.
- **Headers & Transport Security**:
  - Production deployments must enforce HTTPS (`SECURE_SSL_REDIRECT = True`).
  - Restrict `CORS_ALLOWED_ORIGINS` to trusted frontend domains.

---

## Security Audit Deliverables

When an audit is performed, generate a formal vulnerability assessment:

1. **Executive Summary**: Overall security posture and CVSS risk rating (Critical, High, Medium, Low).
2. **Vulnerability Findings**:
   - Title & CWE Identifier (e.g., CWE-284: Improper Access Control).
   - Affected File and Line (e.g., [`views.py:L120`](file:///c:/Users/harit/OneDrive/Desktop/petcare/backend/users/views.py#L120)).
   - Exploit Scenario.
   - Proof of Concept (PoC) test command.
   - Remediation Patch.
3. **Verification Sign-Off**: Verification step confirming the issue has been patched and covered by regression tests.
