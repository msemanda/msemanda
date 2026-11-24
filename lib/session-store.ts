import { randomUUID } from "crypto";
import pool from "@/lib/postgres";

let ensured = false;
async function ensureTable(): Promise<void> {
    if (ensured) return;
    await pool.query(`
        CREATE TABLE IF NOT EXISTS active_sessions (
            uid          TEXT        PRIMARY KEY,
            session_id   TEXT        NOT NULL,
            created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
    ensured = true;
}

/**
 * Called on successful login — always issues a fresh session_id for this user.
 * When single-session enforcement is on, this is what makes a new login
 * immediately invalidate any other device: the old device's JWT still carries
 * the previous session_id, which no longer matches this row.
 */
export async function createSession(uid: string): Promise<string> {
    await ensureTable();
    const sessionId = randomUUID();
    await pool.query(
        `INSERT INTO active_sessions (uid, session_id, created_at, last_seen_at)
         VALUES ($1, $2, NOW(), NOW())
         ON CONFLICT (uid) DO UPDATE SET session_id = $2, created_at = NOW(), last_seen_at = NOW()`,
        [uid, sessionId]
    );
    return sessionId;
}

/**
 * Validates and refreshes (sliding window) a session on each authenticated
 * request. Returns false if the idle timeout has elapsed, or — when
 * `enforceSingleSession` is true — if a different device has since logged in
 * and superseded this session_id.
 */
export async function touchSession(
    uid: string,
    sessionId: string,
    timeoutMinutes: number,
    enforceSingleSession: boolean
): Promise<boolean> {
    await ensureTable();
    const result = await pool.query(
        `UPDATE active_sessions
         SET last_seen_at = NOW()
         WHERE uid = $1
           AND ($4 = false OR session_id = $2)
           AND last_seen_at > NOW() - ($3 || ' minutes')::interval
         RETURNING uid`,
        [uid, sessionId, timeoutMinutes, enforceSingleSession]
    );
    return (result.rowCount ?? 0) > 0;
}

export async function clearSession(uid: string): Promise<void> {
    await ensureTable();
    await pool.query(`DELETE FROM active_sessions WHERE uid = $1`, [uid]);
}
