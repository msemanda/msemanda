"use client";

import { motion } from "framer-motion";
import { TrendingUp, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface MetricPair { before: number; after: number }

interface WellnessEnrollment {
    id: string;
    patient: string;
    program: string;
    weeks: number;
    hba1c: MetricPair | null;
    weight: MetricPair | null;
    bmi: MetricPair | null;
    trend: string;
}

const TREND_STYLE: Record<string, string> = {
    IMPROVING: "bg-green-50 text-green-700",
    STABLE:    "bg-amber-50 text-amber-700",
    DECLINING: "bg-red-50 text-red-600",
};

function Delta({ before, after, unit, lowerBetter = true }: { before: number; after: number; unit: string; lowerBetter?: boolean }) {
    const delta = after - before;
    const improved = lowerBetter ? delta < 0 : delta > 0;
    return (
        <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400">Before → After</p>
            <p className="text-xs font-bold text-gray-800">{before} → {after} {unit}</p>
            <p className={`text-[10px] font-bold ${improved ? "text-green-600" : "text-red-500"}`}>
                {delta > 0 ? "+" : ""}{delta.toFixed(1)}
            </p>
        </div>
    );
}

export default function WellnessProgress() {
    const [data, setData] = useState<WellnessEnrollment[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "wellnessEnrollments"));
            setData(snap.docs.map(d => {
                const r = d.data();
                const parsePair = (key: string): MetricPair | null => {
                    const before = r[`${key}Before`] ?? r[key]?.before;
                    const after  = r[`${key}After`]  ?? r[key]?.after;
                    if (before == null || after == null) return null;
                    return { before: Number(before), after: Number(after) };
                };
                return {
                    id:      d.id,
                    patient: (r.patientName ?? r.patient as string) ?? "—",
                    program: (r.program as string) ?? "—",
                    weeks:   Number(r.weeks ?? r.weeksCompleted ?? 0),
                    hba1c:   parsePair("hba1c"),
                    weight:  parsePair("weight"),
                    bmi:     parsePair("bmi"),
                    trend:   (r.trend as string) ?? "STABLE",
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
                        <TrendingUp className="h-6 w-6 text-violet-600" /> Health Progress
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Patient outcomes across wellness programs</p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-violet-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-violet-100 border-t-violet-500 rounded-full" />
                </div>
            ) : data.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No wellness enrollments found</p>
            ) : (
                <div className="space-y-4">
                    {data.map((d, i) => (
                        <motion.div
                            key={d.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.06 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-sm font-black text-gray-900">{d.patient}</p>
                                    <p className="text-xs text-gray-400">{d.program} · Week {d.weeks}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${TREND_STYLE[d.trend] ?? "bg-gray-50 text-gray-600"}`}>
                                    {d.trend}
                                </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {d.hba1c  && <Delta before={d.hba1c.before}  after={d.hba1c.after}  unit="% HbA1c" />}
                                {d.weight && <Delta before={d.weight.before} after={d.weight.after} unit="kg" />}
                                {d.bmi    && <Delta before={d.bmi.before}    after={d.bmi.after}    unit="BMI" />}
                                {!d.hba1c && !d.weight && !d.bmi && (
                                    <div className="bg-gray-50 rounded-xl p-3 col-span-3 text-center text-xs text-gray-400">
                                        Qualitative outcomes — see session notes
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
