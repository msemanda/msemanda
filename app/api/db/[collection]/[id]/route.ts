/**
 * Single document route: /api/db/[collection]/[id]
 * GET    → fetch one document
 * PATCH  → partial update (merges into data jsonb)
 * DELETE → remove document
 */

import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/postgres";

type Params = { params: { collection: string; id: string } };

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
    return col.replace(/([A-Z])/g, "_$1").toLowerCase();
}

export async function GET(_req: NextRequest, { params }: Params) {
    const { collection: col, id } = params;
    if (!ALLOWED.has(col)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });

    const client = await pool.connect();
    try {
        const result = await client.query(
            `SELECT * FROM ${tableName(col)} WHERE id = $1`,
            [id]
        );
        if (result.rows.length === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
        const row = result.rows[0];
        return NextResponse.json({ id: row.id, ...row.data });
    } finally {
        client.release();
    }
}

export async function PATCH(req: NextRequest, { params }: Params) {
    const { collection: col, id } = params;
    if (!ALLOWED.has(col)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });

    const body = await req.json();
    const client = await pool.connect();
    try {
        // Merge patch into existing jsonb data
        await client.query(
            `UPDATE ${tableName(col)} SET data = data || $1::jsonb, updated_at = NOW() WHERE id = $2`,
            [JSON.stringify(body), id]
        );
        return NextResponse.json({ success: true });
    } finally {
        client.release();
    }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
    const { collection: col, id } = params;
    if (!ALLOWED.has(col)) return NextResponse.json({ error: "Unknown collection" }, { status: 404 });

    const client = await pool.connect();
    try {
        await client.query(`DELETE FROM ${tableName(col)} WHERE id = $1`, [id]);
        return NextResponse.json({ success: true });
    } finally {
        client.release();
    }
}
