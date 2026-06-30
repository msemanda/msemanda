import { NextRequest, NextResponse } from "next/server";
import { verifyAuthUser } from "@/lib/auth-db";
import { signToken, setAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();
        if (!email || !password) {
            return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
        }

        const user = await verifyAuthUser(email, password);
        if (!user) {
            return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
        }

        const token = await signToken({
            uid: user.uid,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
        });
        await setAuthCookie(token);

        return NextResponse.json({ uid: user.uid, email: user.email, name: user.name, role: user.role, permissions: user.permissions });
    } catch (err) {
        console.error("[auth/login]", err);
        return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
    }
}
