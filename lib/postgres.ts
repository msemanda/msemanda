import { Pool } from "pg";

const g = globalThis as typeof globalThis & { __pgPool?: Pool };

const pool: Pool = g.__pgPool ?? new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            ssl: process.env.DATABASE_URL.includes("sslmode=require")
                ? { rejectUnauthorized: false }
                : false,
        }
        : {
            host:     process.env.PG_HOST     || "localhost",
            port:     parseInt(process.env.PG_PORT || "5432"),
            database: process.env.PG_DATABASE || "ehealth",
            user:     process.env.PG_USER     || "postgres",
            password: process.env.PG_PASSWORD || "sema",
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
        }
);

if (process.env.NODE_ENV !== "production") {
    g.__pgPool = pool;
}

pool.on("error", (err) => {
    console.error("Unexpected pg client error:", err.message);
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

export default pool;
