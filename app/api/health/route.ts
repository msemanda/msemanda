import { NextResponse } from "next/server";
import pool from "@/lib/postgres";

export async function GET() {
    const start = Date.now();
    try {
        await pool.query("SELECT 1");
        const latencyMs = Date.now() - start;
        const { rows } = await pool.query<{ count: string }>(
            `SELECT COUNT(*) as count FROM sessions WHERE (data->>'timestamp')::timestamptz > NOW() - INTERVAL '24 hours'`
        );
        const activeSessions = parseInt(rows[0]?.count ?? "0", 10);
        return NextResponse.json({ ok: true, latencyMs, activeSessions });
    } catch {
        return NextResponse.json({ ok: false, latencyMs: Date.now() - start, activeSessions: 0 }, { status: 500 });
    }
}
