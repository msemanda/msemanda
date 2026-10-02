# RHD Medical Services — System Overview

## What It Is

RHD Medical Services is a full-stack hospital information system (HIS) built as a Next.js web application. It is designed for medium-sized hospitals and clinics in Uganda and similar contexts. The system covers every care pathway from patient registration through clinical care, ancillary services, pharmacy, and administration.

## Purpose

The system replaces paper-based workflows and fragmented spreadsheets with a unified, role-restricted digital workspace. Every staff category — doctors, nurses, lab technicians, receptionists, and administrators — has a dedicated module with only the tools relevant to their role.

## Technology Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion |
| Icons | Lucide React |
| Backend / Auth | Firebase (Authentication + Firestore) |
| Analytics | Firebase Analytics |
| Hosting | Firebase Hosting (or Vercel) |

## Key Design Principles

- **Invitation-only registration** — staff cannot self-register. Every account is created after an admin sends an email invitation.
- **Role-based routing** — each role logs in to a separate workspace (`/doctor/*`, `/nurse/*`, etc.). Layout components enforce the role check on every page load and redirect unauthorized users to `/login`.
- **Granular permissions** — within each role, individual module access can be granted or revoked by an admin without changing the user's primary role.
- **Superadmin bootstrap** — the email `semandamoses91@gmail.com` is always treated as `ADMIN` by both the app and Firestore rules, bypassing the invitation requirement.
- **Offline-first potential** — Firestore's client SDK caches reads locally, making the app usable on poor connections for read-heavy screens.

## High-Level Flow

```
Browser
  └── Next.js App Router
        ├── /login          → Firebase Auth (email + password)
        ├── /setup          → Account creation (invite validation → Firestore)
        └── /<role>/*       → Role-gated workspace
                                ├── Layout enforces role check
                                ├── RoleSidebar renders filtered nav
                                └── Page reads/writes Firestore collections
```

## Hosted Environment

- **Firebase Project:** `ehealth-8989d`
- **Auth Domain:** `ehealth-8989d.firebaseapp.com`
- **Firestore:** Cloud Firestore (us-central1)
