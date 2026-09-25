# Pet Care CRM Component Library & Design System

## Overview

The Pet Care CRM UI is built with React 19, Vite, and Tailwind CSS. The design language prioritizes visual clarity, calm medical/veterinary warmth, high density data management, and intuitive workflows for staff and pet owners.

---

## 1. Design Tokens & Visual Hierarchy

### Color Palette

| Token | Hex / Tailwind | Purpose |
|---|---|---|
| **Primary Brand** | `#0d9488` (`brand-600`) | Main buttons, navigation highlights, active tabs, pet identity emblems |
| **Brand Accent Light** | `#f0fdfa` (`brand-50`) | Card backgrounds, badge surfaces, subtle hover states |
| **Dark Neutral / Slate** | `#0f172a` (`slate-900`) | Page headings, high-contrast modal text, dark navigation surfaces |
| **Subdued Slate** | `#64748b` (`slate-500`) | Subtitles, helper text, empty state icons, table column headers |
| **Border Stroke** | `#e2e8f0` (`slate-200`) | Card boundaries, table row separators, input outlines |
| **Success / Healthy** | `#10b981` (`emerald-500`) | Paid invoices, completed check-ins, verified email/phone badges |
| **Warning / Attention** | `#f59e0b` (`amber-500`) | Pending bookings, due vaccines, unverified contact methods |
| **Danger / Emergency** | `#f43f5e` (`rose-500`) | Critical medical flags, cancelled bookings, failed verifications |
| **Info / Sky** | `#0284c7` (`sky-600`) | Active grooming sessions, push notification previews |

### Typography & Spacing
- **Font Stack**: System sans-serif (`Inter`, `system-ui`, `-apple-system`, `sans-serif`)
- **Card Radii**: `rounded-2xl` (16px) for major widgets and modals; `rounded-xl` (12px) for inputs, buttons, and badges.
- **Elevation**:
  - Cards: `shadow-sm` transitioning to `hover:shadow-md`
  - Floating Overlays & Modals: `shadow-2xl` with `backdrop-blur-sm`

---

## 2. Component Directory

### 2.1 `DataTable`
High-performance, searchable, and client-paginated table container with dynamic header actions and custom filters.

#### File Path
`frontend/src/components/DataTable.jsx`

#### Props Reference

| Prop Name | Type | Default | Description |
|---|---|---|---|
| `columns` | `Array<Column>` | **Required** | Column definitions: `{ header: string, accessor: string \| (row) => ReactNode, className?: string }` |
| `data` | `Array<object>` | `[]` | Raw dataset array |
| `loading` | `boolean` | `false` | When true, renders loading skeleton/spinner overlay |
| `searchPlaceholder`| `string` | `'Search records...'` | Placeholder text inside search box |
| `actionButton` | `ReactNode` | `null` | Primary call-to-action button rendered in top-right bar |
| `filterComponent` | `ReactNode` | `null` | Dropdown or button group for faceted filtering |
| `pageSize` | `number` | `10` | Maximum number of rows rendered per page |

#### Usage Example
```jsx
import { DataTable } from '../components/DataTable';
import { Plus } from 'lucide-react';

const columns = [
  { header: 'Pet Name', accessor: (row) => <span className="font-bold">{row.name}</span> },
  { header: 'Breed', accessor: 'breed' },
  { header: 'Owner', accessor: (row) => row.owner_details?.full_name || 'N/A' },
  {
    header: 'Status',
    accessor: (row) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${row.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
        {row.is_active ? 'Active' : 'Inactive'}
      </span>
    ),
  },
];

<DataTable
  columns={columns}
  data={petsList}
  loading={isLoading}
  searchPlaceholder="Search by pet name, breed, or owner..."
  actionButton={
    <button onClick={openModal} className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl font-medium">
      <Plus className="w-4 h-4" /> Add Pet
    </button>
  }
/>
```

---

### 2.2 `Modal`
Universal accessible modal dialog wrapper with backdrop blurring, escape-key dismissal, and body scroll lock.

#### File Path
`frontend/src/components/Modal.jsx`

#### Props Reference

| Prop Name | Type | Default | Description |
|---|---|---|---|
| `isOpen` | `boolean` | **Required** | Visibility control flag |
| `onClose` | `() => void` | **Required** | Triggered on backdrop click, close icon, or Escape key |
| `title` | `string` | **Required** | Primary modal heading |
| `subtitle` | `string` | `null` | Sub-heading / supplementary instructions |
| `children` | `ReactNode` | **Required** | Modal interior body content |
| `maxWidth` | `string` | `'max-w-2xl'` | Tailwind max-width class (`max-w-md`, `max-w-4xl`, etc.) |

#### Usage Example
```jsx
import { Modal } from '../components/Modal';

<Modal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  title="Record Vaccination Entry"
  subtitle="Attach veterinary certification and booster due dates"
  maxWidth="max-w-xl"
>
  <form onSubmit={handleSave}>
    {/* Form contents */}
  </form>
</Modal>
```

---

### 2.3 `StatCard`
Metric display component used across CRM dashboards with color themes and trend badges.

#### File Path
`frontend/src/components/StatCard.jsx`

#### Props Reference

| Prop Name | Type | Default | Description |
|---|---|---|---|
| `title` | `string` | **Required** | Small uppercase metric title |
| `value` | `string \| number` | **Required** | Prominent statistical value |
| `icon` | `LucideIcon` | `null` | Lucide icon component rendered in styled badge |
| `change` | `string` | `null` | Trend indicator (e.g., `"+12% this month"`) |
| `changeType` | `'positive' \| 'negative' \| 'neutral'` | `'positive'` | Changes trend pill background (emerald, rose, slate) |
| `color` | `'brand' \| 'blue' \| 'amber' \| 'rose' \| 'emerald'` | `'brand'` | Primary card gradient accent |
| `subtitle` | `string` | `null` | Explanatory note below value |

#### Usage Example
```jsx
import { StatCard } from '../components/StatCard';
import { Dog, CalendarCheck, AlertTriangle } from 'lucide-react';

<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <StatCard
    title="Active Boarding Pets"
    value="18"
    icon={Dog}
    color="brand"
    change="+3 checked in today"
    changeType="positive"
  />
  <StatCard
    title="Occupancy Rate"
    value="85%"
    icon={CalendarCheck}
    color="blue"
    subtitle="17 of 20 suites reserved"
  />
  <StatCard
    title="Vaccines Expiring"
    value="4"
    icon={AlertTriangle}
    color="amber"
    change="Action required"
    changeType="negative"
  />
</div>
```

---

### 2.4 `ChecklistModal`
Specialized operational modal managing boarding check-in and check-out workflows, occupancy assignment, belongings audit, and payment clearance.

#### File Path
`frontend/src/components/ChecklistModal.jsx`

#### Props Reference

| Prop Name | Type | Default | Description |
|---|---|---|---|
| `isOpen` | `boolean` | **Required** | Modal visibility flag |
| `onClose` | `() => void` | **Required** | Dismiss callback |
| `booking` | `object` | `null` | Booking record object containing pet, dates, and instructions |
| `mode` | `'checkin' \| 'checkout'` | `'checkin'` | Sets operational phase and displays respective checklist steps |
| `onUpdated` | `() => void` | `null` | Callback to refresh parent list/dashboard after submission |

#### Key Operational Checkpoints
- **Check-in Mode**:
  1. Room / Suite allocation selection (`boardingService.getRooms()`)
  2. Vaccination compliance verification flag
  3. Physical intake health check and weight recording (kg)
  4. Belongings inventory log (collars, bedding, toys, food containers)
  5. Feeding schedule confirmation and medication instructions
  6. Emergency owner contact verification
- **Check-out Mode**:
  1. Post-stay physical condition assessment
  2. Belongings return audit
  3. Outstanding medication return
  4. Extra services verification (grooming, bath, veterinary check)
  5. Invoice generation and payment completion trigger
  6. Owner discharge signature acknowledgement

---

### 2.5 `VerificationModal`
Dual-channel (Email / Phone SMS) two-factor and contact verification modal with rich push notification preview, clipboard copy, and resend cooldown.

#### File Path
`frontend/src/components/VerificationModal.jsx`

#### Props Reference

| Prop Name | Type | Default | Description |
|---|---|---|---|
| `isOpen` | `boolean` | **Required** | Modal visibility state |
| `onClose` | `() => void` | **Required** | Dismiss callback |
| `type` | `'EMAIL' \| 'PHONE'` | `'EMAIL'` | Verification channel |
| `destination` | `string` | `''` | Target email address or 10-digit phone number |
| `onVerified` | `(data) => void` | `null` | Invoked on backend success `200 OK` |

#### Key Features:
- Automatic 6-digit numeric input formatter.
- 60-second anti-spam resend cooldown timer.
- Simulated Push Notification alert banner displaying real-time OTP for local test environments.
- Direct copy-to-clipboard button for rapid testing and user convenience.

---

### 2.6 `PrintableInvoice`
Financial billing document viewer optimized for both screen viewing and thermal/laser printer output (`window.print()`).

#### File Path
`frontend/src/components/PrintableInvoice.jsx`

#### Props Reference

| Prop Name | Type | Default | Description |
|---|---|---|---|
| `invoice` | `object` | **Required** | Invoice record with customer, pet, line items, taxes, and status |
| `onClose` | `() => void` | `null` | Optional close button handler |

#### Print Styling Specifications
- Includes dedicated print trigger: `window.print()`.
- Container ID: `#printable-invoice-area`.
- Utility class `.no-print` hides buttons, toolbars, and navigation during print previews.
- Preserves clean black/white typography with currency-aligned numeric tables and veterinary sanctuary branding.

---

### 2.7 `Navbar` & `Sidebar`
Core application shell components enforcing role-based access control (Admin, Staff, Customer).

#### File Paths
- `frontend/src/components/Navbar.jsx`
- `frontend/src/components/Sidebar.jsx`

#### Access Matrix Navigation:

| Navigation Item | Route | Customer | Staff | Admin |
|---|---|:---:|:---:|:---:|
| Dashboard | `/dashboard` | `✓` (My Pets) | `✓` (Staff Tasks) | `✓` (Executive) |
| Customers | `/customers` | ✗ | `✓` (Read/Manage) | `✓` (Full CRUD) |
| Pets | `/pets` | `✓` (Owned only) | `✓` (All) | `✓` (Full CRUD) |
| Bookings & Boarding | `/bookings` | `✓` (Book/View) | `✓` (Check-in/out) | `✓` (Manage all) |
| Vaccinations | `/vaccinations` | `✓` (View history) | `✓` (Log doses) | `✓` (Full CRUD) |
| Medical & Feeding | `/medical` | ✗ | `✓` (Daily logs) | `✓` (Full CRUD) |
| Services Catalog | `/services` | ✗ | ✗ | `✓` (Configure rates)|
| Invoices & Billing | `/billing` | `✓` (Pay online) | `✓` (Create/View) | `✓` (Full CRUD) |
| Staff Management | `/staff` | ✗ | ✗ | `✓` (Admin only) |
| Reports & Analytics | `/reports` | ✗ | ✗ | `✓` (Admin only) |

#### Navbar Real-Time Notification Polling
- Periodic 45-second background polling via `notificationService.getAll()`.
- Unread count badge on bell icon with dynamic read/unread dropdown drawer.
- Quick profile switcher, role badge, and secure logout action.

---

### 2.8 `LoadingSpinner`
Centrally aligned animated spinner with custom sizing and brand coloring for asynchronous transitions.

#### File Path
`frontend/src/components/LoadingSpinner.jsx`

#### Props Reference

| Prop Name | Type | Default | Description |
|---|---|---|---|
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Spinner pixel dimension (`w-4 h-4`, `w-8 h-8`, `w-12 h-12`) |
| `className` | `string` | `''` | Extra Tailwind utility classes |

---

### 2.9 `DigitalDiaryModal`
Interactive digital diary capturing the pet's complete boarding sanctuary journey from arrival intake to daily activities and departure farewell.

#### File Path
`frontend/src/components/DigitalDiaryModal.jsx`

#### Props Reference

| Prop Name | Type | Default | Description |
|---|---|---|---|
| `isOpen` | `boolean` | **Required** | Controls modal visibility |
| `onClose` | `function` | **Required** | Callback invoked to close modal |
| `booking` | `object` | **Required** | Active boarding booking record containing pet, room, and stay dates |
| `onUpdated` | `function` | `null` | Callback to refresh parent list/dashboard data upon changes |

#### Features & User Experience
- **Journey Stage Filtering:** Filter timeline by `All Journey`, `When They Came (Arrival)`, `Daily Stay Activities`, or `When They Leaves (Departure)`.
- **Intake & Farewell Cards:** Displays intake weight, personal belongings received/returned, health condition inspections, and farewell summaries.
- **Mood & Energy Tagging:** Visual mood indicators (`Happy & Wagging`, `Playful & Energetic`, `Calm & Relaxed`, `Cuddly & Affectionate`, `Shy / Settling In`, `Sleepy & Resting`).
- **Live Stay Photos:** Real-time camera uploads from staff displayed with aspect-video previews and auto-sync to the owner portal.
- **Print Report Card:** Built-in `@media print` styling for veterinary & boarding certificate of stay for pet parents.


---

### 2.10 `VerifyEmail` Page Component
Dedicated account activation and email verification page supporting both direct browser redirects and URL token queries.

#### File Path
`frontend/src/pages/VerifyEmail.jsx`

#### Route
`/verify-email?token=<token>`

#### State & Interaction Lifecycle
1. **Verification Phase (`loading=true`):** Displays `LoadingSpinner` with *"Verifying your email address..."* while querying `/api/auth/verify-email/?token=<token>&format=json`.
2. **Success State:**
   - Displays verified checkmark emblem, account email badge, and the mandatory message:
     *"Email verified successfully. You can now continue using your account."*
   - Primary action: *"Log In to Your Account"* routing to `/login?verified=true`.
3. **Invalid / Expired / Re-Used State:**
   - Displays alert emblem and the mandatory message:
     *"This verification link is invalid or has expired. Please request a new verification email."*
   - Integrated *"Resend verification email"* inline form with rate-limiting countdown timer (60s) and enumeration prevention.

---

## 3. Global Feedback Systems

### Toast Notifications (`ToastContext`)
Managed globally via `useToast()`.

```jsx
import { useToast } from '../context/ToastContext';

const { addToast } = useToast();

// Success
addToast('Pet vaccination record saved successfully!', 'success', 4000);

// Error
addToast('Failed to check-out pet: Outstanding balance detected.', 'error', 6000);

// Info / Warning
addToast('Room allocation updated.', 'info', 3000);
```
