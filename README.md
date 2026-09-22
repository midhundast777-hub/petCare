# Pet Care CRM (Customer Relationship Management System)

A commercial-grade, full-stack **Pet Care CRM** web application built with **Django REST Framework** (Backend) and **React 18 + Vite + Tailwind CSS** (Frontend). Designed for veterinary clinics, boarding sanctuaries, pet grooming salons, and daycare facilities.

---

## Architecture & Features

### Backend (Django REST Framework)
- **Modular Django Architecture**: 10 distinct apps (`users`, `customers`, `pets`, `appointments`, `boarding`, `services`, `vaccinations`, `medical`, `billing`, `notifications`, `reports`).
- **Role-Based JWT Authentication**: Admin, Staff, and Customer roles with custom token serializers and permission enforcement.
- **Customer 360 & CRM Communication**: Customer directory, interaction timeline (Calls, Emails, In-Person visits, General notes), cumulative booking counters, and lifetime spend calculation.
- **Pet Directory & Health Profiles**: Comprehensive pet attributes, microchip tracking, dietary routines, personality traits, emergency hospital instructions, and species categorization.
- **Appointment Scheduling & Conflict Prevention**: Multi-service scheduling with start/end time validations and automated conflict prevention against double-booking staff members.
- **Pet Boarding & Digital Check-In / Check-Out**: Room/kennel occupancy management (Standard, Premium, Luxury, Daycare Playpens), interactive digital check-in protocols (health condition, weight, belongings, instructions) and check-out verification.
- **Daily Care Logs**: Real-time staff logs for feeding, medication administration, exercise/playtime, and health observations.
- **Vaccination Expiration Tracker**: Automatic calculation of valid, expiring soon (< 30 days), and expired statuses, with booking safety warnings.
- **Medical & Medication Management**: Veterinary diagnosis and treatment visit logs, prescription dosage tracking, and staff meal administration logs.
- **Billing & Invoice System**: Dynamic invoice generator with line items, tax rates, percentage discounts, printable layouts, and payment recording.
- **Notifications Engine**: Automated reminders for upcoming appointments, vaccine expirations, booking confirmations, and check-in alerts.
- **Business Intelligence Reports**: Analytical dashboard metrics and charts for monthly revenue, appointment distributions, service popularity, and kennel occupancy.

### Frontend (React + Vite + Tailwind CSS)
- **Public Landing Page (Pet Care Theme)**: High-converting, authentic sanctuary landing page with Deep Forest Green (`#1F3D36`), Sand Cream (`#FFF8EF`), Honey Amber (`#D9903D`), 24/7 hotline banner, continuous trust marquee, facilities showcase, photo gallery with lightbox, verified Google reviews, FAQ accordion, interactive WhatsApp enquiry builder (`9847012345`), and seamless CRM portal links.
- **Responsive Dashboard**: Executive KPI cards, real-time activity feeds, and visual analytics powered by Recharts.
- **Reusable Component System**: `Navbar`, `Sidebar`, `DataTable` with live search, column sorting, status filters, and pagination, `Modal`, `ChecklistModal`, `PrintableInvoice`, `StatCard`, and `LoadingSpinner`.
- **Axios API Client**: Centralized interceptors with automatic JWT token injection and 401 refresh token retry logic.
- **Printable Invoices**: Native browser print formatting (`window.print()`) for customer receipts.
- **Quick Demo Login**: One-click credential switcher on the login screen for testing Admin, Staff, and Customer user flows.


---

## Project Folder Structure

```text
petcare/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── src/
│   │   ├── components/       # Navbar, Sidebar, DataTable, StatCard, Modals, Checklists
│   │   ├── pages/            # Dashboard, Customers, Pets, Appointments, Boarding, etc.
│   │   ├── layouts/          # AppLayout
│   │   ├── services/         # Axios API client and modular endpoint handlers
│   │   ├── context/          # AuthContext, ToastContext
│   │   ├── hooks/            # useAuth
│   │   ├── App.jsx           # Role-based protected routes
│   │   ├── main.jsx          # Root entry point
│   │   └── index.css         # Tailwind directives and print styling
│   └── public/
│
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── config/               # Settings, root URLs, WSGI, ASGI
│   ├── users/                # Custom User model, JWT authentication, roles
│   ├── customers/            # Customer profile, history, CRM notes
│   ├── pets/                 # Pet directory, species, breed, medical tags
│   ├── appointments/         # Scheduling, staff conflict checks, calendar view
│   ├── boarding/             # Kennels, check-in/out checklists, daily care logs
│   ├── services/             # Service catalog, pricing, durations
│   ├── vaccinations/         # Vaccine records, expiry auto-calculation
│   ├── medical/              # Medical visits, medications tracker, feeding schedules
│   ├── billing/              # Invoices, line items, payment recording, print view
│   ├── notifications/        # Alerts, expiry reminders, appointment notices
│   └── reports/              # Analytics APIs: revenue, occupancy, popularity
│
└── README.md
```

---

## Demo Credentials

The database is pre-seeded with realistic data across all modules:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **Admin** | `midhundast07@gmail.com` | `Admin@123` | Full CRM & clinic access (All modules, reports, billing, settings) |
| **Staff** | `staff@petcare.com` | `Staff@123` | Daily Care, Boarding check-in/out, appointments, feeding, medications |
| **Customer** | `customer@petcare.com` | `Customer@123` | Pet Parent portal (My pets, bookings, vaccine history, invoices) |

*(One-click login buttons are also available directly on the login page)*

---

## Quick Start & Installation

### 1. Backend Setup (Django)

Open a terminal and navigate to `backend/`:

```bash
cd backend

# Create virtual environment (if not already created)
python -m venv venv

# Activate virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install Python requirements
pip install -r requirements.txt

# Run migrations
python manage.py makemigrations users customers pets services appointments boarding vaccinations medical billing notifications reports
python manage.py migrate

# Seed realistic demo data
python manage.py seed_crm

# Start the Django development server
python manage.py runserver 127.0.0.1:8000
```

The Django REST API will be running at `http://127.0.0.1:8000/`.

---

### 2. Frontend Setup (React + Vite)

Open a second terminal and navigate to `frontend/`:

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The React frontend will be running at `http://localhost:5173/`.

---

## REST API Endpoints Overview

| Endpoint | Methods | Description |
| :--- | :--- | :--- |
| `/api/auth/login/` | `POST` | Obtain JWT access and refresh tokens + user profile |
| `/api/auth/register/` | `POST` | Register a new user account |
| `/api/auth/refresh/` | `POST` | Refresh access token |
| `/api/auth/profile/` | `GET`, `PATCH` | Retrieve / update logged-in user profile |
| `/api/customers/` | `GET`, `POST` | List and create customers (searchable) |
| `/api/customers/{id}/` | `GET`, `PUT`, `DELETE` | Customer 360 profile details |
| `/api/customers/{id}/notes/` | `GET`, `POST` | CRM communication timeline & notes |
| `/api/pets/` | `GET`, `POST` | Pet directory (filtered by species, owner) |
| `/api/pets/{id}/` | `GET`, `PUT`, `DELETE` | Pet 360 health and care profile |
| `/api/services/` | `GET`, `POST`, `PUT`, `DELETE` | Service catalog & pricing |
| `/api/appointments/` | `GET`, `POST`, `PUT`, `DELETE` | Schedule appointments with conflict check |
| `/api/appointments/{id}/status/` | `PATCH` | Quick status transition (Checked-in, Completed, etc.) |
| `/api/boarding/rooms/` | `GET`, `POST`, `PUT` | Kennel room inventory & occupancy status |
| `/api/boarding/bookings/` | `GET`, `POST`, `PUT`, `DELETE`| Boarding stay bookings |
| `/api/boarding/bookings/{id}/checklist/` | `GET`, `PATCH` | Digital Check-in & Check-out protocol checklist |
| `/api/boarding/bookings/{id}/care-logs/` | `GET`, `POST` | Daily care activity logs (feeding, walk, meds) |
| `/api/vaccinations/` | `GET`, `POST`, `PUT`, `DELETE` | Immunization tracker with auto-calculated validity |
| `/api/vaccinations/check-pet/{id}/` | `GET` | Vaccination compliance verification before booking |
| `/api/medical/records/` | `GET`, `POST`, `DELETE` | Veterinary clinical visit records |
| `/api/medical/medications/` | `GET`, `POST`, `PUT` | Active prescription schedules |
| `/api/medical/medications/{id}/log/` | `POST` | Record dose administration |
| `/api/medical/feeding/` | `GET`, `POST`, `PUT` | Daily feeding routines |
| `/api/medical/feeding/{id}/log/` | `POST` | Record meal fed |
| `/api/billing/invoices/` | `GET`, `POST`, `PUT`, `DELETE` | Invoices with subtotal, tax, discount calc |
| `/api/billing/invoices/{id}/payments/` | `POST` | Record card/cash/UPI payment |
| `/api/notifications/` | `GET` | User notifications & alerts |
| `/api/reports/summary/` | `GET` | Dashboard executive KPIs |
| `/api/reports/charts/` | `GET` | Monthly revenue, appointment stats, service popularity |
| `/api/reports/detailed/` | `GET` | Date-filtered business reports |

---

## Verification & Testing

### Automated Backend Tests
Run the automated verification suite to validate all database queries, JWT authentication, role permission isolation, and endpoints:

```bash
cd backend
python test_api.py
```

### Live HTTP Verification
Verify that both servers are actively listening and communicating over the network:

```bash
cd backend
python live_check.py
```
