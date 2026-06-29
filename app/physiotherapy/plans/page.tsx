"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ClipboardList, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface TreatmentPlan {
    id: string;
    patient: string;
    condition: string;
    goal: string;
    weeks: number;
    sessionsPerWeek: number;
    phase: string;
    exercises: string[];
    status: string;
}

export default function TreatmentPlans() {
    const [plans, setPlans] = useState<TreatmentPlan[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "physiotherapyPlans"));
            setPlans(snap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    patient: ((r.patientName ?? r.patient) as string) ?? "—",
                    condition: (r.condition as string) ?? "—",
                    goal: (r.goal as string) ?? "—",
                    weeks: Number(r.weeks ?? 0),
                    sessionsPerWeek: Number(r.sessionsPerWeek ?? 0),
                    phase: (r.phase as string) ?? "—",
                    exercises: Array.isArray(r.exercises) ? (r.exercises as string[]) : [],
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

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-orange-500" /> Treatment Plans
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${plans.length} active treatment plans`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-orange-500 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-orange-100 border-t-orange-500 rounded-full" />
                </div>
            ) : plans.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No treatment plans found</p>
            ) : (
                <div className="space-y-4">
                    {plans.map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-sm font-black text-gray-900">{p.patient}</p>
                                    <p className="text-xs text-gray-500">{p.condition}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700">{p.phase}</span>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700">{p.status}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3 mb-3">
                                <div className="bg-gray-50 rounded-xl p-3 text-center">
                                    <p className="text-lg font-black text-gray-900">{p.weeks}</p>
                                    <p className="text-[10px] text-gray-400">Week program</p>
                                </div>
                                <div className="bg-gray-50 rounded-xl p-3 text-center">
                                    <p className="text-lg font-black text-gray-900">{p.sessionsPerWeek}x</p>
                                    <p className="text-[10px] text-gray-400">Per week</p>
                                </div>
                                <div className="bg-orange-50 rounded-xl p-3 text-center">
                                    <p className="text-xs font-bold text-orange-700 leading-tight">{p.goal}</p>
                                </div>
                            </div>
                            {p.exercises.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {p.exercises.map(e => (
                                        <span key={e} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-100">{e}</span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
