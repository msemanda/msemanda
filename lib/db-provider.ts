import fs from "fs";
import path from "path";

const ENV_PATH = path.resolve(process.cwd(), ".env.local");
const PROVIDERS = ["neon", "local", "firebase"] as const;
export type DbProvider = typeof PROVIDERS[number];

function isDbProvider(value: string): value is DbProvider {
    return (PROVIDERS as readonly string[]).includes(value);
}

/**
 * Re-reads .env.local on every call so an admin toggle takes effect without a
 * server restart — but .env.local is gitignored and never deployed, so on a
 * hosted platform (Vercel, Firebase App Hosting, etc.) that file simply won't
 * exist. In that case fall back to the real process.env.DB_PROVIDER, which is
 * how those platforms actually inject configured environment variables.
 */
export function getDbProvider(): DbProvider {
    try {
        const content = fs.readFileSync(ENV_PATH, "utf-8");
        const match = content.match(/^DB_PROVIDER=(\S+)/m);
        if (match && isDbProvider(match[1])) return match[1];
    } catch {
        // .env.local missing or unreadable — fall through to process.env
    }
    const envValue = process.env.DB_PROVIDER;
    if (envValue && isDbProvider(envValue)) return envValue;
    return "local";
}

/** Throws if .env.local isn't writable (e.g. a hosted/serverless deployment). */
export function setDbProvider(provider: DbProvider): void {
    let content = "";
    try {
        content = fs.readFileSync(ENV_PATH, "utf-8");
    } catch {
        // no existing file — write a fresh one below
    }
    content = /^DB_PROVIDER=/m.test(content)
        ? content.replace(/^DB_PROVIDER=.*$/m, `DB_PROVIDER=${provider}`)
        : `DB_PROVIDER=${provider}\n${content}`;
    try {
        fs.writeFileSync(ENV_PATH, content);
    } catch (err) {
        throw new Error(
            "Can't write .env.local in this environment (likely a read-only hosted deployment). " +
            "Set the DB_PROVIDER environment variable in your hosting platform's dashboard instead.",
            { cause: err }
        );
    }
    process.env.DB_PROVIDER = provider;
}
