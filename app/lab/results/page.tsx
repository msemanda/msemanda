"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Search, AlertCircle, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";

interface TestItem {
    name: string;
    value: string;
    unit: string;
    ref: string;
    flag: string;
}

interface LabOrder {
    id: string;
    patient: string;
    doctor: string;
    orderedAt: string;
    priority: string;
    status: string;
    tests: TestItem[];
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
    const [pending, setPending] = useState<LabOrder[]>([]);
    const [completed, setCompleted] = useState<LabOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [values, setValues] = useState<Record<string, string>>({});
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "labOrders"));
            const all = snap.docs.map(d => {
                const r = d.data();
                const at = toDate(r.orderedAt ?? r.createdAt);
                const tests: TestItem[] = Array.isArray(r.tests)
                    ? (r.tests as TestItem[])
                    : [];
                return {
                    id: d.id,
                    patient: ((r.patientName ?? r.patient) as string) ?? "—",
                    doctor: ((r.doctor ?? r.doctorName) as string) ?? "—",
                    orderedAt: at
                        ? at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                        : ((r.orderedAt as string) ?? "—"),
                    priority: (r.priority as string) ?? "ROUTINE",
                    status: (r.status as string) ?? "PENDING",
                    tests,
                };
            });
            setPending(all.filter(o => o.status !== "COMPLETED" && o.status !== "REPORTED"));
            setCompleted(all.filter(o => o.status === "COMPLETED" || o.status === "REPORTED"));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filteredPending = pending.filter(o => o.patient.toLowerCase().includes(search.toLowerCase()));
    const filteredCompleted = completed.filter(o => o.patient.toLowerCase().includes(search.toLowerCase()));

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
                        <p className="text-center text-gray-400 py-6 text-xs">No pending orders</p>
                    ) : (
                        filteredPending.map((o, i) => (
                            <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm font-black text-gray-900">{o.patient}</p>
                                        <p className="text-xs text-gray-400">{o.doctor} · {o.orderedAt}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${PRIORITY_BADGE[o.priority] ?? "badge-blue"}`}>{o.priority}</span>
                                </div>
                                {o.tests.length > 0 && (
                                    <div className="space-y-3">
                                        {o.tests.map(t => (
                                            <div key={t.name} className="flex items-center gap-3">
                                                <p className="text-xs font-semibold text-gray-700 w-36 shrink-0">{t.name}</p>
                                                <input
                                                    placeholder="Enter value"
                                                    value={values[`${o.id}-${t.name}`] || ""}
                                                    onChange={e => setValues(prev => ({ ...prev, [`${o.id}-${t.name}`]: e.target.value }))}
                                                    className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                                                />
                                                <span className="text-[10px] text-gray-400 w-12 shrink-0">{t.unit}</span>
                                                <span className="text-[10px] text-gray-400 shrink-0">Ref: {t.ref}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="flex justify-end mt-4">
                                    <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors">
                                        Submit Results
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}

                    {filteredCompleted.length > 0 && (
                        <>
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-6">Completed Results</p>
                            {filteredCompleted.map((o, i) => (
                                <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{o.patient}</p>
                                            <p className="text-xs text-gray-400">{o.doctor}</p>
                                        </div>
                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700">COMPLETED</span>
                                    </div>
                                    <div className="space-y-2">
                                        {o.tests.map(t => (
                                            <div key={t.name} className="flex items-center gap-3 text-xs">
                                                <p className="font-semibold text-gray-700 w-36 shrink-0">{t.name}</p>
                                                <p className={`font-bold ${FLAG_STYLE[t.flag] ?? FLAG_STYLE[""]}`}>{t.value} {t.unit}</p>
                                                {t.flag && t.flag !== "NORMAL" && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                                                <span className="text-gray-400 ml-auto">Ref: {t.ref}</span>
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
