# Pet Care CRM — Incident & Postmortem Registry

This document records operational incidents, root-cause analyses (RCA), and preventative measures established for the Pet Care CRM system.

---

## Incident Severity Definitions

* **P1 (Critical):** Core service unavailable (e.g. login broken, database down, data corruption).
* **P2 (High):** Major workflow failure (e.g. registration broken, payments failing, booking blocked).
* **P3 (Medium):** Subsystem degraded or UI glitch with available workaround.
* **P4 (Low):** Minor cosmetic issue or isolated testing anomaly.

---

## Log of Incidents

### [INC-001] Missing Runtime Imports Crashing Registration Page
* **Date:** 2026-09-25
* **Severity:** P2 (High)
* **Status:** Resolved
* **Affected Service:** Frontend Client (`http://localhost:5173/register`)
* **Symptom:** Visiting `/register` resulted in a blank screen and browser console error: `Uncaught ReferenceError: useEffect is not defined`.
* **Root Cause:** In [`Register.jsx`](file:///c:/Users/harit/OneDrive/Desktop/petcare/frontend/src/pages/Register.jsx), `useEffect` was introduced for the 60-second verification countdown timer, but was not imported from `'react'`. Additionally, `authService` was referenced without being imported from `../services/authService`. Standard Rollup/Vite bundling did not flag undeclared globals as compile-time errors in dev mode.
* **Resolution:** 
  1. Updated import declaration in [`Register.jsx`](file:///c:/Users/harit/OneDrive/Desktop/petcare/frontend/src/pages/Register.jsx#L1): `import React, { useState, useEffect } from 'react';`.
  2. Imported `authService` from `../services/authService`.
  3. Ran `npm run build` to verify clean module transformation.
* **Prevention / Runbook:**
  * Always verify that all React hooks and utility modules are imported explicitly before testing changes.
  * Execute `npm run build` after editing frontend components to ensure compilation safety.

---

### [INC-002] Playwright Browser Driver Remote 404
* **Date:** 2026-09-25
* **Severity:** P3 (Medium)
* **Status:** Mitigated / Standard Workaround Active
* **Affected Service:** Automated Browser Subagent testing
* **Symptom:** Browser subagent could not launch local Chromium context, failing with:
  `failed to install playwright: could not install driver: got non 200 status code: 404 from https://playwright.azureedge.net/builds/driver/playwright-1.57.0-win32_x64.zip`.
* **Root Cause:** External remote CDN artifact for Playwright version 1.57.0 win32_x64 was unavailable.
* **Resolution:** Developed comprehensive automated API test scripts using Python's standard library (`urllib.request` and `json`) combined with Django ORM model verification, providing faster and deterministic end-to-end verification without external browser dependencies.
* **Prevention / Runbook:**
  * When automated browser subagent tools encounter CDN failure, rely on programmatic HTTP integration scripts to test full request/response lifecycles.

---

### [INC-003] Staff Dashboard Exposing Staff Account Management Interface
* **Date:** 2026-09-22
* **Severity:** P3 (Medium)
* **Status:** Resolved
* **Affected Service:** Frontend Navigation & Staff Role UI
* **Symptom:** Staff members could see the "Staff Management" entry in their navigation bar and dashboard actions.
* **Root Cause:** In the frontend sidebar and routing definitions, the Staff Management component was not strictly protected by the `isAdmin` check, allowing `STAFF` role users to see the administrative interface.
* **Resolution:**
  1. Removed Staff Management link from the staff navigation layout.
  2. Enforced `IsAdminUserRole` permission in DRF `UserListView` and `UserDetailView` so unauthorized creation or deletion requests return HTTP 403 Forbidden.
* **Prevention / Runbook:**
  * Always guard administrative UI components with both frontend conditional checks (`isAdmin`) and backend DRF permission classes (`IsAdminUserRole`).

---

### [INC-004] SQLite Unique Constraint Failure in Repeat Automated Test Scripts
* **Date:** 2026-09-25
* **Severity:** P4 (Low)
* **Status:** Resolved
* **Affected Service:** Developer Test Harness (`scratch/test_secure_email_verification.py`)
* **Symptom:** Re-running verification test scripts failed with `sqlite3.IntegrityError: UNIQUE constraint failed: users_emailverificationtoken.token`.
* **Root Cause:** A hardcoded token string was used in the test script for the expired token scenario. When the test was run multiple times, the static token collided with the existing unique index.
* **Resolution:** Updated test harnesses to use cryptographically dynamic tokens (`secrets.token_urlsafe(32)`) and incorporated clean teardown blocks (`User.objects.filter(...).delete()`).
* **Prevention / Runbook:**
  * Always generate random tokens and IDs in test harnesses to ensure idempotency.
