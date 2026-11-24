"use client";

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { UserProfile } from "@/types";

interface AuthContextType {
    user: { uid: string; email: string } | null;
    profile: UserProfile | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session timeout defaults to 5 minutes (configurable in System Config) — poll
// often enough that an expired/superseded session is caught promptly without
// hammering the server.
const POLL_MS = 30_000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser]       = useState<{ uid: string; email: string } | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const wasAuthenticated = useRef(false);

    const checkAuth = useCallback(async () => {
        try {
            const res = await fetch("/api/auth/me", { credentials: "same-origin" });
            const data = res.ok ? await res.json() : null;
            if (data?.authenticated) {
                wasAuthenticated.current = true;
                setUser({ uid: data.uid, email: data.email });
                setProfile({
                    uid:         data.uid,
                    email:       data.email,
                    name:        data.name,
                    role:        data.role,
                    permissions: data.permissions ?? [],
                    createdAt:   null,
                });
            } else {
                const hadSession = wasAuthenticated.current;
                wasAuthenticated.current = false;
                setUser(null);
                setProfile(null);
                // Only force a redirect on a *transition* from authenticated to not
                // (idle timeout or signed in elsewhere) — the first check on a
                // public page like /login is a normal, non-error "not logged in".
                if (hadSession && typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
                    window.location.href = "/login?reason=session-expired";
                }
            }
        } catch {
            // Network hiccup — don't force a logout over a single failed poll.
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuth();
        const id = setInterval(checkAuth, POLL_MS);
        return () => clearInterval(id);
    }, [checkAuth]);

    const logout = async () => {
        setLoading(true);
        try {
            await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
        } finally {
            wasAuthenticated.current = false;
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
