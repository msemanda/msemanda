"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { ClipboardList, Clock, CheckCircle2, Bell, Loader2, RefreshCw } from "lucide-react";

interface QueueEntry {
    id: string;
    ticket: string;
    patientName: string;
    doctorName: string;
    time: string;
    notes: string;
    status: string;
}

const STATUS_STYLE: Record<string, string> = {
    SCHEDULED:       "bg-amber-50 text-amber-700",
    CONFIRMED:       "bg-amber-50 text-amber-700",
    PENDING_PAYMENT: "bg-red-50 text-red-600",
    CALLED:          "bg-purple-50 text-purple-700",
    IN_CONSULTATION: "bg-blue-50 text-blue-700",
    COMPLETED:       "bg-green-50 text-green-700",
    CANCELLED:       "bg-red-50 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
    SCHEDULED:       "WAITING",
    CONFIRMED:       "WAITING",
    PENDING_PAYMENT: "AWAITING PAYMENT",
    CALLED:          "CALLED",
    IN_CONSULTATION: "IN CONSULTATION",
    COMPLETED:       "DONE",
    CANCELLED:       "CANCELLED",
};

export default function TodaysQueue() {
    const [queue, setQueue] = useState<QueueEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    const today = new Date().toISOString().split("T")[0];

    const load = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(
                query(collection(db, "appointments"), where("date", "==", today))
            );
            const rows = snap.docs
                .map(d => {
                    const data = d.data() as Record<string, string>;
                    return {
                        id: d.id,
                        patientName: data.patientName || "Unknown",
                        doctorName: data.doctorName || "—",
                        time: data.time || "—",
                        notes: data.notes || "",
                        status: data.status || "SCHEDULED",
                    };
                })
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((r, i) => ({ ...r, ticket: `A${String(i + 1).padStart(3, "0")}` }));
            setQueue(rows);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const updateStatus = async (id: string, status: string) => {
        setUpdating(id);
        try {
            await updateDoc(doc(db, "appointments", id), { status });
            setQueue(prev => prev.map(q => q.id === id ? { ...q, status } : q));
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(null);
        }
    };

    const waitMins = (time: string) => {
        try {
            const [h, m] = time.split(":").map(Number);
            const now = new Date();
            const apptMinutes = h * 60 + m;
            const nowMinutes = now.getHours() * 60 + now.getMinutes();
            return Math.max(0, nowMinutes - apptMinutes);
        } catch { return 0; }
    };

    const active = queue.filter(q => q.status !== "COMPLETED" && q.status !== "CANCELLED");
    const completed = queue.filter(q => q.status === "COMPLETED" || q.status === "CANCELLED");
    const nextWaiting = queue.find(q => q.status === "SCHEDULED" || q.status === "CONFIRMED");

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-indigo-600" /> Today's Queue
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {queue.filter(q => q.status === "SCHEDULED" || q.status === "CONFIRMED").length} waiting ·{" "}
                        {queue.filter(q => q.status === "IN_CONSULTATION").length} in consultation
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={load} disabled={loading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-white border border-gray-100 text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                    </button>
                    {nextWaiting && (
                        <div className="text-xl font-black text-indigo-600 bg-white border border-indigo-100 rounded-2xl px-4 py-2 shadow-sm">
                            Next: {nextWaiting.ticket}
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 gap-2 text-gray-400 text-sm">
                    <Loader2 className="h-5 w-5 animate-spin" /> Loading today's appointments…
                </div>
            ) : queue.length === 0 ? (
                <div className="text-center py-20 text-gray-400 text-sm bg-white rounded-2xl border border-gray-100">
                    No appointments booked for today yet.
                </div>
            ) : (
                <>
                    <div className="space-y-2">
                        {active.map((q, i) => (
                            <motion.div key={q.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-700 text-xs shrink-0">
                                        {q.ticket}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-gray-900 truncate">{q.patientName}</p>
                                        <p className="text-xs text-gray-400 truncate">
                                            {q.doctorName} · {q.time}{q.notes ? ` · ${q.notes}` : ""}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    {(q.status === "SCHEDULED" || q.status === "CONFIRMED") && (
                                        <p className="text-xs text-amber-600 font-bold flex items-center gap-1">
                                            <Clock className="h-3.5 w-3.5" />{waitMins(q.time)} min wait
                                        </p>
                                    )}
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_STYLE[q.status] ?? "bg-gray-50 text-gray-500"}`}>
                                        {STATUS_LABEL[q.status] ?? q.status}
                                    </span>
                                    {(q.status === "SCHEDULED" || q.status === "CONFIRMED") && (
                                        <button onClick={() => updateStatus(q.id, "CALLED")}
                                            disabled={updating === q.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors">
                                            {updating === q.id
                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                : <><Bell className="h-3.5 w-3.5" /> Call</>}
                                        </button>
                                    )}
                                    {q.status === "CALLED" && (
                                        <button onClick={() => updateStatus(q.id, "COMPLETED")}
                                            disabled={updating === q.id}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors">
                                            {updating === q.id
                                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                : <><CheckCircle2 className="h-3.5 w-3.5" /> Done</>}
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {completed.length > 0 && (
                        <div>
                            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Completed</p>
                            {completed.map(q => (
                                <div key={q.id} className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                        <span className="text-xs text-gray-500 font-semibold">
                                            {q.ticket} — {q.patientName} · {q.doctorName} · {q.time}
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-bold text-green-600">{STATUS_LABEL[q.status]}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
