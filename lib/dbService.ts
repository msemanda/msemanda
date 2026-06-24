/**
 * Unified data service — Neon PostgreSQL via /api/db/* Next.js API routes.
 * All Firestore-style calls (firebase/firestore imports in pages) are
 * intercepted at build time by the firestore-shim webpack/turbopack alias
 * and routed here automatically. This file is the explicit API for code that
 * imports dbService directly.
 */

export interface QueryFilter {
    field: string;
    op: "==" | "!=" | "<" | "<=" | ">" | ">=" | "in" | "array-contains";
    value: unknown;
}

export interface QueryOptions {
    filters?: QueryFilter[];
    orderByField?: string;
    orderDir?: "asc" | "desc";
    limitTo?: number;
}

async function pgFetch(path: string, init?: RequestInit) {
    const res = await fetch(`/api/db/${path}`, {
        headers: { "Content-Type": "application/json" },
        ...init,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

/** Fetch all documents from a collection, with optional filters/ordering */
export async function dbGetDocs<T = Record<string, unknown>>(
    col: string,
    opts: QueryOptions = {}
): Promise<(T & { id: string })[]> {
    const params = new URLSearchParams();
    if (opts.filters)      params.set("filters",  JSON.stringify(opts.filters));
    if (opts.orderByField) params.set("orderBy",  opts.orderByField);
    if (opts.orderDir)     params.set("orderDir", opts.orderDir);
    if (opts.limitTo)      params.set("limit",    String(opts.limitTo));
    return pgFetch(`${col}?${params.toString()}`);
}

/** Add a new document; returns the new document id */
export async function dbAddDoc(col: string, data: Record<string, unknown>): Promise<string> {
    const result = await pgFetch(col, {
        method: "POST",
        body: JSON.stringify({ ...data, createdAt: new Date().toISOString() }),
    });
    return result.id;
}

/** Update an existing document by id */
export async function dbUpdateDoc(col: string, id: string, data: Partial<Record<string, unknown>>): Promise<void> {
    await pgFetch(`${col}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...data, updatedAt: new Date().toISOString() }),
    });
}

/** Delete a document by id */
export async function dbDeleteDoc(col: string, id: string): Promise<void> {
    await pgFetch(`${col}/${id}`, { method: "DELETE" });
}
