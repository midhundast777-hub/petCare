# Changelog

All notable changes to the **Pet Care CRM & Sanctuary Management System** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.5.0] - 2026-09-25

### Added
* **Secure Single-Use Email Verification System for User Registration:**
  * Implemented the end-to-end 10-step secure registration & email verification workflow.
  * Backend generates a cryptographically secure random token (`secrets.token_urlsafe(48)` = 64 characters) with single-use enforcement (`is_used=False`) and 30-minute expiration window.
  * Sends verification email to the exact address provided with subject *"Verify your email address"* and body containing *"Welcome! Please verify your email address to activate your account."*, prominent **[ YES, IT'S ME ]** button linking to the backend verification URL, and 30-minute expiry warning.
  * Created `frontend/src/pages/VerifyEmail.jsx` and registered `/verify-email` route in `frontend/src/App.jsx`.
  * Automated test suite `scratch/test_secure_email_verification.py` validating all 10 requirements and security guarantees.

### Changed
* **Frontend `Register.jsx` Workflow Refactor:**
  * Streamlined customer registration form: User enters contact details and credentials and submits account creation directly.
  * Transitions seamlessly to a dedicated "Verification Email Sent" screen with email badge, 30-minute expiry notice, and "Resend verification email" action with a 60-second cooldown timer.
* **Backend Verification Endpoint (`VerifyEmailView`):**
  * Validates token existence, expiration, single-use state, and matching user email.
  * Marks user `is_email_verified=True` and invalidates token (`is_used=True`).
  * Returns exact required success message: *"Email verified successfully. You can now continue using your account."*
  * On invalid, expired, or re-used tokens returns HTTP 400 with exact required error: *"This verification link is invalid or has expired. Please request a new verification email."* with inline resend form.

### Security
* Guaranteed single-use verification links: tokens are immediately invalidated upon activation; re-use attempts are strictly rejected.
* Prevented user email enumeration: `/api/auth/resend-verification/` returns uniform responses for both existing and non-existent emails.
* Enforced 60-second rate limiting on verification email resend requests (`HTTP 429 Too Many Requests`).
* Prohibited implicit email verification on read/open: activation strictly requires clicking "Yes, It's Me" and successful backend token validation.
* Blocked unverified customer sign-ins with `HTTP 403 Forbidden` and `requires_email_verification: true`.

---

## [1.4.0] - 2026-09-25

### Added
* **Pet Boarding Digital Diary ("When They Came & When They Leaves"):**
  * Built complete digital diary system for pets receiving boarding sanctuary services, tracking their journey from arrival intake to daily stay activities and departure farewell.
  * Enhanced `DailyCareLog` model (`backend/boarding/models.py`) with:
    * Lifecycle `Stage` choices: `ARRIVAL` ("When Pet Came"), `DAILY` ("Daily Stay Activity"), and `DEPARTURE` ("When Pet Leaves").
    * Activity types: `ARRIVAL`, `DEPARTURE`, `FEEDING`, `EXERCISE`, `WALK`, `MEDICATION`, `GROOMING`, `NAP`, `POTTY`, `BEHAVIOR`, `HEALTH_CHECK`, and `PHOTO`.
    * Mood indicators: `HAPPY`, `PLAYFUL`, `CALM`, `AFFECTIONATE`, `SHY`, `ANXIOUS`, and `SLEEPY`.
    * Metadata fields: `activity_title`, `photo`, `activity_time`, `weight`, `belongings_notes`, `health_notes`, and `dietary_notes`.
  * Applied non-breaking database migration `0006_alter_dailycarelog_options_and_more.py`.
* **Automated Arrival & Departure Diary Stamp:**
  * Updated `BoardingChecklistView.patch` to automatically create an `ARRIVAL` diary entry when digital check-in is completed (stamping intake weight, belongings verified, and health notes).
  * Automatically creates a `DEPARTURE` diary entry when digital check-out is completed (stamping exit condition, belongings returned confirmation, and farewell notes).
* **Interactive Frontend `DigitalDiaryModal` Component:**
  * Created `frontend/src/components/DigitalDiaryModal.jsx` featuring:
    * Filter tabs: Complete Journey, When They Came (Arrival), Daily Stay Activities, When They Leaves (Departure).
    * Staff recording form with mood selectors, category icons, file image upload, and belongings tracking.
    * Visual vertical timeline with specialized intake/departure cards and photo zoom.
    * Browser-printable veterinary Stay Report Card & Certificate of Stay for pet parents.
* **Seamless Multi-Page Integration:**
  * Added **"📖 Digital Diary"** action button to each booking row and modal in [`BoardingList.jsx`](file:///c:/Users/harit/OneDrive/Desktop/petcare/frontend/src/pages/Boarding/BoardingList.jsx).
  * Added Digital Diary viewer to active boarding cards on [`Dashboard.jsx`](file:///c:/Users/harit/OneDrive/Desktop/petcare/frontend/src/pages/Dashboard.jsx) (both Staff & Customer portals).
  * Added "View Pet Stay Diary" trigger to booking cards on [`Profile.jsx`](file:///c:/Users/harit/OneDrive/Desktop/petcare/frontend/src/pages/Profile.jsx).
  * Added Boarding Stays & Digital Diary section to [`PetDetail.jsx`](file:///c:/Users/harit/OneDrive/Desktop/petcare/frontend/src/pages/Pets/PetDetail.jsx).
* **Pet Boarding Diary API Endpoints:**
  * Added `/api/boarding/bookings/<id>/care-logs/` (and `/diary/`) with stage and ordering query filters.
  * Added `/api/boarding/care-logs/<id>/` (and `/diary/<id>/`) with staff/admin CRUD permissions.
  * Added `/api/boarding/pets/<pet_id>/diary/` for lifetime stay history across past visits.

---

## [1.3.0] - 2026-09-25


### Changed
* **Admin Dashboard Metrics Filtered to Active Service Clients Only:**
  * Updated `DashboardSummaryView` (`backend/reports/views.py`) so `total_customers`, `total_pets`, and `new_customers_this_month` strictly count only customers and pets who take pet care services (appointments, boarding bookings, or invoices).
  * Casual visitors who merely register, log in, or create an account for their pet without taking services are now excluded from the Admin Dashboard.
  * Updated `DashboardChartsView` so monthly customer growth strictly reflects active service clients.
  * Updated the 3rd KPI card on [`Dashboard.jsx`](file:///c:/Users/harit/OneDrive/Desktop/petcare/frontend/src/pages/Dashboard.jsx) to **"Active Service Clients & Pets"**.

### Added
* **"Clients Receiving Pet Services" Directory on Admin Dashboard:**
  * Added dedicated tab view on the Admin Dashboard displaying clients with active/past pet care services.
  * Displays client name, contact info, serviced pets, latest service booked, total service count, and direct booking links.
  * Added client search filter by name, phone, email, pet name, or service category.
* **Service Filtering Support on API Endpoints:**
  * Added `has_services=true` query parameter support to [`/api/customers/`](file:///c:/Users/harit/OneDrive/Desktop/petcare/backend/customers/views.py) and [`/api/pets/`](file:///c:/Users/harit/OneDrive/Desktop/petcare/backend/pets/views.py).
  * Added "Filter: Has Services" toggle button on [`CustomerList.jsx`](file:///c:/Users/harit/OneDrive/Desktop/petcare/frontend/src/pages/Customers/CustomerList.jsx).

---

## [1.2.0] - 2026-09-25

### Added
* **Registration Email Verification Code Flow:**
  * Dispatches a 6-digit OTP code to the customer's entered email during registration to verify ownership.
  * Added `send_registration_code_email` in `users/views.py` utilizing `EmailMultiAlternatives` with HTML and plain-text fallback.
  * Added inline 6-digit verification code entry box with a 60-second resend cooldown timer on [`Register.jsx`](file:///c:/Users/harit/OneDrive/Desktop/petcare/frontend/src/pages/Register.jsx).
  * Added green "Ownership Confirmed" badge and automatic verification reset if the customer modifies the email input.
* **Backend Registration Enforcement:**
  * Updated `RegisterSerializer.validate_email` in [`serializers.py`](file:///c:/Users/harit/OneDrive/Desktop/petcare/backend/users/serializers.py) to block account creation unless a verified `VerificationCode(is_verified=True)` record exists in the database within a 2-hour window.
* **Token-Based Verification Endpoints:**
  * Added `EmailVerificationToken` model with cryptographically secure 48-byte tokens (`secrets.token_urlsafe(48)`), 30-minute expiration, and single-use invalidation.
  * Added `/api/auth/verify-email/` and `/api/auth/resend-verification/` with account enumeration prevention.

### Fixed
* Fixed fatal `ReferenceError: useEffect is not defined` and `ReferenceError: authService is not defined` in [`Register.jsx`](file:///c:/Users/harit/OneDrive/Desktop/petcare/frontend/src/pages/Register.jsx) that previously crashed the registration page on mount.
* Fixed duplicate closing `</div>` tag in [`Register.jsx`](file:///c:/Users/harit/OneDrive/Desktop/petcare/frontend/src/pages/Register.jsx).

### Security
* Enforced rate-limiting (60-second cooldown) on all verification email dispatch requests to prevent inbox flooding.
* Prevented account enumeration on verification resend endpoints by returning uniform responses.

---

## [1.1.0] - 2026-09-23

### Added
* **2-Factor Sign-In Confirmation ("Yes, It's Me"):**
  * Dispatches an interactive confirmation email to the user's registered email address upon login credential validation.
  * Added `LoginVerification` model with 15-minute expiration and single-use status transitions (`PENDING`, `APPROVED`, `EXPIRED`).
  * Implemented browser desktop chime audio notification using Web Audio API on login dispatch.
* **Phone Number 10-Digit Validation:**
  * Added `validate_10_digit_phone` across all serializers and frontend inputs with US format masking (`(555) 012-3456`).

### Changed
* **Staff Access Control Refinement:**
  * Removed Staff Management page link from the Staff dashboard and navigation layout.
  * Enforced `IsAdminUserRole` permission on `UserListView` and `UserDetailView` to restrict staff account operations strictly to Administrators.

---

## [1.0.0] - 2026-09-20

### Added
* Initial commercial release of **Pet Care CRM & Sanctuary Management System**.
* Modular Django backend with 10 core apps: `users`, `customers`, `pets`, `appointments`, `boarding`, `services`, `vaccinations`, `medical`, `billing`, `notifications`, `reports`.
* Role-based SimpleJWT authentication (`ADMIN`, `STAFF`, `CUSTOMER`).
* React 18 + Vite frontend with Tailwind CSS styling and Recharts analytics.
* Digital Boarding check-in & check-out checklists and daily care logs.
* Multi-service appointment scheduling with automated staff double-booking conflict prevention.
* Printable browser invoice layout (`PrintableInvoice.jsx`).
* Customer 360 timeline with CRM interaction logs.
