import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { type Analytics, isSupported as analyticsIsSupported, getAnalytics } from "firebase/analytics";

// Firebase is used ONLY for authentication (login, signup, auth state).
// All data storage goes to Neon/local PostgreSQL by default — the webpack/turbopack
// alias in next.config.ts replaces every "firebase/firestore" import (including the
// getFirestore call below) with the firestore-shim at build time, so `db`
// becomes a lightweight proxy that routes to Postgres. Live Firestore writes only
// happen when DB_PROVIDER=firebase, via the server-side Admin SDK — see lib/db-provider.ts.
const firebaseConfig = {
  apiKey: "AIzaSyAGQ05zweOEObV2SV4UQ1ZVTmhfkKTh8vA",
  authDomain: "ehealth-8989d.firebaseapp.com",
  projectId: "ehealth-8989d",
  storageBucket: "ehealth-8989d.firebasestorage.app",
  messagingSenderId: "87503451704",
  appId: "1:87503451704:web:fd964134585841b0a918cd",
  measurementId: "G-6RP6EGHGRR",
};

const app  = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

let analytics: Analytics | null = null;
if (typeof window !== "undefined") {
  analyticsIsSupported().then(supported => {
    if (supported) analytics = getAnalytics(app);
  });
}

export { app, auth, db, analytics };
