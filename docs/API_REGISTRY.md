# Pet Care CRM — API Registry

This document serves as the living reference for all REST endpoints exposed by the Django REST Framework backend.

**Base URL:** `http://127.0.0.1:8000/api/`  
**Standard Authorization Header:** `Authorization: Bearer <access_token>`

---

## 1. Authentication & User Management (`/api/auth/`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login/` | None | Authenticate with email/phone & password. Dispatches 2FA confirmation email. |
| `GET` | `/api/auth/login-status/?session_token=<tok>` | None | Polls status of 2FA sign-in approval. |
| `POST` | `/api/auth/approve-login/` | None | Approves 2FA sign-in when "Yes, It's Me" is clicked, returning JWT tokens. |
| `POST` | `/api/auth/resend-login-email/` | None | Re-dispatches 2FA sign-in email. |
| `POST` | `/api/auth/refresh/` | None | Refreshes expired access token using refresh token. |
| `POST` | `/api/auth/register/` | None | Register new customer (`first_name`, `last_name`, `email`, `phone`, `password`, `password_confirm`). Account created with `is_email_verified=False`. Generates 48-byte URL-safe `EmailVerificationToken` (30-min expiry) and dispatches verification email with "Yes, It's Me" button. |
| `GET` / `POST` | `/api/auth/verify-email/?token=<tok>` | None | Backend email verification handler. Validates single-use token, checks expiry (30m), validates user/email, marks email verified, invalidates token. Renders HTML or returns JSON (`format=json`). Success: *"Email verified successfully. You can now continue using your account."* Failure: *"This verification link is invalid or has expired. Please request a new verification email."* |
| `POST` | `/api/auth/resend-verification/` | None | Resends "Yes, It's Me" verification email. Rate-limited to 60s intervals (`HTTP 429`). Returns uniform message preventing account enumeration: *"If an account exists with this email, a verification link has been sent."* |
| `GET` | `/api/auth/check-user/?email=&phone=` | None | Quick availability check for email or phone during registration. |
| `GET` | `/api/auth/profile/` | Authenticated | Retrieve current user's profile. |
| `PATCH`| `/api/auth/profile/` | Authenticated | Update user profile details. |
| `POST` | `/api/auth/upload-avatar/` | Authenticated | Upload user profile avatar (multipart/form-data). |
| `GET` | `/api/auth/users/?role=&search=` | Admin/Staff | List team members or users with role and search filters. |
| `POST` | `/api/auth/users/` | Admin | Admin-only creation of staff accounts. |
| `GET` | `/api/auth/users/<id>/` | Admin/Staff | Retrieve specific user account. |
| `PATCH`| `/api/auth/users/<id>/` | Admin | Admin-only account modification. |
| `DELETE`| `/api/auth/users/<id>/` | Admin | Admin-only account deletion (cannot delete own account). |

---

## 2. Customers (`/api/customers/`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/customers/?search=&status=&has_services=` | Staff/Admin | List customers with search, status, and `has_services=true` filter (only clients who have booked services). |
| `POST` | `/api/customers/` | Staff/Admin | Create new customer profile. |
| `GET` | `/api/customers/<id>/` | Authenticated | Customer details (owner or staff/admin). |
| `PATCH`| `/api/customers/<id>/` | Staff/Admin | Update customer profile attributes. |
| `DELETE`| `/api/customers/<id>/` | Admin | Delete customer record. |
| `GET` | `/api/customers/<id>/notes/` | Staff/Admin | List CRM interaction history and staff notes for customer. |
| `POST` | `/api/customers/<id>/notes/create/` | Staff/Admin | Log interaction note (Call, Email, In-Person visit, General). |

---

## 3. Pets (`/api/pets/`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/pets/?owner=&species=&status=&has_services=&search=` | Authenticated | List pets. Customers see only their own pets; Staff/Admin see all. `has_services=true` filters pets with booked services. |
| `POST` | `/api/pets/` | Authenticated | Register a new pet. Automatically links to customer profile. |
| `GET` | `/api/pets/<id>/` | Authenticated | Pet detail with full health attributes, diets, and emergency contacts. |
| `PATCH`| `/api/pets/<id>/` | Authenticated | Update pet profile attributes. |
| `DELETE`| `/api/pets/<id>/` | Authenticated | Remove pet record. |
| `POST` | `/api/pets/<id>/upload-image/` | Authenticated | Upload pet photo to media storage. |

---

## 4. Services (`/api/services/`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/services/` | None/Auth | List all active sanctuary & clinic services. |
| `POST` | `/api/services/` | Admin | Create service in catalog with pricing and duration. |
| `GET` | `/api/services/<id>/` | None/Auth | Retrieve service specifications. |
| `PATCH`| `/api/services/<id>/` | Admin | Modify pricing, duration, or service description. |
| `DELETE`| `/api/services/<id>/` | Admin | Archive or remove service. |

---

## 5. Appointments (`/api/appointments/`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/appointments/?date=&status=&pet=` | Authenticated | List appointments. Filterable by date and status. |
| `POST` | `/api/appointments/` | Authenticated | Book appointment. Enforces staff conflict prevention engine. |
| `GET` | `/api/appointments/<id>/` | Authenticated | Appointment detail with pet and assigned staff data. |
| `PATCH`| `/api/appointments/<id>/` | Authenticated | Modify appointment timing or service. |
| `PATCH`| `/api/appointments/<id>/status/` | Staff/Admin | Transition status (`CONFIRMED`, `COMPLETED`, `CANCELLED`). |

---

## 6. Boarding & Sanctuary Kennels (`/api/boarding/`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/boarding/rooms/` | Authenticated | List boarding rooms, suite types, and capacity status. |
| `POST` | `/api/boarding/rooms/` | Admin | Add room/kennel (Standard, Premium, Luxury, Playpen). |
| `GET` | `/api/boarding/bookings/?status=&pet=` | Authenticated | List boarding reservations. |
| `POST` | `/api/boarding/bookings/` | Authenticated | Book a boarding stay with check-in/out date range. |
| `GET` | `/api/boarding/bookings/<id>/` | Authenticated | Boarding stay detail with room and pet info. |
| `PATCH`| `/api/boarding/bookings/<id>/` | Staff/Admin | Modify booking details or dates. |
| `GET` | `/api/boarding/bookings/<id>/checklist/` | Staff/Admin | Retrieve check-in or check-out digital checklist. |
| `POST` | `/api/boarding/bookings/<id>/checklist/` | Staff/Admin | Save check-in protocol (weight, condition, belongings). |
| `GET` | `/api/boarding/bookings/<id>/care-logs/` (or `/diary/`) | Authenticated | List digital diary timeline for stay. Supports `?stage=ARRIVAL\|DAILY\|DEPARTURE` and `?ordering=`. Customers scoped to own pets. |
| `POST` | `/api/boarding/bookings/<id>/care-logs/` (or `/diary/`) | Staff/Admin | Record diary activity with `stage`, `care_type`, `activity_title`, `mood`, `notes`, `photo`, `weight`, `belongings_notes`. |
| `GET` | `/api/boarding/care-logs/<id>/` (or `/diary/<id>/`) | Authenticated | Retrieve specific diary activity detail. |
| `PATCH` | `/api/boarding/care-logs/<id>/` (or `/diary/<id>/`) | Staff/Admin | Modify an existing diary activity entry. |
| `DELETE` | `/api/boarding/care-logs/<id>/` (or `/diary/<id>/`) | Staff/Admin | Delete a diary activity entry. |
| `GET` | `/api/boarding/pets/<pet_id>/diary/` | Authenticated | Pet lifetime boarding diary across all stays. Scoped to pet owner or staff/admin. |


---

## 7. Vaccinations (`/api/vaccinations/`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/vaccinations/?pet=` | Authenticated | List vaccination history with calculated status. |
| `POST` | `/api/vaccinations/` | Staff/Admin | Record administered vaccine (batch, expiry date, vet). |
| `GET` | `/api/vaccinations/<id>/` | Authenticated | Vaccination record detail. |
| `PATCH`| `/api/vaccinations/<id>/` | Staff/Admin | Update vaccine batch or expiration date. |
| `DELETE`| `/api/vaccinations/<id>/` | Staff/Admin | Remove record. |

---

## 8. Medical & Medications (`/api/medical/`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/medical/visits/?pet=` | Authenticated | List veterinary clinical visit records. |
| `POST` | `/api/medical/visits/` | Staff/Admin | Record veterinary diagnosis, treatment, and vitals. |
| `GET` | `/api/medical/medications/?pet=` | Authenticated | List active prescription medications and dosage schedules. |
| `POST` | `/api/medical/medications/` | Staff/Admin | Create medication schedule (dosage, frequency, instructions). |
| `PATCH`| `/api/medical/medications/<id>/` | Staff/Admin | Update medication administration status. |

---

## 9. Billing & Invoices (`/api/billing/`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/billing/invoices/?status=&customer=` | Authenticated | List invoices. Customers see only their own invoices. |
| `POST` | `/api/billing/invoices/` | Staff/Admin | Generate invoice with dynamic line items, taxes, discounts. |
| `GET` | `/api/billing/invoices/<id>/` | Authenticated | Detailed invoice view. |
| `PATCH`| `/api/billing/invoices/<id>/` | Staff/Admin | Modify invoice status or line items. |
| `DELETE`| `/api/billing/invoices/<id>/` | Admin | Delete invoice record (Admin only). |
| `POST` | `/api/billing/invoices/<id>/payments/` | Staff/Admin | Record payment against invoice (`PAID`, `PARTIAL`). |

---

## 10. Notifications (`/api/notifications/`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications/` | Authenticated | List user's in-app alerts and notifications. |
| `PATCH`| `/api/notifications/<id>/` | Authenticated | Mark a single notification as read. |
| `POST` | `/api/notifications/mark-all-read/` | Authenticated | Mark all user notifications as read. |

---

## 11. Reports & Business Intelligence (`/api/reports/`)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/summary/` | Staff/Admin | Executive KPI summary. Strictly counts/lists only customers & pets with booked services (`service_clients`, `service_customers_count`, `service_pets_count`); casual visitor accounts are excluded. |
| `GET` | `/api/reports/charts/` | Staff/Admin | Aggregate dataset for monthly revenue, appointment volume, service popularity, kennel occupancy, and serviced customer growth. |
