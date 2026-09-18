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
    const dateFrom = searchParams.get("dateFrom") || undefined;
    const dateTo = searchParams.get("dateTo") || undefined;
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    try {
        const logs = await listRequestLogs({ pathQuery, method, dateFrom, dateTo, limit });
        return NextResponse.json({ logs });
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
}
