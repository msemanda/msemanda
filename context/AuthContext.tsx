"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserProfile } from "@/types";

const SUPERADMIN_EMAIL = "semandamoses91@gmail.com";

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (!firebaseUser) {
                setProfile(null);
                setLoading(false);
                return;
            }

            // ── Superadmin fast-path ───────────────────────────────────────────
            // semandamoses91@gmail.com is always ADMIN — set the profile
            // immediately from Firebase identity so the UI never blocks on a DB
            // round-trip, then upsert the record into Neon in the background.
            if (firebaseUser.email === SUPERADMIN_EMAIL) {
                const adminProfile: UserProfile = {
                    uid:       firebaseUser.uid,
                    email:     firebaseUser.email!,
                    role:      "ADMIN",
                    name:      firebaseUser.displayName || "System Administrator",
                    createdAt: serverTimestamp(),
                };
                setProfile(adminProfile);
                setLoading(false);

                // Persist / refresh the admin record in Neon (non-blocking)
                setDoc(doc(db, "users", firebaseUser.uid), adminProfile, { merge: true })
                    .catch((err) => console.warn("Admin profile upsert failed:", err));

                // Record session (non-blocking)
                setDoc(doc(db, "sessions", `${firebaseUser.uid}_${Date.now()}`), {
                    uid:        firebaseUser.uid,
                    email:      firebaseUser.email,
                    timestamp:  serverTimestamp(),
                    userAgent:  window.navigator.userAgent,
                    lastActive: serverTimestamp(),
                }).catch(() => {/* telemetry — ignore failures */});

                return;
            }

            // ── Regular users ─────────────────────────────────────────────────
            try {
                const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
                setProfile(docSnap.exists() ? (docSnap.data() as UserProfile) : null);

                // Record session (non-blocking)
                setDoc(doc(db, "sessions", `${firebaseUser.uid}_${Date.now()}`), {
                    uid:        firebaseUser.uid,
                    email:      firebaseUser.email,
                    timestamp:  serverTimestamp(),
                    userAgent:  window.navigator.userAgent,
                    lastActive: serverTimestamp(),
                }).catch(() => {/* telemetry — ignore failures */});
            } catch (error: unknown) {
                console.error("Error fetching user profile:", error);
                setProfile(null);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        setLoading(true);
        try {
            await auth.signOut();
            setUser(null);
            setProfile(null);
            window.location.href = "/login";
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
