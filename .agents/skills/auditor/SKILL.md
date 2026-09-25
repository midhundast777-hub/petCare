---
name: auditor
description: >-
  Audits the Pet Care CRM codebase for architectural compliance, dead code, missing serializer permissions, broken foreign keys, and frontend component integrity.
---

# Auditor Skill - Pet Care CRM Codebase Audit

The `auditor` skill inspects the entire Pet Care CRM project to ensure architectural hygiene, strict domain boundaries, and high code quality across both Django backend and React frontend.

---

## When to Activate This Skill
- Before merging or concluding significant feature additions or refactors.
- When unexplained bugs, data desynchronizations, or performance drops occur.
- When verifying whether newly added endpoints or components follow the repository standards outlined in [`.agents/AGENTS.md`](file:///c:/Users/harit/OneDrive/Desktop/petcare/.agents/AGENTS.md).

---

## Audit Procedures

### 1. Django Backend Audit (11 Domain Apps)
Run through each app (`users`, `customers`, `pets`, `appointments`, `boarding`, `services`, `vaccinations`, `medical`, `billing`, `notifications`, `reports`):

1. **Permissions & Security Scoping**:
   - Check every ViewSet and APIView: does it define `permission_classes`?
   - Verify that customer views filter by `user` or `customer`:
     ```python
     # Correct:
     def get_queryset(self):
         if self.request.user.role == User.Role.CUSTOMER:
             return Pet.objects.filter(owner__user=self.request.user)
         return Pet.objects.all()
     ```
   - Confirm staff-only operations (`/staff/`, `/medical/`, `/reports/`) explicitly enforce `IsAdminUser` or `IsStaffUser`.

2. **Serializer Field Hygiene**:
   - Flag any `fields = '__all__'`. Every serializer must declare explicit field tuples or lists.
   - Confirm passwords, verification tokens, and OTP codes are marked `write_only=True` or excluded from response payloads.

3. **Database & ORM Relationships**:
   - Check all `ForeignKey` definitions: do they have explicit `related_name`?
   - Check cascade behaviors: `on_delete=models.CASCADE` vs `on_delete=models.SET_NULL` or `models.PROTECT` (e.g. Invoices and Medical Records must never be silently cascaded on pet deletion).
   - Ensure `created_at` and `updated_at` timestamps exist on all core tables.

4. **Migration Consistency**:
   - Verify that all model fields match unapplied migrations using:
     ```powershell
     python manage.py showmigrations
     ```

---

### 2. React Frontend Audit (`frontend/src/`)

1. **Import & Hook Completeness**:
   - Check that all React hooks (`useState`, `useEffect`, `useMemo`, `useCallback`, `useRef`) are cleanly imported from `'react'`.
   - Ensure Lucide icon imports exist and match valid icon names.
   - Verify that API service calls are wrapped in `try ... catch` blocks with user-facing toasts (`useToast()`).

2. **Component Prop Alignment**:
   - Cross-reference component invocations against [`docs/COMPONENT_LIBRARY.md`](file:///c:/Users/harit/OneDrive/Desktop/petcare/docs/COMPONENT_LIBRARY.md).
   - Ensure `DataTable`, `Modal`, `ChecklistModal`, and `StatCard` receive valid required props.

3. **Dead Code & Unused Utilities**:
   - Scan for orphaned CSS classes, unused state variables, or deprecated test scripts.
   - Execute linter checks:
     ```powershell
     cd frontend
     npx oxlint
     ```

---

### 3. CRM Domain State Machine Verification

Audit that critical business logic flows are never bypassed:
- **Boarding Workflow**: Pets cannot transition to `CHECKED_OUT` unless `CHECKED_IN` was completed and payment was verified.
- **Email Verification**: User `is_email_verified` cannot be toggled to `True` without consuming and invalidating the token.
- **Invoice Financials**: Invoice total must match line items sum + tax calculation.

---

## Output Deliverables

When running an audit, produce a structured markdown report containing:
1. **Summary Table**: Total files audited, issues identified by severity (High, Medium, Low).
2. **Issue Details**:
   - Description and risk.
   - File location with clickable link (e.g., [`views.py:L45-L50`](file:///c:/Users/harit/OneDrive/Desktop/petcare/backend/users/views.py#L45-L50)).
   - Exact remediation code.
3. **Follow-up Tasks**: Action items for the developer or other specialized skills (`qa_lead`, `security_auditor`, `tech_writer`).
