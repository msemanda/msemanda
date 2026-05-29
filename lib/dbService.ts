/**
 * Unified data service.
 * ISDBREMOTE = true  → Firebase Firestore (direct SDK)
 * ISDBREMOTE = false → PostgreSQL via /api/db/* Next.js API routes
 */

import { ISDBREMOTE } from "@/helpers/constants";
import { db } from "@/lib/firebase";
import {
    collection, getDocs, addDoc, updateDoc, deleteDoc,
    doc, query, where, orderBy, limit, serverTimestamp,
    QueryConstraint, DocumentData,
} from "firebase/firestore";

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

// ── Helpers ────────────────────────────────────────────────────────────────────

function buildFirestoreQuery(col: string, opts: QueryOptions = {}) {
    const constraints: QueryConstraint[] = [];
    for (const f of opts.filters || []) {
        constraints.push(where(f.field, f.op as any, f.value));
    }
    if (opts.orderByField) constraints.push(orderBy(opts.orderByField, opts.orderDir || "asc"));
    if (opts.limitTo)      constraints.push(limit(opts.limitTo));
    return query(collection(db, col), ...constraints);
}

async function pgFetch(path: string, init?: RequestInit) {
    const res = await fetch(`/api/db/${path}`, {
        headers: { "Content-Type": "application/json" },
        ...init,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
}

// ── Public API ─────────────────────────────────────────────────────────────────

/** Fetch all documents from a collection, with optional filters/ordering */
export async function dbGetDocs<T = DocumentData>(
    col: string,
    opts: QueryOptions = {}
): Promise<(T & { id: string })[]> {
    if (ISDBREMOTE) {
        const snap = await getDocs(buildFirestoreQuery(col, opts));
        return snap.docs.map(d => ({ id: d.id, ...d.data() } as T & { id: string }));
    }
    const params = new URLSearchParams();
    if (opts.filters)      params.set("filters",  JSON.stringify(opts.filters));
    if (opts.orderByField) params.set("orderBy",  opts.orderByField);
    if (opts.orderDir)     params.set("orderDir", opts.orderDir);
    if (opts.limitTo)      params.set("limit",    String(opts.limitTo));
    return pgFetch(`${col}?${params.toString()}`);
}

/** Add a new document; returns the new document id */
export async function dbAddDoc(col: string, data: DocumentData): Promise<string> {
    if (ISDBREMOTE) {
        const ref = await addDoc(collection(db, col), {
            ...data,
            createdAt: serverTimestamp(),
        });
        return ref.id;
    }
    const result = await pgFetch(col, {
        method: "POST",
        body: JSON.stringify({ ...data, createdAt: new Date().toISOString() }),
    });
    return result.id;
}

/** Update an existing document by id */
export async function dbUpdateDoc(col: string, id: string, data: Partial<DocumentData>): Promise<void> {
    if (ISDBREMOTE) {
        await updateDoc(doc(db, col, id), {
            ...data,
            updatedAt: serverTimestamp(),
        });
        return;
    }
    await pgFetch(`${col}/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ ...data, updatedAt: new Date().toISOString() }),
    });
}

/** Delete a document by id */
export async function dbDeleteDoc(col: string, id: string): Promise<void> {
    if (ISDBREMOTE) {
        await deleteDoc(doc(db, col, id));
        return;
    }
    await pgFetch(`${col}/${id}`, { method: "DELETE" });
}
