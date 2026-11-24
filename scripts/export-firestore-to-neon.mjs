/**
 * Firestore → Neon migration (client SDK — no service account needed)
 *
 * Uses your existing Firebase project credentials + admin email/password
 * to sign in, read every collection, and insert into Neon PostgreSQL.
 *
 * Run from the project root:
 *   node scripts/export-firestore-to-neon.mjs
 *
 * You will be prompted for your Firebase admin email and password.
 */

import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import readline from "readline";
import { createRequire } from "module";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require   = createRequire(import.meta.url);

// ── Load .env.local ───────────────────────────────────────────────────────────

const envPath = path.join(__dirname, "../.env.local");
if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
        const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
        if (m) process.env[m[1]] = m[2].trim();
    }
}

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
    console.error("❌  DATABASE_URL is not set in .env.local");
    process.exit(1);
}

// ── Firebase config (from lib/firebase.ts) ────────────────────────────────────

const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyAGQ05zweOEObV2SV4UQ1ZVTmhfkKTh8vA",
    authDomain:        "ehealth-8989d.firebaseapp.com",
    projectId:         "ehealth-8989d",
    storageBucket:     "ehealth-8989d.firebasestorage.app",
    messagingSenderId: "87503451704",
    appId:             "1:87503451704:web:fd964134585841b0a918cd",
};

// ── Collections: Firestore name → Postgres table ──────────────────────────────

const COLLECTIONS = [
    ["users",               "users"],
    ["invites",             "invites"],
    ["sessions",            "sessions"],
    ["system",              "system"],
    ["admissions",          "admissions"],
    ["appointments",        "appointments"],
    ["diagnostics",         "diagnostics"],
    ["consultationFees",    "consultation_fees"],
    ["bills",               "bills"],
    ["patientBills",        "patient_bills"],
    ["transactions",        "transactions"],
    ["feeSchedule",         "fee_schedule"],
    ["orders",              "orders"],
    ["cpoeOrders",          "cpoe_orders"],
    ["labOrders",           "lab_orders"],
    ["radiologyOrders",     "radiology_orders"],
    ["otSchedules",         "ot_schedules"],
    ["bloodBank",           "blood_bank"],
    ["ipdAdmissions",       "ipd_admissions"],
    ["ipdTransfers",        "ipd_transfers"],
    ["ipdOrders",           "ipd_orders"],
    ["cssdItems",           "cssd_items"],
    ["cssdCycles",          "cssd_cycles"],
    ["cssdDispatch",        "cssd_dispatch"],
    ["hkTasks",             "hk_tasks"],
    ["hkSchedules",         "hk_schedules"],
    ["maintEquipment",      "maint_equipment"],
    ["maintRequests",       "maint_requests"],
    ["maintAlerts",         "maint_alerts"],
    ["fixedAssets",         "fixed_assets"],
    ["qualityAudits",       "quality_audits"],
    ["infectionIncidents",  "infection_incidents"],
    ["incidents",           "incidents"],
    ["homeCareVisits",      "home_care_visits"],
    ["emergencyCases",      "emergency_cases"],
    ["pharmacyStock",       "pharmacy_stock"],
    ["dispensingRecords",   "dispensing_records"],
    ["categories",          "categories"],
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function prompt(question) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => rl.question(question, (ans) => { rl.close(); resolve(ans); }));
}

function promptPassword(question) {
    return new Promise((resolve) => {
        process.stdout.write(question);
        const rl = readline.createInterface({ input: process.stdin, output: null, terminal: false });
        process.stdin.setRawMode?.(true);
        let pw = "";
        process.stdin.on("data", function handler(ch) {
            ch = ch.toString();
            if (ch === "\r" || ch === "\n") {
                process.stdin.setRawMode?.(false);
                process.stdin.removeListener("data", handler);
                process.stdout.write("\n");
                rl.close();
                resolve(pw);
            } else if (ch === "") {
                process.exit();
            } else if (ch === "") {
                pw = pw.slice(0, -1);
            } else {
                pw += ch;
                process.stdout.write("*");
            }
        });
    });
}

// Serialize Firestore Timestamps and other special types to plain values
function serialize(obj) {
    return JSON.parse(JSON.stringify(obj, (_key, val) => {
        if (val && typeof val === "object") {
            // Firestore Timestamp from client SDK
            if (typeof val.toDate === "function") return val.toDate().toISOString();
            // Firestore Timestamp seconds/nanoseconds shape
            if ("seconds" in val && "nanoseconds" in val) {
                return new Date(val.seconds * 1000).toISOString();
            }
        }
        return val;
    }));
}

// ── Sign in via Firebase Auth REST API ────────────────────────────────────────
// This avoids needing the Firebase client SDK as an npm dependency.

async function signInWithPassword(email, password) {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_CONFIG.apiKey}`;
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
    });
    if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.message || "Authentication failed");
    }
    const data = await res.json();
    return data.idToken;
}

// ── Read a Firestore collection via REST API ──────────────────────────────────

async function readCollection(colName, idToken) {
    const projectId = FIREBASE_CONFIG.projectId;
    const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${colName}`;
    const docs = [];
    let pageToken = null;

    do {
        const url = pageToken ? `${base}?pageToken=${pageToken}` : base;
        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${idToken}` },
        });

        if (!res.ok) {
            const txt = await res.text();
            // 404 just means the collection doesn't exist yet — that's fine
            if (res.status === 404) break;
            throw new Error(`Firestore REST error for ${colName}: ${res.status} ${txt}`);
        }

        const data = await res.json();
        pageToken = data.nextPageToken || null;

        for (const doc of (data.documents || [])) {
            const id = doc.name.split("/").pop();
            const fields = convertFirestoreFields(doc.fields || {});
            docs.push({ id, ...fields });
        }
    } while (pageToken);

    return docs;
}

// Convert Firestore REST API field format to plain JS objects
function convertFirestoreFields(fields) {
    const out = {};
    for (const [key, val] of Object.entries(fields)) {
        out[key] = convertFirestoreValue(val);
    }
    return out;
}

function convertFirestoreValue(val) {
    if ("stringValue"    in val) return val.stringValue;
    if ("integerValue"   in val) return parseInt(val.integerValue, 10);
    if ("doubleValue"    in val) return val.doubleValue;
    if ("booleanValue"   in val) return val.booleanValue;
    if ("nullValue"      in val) return null;
    if ("timestampValue" in val) return val.timestampValue; // already ISO string
    if ("arrayValue"     in val) return (val.arrayValue.values || []).map(convertFirestoreValue);
    if ("mapValue"       in val) return convertFirestoreFields(val.mapValue.fields || {});
    if ("bytesValue"     in val) return val.bytesValue;
    if ("referenceValue" in val) return val.referenceValue;
    return null;
}

// ── Postgres insert ───────────────────────────────────────────────────────────

async function insertDocs(pool, pgTable, docs) {
    if (docs.length === 0) return 0;
    const client = await pool.connect();
    let count = 0;
    try {
        await client.query("BEGIN");
        for (const doc of docs) {
            const { id, ...data } = doc;
            const createdAt = data.createdAt || new Date().toISOString();
            await client.query(
                `INSERT INTO ${pgTable} (id, data, created_at)
                 VALUES ($1, $2::jsonb, $3)
                 ON CONFLICT (id) DO UPDATE
                   SET data = EXCLUDED.data, updated_at = NOW()`,
                [id, JSON.stringify(serialize(data)), createdAt]
            );
            count++;
        }
        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }
    return count;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log("\n🔄  Firestore → Neon migration (client SDK)\n");

    // Get credentials
    const email    = await prompt("Firebase admin email: ");
    const password = process.stdin.isTTY
        ? await promptPassword("Password: ")
        : await prompt("Password: ");

    // Sign in
    process.stdout.write("\n🔐 Authenticating... ");
    let idToken;
    try {
        idToken = await signInWithPassword(email, password);
        console.log("✓");
    } catch (err) {
        console.error(`\n❌  ${err.message}`);
        process.exit(1);
    }

    // Connect to Neon
    const { Pool } = require("pg");
    const pool = new Pool({
        connectionString: DATABASE_URL,
        ssl: DATABASE_URL.includes("sslmode=require") ? { rejectUnauthorized: false } : false,
    });

    try {
        const r = await pool.query("SELECT current_database() AS db");
        console.log(`✓  Connected to Neon: ${r.rows[0].db}\n`);
    } catch (err) {
        console.error("❌  Neon connection failed:", err.message);
        process.exit(1);
    }

    // Migrate each collection
    let total = 0;
    for (const [fsCol, pgTable] of COLLECTIONS) {
        try {
            process.stdout.write(`   ${fsCol.padEnd(22)} → ${pgTable.padEnd(22)} `);
            const docs = await readCollection(fsCol, idToken);
            if (docs.length === 0) {
                console.log("(empty)");
                continue;
            }
            const n = await insertDocs(pool, pgTable, docs);
            total += n;
            console.log(`✓  ${n} docs`);
        } catch (err) {
            console.log(`✗  ${err.message}`);
        }
    }

    await pool.end();
    console.log(`\n✅  Done — ${total} documents migrated to Neon.\n`);
}

main().catch((err) => {
    console.error("Fatal:", err.message);
    process.exit(1);
});
