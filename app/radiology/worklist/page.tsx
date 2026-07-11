"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Scan, Clock, RefreshCw } from "lucide-react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface WorklistItem {
    id: string;
    patient: string;
    modality: string;
    bodyPart: string;
    room: string;
    tech: string;
    startedAt: string | null;
    eta: string;
    status: string;
}

// Matches the status vocabulary radiologyOrders is actually written with
// (see app/radiology/dashboard/page.tsx's handleStart) — PENDING -> IN_PROGRESS -> COMPLETED.
const STATUS_STYLE: Record<string, string> = {
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-100",
    PENDING:     "bg-amber-50 text-amber-700 border-amber-100",
    COMPLETED:   "bg-green-50 text-green-700 border-green-100",
};
const MODALITY_COLOR: Record<string, string> = {
    "X-RAY":     "bg-blue-100 text-blue-700",
    CT:          "bg-purple-100 text-purple-700",
    MRI:         "bg-indigo-100 text-indigo-700",
    ULTRASOUND:  "bg-teal-100 text-teal-700",
};

export default function WorklistPage() {
    const [worklist, setWorklist] = useState<WorklistItem[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "radiologyOrders"));
            setWorklist(snap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    patient: ((r.patientName ?? r.patient) as string) ?? "—",
                    modality: (r.modality as string) ?? "X-RAY",
                    bodyPart: ((r.bodyPart ?? r.region) as string) ?? "—",
                    room: (r.room as string) ?? "—",
                    tech: ((r.tech ?? r.technician) as string) ?? "—",
                    startedAt: (r.startedAt as string | null) ?? null,
                    eta: (r.eta as string) ?? "—",
                    status: (r.status as string) ?? "PENDING",
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleAdvance = async (item: WorklistItem) => {
        const next = item.status === "PENDING" ? "IN_PROGRESS" : "COMPLETED";
        try {
            await updateDoc(doc(db, "radiologyOrders", item.id), { status: next, updatedAt: new Date().toISOString() });
            setWorklist(prev => prev.map(w => w.id === item.id ? { ...w, status: next } : w));
        } catch (e) { console.error(e); }
    };

    const scanningCount = worklist.filter(w => w.status === "IN_PROGRESS").length;
    const queuedCount = worklist.filter(w => w.status === "PENDING").length;

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Scan className="h-6 w-6 text-violet-600" /> Worklist
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${scanningCount} scanning · ${queuedCount} queued`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-violet-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-violet-100 border-t-violet-500 rounded-full" />
                </div>
            ) : worklist.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No radiology orders found</p>
            ) : (
                <div className="space-y-3">
                    {worklist.map((w, i) => (
                        <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${MODALITY_COLOR[w.modality] || "bg-gray-100 text-gray-600"}`}>
                                    {w.modality}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900">{w.patient}</p>
                                    <p className="text-xs text-gray-500">{w.bodyPart} · {w.room}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">Tech: {w.tech}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">ETA</p>
                                    <p className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                        <Clock className="h-3.5 w-3.5 text-gray-400" />{w.eta}
                                    </p>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[w.status] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>{w.status.replace("_", " ")}</span>
                                {w.status !== "COMPLETED" && (
                                    <button onClick={() => handleAdvance(w)} className="text-xs font-bold text-violet-600 hover:bg-violet-50 px-3 py-1.5 rounded-lg transition-colors">
                                        {w.status === "IN_PROGRESS" ? "Complete" : "Start"}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
