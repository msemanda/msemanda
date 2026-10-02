# Clinical Modules

Each module is a self-contained Next.js route group with its own layout (auth guard + sidebar) and a set of pages. All modules follow the same shell pattern: `layout.tsx` wraps every page in the role-gated sidebar; pages read/write Firestore independently.

---

## Admin (`/admin/*`)

The control plane of the system. Uses its own `Sidebar.tsx` component (not `RoleSidebar`) because it has a larger navigation tree with links into all clinical modules.

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/admin/dashboard` | System summary — users, sessions, recent activity |
| User Registry | `/admin/users` | View all staff/patients; edit title, specialization, and permissions per user |
| Invite Staff | `/admin/invite-doctors` | Create invitation links for any role |
| Patient Flow | `/admin/schedule-patients` | Scheduled patient overview |
| Patient Validation | `/admin/validate-patient` | Validate patient identity before consultation |
| Access Logs | `/admin/sessions` | View login sessions across all users |
| Billing | `/admin/generate-bill` | Generate and manage patient bills |
| Inventory | `/admin/inventory` | Stock levels, reorder alerts, supplier info |
| System Config | `/admin/config` | Facility info, operational toggles, notification settings |

---

## Doctor (`/doctor/*`)

The primary clinical workspace for physicians. Sidebar items can be restricted by permission key.

| Page | Route | Permission | Purpose |
|---|---|---|---|
| Dashboard | `/doctor/dashboard` | — | Daily overview — patients, appointments, orders |
| My Patients | `/doctor/patients` | — | List of patients under the doctor's care |
| EMR | `/doctor/emr` | `emr` | Electronic Medical Records — read and write patient notes |
| Diagnostic History | `/doctor/diagnostics` | `diagnostics` | Past lab and radiology results per patient |
| CPOE — Order Entry | `/doctor/cpoe` | `cpoe` | Computerized Physician Order Entry — medications, labs, radiology, nursing, diet |
| Clinical Order Sets | `/doctor/order-sets` | `order_sets` | Evidence-based pre-configured order bundles |
| Appointments | `/doctor/appointments` | `appointments` | Personal appointment schedule |

---

## Nursing (`/nurse/*`)

Ward-based patient care, shift management, and OT coordination.

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/nurse/dashboard` | Ward snapshot — patient counts, pending orders, vitals due |
| Ward Patients | `/nurse/patients` | All admitted patients with bed, ward, diagnosis, and status |
| Vitals | `/nurse/vitals` | Record and view vital signs per patient |
| Nursing Orders | `/nurse/orders` | View, acknowledge, and execute nursing orders from doctors |
| OT Schedule | `/nurse/ot` | Operating theater schedule — procedure, surgeon, status |
| Shift Schedule | `/nurse/shift` | Weekly nurse shift rotation by ward |
| Handover | `/nurse/handover` | Shift-to-shift patient handover with acknowledgement tracking |

---

## Laboratory (`/lab/*`)

End-to-end lab order lifecycle from receiving to reporting.

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/lab/dashboard` | Pending orders count, priority breakdown |
| Test Orders | `/lab/orders` | Incoming lab orders — filter by priority/status, start processing |
| Results Entry | `/lab/results` | Enter test values against pending orders; flags high/low results |
| Reports | `/lab/reports` | Finalized lab reports with findings and downloadable PDF |
| Blood Inventory | `/lab/blood-bank` | Blood group stock levels and inventory management |
| Blood Requests | `/lab/blood-requests` | Incoming requests — approve or decline with notes |

---

## Radiology (`/radiology/*`)

Imaging order management and radiological reporting.

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/radiology/dashboard` | Daily imaging load summary |
| Imaging Orders | `/radiology/orders` | All orders by modality and priority — accept and start |
| Worklist | `/radiology/worklist` | Active imaging queue with room assignment and ETA |
| Reports | `/radiology/reports` | Finalized reports with findings and impression |
| Statistics | `/radiology/stats` | Volume charts, modality breakdown, average turnaround time |

**Supported modalities:** X-RAY, CT, MRI, ULTRASOUND, PET, MAMMOGRAPHY

---

## Physiotherapy (`/physiotherapy/*`)

Rehabilitation program management and outcome tracking.

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/physiotherapy/dashboard` | Active cases, sessions today, improving/declining count |
| My Patients | `/physiotherapy/patients` | Patient list with condition, session count, and progress status |
| Sessions | `/physiotherapy/sessions` | Today's session schedule with exercise breakdown |
| Treatment Plans | `/physiotherapy/plans` | Multi-week rehab programs — phase, goals, exercise list |
| Progress Tracking | `/physiotherapy/progress` | Before/after metric comparison per patient |

---

## Dental (`/dental/*`)

Complete dental practice management within the hospital.

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/dental/dashboard` | Daily appointment count, upcoming procedures |
| Patients | `/dental/patients` | Patient list with chief complaint and next appointment |
| Appointments | `/dental/appointments` | Daily appointment schedule by chair |
| Dental Chart | `/dental/chart` | Interactive FDI (two-digit) tooth numbering chart — click to mark conditions |
| X-Rays | `/dental/xrays` | Periapical, panoramic, and bitewing radiograph records with findings |

---

## Dietary (`/dietary/*`)

Patient nutrition management and hospital food service.

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/dietary/dashboard` | Active plans count, high-risk patients |
| Diet Plans | `/dietary/plans` | Per-patient meal plans with calorie targets and food restrictions |
| Patients | `/dietary/patients` | Referred patients with BMI, diet plan status, and last assessment date |
| Food Menu | `/dietary/menu` | Hospital ward menu — items, nutritional values, dietary tags |
| Assessments | `/dietary/assessments` | Nutritional assessments with malnutrition risk scoring and recommendations |

---

## Emergency (`/emergency/*`)

Real-time emergency department operations.

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/emergency/dashboard` | Live ED overview — waiting count by triage level |
| Triage Board | `/emergency/triage` | Color-coded patient board (Immediate / Urgent / Less Urgent / Non-Urgent) with vitals |
| ED Patients | `/emergency/patients` | Full patient table with assigned team and disposition |
| Ambulance | `/emergency/ambulance` | Unit status board (dispatched / returning / available) and call log |
| Incident Log | `/emergency/log` | Searchable record of all emergency events with actions and outcomes |

**Triage levels (Manchester Triage System):**
- **Immediate (Red)** — life-threatening, seen immediately
- **Urgent (Orange)** — serious, seen within 10 minutes
- **Less Urgent (Yellow)** — seen within 60 minutes
- **Non-Urgent (Green)** — seen within 120 minutes

---

## Home Care (`/homecare/*`)

Scheduled visits for patients receiving care at home.

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/homecare/dashboard` | Today's visit count, active patients |
| My Patients | `/homecare/patients` | Patient list with address, condition, services, and next visit date |
| Visit Schedule | `/homecare/visits` | Ordered visit timeline for today with service breakdown |
| Visit Reports | `/homecare/reports` | Post-visit clinical notes — vitals, findings, plan |
| Route Map | `/homecare/map` | Sequential stop-by-stop route with distance and status |

---

## Wellness (`/wellness/*`)

Hospital wellness and preventive care programs.

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/wellness/dashboard` | Active programs, enrolled patients, upcoming sessions |
| Programs | `/wellness/programs` | Program catalog — category, capacity, enrolment progress bar |
| Enrollments | `/wellness/enrollments` | Per-patient program enrolment with attendance and progress rating |
| Schedule | `/wellness/schedule` | Recurring session timetable — day, time, venue, facilitator |
| Progress | `/wellness/progress` | Health metric deltas (HbA1c, weight, BMI) before vs. after |
| Nutrition | `/wellness/nutrition` | Evidence-based nutrition tips by condition category |

**Program categories:** FITNESS, NUTRITION, MENTAL_HEALTH, CHRONIC_DISEASE, PREVENTIVE

---

## Pharmacy (`/pharmacy/*`)

Medication dispensing against doctor prescriptions.

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/pharmacy/dashboard` | Pending prescriptions, stock alerts |
| Dispense | `/pharmacy/register` | Prescription queue — mark as dispensed |
| Diagnostics | `/pharmacy/diagnostics/[id]` | View patient diagnostic context before dispensing |

---

## Receptionist (`/receptionist/*`)

Front-desk patient flow management.

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/receptionist/dashboard` | Today's admissions, queue size, appointment count |
| Admit Patient | `/receptionist/admit` | Walk-in patient registration — assigns doctor, records problem |
| Patient Search | `/receptionist/patients` | Search all registered patients by name, phone, or ID |
| Invitations | `/receptionist/invites` | Send email invitations to new patients |
| Book Appointment | `/receptionist/book` | Book a doctor appointment for a patient |
| Today's Queue | `/receptionist/queue` | Live queue board — call next patient via ticket number |
| Schedule | `/receptionist/schedule` | Full-day appointment schedule filterable by doctor |
| Consultation Fees | `/receptionist/payments` | Record and confirm consultation fee payments |

---

## Patient (`/patient/*`)

Self-service portal for registered patients.

| Page | Route | Purpose |
|---|---|---|
| Dashboard | `/patient/dashboard` | Personal health summary |
| Diagnostics | `/patient/diagnostics` | Own diagnosis history from doctor visits |
