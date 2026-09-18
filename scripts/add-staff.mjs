/**
 * One-off bulk staff import — creates login + profile records directly in
 * Neon PostgreSQL for staff transcribed from a handwritten roster.
 *
 * Run from the project root:
 *   node scripts/add-staff.mjs
 *
 * Prints the generated email + temp password for each person at the end —
 * hand those to the staff member and have them change the password after
 * first login (there is no forced-reset flow yet).
 */

import { readFileSync, existsSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import crypto from "crypto";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");

// ── Load .env.local ───────────────────────────────────────────────────────────
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

// ── Roster transcribed from the handwritten staff list ────────────────────────
// Role mapping notes:
//  - "Midwife" -> NURSE (no separate midwife role in the system)
//  - "Cleaner" -> CLEANER, "Askari" -> SECURITY (new roles added for this import)
//  - "Surgeon" -> DOCTOR, "Dental Surgeon/Officer" -> DENTIST (no separate roles)
//  - "Physiotherapy Receptionist" -> RECEPTIONIST
//  - "Eye Assistant" entries -> OPTICIAN / OPTICIAN_ASSISTANT per instruction
const STAFF = [
    { name: "Aisuka Mariashallon",   role: "NURSE" },
    { name: "Tushiemereirwe Emily",  role: "CASHIER" },
    { name: "Nankumba Judata",       role: "NURSE" },
    { name: "Ktarimpa Phiona",       role: "NURSE" },
    { name: "Nalubega Annet",        role: "LAB_TECH" },
    { name: "Kimbasi Robert",        role: "LAB_TECH" },
    { name: "Nafuna Rebecca",        role: "CLEANER" },
    { name: "Naka Teopista",         role: "SECURITY" },
    { name: "Mwebembezi Sensio",     role: "DOCTOR" },
    { name: "Munata Jamal",          role: "DOCTOR" },
    { name: "Dr. Edward",            role: "DOCTOR" },
    { name: "Dr. Marte",             role: "DOCTOR" },
    { name: "Dr. Denny",             role: "DENTIST" },
    { name: "Dr. Matuola",           role: "DENTIST" },
    { name: "Dr. Lawrence",          role: "DENTIST" },
    { name: "Dr. Selinon",           role: "PHYSIOTHERAPIST" },
    { name: "Alex",                  role: "RECEPTIONIST" },
    { name: "Dominiela",             role: "OPTICIAN" },
    { name: "Rebecca",               role: "OPTICIAN_ASSISTANT" },
];

function slugify(part) {
    return part.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function makeEmail(name, used) {
    const parts = name.replace(/^dr\.?\s+/i, "").trim().split(/\s+/).map(slugify).filter(Boolean);
    let local = parts.join(".");
    let email = `${local}@rhd.com`;
    let n = 2;
    while (used.has(email)) {
        email = `${local}${n}@rhd.com`;
        n++;
    }
    used.add(email);
    return email;
}

function genPassword() {
    return "Rhd@" + crypto.randomBytes(5).toString("base64url");
}

async function ensureTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS auth_users (
            uid          TEXT        PRIMARY KEY,
            email        TEXT        UNIQUE NOT NULL,
            password_hash TEXT       NOT NULL,
            name         TEXT        NOT NULL,
            role         TEXT        NOT NULL,
            permissions  TEXT[]      NOT NULL DEFAULT '{}',
            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            data        JSONB NOT NULL DEFAULT '{}',
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ
        )
    `);
}

async function main() {
    await ensureTables();

    const usedEmails = new Set();
    const results = [];

    for (const person of STAFF) {
        const displayName = person.name.replace(/^dr\.?\s+/i, "Dr. ");
        const email = makeEmail(person.name, usedEmails);
        const password = genPassword();
        const uid = crypto.randomUUID();
        const hash = await bcrypt.hash(password, 12);

        await pool.query(
            `INSERT INTO auth_users (uid, email, password_hash, name, role, permissions)
             VALUES ($1, $2, $3, $4, $5, '{}')
             ON CONFLICT (email) DO NOTHING`,
            [uid, email, hash, displayName, person.role]
        );

        await pool.query(
            `INSERT INTO users (data)
             VALUES ($1::jsonb)`,
            [JSON.stringify({
                uid,
                name: displayName,
                email,
                role: person.role,
                phone: "",
                title: "",
                specialization: "",
                permissions: [],
                createdAt: new Date().toISOString(),
            })]
        );

        results.push({ name: displayName, email, password, role: person.role });
        console.log(`Created ${displayName} (${person.role}) -> ${email}`);
    }

    const reportPath = path.join(__dirname, "../staff-credentials.csv");
    const csv = ["name,email,password,role", ...results.map(r => `"${r.name}",${r.email},${r.password},${r.role}`)].join("\n");
    writeFileSync(reportPath, csv);
    console.log(`\nDone. ${results.length} staff created. Credentials written to ${reportPath}`);
    console.log("Distribute these to staff and have them change their password after first login — this file is not committed (gitignored) but delete it once shared.");

    await pool.end();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
