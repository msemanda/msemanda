"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { UserProfile } from "@/types";

const SUPERADMIN_EMAIL = "semandamoses91@gmail.com";

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    logout: () => Promise<void>;
    signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            if (user) {
                try {
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);

                    if (user.email === SUPERADMIN_EMAIL) {
                        // Always ensure superadmin has ADMIN role
                        const existing = docSnap.exists() ? (docSnap.data() as UserProfile) : null;
                        if (!existing || existing.role !== "ADMIN") {
                            const adminProfile: UserProfile = {
                                uid: user.uid,
                                email: user.email!,
                                role: "ADMIN",
                                name: existing?.name || user.displayName || "System Administrator",
                                address: existing?.address,
                                dob: existing?.dob,
                                gender: existing?.gender,
                                createdAt: existing?.createdAt || serverTimestamp(),
                            };
                            await setDoc(docRef, adminProfile, { merge: true });
                            setProfile(adminProfile);
                        } else {
                            setProfile(existing);
                        }
                    } else if (docSnap.exists()) {
                        setProfile(docSnap.data() as UserProfile);
                    } else {
                        setProfile(null);
                    }

                    // Record Session (Non-fatal)
                    try {
                        const sessionRef = doc(db, "sessions", `${user.uid}_${Date.now()}`);
                        await setDoc(sessionRef, {
                            uid: user.uid,
                            email: user.email,
                            timestamp: serverTimestamp(),
                            userAgent: window.navigator.userAgent,
                            lastActive: serverTimestamp()
                        });
                    } catch (sessionError) {
                        console.warn("Telemetry recording failed:", sessionError);
                    }
                } catch (error: any) {
                    if (error.code === 'permission-denied') {
                        console.error("Firestore Permission denied when fetching user profile:", error);
                    } else {
                        console.error("Error fetching user profile:", error);
                    }
                    setProfile(null);
                }
            } else {
                setProfile(null);
            }
            setLoading(false);
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

    const signInWithGoogle = async () => {
        await signInWithPopup(auth, googleProvider);
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, logout, signInWithGoogle }}>
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
