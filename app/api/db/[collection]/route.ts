/**
 * Generic collection route: /api/db/[collection]
 * GET  → list documents (supports ?filters, ?orderBy, ?orderDir, ?limit)
 * POST → insert document, returns { id }
 */

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/postgres";
import { getAuthPayload } from "@/lib/auth";
import { logRequest, getClientIp } from "@/lib/request-log";

type Params = { params: Promise<{ collection: string }> };

// Whitelist of allowed collection names (mirrors Firestore collections)
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
    "feeSchedule",
    "dentalRecords", "physiotherapyPatients", "wellnessEnrollments",
    "homeCarePatients", "bloodInventory", "bloodRequests", "wellnessPrograms",
    "nurseShifts", "nurseHandovers",
    "physiotherapySessions", "physiotherapyPlans",
    "dentalAppointments", "dentalXrays",
    "dietPlans", "dietaryMenuItems", "dietaryAssessments",
    "ambulanceUnits", "ambulanceCalls", "emergencyLogs",
    "wellnessSessions", "homeCareRoutes",
    "messages", "notifications",
    "securityShifts", "visitorLogs",
    "opticalExams", "opticalPrescriptions", "opticalOrders",
    "beds",
]);

function tableName(col: string) {
    // camelCase → snake_case
    return col.replace(/([A-Z])/g, "_$1").toLowerCase();
}

// Tables are normally pre-created via helpers/schema.sql, but that's a manual
// step — lazily create on first use so a newly-added collection (like this
// route's ALLOWED entry) works immediately without a separate migration run.
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

export async function GET(req: NextRequest, { params }: Params) {
    const started = Date.now();
    const { collection: col } = await params;
    const path = `/api/db/${col}`;
    const auth = await getAuthPayload();
    const { searchParams } = new URL(req.url);
    const queryObj = Object.fromEntries(searchParams.entries());

    const respond = async (body: unknown, status: number) => {
        await logRequest({
            method: "GET", path, status,
            userEmail: auth?.email, userUid: auth?.uid,
            ip: getClientIp(req), userAgent: req.headers.get("user-agent"),
            durationMs: Date.now() - started,
            query: queryObj,
            responseBody: body,
        });
        return NextResponse.json(body as object, { status });
    };

    if (!ALLOWED.has(col)) return respond({ error: "Unknown collection" }, 404);

    const table = tableName(col);
    await ensureTable(table);

    let sql = `SELECT * FROM ${table}`;
    const values: unknown[] = [];
    const conditions: string[] = [];

    // Filters: [{ field, op, value }]
    const rawFilters = searchParams.get("filters");
    if (rawFilters) {
        const filters: { field: string; op: string; value: unknown }[] = JSON.parse(rawFilters);
        for (const f of filters) {
            if (f.op === "==") {
                values.push(f.value);
                conditions.push(`data->>'${f.field}' = $${values.length}`);
            } else if (f.op === "!=") {
                values.push(f.value);
                conditions.push(`data->>'${f.field}' != $${values.length}`);
            } else if (["<", "<=", ">", ">="].includes(f.op)) {
                values.push(f.value);
                if (typeof f.value === "number") {
                    conditions.push(`(data->>'${f.field}')::numeric ${f.op} $${values.length}`);
                } else {
                    // ISO date strings and other text — lexicographic comparison (ISO dates are sortable)
                    conditions.push(`data->>'${f.field}' ${f.op} $${values.length}`);
                }
            }
        }
    }

    if (conditions.length > 0) sql += ` WHERE ${conditions.join(" AND ")}`;

    const orderBy = searchParams.get("orderBy");
    if (orderBy) {
        const dir = searchParams.get("orderDir") === "desc" ? "DESC" : "ASC";
        sql += ` ORDER BY data->>'${orderBy}' ${dir}`;
    } else {
        sql += ` ORDER BY created_at DESC`;
    }

    const limitVal = searchParams.get("limit");
    if (limitVal) {
        sql += ` LIMIT ${parseInt(limitVal)}`;
    }

    const client = await pool.connect();
    try {
        const result = await client.query(sql, values);
        const rows = result.rows.map(r => ({ id: r.id, ...r.data }));
        // Log a count, not the full list — list responses can be large and this
        // is an audit trail, not a data export.
        await logRequest({
            method: "GET", path, status: 200,
            userEmail: auth?.email, userUid: auth?.uid,
            ip: getClientIp(req), userAgent: req.headers.get("user-agent"),
            durationMs: Date.now() - started,
            query: queryObj,
            responseBody: { count: rows.length },
        });
        return NextResponse.json(rows);
    } catch (err) {
        return await respond({ error: (err as Error).message }, 500);
    } finally {
        client.release();
    }
}

export async function POST(req: NextRequest, { params }: Params) {
    const started = Date.now();
    const { collection: col } = await params;
    const path = `/api/db/${col}`;
    const auth = await getAuthPayload();
    const body = await req.json();

    const respond = async (resBody: unknown, status: number) => {
        await logRequest({
            method: "POST", path, status,
            userEmail: auth?.email, userUid: auth?.uid,
            ip: getClientIp(req), userAgent: req.headers.get("user-agent"),
            durationMs: Date.now() - started,
            requestBody: body,
            responseBody: resBody,
        });
        return NextResponse.json(resBody as object, { status });
    };

    if (!ALLOWED.has(col)) return respond({ error: "Unknown collection" }, 404);

    const table = tableName(col);
    await ensureTable(table);

    const client = await pool.connect();
    try {
        const result = await client.query(
            `INSERT INTO ${table} (data, created_at) VALUES ($1::jsonb, NOW()) RETURNING id`,
            [JSON.stringify(body)]
        );
        return await respond({ id: result.rows[0].id }, 201);
    } catch (err) {
        return await respond({ error: (err as Error).message }, 500);
    } finally {
        client.release();
    }
}
