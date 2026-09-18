"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { UserCheck, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface HandoverItem {
    id: string;
    bed: string;
    patient: string;
    priority: string;
    outgoingNotes: string;
    pendingOrders: string[];
}

const PRIORITY_STYLE: Record<string, string> = {
    STABLE:   "bg-green-50 text-green-700 border-green-100",
    MONITOR:  "bg-amber-50 text-amber-700 border-amber-100",
    CRITICAL: "bg-red-50 text-red-700 border-red-100",
};

export default function HandoverPage() {
    const [items, setItems] = useState<HandoverItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [acknowledged, setAcknowledged] = useState<string[]>([]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "nurseHandovers"));
            setItems(snap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    bed: ((r.bed ?? r.bedNumber) as string) ?? "—",
                    patient: ((r.patientName ?? r.patient) as string) ?? "—",
                    priority: (r.priority as string) ?? "STABLE",
                    outgoingNotes: (r.outgoingNotes as string) ?? "—",
                    pendingOrders: Array.isArray(r.pendingOrders) ? (r.pendingOrders as string[]) : [],
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const toggle = (id: string) =>
        setAcknowledged(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <UserCheck className="h-6 w-6 text-green-600" /> Shift Handover
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${acknowledged.length}/${items.length} patients acknowledged`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-xs font-bold text-gray-400 bg-white border border-gray-100 rounded-xl px-3 py-2">
                        Morning → Evening handover
                    </div>
                    <button onClick={load} className="text-gray-400 hover:text-green-600 transition-colors">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-green-100 border-t-green-500 rounded-full" />
                </div>
            ) : items.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No handover items found</p>
            ) : (
                <div className="space-y-3">
                    {items.map((item, i) => {
                        const isAck = acknowledged.includes(item.id);
                        return (
                            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${isAck ? "border-green-100 bg-green-50/30" : "border-gray-100"}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-9 w-9 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-black text-sm">{item.bed}</div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{item.patient}</p>
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_STYLE[item.priority] ?? PRIORITY_STYLE.STABLE}`}>{item.priority}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => toggle(item.id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${isAck ? "bg-green-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                        {isAck ? "Acknowledged" : "Acknowledge"}
                                    </button>
                                </div>
                                <p className="text-xs text-gray-700 mb-2">{item.outgoingNotes}</p>
                                {item.pendingOrders.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5">
                                        {item.pendingOrders.map(o => (
                                            <span key={o} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                                                <AlertTriangle className="h-2.5 w-2.5" /> {o}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
