"use client";

import { motion } from "framer-motion";
import { CalendarDays, MapPin, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";
import { HomeCareVisit } from "@/types";

type VisitRow = HomeCareVisit & { address?: string; scheduledTime?: string; nurseName?: string };

const STATUS_STYLE: Record<string, string> = {
    COMPLETED:   "bg-green-50 text-green-700",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    SCHEDULED:   "bg-gray-50 text-gray-600",
    CANCELLED:   "bg-red-50 text-red-500",
    MISSED:      "bg-red-50 text-red-500",
};

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

function visitTimeStr(v: VisitRow): string {
    if (v.scheduledTime) return v.scheduledTime;
    const d = toDate(v.visitDate);
    return d ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";
}

export default function VisitSchedule() {
    const [visits, setVisits] = useState<VisitRow[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "homeCareVisits"));
            const today = todayKey();
            const rows = snap.docs
                .map(d => ({ id: d.id, ...d.data() } as VisitRow))
                .filter(v => {
                    const d = toDate(v.visitDate);
                    return d ? d.toISOString().slice(0, 10) === today : false;
                })
                .sort((a, b) =>
                    (toDate(a.visitDate)?.getTime() ?? 0) - (toDate(b.visitDate)?.getTime() ?? 0)
                );
            setVisits(rows);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <CalendarDays className="h-6 w-6 text-teal-600" /> Visit Schedule
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${visits.length} visits today`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-teal-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-teal-100 border-t-teal-500 rounded-full" />
                </div>
            ) : visits.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No visits scheduled today</p>
            ) : (
                <div className="space-y-3">
                    {visits.map((v, i) => (
                        <motion.div
                            key={v.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="text-center min-w-[48px]">
                                        <p className="text-lg font-black text-teal-600">{visitTimeStr(v)}</p>
                                        {v.duration && <p className="text-[10px] text-gray-400">{v.duration} min</p>}
                                    </div>
                                    <div className="w-px h-10 bg-gray-100" />
                                    <div>
                                        <p className="text-sm font-black text-gray-900">{v.patientName ?? "—"}</p>
                                        {v.address && (
                                            <p className="text-xs text-gray-400 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />{v.address}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[v.status] ?? "bg-gray-50 text-gray-600"}`}>
                                    {v.status.replace("_", " ")}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {(v.services ?? []).map(s => (
                                    <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100">{s}</span>
                                ))}
                            </div>
                            {v.notes && (
                                <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-2.5">{v.notes}</p>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
