"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Apple, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface MenuItem {
    id: string;
    meal: string;
    item: string;
    calories: number;
    protein: string;
    tags: string[];
}

const MEAL_ORDER = ["breakfast", "lunch", "dinner", "snacks"];

export default function FoodMenu() {
    const [items, setItems] = useState<MenuItem[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "dietaryMenuItems"));
            setItems(snap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    meal: ((r.meal ?? r.mealType) as string) ?? "other",
                    item: ((r.item ?? r.name) as string) ?? "—",
                    calories: Number(r.calories ?? 0),
                    protein: (r.protein as string) ?? "—",
                    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const grouped = MEAL_ORDER.reduce<Record<string, MenuItem[]>>((acc, meal) => {
        acc[meal] = items.filter(i => i.meal.toLowerCase() === meal);
        return acc;
    }, {});
    const hasData = Object.values(grouped).some(g => g.length > 0);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Apple className="h-6 w-6 text-emerald-600" /> Hospital Food Menu
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Standard ward diet options — nutritional values per serving</p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-emerald-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-emerald-100 border-t-emerald-500 rounded-full" />
                </div>
            ) : !hasData ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No menu items found</p>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {MEAL_ORDER.filter(meal => grouped[meal].length > 0).map((meal, gi) => (
                        <motion.div key={meal} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.08 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h2 className="text-sm font-black text-gray-900 capitalize mb-4">{meal}</h2>
                            <div className="space-y-2">
                                {grouped[meal].map(item => (
                                    <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-800">{item.item}</p>
                                            <div className="flex gap-1.5 mt-0.5">
                                                {item.tags.map(t => (
                                                    <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">{t}</span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 ml-3">
                                            <p className="text-xs font-bold text-gray-700">{item.calories} kcal</p>
                                            <p className="text-[10px] text-gray-400">{item.protein} protein</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
