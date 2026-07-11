import { NextRequest, NextResponse } from "next/server";
import { verifyAuthUser } from "@/lib/auth-db";
import { signToken, setAuthCookie } from "@/lib/auth";
import { logRequest, getClientIp } from "@/lib/request-log";

export async function POST(req: NextRequest) {
    const started = Date.now();
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent");
    const path = "/api/auth/login";

    const respond = async (body: unknown, status: number, email?: string, uid?: string) => {
        await logRequest({
            method: "POST", path, status,
            userEmail: email, userUid: uid, ip, userAgent,
            durationMs: Date.now() - started,
        });
        return NextResponse.json(body as object, { status });
    };

    try {
        const { email, password } = await req.json();
        if (!email || !password) {
            return await respond({ error: "Email and password are required." }, 400, email);
        }

        const user = await verifyAuthUser(email, password);
        if (!user) {
            return await respond({ error: "Invalid email or password." }, 401, email);
        }

        const token = await signToken({
            uid: user.uid,
            email: user.email,
            name: user.name,
            role: user.role,
            permissions: user.permissions,
        });
        await setAuthCookie(token);

        return await respond(
            { uid: user.uid, email: user.email, name: user.name, role: user.role, permissions: user.permissions },
            200, user.email, user.uid
        );
    } catch (err) {
        console.error("[auth/login]", err);
        return await respond({ error: "Login failed. Please try again." }, 500);
    }
}
