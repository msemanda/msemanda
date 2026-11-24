import pool from "@/lib/postgres";
import bcrypt from "bcryptjs";
import type { UserRole } from "@/types";

export interface AuthUser {
    uid: string;
    email: string;
    name: string;
    role: UserRole;
    permissions: string[];
}

export async function ensureAuthTable(): Promise<void> {
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
}

export async function createAuthUser(
    uid: string,
    email: string,
    password: string,
    name: string,
    role: UserRole,
    permissions: string[] = []
): Promise<AuthUser> {
    await ensureAuthTable();
    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query<AuthUser>(
        `INSERT INTO auth_users (uid, email, password_hash, name, role, permissions)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE
           SET password_hash = EXCLUDED.password_hash,
               name          = EXCLUDED.name,
               role          = EXCLUDED.role,
               permissions   = EXCLUDED.permissions
         RETURNING uid, email, name, role, permissions`,
        [uid, email.toLowerCase().trim(), hash, name.trim(), role, permissions]
    );
    return result.rows[0];
}

export async function verifyAuthUser(
    email: string,
    password: string
): Promise<AuthUser | null> {
    await ensureAuthTable();
    const result = await pool.query(
        `SELECT uid, email, name, role, permissions, password_hash
         FROM auth_users WHERE email = $1`,
        [email.toLowerCase().trim()]
    );
    if (!result.rows[0]) return null;
    const row = result.rows[0];
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return null;
    return { uid: row.uid, email: row.email, name: row.name, role: row.role, permissions: row.permissions };
}

export async function getAuthUser(uid: string): Promise<AuthUser | null> {
    await ensureAuthTable();
    const result = await pool.query<AuthUser>(
        `SELECT uid, email, name, role, permissions FROM auth_users WHERE uid = $1`,
        [uid]
    );
    return result.rows[0] ?? null;
}
