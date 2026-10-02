# Database — Firestore Schema

All data is stored in **Cloud Firestore** (NoSQL document database). There are no relational joins — documents embed or reference related data by UID/ID.

## Collections

### `users/{uid}`

The central user profile. Created on first successful setup at `/setup`.

```ts
{
  uid:              string;          // Firebase Auth UID (same as document ID)
  email:            string;
  role:             UserRole;        // see Roles section
  name:             string;
  title?:           string;          // e.g. "Senior Consultant"
  address?:         string;
  dob?:             string;          // ISO date string
  gender?:          string;
  phone?:           string;
  createdAt:        Timestamp;
  permissions?:     string[];        // see permissions.ts for valid keys

  // Doctor-specific (DoctorProfile)
  specialization?:  string;
  qualification?:   string;
  age?:             number;
  approved?:        boolean;
  licenseNumber?:   string;
  department?:      string;

  // Patient-specific (PatientProfile)
  visitDate?:       string;
  assignedDoctorId?: string;
  problem?:         string;
  status?:          string;
  fatherName?:      string;
  bloodGroup?:      string;
  allergies?:       string;
  emergencyContact?: string;
  insuranceId?:     string;
}
```

**Access:** Read by owner, any clinical staff, or admin. Write by owner or admin. Delete by admin only.

---

### `invites/{email}`

Document ID is the invitee's **email address** (lowercase). Created when admin or receptionist sends an invitation.

```ts
{
  role:       UserRole;       // assigned role for the invitee
  invitedBy:  string;         // name of the inviting user
  createdAt:  Timestamp;
  used:       boolean;        // set to true on successful registration
  usedAt?:    Timestamp;
  uid?:       string;         // set to the new user's UID on registration
}
```

**Access:** Readable by anyone (needed during setup before auth). Writable by admin or receptionist (patient invites only).

---

### `admissions/{admissionId}`

Walk-in patient records created by receptionist.

```ts
{
  id:              string;
  patientEmail:    string;
  patientName:     string;
  phone?:          string;
  problem:         string;
  assignedDoctorId?: string;
  admittedBy:      string;      // UID of receptionist
  admittedAt:      Timestamp;
  inviteSent:      boolean;
  status:          "ADMITTED" | "REGISTERED" | "DISCHARGED";
}
```

---

### `sessions/{sessionId}`

Login telemetry. Document ID is `{uid}_{timestamp}`.

```ts
{
  uid:        string;
  email:      string;
  role:       UserRole;
  loginAt:    Timestamp;
  userAgent?: string;
}
```

**Access:** Any authenticated user can create. Admin can read/update/delete.

---

### `diagnostics/{diagId}`

Doctor visit records — diagnosis, prescription, vitals.

```ts
{
  id:           string;
  patientId:    string;         // users/{uid}
  doctorId:     string;
  description:  string;
  prescription: string;
  date:         Timestamp;
  icdCode?:     string;
  followUpDate?: string;
  vitals?: {
    bloodPressure?:     string;
    heartRate?:         number;
    temperature?:       number;
    oxygenSaturation?:  number;
    weight?:            number;
    height?:            number;
    recordedAt?:        Timestamp;
    recordedBy?:        string;
  };
}
```

---

### `appointments/{apptId}`

```ts
{
  id:        string;
  patientId: string;
  doctorId:  string;
  date:      string;            // ISO date
  time:      string;            // "HH:MM"
  status:    "SCHEDULED" | "COMPLETED" | "CANCELLED";
  type?:     string;
  notes?:    string;
}
```

---

### `labOrders/{orderId}`

```ts
{
  id:           string;
  patientId:    string;
  patientName?: string;
  doctorId:     string;
  tests:        string[];
  priority:     "ROUTINE" | "URGENT" | "STAT";
  status:       "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  orderedAt:    Timestamp;
  completedAt?: Timestamp;
  results?:     LabResult[];
  notes?:       string;
}

// LabResult embedded array
{
  testName:       string;
  value:          string;
  unit:           string;
  referenceRange: string;
  flag?:          "NORMAL" | "HIGH" | "LOW" | "CRITICAL";
}
```

---

### `radiologyOrders/{orderId}`

```ts
{
  id:           string;
  patientId:    string;
  patientName?: string;
  doctorId:     string;
  modality:     "X-RAY" | "CT" | "MRI" | "ULTRASOUND" | "PET" | "MAMMOGRAPHY";
  bodyPart:     string;
  priority:     "ROUTINE" | "URGENT" | "STAT";
  status:       "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  orderedAt:    Timestamp;
  reportedAt?:  Timestamp;
  findings?:    string;
  impression?:  string;
  radiologistId?: string;
}
```

---

### `orders/{orderId}`

CPOE — general clinical orders (medication, nursing, diet, etc.)

```ts
{
  id:        string;
  patientId: string;
  doctorId:  string;
  orderType: "MEDICATION" | "LAB" | "RADIOLOGY" | "NURSING" | "DIET" | "PHYSIOTHERAPY";
  details:   string;
  priority:  "ROUTINE" | "URGENT" | "STAT";
  status:    "PENDING" | "ACKNOWLEDGED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  orderedAt: Timestamp;
  notes?:    string;
}
```

---

### `otSchedules/{scheduleId}`

Operating theater bookings.

```ts
{
  id:              string;
  patientId:       string;
  patientName?:    string;
  surgeonId:       string;
  procedure:       string;
  scheduledAt:     Timestamp;
  duration:        number;           // minutes
  otNumber:        string;
  status:          "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "POSTPONED";
  anesthesiaType?: string;
  notes?:          string;
}
```

---

### `bloodBank/{recordId}`

```ts
{
  id:          string;
  bloodGroup:  "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  units:       number;
  donorId?:    string;
  expiryDate:  Timestamp;
  status:      "AVAILABLE" | "RESERVED" | "USED" | "EXPIRED";
  notes?:      string;
}
```

---

### `emergencyCases/{caseId}`

```ts
{
  id:              string;
  patientId?:      string;
  patientName:     string;
  age?:            number;
  gender?:         string;
  chiefComplaint:  string;
  triageLevel:     "IMMEDIATE" | "URGENT" | "LESS_URGENT" | "NON_URGENT";
  status:          "WAITING" | "IN_TREATMENT" | "ADMITTED" | "DISCHARGED" | "TRANSFERRED";
  arrivalTime:     Timestamp;
  assignedDoctorId?: string;
  assignedNurseId?:  string;
  vitals?:         Vitals;
  notes?:          string;
  disposition?:    string;
}
```

---

### `bills/{billId}` and `consultationFees/{feeId}`

Finance collections managed by admin and receptionist. Schema varies by billing type — see the generate-bill and payments pages for field details.

---

### `system/config`

Single document at path `system/config`. Stores hospital-wide settings managed via `/admin/config`.

```ts
{
  facilityName:         string;
  facilityType:         string;
  address:              string;
  city:                 string;
  country:              string;
  phone:                string;
  email:                string;
  website:              string;
  registrationNumber:   string;
  maxPatientsPerDoctor: number;
  allowWalkIns:         boolean;
  requireInviteForStaff: boolean;
  emailNotifications:   boolean;
  smsNotifications:     boolean;
  maintenanceMode:      boolean;
  updatedAt:            Timestamp;
}
```

---

## Indexes

Firestore composite indexes may be needed for queries that filter on multiple fields (e.g., `patientId + status` on `labOrders`). Add these in the Firebase console or via `firestore.indexes.json` when query errors appear in the browser console mentioning index requirements.

## Data Conventions

- **Timestamps** — always use `serverTimestamp()` from `firebase/firestore` for `createdAt` / `orderedAt` fields. Never use `new Date()` which creates a client-side timestamp.
- **UIDs** — always use Firebase Auth UIDs as user references. Never store names as references.
- **Soft deletes** — currently not implemented. Deletes are hard (`deleteDoc`). If audit trails become important, switch to a `deleted: true` flag with Firestore rules preventing further updates.
