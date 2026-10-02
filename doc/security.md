# Security and Access Control

## Authentication

Firebase Authentication handles all identity management. The app uses **email + password** sign-in only. No social logins (Google, Facebook, etc.) are configured.

Password requirements are enforced by Firebase Auth (minimum 6 characters). Passwords are never stored by the app — Firebase handles hashing and storage.

## Firestore Security Rules

The file `firestore.rules` at the project root is the authoritative access control layer. The Next.js app cannot override these rules — they run on Google's servers. Even if a user manipulates the browser or calls the Firestore SDK directly, the rules block unauthorized access.

### Helper Functions

```js
function isAuth()        // user is signed in
function isSuperAdmin()  // email is semandamoses91@gmail.com
function isAdmin()       // superadmin OR role == ADMIN in Firestore
function isOwner(uid)    // signed-in user's UID matches document UID
function hasRole(role)   // user's Firestore profile has the given role
function isClinicalStaff() // DOCTOR | NURSE | LAB_TECH | RADIOLOGY_TECH
                            // | PHYSIOTHERAPIST | DENTIST | DIETITIAN
                            // | EMERGENCY_STAFF | PHARMACY | RECEPTIONIST
function isReceptionist()  // role == RECEPTIONIST
```

### Rules Summary by Collection

| Collection | Read | Write |
|---|---|---|
| `users` | Owner, any clinical staff, admin | Owner (own doc), admin |
| `invites` | Anyone (public — needed pre-auth) | Admin (any role), receptionist (patient only) |
| `admissions` | Any authenticated user | Admin, receptionist |
| `sessions` | Admin | Any authenticated user (create only) |
| `bills` / `consultationFees` | Any authenticated | Admin, pharmacy, receptionist |
| `diagnostics` | Any authenticated | Admin, doctor, lab tech, radiology tech |
| `appointments` | Any authenticated | Admin, doctor, nurse, receptionist |
| `labOrders` | Any authenticated | Admin, doctor, lab tech |
| `radiologyOrders` | Any authenticated | Admin, doctor, radiology tech |
| `orders` (CPOE) | Any authenticated | Admin, doctor, nurse |
| `otSchedules` | Any authenticated | Admin, doctor, nurse |
| `bloodBank` | Any authenticated | Admin, lab tech |
| `emergencyCases` | Any authenticated | Admin, emergency staff, doctor, nurse |

### Deploying Rules

```bash
firebase deploy --only firestore:rules
```

Changes to `firestore.rules` take effect immediately after deployment. Test rules in the Firebase console (Firestore → Rules → Rules playground) before deploying.

## Invitation-Only Registration

Staff cannot create accounts without an invitation. The `/setup` page checks `invites/{email}` before allowing registration. An invite can only be consumed once (`used: true` prevents re-use).

Patients can be invited by admin **or** receptionist. All other roles require admin to issue the invite.

## Superadmin Hardcoding

The superadmin email is hardcoded in three places:
1. `context/AuthContext.tsx` — always sets role to `ADMIN`
2. `app/setup/page.tsx` — bypasses invite check
3. `firestore.rules` — `isSuperAdmin()` function

To change the superadmin email, update all three files and redeploy both the app and Firestore rules.

## Client-Side Route Guards

Each role layout checks `profile.role` on every render:

```tsx
useEffect(() => {
  if (!loading && (!profile || profile.role !== "DOCTOR")) {
    router.push("/login");
  }
}, [profile, loading, router]);

if (loading) return <LoadingScreen />;
if (!profile || profile.role !== "DOCTOR") return null;
```

The `return null` during redirect prevents a flash of protected content. However, client-side guards are **not** the primary security mechanism — Firestore rules are. A user who manipulates the browser state cannot read other users' data because Firestore will reject the request at the server.

## Session Logging

Every successful login writes a document to `sessions/{uid}_{timestamp}`:

```ts
{ uid, email, role, loginAt, userAgent }
```

These are visible in the Admin console under `/admin/sessions`. They are write-once (any authenticated user can create, only admin can read/delete), providing a lightweight audit trail.

## Sensitive Data Notes

- **API keys** in `lib/firebase.ts` are Firebase client SDK keys — they are safe to expose publicly. Firebase API keys identify the project but do not grant write access; Firestore rules control actual access.
- **No environment variables** for Firebase config are needed because these are public keys. However, the `.env.local.example` file shows where to put them if the team prefers environment-based config.
- **No PHI encryption at rest** beyond what Firebase provides. Firebase Firestore encrypts data at rest by default using Google-managed keys. For HIPAA/data protection law compliance, a Business Associate Agreement (BAA) with Google is required.

## Known Limitations

1. Permission keys control **sidebar visibility** only. A doctor with the `emr` permission removed can still navigate directly to `/doctor/emr` — the page will load. The Firestore rules on `diagnostics` are the actual guard.
2. There is no password complexity policy beyond Firebase's 6-character minimum.
3. There is no MFA (multi-factor authentication) configured.
4. Session expiry is controlled by Firebase Auth token lifetime (default 1 hour, with refresh tokens valid for much longer). There is no custom session timeout.
