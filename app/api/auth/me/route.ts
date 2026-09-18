import { NextResponse } from "next/server";
import { getAuthPayload } from "@/lib/auth";

export async function GET() {
    const payload = await getAuthPayload();
    if (!payload) {
        // 200 (not 401) on purpose: this endpoint is polled on every page load
        // to check session state, and "not logged in" is a normal outcome here,
        // not an error worth flagging red in the browser console/network tab.
        return NextResponse.json({ authenticated: false });
    }
    return NextResponse.json({ authenticated: true, ...payload });
}
