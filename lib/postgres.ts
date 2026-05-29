import { Pool } from "pg";

// Only used server-side (API routes) when ISDBREMOTE = false
const pool = new Pool({
    host:     process.env.PG_HOST     || "localhost",
    port:     parseInt(process.env.PG_PORT || "5432"),
    database: process.env.PG_DATABASE || "ehealth",
    user:     process.env.PG_USER     || "postgres",
    password: process.env.PG_PASSWORD || "sema",
});

export default pool;
