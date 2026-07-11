import pool from "@/lib/postgres";

export interface SessionSettings {
    sessionTimeoutMinutes: number;
    singleSessionPerUser: boolean;
}

const DEFAULTS: SessionSettings = { sessionTimeoutMinutes: 5, singleSessionPerUser: true };

let cached: { value: SessionSettings; expiresAt: number } | null = null;
const CACHE_MS = 20_000;

/** Reads session settings from the same `system`/"config" document the admin System Configuration page writes. Cached briefly so every request doesn't hit Postgres. */
export async function getSessionSettings(): Promise<SessionSettings> {
    if (cached && cached.expiresAt > Date.now()) return cached.value;
    try {
        const result = await pool.query(`SELECT data FROM system WHERE id = 'config'`);
        const data = result.rows[0]?.data as Partial<SessionSettings> | undefined;
        const value: SessionSettings = {
            sessionTimeoutMinutes:
                typeof data?.sessionTimeoutMinutes === "number" && data.sessionTimeoutMinutes > 0
                    ? data.sessionTimeoutMinutes
                    : DEFAULTS.sessionTimeoutMinutes,
            singleSessionPerUser:
                typeof data?.singleSessionPerUser === "boolean"
                    ? data.singleSessionPerUser
                    : DEFAULTS.singleSessionPerUser,
        };
        cached = { value, expiresAt: Date.now() + CACHE_MS };
        return value;
    } catch (err) {
        console.error("getSessionSettings: falling back to defaults:", (err as Error).message);
        return DEFAULTS;
    }
}
