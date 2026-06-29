"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { UtensilsCrossed, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface DietPlan {
    id: string;
    patient: string;
    condition: string;
    calories: number;
    restrictions: string[];
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    dietitian: string;
}

export default function DietPlans() {
    const [plans, setPlans] = useState<DietPlan[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "dietPlans"));
            setPlans(snap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    patient: ((r.patientName ?? r.patient) as string) ?? "—",
                    condition: (r.condition as string) ?? "—",
                    calories: Number(r.calories ?? r.dailyCalories ?? 0),
                    restrictions: Array.isArray(r.restrictions) ? (r.restrictions as string[]) : [],
                    breakfast: Array.isArray(r.breakfast) ? (r.breakfast as string[]) : [],
                    lunch: Array.isArray(r.lunch) ? (r.lunch as string[]) : [],
                    dinner: Array.isArray(r.dinner) ? (r.dinner as string[]) : [],
                    dietitian: ((r.dietitian ?? r.dietitianName) as string) ?? "—",
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
                        <UtensilsCrossed className="h-6 w-6 text-emerald-600" /> Diet Plans
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${plans.length} active diet plans`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-emerald-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-emerald-100 border-t-emerald-500 rounded-full" />
                </div>
            ) : plans.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No diet plans found</p>
            ) : (
                <div className="space-y-4">
                    {plans.map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="text-sm font-black text-gray-900">{p.patient}</p>
                                    <p className="text-xs text-gray-500">{p.condition} · {p.calories} kcal/day</p>
                                </div>
                                <div className="flex flex-wrap gap-1 justify-end">
                                    {p.restrictions.map(r => (
                                        <span key={r} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">{r}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: "Breakfast", items: p.breakfast },
                                    { label: "Lunch",     items: p.lunch },
                                    { label: "Dinner",    items: p.dinner },
                                ].map(meal => (
                                    <div key={meal.label} className="bg-emerald-50/50 rounded-xl p-3">
                                        <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-2">{meal.label}</p>
                                        <ul className="space-y-0.5">
                                            {meal.items.map(item => (
                                                <li key={item} className="text-xs text-gray-700">• {item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-400 mt-3">Prepared by {p.dietitian}</p>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
