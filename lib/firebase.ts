import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAGQ05zweOEObV2SV4UQ1ZVTmhfkKTh8vA",
  authDomain: "ehealth-8989d.firebaseapp.com",
  projectId: "ehealth-8989d",
  storageBucket: "ehealth-8989d.firebasestorage.app",
  messagingSenderId: "87503451704",
  appId: "1:87503451704:web:fd964134585841b0a918cd",
  measurementId: "G-6RP6EGHGRR"
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) getAnalytics(app);
  });
}

export { app, auth, db };
