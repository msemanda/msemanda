import { NextRequest, NextResponse } from "next/server";
import { createAuthUser } from "@/lib/auth-db";
import { signToken, setAuthCookie } from "@/lib/auth";
import type { UserRole } from "@/types";

export async function POST(req: NextRequest) {
    try {
        const { uid, email, password, name, role, permissions = [] } = await req.json();

        if (!uid || !email || !password || !name || !role) {
            return NextResponse.json({ error: "All fields are required." }, { status: 400 });
        }
        if (password.length < 6) {
            return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
        }

        const user = await createAuthUser(uid, email, password, name, role as UserRole, permissions);

        const token = await signToken({
            uid: user.uid,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
        });
        await setAuthCookie(token);

        return NextResponse.json({ uid: user.uid, email: user.email, name: user.name, role: user.role, permissions: user.permissions });
    } catch (err: any) {
        if (err?.code === "23505") {
            return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
        }
        console.error("[auth/register]", err);
        return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
    }
}
