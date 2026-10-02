import pool from "@/lib/postgres";

export interface RequestLogEntry {
    method: string;
    path: string;
    status: number;
    userEmail?: string | null;
    userUid?: string | null;
    ip?: string | null;
    userAgent?: string | null;
    durationMs: number;
    query?: Record<string, unknown> | null;
    requestBody?: unknown;
    responseBody?: unknown;
}

const SENSITIVE_KEYS = /password|passwordHash|password_hash|token|secret|authorization/i;

function redact(value: unknown, depth = 0): unknown {
    if (value === null || value === undefined || depth > 4) return value;
    if (Array.isArray(value)) return value.map(v => redact(v, depth + 1));
    if (typeof value === "object") {
        const out: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
            out[key] = SENSITIVE_KEYS.test(key) ? "[REDACTED]" : redact(val, depth + 1);
        }
        return out;
    }
    return value;
}

let ensured = false;
async function ensureTable(): Promise<void> {
    if (ensured) return;
    await pool.query(`
        CREATE TABLE IF NOT EXISTS request_logs (
            id            TEXT        PRIMARY KEY DEFAULT substr(replace(gen_random_uuid()::text, '-', ''), 1, 20),
            method        TEXT        NOT NULL,
            path          TEXT        NOT NULL,
            status        INTEGER     NOT NULL,
            user_email    TEXT,
            user_uid      TEXT,
            ip            TEXT,
            user_agent    TEXT,
            duration_ms   INTEGER     NOT NULL,
            query         JSONB,
            request_body  JSONB,
            response_body JSONB,
            created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
    `);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_request_logs_created_at ON request_logs (created_at DESC)`);
    await pool.query(`CREATE INDEX IF NOT EXISTS idx_request_logs_path ON request_logs (path)`);
    ensured = true;
}

const MAX_ROWS = 2000;

/** Best-effort: logging must never break the request it's observing. */
export async function logRequest(entry: RequestLogEntry): Promise<void> {
    try {
        await ensureTable();
        await pool.query(
            `INSERT INTO request_logs
                (method, path, status, user_email, user_uid, ip, user_agent, duration_ms, query, request_body, response_body)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, $11::jsonb)`,
            [
                entry.method,
                entry.path,
                entry.status,
                entry.userEmail ?? null,
                entry.userUid ?? null,
                entry.ip ?? null,
                entry.userAgent ?? null,
                entry.durationMs,
                entry.query ? JSON.stringify(redact(entry.query)) : null,
                entry.requestBody !== undefined ? JSON.stringify(redact(entry.requestBody)) : null,
                entry.responseBody !== undefined ? JSON.stringify(redact(entry.responseBody)) : null,
            ]
        );
        // Cheap probabilistic prune so the table doesn't grow unbounded — avoids
        // a DELETE on every single insert while still keeping it bounded over time.
        if (Math.random() < 0.02) {
            await pool.query(
                `DELETE FROM request_logs WHERE id NOT IN (SELECT id FROM request_logs ORDER BY created_at DESC LIMIT $1)`,
                [MAX_ROWS]
            );
        }
    } catch (err) {
        console.error("request-log: failed to write entry:", (err as Error).message);
    }
}

export function getClientIp(req: Request): string | null {
    const fwd = req.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim();
    return req.headers.get("x-real-ip");
}

export interface ListLogsOptions {
    pathQuery?: string;
    method?: string;
    /** Inclusive, ISO date (YYYY-MM-DD) or full timestamp. */
    dateFrom?: string;
    /** Inclusive, ISO date (YYYY-MM-DD) or full timestamp — end-of-day is applied for a bare date. */
    dateTo?: string;
    limit?: number;
}

export async function listRequestLogs(opts: ListLogsOptions = {}): Promise<Record<string, unknown>[]> {
    await ensureTable();
    const conditions: string[] = [];
    const values: unknown[] = [];

    if (opts.pathQuery) {
        values.push(`%${opts.pathQuery}%`);
        conditions.push(`path ILIKE $${values.length}`);
    }
    if (opts.method) {
        values.push(opts.method);
        conditions.push(`method = $${values.length}`);
    }
    if (opts.dateFrom) {
        values.push(opts.dateFrom);
        conditions.push(`created_at >= $${values.length}`);
    }
    if (opts.dateTo) {
        // A bare "YYYY-MM-DD" should include the whole day.
        const isBareDate = /^\d{4}-\d{2}-\d{2}$/.test(opts.dateTo);
        values.push(isBareDate ? `${opts.dateTo}T23:59:59.999Z` : opts.dateTo);
        conditions.push(`created_at <= $${values.length}`);
    }

    // Exports need more than the default page size; the route caps this independently.
    const limit = Math.min(opts.limit ?? 150, 5000);
    values.push(limit);

    const sql = `
        SELECT id, method, path, status, user_email, user_uid, ip, user_agent,
               duration_ms, query, request_body, response_body, created_at
        FROM request_logs
        ${conditions.length ? `WHERE ${conditions.join(" AND ")}` : ""}
        ORDER BY created_at DESC
        LIMIT $${values.length}
    `;
    const result = await pool.query(sql, values);
    return result.rows;
}
