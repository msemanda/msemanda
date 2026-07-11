import { NextResponse } from "next/server";
import { clearAuthCookie, getRawAuthPayload } from "@/lib/auth";
import { clearSession } from "@/lib/session-store";

export async function POST() {
    const payload = await getRawAuthPayload();
    await clearAuthCookie();
    if (payload) await clearSession(payload.uid);
    return NextResponse.json({ ok: true });
}
