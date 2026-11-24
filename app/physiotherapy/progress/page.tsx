"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { TrendingUp, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ProgressEntry {
    id: string;
    patient: string;
    condition: string;
    weeks: number;
    totalSessions: number;
    attended: number;
    baseline: string;
    current: string;
    progress: number;
    trend: string;
}

const TREND_STYLE: Record<string, string> = {
    IMPROVING: "text-green-700 bg-green-50",
    STABLE:    "text-amber-700 bg-amber-50",
    DECLINING: "text-red-700 bg-red-50",
};

export default function ProgressTracking() {
    const [data, setData] = useState<ProgressEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "physiotherapyPatients"));
            setData(snap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    patient: ((r.patientName ?? r.patient) as string) ?? "—",
                    condition: (r.condition as string) ?? "—",
                    weeks: Number(r.weeks ?? 0),
                    totalSessions: Number(r.totalSessions ?? 0),
                    attended: Number(r.attended ?? r.attendedSessions ?? 0),
                    baseline: (r.baseline as string) ?? "—",
                    current: ((r.current ?? r.currentStatus) as string) ?? "—",
                    progress: Number(r.progress ?? r.progressPercent ?? 0),
                    trend: (r.trend as string) ?? "STABLE",
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-orange-500" /> Progress Tracking
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Patient rehabilitation outcomes</p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-orange-500 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-orange-100 border-t-orange-500 rounded-full" />
                </div>
            ) : data.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No progress data found</p>
            ) : (
                <div className="space-y-4">
                    {data.map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-black text-gray-900">{p.patient}</p>
                                    <p className="text-xs text-gray-500">{p.condition} · Week {p.weeks} · {p.attended}/{p.totalSessions} sessions attended</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${TREND_STYLE[p.trend] ?? TREND_STYLE.STABLE}`}>{p.trend}</span>
                            </div>
                            <div className="mb-3">
                                <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                    <span>Overall Progress</span><span>{p.progress}%</span>
                                </div>
                                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} transition={{ delay: 0.3 + i * 0.05, duration: 0.7 }}
                                        className="h-full bg-orange-500 rounded-full" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-red-50/50 rounded-xl p-3">
                                    <p className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-1">Baseline</p>
                                    <p className="text-xs text-gray-700">{p.baseline}</p>
                                </div>
                                <div className="bg-green-50 rounded-xl p-3">
                                    <p className="text-[10px] font-black text-green-500 uppercase tracking-wider mb-1">Current</p>
                                    <p className="text-xs text-gray-700">{p.current}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
