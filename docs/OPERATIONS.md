# Pet Care CRM Operations & Runbook

## Overview

This guide provides engineering and operational procedures for provisioning, running, testing, maintaining, and deploying the Pet Care CRM system.

The stack comprises:
- **Backend**: Python 3.12, Django 5.x, Django REST Framework, SimpleJWT, SQLite (Dev) / PostgreSQL (Prod)
- **Frontend**: React 19, Vite 6, Tailwind CSS, Lucide React icons
- **Email Service**: Dual-mode (Django Console backend for local offline dev, Gmail SMTP for live multi-factor & registration verification)

---

## 1. Local Development Quickstart

### Prerequisites
- **Python**: 3.10+ (Recommended 3.11 or 3.12)
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**

### Step-by-Step Provisioning

#### Step 1: Clone and Enter Repository
```powershell
cd c:\Users\harit\OneDrive\Desktop\petcare
```

#### Step 2: Backend Setup
```powershell
cd backend

# Create virtual environment (if not already present)
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Windows Command Prompt:
.\venv\Scripts\activate.bat
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run migrations to initialize SQLite database
python manage.py migrate

# Seed database with realistic Pet Care CRM demo fixtures
python manage.py seed_crm

# Start Django development server
python manage.py runserver 127.0.0.1:8000
```

#### Step 3: Frontend Setup (Separate Terminal)
```powershell
cd c:\Users\harit\OneDrive\Desktop\petcare\frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

The application is now accessible at:
- **Frontend Application**: `http://localhost:5173`
- **Backend API Root**: `http://127.0.0.1:8000/api/`
- **Django Admin**: `http://127.0.0.1:8000/admin/`

---

## 2. Seed Accounts & Default Credentials

The `python manage.py seed_crm` command generates a complete operational dataset:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Admin** | `midhundast07@gmail.com` | `Admin@123` | Full CRM access, staff management, financials, reports |
| **Staff** | `staff@petcare.com` | `Staff@123` | Bookings, check-in/out checklists, medical/feeding logs, pets |
| **Staff (Vet)** | `vet.alex@petcare.com` | `Vet@123` | Veterinary examinations, vaccinations, medical records |
| **Customer** | `customer.sarah@gmail.com` | `Customer@123` | Customer portal, pet profiles, booking requests, online payments |

---

## 3. Environment Configuration

Backend configuration is controlled by environment variables loaded in `backend/config/settings.py` via `os.getenv()`.

### Configuration Variables Reference

| Variable | Dev Default | Production Requirement | Purpose |
|---|---|---|---|
| `DEBUG` | `True` | `False` | Enables/disables debug tracebacks |
| `SECRET_KEY` | Development key in settings | Cryptographically random string | Django cryptographic signing |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Domain (e.g., `api.petcare.com`) | Host header validation |
| `CORS_ALLOWED_ORIGINS`| `http://localhost:5173` | Production frontend domain | Cross-Origin Resource Sharing |
| `FRONTEND_URL` | `http://localhost:5173` | Production frontend URL | Link generator for email verification buttons |
| `EMAIL_BACKEND` | `console.EmailBackend` | `smtp.EmailBackend` | Email delivery mechanism |
| `EMAIL_HOST` | `smtp.gmail.com` | SMTP relay server host | Outbound email server |
| `EMAIL_PORT` | `587` | `587` (TLS) or `465` (SSL) | SMTP port |
| `EMAIL_USE_TLS` | `True` | `True` | Enforces TLS encryption |
| `EMAIL_HOST_USER` | `""` | Dedicated SMTP sender account | Gmail or SMTP user account |
| `EMAIL_HOST_PASSWORD` | `""` | 16-character Google App Password | SMTP authentication secret |
| `DEFAULT_FROM_EMAIL`| `'PetCare Sanctuary <noreply@petcare.com>'` | Valid branded sender email | Header `From` in notification emails |

### Configuring Live Gmail Delivery
To send actual emails with "Yes, It's Me" verification buttons:
1. Enable 2-Step Verification on the designated Google Account.
2. Visit [Google App Passwords](https://myaccount.google.com/apppasswords).
3. Create an App Password with name `PetCare CRM`.
4. In `backend/.env`:
   ```ini
   EMAIL_HOST_USER=petcaresanctuary@gmail.com
   EMAIL_HOST_PASSWORD=abcd efgh ijkl mnop
   DEFAULT_FROM_EMAIL=PetCare Sanctuary <petcaresanctuary@gmail.com>
   ```
5. If `EMAIL_HOST_USER` and `EMAIL_HOST_PASSWORD` are not specified, Django automatically switches to `django.core.mail.backends.console.EmailBackend`, printing email HTML and OTP codes directly to the terminal stdout.

---

## 4. Database Operations & Maintenance

### Running Migrations
When schema changes are introduced in any Django app:
```powershell
# 1. Inspect unapplied migrations
python manage.py showmigrations

# 2. Generate migration scripts for modified models
python manage.py makemigrations

# 3. Apply schema updates safely
python manage.py migrate
```

### Full Database Reset (Development Only)
If demo state needs a pristine reset:
```powershell
cd backend
# Delete existing SQLite file
Remove-Item db.sqlite3 -Force

# Rebuild schema
python manage.py migrate

# Reseed demo fixtures
python manage.py seed_crm
```

### Database Backup (SQLite)
```powershell
# Create timestamped copy
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
Copy-Item "backend/db.sqlite3" "backend/backups/db_$timestamp.sqlite3"
```

---

## 5. Automated Verification & Health Checks

### 1. Backend API Live Smoke Check
Runs comprehensive automated verification against running server endpoints:
```powershell
python backend/live_check.py
```
Validates:
- Health root `/api/health/`
- Authentication endpoints and token generation
- Pet, customer, service, and boarding endpoints

### 2. Email Verification Flow Test
Validates the token-based "Yes, It's Me" registration pipeline:
```powershell
python -m unittest scratch/test_secure_email_verification.py
```
Checks:
- Token generation and uniqueness
- Token expiration enforcement (30 minutes)
- Single-use token invalidation
- Mismatched token rejection
- Verification completion flag updates on `User`

### 3. Frontend Production Build Check
Validates JSX compilation and type integrity without running dev server:
```powershell
cd frontend
npm run build
```

---

## 6. Incident Response & Troubleshooting Runbook

### Issue 1: "Verification link is invalid or expired"
- **Cause**: User clicked the email link after 30 minutes or attempted to use the link a second time.
- **Resolution**: Prompt user to click "Resend verification email" on the registration screen or verify directly via Admin dashboard (`/admin/users/user/`).

### Issue 2: "Port 8000 already in use"
- **Cause**: A background Django instance was left running.
- **Resolution**:
  ```powershell
  # Find PID occupying port 8000
  Get-NetTCPConnection -LocalPort 8000 | Select-Object OwningProcess
  # Terminate process
  Stop-Process -Id <PID> -Force
  ```

### Issue 3: "CORS error on frontend requests"
- **Cause**: Frontend origin not in `CORS_ALLOWED_ORIGINS` or `CORS_ALLOW_ALL_ORIGINS` was set to `False`.
- **Resolution**: Verify `CORS_ALLOW_ALL_ORIGINS = True` in `backend/config/settings.py` or specify the exact port in `.env`.

---

## 7. Production Deployment Checklist

Prior to hosting in staging or production:

1. [ ] Set `DEBUG = False` in `settings.py` or `.env`.
2. [ ] Generate and set an unpredictable 50-character `SECRET_KEY`.
3. [ ] Configure `ALLOWED_HOSTS` with the exact fully qualified domain name (FQDN).
4. [ ] Switch database engine from SQLite to PostgreSQL via `DATABASE_URL`.
5. [ ] Execute `python manage.py collectstatic --noinput` for static asset aggregation.
6. [ ] Configure Gunicorn WSGI workers (e.g., `gunicorn config.wsgi:application --workers 3 --bind 0.0.0.0:8000`).
7. [ ] Enforce SSL/TLS via reverse proxy (Nginx or Caddy) with automated Let's Encrypt certificates.
8. [ ] Enable Django security headers:
   - `SECURE_SSL_REDIRECT = True`
   - `SESSION_COOKIE_SECURE = True`
   - `CSRF_COOKIE_SECURE = True`
   - `SECURE_BROWSER_XSS_FILTER = True`
   - `SECURE_CONTENT_TYPE_NOSNIFF = True`
