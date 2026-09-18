"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import Link from "next/link";
import { ClipboardList, Search, Clock, Loader2, RefreshCw, Scan, ArrowRight, AlertCircle } from "lucide-react";

interface ImagingOrder {
    id: string;
    patientName: string;
    patientEmail?: string;
    ward?: string;
    detail: string;
    notes?: string;
    priority: string;
    orderedBy?: string;
    status: string;
    amount?: number;
    paymentStatus?: string;
    createdAt?: any;
}

const PRIORITY_BADGE: Record<string, string> = {
    STAT:    "bg-red-50 text-red-600 border border-red-100",
    URGENT:  "bg-amber-50 text-amber-700 border border-amber-100",
    ROUTINE: "bg-blue-50 text-blue-700 border border-blue-100",
};

const STATUS_BADGE: Record<string, string> = {
    PENDING:     "bg-amber-50 text-amber-700 border border-amber-100",
    IN_PROGRESS: "bg-blue-50 text-blue-700 border border-blue-100",
    COMPLETED:   "bg-green-50 text-green-700 border border-green-100",
    CANCELLED:   "bg-red-50 text-red-500 border border-red-100",
};

const FILTERS = ["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"];

export default function RadiologyOrdersPage() {
    const [orders, setOrders]     = useState<ImagingOrder[]>([]);
    const [loading, setLoading]   = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [search, setSearch]     = useState("");
    const [filter, setFilter]     = useState("ALL");

    const load = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(
                collection(db, "cpoeOrders"),
                where("orderType", "==", "RADIOLOGY"),
                orderBy("createdAt", "desc"),
            ));
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as ImagingOrder)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const advance = async (id: string, next: string) => {
        setUpdating(id);
        try {
            await updateDoc(doc(db, "cpoeOrders", id), { status: next });
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: next } : o));
        } catch (e) { console.error(e); }
        finally { setUpdating(null); }
    };

    const filtered = orders.filter(o => {
        const q = search.toLowerCase();
        const matchS = !q || o.patientName?.toLowerCase().includes(q) || o.detail?.toLowerCase().includes(q);
        const matchF = filter === "ALL" || o.status === filter;
        return matchS && matchF;
    });

    const counts = FILTERS.reduce<Record<string, number>>((acc, f) => {
        acc[f] = f === "ALL" ? orders.length : orders.filter(o => o.status === f).length;
        return acc;
    }, {});

    // ROUTINE orders wait for Finance to confirm payment; STAT/URGENT proceed
    // immediately for patient safety, billed/collected after the fact.
    const isGated = (o: ImagingOrder) => o.paymentStatus === "UNPAID" && o.priority === "ROUTINE";
    const gatedCount = orders.filter(o => o.status === "PENDING" && isGated(o)).length;

    const formatTime = (ts: any) => {
        if (!ts) return "—";
        try {
            const d = ts.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
            return d.toLocaleTimeString("en-UG", { hour: "2-digit", minute: "2-digit" });
        } catch { return "—"; }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-violet-600" /> Imaging Orders
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${orders.filter(o => o.status === "PENDING" || o.status === "IN_PROGRESS").length} active · ${orders.length} total`}
                    </p>
                </div>
                <button onClick={load} disabled={loading}
                    className="h-9 w-9 rounded-xl border border-gray-100 bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-violet-600 transition-colors disabled:opacity-50">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {gatedCount > 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="text-sm font-semibold text-amber-700">
                        {gatedCount} order{gatedCount !== 1 ? "s" : ""} awaiting payment confirmation before work can begin — STAT/URGENT orders are never held up.
                    </p>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-violet-500/20"
                            placeholder="Search patient or imaging type…" />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        {FILTERS.map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filter === f ? "bg-violet-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                                {f.replace(/_/g, " ")}
                                {counts[f] > 0 && (
                                    <span className={`ml-1 text-[9px] px-1 py-0.5 rounded-full font-black ${filter === f ? "bg-white/20" : "bg-gray-200 text-gray-500"}`}>
                                        {counts[f]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 gap-2 text-gray-400 text-sm">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading imaging orders…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 text-sm">
                        {search || filter !== "ALL" ? "No orders match your search." : "No radiology orders yet. Orders come from the doctor's CPOE module."}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filtered.map((o, i) => (
                            <motion.div key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="h-9 w-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                                            <Scan className="h-4.5 w-4.5 text-violet-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-gray-900">
                                                {o.patientName}
                                                {o.ward && <span className="text-gray-400 text-xs font-normal ml-1">({o.ward})</span>}
                                            </p>
                                            <p className="text-xs font-semibold text-violet-700 mt-0.5">{o.detail}</p>
                                            {o.notes && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-sm">{o.notes}</p>}
                                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                                {o.orderedBy && <span className="text-[10px] text-gray-400">{o.orderedBy}</span>}
                                                <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                                    <Clock className="h-3 w-3" />{formatTime(o.createdAt)}
                                                </span>
                                                {o.amount && o.amount > 0 && (
                                                    <span className="text-[10px] text-gray-400">UGX {o.amount.toLocaleString()}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[o.priority] || PRIORITY_BADGE.ROUTINE}`}>
                                            {o.priority}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE[o.status] || STATUS_BADGE.PAID}`}>
                                            {o.status.replace(/_/g, " ")}
                                        </span>
                                        {o.status === "PENDING" && isGated(o) ? (
                                            <span className="text-xs text-amber-600 font-bold flex items-center gap-1 whitespace-nowrap">
                                                <Clock className="h-3.5 w-3.5" /> Awaiting payment
                                            </span>
                                        ) : o.status === "PENDING" && (
                                            <button onClick={() => advance(o.id, "IN_PROGRESS")} disabled={updating === o.id}
                                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-50">
                                                {updating === o.id ? <Loader2 className="h-3 w-3 animate-spin inline" /> : "Accept"}
                                            </button>
                                        )}
                                        {o.status === "IN_PROGRESS" && (
                                            <Link href="/radiology/worklist"
                                                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors flex items-center gap-1">
                                                Report <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
