/**
 * Reverts the 19 imported staff accounts back to firstname.lastname@rhd.com
 * (the original format) — lastname-only turned out to risk collisions since
 * several staff share a first or last name. Updates auth_users + users and
 * rewrites staff-credentials.csv. Passwords are unchanged.
 *
 * Run from the project root:
 *   node scripts/revert-staff-emails.mjs
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
    return { name: m[1], currentEmail: m[2], password: m[3], role: m[4] };
});

function slugify(part) {
    return part.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function firstLastEmail(name) {
    const parts = name.replace(/^dr\.?\s+/i, "").trim().split(/\s+/).map(slugify).filter(Boolean);
    return `${parts.join(".")}@rhd.com`;
}

async function main() {
    const existing = await pool.query("SELECT email FROM auth_users");
    const usedEmails = new Set(existing.rows.map(r => r.email));

    const updated = [];
    for (const person of staff) {
        usedEmails.delete(person.currentEmail);

        let email = firstLastEmail(person.name);
        let n = 2;
        const base = email.replace(/@rhd\.com$/, "");
        while (usedEmails.has(email)) {
            email = `${base}${n}@rhd.com`;
            n++;
        }
        usedEmails.add(email);

        if (email !== person.currentEmail) {
            await pool.query(`UPDATE auth_users SET email = $1 WHERE email = $2`, [email, person.currentEmail]);
            await pool.query(
                `UPDATE users SET data = jsonb_set(data, '{email}', to_jsonb($1::text)) WHERE data->>'email' = $2`,
                [email, person.currentEmail]
            );
        }

        console.log(`${person.name}: ${person.currentEmail} -> ${email}`);
        updated.push({ ...person, email });
    }

    const csv = ["name,email,password,role", ...updated.map(r => `"${r.name}",${r.email},${r.password},${r.role}`)].join("\n");
    writeFileSync(csvPath, csv);
    console.log(`\nDone. Reverted ${updated.length} accounts to firstname.lastname@rhd.com. staff-credentials.csv rewritten.`);

    await pool.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
