"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Search, AlertCircle, RefreshCw, Plus, X } from "lucide-react";
import { collection, getDocs, doc, updateDoc, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { notify, resolvePatientUid } from "@/lib/notify";
import { toDate } from "@/lib/ts";
import type { LabResult } from "@/types";

interface LabOrder {
    id: string;
    patientName: string;
    patientEmail?: string;
    patientId?: string | null;
    detail: string;
    orderedBy?: string;
    orderedByUid?: string;
    createdAt?: any;
    priority: string;
    status: string;
    results?: LabResult[];
}

const FLAG_STYLE: Record<string, string> = {
    HIGH:     "text-red-600 font-bold",
    LOW:      "text-amber-600 font-bold",
    CRITICAL: "text-red-700 font-black",
    NORMAL:   "text-green-600",
    "":       "text-gray-400",
};
const PRIORITY_BADGE: Record<string, string> = {
    STAT: "badge-red", URGENT: "badge-yellow", ROUTINE: "badge-blue",
};

export default function ResultsEntryPage() {
    const { profile } = useAuth();
    const [pending, setPending] = useState<LabOrder[]>([]);
    const [completed, setCompleted] = useState<LabOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [rows, setRows] = useState<Record<string, LabResult[]>>({});
    const [search, setSearch] = useState("");
    const [submitting, setSubmitting] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, "cpoeOrders"), where("orderType", "==", "LAB")));
            const all = snap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    patientName: (r.patientName as string) ?? "—",
                    patientEmail: r.patientEmail as string | undefined,
                    patientId: r.patientId ?? null,
                    detail: (r.detail as string) ?? "—",
                    orderedBy: r.orderedBy as string | undefined,
                    orderedByUid: r.orderedByUid as string | undefined,
                    createdAt: r.createdAt,
                    priority: (r.priority as string) ?? "ROUTINE",
                    status: (r.status as string) ?? "PENDING",
                    results: Array.isArray(r.results) ? (r.results as LabResult[]) : undefined,
                } as LabOrder;
            });
            const pendingOrders = all.filter(o => o.status === "IN_PROGRESS");
            setPending(pendingOrders);
            setCompleted(all.filter(o => o.status === "COMPLETED"));

            // Seed one editable row per pending order, named after the order's
            // detail — the tech can add more rows for panel tests (e.g. a
            // Comprehensive Metabolic Panel has several components).
            setRows(prev => {
                const next = { ...prev };
                for (const o of pendingOrders) {
                    if (!next[o.id]) {
                        next[o.id] = [{ testName: o.detail, value: "", unit: "", referenceRange: "", flag: "" }];
                    }
                }
                return next;
            });
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const formatTime = (ts: any) => {
        const d = toDate(ts);
        return d ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";
    };

    const filteredPending = pending.filter(o => o.patientName.toLowerCase().includes(search.toLowerCase()));
    const filteredCompleted = completed.filter(o => o.patientName.toLowerCase().includes(search.toLowerCase()));

    const updateRow = (orderId: string, idx: number, patch: Partial<LabResult>) => {
        setRows(prev => ({
            ...prev,
            [orderId]: prev[orderId].map((r, i) => i === idx ? { ...r, ...patch } : r),
        }));
    };

    const addRow = (orderId: string) => {
        setRows(prev => ({
            ...prev,
            [orderId]: [...prev[orderId], { testName: "", value: "", unit: "", referenceRange: "", flag: "" }],
        }));
    };

    const removeRow = (orderId: string, idx: number) => {
        setRows(prev => ({
            ...prev,
            [orderId]: prev[orderId].filter((_, i) => i !== idx),
        }));
    };

    const handleSubmitResults = async (order: LabOrder) => {
        setSubmitting(order.id);
        try {
            const results = rows[order.id] ?? [];
            await updateDoc(doc(db, "cpoeOrders", order.id), {
                results,
                status: "COMPLETED",
                resultsEnteredBy: profile?.name,
                resultsEnteredAt: serverTimestamp(),
            });

            if (order.orderedByUid) {
                await notify({
                    targetUid: order.orderedByUid,
                    type: "lab_result",
                    title: `Lab result ready — ${order.patientName}`,
                    body: `${order.detail} completed`,
                    link: "/doctor/emr",
                });
            }
            const patientUid = await resolvePatientUid(order.patientId, order.patientEmail);
            if (patientUid) {
                await notify({
                    targetUid: patientUid,
                    type: "lab_result",
                    title: "Your lab result is ready",
                    body: `${order.detail} — view it in your records.`,
                    link: "/patient/records",
                });
            }

            await load();
        } catch (e) { console.error(e); }
        finally { setSubmitting(null); }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <CheckSquare className="h-6 w-6 text-amber-600" /> Results Entry
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${pending.length} orders awaiting results`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-amber-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Search patient..." />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-amber-100 border-t-amber-500 rounded-full" />
                </div>
            ) : (
                <div className="space-y-4">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Awaiting Results</p>
                    {filteredPending.length === 0 ? (
                        <p className="text-center text-gray-400 py-6 text-xs">
                            No pending orders. Orders appear here once started from Lab Test Orders.
                        </p>
                    ) : (
                        filteredPending.map((o, i) => {
                            const orderRows = rows[o.id] ?? [];
                            const canSubmit = orderRows.length > 0 && orderRows.every(r => r.testName.trim() && r.value.trim());
                            return (
                                <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{o.patientName}</p>
                                            <p className="text-xs text-gray-400">{o.orderedBy ? `Dr. ${o.orderedBy}` : "—"} · {formatTime(o.createdAt)}</p>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${PRIORITY_BADGE[o.priority] ?? "badge-blue"}`}>{o.priority}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {orderRows.map((t, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <input
                                                    placeholder="Test name"
                                                    value={t.testName}
                                                    onChange={e => updateRow(o.id, idx, { testName: e.target.value })}
                                                    className="w-40 shrink-0 px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                                <input
                                                    placeholder="Value"
                                                    value={t.value}
                                                    onChange={e => updateRow(o.id, idx, { value: e.target.value })}
                                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                                <input
                                                    placeholder="Unit"
                                                    value={t.unit}
                                                    onChange={e => updateRow(o.id, idx, { unit: e.target.value })}
                                                    className="w-16 shrink-0 px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                                <input
                                                    placeholder="Ref range"
                                                    value={t.referenceRange}
                                                    onChange={e => updateRow(o.id, idx, { referenceRange: e.target.value })}
                                                    className="w-24 shrink-0 px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                                <select value={t.flag} onChange={e => updateRow(o.id, idx, { flag: e.target.value as LabResult["flag"] })}
                                                    className="w-24 shrink-0 px-2 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20 bg-white">
                                                    <option value="">Normal</option>
                                                    <option value="HIGH">High</option>
                                                    <option value="LOW">Low</option>
                                                    <option value="CRITICAL">Critical</option>
                                                </select>
                                                {orderRows.length > 1 && (
                                                    <button onClick={() => removeRow(o.id, idx)}
                                                        className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <button onClick={() => addRow(o.id)}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                            <Plus className="h-3.5 w-3.5" /> Add test row
                                        </button>
                                        <button
                                            onClick={() => handleSubmitResults(o)}
                                            disabled={submitting === o.id || !canSubmit}
                                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors">
                                            {submitting === o.id ? "Saving…" : "Submit Results"}
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })
                    )}

                    {filteredCompleted.length > 0 && (
                        <>
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-6">Completed Results</p>
                            {filteredCompleted.map((o, i) => (
                                <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{o.patientName}</p>
                                            <p className="text-xs text-gray-400">{o.orderedBy ? `Dr. ${o.orderedBy}` : "—"}</p>
                                        </div>
                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700">COMPLETED</span>
                                    </div>
                                    <div className="space-y-2">
                                        {(o.results ?? []).map((t, idx) => (
                                            <div key={idx} className="flex items-center gap-3 text-xs">
                                                <p className="font-semibold text-gray-700 w-36 shrink-0 truncate">{t.testName}</p>
                                                <p className={`font-bold ${FLAG_STYLE[t.flag ?? ""] ?? FLAG_STYLE[""]}`}>{t.value} {t.unit}</p>
                                                {t.flag && t.flag !== "NORMAL" && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                                                {t.referenceRange && <span className="text-gray-400 ml-auto">Ref: {t.referenceRange}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            ))}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
