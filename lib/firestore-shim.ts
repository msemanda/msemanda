/**
 * Drop-in replacement for firebase/firestore.
 * next.config.ts aliases every `firebase/firestore` import to this file, so no
 * real Firebase package is involved. Routes all calls to /api/db/* REST
 * endpoints backed by PostgreSQL (Neon or local — see lib/db-provider.ts).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- matches firebase/firestore's real (loose) DocumentData type, which the rest of the app is written against
export type DocumentData = { [field: string]: any };

// ── Internal types ────────────────────────────────────────────────────────────

interface CollectionRef { __col: string }
interface DocRef { __col: string; __id: string }
interface WhereConstraint  { type: 'where';   field: string; op: string; value: unknown }
interface OrderByConstraint { type: 'orderBy'; field: string; dir: 'asc' | 'desc' }
interface LimitConstraint   { type: 'limit';  n: number }
type QueryConstraint = WhereConstraint | OrderByConstraint | LimitConstraint;
interface QueryRef { __colRef: CollectionRef; constraints: QueryConstraint[] }

interface SnapshotDoc { id: string; data(): DocumentData; exists(): boolean }
interface QuerySnapshot {
    docs: SnapshotDoc[];
    size: number;
    empty: boolean;
    forEach(cb: (doc: SnapshotDoc) => void): void;
}

// ── Timestamp ─────────────────────────────────────────────────────────────────

export class Timestamp {
    readonly seconds: number;
    readonly nanoseconds: number;
    constructor(seconds: number, nanoseconds: number) {
        this.seconds = seconds;
        this.nanoseconds = nanoseconds;
    }
    toDate(): Date { return new Date(this.seconds * 1000 + this.nanoseconds / 1e6); }
    static fromDate(date: Date): Timestamp {
        return new Timestamp(Math.floor(date.getTime() / 1000), (date.getTime() % 1000) * 1e6);
    }
    static now(): Timestamp { return Timestamp.fromDate(new Date()); }
}

// ── Network helper ────────────────────────────────────────────────────────────

async function pgFetch(path: string, init?: RequestInit): Promise<unknown> {
    const res = await fetch(`/api/db/${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`db/${path} ${res.status}: ${text}`);
    }
    return res.json();
}

function makeDoc(row: DocumentData & { id: string }): SnapshotDoc {
    const { id, ...data } = row;
    return { id, data: () => data, exists: () => true };
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function getFirestore(_app?: unknown): unknown { return { __pg: true }; }

export function collection(_db: unknown, colName: string): CollectionRef {
    return { __col: colName };
}

export function doc(_dbOrCol: unknown, colOrId: string, id?: string): DocRef {
    if (id !== undefined) {
        // doc(db, "collectionName", "docId")
        return { __col: colOrId, __id: id };
    }
    // doc(collectionRef, "docId")
    return { __col: (_dbOrCol as CollectionRef).__col, __id: colOrId };
}

export function query(colRef: CollectionRef, ...constraints: QueryConstraint[]): QueryRef {
    return { __colRef: colRef, constraints };
}

export function where(field: string, op: string, value: unknown): WhereConstraint {
    // Serialize Date objects to ISO strings so they compare correctly against stored ISO timestamps
    const v = value instanceof Date ? value.toISOString() : value;
    return { type: 'where', field, op, value: v };
}

export function orderBy(field: string, dir: 'asc' | 'desc' = 'asc'): OrderByConstraint {
    return { type: 'orderBy', field, dir };
}

export function limit(n: number): LimitConstraint {
    return { type: 'limit', n };
}

export function serverTimestamp(): string {
    return new Date().toISOString();
}

export async function getDocs(queryOrCol: QueryRef | CollectionRef): Promise<QuerySnapshot> {
    let colName: string;
    let constraints: QueryConstraint[] = [];

    if ('constraints' in queryOrCol) {
        colName = queryOrCol.__colRef.__col;
        constraints = queryOrCol.constraints;
    } else {
        colName = (queryOrCol as CollectionRef).__col;
    }

    const params = new URLSearchParams();
    const filters = constraints.filter((c): c is WhereConstraint => c.type === 'where');
    const ob = constraints.find((c): c is OrderByConstraint => c.type === 'orderBy');
    const lim = constraints.find((c): c is LimitConstraint => c.type === 'limit');

    if (filters.length) {
        params.set('filters', JSON.stringify(
            filters.map(f => ({ field: f.field, op: f.op, value: f.value }))
        ));
    }
    if (ob)  { params.set('orderBy', ob.field); params.set('orderDir', ob.dir); }
    if (lim) { params.set('limit', String(lim.n)); }

    const rows = await pgFetch(`${colName}?${params}`) as (DocumentData & { id: string })[];
    const docs = rows.map(makeDoc);
    return { docs, size: docs.length, empty: docs.length === 0, forEach: (cb) => docs.forEach(cb) };
}

export async function getDoc(docRef: DocRef): Promise<SnapshotDoc> {
    try {
        const row = await pgFetch(`${docRef.__col}/${docRef.__id}`) as DocumentData & { id: string };
        return makeDoc(row);
    } catch {
        return { id: docRef.__id, data: () => ({}), exists: () => false };
    }
}

export async function addDoc(colRef: CollectionRef, data: DocumentData): Promise<{ id: string }> {
    const result = await pgFetch(colRef.__col, {
        method: 'POST',
        body: JSON.stringify(data),
    }) as { id: string };
    return { id: result.id };
}

export async function setDoc(
    docRef: DocRef,
    data: DocumentData,
    options?: { merge?: boolean }
): Promise<void> {
    const merge = options?.merge ?? false;
    await pgFetch(`${docRef.__col}/${docRef.__id}?merge=${merge}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

export async function updateDoc(docRef: DocRef, data: Partial<DocumentData>): Promise<void> {
    await pgFetch(`${docRef.__col}/${docRef.__id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
    });
}

export async function deleteDoc(docRef: DocRef): Promise<void> {
    await pgFetch(`${docRef.__col}/${docRef.__id}`, { method: 'DELETE' });
}
