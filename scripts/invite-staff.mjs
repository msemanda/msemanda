/**
 * Creates "invites" records for the 19 staff imported by add-staff.mjs who
 * haven't logged in yet (no row in `sessions`), so they can self-activate
 * their account at /setup with their own password instead of relying on the
 * auto-generated temp password in staff-credentials.csv.
 *
 * Run from the project root:
 *   node scripts/invite-staff.mjs
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

const csvPath = path.join(__dirname, "../staff-credentials.csv");
const lines = readFileSync(csvPath, "utf-8").trim().split("\n").slice(1);
const staff = lines.map(line => {
    const m = line.match(/^"([^"]+)",([^,]+),([^,]+),(.+)$/);
    return { name: m[1], email: m[2], role: m[4] };
});

async function main() {
    const { rows: sessionRows } = await pool.query("SELECT DISTINCT data->>'email' as email FROM sessions");
    const loggedIn = new Set(sessionRows.map(r => r.email));

    const toInvite = staff.filter(s => !loggedIn.has(s.email));
    const skipped = staff.filter(s => loggedIn.has(s.email));

    for (const s of skipped) {
        console.log(`Skipping ${s.name} (${s.email}) — already has a login session`);
    }

    for (const s of toInvite) {
        await pool.query(
            `INSERT INTO invites (id, data, created_at)
             VALUES ($1, $2::jsonb, NOW())
             ON CONFLICT (id) DO UPDATE SET data = $2::jsonb, updated_at = NOW()`,
            [s.email, JSON.stringify({
                email: s.email,
                role: s.role,
                invitedBy: "Administrator",
                invitedAt: new Date().toISOString(),
                used: false,
            })]
        );
        console.log(`Invited ${s.name} (${s.role}) -> ${s.email}`);
    }

    console.log(`\nDone. Invited ${toInvite.length} staff, skipped ${skipped.length} already logged in.`);
    console.log("They can activate at /setup using their email — this resets any account already created via add-staff.mjs to let them set their own password.");
    await pool.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
