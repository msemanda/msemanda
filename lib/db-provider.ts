import fs from "fs";
import path from "path";

const ENV_PATH = path.resolve(process.cwd(), ".env.local");
const PROVIDERS = ["neon", "local", "firebase"] as const;
export type DbProvider = typeof PROVIDERS[number];

function isDbProvider(value: string): value is DbProvider {
    return (PROVIDERS as readonly string[]).includes(value);
}

/** Re-reads .env.local on every call so an admin toggle takes effect without a server restart. */
export function getDbProvider(): DbProvider {
    try {
        const content = fs.readFileSync(ENV_PATH, "utf-8");
        const match = content.match(/^DB_PROVIDER=(\S+)/m);
        if (match && isDbProvider(match[1])) return match[1];
    } catch {
        // .env.local missing or unreadable — fall through to default
    }
    return "local";
}

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
    fs.writeFileSync(ENV_PATH, content);
    process.env.DB_PROVIDER = provider;
}
