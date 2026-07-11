import { NextRequest, NextResponse } from "next/server";
import { getAuthPayload } from "@/lib/auth";
import { listRequestLogs } from "@/lib/request-log";

export async function GET(req: NextRequest) {
    const payload = await getAuthPayload();
    if (!payload || payload.role !== "ADMIN") {
        return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const pathQuery = searchParams.get("path") || undefined;
    const method = searchParams.get("method") || undefined;

    try {
        const logs = await listRequestLogs({ pathQuery, method });
        return NextResponse.json({ logs });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
