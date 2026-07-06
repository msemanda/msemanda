/**
 * Renames the 19 staff accounts created by add-staff.mjs to a
 * lastname@rhd.com email format, updating both auth_users and users
 * tables. Passwords are unchanged. Reads/writes staff-credentials.csv.
 *
 * Run from the project root:
 *   node scripts/update-staff-emails.mjs
 */

import { readFileSync, existsSync, writeFileSync } from "fs";
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
    return { name: m[1], oldEmail: m[2], password: m[3], role: m[4] };
});

function slugify(part) {
    return part.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function lastNameOf(name) {
    const parts = name.replace(/^dr\.?\s+/i, "").trim().split(/\s+/);
    return slugify(parts[parts.length - 1]);
}

async function main() {
    const existing = await pool.query("SELECT email FROM auth_users");
    const usedEmails = new Set(existing.rows.map(r => r.email));

    const renamed = [];
    for (const person of staff) {
        // Free up this person's own current email before checking collisions —
        // it's about to be replaced, so it shouldn't block itself or others.
        usedEmails.delete(person.oldEmail);

        const base = lastNameOf(person.name);
        let email = `${base}@rhd.com`;
        let n = 2;
        while (usedEmails.has(email)) {
            email = `${base}${n}@rhd.com`;
            n++;
        }
        usedEmails.add(email);

        await pool.query(`UPDATE auth_users SET email = $1 WHERE email = $2`, [email, person.oldEmail]);
        await pool.query(
            `UPDATE users SET data = jsonb_set(data, '{email}', to_jsonb($1::text)) WHERE data->>'email' = $2`,
            [email, person.oldEmail]
        );

        console.log(`${person.name}: ${person.oldEmail} -> ${email}`);
        renamed.push({ ...person, email });
    }

    const csv = ["name,email,password,role", ...renamed.map(r => `"${r.name}",${r.email},${r.password},${r.role}`)].join("\n");
    writeFileSync(csvPath, csv);
    console.log(`\nDone. Updated ${renamed.length} accounts. staff-credentials.csv rewritten with new emails.`);

    await pool.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
