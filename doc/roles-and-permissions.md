# Roles and Permissions

## User Roles

The system has 12 distinct roles. Each role maps to a dedicated workspace URL.

| Role | Workspace | Description |
|---|---|---|
| `ADMIN` | `/admin/*` | Full system access. Manages users, permissions, configuration, billing, and access logs. |
| `DOCTOR` | `/doctor/*` | Manages patients, writes EMR, orders labs/radiology via CPOE, manages appointments. |
| `NURSE` | `/nurse/*` | Ward patient management, vitals recording, nursing order execution, OT scheduling, shift handover. |
| `LAB_TECH` | `/lab/*` | Processes lab orders, enters results, manages blood bank inventory and requests. |
| `RADIOLOGY_TECH` | `/radiology/*` | Manages imaging orders, worklist, writes radiology reports. |
| `PHYSIOTHERAPIST` | `/physiotherapy/*` | Manages patient sessions, treatment plans, and tracks rehabilitation progress. |
| `DENTIST` | `/dental/*` | Dental patient records, appointments, dental charting (FDI), and X-ray management. |
| `DIETITIAN` | `/dietary/*` | Creates diet plans, manages nutritional assessments, and maintains the hospital food menu. |
| `EMERGENCY_STAFF` | `/emergency/*` | Triage board management, ED patient tracking, ambulance dispatch, and incident logging. |
| `PHARMACY` | `/pharmacy/*` | Medication dispensing against prescriptions, pharmacy stock management. |
| `RECEPTIONIST` | `/receptionist/*` | Patient admission (walk-in), appointment booking, queue management, consultation fee collection. |
| `PATIENT` | `/patient/*` | Personal health records, diagnosis history, appointment view. |

## Permission Keys

Within clinical staff roles, access to specific sub-modules can be granted or revoked individually. Permissions are managed by the Admin via `/admin/users`.

### Clinical

| Key | Label | Description |
|---|---|---|
| `emr` | Electronic Medical Records | View and write patient EMR |
| `cpoe` | CPOE / Clinical Orders | Order medications, labs, radiology |
| `order_sets` | Order Sets | Apply evidence-based order bundles |
| `diagnostics` | Diagnostics | View diagnostic history and results |
| `prescriptions` | Prescriptions | Write and sign prescriptions |
| `home_care` | Home Care | Manage home care visit orders |
| `wellness` | Wellness Programs | Manage patient wellness programs |

### Scheduling

| Key | Label | Description |
|---|---|---|
| `appointments` | Appointments | View and manage appointments |
| `ot` | Operating Theater | View and manage OT schedules |

### Nursing

| Key | Label | Description |
|---|---|---|
| `vitals` | Vitals Recording | Record and view patient vitals |
| `nursing_orders` | Nursing Orders | Execute and acknowledge nursing orders |
| `ward_patients` | Ward Patients | View and manage ward patient list |

### Ancillary

| Key | Label | Description |
|---|---|---|
| `lab_orders` | Lab Orders | View and process lab orders |
| `radiology_orders` | Radiology Orders | View and report radiology orders |
| `blood_bank` | Blood Bank | Manage blood bank inventory |
| `pharmacy` | Pharmacy | Dispense medications and manage stock |

### Specialty

| Key | Label | Description |
|---|---|---|
| `physiotherapy` | Physiotherapy | Manage physiotherapy sessions |
| `dental` | Dental | Manage dental records and procedures |
| `dietary` | Dietary / Nutrition | Manage diet plans and meal plans |
| `emergency` | Emergency Triage | Access emergency triage board |

### Reception / Admin

| Key | Label | Description |
|---|---|---|
| `patient_admit` | Patient Admission | Admit walk-in patients |
| `patient_invite` | Patient Invitations | Send patient registration invites |
| `book_appt` | Book Appointments | Book doctor appointments for patients |
| `billing` | Consultation Fees | Collect and confirm consultation fees |

## Permission Behaviour

- **No `permissions` array set on profile** → user has full access to all sidebar items for their role (default for new accounts).
- **Empty `permissions: []`** → user sees only items with no `permission` key (dashboard only).
- **`permissions: ["emr", "cpoe"]`** → user sees dashboard + EMR + CPOE; all other gated items are hidden.

Permissions affect **sidebar visibility only** — they do not currently block direct URL access within the same role workspace. For sensitive data, Firestore rules provide the authoritative access control.

## Superadmin

The email `semandamoses91@gmail.com` is hard-coded as a permanent superadmin in both:
- `context/AuthContext.tsx` — always sets `role: "ADMIN"` regardless of Firestore data
- `app/setup/page.tsx` — bypasses invitation check
- `firestore.rules` — `isSuperAdmin()` function grants full write access

This cannot be locked out even if the Firestore user document is deleted.

## Staff Registration Flow

```
Admin/Receptionist → /admin/invite-doctors
  → Creates invite document: invites/{email} = { role, invitedBy, createdAt }

Invited person → /setup
  → Enters their email
  → App reads invites/{email} — validates invite exists and is unused
  → Person sets name + password
  → Firebase Auth account created
  → Firestore users/{uid} document created with assigned role
  → Invite marked as used: { used: true, usedAt, uid }
```

Patients follow the same flow but can be invited by either Admin or Receptionist.
