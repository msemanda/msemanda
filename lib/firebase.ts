// This project no longer uses Firebase for anything. Authentication is a custom
// JWT + bcrypt stack backed by Postgres (see lib/auth.ts, lib/auth-db.ts), and
// all data storage goes through Neon/local PostgreSQL.
//
// `db` exists only because ~140 pages still write `import { db } from
// "@/lib/firebase"` alongside `import { collection, getDocs, ... } from
// "firebase/firestore"`. That second import is aliased at build time (see
// next.config.ts) to lib/firestore-shim.ts, which routes every call to Postgres
// via /api/db/* REST routes and ignores this handle entirely — it's an inert
// placeholder kept only to satisfy those call sites without touching all of them.
export const db = { __pg: true } as const;
