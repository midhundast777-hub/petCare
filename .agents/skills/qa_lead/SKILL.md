---
name: qa_lead
description: >-
  Designs, coordinates, and executes end-to-end testing strategies, regression test suites, and API contract validations for Pet Care CRM.
---

# QA Lead Skill - Quality Assurance & Test Engineering

The `qa_lead` skill ensures the stability, correctness, and regression resistance of the Pet Care CRM. It manages test suites across Django backend services and React frontend interfaces.

---

## When to Activate This Skill
- Before releasing or completing any major feature or bug fix.
- When validating critical business logic (registration email verification, 2FA approval, boarding lifecycle, billing calculation).
- To establish automated test scripts and smoke test verification routines.

---

## Core Testing Tiers

### 1. Security & Authentication Test Suite
Ensure authentication pipelines satisfy all business and security rules:
- **Registration Email Token Verification**:
  - Test generating a valid token during registration.
  - Test verifying with the correct token: verify `is_email_verified=True`, user marked active, and token consumed.
  - Test single-use invalidation: attempting to reuse the token must return `400 Bad Request`.
  - Test expiration: tokens older than 24 hours must be rejected with the exact message:
    `"This verification link is invalid or has expired. Please request a new verification email."`
  - Test mismatched token: random or tampered token strings must be rejected.
- **Two-Factor Login**:
  - Verify admin login triggers Gmail verification dispatch.
  - Verify JWT tokens are issued only after verification completes.

### 2. Boarding & Sanctuary Operational Workflow Suite
Validate state transitions and operational checks:
- **Suite/Room Allocation**:
  - Verify pets cannot be booked into occupied rooms for overlapping dates.
- **Digital Check-In**:
  - Verify checklist requires vaccination verification flag, pet weight, belongings log, and emergency contact.
  - Verify pet status updates to `IN_CARE` and booking status updates to `CHECKED_IN`.
- **Daily Care Logs**:
  - Verify staff can record meal consumption, elimination, exercise notes, and medication administration.
- **Check-Out & Billing Integration**:
  - Verify check-out checklist enforces payment check.
  - Verify invoice generation accurately aggregates room rate x nights + extra services.
  - Verify booking status transitions to `COMPLETED` / `CHECKED_OUT`.

### 3. Financial & Billing Accuracy Suite
- Verify line item quantity and unit price multiply correctly.
- Verify tax percentage calculations (e.g. 8% or 10%).
- Verify that recording a payment updates invoice `payment_status` to `PAID` and sets `amount_paid = total_amount`.

---

## Standard QA Execution Protocol

### Step 1: Run Backend Regression Test Scripts
```powershell
# Run the automated verification token test suite
python -m unittest scratch/test_secure_email_verification.py

# Run the live API endpoint smoke check
python backend/live_check.py
```

### Step 2: Validate Frontend Production Build
```powershell
cd frontend
npm run build
```
Verify that Vite finishes with `0 errors` and bundle size within performance budgets.

### Step 3: Run Linters & Static Analysis
```powershell
cd frontend
npx oxlint
```

---

## QA Execution Matrix Deliverable

After executing test protocols, document results in this format:

| Test Suite | Scenario / Test Case | Expected Result | Actual Result | Status |
|---|---|---|---|:---:|
| **Auth** | Single-use registration token | Invalidate after first consumption | Invalidation verified (HTTP 400 on reuse) | **PASS** |
| **Auth** | Token expiration (>24h) | Return 400 with invalid/expired msg | 400 with exact error message | **PASS** |
| **Boarding** | Check-in checklist update | Booking status becomes CHECKED_IN | State updated in DB | **PASS** |
| **Billing** | Invoice tax & total calculation | Total = Items + Tax | Total calculated to 2 decimal places | **PASS** |
| **RBAC** | Customer accessing `/api/reports/` | HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **Build** | Frontend Vite bundling | Zero compilation errors | Build successful | **PASS** |

If any test fails, file an entry in [`docs/INCIDENT_REGISTRY.md`](file:///c:/Users/harit/OneDrive/Desktop/petcare/docs/INCIDENT_REGISTRY.md) and assign remediation to the developer.
