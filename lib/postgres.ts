import { Pool } from "pg";
import { getDbProvider } from "@/lib/db-provider";

const g = globalThis as typeof globalThis & { __pgPools?: Partial<Record<"neon" | "local", Pool>> };
const pools: Partial<Record<"neon" | "local", Pool>> = g.__pgPools ?? {};
if (process.env.NODE_ENV !== "production") {
    g.__pgPools = pools;
}

function buildPool(kind: "neon" | "local"): Pool {
    const pool = kind === "neon"
        ? new Pool({
            connectionString: process.env.NEON_DATABASE_URL,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            ssl: { rejectUnauthorized: false },
        })
        : new Pool({
            host:     process.env.PG_HOST     || "localhost",
            port:     parseInt(process.env.PG_PORT || "5432"),
            database: process.env.PG_DATABASE || "ehealth",
            user:     process.env.PG_USER     || "postgres",
            password: process.env.PG_PASSWORD || "sema",
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        });
    pool.on("error", (err) => {
        console.error(`Unexpected pg client error [${kind}]:`, err.message);
    });
    return pool;
}

function getActivePool(): Pool {
    const provider = getDbProvider();
    if (provider === "firebase") {
        throw new Error("DB_PROVIDER is 'firebase' — Postgres is not the active data source");
    }
    const kind = provider === "neon" ? "neon" : "local";
    if (!pools[kind]) pools[kind] = buildPool(kind);
    return pools[kind]!;
}

// Proxy so existing `pool.query(...)` call sites keep working unchanged while
// transparently targeting whichever Postgres (Neon or local) is live-active.
const pool = new Proxy({} as Pool, {
    get(_target, prop, receiver) {
        const active = getActivePool();
        const value = Reflect.get(active, prop, receiver);
        return typeof value === "function" ? value.bind(active) : value;
    },
});

export async function verifyConnection(): Promise<boolean> {
    try {
        const result = await pool.query("SELECT NOW() as connected_at, current_database() as db");
        console.log(`✓ PostgreSQL connected: ${result.rows[0].db} at ${result.rows[0].connected_at}`);
        return true;
    } catch (err: unknown) {
        console.error("✗ PostgreSQL connection failed:", (err as Error).message);
        return false;
    }
}

/** Tests a specific provider's connectivity without switching the active one. */
export async function testProviderConnection(kind: "neon" | "local"): Promise<{ ok: boolean; error?: string }> {
    const testPool = buildPool(kind);
    try {
        await testPool.query("SELECT 1");
        return { ok: true };
    } catch (err: unknown) {
        return { ok: false, error: (err as Error).message };
    } finally {
        await testPool.end();
    }
}

export default pool;
