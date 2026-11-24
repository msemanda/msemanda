/**
 * Converts any timestamp format to a Date object.
 * Handles: Firestore Timestamp (.seconds/.toDate()), ISO strings, Date instances.
 */
export function toDate(v: unknown): Date | null {
    if (!v) return null;
    if (v instanceof Date) return v;
    if (typeof v === "string") return new Date(v);
    if (typeof (v as any).toDate === "function") return (v as any).toDate();
    if (typeof (v as any).seconds === "number") return new Date((v as any).seconds * 1000);
    return null;
}

export function fmtDate(v: unknown, fallback = "—"): string {
    const d = toDate(v);
    return d ? d.toLocaleDateString() : fallback;
}

export function fmtDateTime(v: unknown, fallback = "—"): string {
    const d = toDate(v);
    return d ? d.toLocaleString() : fallback;
}

/** Returns epoch milliseconds for sorting/math, 0 if unparseable. */
export function tsMs(v: unknown): number {
    return toDate(v)?.getTime() ?? 0;
}

/** Days elapsed from timestamp until now, 0 if unparseable. */
export function daysAgo(v: unknown): number {
    const ms = tsMs(v);
    return ms ? Math.floor((Date.now() - ms) / 86_400_000) : 0;
}
