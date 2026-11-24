# Architecture

## Folder Structure

```
e-health-next/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout (AuthProvider, global fonts)
│   ├── page.tsx                # Landing / redirect page
│   ├── login/                  # Public login page
│   ├── setup/                  # Account creation (invite-based)
│   ├── admin/                  # Admin workspace
│   │   ├── layout.tsx          # Admin auth guard + Sidebar
│   │   ├── dashboard/
│   │   ├── users/              # User management + permission editor
│   │   ├── invite-doctors/
│   │   ├── schedule-patients/
│   │   ├── validate-patient/
│   │   ├── sessions/           # Access logs
│   │   ├── generate-bill/
│   │   ├── inventory/
│   │   └── config/             # System configuration
│   ├── doctor/                 # Doctor workspace
│   ├── nurse/                  # Nursing workspace
│   ├── lab/                    # Laboratory workspace
│   ├── radiology/              # Radiology workspace
│   ├── physiotherapy/
│   ├── dental/
│   ├── dietary/
│   ├── emergency/
│   ├── homecare/
│   ├── wellness/
│   ├── pharmacy/
│   ├── receptionist/
│   └── patient/                # Patient self-service portal
│
├── components/
│   ├── admin/
│   │   └── Sidebar.tsx         # Admin-specific sidebar (full menu)
│   └── ui/
│       ├── RoleSidebar.tsx     # Generic permission-aware sidebar
│       ├── LoadingScreen.tsx   # Full-screen loader with label
│       ├── Button.tsx
│       ├── Input.tsx
│       └── ...
│
├── context/
│   └── AuthContext.tsx         # Firebase Auth state + Firestore profile
│
├── lib/
│   ├── firebase.ts             # Firebase app initialization
│   ├── permissions.ts          # Permission definitions + specialization list
│   └── utils.ts                # cn() Tailwind class merger
│
├── types/
│   └── index.ts                # All TypeScript interfaces (UserProfile, etc.)
│
├── doc/                        # This documentation
├── firestore.rules             # Firestore security rules
└── public/                     # Static assets
```

## Auth Flow

```
User visits /login
  → submitCredentials()
    → signInWithEmailAndPassword(auth, email, password)
      → onAuthStateChanged fires in AuthContext
        → getDoc(users/{uid})
          → profile found → setProfile(data)
          → not found     → setProfile(null) → redirect /login
        → special case: superadmin email always gets ADMIN profile
      → AuthContext distributes {user, profile, loading} via React context
        → Role layout reads profile.role
          → correct role  → render workspace
          → wrong role    → router.push("/login")
```

## Sidebar Architecture

Every non-admin role uses the shared `RoleSidebar` component. Each role layout defines its own `SidebarGroup[]` array and passes it as props:

```tsx
// Example: app/doctor/layout.tsx
const sidebarGroups: SidebarGroup[] = [
  {
    label: "Patient Care",
    items: [
      { name: "My Patients",  href: "/doctor/patients", icon: UserCheck },
      { name: "EMR",          href: "/doctor/emr",      icon: FileText, permission: "emr" },
    ],
  },
];

<RoleSidebar groups={sidebarGroups} roleLabel="Physician" />
```

`RoleSidebar` filters items by `profile.permissions`:
- If item has no `permission` key → always visible
- If `profile.permissions` is `undefined` → all items visible (full access)
- If `profile.permissions` is an array → item shown only if its key is in the array

## Data Layer

All data is stored in **Cloud Firestore**. There is no separate backend API — the browser talks directly to Firestore using the Firebase SDK. Firestore security rules (see `firestore.rules`) enforce who can read and write each collection.

Pages that fetch data call `getDocs()` or `getDoc()` directly inside `useEffect` hooks or event handlers. There is no global state manager — component state and React Context are sufficient given the read-once, write-on-action patterns.

## Permissions System

Permissions are stored as a `string[]` on each user's Firestore document (`users/{uid}.permissions`). The full list of permission keys is defined in `lib/permissions.ts`. Admins assign permissions via the User Management page (`/admin/users`).

The sidebar reads permissions from `AuthContext` at render time — no extra Firestore reads needed. Attempting to navigate directly to a gated URL does not expose data because Firestore rules also enforce the same access controls server-side.
