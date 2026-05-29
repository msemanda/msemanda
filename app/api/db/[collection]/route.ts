/**
 * Generic collection route: /api/db/[collection]
 * GET  → list documents (supports ?filters, ?orderBy, ?orderDir, ?limit)
 * POST → insert document, returns { id }
 */

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/postgres";

type Params = { params: { collection: string } };

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
    "pharmacyStock", "dispensingRecords",
]);

function tableName(col: string) {
    // camelCase → snake_case
    return col.replace(/([A-Z])/g, "_$1").toLowerCase();
}

export async function GET(req: NextRequest, { params }: Params) {
    const col = params.collection;
    if (!ALLOWED.has(col)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });

    const table = tableName(col);
    const { searchParams } = new URL(req.url);

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
                conditions.push(`(data->>'${f.field}')::numeric ${f.op} $${values.length}`);
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
        return NextResponse.json(rows);
    } finally {
        client.release();
    }
}

export async function POST(req: NextRequest, { params }: Params) {
    const col = params.collection;
    if (!ALLOWED.has(col)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });

    const table = tableName(col);
    const body = await req.json();

    const client = await pool.connect();
    try {
        const result = await client.query(
            `INSERT INTO ${table} (data, created_at) VALUES ($1::jsonb, NOW()) RETURNING id`,
            [JSON.stringify(body)]
        );
        return NextResponse.json({ id: result.rows[0].id }, { status: 201 });
    } finally {
        client.release();
    }
}
