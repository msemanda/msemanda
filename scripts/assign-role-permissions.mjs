/**
 * Assigns default module-access permissions to every staff account based on
 * role, mirroring DEFAULT_ROLE_PERMISSIONS in lib/permissions.ts. Overwrites
 * whatever permissions each account currently has. Patients are untouched.
 *
 * Run from the project root:
 *   node scripts/assign-role-permissions.mjs
 */

import { readFileSync, existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.join(__dirname, "../.env.local");
if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf-8").split("\n")) {
        const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
        if (m) process.env[m[1]] = m[2].trim();
    }
}

const NEON_DATABASE_URL = process.env.NEON_DATABASE_URL;
if (!NEON_DATABASE_URL) {
    console.error("NEON_DATABASE_URL is not set in .env.local");
    process.exit(1);
}

const pool = new pg.Pool({
    connectionString: NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});

// Kept in sync with DEFAULT_ROLE_PERMISSIONS in lib/permissions.ts
const ALL_PERMISSION_KEYS = [
    "emr", "cpoe", "order_sets", "diagnostics", "prescriptions", "home_care", "wellness",
    "appointments", "ot",
    "vitals", "nursing_orders", "ward_patients",
    "lab_orders", "radiology_orders", "blood_bank", "pharmacy",
    "physiotherapy", "dental", "dietary", "emergency",
    "patient_admit", "patient_invite", "book_appt", "billing",
    "cashier_billing", "cashier_transactions", "cashier_income", "cashier_expenses", "fee_schedule", "cashier_reports",
    "security_shifts", "visitor_log",
    "optical_exams", "optical_prescriptions", "optical_dispensing",
];

const DEFAULT_ROLE_PERMISSIONS = {
    ADMIN:              ALL_PERMISSION_KEYS,
    DOCTOR:             ["emr", "cpoe", "order_sets", "diagnostics", "prescriptions", "appointments", "ot", "home_care", "wellness"],
    NURSE:              ["emr", "vitals", "nursing_orders", "ward_patients", "home_care"],
    PHARMACY:           ["pharmacy"],
    LAB_TECH:           ["lab_orders", "blood_bank"],
    RADIOLOGY_TECH:     ["radiology_orders"],
    PHYSIOTHERAPIST:    ["physiotherapy", "appointments"],
    DENTIST:            ["dental", "prescriptions", "appointments"],
    DIETITIAN:          ["dietary"],
    EMERGENCY_STAFF:    ["emergency", "vitals", "ward_patients"],
    RECEPTIONIST:       ["patient_admit", "patient_invite", "book_appt", "billing", "appointments"],
    CASHIER:            ["cashier_billing", "cashier_transactions", "cashier_income", "cashier_expenses", "fee_schedule", "cashier_reports"],
    CLEANER:            [],
    SECURITY:           ["security_shifts", "visitor_log"],
    OPTICIAN:           ["optical_exams", "optical_prescriptions", "optical_dispensing"],
    OPTICIAN_ASSISTANT: ["optical_dispensing"],
    PATIENT:            [],
};

async function main() {
    const { rows } = await pool.query("SELECT uid, email, name, role FROM auth_users WHERE role != 'PATIENT'");

    for (const user of rows) {
        const perms = DEFAULT_ROLE_PERMISSIONS[user.role] ?? [];

        await pool.query(`UPDATE auth_users SET permissions = $1 WHERE uid = $2`, [perms, user.uid]);
        await pool.query(
            `UPDATE users SET data = jsonb_set(data, '{permissions}', $1::jsonb) WHERE data->>'uid' = $2`,
            [JSON.stringify(perms), user.uid]
        );

        console.log(`${user.name} (${user.role}): ${perms.length ? perms.join(", ") : "(none)"}`);
    }

    console.log(`\nDone. Updated permissions for ${rows.length} staff accounts.`);
    await pool.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
