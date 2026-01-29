"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { UserProfile } from "@/types";

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
                    if (docSnap.exists()) {
                        setProfile(docSnap.data() as UserProfile);

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
                            console.warn("Telemetry recording failed, proceeding with profile authorization:", sessionError);
                        }
                    } else {
                        setProfile(null);
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
        await auth.signOut();
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
