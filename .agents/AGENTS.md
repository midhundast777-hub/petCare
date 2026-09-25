# Pet Care CRM - Agent Rules & Repository Guidelines

You are an expert full-stack engineer and specialized assistant for the **Pet Care CRM** repository.
All agents operating in this workspace must adhere to the rules, architecture standards, and workflow protocols defined in this document.

---

## 1. Repository Architecture & Stack Overview

The Pet Care CRM is a mission-critical veterinary and pet boarding sanctuary platform:
- **Backend**: Python 3.12, Django 5.x, Django REST Framework, SimpleJWT, SQLite (`backend/db.sqlite3`) for development, PostgreSQL in production.
- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React icons.
- **Django Apps (11 core domains)**:
  - `users`: Custom user model (`User`), RBAC (Admin, Staff, Customer), 2FA Gmail login approval, email verification code registration pipeline.
  - `customers`: Customer profiles, contact details, emergency contacts, customer notes.
  - `pets`: Pet profiles (species, breed, DOB, microchip, weight, behavioral flags, dietary restrictions).
  - `appointments`: Veterinary and grooming scheduling, duration, status lifecycle.
  - `boarding`: Pet boarding suites/rooms, booking records, check-in/out digital checklists, daily care logs (meals, bathroom, exercise, mood).
  - `services`: Service catalog (boarding rates, grooming, daycare, veterinary exams, add-ons).
  - `vaccinations`: Vaccine registry, certificate uploads, expiration dates, booster alerts.
  - `medical`: Medical conditions, veterinary consultations, prescription medications, medication administration logs, feeding schedules.
  - `billing`: Invoices, line items, payments, tax calculations, receipt generation.
  - `notifications`: Push and in-app notifications, unread badges, email dispatch.
  - `reports`: Executive analytics, boarding occupancy, financial revenue metrics.

---

## 2. Mandatory Coding Conventions

### Backend (Django & DRF)
1. **Model Integrity**:
   - Always define explicit `related_name` on `ForeignKey` and `ManyToManyField` fields.
   - Use `models.TextChoices` or `models.IntegerChoices` for all enum fields (e.g. `Status`, `Role`, `PaymentStatus`).
   - Timestamps `created_at = models.DateTimeField(auto_now_add=True)` and `updated_at = models.DateTimeField(auto_now=True)` must be on all persistent models.
2. **Serializers**:
   - Explicitly define `fields` in `ModelSerializer` classes. Do not use `fields = '__all__'`.
   - Never serialize sensitive secrets (`password`, `verification_token`, `otp_code`).
3. **Views & Permissions**:
   - Every API view must declare explicit `permission_classes`. Default to `[IsAuthenticated]`.
   - Customer-scoped endpoints must restrict querysets to the requesting user (`filter(owner=request.user)` or `filter(customer__user=request.user)`).
   - Staff/Admin endpoints must enforce role checks (`IsStaffUser`, `IsAdminUser`).
4. **Migrations**:
   - Never modify existing migration files that have already been executed.
   - Run `python manage.py makemigrations` and verify with `python manage.py showmigrations`.

### Frontend (React & Tailwind CSS)
1. **Component Design**:
   - Follow functional component standards with React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`).
   - Reusable UI widgets must live in `frontend/src/components/` and be documented in `docs/COMPONENT_LIBRARY.md`.
2. **Styling Tokens**:
   - Adhere to the established palette: Forest Teal (`brand-600`), Deep Slate (`slate-900`), Neutral Slate (`slate-50` to `slate-800`), Emerald (`emerald-600`), Amber (`amber-600`), and Rose (`rose-600`).
   - Never introduce ad-hoc arbitrary Tailwind values when standard tokens exist.
3. **Feedback & Feedback Loops**:
   - Use `useToast()` (`addToast(message, type)`) for non-blocking feedback (success, error, warning).
   - Provide clear loading states via `LoadingSpinner` or skeleton overlays during asynchronous API requests.
4. **State Transitions**:
   - Boarding workflows must strictly respect the lifecycle: `BOOKED` → `CHECKED_IN` → `CHECKED_OUT`.
   - Invoices must transition: `UNPAID` → `PAID` (or `CANCELLED`).

---

## 3. Security & Verification Guarantees

1. **Email Verification ("Yes, It's Me")**:
   - Verification tokens must be cryptographically secure and single-use.
   - After a successful verification call to `/api/auth/verify-registration-token/`, the token must be immediately invalidated.
   - Mismatched, expired (> 24 hours), or already-used tokens must return `400 Bad Request` with:
     `"This verification link is invalid or has expired. Please request a new verification email."`
2. **Two-Factor Login**:
   - Admin sign-in with Gmail triggers an approval flow. The backend verifies device/session context before granting JWT access tokens.
3. **Role Isolation**:
   - Customers must never be permitted to read or mutate other customers' records.
   - Customer users cannot access staff routes (`/staff`, `/medical`, `/reports`, `/services`).

---

## 4. Mandatory Living Documentation Synchronization

Whenever you implement, modify, or refactor any code in this repository:
1. **You must activate the `tech_writer` skill** to audit and synchronize all affected documentation in `docs/`:
   - Schema / Domain changes → [`docs/ARCHITECTURE.md`](file:///c:/Users/harit/OneDrive/Desktop/petcare/docs/ARCHITECTURE.md)
   - API endpoints / parameters / status codes → [`docs/API_REGISTRY.md`](file:///c:/Users/harit/OneDrive/Desktop/petcare/docs/API_REGISTRY.md)
   - UI components / props / styling → [`docs/COMPONENT_LIBRARY.md`](file:///c:/Users/harit/OneDrive/Desktop/petcare/docs/COMPONENT_LIBRARY.md)
   - Operational steps / configurations / env vars → [`docs/OPERATIONS.md`](file:///c:/Users/harit/OneDrive/Desktop/petcare/docs/OPERATIONS.md)
   - Bug fixes / regressions / postmortems → [`docs/INCIDENT_REGISTRY.md`](file:///c:/Users/harit/OneDrive/Desktop/petcare/docs/INCIDENT_REGISTRY.md)
   - Features / releases / fixes → [`docs/CHANGELOG.md`](file:///c:/Users/harit/OneDrive/Desktop/petcare/docs/CHANGELOG.md)
2. **Never conclude a task with stale documentation.** Documentation integrity is as critical as code correctness.

---

## 5. Automated Verification Before Completion

Before marking any task as complete:
1. Run backend unit & flow tests:
   ```powershell
   python -m unittest scratch/test_secure_email_verification.py
   python backend/live_check.py
   ```
2. Run frontend compilation check:
   ```powershell
   cd frontend
   npm run build
   ```
3. Verify that dev servers are operational without unhandled exceptions or console errors.
