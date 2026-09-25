---
name: tech_writer
description: >-
  Maintains and synchronizes living documentation in docs/ whenever Pet Care CRM code, API endpoints, architecture models, UI components, operations, or behavior change.
---

# Tech Writer Skill - Living Documentation Synchronization

The `tech_writer` skill is the guardian of project knowledge and living documentation for the Pet Care CRM. Its mandatory directive is to prevent documentation drift by ensuring that every change in code, schema, API contracts, components, operations, or system behavior is immediately synchronized across the relevant files in [`docs/`](file:///c:/Users/harit/OneDrive/Desktop/petcare/docs/).

---

## The Golden Rule: No Code Change Without Doc Sync

> **CRITICAL DIRECTIVE**: A code modification, bug fix, feature addition, or configuration update is **INCOMPLETE** until all corresponding documentation in [`docs/`](file:///c:/Users/harit/OneDrive/Desktop/petcare/docs/) has been updated and verified.

---

## 1. Living Documentation Mapping Matrix

Whenever files in the repository are modified, inspect and update the corresponding documentation files according to this matrix:

| Code / Repo Modification | Affected Document | Action Required |
|---|---|---|
| **Django Models / Migrations / DB Relationships** | [`docs/ARCHITECTURE.md`](file:///c:/Users/harit/OneDrive/Desktop/petcare/docs/ARCHITECTURE.md) | Update Domain Models table, update field types, refresh Mermaid architecture or ER diagrams, update state machine definitions. |
| **API Endpoints / ViewSets / URLs / Serializers** | [`docs/API_REGISTRY.md`](file:///c:/Users/harit/OneDrive/Desktop/petcare/docs/API_REGISTRY.md) | Add or update endpoint rows, HTTP methods, RBAC role permissions, query parameters, request payload examples, and response status codes. |
| **React Components / Props / Modals / Tokens** | [`docs/COMPONENT_LIBRARY.md`](file:///c:/Users/harit/OneDrive/Desktop/petcare/docs/COMPONENT_LIBRARY.md) | Update component props tables, add code usage examples, update role visibility matrices, document new modals or design tokens. |
| **Bugs / Regressions / Critical Fixes** | [`docs/INCIDENT_REGISTRY.md`](file:///c:/Users/harit/OneDrive/Desktop/petcare/docs/INCIDENT_REGISTRY.md) | Document postmortem with new incident ID (`INC-00X`), severity (P1–P4), root cause, impact, resolution, and automated test prevention. |
| **Settings / Env Vars / CLI Commands / Runbooks** | [`docs/OPERATIONS.md`](file:///c:/Users/harit/OneDrive/Desktop/petcare/docs/OPERATIONS.md) | Update `.env` variables table, update provisioning or seed instructions, add troubleshooting runbooks for new failure modes. |
| **Any Feature / Bugfix / Refactor / Version Bump** | [`docs/CHANGELOG.md`](file:///c:/Users/harit/OneDrive/Desktop/petcare/docs/CHANGELOG.md) | Add entry following Keep a Changelog standard under appropriate category: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`. |

---

## 2. Step-by-Step Tech Writer Workflow

Before concluding any user task or feature implementation, execute these four steps:

### Step 1: Detect Modified Surface
Analyze the git diff or list of modified files in the current session:
- Were any files in `backend/*/models.py` or `backend/*/migrations/` modified? → Flag `ARCHITECTURE.md`.
- Were any files in `backend/*/views.py`, `backend/*/serializers.py`, or `backend/*/urls.py` modified? → Flag `API_REGISTRY.md`.
- Were any files in `frontend/src/components/` or `frontend/src/pages/` modified? → Flag `COMPONENT_LIBRARY.md`.
- Were any files in `backend/config/settings.py`, `.env.example`, `requirements.txt`, or management commands modified? → Flag `OPERATIONS.md`.
- Did you resolve a defect, test failure, or unexpected bug? → Flag `INCIDENT_REGISTRY.md`.
- Did you add, change, or remove functionality? → Flag `CHANGELOG.md`.

### Step 2: Formulate Documentation Edits
Use `replace_file_content` or `multi_replace_file_content` to surgically update existing sections, or add new rows/sections:
- Preserve existing formatting conventions (markdown tables, Mermaid syntax, code blocks).
- Ensure all file paths and symbols use clickable github-style links (`[filename](file:///path/to/file)`).
- Never use placeholder text, vague summaries, or "TODO" items.

### Step 3: Validate Diagram & Link Syntax
- Verify that Mermaid diagrams (`graph TD`, `sequenceDiagram`, `stateDiagram-v2`) have properly escaped labels without invalid parenthesis or quote syntax.
- Ensure all relative and absolute file links point to existing files.

### Step 4: Verification Check
Confirm that the documentation accurately reflects the active state of the code. If an endpoint payload changed, the doc must show the exact new JSON schema.

---

## 3. Style & Quality Standards

1. **Repository Specificity**:
   - Write exclusively about Pet Care CRM—its 11 Django apps, its specific React components, its authentication and verification flows, and its domain logic.
   - Never write generic software engineering advice.
2. **Formatting**:
   - Use standard GitHub Flavored Markdown (GFM).
   - Use GitHub alerts (`> [!NOTE]`, `> [!IMPORTANT]`, `> [!WARNING]`) for critical operational caveats.
   - Code blocks must declare language syntax identifiers (`python`, `javascript`, `jsx`, `powershell`, `json`, `mermaid`).
3. **No Redundant Summaries**:
   - Keep documentation concise, dense, and structured for fast reference by engineers and AI subagents.
