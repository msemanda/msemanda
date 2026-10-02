# Setup and Development Guide

## Prerequisites

- Node.js 18 or later
- npm 9 or later
- A Firebase project (already created: `ehealth-8989d`)
- Firebase CLI (`npm install -g firebase-tools`) for rule deployment

## Local Development

```bash
# 1. Clone the repository
git clone <repo-url>
cd e-health-next

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

The app runs at `http://localhost:3000`.

No `.env` file is required — Firebase configuration is hardcoded in `lib/firebase.ts` using the public client SDK keys.

## First-Time Setup (New Deployment)

### 1. Bootstrap the superadmin account

Navigate to `/setup` in the browser. Enter `semandamoses91@gmail.com`. The system recognizes this email and skips the invitation check. Set a name and password. You will be redirected to `/admin/dashboard`.

If a Firebase Auth account for that email already exists (from a previous setup):
- Go to [Firebase Console → Authentication → Users](https://console.firebase.google.com)
- Find the email and use **Reset password** to regain access, or delete the Auth account and repeat the `/setup` flow.

### 2. Deploy Firestore rules

```bash
firebase login
firebase use ehealth-8989d
firebase deploy --only firestore:rules
```

### 3. Create the system config document

Go to `/admin/config`, fill in the facility details, and click **Save Changes**. This creates the `system/config` Firestore document.

### 4. Invite staff

Go to `/admin/invite-doctors`. Select the role, enter the staff member's email, and send the invitation. The invited person registers via `/setup`.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Production build |
| `npm run start` | Run production build locally |
| `npm run lint` | Run ESLint |

## Build and Deploy

### Deploy to Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

### Deploy to Vercel

Connect the GitHub repository to Vercel. Vercel auto-detects Next.js. No additional configuration is needed — the Firebase config is embedded in the source.

## Firestore Indexes

If the browser console shows an error like:
```
The query requires an index. You can create it here: <link>
```

Click the link — it takes you directly to the Firebase console to create the required composite index. Alternatively, add the index definition to a `firestore.indexes.json` file and deploy:

```bash
firebase deploy --only firestore:indexes
```

## Environment Configuration

The current setup uses hardcoded Firebase config. To switch to environment variables:

1. Rename `.env.local.example` to `.env.local`
2. Fill in the values from the Firebase console
3. Update `lib/firebase.ts` to use `process.env.NEXT_PUBLIC_*` variables

This is optional — hardcoded public API keys are safe for Firebase client SDK usage.

## Adding a New Role or Module

### 1. Add the role to `types/index.ts`

```ts
export type UserRole = "ADMIN" | "DOCTOR" | ... | "NEW_ROLE";
```

### 2. Create the workspace

```
app/
  newrole/
    layout.tsx    # Copy from another layout, change role check and sidebar groups
    dashboard/
      page.tsx
    other-page/
      page.tsx
```

### 3. Add to login page

Update `app/login/page.tsx` to include the new role in the role selector if applicable.

### 4. Add to admin sidebar

Update `components/admin/Sidebar.tsx` to link to the new dashboard.

### 5. Update Firestore rules

Add a `hasRole("NEW_ROLE")` check to any collections the new role should access. Redeploy rules.

### 6. Add to the invite page

Update `app/admin/invite-doctors/page.tsx` so admins can issue invitations for the new role.

## Adding a New Permission Key

1. Add the key to `lib/permissions.ts` in the `ALL_PERMISSIONS` array with `key`, `label`, `description`, and `category`.
2. Add `permission: "new_key"` to the relevant sidebar item in the role's `layout.tsx`.
3. That's it — the `RoleSidebar` component handles filtering automatically.

## CSS Conventions

The app uses Tailwind CSS v4. Key notes:
- **No `@apply` with custom utilities or hover variants** — Tailwind v4 does not support this in `@layer utilities`. Use inline class strings only.
- Custom CSS classes (like `.badge-red`, `.module-header`) are defined in `app/globals.css`.
- Use `cn()` from `lib/utils.ts` (wraps `clsx` + `tailwind-merge`) for conditional class composition.

## TypeScript

All components and pages are `.tsx`. Strict mode is enabled in `tsconfig.json`. Run `npm run build` to catch type errors before deployment — the dev server with `turbo` may not surface all type issues.
