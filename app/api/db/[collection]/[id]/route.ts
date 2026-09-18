/**
 * Single document route: /api/db/[collection]/[id]
 * GET    → fetch one document
 * PATCH  → partial update (merges into data jsonb)
 * PUT    → upsert (?merge=true merges, ?merge=false replaces)
 * DELETE → remove document
 */

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/postgres";
import { getAuthPayload } from "@/lib/auth";
import { logRequest, getClientIp } from "@/lib/request-log";

type Params = { params: Promise<{ collection: string; id: string }> };

const ALLOWED = new Set([
    "users", "invites", "admissions", "system", "sessions",
    "bills", "consultationFees", "diagnostics", "appointments",
    "labOrders", "radiologyOrders", "orders", "otSchedules", "bloodBank",
    "transactions", "cpoeOrders", "patientBills",
    "ipdAdmissions", "ipdTransfers", "ipdOrders",
    "cssdItems", "cssdCycles", "cssdDispatch",
    "hkTasks", "hkSchedules",
    "maintEquipment", "maintRequests", "maintAlerts",
    "fixedAssets", "qualityAudits", "infectionIncidents",
    "incidents", "homeCareVisits", "emergencyCases",
    "pharmacyStock", "dispensingRecords", "categories",
    "feeSchedule", "messages", "notifications",
    "securityShifts", "visitorLogs",
    "opticalExams", "opticalPrescriptions", "opticalOrders",
    "bloodInventory", "bloodRequests",
    "beds", "dentalCharts",
]);

function tableName(col: string) {
    return col.replace(/([A-Z])/g, "_$1").toLowerCase();
}

// Mirrors the lazy table creation in the sibling [collection]/route.ts —
// tables are normally pre-created via helpers/schema.sql, but that's a
// manual step, so a newly-whitelisted collection works immediately here too.
const ensuredTables = new Set<string>();
async function ensureTable(table: string): Promise<void> {
    if (ensuredTables.has(table)) return;
    await pool.query(`
        CREATE TABLE IF NOT EXISTS ${table} (
            id          TEXT        PRIMARY KEY DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 20),
            data        JSONB       NOT NULL DEFAULT '{}',
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ
        )
    `);
    ensuredTables.add(table);
}

async function log(req: NextRequest, method: string, path: string, status: number, opts: {
    requestBody?: unknown; responseBody?: unknown; started: number;
}) {
    const auth = await getAuthPayload();
    await logRequest({
        method, path, status,
        userEmail: auth?.email, userUid: auth?.uid,
        ip: getClientIp(req), userAgent: req.headers.get("user-agent"),
        durationMs: Date.now() - opts.started,
        requestBody: opts.requestBody,
        responseBody: opts.responseBody,
    });
}

export async function GET(req: NextRequest, { params }: Params) {
    const started = Date.now();
    const { collection: col, id } = await params;
    const path = `/api/db/${col}/${id}`;

    if (!ALLOWED.has(col)) {
        await log(req, "GET", path, 404, { started, responseBody: { error: "Unknown collection" } });
        return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
    }
    await ensureTable(tableName(col));

    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT * FROM ${tableName(col)} WHERE id = $1`,
            [id]
        );
        if (result.rows.length === 0) {
            await log(req, "GET", path, 404, { started, responseBody: { error: "Not found" } });
            return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        const row = result.rows[0];
        const body = { id: row.id, ...row.data };
        await log(req, "GET", path, 200, { started, responseBody: body });
        return NextResponse.json(body);
    } catch (err) {
        await log(req, "GET", path, 500, { started, responseBody: { error: (err as Error).message } });
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    const started = Date.now();
    const { collection: col, id } = await params;
    const path = `/api/db/${col}/${id}`;
    const body = await req.json();

    if (!ALLOWED.has(col)) {
        await log(req, "PATCH", path, 404, { started, requestBody: body, responseBody: { error: "Unknown collection" } });
        return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
    }
    await ensureTable(tableName(col));

    const client = await pool.connect();
    try {
        await client.query(
            `UPDATE ${tableName(col)} SET data = data || $1::jsonb, updated_at = NOW() WHERE id = $2`,
            [JSON.stringify(body), id]
        );
        await log(req, "PATCH", path, 200, { started, requestBody: body, responseBody: { success: true } });
        return NextResponse.json({ success: true });
    } catch (err) {
        await log(req, "PATCH", path, 500, { started, requestBody: body, responseBody: { error: (err as Error).message } });
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function PUT(req: NextRequest, { params }: Params) {
    const started = Date.now();
    const { collection: col, id } = await params;
    const path = `/api/db/${col}/${id}`;

    const { searchParams } = new URL(req.url);
    const merge = searchParams.get("merge") === "true";
    const body = await req.json();
    const table = tableName(col);

    if (!ALLOWED.has(col)) {
        await log(req, "PUT", path, 404, { started, requestBody: body, responseBody: { error: "Unknown collection" } });
        return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
    }
    await ensureTable(table);

    const client = await pool.connect();
    try {
        if (merge) {
            await client.query(
                `INSERT INTO ${table} (id, data, created_at) VALUES ($1, $2::jsonb, NOW())
                 ON CONFLICT (id) DO UPDATE SET data = ${table}.data || $2::jsonb, updated_at = NOW()`,
                [id, JSON.stringify(body)]
            );
        } else {
            await client.query(
                `INSERT INTO ${table} (id, data, created_at) VALUES ($1, $2::jsonb, NOW())
                 ON CONFLICT (id) DO UPDATE SET data = $2::jsonb, updated_at = NOW()`,
                [id, JSON.stringify(body)]
            );
        }
        await log(req, "PUT", path, 200, { started, requestBody: body, responseBody: { id } });
        return NextResponse.json({ id });
    } catch (err) {
        await log(req, "PUT", path, 500, { started, requestBody: body, responseBody: { error: (err as Error).message } });
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}

export async function DELETE(req: NextRequest, { params }: Params) {
    const started = Date.now();
    const { collection: col, id } = await params;
    const path = `/api/db/${col}/${id}`;

    if (!ALLOWED.has(col)) {
        await log(req, "DELETE", path, 404, { started, responseBody: { error: "Unknown collection" } });
        return NextResponse.json({ error: "Unknown collection" }, { status: 404 });
    }
    await ensureTable(tableName(col));

    const client = await pool.connect();
    try {
        await client.query(`DELETE FROM ${tableName(col)} WHERE id = $1`, [id]);
        await log(req, "DELETE", path, 200, { started, responseBody: { success: true } });
        return NextResponse.json({ success: true });
    } catch (err) {
        await log(req, "DELETE", path, 500, { started, responseBody: { error: (err as Error).message } });
        return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    } finally {
        client.release();
    }
}
