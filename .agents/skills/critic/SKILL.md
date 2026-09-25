---
name: critic
description: >-
  Critiques Pet Care CRM user experience, interface design, layout responsiveness, accessibility, and error handling flows.
---

# Critic Skill - UX/UI and Usability Critique

The `critic` skill evaluates the Pet Care CRM from the perspective of staff operators, veterinary clinicians, and pet owners. Its mission is to eliminate user friction, enhance aesthetic polish, ensure mobile responsiveness, and guarantee crystal-clear error handling.

---

## When to Activate This Skill
- After modifying or introducing UI pages, modals, or user interaction flows.
- When reviewing registration, login, boarding intake, or checkout user journeys.
- To verify compliance with visual standards, micro-interactions, and accessibility.

---

## Evaluation Criteria for Pet Care CRM

### 1. Aesthetic Polish & Design Tokens
- **Color Harmony**: Does the interface strictly use the Pet Care CRM palette?
  - Forest Teal (`brand-600` / `#0d9488`) for primary CTAs and active states.
  - Deep Slate (`slate-900`) for headers, avoiding harsh pure `#000000`.
  - Alert accents used sparingly: Emerald (`#10b981`) for completed tasks/paid invoices, Amber (`#f59e0b`) for pending vaccines, Rose (`#f43f5e`) for medical warnings.
- **Card Surfaces & Elevation**: Are cards structured with `rounded-2xl`, subtle borders (`border-slate-200/80`), and smooth hover micro-interactions (`hover:shadow-md transition-shadow`)?
- **Iconography**: Are icons from Lucide React contextually appropriate (e.g., `Dog` for pet profiles, `Syringe` for vaccines, `Stethoscope` for medical records, `Receipt` for invoices)?

### 2. User Journey Usability & Friction Points
- **Email Verification Journey**:
  - Does the registration screen immediately guide the user to check their email or view the push notification preview?
  - Is there a prominent, visible 60-second countdown timer before permitting OTP resends to avoid spamming the backend?
  - Does the verification modal clearly explain both Email and Phone fallback options?
  - Is the "Yes, It's Me" action button evident in the simulated or live email?
- **Boarding Check-In & Check-Out Workflow**:
  - In `ChecklistModal`, are required steps logically grouped (Vaccines -> Health Check -> Weight -> Belongings -> Instructions)?
  - Is room selection intuitive, and does it clearly show available vs occupied suites?
  - During checkout, is there a clear visual summary of unpaid charges before discharging the pet?
- **Printable Invoices**:
  - Does `PrintableInvoice` conceal navigation buttons and headers when `window.print()` triggers (`.no-print`)?
  - Are invoice numbers, tax breakdowns, and veterinary clinic address formatting clean and professional?

### 3. Mobile Responsiveness & Layout Adaptability
- **Sidebar & Navigation**:
  - Does the sidebar collapse into an off-canvas drawer on mobile (`sm` and `md` viewports)?
  - Is the hamburger toggle easily reachable with thumb gestures?
  - Do notification badges overlay properly without shifting layout elements?
- **Data Tables**:
  - Does `DataTable` provide horizontal scroll wrapping or column prioritization on screens `< 768px`?
  - Are search inputs and action buttons stacked appropriately on small devices?

### 4. Error State & Feedback Clarity
- **Non-Technical Language**: Are error messages helpful and actionable?
  - Bad: `Error 400: validation failed on field email_verification_token`
  - Good: `"This verification link is invalid or has expired. Please request a new verification email."`
- **Toast Feedback**: Every mutation (create, update, delete, verify) must dispatch an informative toast via `useToast()`.

---

## Critique Deliverables

Produce a structured markdown evaluation containing:
1. **Experience Scorecard**: Rating (1-10) for Visual Aesthetics, Usability, Accessibility, and Responsiveness.
2. **Identified Friction Points**:
   - Issue description with user perspective context.
   - Screen / Component with file link (e.g., [`BoardingModal.jsx`](file:///c:/Users/harit/OneDrive/Desktop/petcare/frontend/src/pages/Boarding/BoardingModal.jsx)).
   - Suggested visual or layout adjustment.
3. **Recommended React/CSS Adjustments**: Code snippets demonstrating improved markup or styling.
