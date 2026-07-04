import { NextRequest, NextResponse } from "next/server";
import { getAuthPayload } from "@/lib/auth";
import { getDbProvider, setDbProvider, type DbProvider } from "@/lib/db-provider";
import { testProviderConnection } from "@/lib/postgres";

async function requireAdmin() {
    const payload = await getAuthPayload();
    if (!payload || payload.role !== "ADMIN") return null;
    return payload;
}

export async function GET() {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }
    return NextResponse.json({ provider: getDbProvider() });
}

export async function POST(req: NextRequest) {
    if (!(await requireAdmin())) {
        return NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    }

    const { provider } = await req.json() as { provider?: string };
    if (provider !== "neon" && provider !== "local" && provider !== "firebase") {
        return NextResponse.json({ error: "provider must be 'neon', 'local', or 'firebase'" }, { status: 400 });
    }

    if (provider === "firebase") {
        return NextResponse.json(
            { error: "Firebase is not yet connected — a service account key is required before it can be selected." },
            { status: 409 }
        );
    }

    const test = await testProviderConnection(provider as Exclude<DbProvider, "firebase">);
    if (!test.ok) {
        return NextResponse.json({ error: `Could not connect to ${provider}: ${test.error}` }, { status: 502 });
    }

    try {
        setDbProvider(provider as DbProvider);
    } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 501 });
    }
    return NextResponse.json({ provider });
}
