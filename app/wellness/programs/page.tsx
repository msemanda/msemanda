"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Sparkles, Users, Calendar, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface WellnessProgram {
    id: string;
    name: string;
    category: string;
    enrolled: number;
    capacity: number;
    startDate: string;
    endDate: string;
    facilitator: string;
    description: string;
    status: string;
}

const CAT_COLOR: Record<string, string> = {
    CHRONIC_DISEASE: "bg-red-50 text-red-700",
    FITNESS:         "bg-blue-50 text-blue-700",
    MENTAL_HEALTH:   "bg-purple-50 text-purple-700",
    NUTRITION:       "bg-emerald-50 text-emerald-700",
    PREVENTIVE:      "bg-amber-50 text-amber-700",
};

export default function WellnessPrograms() {
    const [programs, setPrograms] = useState<WellnessProgram[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "wellnessPrograms"));
            setPrograms(snap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    name: ((r.name ?? r.programName) as string) ?? "—",
                    category: (r.category as string) ?? "OTHER",
                    enrolled: Number(r.enrolled ?? r.enrolledCount ?? 0),
                    capacity: Number(r.capacity ?? 0),
                    startDate: (r.startDate as string) ?? "—",
                    endDate: (r.endDate as string) ?? "—",
                    facilitator: (r.facilitator as string) ?? "—",
                    description: (r.description as string) ?? "—",
                    status: (r.status as string) ?? "ACTIVE",
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const activeCount = programs.filter(p => p.status === "ACTIVE").length;

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-violet-600" /> Wellness Programs
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${activeCount} active programs`}
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
            ) : programs.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No wellness programs found</p>
            ) : (
                <div className="space-y-4">
                    {programs.map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-sm font-black text-gray-900">{p.name}</p>
                                    <p className="text-xs text-gray-400">{p.facilitator}</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_COLOR[p.category] ?? "bg-gray-50 text-gray-600"}`}>{p.category.replace(/_/g, " ")}</span>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${p.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>{p.status}</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">{p.description}</p>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Users className="h-3.5 w-3.5" />{p.enrolled}/{p.capacity} enrolled
                                </div>
                                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-violet-500 rounded-full" style={{ width: `${p.capacity > 0 ? Math.round((p.enrolled / p.capacity) * 100) : 0}%` }} />
                                </div>
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Calendar className="h-3.5 w-3.5" />{p.startDate} – {p.endDate}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
