import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { UserRole } from "@/types";

export interface AuthPayload {
    uid: string;
    email: string;
    name: string;
    role: UserRole;
    permissions?: string[];
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

export async function setAuthCookie(token: string): Promise<void> {
    const jar = await cookies();
    jar.set(COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: MAX_AGE,
        path: "/",
    });
}

export async function clearAuthCookie(): Promise<void> {
    const jar = await cookies();
    jar.delete(COOKIE);
}

export async function getAuthPayload(): Promise<AuthPayload | null> {
    const jar = await cookies();
    const token = jar.get(COOKIE)?.value;
    if (!token) return null;
    return verifyToken(token);
}
