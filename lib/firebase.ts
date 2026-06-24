import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase is used ONLY for authentication (login, signup, auth state).
// All data storage goes to Neon PostgreSQL — the webpack/turbopack alias in
// next.config.ts replaces every "firebase/firestore" import (including the
// getFirestore call below) with the firestore-shim at build time, so `db`
// becomes a lightweight proxy that routes to Neon. No Firestore data ever
// leaves this machine to Google.
const firebaseConfig = {
  apiKey: "AIzaSyAGQ05zweOEObV2SV4UQ1ZVTmhfkKTh8vA",
  authDomain: "ehealth-8989d.firebaseapp.com",
  projectId: "ehealth-8989d",
  storageBucket: "ehealth-8989d.firebasestorage.app",
  messagingSenderId: "87503451704",
  appId: "1:87503451704:web:fd964134585841b0a918cd",
};

const app  = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

export { app, auth, db };
