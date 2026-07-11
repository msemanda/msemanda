import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import type { UserRole } from "@/types";
import { touchSession } from "@/lib/session-store";
import { getSessionSettings } from "@/lib/system-config";

export interface AuthPayload {
    uid: string;
    email: string;
    name: string;
    role: UserRole;
    permissions?: string[];
    sessionId?: string;
}

const secret = () =>
    new TextEncoder().encode(
        process.env.AUTH_SECRET || "rhona-hms-secret-change-in-production"
    );

const COOKIE = "rhona_auth";
const MAX_AGE = 7 * 24 * 60 * 60; // 7 days

export async function signToken(payload: AuthPayload): Promise<string> {
    return new SignJWT(payload as unknown as Record<string, unknown>)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("7d")
        .sign(secret());

}

export async function verifyToken(token: string): Promise<AuthPayload | null> {
    try {
        const { payload } = await jwtVerify(token, secret());
        return payload as unknown as AuthPayload;
    } catch {
        return null;
    }
}

async function isHttps(): Promise<boolean> {
    // Base this on the actual connection, not NODE_ENV: a `next start` (production)
    // deployment served over plain HTTP on a LAN/host machine still needs `secure`
    // off, or browsers silently refuse to store the cookie and login appears to
    // "fail" with no error (it just never persists), while `next dev` on localhost
    // works fine — exactly the host-vs-local mismatch this was causing.
    const h = await headers();
    const proto = h.get("x-forwarded-proto");
    return proto === "https";
}

export async function setAuthCookie(token: string): Promise<void> {
    const jar = await cookies();
    jar.set(COOKIE, token, {
        httpOnly: true,
        secure: await isHttps(),
        sameSite: "lax",
        maxAge: MAX_AGE,
        path: "/",
    });
}

export async function clearAuthCookie(): Promise<void> {
    const jar = await cookies();
    jar.delete(COOKIE);
}

/** Reads and verifies the JWT cookie only — no session-store check. Used by logout, which needs the uid even if the session already expired. */
export async function getRawAuthPayload(): Promise<AuthPayload | null> {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    return verifyToken(token);
}

export async function getAuthPayload(): Promise<AuthPayload | null> {
    const payload = await getRawAuthPayload();
    if (!payload) return null;
    // Tokens issued before session enforcement shipped have no sessionId — let them through untouched.
    if (!payload.sessionId) return payload;

    const { sessionTimeoutMinutes, singleSessionPerUser } = await getSessionSettings();
    const valid = await touchSession(payload.uid, payload.sessionId, sessionTimeoutMinutes, singleSessionPerUser);
    if (!valid) return null;
    return payload;
}
