import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// Firebase is used ONLY for authentication (login, signup, auth state).
// All data storage goes to Neon PostgreSQL via the firestore-shim alias.
const firebaseConfig = {
  apiKey: "AIzaSyAGQ05zweOEObV2SV4UQ1ZVTmhfkKTh8vA",
  authDomain: "ehealth-8989d.firebaseapp.com",
  projectId: "ehealth-8989d",
  storageBucket: "ehealth-8989d.firebasestorage.app",
  messagingSenderId: "87503451704",
  appId: "1:87503451704:web:fd964134585841b0a918cd",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

// db is a stub — pages still import it but the firestore-shim intercepts all
// firebase/firestore calls at build time and routes them to Neon, so db is
// never actually used for data operations.
const db = {};

export { app, auth, db };
