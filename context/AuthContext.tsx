"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { UserProfile } from "@/types";

interface AuthContextType {
    user: { uid: string; email: string } | null;
    profile: UserProfile | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser]       = useState<{ uid: string; email: string } | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/auth/me", { credentials: "same-origin" })
            .then(r => (r.ok ? r.json() : null))
            .then(data => {
                if (data?.authenticated) {
                    setUser({ uid: data.uid, email: data.email });
                    setProfile({
                        uid:         data.uid,
                        email:       data.email,
                        name:        data.name,
                        role:        data.role,
                        permissions: data.permissions ?? [],
                        createdAt:   null,
                    });
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const logout = async () => {
        setLoading(true);
        try {
            await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
        } finally {
            setUser(null);
            setProfile(null);
            setLoading(false);
            try {
                localStorage.clear();
                sessionStorage.clear();
                if ("caches" in window) {
                    const keys = await caches.keys();
                    await Promise.all(keys.map((k) => caches.delete(k)));
                }
            } catch {
                // best-effort — proceed to /login regardless
            }
            window.location.href = "/login";
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
};
